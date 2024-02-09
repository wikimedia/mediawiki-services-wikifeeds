'use strict';

const axios = require('axios').default;
const axiosRetry = require('axios-retry').default;
const BBPromise = require('bluebird');
const sUtil = require('./util');
const Template = require('swagger-router').Template;
const HTTPError = sUtil.HTTPError;
const uuid = require('cassandra-uuid').TimeUuid;

const isRedirect = (status) => status < 400 && status >= 300;

/**
 * Make outgoing HTTP request using axios
 *
 * @param {Object} outReq Outgoing request
 * @param {Object} parentReq Incoming request
 * @return {Promise} outgoing request config
 */
function makeOutgoingRequest(outReq, parentReq) {
    const httpConf = parentReq.app.conf.http_client || {};

    // Log each outgoing request on incoming request logger
    const loggerInterceptor = (config) => {
        parentReq.logger.log('trace/req', { msg: 'Outgoing request', out_request: outReq });
        return config;
    };

    // Handle service mesh redirects
    const serviceMeshInterceptor = ((response) => {
        if (isRedirect(response.status)) {
            const location = response.headers.location;
            try {
                // Redirect location is absolute
                const nextURL = new URL(response.headers.location);
                response.config.url.pathname = nextURL.pathname;
                response.config.headers.host = nextURL.hostname;
            } catch (err) {
                // Redirect location is relative
                response.config.url = new URL(location, response.config.url);
            }
            return axios.request(response.config);
        }
        return response;
    });

    Object.assign(outReq.headers, {
        'user-agent': parentReq.app.conf.user_agent,
        'x-request-id': parentReq.headers['x-request-id']
    });

    const reqConfig = {
        url: new URL(outReq.uri),
        method: outReq.method,
        headers: outReq.headers,
        timeout: httpConf.timeout || 2 * 60 * 1000,
        validateStatus: httpConf.status_validator || ((status) => status < 400)
    };

    // Ensure requests are retried in case of failure
    axiosRetry(axios, { retries: httpConf.retries || 3 });

    axios.interceptors.request.use(loggerInterceptor);
    if (httpConf.use_service_mesh) {
        // Manually handle redirects for service mesh
        reqConfig.maxRedirects = 0;
        axios.interceptors.response.use(serviceMeshInterceptor);
    }

    return axios.request(reqConfig);
}

/**
 * Calls the MW REST API with the supplied query as its body
 *
 * @param {!Object} req the incoming request object
 * @param {?Object} addlHeaders additional headers to pass to the MW API
 * @return {!Promise} a promise resolving as the response object from the MW API
 */
function mwCorePageHTMLGet(req, addlHeaders) {
    const rev = req.params.revision;
    const title = encodeURIComponent(req.params.title);
    const corePageReq = req.app.mwrestapi_tpl.expand({
        request: {
            headers: addlHeaders,
            params: {
                path: rev ? `revision/${rev}/with_html` : `page/${title}/with_html`,
                domain: req.params.domain
            }
        }
    });

    return makeOutgoingRequest(corePageReq, req).then(function (response) {
        // Compat: rewrite etag header and body to be the same format as the
        // responses from parsoid on restbase
        const html = response.data.html;
        const revision = response.data.id;
        const timestamp = response.data.timestamp;
        const tid = uuid.fromDate(new Date(timestamp)).toString();
        const etag = `${revision}/${tid}`;
        response.body = html;
        response.headers.etag = etag;
        return response;
    });
}

/**
 * Calls the MW API with the supplied query as its body
 *
 * @param {!Object} req the incoming request object
 * @param {?Object} query an object with all the query parameters for the MW API
 * @param {?string} altDomain domain to query, if other than the original request domain
 * @param {?Object} addlHeaders additional headers to pass to the MW API
 * @return {!Promise} a promise resolving as the response object from the MW API
 */
function mwApiGet(req, query, altDomain, addlHeaders) {

    const app = req.app;
    query = Object.assign({
        format: 'json',
        formatversion: 2
    }, query);

    const request = app.mwapi_tpl.expand({
        request: {
            params: { domain: altDomain || req.params.domain },
            headers: req.headers,
            query
        }
    });
    Object.assign(request.headers, addlHeaders);

    return req.issueRequest(request).then((response) => {
        if (response.status < 200 || response.status > 399) {
            // there was an error when calling the upstream service, propagate that
            return BBPromise.reject(new HTTPError({
                status: response.status,
                type: 'api_error',
                title: 'MW API error',
                detail: response.body
            }));
        }
        return response;
    });

}

/**
 * For use by `restApiGet` and `restGatewayGet`.
 *
 * @ignore
 *
 * @throws {Error} If the domain is unspecified and cannot be retreived from
 *  the incoming request
 * @throws {Error} If the path is unspecified
 */
function prepareReqParams(req, path, reqParams) {

    if (path.constructor === Object) {
        reqParams = path;
        path = undefined;
    }
    reqParams = reqParams || {};
    reqParams.method = reqParams.method || 'get';
    reqParams.query = reqParams.query || {};
    reqParams.headers = reqParams.headers || {};
    reqParams.params = reqParams.params || {};
    reqParams.params.path = path || reqParams.params.path;
    reqParams.params.domain = reqParams.params.domain || req.params.domain;

    if (!reqParams.params.path) {
        throw new Error('The path must be specified.');
    }

    if (!reqParams.params.domain) {
        throw new Error('The domain must be specified or retrievable from the incoming request.');
    }

    reqParams.params.path = reqParams.params.path[0] === '/' ?
        reqParams.params.path.slice(1) : reqParams.params.path;

    return reqParams;
}

/**
 * Calls the REST API with the supplied parameters.
 *
 * @param {!Object} req the incoming request object
 * @param {?string} path the API path to contact without the leading slash
 * @param {?Object} [reqParams={}] the object containing request details
 * @param {!string} [reqParams.path] the path
 * @param {?string} [reqParams.domain] the domain, defaulting to `req.params.domain`
 * @param {?string} [reqParams.method=get] the request method
 * @param {?Object} [reqParams.query={}] the query string to send, if any
 * @param {?Object} [reqParams.headers={}] the request headers to send
 * @param {?Object} [reqParams.body=null] the body of the request, if any
 * @return {!Promise} a promise resolving as the response object from the API
 *  or rejecting if the domain or path were unspecified or couldn't be
 *  retrieved from the incoming request
 */
function restApiGet(req, path, reqParams) {

    try {
        return req.issueRequest(req.app.restbase_tpl.expand({
            request: prepareReqParams(req, path, reqParams)
        }));
    } catch (e) {
        return BBPromise.reject(new HTTPError({
            status: 500,
            type: 'internal_error',
            title: 'Invalid internal call',
            detail: 'domain and path need to be defined for the REST API call'
        }));
    }

}

/**
 * Calls the REST Gateway-proxied API with the supplied parameters.
 *
 * @param {!Object} req the incoming request object
 * @param {?string} path the API path to contact without the leading slash
 * @param {?Object} [reqParams={}] the object containing request details
 * @param {!string} [reqParams.path] the path
 * @param {?string} [reqParams.domain] the domain, defaulting to `req.params.domain`
 * @param {?string} [reqParams.method=get] the request method
 * @param {?Object} [reqParams.query={}] the query string to send, if any
 * @param {?Object} [reqParams.headers={}] the request headers to send
 * @param {?Object} [reqParams.body=null] the body of the request, if any
 * @return {!Promise} a promise resolving as the response object from the API
 *  or rejecting if the domain or path were unspecified or couldn't be
 *  retrieved from the incoming request
 */
function restGatewayGet(req, path, reqParams) {

    try {
        return req.issueRequest(req.app.rest_gateway_req.expand({
            request: prepareReqParams(req, path, reqParams)
        }));
    } catch (e) {
        return BBPromise.reject(new HTTPError({
            status: 500,
            type: 'internal_error',
            title: 'Invalid internal call',
            detail: 'domain and path need to be defined for the REST Gateway API call'
        }));
    }

}

function mwGet(req, title, addlHeaders) {
    const app = req.app;
    const request = app.mw_tpl.expand({
        request: {
            headers: Object.assign(req.headers, addlHeaders),
            params: {
                domain: req.params.domain,
                title
            }
        }
    });
    return req.issueRequest(request);
}

/**
 * Returns a promise to the summary object for the given title.
 *
 * @param {!Object} req
 * @param {!string} title
 * @return {Promise<Object>}
 */
function restGetSummary(req, title) {
    let lang = req.headers['accept-language'];
    if (lang) {
        // HACK: T346657
        // Use zh locale for all zhwiki requests
        lang = lang.replace(/zh(-.*)/, 'zh');
    }

    return restApiGet(
        req,
        `page/summary/${encodeURIComponent(title)}`,
        {
            headers: {
                'accept-language': lang
            }
        }
    )
    .then((res) => {
        // Support legacy pre summary 2.0 clients.
        res.body.normalizedtitle = res.body.title;
        res.body.title = res.body.title.replace(/ /g, '_');
        return res.body;
    });
}

/**
 * Sets up the request templates for MW and RESTBase API requests
 *
 * @param {!Application} app the application object
 */
function setupApiTemplates(app) {

    // set up the MW API request template
    if (!app.conf.mwapi_req) {
        app.conf.mwapi_req = {
            method: 'get',
            uri: 'http://{{domain}}/w/api.php',
            headers: '{{request.headers}}',
            query: '{{ default(request.query, {}) }}'
        };
    }
    app.mwapi_tpl = new Template(app.conf.mwapi_req);

    // set up MW REST API request template
    if (!app.conf.mwrestapi_req) {
        app.conf.mwrestapi_req = {
            method: 'get',
            uri: 'http://{{domain}}/w/rest.php/v1/{+path}',
            headers: '{{request.headers}}'
        };
    }
    app.mwrestapi_tpl = new Template(app.conf.mwrestapi_req);

    // set up the RESTBase request template
    if (!app.conf.restbase_req) {
        app.conf.restbase_req = {
            method: '{{request.method}}',
            uri: 'http://{{domain}}/api/rest_v1/{+path}',
            query: '{{ default(request.query, {}) }}',
            headers: '{{request.headers}}',
            body: '{{request.body}}'
        };
    }
    app.restbase_tpl = new Template(app.conf.restbase_req);

    // Set up the REST Gateway request template
    //
    // For the definitive list of services proxied by the REST Gateway, see
    // https://gerrit.wikimedia.org/g/operations/deployment-charts/+/c4c17fdb4869333de00e269454580119442d6082/helmfile.d/services/rest-gateway/values.yaml#57
    if (!app.conf.rest_gateway_req) {
        app.conf.rest_gateway_req = {
            method: '{{request.method}}',
            uri: 'http://{{domain}}/v1/{+path}',
            query: '{{ default(request.query, {}) }}',
            headers: '{{request.headers}}',
            body: '{{request.body}}'
        };
    }
    app.rest_gateway_req = new Template(app.conf.rest_gateway_req);

    // set up the MediaWiki page request template
    if (!app.conf.mw_req) {
        app.conf.mw_req = {
            method: '{{request.method}}',
            uri: 'http://{{domain}}/w/index.php?title={+title}',
            query: '{{ default(request.query, {}) }}',
            headers: '{{request.headers}}'
        };
    }
    app.mw_tpl = new Template(app.conf.mw_req);
}

module.exports = {
    mwGet,
    mwApiGet,
    restApiGet,
    restGetSummary,
    setupApiTemplates,
    mwCorePageHTMLGet,
    restGatewayGet
};

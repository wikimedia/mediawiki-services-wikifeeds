'use strict';

const BBPromise = require('bluebird');
const sUtil = require('./util');
const Template = require('swagger-router').Template;
const HTTPError = sUtil.HTTPError;

/**
 * Calls the MW API with the supplied query as its body
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
 * Calls the REST API with the supplied domain, path and request parameters
 * @param {!Object} req the incoming request object
 * @param {?string} path the REST API path to contact without the leading slash
 * @param {?Object} [restReq={}] the object containing the REST request details
 * @param {?string} [restReq.method=get] the request method
 * @param {?Object} [restReq.query={}] the query string to send, if any
 * @param {?Object} [restReq.headers={}] the request headers to send
 * @param {?Object} [restReq.body=null] the body of the request, if any
 * @return {!Promise} a promise resolving as the response object from the REST API
 */
function restApiGet(req, path, restReq) {

    const app = req.app;
    if (path.constructor === Object) {
        restReq = path;
        path = undefined;
    }
    restReq = restReq || {};
    restReq.method = restReq.method || 'get';
    restReq.query = restReq.query || {};
    restReq.headers = restReq.headers || {};
    restReq.params = restReq.params || {};
    restReq.params.path = path || restReq.params.path;
    restReq.params.domain = restReq.params.domain || req.params.domain;
    if (!restReq.params.path || !restReq.params.domain) {
        return BBPromise.reject(new HTTPError({
            status: 500,
            type: 'internal_error',
            title: 'Invalid internal call',
            detail: 'domain and path need to be defined for the REST API call'
        }));
    }
    restReq.params.path = restReq.params.path[0] === '/' ?
        restReq.params.path.slice(1) : restReq.params.path;

    return req.issueRequest(app.restbase_tpl.expand({ request: restReq }));

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
 * @param {!Object} req
 * @param {!string} title
 * @return {Promise<Object>}
 */
function restGetSummary(req, title) {
    return restApiGet(
        req,
        `page/summary/${encodeURIComponent(title)}`,
        {
            headers: {
                'accept-language': req.headers['accept-language']
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
 * @param {!Application} app the application object
 */
function setupApiTemplates(app) {

    // set up the MW API request template
    if (!app.conf.mwapi_req) {
        app.conf.mwapi_req = {
            method: 'post',
            uri: 'http://{{domain}}/w/api.php',
            headers: '{{request.headers}}',
            body: '{{ default(request.query, {}) }}'
        };
    }
    app.mwapi_tpl = new Template(app.conf.mwapi_req);

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
    setupApiTemplates
};

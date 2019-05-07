'use strict';

const BBPromise = require('bluebird');
const express = require('express');
const uuid = require('cassandra-uuid');
const bunyan = require('bunyan');

// service-specific deps
const Title = require('mediawiki-title').Title;

/**
 * Error instance wrapping HTTP error responses
 */
class HTTPError extends Error {

    constructor(response) {
        super();
        Error.captureStackTrace(this, HTTPError);

        if (response.constructor !== Object) {
            // just assume this is just the error message
            response = {
                status: 500,
                type: 'internal_error',
                title: 'InternalError',
                detail: response
            };
        }

        this.name = this.constructor.name;
        this.message = `${response.status}`;
        if (response.type) {
            this.message += `: ${response.type}`;
        }

        Object.assign(this, response);
    }
}

/**
 * Generates an object suitable for logging out of a request object
 * @param {!Request} req          the request
 * @param {?RegExp}  whitelistRE  the RegExp used to filter headers
 * @return {!Object} an object containing the key components of the request
 */
function reqForLog(req, whitelistRE) {

    const ret = {
        url: req.originalUrl,
        headers: {},
        method: req.method,
        params: req.params,
        query: req.query,
        body: req.body,
        remoteAddress: req.connection.remoteAddress,
        remotePort: req.connection.remotePort
    };

    if (req.headers && whitelistRE) {
        Object.keys(req.headers).forEach((hdr) => {
            if (whitelistRE.test(hdr)) {
                ret.headers[hdr] = req.headers[hdr];
            }
        });
    }

    return ret;

}

/**
 * Serialises an error object in a form suitable for logging.
 * @param {!Error} err error to serialise
 * @return {!Object} the serialised version of the error
 */
function errForLog(err) {

    const ret = bunyan.stdSerializers.err(err);
    ret.status = err.status;
    ret.type = err.type;
    ret.detail = err.detail;

    // log the stack trace only for 500 errors
    if (Number.parseInt(ret.status, 10) !== 500) {
        ret.stack = undefined;
    }

    return ret;

}

/**
 * Generates a unique request ID.
 * @return {!string} the generated request ID
 */
function generateRequestId() {

    return uuid.TimeUuid.now().toString();

}

/**
 * Wraps all of the given router's handler functions with
 * promised try blocks so as to allow catching all errors,
 * regardless of whether a handler returns/uses promises
 * or not.
 * @param {!Object} route the object containing the router and path to bind it to
 * @param {!Application} app the application object
 */
function wrapRouteHandlers(route, app) {

    route.router.stack.forEach((routerLayer) => {
        let path = (route.path + routerLayer.route.path.slice(1))
            .replace(/\/:/g, '/--')
            .replace(/^\//, '')
            .replace(/[/?]+$/, '');
        path = app.metrics.normalizeName(path || 'root');
        routerLayer.route.stack.forEach((layer) => {
            const origHandler = layer.handle;
            layer.handle = (req, res, next) => {
                const startTime = Date.now();
                BBPromise.try(() => origHandler(req, res, next))
                .catch(next)
                .finally(() => {
                    let statusCode = parseInt(res.statusCode, 10) || 500;
                    if (statusCode < 100 || statusCode > 599) {
                        statusCode = 500;
                    }
                    const statusClass = `${Math.floor(statusCode / 100)}xx`;
                    const stat = `${path}.${req.method}.`;
                    app.metrics.endTiming([
                        stat + statusCode,
                        stat + statusClass,
                        `${stat}ALL`
                    ], startTime);
                });
            };
        });
    });

}

/**
 * Generates an error handler for the given applications and installs it.
 * @param {!Application} app the application object to add the handler to
 */
function setErrorHandler(app) {

    app.use((err, req, res, next) => {
        let errObj;
        // ensure this is an HTTPError object
        if (err.constructor === HTTPError) {
            errObj = err;
        } else if (err instanceof Error) {
            // is this an HTTPError defined elsewhere? (preq)
            if (err.constructor.name === 'HTTPError') {
                const o = { status: err.status };
                if (err.body && err.body.constructor === Object) {
                    Object.keys(err.body).forEach((key) => {
                        o[key] = err.body[key];
                    });
                } else {
                    o.detail = err.body;
                }
                o.message = err.message;
                errObj = new HTTPError(o);
            } else {
                // this is a standard error, convert it
                errObj = new HTTPError({
                    status: 500,
                    type: 'internal_error',
                    title: err.name,
                    detail: err.message,
                    stack: err.stack
                });
            }
        } else if (err.constructor === Object) {
            // this is a regular object, suppose it's a response
            errObj = new HTTPError(err);
        } else {
            // just assume this is just the error message
            errObj = new HTTPError({
                status: 500,
                type: 'internal_error',
                title: 'InternalError',
                detail: err
            });
        }
        // ensure some important error fields are present
        errObj.status = errObj.status || 500;
        errObj.type = errObj.type || 'internal_error';
        // add the offending URI and method as well
        errObj.method = errObj.method || req.method;
        errObj.uri = errObj.uri || req.url;
        // some set 'message' or 'description' instead of 'detail'
        errObj.detail = errObj.detail || errObj.message || errObj.description || '';
        // adjust the log level based on the status code
        let level = 'error';
        if (Number.parseInt(errObj.status, 10) < 400) {
            level = 'trace';
        } else if (Number.parseInt(errObj.status, 10) < 500) {
            level = 'info';
        }
        // log the error
        const component = (errObj.component ? errObj.component : errObj.status);
        (req.logger || app.logger).log(`${level}/${component}`, errForLog(errObj));
        // let through only non-sensitive info
        const respBody = {
            status: errObj.status,
            type: errObj.type,
            title: errObj.title,
            detail: errObj.detail,
            method: errObj.method,
            uri: errObj.uri
        };
        res.status(errObj.status).json(respBody);
    });

}

/**
 * Creates a new router with some default options.
 * @param {?Object} [opts] additional options to pass to express.Router()
 * @return {!Router} a new router object
 */
function createRouter(opts) {

    const options = {
        mergeParams: true
    };

    if (opts && opts.constructor === Object) {
        Object.assign(options, opts);
    }

    return new express.Router(options);

}

/**
 * Adds logger to the request and logs it.
 * @param {!*} req request object
 * @param {!Application} app application object
 */
function initAndLogRequest(req, app) {
    req.headers = req.headers || {};
    req.headers['x-request-id'] = req.headers['x-request-id'] || generateRequestId();
    req.logger = app.logger.child({
        request_id: req.headers['x-request-id'],
        request: reqForLog(req, app.conf.log_header_whitelist)
    });
    req.logger.log('trace/req', { msg: 'incoming request' });
}

// service-specific functions below

function checkForQueryPagesInResponse(req, response) {
    if (!(response && response.body && response.body.query && response.body.query.pages)) {
        // we did not get our expected query.pages from the MW API, propagate that
        req.logger.log('error/mwapi', 'no query.pages in response');
        throw new HTTPError({
            status: 504,
            type: 'api_error',
            title: 'no query.pages in response',
            detail: response.body
        });
    }
}

function removeFragment(href) {
    if (href.indexOf('#') > -1) {
        return href.substring(0, href.indexOf('#'));
    }
    return href;
}

function removeLinkPrefix(href) {
    return href.replace(/^\.\//, '');
}

function extractDbTitleFromAnchor(anchor) {
    return anchor && removeFragment(removeLinkPrefix(anchor.getAttribute('href')));
}

function getRbPageSummaryUrl(restbaseTpl, domain, title) {
    const request = restbaseTpl.expand({
        request: {
            params: {
                domain,
                path: `page/summary/${encodeURIComponent(title)}` }
        }
    });
    return request.uri;
}

/**
 * Get a Title object for a MW title string
 * @param {!string} title a MediaWiki page title string
 * @param {!Object} siteinfo siteinfo from the MW API
 * @return {!Object} a mediawiki-title Title object that can be used to obtain a db-normalized title
 */
function getDbTitle(title, siteinfo) {
    return Title.newFromText(title, siteinfo).getPrefixedDBKey();
}

/**
 * Retrieves the etag from the headers if present. Strips the weak etag prefix (W/) and enclosing
 * quotes.
 * @param {?Object} headers an object of header name/values
 * @return {?string} etag
 */
function getEtagFromHeaders(headers) {
    if (headers && headers.etag) {
        return headers.etag.replace(/^W\//, '').replace(/"/g, '');
    }
}

/**
 * Retrieves the revision from the etag emitted by Parsoid.
 * @param {?Object} headers an object of header name/values
 * @return {?string} revision portion of etag, if found
 */
function getRevisionFromEtag(headers) {
    const etag = getEtagFromHeaders(headers);
    if (etag) {
        return etag.split('/').shift();
    }
}

function getRevisionFromExtract(extractObj) {
    return extractObj.revisions[0].revid;
}

/* eslint no-bitwise: ["error", { "allow": ["<<"] }] */
function hashCode(string) {
    return string.split('').reduce((prevHash, currVal) =>
        ((prevHash << 5) - prevHash) + currVal.charCodeAt(0), 0);
}

/**
 * Remove the top-level domain from a domain string, e.g., 'en.wikipedia.org' ->
 * 'en.wikipedia'.
 * @param {!string} domain domain string
 * @return {!string} domain string minus the TLD
 */
function removeTLD(domain) {
    return domain.split('.').slice(0, 2).join('.');
}

/**
 * Sets the ETag header on the response object, comprised of the revision ID and
 * the time UUID. If the latter is not given, the current time stamp is used to
 * generate it.
 * @param {!Object} response The HTTPResponse object on which to set the header
 * @param {?number} revision The revision integer ID to use
 * @param {?string} tid      The time UUID to use; optional
 */
function setETag(response, revision, tid) {
    // we want to bail out if the revision hasn't been supplied, except
    // in the case revision === 0 because 0 is actually a valid rev_id
    if (!revision && revision !== 0) {
        return;
    }
    if (!tid) {
        tid = uuid.TimeUuid.now().toString();
    }
    response.set('etag', `"${revision}/${tid}"`);
}

function getContentTypeString(spec) {
    return `${spec.type}; charset=utf-8; profile="https://www.mediawiki.org/wiki/Specs/${spec.name}/${spec.version}"`;
}

function setContentType(res, spec) {
    if (!spec.name || !spec.version) {
        throw new HTTPError({
            status: 500,
            type: 'invalid_content_type',
            title: 'Only use the allowed content-types',
            detail: `${spec.name}/${spec.version} is not an allowed content-type!`
        });
    }

    res.type(getContentTypeString(spec));
}

const CONTENT_TYPES = {
    html: { name: 'HTML', version: '2.1.0', type: 'text/html' },
    random: { name: 'Random', version: '0.6.0', type: 'application/json' },
    announcements: { name: 'Announcements', version: '0.3.0', type: 'application/json' },
    onthisday: { name: 'OnThisDay', version: '0.3.3', type: 'application/json' },
    availability: { name: 'Availability', version: '1.0.1', type: 'application/json' },
    unpublished: { name: 'Unpublished', version: '0.0.0', type: 'application/json' }
};

module.exports = {
    HTTPError,
    initAndLogRequest,
    wrapRouteHandlers,
    setErrorHandler,
    router: createRouter,

    // service-specific
    checkForQueryPagesInResponse,
    extractDbTitleFromAnchor,
    getContentTypeString,
    getRbPageSummaryUrl,
    getDbTitle,
    getRevisionFromEtag,
    getRevisionFromExtract,
    hashCode,
    removeTLD,
    setETag,
    setContentType,
    CONTENT_TYPES
};

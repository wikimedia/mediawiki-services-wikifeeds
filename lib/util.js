'use strict';

const BBPromise = require('bluebird');
const preq = require('preq');
const express = require('express');
const assert = require('assert');
const uuidv1 = require('uuid').v1;
const bunyan = require('bunyan');
const uuid = require('cassandra-uuid');

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
        this.message = `${ response.status }`;
        if (response.type) {
            this.message += `: ${ response.type }`;
        }

        Object.assign(this, response);
    }
}

/**
 * Generates an object suitable for logging out of a request object
 *
 * @param {!Request} req          the request
 * @param {?RegExp}  allowListRegExp  the RegExp used to filter headers
 * @return {!Object} an object containing the key components of the request
 */
function reqForLog(req, allowListRegExp) {

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

    if (req.headers && allowListRegExp) {
        Object.keys(req.headers).forEach((hdr) => {
            if (allowListRegExp.test(hdr)) {
                ret.headers[hdr] = req.headers[hdr];
            }
        });
    }

    return ret;

}

/**
 * Serialises an error object in a form suitable for logging.
 *
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
 * Wraps all of the given router's handler functions with
 * promised try blocks so as to allow catching all errors,
 * regardless of whether a handler returns/uses promises
 * or not.
 *
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
                    const statusClass = `${ Math.floor(statusCode / 100) }xx`;
                    const stat = `${ path }.${ req.method }.`;
                    app.metrics.endTiming([
                        stat + statusCode,
                        stat + statusClass,
                        `${ stat }ALL`
                    ], startTime);
                });
            };
        });
    });

}

/**
 * Generates an error handler for the given applications and installs it.
 *
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
                    detail: err.detail || err.message,
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
        (req.logger || app.logger).log(`${ level }/${ component }`, errForLog(errObj));
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
 *
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

function removeFragment(href) {
    if (href.includes('#')) {
        return href.slice(0, Math.max(0, href.indexOf('#')));
    }
    return href;
}

function removeLinkPrefix(href) {
    return href.replace(/^\.\//, '');
}

function extractDbTitleFromAnchor(anchor) {
    // T308096: Use the original title without language conversion
    if (anchor && anchor.getAttribute('data-mw-variant-orig')) {
        return removeFragment(anchor.getAttribute('data-mw-variant-orig'));
    }
    return anchor && removeFragment(removeLinkPrefix(anchor.getAttribute('href')));
}

function getRbPageSummaryUrl(restbaseTpl, domain, title) {
    const request = restbaseTpl.expand({
        request: {
            params: {
                domain,
                path: `page/summary/${ encodeURIComponent(title) }`
            }
        }
    });
    return request.uri;
}

/**
 * Get a Title object for a MW title string
 *
 * @param {!string} title a MediaWiki page title string
 * @param {!Object} siteinfo siteinfo from the MW API
 * @return {!string} a mediawiki-title Title object that can be used to obtain a db-normalized title
 */
function getDbTitle(title, siteinfo) {
    return Title.newFromText(title, siteinfo).getPrefixedDBKey();
}

/**
 * Retrieves the etag from the headers if present. Strips the weak etag prefix (W/) and enclosing
 * quotes.
 *
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
 *
 * @param {?Object} headers an object of header name/values
 * @return {?string} revision portion of etag, if found
 */
function getRevisionFromEtag(headers) {
    const etag = getEtagFromHeaders(headers);
    if (etag) {
        return etag.split('/').shift();
    }
}

/**
 * Retrieves the revision and tid from the etag emitted by Parsoid.
 *
 * @param {?Object} headers an object of header name/values
 * @return {?Object} revision and tid from etag, if found
 */
function getRevAndTidFromEtag(headers) {
    const etag = getEtagFromHeaders(headers);
    if (etag) {
        const etagComponents = etag.split('/');
        return {
            revision: etagComponents[0],
            tid: etagComponents[1]
        };
    }
}

/* eslint no-bitwise: ["error", { "allow": ["<<"] }] */
function hashCode(string) {
    return string.split('').reduce((prevHash, currVal) =>
        ((prevHash << 5) - prevHash) + currVal.charCodeAt(0), 0);
}

/**
 * Remove the top-level domain from a domain string, e.g., 'en.wikipedia.org' ->
 * 'en.wikipedia'.
 *
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
 *
 * @param {!Object} response The HTTPResponse object on which to set the header
 * @param {?number} revision The revision integer ID to use
 * @param {?string} tid      The time UUID to use; optional
 */
function setETag(response, revision, tid = undefined) {
    assert(['string', 'number'].includes(typeof revision));
    assert(['string', 'undefined'].includes(typeof tid));
    if (!tid) {
        tid = uuid.TimeUuid.now().toString();
    }
    response.set('etag', `"${ revision }/${ tid }"`);
}

function getContentTypeString(spec) {
    return `${ spec.type }; charset=utf-8; profile="https://www.mediawiki.org/wiki/Specs/${ spec.name }/${ spec.version }"`;
}

function setContentType(res, spec) {
    if (!spec.name || !spec.version) {
        throw new HTTPError({
            status: 500,
            type: 'invalid_content_type',
            title: 'Only use the allowed content-types',
            detail: `${ spec.name }/${ spec.version } is not an allowed content-type!`
        });
    }

    res.type(getContentTypeString(spec));
}

/**
 * Adds logger to the request and logs it.
 *
 * @param {!*} req request object
 * @param {!Application} app application object
 */
function initAndLogRequest(req, app) {
    req.headers = req.headers || {};
    req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv1();
    req.logger = app.logger.child({
        request_id: req.headers['x-request-id'],
        request: reqForLog(req, app.conf.log_header_allowlist)
    });
    req.context = { reqId: req.headers['x-request-id'] };
    req.issueRequest = (request) => {
        if (!(request.constructor === Object)) {
            request = { uri: request };
        }
        if (request.url) {
            request.uri = request.url;
            delete request.url;
        }
        if (!request.uri) {
            return BBPromise.reject(new HTTPError({
                status: 500,
                type: 'internal_error',
                title: 'No request to issue',
                detail: 'No request has been specified'
            }));
        }
        request.method = request.method || 'get';
        request.headers = request.headers || {};
        Object.assign(request.headers, {
            'user-agent': app.conf.user_agent,
            'x-request-id': req.context.reqId
        });
        req.logger.log('trace/req', { msg: 'Outgoing request', out_request: request });
        return preq(request);
    };
    req.logger.log('trace/req', { msg: 'Incoming request' });
}

/**
 * Remove entries with duplicate 'title' values from an array of objects
 *
 * @param {?Array}      arr Array of page/article objects
 * @param {?Function}   upd Optional function to update the original item based on the duplicate.
 *                          Takes two parameters (orig, dupe): orig - the original object,
 *                          dupe - the duplicate
 * @return {?Array}         arr deduplicated by 'title'
 */
function removeDuplicateTitles(arr, upd) {
    const titles = {};
    return arr.filter((item, idx, init) => {
        if (titles[item.title]) {
            if (upd) {
                const orig = init[init.findIndex((el) => el.title === item.title)];
                upd(orig, item);
            }
            return false;
        }
        titles[item.title] = true;
        return true;
    });
}

/**
 * For a free-form object nested object with promises, awaits all promises in parallel.
 *
 * @param {!Object} object
 * @param {boolean} ignoreRejections whether to ignore rejected promises.
 *                  If true, rejected promises are ignored and removed from the object.
 *                  If false, the first rejection is propagated to the returned promise.
 * @param {Object} logger optional logger to log promise rejections.
 * @return {Promise<Object>}
 */
function promiseAwaitAll(object, ignoreRejections = true, logger) {
    const promises = [];
    function collectPromises(subObject, replaceCallback, removeCallback) {
        if (subObject instanceof BBPromise) {
            promises.push(subObject
            .then(
                (value) => replaceCallback(value),
                (err) => {
                    if (ignoreRejections) {
                        if (logger) {
                            logger.log('warn', err);
                        }
                        removeCallback();
                    } else {
                        throw err;
                    }
                }
            ));
        } else if (Array.isArray(subObject)) {
            subObject.forEach((item) =>
                collectPromises(
                    item,
                    (value) => {
                        subObject[subObject.indexOf(item)] = value;
                    },
                    () => {
                        subObject.splice(subObject.indexOf(item), 1);
                    }));
        } else if (typeof subObject === 'object') {
            Object.keys(subObject).forEach((key) => {
                collectPromises(
                    subObject[key],
                    (value) => {
                        subObject[key] = value;
                    },
                    () => {
                        delete subObject[key];
                    });
            });
        }
    }
    collectPromises(object);
    return BBPromise.all(promises).thenReturn(object);
}

const CONTENT_TYPES = {
    html: { name: 'HTML', version: '2.1.0', type: 'text/html' },
    announcements: { name: 'Announcements', version: '0.3.0', type: 'application/json' },
    onthisday: { name: 'OnThisDay', version: '0.5.0', type: 'application/json' },
    availability: { name: 'Availability', version: '1.0.1', type: 'application/json' },
    random: { name: 'Random', version: '0.7.0', type: 'application/json' },
    unpublished: { name: 'Unpublished', version: '0.0.0', type: 'application/json' }
};

module.exports = {
    HTTPError,
    initAndLogRequest,
    wrapRouteHandlers,
    setErrorHandler,
    router: createRouter,

    // service-specific
    extractDbTitleFromAnchor,
    getContentTypeString,
    getRbPageSummaryUrl,
    getDbTitle,
    getRevisionFromEtag,
    getRevAndTidFromEtag,
    hashCode,
    removeTLD,
    setETag,
    setContentType,
    promiseAwaitAll,
    removeDuplicateTitles,
    CONTENT_TYPES
};

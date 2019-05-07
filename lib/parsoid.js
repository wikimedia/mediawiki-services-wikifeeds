'use strict';

const api = require('./api-util');
const util = require('./util');

/**
 * Generic function to get page content from the REST API.
 * @param {!Object} app the application object
 * @param {!Object} req the request object
 * @return {!Promise} Promise for the requested content
 */
function getParsoidHtml(app, req) {
    const rev = req.params.revision;
    let suffix = '';
    if (rev) {
        suffix = `/${rev}`;
        const tid = req.params.tid;
        if (tid) {
            suffix += `/${tid}`;
        }
    }
    const domain = req.params.domain.replace(/^(\w+\.)m\./, '$1');
    const path = `page/html/${encodeURIComponent(req.params.title)}${suffix}`;
    const restReq = { headers: {
            accept: util.getContentTypeString(util.CONTENT_TYPES.html),
            'accept-language': req.headers['accept-language']
        } };
    return api.restApiGet(app, domain, path, restReq);
}

module.exports = { getParsoidHtml };

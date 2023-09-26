'use strict';

const api = require('./api-util');
const util = require('./util');

/**
 * Generic function to get page content from the REST API.
 *
 * @param {!Object} req the request object
 * @return {!Promise} Promise for the requested content
 */
function getParsoidHtml(req) {
    const rev = req.params.revision;
    let suffix = '';
    if (rev) {
        suffix = `/${rev}`;
        const tid = req.params.tid;
        if (tid) {
            suffix += `/${tid}`;
        }
    }

    let lang = req.headers['accept-language'];
    if (lang) {
        // HACK: T346657
        // Use zh locale for all zhwiki requests
        lang = lang.replace(/zh(-.*)/, 'zh');
    }

    if (req.app.conf.usecorepagehtml) {
        return api.mwCorePageHTMLGet(req, { 'accept-language': lang });
    }

    const path = `page/html/${encodeURIComponent(req.params.title)}${suffix}`;
    const restReq = { headers: {
            accept: util.getContentTypeString(util.CONTENT_TYPES.html),
            'accept-language': lang
        } };
    return api.restApiGet(req, path, restReq);
}

module.exports = { getParsoidHtml };

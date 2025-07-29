'use strict';

const BBPromise = require('bluebird');
const parsoid = require('./parsoid');
const util = require('./util');
const docUtil = require('./doc-util');
const HTTPError = util.HTTPError;
const si = require('./siteinfo');
const DYK_SITES = require('../etc/dyk-sites');

const supportedSubdomains = Object.keys(DYK_SITES);

const supportedDomains = supportedSubdomains.map((lang) => `${ lang }.wikipedia.org`);

const isSupported = (domain) => supportedDomains.includes(domain);

/**
 * Extracts DYK items from the document
 *
 * @param {!Document} doc The document to extract from
 * @param lang
 * @return {!Array} Array of DYK items
 */
function extractDYKItems(doc, lang) {
    const items = [];
    const elements = doc.querySelectorAll(DYK_SITES[lang].dykSelectorAll);

    Array.prototype.forEach.call(elements, (element) => {
        items.push({
            html: element.innerHTML.replace(DYK_SITES[lang].picturedRegex, ''),
            text: element.textContent.replace(DYK_SITES[lang].picturedRegex, '').trim()
        });
    });
    return items;
}

/**
 * Rewrites anchors in the document to use absolute URLs instead of relative ones, if any.
 *
 * @param {!Object} req The request object
 * @param {!Document} doc The document to process
 * @return {!Document} The document with rewritten anchors
 */
function rewriteAnchorsAbsolute(req, doc) {
    const anchors = doc.querySelectorAll('a');
    Array.prototype.forEach.call(anchors, (anchor) => {
        const href = anchor.getAttribute('href');
        if (href && !href.startsWith('http')) {
            anchor.setAttribute('href', `https://${ req.params.domain }/wiki/${ util.removeLinkPrefix(href) }`);
        }
    });
    return doc;
}

/**
 * Main function to fetch and process DYK content
 *
 * @param {!Object} app The application object
 * @param {!Object} req The request object
 * @return {!Promise} Promise resolving to the DYK content
 */
function promise(app, req) {
    const lang = req.params.domain.split('.')[0];
    const aggregated = !!req.query.aggregated;

    if (!isSupported(req.params.domain)) {
        if (aggregated) {
            return BBPromise.resolve({});
        }
        throw new HTTPError({
            status: 404,
            type: 'not_found',
            title: 'Not found',
            detail: 'The language you have requested is not yet supported.'
        });
    }

    // Set the title to the DYK template page
    req.params.title = DYK_SITES[lang].title;

    return si.getSiteInfo(req)
    .then((si) => parsoid.getParsoidHtml(req)
        .then((response) => {
            const vary = [];
            if (si.variants && si.variants.length > 1) {
                vary.push('accept-language');
            }
            const result = {
                payload: [],
                meta: { etag: util.getRevisionFromEtag(response.headers), vary }
            };
            return docUtil.createDocument(response.body)
            .then((doc) => {
                result.payload = extractDYKItems(rewriteAnchorsAbsolute(req, doc), lang);
                return result;
            })
            .then((result) => util.promiseAwaitAll(result, true, req.logger));
        }));
}

module.exports = {
    promise,
    supportedSubdomains,
    supportedDomains,
    testing: {
        isSupported
    }
};

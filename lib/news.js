'use strict';

const BBPromise = require('bluebird');
const parsoid = require('./parsoid');
const util = require('./util');
const apiUtil = require('./api-util');
const docUtil = require('./doc-util');
const si = require('./siteinfo');
const HTTPError = util.HTTPError;
const NEWS_TEMPLATES = require('../etc/news-sites');

/**
 * Remove any elements matching selector from doc
 *
 * @param {Document} doc
 * @param {string} selector
 * @return {boolean} true if at least one node has been removed
 */
function rmElements(doc, selector) {
    const nodes = doc.querySelectorAll(selector) || [];
    for (let idx = 0; idx < nodes.length; idx++) {
        const node = nodes[idx];
        node.parentNode.removeChild(node);
    }
    return nodes.length > 0;
}

function constructStory(req, lang, storyHtml) {
    const story = { links: [] };
    const linkTitles = [];

    const topicAnchor = storyHtml.querySelector(NEWS_TEMPLATES[lang].topicAnchorSelector);
    const topicTitle = util.extractDbTitleFromAnchor(topicAnchor);
    storyHtml.querySelectorAll('a[rel="mw:WikiLink"]').forEach((anchor) => {
        const storyTitle = util.extractDbTitleFromAnchor(anchor);
        if (linkTitles.indexOf(storyTitle) === -1) {
            story.links.splice(
                storyTitle === topicTitle ? 0 : story.links.length,
                0,
                apiUtil.restGetSummary(req, storyTitle)
            );
            linkTitles.push(storyTitle);
        }
    });

    rmElements(storyHtml, 'span[style^=float:right]');
    story.story = storyHtml.innerHTML;
    if (story.story.length > 0 && story.links.length > 0) {
        return story;
    } else {
        return undefined;
    }
}

function promise(app, req) {
    const lang = req.params.domain.split('.')[0];
    const aggregated = !!req.query.aggregated;

    if (!NEWS_TEMPLATES[lang]) {
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

    req.params.title = NEWS_TEMPLATES[lang].title;
    return si.getSiteInfo(req)
    .then((si) => {
        return parsoid.getParsoidHtml(req)
        .then((response) => {
            const selector = NEWS_TEMPLATES[lang].headlineSelectorAll;
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
                const headlines = doc.querySelectorAll(selector);
                Array.prototype.forEach.call(headlines, (storyHtml) => {
                    const story = constructStory(req, lang, storyHtml);
                    if (story) {
                        result.payload.push(story);
                    }
                });

                return result;
            })
            .then((result) =>
                util.promiseAwaitAll(result, true, req.logger));
        });
    });
}

module.exports = {
    promise,

    // visible for testing
    constructStory
};

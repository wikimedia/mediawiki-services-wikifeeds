/**
 * Random article promise and related support functions.
 */

'use strict';

const api = require('./api-util');
const util = require('./util');
const si = require('./siteinfo');
const BBPromise = require('bluebird');

/**
 * Returns a numeric score which can be used to roughly determine the relative "quality" of random
 * results.
 *
 * Scores are calculated as follows:
 *
 * 2 points for having:
 *   thumb url
 *
 * 1 point for having:
 *   wikidataDescription
 *
 * -10 point for being:
 *   disambiguation page
 *   list item page
 *
 * @param {?Object} page Page object from MW API
 * @return {!number} quality score
 */
function score(page) {
    /* eslint-disable no-restricted-syntax */
    const isDisambiguationPage = (page.pageprops && page.pageprops.disambiguation) ||
        (page.description && page.description.includes('disambiguation page'));

    const isListPage = page.description && page.description.includes('Wikimedia list article');
    /* eslint-enable no-restricted-syntax */

    let score = 0.0;

    if (page.pageprops.page_image || page.pageprops.page_image_free) {
        score += 2.0;
    }
    if (page.description) {
        score += 1.0;
    }
    if (isDisambiguationPage || isListPage) {
        score -= 10.0;
    }
    return score;
}

function pickBestResult(scoredResults) {
    return scoredResults.reduce((prev, curr) => {
        return curr.score > prev.score ? curr : prev;
    });
}

/**
 * Returns a single random result well suited to card-type layouts, i.e.
 * one likely to have a page image and wikidata description.
 *
 * Multiple random items are requested, but only the result having
 * the highest relative score is returned. Requesting about 12 items
 * seems to consistently produce a really "good" result.
 *
 * @param {!Object} req Request object
 * @return {!Promise}
 */
function promise(req) {
    const itemsToRequest = 12;
    return BBPromise.join(
        si.getSiteInfo(req),
        api.mwApiGet(req, {
            action: 'query',
            format: 'json',
            formatversion: 2,
            generator: 'random',
            grnfilterredir: 'nonredirects',
            grnlimit: itemsToRequest,
            grnnamespace: 0,
            prop: 'description|pageprops'
        }),
        (siteinfo, queryResponse) => {
            const pages = queryResponse.body.query.pages;
            const scoredPages = pages.map((page) => Object.assign(page, { score: score(page) }));
            const bestResult = pickBestResult(scoredPages);
            return util.getDbTitle(bestResult.title, siteinfo);
        });
}

module.exports = {
    promise,

    // visible for testing
    pickBestResult
};

/**
 * Helper functions for most-read title filtering.
 */

'use strict';

const regexEscape = require('escape-string-regexp');
const HTTPError = require('./util').HTTPError;

const DENY_LIST = [
    '-',
    'Test_card',
    'Web_scraping',
    'XHamster',
    'Java_(programming_language)',
    'Images/upload/bel.jpg',
    'Superintelligence:_Paths,_Dangers,_Strategies',
    'Okto',
    'Proyecto_40',
    'AMGTV',
    'Lali_Espósito',
    'La7',
    'Vagina',
    'کس', // mznwiki
    'مقعد', // mznwiki
    'Tobias_Sammet', // dewiki T238942
    'Avantasia', // dewiki T238942
    'Edguy', // dewiki T238942
    'Pornhub' // dewiki T238942
];

/**
 * Articles with less than this proportion of pageviews on either desktop or
 * mobile are likely bot traffic and will be filtered from the output.
 *
 * Must be in the interval [0, 1].
 */
const BOT_FILTER_THRESHOLD = 0.1;

function isAllowed(title) {
    return DENY_LIST.indexOf(title) === -1;
}

function filterSpecial(articles, mainPageTitle) {
    const mainPageRegExp = new RegExp(`^${regexEscape(mainPageTitle)}$`, 'i');
    return articles.filter((page) => {
        return page.ns === 0 && !mainPageRegExp.test(page.article);
    });
}

/**
 * Implements an editor-proposed heuristic in which top-pageview articles with
 * almost all desktop pageviews or almost all mobile pageviews, rather than a
 * relatively even mix of the two, are presumed to be inflated by bot traffic
 * and not of sufficient human interest to include in the feed.
 * @param {!Array} allPlatformsMostRead list of most read article objects from all platforms
 * @param {!Array} desktopMostRead list of most read article objects from desktop only
 * @return {!Array} the list for all platforms, with articles filtered out if skewed too far toward
 * either desktop or mobile views only
 */
function filterBots(allPlatformsMostRead, desktopMostRead) {

    if (BOT_FILTER_THRESHOLD < 0 || BOT_FILTER_THRESHOLD > 1) {
        throw new HTTPError({
            status: 500,
            type: 'internal_error',
            title: 'Internal error',
            detail: 'An internal error occurred'
        });
    }

    // Create an object with title keys for speedy desktop article lookups when
    // iterating over combined-platform top pageviews
    const desktopArticles = {};
    desktopMostRead.forEach((entry) => {
        desktopArticles[entry.article] = entry;
    });
    return allPlatformsMostRead.filter((entry) => {
        const title = entry.article;
        const totalViews = entry.views;
        const desktopViews = desktopArticles[title] && desktopArticles[title].views;
        return (desktopViews >= totalViews * BOT_FILTER_THRESHOLD &&
            desktopViews <= totalViews * (1 - BOT_FILTER_THRESHOLD)) &&
            isAllowed(title);
    });
}

module.exports = {
    filterSpecial,
    filterBots
};

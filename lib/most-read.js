/**
 * Most-read article promise and related support functions.
 */

'use strict';

const BBPromise = require('bluebird');
const regexEscape = require('lodash').escapeRegExp;
const dateUtil = require('./date-util');
const pageviews = require('./pageviews');
const si = require('./siteinfo');
const util = require('./util');
const apiUtil = require('./api-util');
const Title = require('mediawiki-title').Title;

const MAX_TITLES = 50;

const DENY_LIST = {
    '*': [
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
        'Pornhub', // dewiki T238942
        'Index', // T327904
        'Index_(statistics)',
        'Index,_Washington',
        'Index_(economics)',
        'XXX:_Return_of_Xander_Cage',
        'XXX_(film_series)',
        'XXX_(2002_film)',
        'Cookie_(informatique)',
        'Nigger',
        'nigger',
        'YouTube',
        'Cleopatra',
        'Outlook.com',
        'Sex',
        '.xxx',
        'XNXX',
        'XVideos',
        'XXXX_(beer)',
        'XXXX',
        'XXXX_Gold',
        'XXXX_(album)',
        'XXXX_Summer_Bright_Lager',
        'XXXX_Panzer_Corps',
        'XXX:_State_of_the_Union',
        'XXXTentacion',
        'X_(2022_film)',
        'Super_Bowl_XXX',
        'Murder_of_XXXTentacion',
        'ChatGPT',
        'Magic_cross_piercing'
    ],
    ru: [
        'Яндекс',
        'ЯRUS',
        'IMGSRC.RU'
    ],
    test: [
        'User:JGiannelos_(WMF)/test_most_read_block'
    ]
};

/**
 * @public {!string} date ISO 8601 timestamp of pageviews recorded
 * @public {!number} views Integer pageviews on date
 */
class DatedPageviews {
    constructor(date, views) {
        this.date = date;
        this.views = views;
    }
}

function getTopPageviews(req, domain, date) {
    const restReq = {
        params: { domain: 'wikimedia.org' },
        headers: { accept: 'application/json; charset=utf-8' }
    };
    return new pageviews.Client(req, restReq).reqTop(domain, pageviews.Platform.ALL, date);
}
function pageviewsPageRspToDatedPageviews(rsp) {
    return rsp.body.items.map((item) => new DatedPageviews(dateUtil.iso8601DateFromYYYYMMDD(item.timestamp), item.views));
}

function getViewHistory(req, domain, startDate, endDate, entry) {
    const restReq = {
        params: { domain: 'wikimedia.org' },
        headers: { accept: 'application/json; charset=utf-8' }
    };
    const client = new pageviews.Client(req, restReq);
    return client.reqPage(util.removeTLD(domain), pageviews.Platform.ALL, pageviews.Agent.USER,
        entry.article, pageviews.Granularity.DAILY, startDate, endDate)
        .then(pageviewsPageRspToDatedPageviews);
}

function filterSpecial(articles, mainPageTitle) {
    const mainPageRegExp = new RegExp(`^${ regexEscape(mainPageTitle) }$`, 'i');
    return articles.filter((entry) => entry.namespace.id === 0 && !mainPageRegExp.test(entry.titles.canonical));
}

function isBlocked(lang, title) {
    return (lang in DENY_LIST && DENY_LIST[lang].includes(title)) || DENY_LIST['*'].includes(title);
}

function promise(app, req) {
    if (req.params.domain === 'fy.wikipedia.org') {
        return BBPromise.resolve({ meta: {} });
    }

    if (!dateUtil.validate(dateUtil.hyphenDelimitedDateString(req))) {
        if (req.query.aggregated) {
            return BBPromise.resolve({ meta: {} });
        }
        dateUtil.throwDateError();
    }

    const reqDate = dateUtil.getRequestedDate(req);
    const rspDate = req.query.aggregated ? dateUtil.addDays(reqDate, -1) : reqDate;

    return BBPromise.join(
        getTopPageviews(req, util.removeTLD(req.params.domain), rspDate),
        si.getSiteInfo(req),
        (pageviewsResponse, siteinfo) => {
            const mainPage = siteinfo.general && siteinfo.general.mainpage;
            const mainPageTitle = Title.newFromText(mainPage, siteinfo);

            const pageviews = pageviewsResponse &&
                pageviewsResponse.body &&
                pageviewsResponse.body.items &&
                pageviewsResponse.body.items[0];

            const pageviewsSlice = pageviews.articles &&
                pageviews.articles.slice(0, MAX_TITLES);

            const titles = pageviewsSlice.map((entry) => {
                let ns;
                try {
                    // eslint-disable-next-line no-underscore-dangle
                    ns = Title.newFromText(entry.article, siteinfo).getNamespace()._id;
                } catch (e) {
                    if (e.type === 'title-invalid-utf8') {
                        req.logger.log('warn', e);
                        return;
                    } else {
                        throw e;
                    }
                }
                return Object.assign({ ns }, entry);
            }).filter((entry) => entry !== undefined);

            const resultsDate = `${ pageviews.year }-${ pageviews.month }-${ pageviews.day }Z`;
            const start = dateUtil.addDays(new Date(resultsDate), -4);
            const end = new Date(resultsDate);

            const results = titles.map((entry) => {
                // Will be merged-in on a later pass
                entry.$summary = apiUtil.restGetSummary(req, entry.article);
                entry.view_history = getViewHistory(req, req.params.domain, start, end, entry);
                delete entry.article;
                delete entry.ns;
                return entry;
            });

            return util.promiseAwaitAll(results, true, req.logger)
            .then((resp) => {
                let articles = resp
                // Throw away items where summaries failed to fetch.
                .filter((entry) => !!entry.$summary)
                // Merge the summary content into the article view data.
                .map((entry) => {
                    Object.assign(entry, entry.$summary);
                    delete entry.$summary;
                    return entry;
                });

                // Deduplicate the most-read pages cause some of them might have been
                // redirects which have now been resolved.
                articles = util.removeDuplicateTitles(articles, (orig, dupe) => {
                        orig.views += dupe.views;
                        if (orig.view_history) {
                            orig.view_history.forEach((toViewsForDate) => {
                                const filteredViews = dupe.view_history.filter((fromViewsForDate) => toViewsForDate.date === fromViewsForDate.date);
                                if (filteredViews.length) {
                                    toViewsForDate.views += filteredViews[0].views;
                                }
                            });
                        }
                        return orig;
                    });

                articles = filterSpecial(articles, mainPageTitle.getPrefixedDBKey());
                articles = articles.filter((entry) => !isBlocked(siteinfo.general.lang, entry.titles.canonical));

                const vary = [];
                if (siteinfo.variants && siteinfo.variants.length > 1) {
                    vary.push('accept-language');
                }
                return {
                    payload: {
                        date: resultsDate,
                        articles
                    },
                    meta: { revision: dateUtil.dateStringFrom(req), vary }
                };
            });
        }).catch((err) => {
        // Catch and handle the error if this is an aggregated request and the
        // pageview data are not yet loaded.
        if (req.query.aggregated && err.status === 404) {
            return BBPromise.resolve({ meta: {} });
        }
        throw err;
    });
}

module.exports = {
    promise,

    // visible for testing
    filterSpecial,
    isBlocked
};

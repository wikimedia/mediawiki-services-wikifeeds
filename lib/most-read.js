/**
 * Most-read article promise and related support functions.
 */

'use strict';

const BBPromise = require('bluebird');
const filterSpecial = require('./most-read-filter').filterSpecial;
const filterBots = require('./most-read-filter').filterBots;
const dateUtil = require('./date-util');
const pageviews = require('./pageviews');
const si = require('./siteinfo');
const util = require('./util');
const apiUtil = require('./api-util');
const HTTPError = util.HTTPError;
const Title = require('mediawiki-title').Title;

const MAX_TITLES = 50;

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
    const client = new pageviews.Client(req, restReq);
    return BBPromise.props({
        desktop: client.reqTop(domain, pageviews.Platform.DESKTOP_WEB, date),
        combined: client.reqTop(domain, pageviews.Platform.ALL, date)
    });
}
function pageviewsPageRspToDatedPageviews(rsp) {
    return rsp.body.items.map((item) => {
        return new DatedPageviews(dateUtil.iso8601DateFromYYYYMMDD(item.timestamp), item.views);
    });
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
        (pageviews, siteinfo) => {
            // We're working mainly with the overall list of top pageviews, and cut
            // this off at 50 (the max that can be sent in a single MW API query).
            // We'll keep twice as many desktop-only pageviews for the comparator
            // list to try to account for cases near the edge.  For instance, an
            // article could be #49 on the overall list but #51 on the desktop-only
            // pageviews list.  This way we can still compare desktop vs. overall
            // pageviews for it.
            const DESKTOP_TITLES = 2 * MAX_TITLES;

            const mainPage = siteinfo.general && siteinfo.general.mainpage;
            const mainPageTitle = Title.newFromText(mainPage, siteinfo);

            const combinedResults = pageviews.combined && pageviews.combined.body;
            const desktopResults = pageviews.desktop && pageviews.desktop.body;
            const combinedItems = combinedResults && combinedResults.items;
            const firstCombinedItems = combinedItems && combinedResults.items[0];
            const desktopItems = desktopResults && desktopResults.items;
            const firstDesktopItems = desktopItems && desktopResults.items[0];
            const combinedArticles = firstCombinedItems && firstCombinedItems.articles;
            const combinedSlice = combinedArticles && combinedArticles.slice(0, MAX_TITLES);
            const desktopArticles = firstDesktopItems && firstDesktopItems.articles;
            const desktopSlice = desktopArticles && desktopArticles.slice(0, DESKTOP_TITLES);

            const year = firstCombinedItems.year;
            const month = firstCombinedItems.month;
            const day = firstCombinedItems.day;
            const resultsDate = `${year}-${month}-${day}Z`;
            const start = dateUtil.addDays(new Date(resultsDate), -4);
            const end = new Date(resultsDate);

            const titles = filterSpecial(filterBots(combinedSlice, desktopSlice).map((entry) => {
                // eslint-disable-next-line no-underscore-dangle
                const ns = Title.newFromText(entry.article, siteinfo).getNamespace()._id;
                return Object.assign({ ns }, entry);
            }), mainPageTitle.getPrefixedDBKey());

            if (!titles || !titles.length) {
                throw new HTTPError({
                    status: 404,
                    type: 'not_found',
                    title: 'Not found',
                    detail: 'No results found.'
                });
            }

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
                const vary = [];
                if (siteinfo.variants && siteinfo.variants.length > 1) {
                    vary.push('accept-language');
                }
                return {
                    payload: {
                        date: resultsDate,
                        articles: resp
                        // Throw away items where summaries failed to fetch.
                        .filter((entry) => !!entry.$summary)
                        // Merge the summary content into the article view data.
                        .map((entry) => {
                            if (entry.$summary) {
                                Object.assign(entry, entry.$summary);
                                delete entry.$summary;
                            }
                            return entry;
                        })
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
    promise
};

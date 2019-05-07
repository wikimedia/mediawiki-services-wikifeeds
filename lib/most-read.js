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

function getTopPageviews(app, req, domain, date) {
    const restReq = { headers: { accept: 'application/json; charset=utf-8' } };
    const client = new pageviews.Client(app, 'wikimedia.org', restReq);
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

function getViewHistory(app, domain, startDate, endDate, entry) {
    const restReq = { headers: { accept: 'application/json; charset=utf-8' } };
    const client = new pageviews.Client(app, 'wikimedia.org', restReq);
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
        getTopPageviews(app, req, util.removeTLD(req.params.domain), rspDate),
        si.getSiteInfo(app, req),
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
                entry.$merge = [
                    util.getRbPageSummaryUrl(app.restbase_tpl, req.params.domain, entry.article)
                ];
                entry.view_history = getViewHistory(app, req.params.domain, start, end, entry);
                delete entry.article;
                delete entry.ns;
                return entry;
            });

            return BBPromise.all(results.map((result) => BBPromise.props(result))).then((resp) => {
                return {
                    payload: {
                        date: resultsDate,
                        articles: resp
                    },
                    meta: { revision: dateUtil.dateStringFrom(req) }
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

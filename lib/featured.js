/**
 * To retrieve TFA -- Today's featured article -- for a given date.
 */

'use strict';

const crypto = require('crypto');
const domino = require('domino');
const BBPromise = require('bluebird');
const api = require('./api-util');

const si = require('./siteinfo');
const dateUtil = require('./date-util');
const util = require('./util');

const HTTPError = util.HTTPError;

const NS_SPECIAL = '-1';

const supportedDomains = [ 'bg', 'bn', 'bs', 'cs', 'de', 'el', 'en', 'fa', 'he', 'hu', 'ja',
    'la', 'no', 'sco', 'sd', 'sv', 'ur', 'vi', 'zh' ].map((lang) => `${lang}.wikipedia.org`);

// eslint-disable-next-line no-restricted-syntax
const isSupported = (domain) => supportedDomains.includes(domain);

/**
 * Builds the request to get the Special:FeedItem provided by the FeaturedFeed extension.
 * @param {!string} req the request object
 * @param {!Object} siteinfo
 * @param {!Date} date for which day the featured article is requested
 * @return {!Promise} a promise resolving as an JSON object containing the response
 */
const requestFeaturedFeedSpecialItem = (req, siteinfo, date) => {
    const lang = siteinfo.general.lang;
    const localizedNamespaceSpecial = siteinfo.namespaces[NS_SPECIAL].name.replace(/ /g, '_');
    const feedItemAliasInfo = siteinfo.specialpagealiases.find((i) => i.realname === 'FeedItem');
    const feedItemAlias = (feedItemAliasInfo && feedItemAliasInfo.aliases[0]) || 'FeedItem';
    const dateString = `${dateUtil.formatYYYYMMDD(date)}000000`;
    const title = `${localizedNamespaceSpecial}:${feedItemAlias}/featured/${dateString}/${lang}`;
    return api.mwGet(req, title, { accept: 'text/html; charset=UTF-8' });
};

// -- functions dealing with responses:

const findPageTitle = (html) => {
    const document = domino.createDocument(html);
    const scope = document.querySelector('div#mw-content-text');
    if (!scope) {
        return;
    }

    const found = scope.querySelector('b > a, a > b');
    if (found) {
        if (found.tagName === 'A') { // b > a
            return found.getAttribute('title');
        } else { // a > b
            // the anchor is the parent node
            return found.parentNode.getAttribute('title');
        }
    }
};

/**
 * Fetches higher-quality page image form MW API
 * @param {!Object} req
 * @param {!string} title
 * @return {Promise<Object>}
 */
const fetchHighQualityPageImage = (req, title) => {
    return api.mwApiGet(req, {
        action: 'query',
        format: 'json',
        formatversion: 2,
        prop: 'pageimages',
        piprop: 'thumbnail|original',
        pithumbsize: 640,
        pilicense: 'any',
        titles: title
    })
    .then((res) => {
        if (res.body &&
            res.body.query &&
            res.body.query.pages &&
            res.body.query.pages.length &&
            res.body.query.pages[0].thumbnail &&
            res.body.query.pages[0].original) {
            const thumbnail = res.body.query.pages[0].thumbnail;
            const originalimage = res.body.query.pages[0].original;
            thumbnail.source = thumbnail.source.replace(/^http:/, 'https:');
            originalimage.source = originalimage.source.replace(/^http:/, 'https:');
            return { thumbnail, originalimage };
        }
    });
};

const createSha1 = (input) => {
    const shasum = crypto.createHash('sha1');
    shasum.update(input);
    return shasum.digest('hex');
};

// -- main

const promise = (app, req) => {
    let pageTitle;
    const domain = req.params.domain;
    const aggregated = !!req.query.aggregated;

    if (!dateUtil.validate(dateUtil.hyphenDelimitedDateString(req))) {
        if (aggregated) {
            return BBPromise.resolve({});
        }
        dateUtil.throwDateError();
    }

    if (!isSupported(domain)) {
        if (aggregated) {
            return BBPromise.resolve({});
        } else {
            throw new HTTPError({
                status: 404,
                type: 'not_found',
                title: 'Not found',
                detail: 'The language you have requested is not yet supported.'
            });
        }
    }

    const requestedDate = dateUtil.getRequestedDate(req);
    if (domain === 'de.wikipedia.org' && !(dateUtil.isWithinLast3Days(requestedDate))) {
        return BBPromise.resolve({});
    }

    return si.getSiteInfo(req)
    .then((si) => requestFeaturedFeedSpecialItem(req, si, requestedDate)
    .then((featured) => {
        pageTitle = findPageTitle(featured.body);
        if (!pageTitle) {
            return BBPromise.resolve({});
        }
        const dbTitle = util.getDbTitle(pageTitle, si);
        const vary = [];
        if (si.variants && si.variants.length > 1) {
            vary.push('accept-language');
        }
        return {
            payload: api.restGetSummary(req, dbTitle),
            meta: { etag: createSha1(dbTitle), vary },
            // will be moved into summary before returning the result
            $fetchHighQualityImage: fetchHighQualityPageImage(req, dbTitle)
        };
    })
    .then((result) => util.promiseAwaitAll(result, true, req.logger))
    .then((resolvedResult) => {
        if (resolvedResult.$fetchHighQualityImage) {
            Object.assign(resolvedResult.payload, resolvedResult.$fetchHighQualityImage);
        }
        delete resolvedResult.$fetchHighQualityImage;
        return resolvedResult;
    })
    .catch((err) => {
        if (aggregated) {
            return BBPromise.resolve({});
        }
        throw err;
    }));
};

module.exports = {
    promise,
    supportedDomains,
    testing: {
        findPageTitle,
        isSupported
    }
};

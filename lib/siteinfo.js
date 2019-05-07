// use strict;

const api = require('./api-util');

const siteInfoCache = {};

function findSharedRepoDomain(siteInfoRes) {
    const sharedRepo = (siteInfoRes.body.query.repos || []).find((repo) => {
        return repo.name === 'shared';
    });
    if (sharedRepo) {
        const domainMatch = /^((:?https?:)?\/\/[^/]+)/.exec(sharedRepo.descBaseUrl);
        if (domainMatch) {
            return domainMatch[0];
        }
    }
}

/**
 * Builds a request for siteinfo data for the MW site for the request domain.
 *
 * @param {!Object} app the application object
 * @param {!Object} req the request object
 * @return {!Promise} a promise resolving as an JSON object containing the response
 */
function getSiteInfo(app, req) {
    const rp = req.params;
    if (!siteInfoCache[rp.domain]) {
        const query = {
            action: 'query',
            meta: 'siteinfo|allmessages',
            siprop: 'general|languagevariants|namespaces|namespacealiases|specialpagealiases',
            ammessages: 'toc'
        };
        siteInfoCache[rp.domain] = api.mwApiGet(app, req.params.domain, query)
            .then((res) => {
                const general = res.body.query.general;
                const allmessages = res.body.query.allmessages;

                return {
                    general: {
                        mainpage: general.mainpage,
                        lang: general.lang,
                        legaltitlechars: general.legaltitlechars,
                        case: general.case,
                        mobileserver: general.mobileserver,
                        toctitle: allmessages[0].content
                    },
                    variants: res.body.query.languagevariants &&
                        res.body.query.languagevariants[general.lang] &&
                        Object.keys(res.body.query.languagevariants[general.lang]),
                    namespaces: res.body.query.namespaces,
                    namespacealiases: res.body.query.namespacealiases,
                    specialpagealiases: res.body.query.specialpagealiases,
                    sharedRepoRootURI: findSharedRepoDomain(res)
                };
            });
    }
    return siteInfoCache[rp.domain];
}

module.exports = { getSiteInfo };

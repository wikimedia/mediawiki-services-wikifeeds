'use strict';

const util = require('../lib/util');
const news = require('../lib/news');

/**
 * The main router object
 */
const router = util.router();

/**
 * The main application object reported when this module is require()d
 */
let app;

/**
 * GET {domain}/api/rest_v1/page/news
 *
 * Get descriptions of current events and related article links.
 * Experimental and English-only.
 */
router.get('/news', (req, res) => news.promise(app, req)
    .then((response) => {
        if (response.payload) {
            util.setETag(res, response.meta && response.meta.etag);
            if (response.meta.vary) {
                res.header('vary', response.meta.vary.join(','));
            }
            util.setContentType(res, util.CONTENT_TYPES.unpublished);
            res.status(200).json(response.payload);
        } else {
            res.status(204).end();
        }
    }));

module.exports = function (appObj) {
    app = appObj;
    return {
        path: '/page',
        api_version: 1,
        router
    };
};

'use strict';

const util = require('../lib/util');
const lib = require('../lib/did-you-know');

/**
 * The main router object
 */
const router = util.router();

/**
 * The main application object reported when this module is require()d
 */
let app;

/**
 * GET {domain}/v1/feed/did-you-know
 * Returns the current "Did you know" items from Wikipedia
 */
router.get('/did-you-know', (req, res) => lib.promise(app, req)
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
        path: '/feed',
        api_version: 1,
        router
    };
};

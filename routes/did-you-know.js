'use strict';

const util = require('../lib/util');
const lib = require('../lib/did-you-know');
const uuidv1 = require('uuid').v1;

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
            if (response.meta.vary) {
                res.header('vary', response.meta.vary.join(','));
            }
            res.set('etag', uuidv1());
            res.set('cache-control', 's-maxage=300, max-age=60');
            util.setContentType(res, util.CONTENT_TYPES.dyk);
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

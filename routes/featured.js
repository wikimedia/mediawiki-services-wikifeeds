/**
 * Featured article of the day
 */

'use strict';

const util = require('../lib/util');
const featured = require('../lib/featured');

/**
 * The main router object
 */
const router = util.router();

/**
 * The main application object reported when this module is require()d
 */
let app;

/**
 * GET {domain}/v1/page/featured/{year}/{month}/{day}
 * Gets the title for a featured article of a given date.
 */
router.get('/featured/:yyyy/:mm/:dd', (req, res) => featured.promise(app, req)
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

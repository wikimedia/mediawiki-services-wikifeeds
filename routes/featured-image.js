/**
 * Picture of the day
 */

'use strict';

const si = require('../lib/siteinfo');
const util = require('../lib/util');
const featured = require('../lib/featured-image');

/**
 * The main router object
 */
const router = util.router();

/**
 * The main application object reported when this module is require()d
 */
let app;

/**
 * GET {domain}/v1/media/image/featured/{year}/{month}/{day}
 * Gets the title and other metadata for the picture of the day of a given date.
 * ETag is set to the pageid and the revision.
 */
router.get('/image/featured/:yyyy/:mm/:dd', (req, res) => {
    return si.getSiteInfo(req)
    .then((si) => featured.promise(app, req, si)
    .then((response) => {
        if (response.payload) {
            util.setETag(res, response.meta && response.meta.tid);
            util.setContentType(res, util.CONTENT_TYPES.unpublished);
            res.status(200).json(response.payload);
        } else {
            res.status(204).end();
        }
    }));
});

module.exports = function (appObj) {
    app = appObj;
    return {
        path: '/media',
        api_version: 1,
        router
    };
};

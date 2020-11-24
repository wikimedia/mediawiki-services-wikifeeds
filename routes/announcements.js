'use strict';

const util = require('../lib/util');
const announcements = require('../lib/announcements');

/**
 * The main router object
 */
const router = util.router();

/**
 * GET /announcements
 * Gets the announcements available for clients
 */
router.get('/announcements', (req, res) => {
    const json = announcements.getAnnouncements(req.params.domain);
    const hash = util.hashCode(JSON.stringify(json));

    res.status(200);
    util.setContentType(res, util.CONTENT_TYPES.announcements);
    util.setETag(res, hash);
    res.set('Cache-Control', 'public, max-age=86400, s-maxage=900');
    res.json(json);
});

module.exports = function () {
    return {
        path: '/feed',
        api_version: 1,
        router
    };
};

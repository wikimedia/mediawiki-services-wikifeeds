'use strict';

const util = require('../lib/util');
const configuration = require('../lib/configuration/configuration');

/**
 * The main router object
 */
const router = util.router();

/**
 * GET /configuration
 * Gets remote configuration parameters for various clients.
 */
router.get('/configuration', (req, res) => {
    const json = configuration.getConfiguration(req.params.domain);
    const hash = util.hashCode(JSON.stringify(json));

    res.status(200);
    util.setContentType(res, util.CONTENT_TYPES.configuration);
    util.setETag(res, hash);
    res.set('Cache-Control', 's-maxage=300, max-age=60');
    res.json(json);
});

module.exports = function () {
    return {
        path: '/feed',
        api_version: 1,
        router
    };
};

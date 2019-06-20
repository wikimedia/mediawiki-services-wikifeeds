/**
 * random-card-single returns information about single random article suited
 * to card-type presentations.
 */

'use strict';

const util = require('../lib/util');
const randomPage = require('../lib/random');

/**
 * The main router object
 */
const router = util.router();

function buildResponse(title) {
    return { items: [ { title } ] };
}

/**
 * GET {domain}/v1/page/random/title
 * Returns a single random result well suited to card-type layouts, i.e.
 * one likely to have an image url, text extract and wikidata description.
 *
 * Multiple random items are requested, but only the result having
 * the highest relative score is returned. Requesting about 12 items
 * seems to consistently produce a really "good" result.
 */
router.get('/random/title', (req, res) => {
    return randomPage.promise(req)
    .then((result) => {
        res.status(200);
        util.setETag(res, result.meta.etag);
        util.setContentType(res, util.CONTENT_TYPES.random);
        res.json(buildResponse(result.title)).end();
    });
});

module.exports = function (appObj) {
    return {
        path: '/page',
        api_version: 1,
        router
    };
};

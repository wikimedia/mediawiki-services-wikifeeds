/**
 * random-card-single returns information about single random article suited
 * to card-type presentations.
 */

'use strict';

const util = require('../lib/util');
const lib = require('../lib/random');

/**
 * The main router object
 */
const router = util.router();

/**
 * GET {domain}/v1/page/random/title
 * Returns a single random result well suited to card-type layouts, i.e.
 * one likely to have an image url, text extract and wikidata description.
 *
 * Multiple random items are requested, but only the result having
 * the highest relative score is returned. Requesting about 12 items
 * seems to consistently produce a really "good" result.
 */
router.get('/random/title', (req, res) => lib.promise(req).then((title) => {
        res.status(200);
        util.setContentType(res, util.CONTENT_TYPES.random);
        res.json({ items: [ { title } ] }).end();
    }));

const RANDOM_FORMATS = [
    'title',
    'html',
    'summary',
    'related',
    'mobile-sections',
    'mobile-sections-lead'
];
const RANDOM_FORMAT_REGEX = RANDOM_FORMATS.join('|');

/**
 * GET {domain}/v1/page/random/redirect/{format}
 * Returns a redirect to a single random result well suited to card-type layouts, i.e.
 * one likely to have an image url, text extract and wikidata description.
 *
 * The redirect will be based on the format requested and point to /page/{format} rest endpoints.
 */
router.get(`/random/redirect/:format(${ RANDOM_FORMAT_REGEX })`, async (req, res) => {
    const title = await lib.promise(req);
    const format = req.params.format;
    const domain = req.params.domain;
    const randomURI = `https://${ domain }/api/rest_v1/page/${ format }/${ title }`;
    res.set('cache-control', 'private, max-age=0, s-maxage=0, must-revalidate');
    res.redirect(303, randomURI);
});

module.exports = function () {
    return {
        path: '/page',
        api_version: 1,
        router
    };
};

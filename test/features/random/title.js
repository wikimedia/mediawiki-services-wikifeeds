'use strict';

const assert = require('../../utils/assert');
const random = require('../../../lib/random');
const sample = require('./sample-results');
const server = require('../../utils/server');
const preq = require('preq');

describe('random/title', function () {
    this.timeout(10000);
    before(() => server.start());
    after(() => server.stop());

    it('pickBestResult should select best-scored title from sample', () => {
        const best = random.pickBestResult(sample);
        assert.ok(best.title === 'William Ellis (Medal of Honor)');
    });

    it('redirects to the right format with random title - html', function () {
        const domain = 'en.wikipedia.org';
        const path = '/v1/page/random/html';
        const uri = `${server.config.uri}${domain}${path}`;
        return preq.get({ uri, followRedirect: false }).then((res) => {
            const expectedPath = 'https://en.wikipedia.org/api/rest_v1/page/html/';
            assert.status(res, '303');
            assert.ok(res.headers.location.startsWith(expectedPath));
        })
    });

    it('redirects to the right format with random title - invalid format', function () {
        const domain = 'en.wikipedia.org';
        const path = '/v1/page/random/invalid-format';
        const uri = `${server.config.uri}${domain}${path}`;
        return preq.get({ uri, followRedirect: false }).catch((res) => {
            assert.status(res, '404');
        })
    });
});
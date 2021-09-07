'use strict';

const preq = require('preq');
const assert = require('../../utils/assert');
const server = require('../../utils/server');
const nock = require('nock');

describe('most-read articles', function() {

    this.timeout(20000); // eslint-disable-line no-invalid-this

    before(() => server.start());

    it('Should return 200 even if title has invalid utf8 encoding', () => {
        const uri = `${server.config.uri}cu.wikipedia.org/v1/page/most-read/2021/09/06?aggregated=true`;
        return preq.get({ uri })
            .then((res) => {
                assert.status(res, 200);
                assert.deepEqual(res.body.articles.length, 30, 'Expected 30 articles');
            });
    });

    it('Should filter-out invalid utf8 encoding', async () => {
        const uri = `${server.config.uri}cu.wikipedia.org/v1/page/most-read/2021/09/06?aggregated=true`;
        const scope = nock('https://wikimedia.org')
            .get('/api/rest_v1/metrics/pageviews/top/cu.wikipedia/all-access/2021/09/05')
            .reply(200, {
                items: [
                    {
                        "project": "cu.wikipedia",
                        "access": "all-access",
                        "year": "2021",
                        "month": "09",
                        "day": "05",
                        "articles": [
                            {
                                "article": "�’икипєдїѩ_бєсѣда:Обьщєниꙗ_съвѣтъ",
                                "views": 302,
                                "rank": 1
                            },
                            {
                                "article": "Словѣньскъ_ѩꙁꙑкъ",
                                "views": 10,
                                "rank": 2
                            }
                        ]
                    }
                ]
            });

        const res = await preq.get({ uri });
        assert.status(res, 200);
        assert.deepEqual(res.body.articles.length, 1, 'Article with invalid utf-8 should be filtered out');
        scope.done();
    });
});

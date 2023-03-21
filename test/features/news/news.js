'use strict';

const preq = require('preq');
const assert = require('../../utils/assert');
const server = require('../../utils/server');
const NEWS_TEMPLATES = require('../../../etc/news-sites');

describe('news', function() {

    this.timeout(20000); // eslint-disable-line no-invalid-this

    before(() => server.start());

    for (const lang in NEWS_TEMPLATES) {
        if ({}.hasOwnProperty.call(NEWS_TEMPLATES, lang)) {
            it(`${lang}: results list should have expected properties`, () => {
                return preq.get({ uri: `${server.config.uri + lang}.wikipedia.org/v1/page/news` })
                    .then((res) => {
                        assert.deepEqual(res.status, 200);
                        assert.ok(res.body.length >= 0);
                        res.body.forEach((elem) => {
                            assert.ok(elem.story, 'story should be present');
                            assert.ok(elem.links, 'links should be present');
                            elem.links.forEach(assert.isSummary);
                        });
                    });
            });
        }
    }
});

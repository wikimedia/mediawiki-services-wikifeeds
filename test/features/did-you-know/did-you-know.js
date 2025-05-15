'use strict';

const preq = require('preq');
const assert = require('../../utils/assert');
const server = require('../../utils/server');
const DYK_TEMPLATES = require('../../../etc/dyk-sites');

describe('did-you-know', function() {

    this.timeout(20000); // eslint-disable-line no-invalid-this

    before(() => server.start());

    for (const lang in DYK_TEMPLATES) {
        if ({}.hasOwnProperty.call(DYK_TEMPLATES, lang)) {
            it(`${lang}: results list should have expected properties`, () => {
                return preq.get({ uri: `${server.config.uri + lang}.wikipedia.org/v1/feed/did-you-know` })
                    .then((res) => {
                        assert.deepEqual(res.status, 200);
                        assert.ok(res.body.length > 0);
                        res.body.forEach((elem) => {
                            assert.ok(elem.html, 'html should be present');
                            assert.ok(elem.text, 'text should be present');
                        });
                    });
            });
        }
    }
});

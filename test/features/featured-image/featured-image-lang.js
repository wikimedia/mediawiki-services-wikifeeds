'use strict';

const preq = require('preq');
const domino = require('domino');
const assert = require('../../utils/assert.js');
const server = require('../../utils/server.js');
const supportedLanguages = require('../../../lib/featured.js').supportedSubdomains;

const dateString = '2021/01/01';

describe('featured-image-lang', function () {

    this.timeout(20000); // eslint-disable-line no-invalid-this

    before(() => {
        return server.start();
    });

    function uriForLang(lang) {
        const baseUri = `${server.config.uri}${lang}.wikipedia.org/v1/media/image/featured`;
        return `${baseUri}/${dateString}`;
    }

    function testDomain(uri, lang) {
        return preq.get(uri)
            .then((resFeaturedImage) => {
                if (resFeaturedImage.status === 200) {
                    if (resFeaturedImage.body.file_page !== '') {
                        return preq.get(resFeaturedImage.body.file_page).then((res) => {
                            if (res.status === 200) {
                                const doc = domino.createDocument(res.body);
                                const descriptions = {};
                                const descriptionElements =
                                    doc.querySelectorAll('.description[class*=lang-]') || [];

                                descriptionElements.forEach((element) => {
                                    descriptions[element.lang] = element.innerHTML.trim();
                                });

                                const langAvailable = descriptions.hasOwnProperty(lang);

                                if (!langAvailable) {
                                    assert.ok(resFeaturedImage.body.description.lang === 'en');
                                } else {
                                    assert.ok(resFeaturedImage.body.description.lang === lang);
                                }
                            }
                        });
                    }
                }
            });
    }

    for (const lang of supportedLanguages) {
        const uri = uriForLang(lang);

        it(`${lang} description`, () => {
            return testDomain(uri, lang);
        })
    }

});
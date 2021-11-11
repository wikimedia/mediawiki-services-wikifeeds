'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('../utils/assert');

const featured = require('../../lib/featured.js'); // module under test

function stringFromFixtureFile(fileName) {
    return fs.readFileSync(path.resolve(__dirname, `fixtures/${fileName}`), 'utf8');
}

describe('featured-unit', () => {
    it('isSupported should return the correct boolean', () => {
        assert.deepEqual(featured.testing.isSupported('en.wikipedia.org'), true);
        assert.deepEqual(featured.testing.isSupported('de.wikipedia.org'), true);
        assert.deepEqual(featured.testing.isSupported('zh.wikipedia.org'), true);
        assert.deepEqual(featured.testing.isSupported('it.wikipedia.org'), true);
        assert.deepEqual(featured.testing.isSupported('ko.wikipedia.org'), false);
        assert.deepEqual(featured.testing.isSupported('tr.wikipedia.org'), true);
        assert.deepEqual(featured.testing.isSupported('en.wikipedia.beta.wmflabs.org'), false);
    });

    it('findPageTitle should find the first bold link: a inside b', () => {
        const htmlString = stringFromFixtureFile('multiple-bold-links.html');
        assert.deepEqual(featured.testing.findPageTitle(htmlString), 'Number 1');
    });

    it('findPageTitle should find the first bold link: b inside a', () => {
        const htmlString = stringFromFixtureFile('bold-inside-anchor.html');
        assert.deepEqual(featured.testing.findPageTitle(htmlString), 'Number 1');
    });

    it('findPageTitle should return undefined if nothing found', () => {
        const htmlString = stringFromFixtureFile('only-regular-links.html');
        assert.deepEqual(featured.testing.findPageTitle(htmlString), undefined);
    });
});

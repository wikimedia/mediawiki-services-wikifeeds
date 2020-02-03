'use strict';

const assert = require('../utils/assert');
const random = require('../../lib/random');
const sample =  require('./fixtures/api-query-random-results');

describe('random', () => {

    it('pickBestResult should select best-scored title from sample', () => {
        const best = random.pickBestResult(sample);
        assert.ok(best.title === 'William Ellis (Medal of Honor)');
    });

});

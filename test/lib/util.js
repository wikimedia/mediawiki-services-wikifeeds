'use strict';

const BBPromise = require('bluebird');
const util = require('../../lib/util');
const assert = require('../utils/assert');

describe('util', () => {
    const nestedPromisesObject = () => ({
        string: 'string',
        promise_fulfilled: BBPromise.resolve('promise_fulfilled'),
        promise_rejected: BBPromise.reject('promise_rejected'),
        array: [ 'string', BBPromise.resolve('promise_fulfilled'), BBPromise.reject('promise_rejected') ],
        nested: {
            string: 'string',
            promise_fulfilled: BBPromise.resolve('promise_fulfilled'),
            promise_rejected: BBPromise.reject('promise_rejected'),
        }
    });

    it('promiseAwaitAll, ignoreRejected', () => {
        return util.promiseAwaitAll(nestedPromisesObject(), true)
        .then((result) => {
            assert.deepEqual(result, {
                string: 'string',
                promise_fulfilled: 'promise_fulfilled',
                array: [ 'string', 'promise_fulfilled' ],
                nested: {
                    string: 'string',
                    promise_fulfilled: 'promise_fulfilled'
                }
            });
        });
    });

    it('promiseAwaitAll, propagate rejected', () => {
        return util.promiseAwaitAll(nestedPromisesObject(), false)
        .then(() => {
            throw new assert.AssertionError({ message: 'Rejection expected'});
        }, () => {
            // expected
        })
    });

    describe('removeDuplicateTitles', () => {
        it('deduplicates and applies update function', () => {
            const data = [ { title: 'Foo', count: 1 }, { title: 'Foo', count: 1 } ];
            const update = (orig, dupe) => {
                orig.count += dupe.count;
                return orig;
            };
            const result = util.removeDuplicateTitles(data, update);
            assert.deepEqual(result.length, 1);
            assert.deepEqual(result[0].count, 2);
        });
    });
});
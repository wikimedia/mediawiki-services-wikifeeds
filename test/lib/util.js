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
    })
});
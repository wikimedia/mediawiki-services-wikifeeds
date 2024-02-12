/* eslint-disable no-console */

'use strict';


const assert = require('assert');
const _ = require('lodash');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats= require('ajv-formats');
const fs = require('fs');

let summaryValidator;
function getSummaryValidator() {
    if (summaryValidator) {
        return summaryValidator;
    }
    const spec = yaml.load(fs.readFileSync(`${__dirname}/../../spec.yaml`));
    const ajv = new Ajv({});
    addFormats(ajv, { formats: ['date-time'] });
    ajv.addKeyword( { keyword: "example", type: "string" } );

    Object.keys(spec.definitions).forEach((defName) => {
        ajv.addSchema(spec.definitions[defName], `#/definitions/${defName}`);
    });
    summaryValidator = (object, message) => {
        if (!ajv.validate('#/definitions/summary', object)) {
            throw new assert.AssertionError({ message: message ? message : ajv.errorsText() });
        }
    }
    return summaryValidator;
}

function deepEqual(result, expected, message) {

    try {
        assert.deepEqual(result, expected, message);
    } catch (e) {
        console.log(`Expected:\n${JSON.stringify(expected, null, 2)}`);
        console.log(`Result:\n${JSON.stringify(result, null, 2)}`);
        throw e;
    }

}


/**
 * Asserts whether the return status was as expected
 */
function status(res, expected) {

    deepEqual(res.status, expected,
        `Expected status to be ${expected}, but was ${res.status}`);

}


/**
 * Asserts whether content type was as expected
 */
function contentType(res, expectedRegexString) {

    const actual = res.headers['content-type'];
    assert.ok(RegExp(expectedRegexString).test(actual),
        `Expected content-type to match ${expectedRegexString}, but was ${actual}`);

}


function isDeepEqual(result, expected, message) {

    try {
        assert.deepEqual(result, expected, message);
        return true;
    } catch (e) {
        return false;
    }

}


function notDeepEqual(result, expected, message) {

    try {
        assert.notDeepEqual(result, expected, message);
    } catch (e) {
        console.log(`Not expected:\n${JSON.stringify(expected, null, 2)}`);
        console.log(`Result:\n${JSON.stringify(result, null, 2)}`);
        throw e;
    }

}


function fails(promise, onRejected) {

    let failed = false;

    function trackFailure(e) {
        failed = true;
        return onRejected(e);
    }

    function check() {
        if (!failed) {
            throw new Error('expected error was not thrown');
        }
    }

    return promise.catch(trackFailure).then(check);

}

/**
 * @param {?number} result
 * @param {!number} expected
 * @param {!number} delta
 * @param {?string} message
 */
function closeTo(result, expected, delta, message) {
    assert.ok(_.isNumber(result) && Math.abs(result - expected) <= delta,
        message || `Result is ${result}; expected ${expected} ± ${delta}`);
}

/**
 * Asserts that the passed object is a valid response summary.
 * @param {!Object} object
 * @param {?string} message
 */
function isSummary(object, message) {
    getSummaryValidator()(object, message);
    // Support legacy pre summary 2.0 clients.
    assert.strictEqual( -1, object.title.indexOf(' '),
        'Legacy clients: title uses _ and not spaces');
    assert.ok( object.normalizedtitle,
        'Legacy clients: has normalizedtitle property');
}



module.exports.ok             = assert.ok;
module.exports.throws         = assert.throws;
module.exports.fails          = fails;
module.exports.deepEqual      = deepEqual;
module.exports.isDeepEqual    = isDeepEqual;
module.exports.notDeepEqual   = notDeepEqual;
module.exports.contentType    = contentType;
module.exports.status         = status;
module.exports.closeTo        = closeTo;
module.exports.isSummary      = isSummary;
module.exports.AssertionError = assert.AssertionError;


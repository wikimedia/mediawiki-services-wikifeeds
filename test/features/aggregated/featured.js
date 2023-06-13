'use strict';

const preq = require('preq');
const assert = require('../../utils/assert');
const server = require('../../utils/server');

describe('aggregated featured', function () {
    this.timeout(10000);
    before(() => server.start());

    it('should return 200 for a valid request', function () {
        const path = '/v1/aggregated/featured/2016/04/01'
        const domain = 'en.wikipedia.org'
        return preq.get({
            uri: `${server.config.uri}${domain}${path}`
        }).then(function (res) {
            assert.status(res, '200')
        })
    })

    it('should return 404 for an invalid year', function () {
        const path = '/v1/aggregated/featured/12345/04/01'
        const domain = 'en.wikipedia.org'
        return preq.get({
            uri: `${server.config.uri}${domain}${path}`
        }).catch(function (res) {
            assert.status(res, 404)
        })
    })

    it('should return 404 for an invalid month', function () {
        const path = '/v1/aggregated/featured/2016/13/01'
        const domain = 'en.wikipedia.org'
        return preq.get({
            uri: `${server.config.uri}${domain}${path}`
        }).catch(function (res) {
            assert.status(res, 404)
        })
    })

    it('should return 404 for an invalid day', function () {
        const path = '/v1/aggregated/featured/2016/04/45'
        const domain = 'en.wikipedia.org'
        return preq.get({
            uri: `${server.config.uri}${domain}${path}`
        }).catch(function (res) {
            assert.status(res, 404)
        })
    })

    it('should return only historic keys for past date', function () {
        const path = '/v1/aggregated/featured/2016/04/01'
        const domain = 'en.wikipedia.org'
        return preq.get({
            uri: `${server.config.uri}${domain}${path}`
        }).then(function (res) {
            assert.ok(Object.keys(res.body), ["tfa", "mostread", "image", "onthisday"])
        })
    })

    it('should return current keys for today', function () {
        const now = new Date();
        const year = now.getUTCFullYear()
        const month = `${now.getUTCMonth() + 1}`.padStart(2, "0")
        const day = `${now.getUTCDate()}`.padStart(2, "0")
        const path = `/v1/aggregated/featured/${year}/${month}/${day}`
        const domain = 'en.wikipedia.org'
        return preq.get({
            uri: `${server.config.uri}${domain}${path}`
        }).then(function (res) {
            assert.ok(Object.keys(res.body), ["tfa", "mostread", "image", "news", "onthisday"])
        })
    })

    it('should return future keys for tomorrow', function () {
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)
        const year = tomorrow.getUTCFullYear()
        const month = `${tomorrow.getUTCMonth() + 1}`.padStart(2, "0")
        const day = `${tomorrow.getUTCDate()}`.padStart(2, "0")
        const path = `/v1/aggregated/featured/${year}/${month}/${day}`
        const domain = 'en.wikipedia.org'
        return preq.get({
            uri: `${server.config.uri}${domain}${path}`
        }).then(function (res) {
            assert.deepEqual(Object.keys(res.body), ["tfa", "image", "news", "onthisday"])
        })
    })

})

describe('aggregate onthisday', function () {
    this.timeout(10000);
    before(() => server.start());

    it('should return 200 for a valid request', function () {
        const path = '/v1/aggregated/onthisday/all/04/01'
        const domain = 'en.wikipedia.org'
        return preq.get({
            uri: `${server.config.uri}${domain}${path}`
        }).then(function (res) {
            assert.status(res, '200')
        })
    })

    it('should return 404 for an invalid month', function () {
        const path = '/v1/aggregated/onthisday/all/42/01'
        const domain = 'en.wikipedia.org'
        return preq.get({
            uri: `${server.config.uri}${domain}${path}`
        }).catch(function (res) {
            assert.status(res, 404)
        })
    })

    it('should return 404 for an invalid day', function () {
        const path = '/v1/aggregated/onthisday/all/04/42'
        const domain = 'en.wikipedia.org'
        return preq.get({
            uri: `${server.config.uri}${domain}${path}`
        }).catch(function (res) {
            assert.status(res, 404)
        })
    })

    it('should return objects with the expected keys', function () {
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)
        const month = `${tomorrow.getUTCMonth() + 1}`.padStart(2, "0")
        const day = `${tomorrow.getUTCDate()}`.padStart(2, "0")
        const path = `/v1/aggregated/onthisday/all/${month}/${day}`
        const domain = 'en.wikipedia.org'
        return preq.get({
            uri: `${server.config.uri}${domain}${path}`
        }).then(function (res) {
            assert.deepEqual(Object.keys(res.body), ["selected", "births", "deaths", "events", "holidays"])
        })
    })

})
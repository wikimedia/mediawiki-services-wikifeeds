'use strict';

const axios = require('axios').default;
const sinon = require('sinon');
const assert = require('../utils/assert');
const apiUtil = require('../../lib/api-util');
const { resolve } = require('bluebird');

describe('MW core page HTML', function () {
    let sandbox;
    this.beforeEach(function () {
        sandbox = sinon.createSandbox();
    })
    this.afterEach(function () {
        sandbox.restore()
    })

    it('fetches the core page html output only with title in params', function (done) {
        let app = { 'conf': {} }
        let fakeRes = {
            data: {
                html: '<div>Example</div>',
                id: '1234',
                timestamp: '2023-01-01T00:00:00Z'
            },
            headers: {}
        }
        let req = {
            app,
            params: {
                title: 'Earth'
            },
            headers: {'x-request-id': "1234-5678"}
        }
        sandbox.stub(axios, "request").resolves(fakeRes);

        apiUtil.setupApiTemplates(app);
        apiUtil.mwCorePageHTMLGet(req, {}).then(function (res) {
            assert.deepEqual(res.body, '<div>Example</div>');
            assert.ok(res.headers.etag.startsWith("1234/"));
            done();
        });
    });

    it('fetches the core page html output with revision in params', function (done) {
        let app = { 'conf': {} }
        let fakeRes = {
            data: {
                html: '<div>Example</div>',
                id: '1234',
                timestamp: '2023-01-01T00:00:00Z'
            },
            headers: {}
        }
        let req = {
            app,
            params: {
                revision: '1234'
            },
            headers: {'x-request-id': "1234-5678"}
        }

        apiUtil.setupApiTemplates(app);
        sandbox.stub(axios, "request").resolves(fakeRes);

        apiUtil.mwCorePageHTMLGet(req, {}).then(function (res) {
            assert.deepEqual(res.body, '<div>Example</div>');
            assert.ok(res.headers.etag.startsWith("1234/"));
            done();
        });
    });
});

'use strict';

const assert = require('../utils/assert');
const apiUtil = require('../../lib/api-util');

describe('MW core page HTML', function () {
    it('fetches the core page html output only with title in params', function (done) {
        let app = { 'conf': {} }
        let fakeRes = {
            body: {
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
            issueRequest: async (req) => {
                assert.deepEqual(req.uri.path, [
                    'w',
                    'rest.php',
                    'v1',
                    'page',
                    'Earth',
                    'with_html',
                ])
                return fakeRes;
            }
        }

        apiUtil.setupApiTemplates(app);

        apiUtil.mwCorePageHTMLGet(req, {}).then(function (res) {
            assert.deepEqual(res.body, '<div>Example</div>');
            assert.ok(res.headers.etag.startsWith("1234/"));
            done();
        });
    });
});

it('fetches the core page html output with revision in params', function (done) {
    let app = { 'conf': {} }
    let fakeRes = {
        body: {
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
        issueRequest: async (req) => {
            assert.deepEqual(req.uri.path, [
                'w',
                'rest.php',
                'v1',
                'revision',
                '1234',
                'with_html',
            ])
            return fakeRes;
        }
    }

    apiUtil.setupApiTemplates(app);

    apiUtil.mwCorePageHTMLGet(req, {}).then(function (res) {
        assert.deepEqual(res.body, '<div>Example</div>');
        assert.ok(res.headers.etag.startsWith("1234/"));
        done();
    });
});

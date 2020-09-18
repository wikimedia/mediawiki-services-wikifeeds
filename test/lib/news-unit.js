'use strict';

const domino = require('domino');
const BBPromise = require('bluebird');
const assert = require('../utils/assert');
const news = require('../../lib/news');
const fixtures = require('./news-fixtures');
const apiUtils = require('../../lib/api-util');

describe('news-unit', () => {
    let apiUtilsToRestore;
    before(() => {
        apiUtilsToRestore = Object.assign({}, apiUtils);
        apiUtils.restGetSummary = (req, title) => ({ title });
    });
    after(() => {
        Object.assign(apiUtils, apiUtilsToRestore);
    })

    const testStoryObj = {
        story: fixtures.newsHtml4,
        links: [
            { title: '100_metres_hurdles' },
            { title: 'Sport_of_athletics' },
            { title: 'Kendra_Harrison' },
            { title: "Women's_100_metres_hurdles_world_record_progression" },
            { title: 'London_Grand_Prix' }
        ]
    };

    it('news story constructed correctly (duplicate titles handled correctly)', () => {
        const html = domino.createDocument(fixtures.newsHtml3).getElementsByTagName('li')[0];
        const story = news.constructStory({
            headers: {},
            params: {
                domain: 'en.wikipedia.org'
            }
        }, 'en', html);
        assert.deepEqual(story, testStoryObj);
    });

    it('floating spans are removed', () => {
        const html = domino.createDocument(fixtures.newsHtmlWithFloatingSpan)
            .getElementsByTagName('li')[0];
        const story = news.constructStory({
            headers: {},
            params: {
                domain: 'de.wikipedia.org'
            }
        }, 'de', html);
        assert.ok(story.story.startsWith('Dem österreichischen Schriftsteller'));
    });
});

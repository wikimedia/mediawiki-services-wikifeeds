'use strict';

const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/lib/sync');
const preq = require('preq');
const assert = require('../../utils/assert');
const server = require('../../utils/server');
const testUtil = require('../../utils/testUtil');
const mostRead = require('../../../lib/most-read')

const file = fs.readFileSync(path.resolve(__dirname, '../../../private/mainpages.csv'), 'utf8');
const mainPageTitles = parse(file, 'utf8')[0];

describe('most-read articles', function() {

    this.timeout(20000); // eslint-disable-line no-invalid-this

    before(() => server.start());

    it('Should provide pageviews from day prior when aggregated flag is set', () => {
        const dayPrior = '2016-12-31Z';
        const uri = `${server.config.uri}da.wikipedia.org/v1/page/most-read/2017/01/01`;
        return preq.get({ uri, query: { aggregated: true } })
            .then((res) => {
                assert.deepEqual(res.body.articles[0].view_history[4].date, dayPrior);
            });
    });

    it('Should drop duplicate pageviews', () => {
        const uri = `${server.config.uri}en.wikipedia.org/v1/page/most-read/2017/01/10`;
        return preq.get({ uri, query: { aggregated: true } })
        .then((res) => {
            assert.deepEqual([], testUtil.findDuplicateTitles(res.body.articles));
        });
    });

    it('Should filter out missing summaries', () => {
        const uri = `${server.config.uri}da.wikipedia.org/v1/page/most-read/2020/09/22`;
        return preq.get({ uri })
        .then((res) => res.body.articles.forEach((article) => assert.isSummary(article)));
    });

    it('Should return 204 for fywiki requests', () => {
        const uri = `${server.config.uri}fy.wikipedia.org/v1/page/most-read/2016/11/12`;
        return preq.get({ uri })
            .then((res) => {
                assert.status(res, 204);
                assert.deepEqual(!!res.body, false, 'Expected the body to be empty');
            });
    });

    it('main page filtering RegExp should handle all main page title chars', () => {
        const articles = [{
            pageid: 0,
            namespace: {
                id: 0,
                text: ''
            },
            titles: {
                canonical: 'Hello_world!',
                normalized: 'Hello world',
                display: 'Hello world'
            }
        }];
        mainPageTitles.forEach((title) => {
            assert.ok(mostRead.filterSpecial(articles, title));
        });
    });
});

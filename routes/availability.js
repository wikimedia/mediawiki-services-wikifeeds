'use strict';

const util = require('../lib/util');
const tfaDomains = require('../lib/featured').supportedDomains;
const newsLangs = Object.keys(require('../etc/news-sites'));
const onThisDayLangs = Object.keys(require('../lib/on-this-day.languages').languages);

const router = util.router();

function langCodesToWikipediaDomains(langCodes) {
    return langCodes.map((lang) => `${lang}.wikipedia.org`);
}

router.get('/availability', (req, res) => {
    const response = {
        todays_featured_article: tfaDomains,
        most_read: langCodesToWikipediaDomains([ '*' ]),
        picture_of_the_day: langCodesToWikipediaDomains([ '*' ]),
        in_the_news: langCodesToWikipediaDomains(newsLangs),
        on_this_day: langCodesToWikipediaDomains(onThisDayLangs)
    };
    res.status(200);
    util.setETag(res, util.hashCode(JSON.stringify(response)));
    util.setContentType(res, util.CONTENT_TYPES.availability);
    res.json(response).end();
});

module.exports = function (appObj) {
    return {
        path: '/feed',
        api_version: 1,
        router
    };
};

/**
 * To retrieve the picture of the day for a given date.
 */

'use strict';

const BBPromise = require('bluebird');
const dateUtil = require('./date-util');
const imageinfo = require('./imageinfo');
const si = require('./siteinfo');

/**
 * Get imageinfo data for featured image (Picture of the day)
 *
 * @param  {Object} app      App object
 * @param  {Object} req      req Server request
 * @param  {Object} siteinfo Site info object
 * @return {Object}          featured image response
 */
async function promise(app, req) {
    const siteinfo = await si.getSiteInfo(req);
    const aggregated = !!req.query.aggregated;

    if (!dateUtil.validate(dateUtil.hyphenDelimitedDateString(req))) {
        if (aggregated) {
            return BBPromise.resolve({ meta: {} });
        }
        dateUtil.throwDateError();
    }

    return imageinfo.requestPictureOfTheDay(req, dateUtil.getRequestedDate(req), siteinfo)
    .catch((err) => {
        if (aggregated) {
            return BBPromise.resolve({ meta: {} });
        }
        throw err;
    });
}

module.exports = {
    promise
};

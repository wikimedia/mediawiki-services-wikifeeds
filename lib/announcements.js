'use strict';

const config = require('../etc/announcements');
const HTTPError = require('./util').HTTPError;
const striptags = require('striptags');

const plaintextFromHTML = (html) => {
    const htmlWithSpacesAndNewlines = html.replace(/&nbsp;/ig, ' ').replace(/<br\/>/ig, '\n');
    return striptags(htmlWithSpacesAndNewlines);
};

/**
 * @param {!string} os operating system, all caps ('IOS' or 'ANDROID')
 * @param {?string} id another string to distinguish different announcements, all caps
 * @return {!string} announcement id string
 */
const buildId = (os, id) => `${config.idPrefix}${os}${id}`;

const baseAnnouncement = {
    type: config.AnnouncementType.FUNDRAISING,
    start_time: config.startTime,
    end_time: config.endTime,
    domain: config.domain
    // beta: true,
    // logged_in: true,
    // reading_list_sync_enabled: true,
};

const getAnnouncementText = (countryConfig) => `To all our readers in ${countryConfig.country},<br/><br/>It's a little awkward, so we'll get straight to the point: Today we humbly ask you to defend Wikipedia's independence. We depend on donations averaging about ${countryConfig.currency}${countryConfig.average}, but 99% of our readers don't give. <b>If everyone reading this gave ${countryConfig.currency}${countryConfig.coffee}, we could keep Wikipedia thriving for years to come.</b> The price of a cup of coffee today is all we need.<br/><br/>Wikipedia is a place to learn, not a place for advertising. It unites all of us who love knowledge: contributors, readers and the donors who keep us thriving. We know that most people will ignore this message. But if Wikipedia is useful to you, please take a minute to help keep it growing. Thank you.`;
/* eslint-enable max-len */

const androidV2Announcement = (code, countryConfig) => {
    return Object.assign({}, baseAnnouncement, {
        id: buildId('ANDROIDV2', 'EN'),
        platforms: [ config.Platform.ANDROID_V2 ],
        countries: [ code.toUpperCase() ],
        border: countryConfig.border,
        placement: countryConfig.placement,
        text: getAnnouncementText(countryConfig),
        // image_url: countryConfig.imageUrl,
        // image_height: 40,
        caption_HTML: "By donating, you agree to our <a href='https://foundation.wikimedia.org/wiki/Donor_privacy_policy/en'>donor policy</a>.",
        negative_text: 'No thanks',
        action: {
            title: 'DONATE NOW',
            url: 'https://donate.wikimedia.org/?uselang=en&appeal=JimmyQuote&utm_medium=WikipediaApp&utm_campaign=Android&utm_source=app_201912_6C_control'
        }
    });
};

const iosV2Announcement = (code, countryConfig) => {
    return Object.assign({}, baseAnnouncement, {
        id: buildId('IOSV2', 'EN'),
        platforms: [ config.Platform.IOS_V2 ],
        countries: [ code.toUpperCase() ],
        border: countryConfig.border,
        placement: countryConfig.placement,
        text: getAnnouncementText(countryConfig),
        caption_HTML: "By donating, you agree to our <a href='https://foundation.wikimedia.org/wiki/Donor_privacy_policy/en'>donor policy</a>.",
        negative_text: 'No thanks',
        action: {
            title: 'DONATE NOW',
            url: 'https://donate.wikimedia.org/?uselang=en&appeal=JimmyQuote&utm_medium=WikipediaApp&utm_campaign=iOS&utm_source=app_201912_6C_control'
        }
    });
};

const iosLegacyAnnouncement = (code, countryConfig) => {
    return Object.assign({}, baseAnnouncement, {
        id: buildId('IOS', 'EN'),
        platforms: [ config.Platform.IOS ],
        countries: [ code.toUpperCase() ],
        min_version: config.iosMinVersion,
        max_version: config.iosMaxVersion,
        caption_HTML: "<p>By donating, you agree to our <a href='https://foundation.wikimedia.org/wiki/Donor_privacy_policy/en'>donor policy</a></p>.",
        border: countryConfig.border,
        placement: countryConfig.placement,
        text: plaintextFromHTML(getAnnouncementText(countryConfig)),
        action: {
            title: 'DONATE NOW',
            url: 'https://donate.wikimedia.org/?uselang=en&appeal=JimmyQuote&utm_medium=WikipediaApp&utm_campaign=iOS&utm_source=app_201912_6C_control'
        }
    });
};

function getAndroidAnnouncements(domain) {
    return Object.keys(config.countryVars)
    .map((code) => androidV2Announcement(code, config.countryVars[code]));
}

function getiOSAnnouncements(domain) {
    return Object.keys(config.countryVars)
    .map((code) => iosV2Announcement(code, config.countryVars[code]));
}

function getLegacyiOSAnnouncements(domain) {
    return Object.keys(config.countryVars)
    .map((code) => iosLegacyAnnouncement(code, config.countryVars[code]));
}

function getActiveAnnouncements(domain) {
    return getAndroidAnnouncements(domain)
        .concat(getiOSAnnouncements(domain))
        .concat(getLegacyiOSAnnouncements(domain));
}

function isActiveWiki(domain) {
    return config.activeWikis.includes(domain); // eslint-disable-line no-restricted-syntax
}

function hasEnded(now) {
    const endDate = Date.parse(config.endTime);
    if (isNaN(endDate)) {
        throw new HTTPError({
            status: 500,
            type: 'config_error',
            title: 'invalid end date in announcements config',
            detail: config.endTime
        });
    }
    return now > endDate;
}

function isActive(domain, now) {
    return isActiveWiki(domain) && !hasEnded(now);
}

function getAnnouncements(domain) {
    return {
        announce: isActive(domain, new Date()) ? getActiveAnnouncements(domain) : []
    };
}

module.exports = {
    getAnnouncements,
    testing: {
        buildId,
        getActiveAnnouncements,
        getAndroidAnnouncements,
        getiOSAnnouncements,
        getLegacyiOSAnnouncements,
        hasEnded
    }
};

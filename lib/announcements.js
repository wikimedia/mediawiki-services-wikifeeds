'use strict';

const config = require('../etc/announcements');
const HTTPError = require('./util').HTTPError;
const striptags = require('striptags');

const plaintextFromHTML = (html) => {
    const htmlWithSpacesAndNewlines = html.replace(/&nbsp;/ig, ' ').replace(/<br\/>/ig, '\n');
    return striptags(htmlWithSpacesAndNewlines);
};

/**
 * @param {!Object} campaign object, as seen in etc/announcements.js
 * @param {!string} os operating system, all caps ('IOS' or 'ANDROID')
 * @param {?string} id another string to distinguish different announcements, all caps
 * @return {!string} announcement id string
 */
const buildId = (campaign, os, id) => `${campaign.idPrefix}${os}${id}`;

const baseAnnouncement = (campaign) => {
    return {
        type: campaign.type,
        start_time: campaign.startTime,
        end_time: campaign.endTime,
        domain: campaign.domain
    };

    // beta: true,
    // logged_in: true,
    // reading_list_sync_enabled: true,
};

const getFundraisingAnnouncementText = (countryConfig) => `To all our readers in ${countryConfig.country},<br/><br/>It's a little awkward, so we'll get straight to the point: Today we humbly ask you to defend Wikipedia's independence. We depend on donations averaging about ${countryConfig.currency}${countryConfig.average}, but 99% of our readers don't give. <b>If everyone reading this gave ${countryConfig.currency}${countryConfig.coffee}, we could keep Wikipedia thriving for years to come.</b> The price of a cup of coffee today is all we need.<br/><br/>Wikipedia is a place to learn, not a place for advertising. It unites all of us who love knowledge: contributors, readers and the donors who keep us thriving. We know that most people will ignore this message. But if Wikipedia is useful to you, please take a minute to help keep it growing. Thank you.`;
/* eslint-enable max-len */

const androidV2FundraisingAnnouncement = (code, countryConfig, campaign) => {
    return Object.assign({}, baseAnnouncement(campaign), {
        id: buildId(campaign, 'ANDROIDV2', 'EN'),
        platforms: [ config.Platform.ANDROID_V2 ],
        countries: [ code.toUpperCase() ],
        border: countryConfig.border,
        placement: countryConfig.placement,
        text: getFundraisingAnnouncementText(countryConfig),
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

const androidV2SurveyAnnouncement = (campaign) => {
    return Object.assign({}, baseAnnouncement(campaign), {
        id: buildId(campaign, 'ANDROIDV2', 'EN'),
        platforms: [ config.Platform.ANDROID_V2 ],
        countries: [ 'AL', 'DZ', 'AO', 'AR', 'AM', 'AU', 'AT', 'AZ', 'BD', 'BY', 'BR', 'BG', 'CM', 'CA', 'CF', 'TD',
            'CL', 'CO', 'KM', 'CR', 'CI', 'HR', 'CY', 'CZ', 'DK', 'EC', 'EG', 'SV', 'EE', 'ET', 'DE', 'GH', 'GR', 'GT',
            'GN', 'HN', 'HK', 'HU', 'IN', 'ID', 'IE', 'IT', 'JM', 'JP', 'KE', 'KR', 'LV', 'LB', 'LT', 'MG', 'MW', 'MY',
            'ML', 'MQ', 'MR', 'MX', 'MA', 'MZ', 'NL', 'NG', 'PK', 'PY', 'PE', 'PH', 'PL', 'PT', 'PR', 'RO', 'SN', 'RS',
            'SG', 'SK', 'SI', 'ZA', 'ES', 'SE', 'CH', 'TW', 'TZ', 'TN', 'TR', 'UG', 'GB', 'US', 'UY', 'ZM', 'ZW' ],
        border: false,
        placement: 'feed',
        text: 'Help to improve the Wikipedia mobile apps by signing up to be a user tester. Take a quick survey to participate in an upcoming study or research interview.',
        caption_HTML: "View our <a href='https://foundation.m.wikimedia.org/w/index.php?title=Editing_Awareness_and_Trust_Survey_Privacy_Statement'>privacy statement</a>. Survey powered by a third party. View their <a href='https://policies.google.com/privacy'>privacy policy</a>.",
        negative_text: 'No thanks',
        action: {
            title: 'Start survey',
            url: 'https://forms.gle/DUWfFRoD9nqgStJZ7'
        }
    });
};

const iosV2FundraisingAnnouncement = (code, countryConfig, campaign) => {
    return Object.assign({}, baseAnnouncement(campaign), {
        id: buildId(campaign, 'IOSV2', 'EN'),
        platforms: [ config.Platform.IOS_V2 ],
        countries: [ code.toUpperCase() ],
        border: countryConfig.border,
        placement: countryConfig.placement,
        text: getFundraisingAnnouncementText(countryConfig),
        caption_HTML: "By donating, you agree to our <a href='https://foundation.wikimedia.org/wiki/Donor_privacy_policy/en'>donor policy</a>.",
        negative_text: 'No thanks',
        action: {
            title: 'DONATE NOW',
            url: 'https://donate.wikimedia.org/?uselang=en&appeal=JimmyQuote&utm_medium=WikipediaApp&utm_campaign=iOS&utm_source=app_201912_6C_control'
        }
    });
};

const iosV3SurveyAnnouncement = (campaign) => {
    return Object.assign({}, baseAnnouncement(campaign), {
        id: buildId(campaign, 'IOSV3', 'EN'),
        platforms: [ config.Platform.IOS_V3 ],
        border: false,
        placement: 'article',
        text: 'Help improve Wikipedia by taking a quick survey about this article',
        caption_HTML: "View our <a href='https://foundation.m.wikimedia.org/w/index.php?title=Editing_Awareness_and_Trust_Survey_Privacy_Statement'>privacy statement</a>. Survey powered by a third-party. View their <a href='https://policies.google.com/privacy'>privacy policy</a>.",
        negative_text: 'No thanks',
        action: {
            title: 'Start survey',
            url: 'https://docs.google.com/forms/d/e/1FAIpQLSeoMkmpSHiolH5tmEdbpbtbmphXFCWqyGlqj6GBWrOHV-P1hQ/viewform??usp=pp_url&entry.366807840={{articleTitle}}'
        },
        articleTitles: [
            'Chernobyl disaster',
            'Media',
            'United States',
            'Wikipedia',
            'Lists of deaths by year#2019',
            'Parasite (2019 film)',
            'Deaths in 2020',
            '2019–20 coronavirus pandemic',
            'The Last of Us Part II',
            'Capitol Hill Autonomous Zone',
            'Elon Musk',
            'Black Lives Matter',
            'Anthony Fauci',
            'Afghanistan',
            'Antifa (United States)',
            'Death of Elijah McClain',
            'Karen (slang)',
            'Boogaloo movement'
        ],
        displayDelay: 30
    });
};

const iosLegacyFundraisingAnnouncement = (code, countryConfig, campaign) => {
    return Object.assign({}, baseAnnouncement(campaign), {
        id: buildId(campaign, 'IOS', 'EN'),
        platforms: [ config.Platform.IOS ],
        countries: [ code.toUpperCase() ],
        min_version: '5.8.0',
        max_version: '6.1.0',
        caption_HTML: "<p>By donating, you agree to our <a href='https://foundation.wikimedia.org/wiki/Donor_privacy_policy/en'>donor policy</a></p>.",
        border: countryConfig.border,
        placement: countryConfig.placement,
        text: plaintextFromHTML(getFundraisingAnnouncementText(countryConfig)),
        action: {
            title: 'DONATE NOW',
            url: 'https://donate.wikimedia.org/?uselang=en&appeal=JimmyQuote&utm_medium=WikipediaApp&utm_campaign=iOS&utm_source=app_201912_6C_control'
        }
    });
};

function getAndroidFundraisingAnnouncements(campaign) {
    return Object.keys(campaign.countryVars)
    .map((code) => androidV2FundraisingAnnouncement(code, campaign.countryVars[code], campaign));
}

function getAndroidSurveyAnnouncements(campaign) {
    return [].concat(androidV2SurveyAnnouncement(campaign));
}

function getiOSFundraisingAnnouncements(campaign) {
    return Object.keys(campaign.countryVars)
    .map((code) => iosV2FundraisingAnnouncement(code, campaign.countryVars[code], campaign));
}

function getiOSSurveyAnnouncements(campaign) {
    return [].concat(iosV3SurveyAnnouncement(campaign));
}

function getLegacyiOSFundraisingAnnouncements(campaign) {
    return Object.keys(campaign.countryVars)
    .map((code) => iosLegacyFundraisingAnnouncement(code, campaign.countryVars[code], campaign));
}

function getAnnouncementsForCampaign(campaign) {
    switch (campaign.idPrefix) {
        case 'FUNDRAISING19':
            return getAndroidFundraisingAnnouncements(campaign)
            .concat(getiOSFundraisingAnnouncements(campaign))
            .concat(getLegacyiOSFundraisingAnnouncements(campaign));
        case 'IOSSURVEY20':
            return getiOSSurveyAnnouncements(campaign);
        case 'ANDROIDSURVEY20':
            return getAndroidSurveyAnnouncements(campaign);
    }
}

function hasEnded(campaign, now) {
    const endDate = Date.parse(campaign.endTime);
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

function getActiveCampaigns(domain, now) {
    return config.campaigns.filter((campaign) =>
    campaign.activeWikis.includes(domain) && // eslint-disable-line no-restricted-syntax
    !hasEnded(campaign, now));
}

function getAnnouncements(domain) {
    var announcements = [];
    const activeCampaigns = getActiveCampaigns(domain, new Date());
    activeCampaigns.forEach((campaign) => {
        announcements.push(...getAnnouncementsForCampaign(campaign));
    });

    return {
        announce: announcements
    };
}

module.exports = {
    getAnnouncements,
    testing: {
        buildId,
        getActiveCampaigns,
        getAnnouncementsForCampaign,
        getAndroidFundraisingAnnouncements,
        getiOSFundraisingAnnouncements,
        getLegacyiOSFundraisingAnnouncements,
        hasEnded
    }
};

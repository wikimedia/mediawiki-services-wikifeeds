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
const buildId = (campaign, os, id) => `${ campaign.idPrefix }${ os }${ id }`;

const baseAnnouncement = (campaign) => ({
        type: campaign.type,
        start_time: campaign.startTime,
        end_time: campaign.endTime,
        domain: campaign.domain
    })

    // beta: true,
    // logged_in: true,
    // reading_list_sync_enabled: true,
;

const getFundraisingAnnouncementText = (countryConfig) => `<b>Wikipedia is still not on the market.</b><br><i>An important update from Jimmy Wales</i><br><br>Please don’t skip this 1-minute read. Today I ask you to reflect on the number of times you have used Wikipedia this year, the value you got from it, and whether you’re able to give ${ countryConfig.currency }${ countryConfig.coffee } to the nonprofit that supports it. Wikipedia is written by everyone, together. We want everyone to have equal access to high-quality information. If Wikipedia has given you ${ countryConfig.currency }${ countryConfig.coffee } worth of knowledge, please join the 2% of readers who donate. There are no small contributions: every edit counts, every donation counts. Thank you. — <i>Jimmy Wales, founder, Wikimedia Foundation</i>`;

const androidV2FundraisingAnnouncement = (code, countryConfig, campaign) => Object.assign({}, baseAnnouncement(campaign), {
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
            url: 'https://donate.wikimedia.org/?uselang=en&appeal=JimmyQuote&utm_medium=WikipediaApp&utm_campaign=Android&utm_source=app_2023_en6C_Android_control'
        }
    });

const japanFundraisingAnnouncement = (code, countryConfig, campaign, os, platforms) => Object.assign({}, baseAnnouncement(campaign), {
        id: buildId(campaign, os.toUpperCase(), code.toUpperCase()),
        platforms: platforms,
        countries: [ code.toUpperCase() ],
        border: countryConfig.border,
        placement: countryConfig.placement,
        text: '<b>ウィキペディアは売り物ではありません。</b><br>ジミー・ウェールズから皆様へのメッセージ<br>1分で結構です、どうか読み飛ばさないでください。今日は皆様に、ぜひお考えいただきたいことがあります。この1年間でウィキペディア アプリをどれほど使い、そこでどんな価値を得たか、そして¥300 のご寄付が可能かどうかです。ウィキメディア財団のウィキペディアを含むプロジェクト群を支える技術は、読者の皆様によって支えられています。非営利団体であるということは、誰かがウィキペディアを買い取り、好き勝手にする危険性がないことを意味します。この一年、もしあなたがウィキペディアから得た情報に¥300 の価値があったと思っていただけるのでしたら、ご寄付をお寄せいただけないでしょうか。感謝を込めて。— ジミー・ウェールズ（ウィキメディア財団創設者）',
        negative_text: 'けっこうです',
        action: {
            title: '今すぐ寄付する',
            url: `https://donate.wikimedia.org/?uselang=ja&appeal=JimmyQuote&utm_medium=WikipediaApp&utm_campaign=${ os }&utm_source=app_2023_jaJP_${ os }_control&monthlyconvert=Default`
        }
    });

const androidV2SurveyAnnouncement = (campaign) => Object.assign({}, baseAnnouncement(campaign), {
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

const iosV2FundraisingAnnouncement = (code, countryConfig, campaign) => Object.assign({}, baseAnnouncement(campaign), {
        id: buildId(campaign, 'IOSV2', 'EN'),
        platforms: [ config.Platform.IOS_V2, config.Platform.IOS_V3, config.Platform.IOS_V4, config.Platform.IOS_V5 ],
        countries: [ code.toUpperCase() ],
        border: countryConfig.border,
        placement: countryConfig.placement,
        text: getFundraisingAnnouncementText(countryConfig),
        caption_HTML: "By donating, you agree to our <a href='https://foundation.wikimedia.org/wiki/Donor_privacy_policy/en'>donor policy</a>.",
        negative_text: 'No thanks',
        action: {
            title: 'DONATE NOW',
            url: 'https://donate.wikimedia.org/?uselang=en&appeal=JimmyQuote&utm_medium=WikipediaApp&utm_campaign=iOS&utm_source=app_2023_en6C_iOS_control'
        }
    });

const iOSAaaLDArticleTitles = [];

const iosV4SurveyAnnouncement = (campaign) => Object.assign({}, baseAnnouncement(campaign), {
        id: buildId(campaign, 'IOSV4', 'EN'),
        platforms: [ config.Platform.IOS_V4 ],
        border: false,
        placement: 'article',
        text: 'Help improve Wikipedia by taking a quick survey about this article',
        caption_HTML: "View our <a href='https://foundation.m.wikimedia.org/w/index.php?title=Editing_Awareness_and_Trust_Survey_Privacy_Statement'>privacy statement</a>. Survey powered by a third-party. View their <a href='https://policies.google.com/privacy'>privacy policy</a>.",
        negative_text: 'No thanks',
        percent_receiving_experiment: 50,
        action: {
            title: 'Start survey',
            url: 'https://docs.google.com/forms/d/e/1FAIpQLSdQ34Nz6u7Uhc6A3mTk5XwGdWVKwJpQfCZ4Jlx32QHhI6fx9Q/viewform?usp=pp_url&entry.135304298={{articleTitle}}&entry.1794192386={{didSeeModal}}&entry.1315551869={{isInExperiment}}'
        },
        articleTitles: iOSAaaLDArticleTitles,
        displayDelay: 30
    });

const iosAaaLDSurveyAnnouncement = (campaign) => Object.assign({}, baseAnnouncement(campaign), {
        id: buildId(campaign, 'IOS', 'SURVEY20-1'),
        platforms: [ config.Platform.IOS_V5 ],
        border: false,
        placement: 'article',
        text: 'Help improve Wikipedia by taking a quick survey about this article',
        caption_HTML: "View our <a href='https://foundation.m.wikimedia.org/w/index.php?title=Editing_Awareness_and_Trust_Survey_Privacy_Statement'>privacy statement</a>. Survey powered by a third-party. View their <a href='https://policies.google.com/privacy'>privacy policy</a>.",
        negative_text: 'No thanks',
        percent_receiving_experiment: 50,
        action: {
            title: 'Start survey',
            url: 'https://docs.google.com/forms/d/e/1FAIpQLSdQ34Nz6u7Uhc6A3mTk5XwGdWVKwJpQfCZ4Jlx32QHhI6fx9Q/viewform?usp=pp_url&entry.135304298={{articleTitle}}&entry.1794192386={{didSeeModal}}&entry.1315551869={{isInExperiment}}'
        },
        articleTitles: iOSAaaLDArticleTitles,
        displayDelay: 30
    });

const iosLegacyFundraisingAnnouncement = (code, countryConfig, campaign) => Object.assign({}, baseAnnouncement(campaign), {
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
            url: 'https://donate.wikimedia.org/?uselang=en&appeal=JimmyQuote&utm_medium=WikipediaApp&utm_campaign=iOS&utm_source=app_2023_en6C_iOS_control'
        }
    });

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
    return [].concat(iosV4SurveyAnnouncement(campaign));
}

function getiOSAaaLDSurveyAnnouncements(campaign) {
    return [].concat(iosAaaLDSurveyAnnouncement(campaign));
}

function getLegacyiOSFundraisingAnnouncements(campaign) {
    return Object.keys(campaign.countryVars)
    .map((code) => iosLegacyFundraisingAnnouncement(code, campaign.countryVars[code], campaign));
}

function getAnnouncementsForCampaign(campaign) {
    switch (campaign.idPrefix) {
        case 'INDIAFUNDRAISING23':
            return getAndroidFundraisingAnnouncements(campaign)
            .concat(getiOSFundraisingAnnouncements(campaign))
            .concat(getLegacyiOSFundraisingAnnouncements(campaign));
        case 'JAPANFUNDRAISING23':
            return Object.keys(campaign.countryVars).map((code) => japanFundraisingAnnouncement(code, campaign.countryVars[code], campaign, 'iOS', [ config.Platform.IOS_V2, config.Platform.IOS_V3, config.Platform.IOS_V4, config.Platform.IOS_V5 ]))
            .concat(Object.keys(campaign.countryVars).map((code) => japanFundraisingAnnouncement(code, campaign.countryVars[code], campaign, 'Android', [ config.Platform.ANDROID_V2 ])));
        case 'INDIAFUNDRAISING22':
            return getAndroidFundraisingAnnouncements(campaign);
        case 'FUNDRAISING23':
            return getAndroidFundraisingAnnouncements(campaign)
            .concat(getiOSFundraisingAnnouncements(campaign))
            .concat(getLegacyiOSFundraisingAnnouncements(campaign));
        case 'IOSSURVEY20':
            return getiOSSurveyAnnouncements(campaign);
        case 'IOSAAALDSURVEY':
            return getiOSAaaLDSurveyAnnouncements(campaign);
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
    return config.campaigns.filter((campaign) => campaign.activeWikis.includes(domain) &&
    !hasEnded(campaign, now));
}

function getAnnouncements(domain) {
    const announcements = [];
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

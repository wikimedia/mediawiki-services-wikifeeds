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

const getFundraisingAnnouncementText = (countryConfig) => `To all our readers in ${countryConfig.country},<br/><br/>Please don't scroll past this. Today, for the 1st time recently, we interrupt your reading to humbly ask you to support Wikipedia's independence. Only 2% of our readers give. Many think they'll give later, but then forget. <b>If you donate just ${countryConfig.currency}${countryConfig.coffee}, or whatever you can today, Wikipedia could keep thriving for years.</b><br/><br/>We don't run ads, and we never have. We rely on our readers for support. We serve millions of people, but we run on a fraction of what other top sites spend. Wikipedia is special. It is like a library or a public park where we can all go to learn. We ask you, humbly: please don't scroll away. If Wikipedia has given you ${countryConfig.currency}${countryConfig.coffee} worth of knowledge this year, take a minute to donate. Show the world that access to neutral information matters to you. Thank you.`;
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
            url: 'https://donate.wikimedia.org/?uselang=en&appeal=JimmyQuote&utm_medium=WikipediaApp&utm_campaign=Android&utm_source=app_2022_6C_Android_control&monthlyconvert=Default'
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
        platforms: [ config.Platform.IOS_V2, config.Platform.IOS_V3, config.Platform.IOS_V4, config.Platform.IOS_V5 ],
        countries: [ code.toUpperCase() ],
        border: countryConfig.border,
        placement: countryConfig.placement,
        text: getFundraisingAnnouncementText(countryConfig),
        caption_HTML: "By donating, you agree to our <a href='https://foundation.wikimedia.org/wiki/Donor_privacy_policy/en'>donor policy</a>.",
        negative_text: 'No thanks',
        action: {
            title: 'DONATE NOW',
            url: 'https://donate.wikimedia.org/?uselang=en&appeal=JimmyQuote&utm_medium=WikipediaApp&utm_campaign=iOS&utm_source=app_2022_6C_iOS_control&monthlyconvert=Default'
        }
    });
};

const iOSAaaLDArticleTitles = ['Anya Taylor-Joy',
    'Armie Hammer',
    'Betty White',
    'Bigg Boss (Tamil season 4)',
    'Cloris_Leachman',
    'Cicely Tyson',
    'Darth Vader',
    'Elisabeth Shue',
    'Elizabeth Olsen',
    'Elliot Page',
    'Gal Gadot',
    'Godzilla vs. Kong',
    'K.G.F: Chapter 2',
    'Lana Clarkson',
    'Leonardo DiCaprio',
    'List of Marvel Cinematic Universe films',
    'Master (2021 film)',
    'Olivia Wilde',
    'Omar Sy',
    'Pedro Pascal',
    'Phoebe Dynevor',
    'Pieces of a Woman',
    'Promising Young Woman',
    'Ralph Macchio',
    'Soul (2020 film)',
    'Tanya Roberts',
    'Tenet (film)',
    'The Dig (2021 film)',
    'The Little Things (2021 film)',
    'The Mandalorian',
    'WandaVision',
    'William Zabka',
    'Wonder Woman 1984',
    'Amen',
    'Aquarius (astrology)',
    'B. R. Ambedkar',
    'Bermuda Triangle',
    'Bible',
    'Blue Monday (date)',
    'Cabal',
    'Capricorn (astrology)',
    'Changeling',
    'Charlie Charlie challenge',
    'Communism',
    'Epiphany (holiday)',
    'Gautama Buddha',
    'Illuminati',
    'Islam',
    'Jesus',
    'Joan of Arc',
    'Karl Marx',
    'Lilith',
    'List of conspiracy theories',
    'List of religious populations',
    'Makar Sankranti',
    'Muhammad',
    'NESARA',
    'New World Order (conspiracy theory)',
    'New Year\'s Day',
    'Pongal (festival)',
    'Pope Francis',
    'Sagittarius (astrology)',
    'Scientology',
    'Seven deadly sins',
    'Ten Commandments',
    'Valentine\'s Day',
    'Zodiac',
    'Aaron Rodgers',
    'Bobby Fischer',
    'Conor McGregor',
    'Cristiano Ronaldo',
    'Drew Brees',
    'Dustin Poirier',
    'Gina Carano',
    'Hank Aaron',
    'James Naismith',
    'Jim Brown',
    'Josh Allen (quarterback)',
    'Khabib Nurmagomedov',
    'Kobe Bryant',
    'LeBron James',
    'Lionel Messi',
    'List of footballers with 500 or more goals',
    'List of Super Bowl champions',
    'Max Holloway',
    'Mesut Özil',
    'Michael Chandler',
    'Michael Jordan',
    'Muhammad Ali',
    'Nick Saban',
    'Patrick Mahomes',
    'Ryan García',
    'Stephen Curry',
    'Steve Sarkisian',
    'Super Bowl',
    'Super Bowl LV',
    'Taylor Heinicke',
    'Thomas Tuchel',
    'Tiger Woods',
    'Tom Brady',
    'UFC 257',
    'Urban Meyer',
    'Art',
    'Camera',
    'Claude Monet',
    'Colosseum',
    'Colossus of Rhodes',
    'David (Michelangelo)',
    'Fallingwater',
    'Great Pyramid of Giza',
    'Impressionism',
    'Jackson Pollock',
    'Leaning Tower of Pisa',
    'Leonardo da Vinci',
    'List of most expensive paintings',
    'Lorem ipsum',
    'Louvre',
    'Michelangelo',
    'Mona Lisa',
    'Moscow Kremlin',
    'Pablo Picasso',
    'Pietà (Michelangelo)',
    'Sagrada Família',
    'Salvador Dalí',
    'Salvator Mundi (Leonardo)',
    'Statue of Unity',
    'The Ellipse',
    'The Great Wave off Kanagawa',
    'The Last Supper (Leonardo)',
    'The Starry Night',
    'Trademark symbol',
    'Vincent van Gogh',
    'Americas',
    'Amundsen–Scott South Pole Station',
    'Antarctica',
    'Asia',
    'Atlantic Ocean',
    'Caribbean',
    'Continent',
    'Ernest Shackleton',
    'Geographic coordinate system',
    'Great Lakes',
    'Greenland',
    'Himalayas',
    'K2',
    'Kattegat',
    'Lake Baikal',
    'List of cities in the United Kingdom',
    'List of countries and dependencies by area',
    'List of countries and dependencies by population density',
    'List of highest mountains on Earth',
    'List of largest cities',
    'List of national capitals',
    'List of national parks of the United States',
    'List of sovereign states',
    'List of United States cities by population',
    'Mediterranean Sea',
    'Mount Kilimanjaro',
    'North America',
    'North Pole',
    'Pacific Ocean',
    'Patagonia',
    'Réunion',
    'Scandinavia',
    'West Indies',
    'World map',
    'Yellowstone National Park',
    '2021',
    'Alexander the Great',
    'Alfred the Great',
    'Anglo-Saxons',
    'Anne Boleyn',
    'Augustus',
    'Björn Ironside',
    'British Empire',
    'Byzantine Empire',
    'Catherine of Aragon',
    'Charlemagne',
    'Cleopatra',
    'Emily Dickinson',
    'Flag of the United States',
    'Flags of the Confederate States of America',
    'Helen Keller',
    'Henry V of England',
    'Henry VII of England',
    'Ivar the Boneless',
    'James VI and I',
    'Julius Caesar',
    'Karen Pence',
    'List of English monarchs',
    'Lucille Ball',
    'Margaret Guido',
    'Marie Antoinette',
    'Mary I of England',
    'Mary of Teck',
    'Mary, Queen of Scots',
    'Ottoman Empire',
    'Queen Victoria',
    'Ragnar Lodbrok',
    'Roman Empire',
    'Sutton Hoo',
    'Vikings',
    '69 (sex position)',
    'Anal sex',
    'Animal',
    'BDSM',
    'Cane Corso',
    'Cat',
    'Charles Darwin',
    'Dinosaur',
    'DNA',
    'Dodo',
    'Dog',
    'Fellatio',
    'Gabi (dog)',
    'German Shepherd',
    'Giant panda',
    'Golden Retriever',
    'Kitten',
    'Labrador Retriever',
    'Lion',
    'Mammal',
    'Masturbation',
    'Mercy dog',
    'Missionary position',
    'Non-penetrative sex',
    'Oral sex',
    'Quinoa',
    'Sex',
    'Sex position',
    'Sexual intercourse',
    'Sexy',
    'Shiba Inu',
    'Strawberry',
    'Tiger',
    'Virus',
    'Wolverine',
    'Adrenochrome',
    'Asperger syndrome',
    'B-cell lymphoma',
    'Bipolar disorder',
    'Body mass index',
    'Borderline personality disorder',
    'Bubonic plague',
    'Cocaine',
    'COVID-19 pandemic',
    'COVID-19 pandemic in the United Kingdom',
    'Crohn\'s disease',
    'Diverticulitis',
    'Dunning–Kruger effect',
    'Fentanyl',
    'Fibromyalgia',
    'Glioblastoma',
    'IQ classification',
    'Ivermectin',
    'List of The Good Doctor episodes',
    'Maslow\'s hierarchy of needs',
    'Myers–Briggs Type Indicator',
    'Parkinson\'s disease',
    'Pfizer',
    'Pneumonia',
    'Prader–Willi syndrome',
    'Pulmonary embolism',
    'Schizophrenia',
    'Sepsis',
    'Serum Institute of India',
    'Sigmund Freud',
    'Smallpox',
    'Tasuku Honjo',
    'Tuberculosis',
    'Tuskegee Syphilis Study',
    'Vaccine',
    'Albert Einstein',
    'Atom',
    'Big Bang',
    'Black hole',
    'Dark matter',
    'Double-slit experiment',
    'Electricity',
    'Electromagnetic radiation',
    'Energy',
    'Entropy',
    'Gas constant',
    'Gravity',
    'Higgs boson',
    'Laws of thermodynamics',
    'Light',
    'Marie Curie',
    'Newton\'s laws of motion',
    'Ohm\'s law',
    'Physics',
    'Planck constant',
    'Plasma (physics)',
    'Quantum entanglement',
    'Quantum mechanics',
    'Reynolds number',
    'Richard Feynman',
    'Schrödinger equation',
    'Schrödinger\'s cat',
    'Second law of thermodynamics',
    'Speed of light',
    'Speed of sound',
    'Theory of relativity',
    'Universe',
    'Viscosity',
    'Werner Heisenberg',
    'X-ray'];

const iosV4SurveyAnnouncement = (campaign) => {
    return Object.assign({}, baseAnnouncement(campaign), {
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
};

const iosAaaLDSurveyAnnouncement = (campaign) => {
    return Object.assign({}, baseAnnouncement(campaign), {
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
            url: 'https://donate.wikimedia.org/?uselang=en&appeal=JimmyQuote&utm_medium=WikipediaApp&utm_campaign=iOS&utm_source=app_2022_6C_iOS_control&monthlyconvert=Default'
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
        case 'INDIAFUNDRAISING22':
            return getAndroidFundraisingAnnouncements(campaign);
        case 'FUNDRAISING22':
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
    return config.campaigns.filter((campaign) =>
    campaign.activeWikis.includes(domain) &&
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

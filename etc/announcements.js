'use strict';

// Featured feed announcement definitions
//
// This file contains the definition objects for announcements to be shown
// in the app featured feeds.
//
// Documentation of the various config options:
// https://www.mediawiki.org/wiki/Specs/Announcements/0.2.0

const AnnouncementType = {
    SURVEY: 'survey',
    FUNDRAISING: 'fundraising',
    ANNOUNCEMENT: 'announcement'
};

const Platform = {
    IOS: 'iOSApp',
    IOS_V2: 'iOSAppV2',
    IOS_V3: 'iOSAppV3',
    IOS_V4: 'iOSAppV4',
    IOS_V5: 'iOSAppV5',
    ANDROID_V1: 'AndroidApp',
    ANDROID_V2: 'AndroidAppV2'
};

const campaigns = [
    {
        type: AnnouncementType.FUNDRAISING,
        startTime: '2023-08-22T00:00:00Z',
        endTime: '2023-09-19T23:59:00Z',
        idPrefix: 'INDIAFUNDRAISING23',
        domain: 'en.wikipedia.org',
        activeWikis: [
            'en.wikipedia.org'
        ],
        countryVars: {
            in: {
                country: 'India',
                currency: '₹',
                coffee: 75,
                border: true,
                placement: 'article'
            }
        }
    },
    {
        type: AnnouncementType.FUNDRAISING,
        startTime: '2022-05-31T00:00:00Z',
        endTime: '2022-06-28T23:59:00Z',
        idPrefix: 'INDIAFUNDRAISING22',
        domain: 'en.wikipedia.org',
        activeWikis: [
            'en.wikipedia.org'
        ],
        countryVars: {
            in: {
                country: 'India',
                currency: '₹',
                coffee: 75,
                border: true,
                placement: 'article'
            }
        }
    },
    {
        type: AnnouncementType.FUNDRAISING,
        startTime: '2023-03-20T00:00:00Z',
        endTime: '2023-04-12T00:00:00Z',
        idPrefix: 'JAPANFUNDRAISING23',
        domain: 'ja.wikipedia.org',
        activeWikis: [
            'ja.wikipedia.org'
        ],
        countryVars: {
            jp: {
                country: 'Japan',
                currency: '¥',
                coffee: 300,
                border: true,
                placement: 'article'
            }
        }
    },
    {
        type: AnnouncementType.FUNDRAISING,
        startTime: '2023-11-28T16:00:00Z',
        endTime: '2024-01-01T00:00:00Z',
        idPrefix: 'FUNDRAISING23',
        domain: 'en.wikipedia.org',
        activeWikis: [
            'en.wikipedia.org'
        ],
        countryVars: {
            us: {
                country: 'the U.S.',
                currency: '$',
                coffee: 3,
                border: true,
                placement: 'article',
                imageUrl: 'https://upload.wikimedia.org/wikipedia/donate/c/cf/Icons-cc-us.png'
            },
            gb: {
                country: 'the UK',
                currency: '£',
                coffee: 2,
                border: true,
                placement: 'article',
                imageUrl: 'https://upload.wikimedia.org/wikipedia/donate/6/6f/Icons-cc-gb-ie-au.png'
            },
            au: {
                country: 'Australia',
                currency: '$',
                coffee: 3,
                border: true,
                placement: 'article',
                imageUrl: 'https://upload.wikimedia.org/wikipedia/donate/6/6f/Icons-cc-gb-ie-au.png'
            },
            ca: {
                country: 'Canada',
                currency: '$',
                coffee: 3,
                border: true,
                placement: 'article',
                imageUrl: 'https://upload.wikimedia.org/wikipedia/donate/4/4d/Icons-cc-nz-ca.png'
            },
            nz: {
                country: 'New Zealand',
                currency: '$',
                coffee: 3,
                border: true,
                placement: 'article',
                imageUrl: 'https://upload.wikimedia.org/wikipedia/donate/4/4d/Icons-cc-nz-ca.png'
            },
            ie: {
                country: 'Ireland',
                currency: '€',
                coffee: 2,
                border: true,
                placement: 'article',
                imageUrl: 'https://upload.wikimedia.org/wikipedia/donate/6/6f/Icons-cc-gb-ie-au.png'
            }
        }
    },
    {
        type: AnnouncementType.SURVEY,
        startTime: '2021-06-24T00:00:00Z',
        endTime: '2021-07-21T23:59:00Z',
        idPrefix: 'IOSSURVEY20',
        domain: 'en.wikipedia.org',
        activeWikis: [
            'en.wikipedia.org'
        ],
        countryVars: null
    },
    {
        type: AnnouncementType.SURVEY,
        startTime: '2021-06-24T00:00:00Z',
        endTime: '2021-07-21T23:59:00Z',
        idPrefix: 'IOSAAALDSURVEY',
        domain: 'en.wikipedia.org',
        activeWikis: [
            'en.wikipedia.org'
        ],
        countryVars: null
    },
    {
        type: AnnouncementType.SURVEY,
        startTime: '2020-05-12T00:00:00Z',
        endTime: '2020-06-01T23:59:00Z',
        idPrefix: 'ANDROIDSURVEY20',
        domain: 'en.wikipedia.org',
        activeWikis: [
            'en.wikipedia.org'
        ],
        countryVars: null
    }
];

module.exports = {
    Platform,
    AnnouncementType,
    campaigns
};

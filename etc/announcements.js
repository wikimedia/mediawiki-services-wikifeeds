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
    ANDROID_V1: 'AndroidApp',
    ANDROID_V2: 'AndroidAppV2'
};

const activeWikis = [
    'en.wikipedia.org'
];

const domain = 'en.wikipedia.org';

const startTime = '2019-12-02T00:00:00Z';
const endTime   = '2019-12-31T23:59:00Z';
const iosMinVersion = '5.8.0';
const iosMaxVersion = '6.1.0';
const idPrefix = 'FUNDRAISING19';

const countryVars = {
    us: {
        country: 'the U.S.',
        currency: '$',
        average: 16.36,
        coffee: 2.75,
        border: true,
        placement: 'article',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/donate/c/cf/Icons-cc-us.png'
    },
    gb: {
        country: 'the UK',
        currency: '£',
        average: 10,
        coffee: 2,
        border: true,
        placement: 'article',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/donate/6/6f/Icons-cc-gb-ie-au.png'
    },
    au: {
        country: 'Australia',
        currency: '$',
        average: 15,
        coffee: 2.75,
        border: true,
        placement: 'article',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/donate/6/6f/Icons-cc-gb-ie-au.png'
    },
    ca: {
        country: 'Canada',
        currency: '$',
        average: 15,
        coffee: 2.75,
        border: true,
        placement: 'article',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/donate/4/4d/Icons-cc-nz-ca.png'
    },
    nz: {
        country: 'New Zealand',
        currency: '$',
        average: 15,
        coffee: 2.75,
        border: true,
        placement: 'article',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/donate/4/4d/Icons-cc-nz-ca.png'
    },
    ie: {
        country: 'Ireland',
        currency: '€',
        average: 10,
        coffee: 2,
        border: true,
        placement: 'article',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/donate/6/6f/Icons-cc-gb-ie-au.png'
    }
};

module.exports = {
    activeWikis,
    domain,
    countryVars,
    iosMinVersion,
    iosMaxVersion,
    startTime,
    endTime,
    idPrefix,
    Platform,
    AnnouncementType
};

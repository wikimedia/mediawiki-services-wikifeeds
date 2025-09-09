'use strict';

const iosYiRConfig = require('./configuration-ios-yir.js');

function getIOSV1(domain) {
    return {
        yir: iosYiRConfig
    };
}

function getAndroidV1(domain) {
    return {
        // Add parameters here.
    };
}

function getCommonV1(domain) {
    return {
        // Add parameters here.
    };
}

function getConfiguration(domain) {
    return {
        commonv1: getCommonV1(domain),
        androidv1: getAndroidV1(domain),
        iosv1: getIOSV1(domain)
    };
}

module.exports = {
    getConfiguration,
    testing: {
    }
};

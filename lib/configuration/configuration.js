'use strict';

const hCaptcha = require('./hcaptcha.js');
const iosYiRConfig = require('./configuration-ios-yir.js');

function getIOSV1(domain) {
    return {
        hCaptcha: hCaptcha.hCaptchaIOS,
        yir: iosYiRConfig
    };
}

function getAndroidV1(domain) {
    return {
        hCaptcha: hCaptcha.hCaptchaAndroid
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

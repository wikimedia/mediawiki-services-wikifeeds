'use strict';

const hCaptcha = require('./hcaptcha.js');
const yirCommon = require('./year-in-review.js');

function getIOSV1(domain) {
    return {
        hCaptcha: hCaptcha.hCaptchaIOS
    };
}

function getAndroidV1(domain) {
    return {
        hCaptcha: hCaptcha.hCaptchaAndroid,
        hybridSearchEnabled: true,
        hybridSearchLanguages: ['el']
    };
}

function getCommonV1(domain) {
    return {
        yir: yirCommon
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

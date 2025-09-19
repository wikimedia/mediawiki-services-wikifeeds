'use strict';

const hCaptchaCommon = {
    baseURL: 'https://meta.wikimedia.org',
    jsSrc: 'https://assets-hcaptcha.wikimedia.org/1/api.js',
    endpoint: 'https://hcaptcha.wikimedia.org',
    assethost: 'https://assets-hcaptcha.wikimedia.org',
    imghost: 'https://imgs-hcaptcha.wikimedia.org',
    reportapi: 'https://report-hcaptcha.wikimedia.org',
    sentry: false
};

const hCaptchaIOS = {
    ...hCaptchaCommon,
    apiKey: 'TODO'
};

const hCaptchaAndroid = {
    ...hCaptchaCommon,
    siteKey: 'TODO'
};

module.exports = {
    hCaptchaIOS,
    hCaptchaAndroid
};

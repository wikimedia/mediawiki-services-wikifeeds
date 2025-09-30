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
    apiKey: '083c7bd2-eef0-423a-98ca-db1e0d4cbbae'
};

const hCaptchaAndroid = {
    ...hCaptchaCommon,
    siteKey: 'e11698d6-51ca-4980-875c-72309c6678cc'
};

module.exports = {
    hCaptchaIOS,
    hCaptchaAndroid
};

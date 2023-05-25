'use strict';

const P = require('bluebird');
const _ = require('lodash');
const util = require('../lib/util');
const dateUtil = require('../lib/date-util');
const featured = require('../lib/featured');
const mostRead = require('../lib/most-read');
const featuredImage = require('../lib/featured-image');
const news = require('../lib/news');
const onThisDay = require('../lib/on-this-day');

/**
 * The main router object
 */
const router = util.router();
let app;

const parseDate = (req) => {
	if (!dateUtil.validate(dateUtil.hyphenDelimitedDateString(req))) {
		dateUtil.throwDateError();
	}
	return dateUtil.getRequestedDate(req);
};

const isHistoric = (date) => {
	const now = new Date();
	const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	return date < today;
};

const PARTS_URIS = {
	tfa: {
		handler: async (a, req) => {
			const internalRes = await featured.promise(a, req);
			return internalRes.payload;
		},
		query: {
			aggregated: true
		},
		renewable: true
	},
	mostread: {
		handler: async (a, req) => {
			const internalRes = await mostRead.promise(a, req);
			return internalRes.payload;
		},
		query: {
			aggregated: true
		},
		renewable: true
	},
	image: {
		handler: async (a, req) => {
			const internalRes = await featuredImage.promise(a, req);
			return internalRes.payload;
		},
		query: {
			aggregated: true
		},
		renewable: true
	},
	news: {
		handler: async (a, req) => {
			// HACK: news is not expecting year, month, date
			// passing the req parameters `yyyy`,`mm`, `dd`
			// breaks the internal requests
			delete req.params.yyyy;
			delete req.params.mm;
			delete req.params.dd;
			const internalRes = await news.promise(a, req);
			return internalRes.payload;
		},
		query: {
			aggregated: true
		},
		renewable: false
	},
	onthisday: {
		handler: async (a, req) => {
			const internalRes = await onThisDay.fetchAndRespond(
				a, req, undefined,
				onThisDay.selectedTitleForRequest,
				onThisDay.selectionsInDoc,
				false
			);
			return internalRes;
		},
		renewable: true,
		query: {
			aggregated: false
		}
	}
};

router.get(
	'/featured/:yyyy(\\d{4})/:mm(\\d{2})/:dd(\\d{2})',
	async (req, res) => {
		const featuredProps = {};
		let parts = Object.keys(PARTS_URIS);
		if (isHistoric(parseDate(req))) {
			parts = parts.filter((part) => PARTS_URIS[part].renewable);
		}
		parts.forEach((part) => {
			const fragment = PARTS_URIS[part];
			req.query.aggregated = fragment.query.aggregated;
			const reqClone = _.cloneDeep(req);
			const internalRes = fragment.handler(app, reqClone).catch((err) => Object());
			featuredProps[part] = internalRes;
		});
		return P.props(featuredProps).then(function (result) {
			const body = {};
			Object.keys(result).forEach((key) => {
				if (result[key] && Object.keys(result[key]).length) {
					if (key === 'onthisday' && result.onthisday.selected) {
						body[key] = result.onthisday.selected;
					} else {
						body[key] = result[key];
					}
				}
			});
			res.json(body);
		});
	}
);

module.exports = function (appObj) {
	app = appObj;
	return {
		path: '/aggregated',
		api_version: 1,
		router
	};
};

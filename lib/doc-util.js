'use strict';

const P = require('bluebird');
const domino = require('domino');

/**
 * Creates a domino Document object from an HTML text string or an array of HTML text strings.
 * Takes advantage of functionality provided by domino's internal HTMLParser implementation,
 * but not exposed in its public API via the createDocument() method, to allow parsing an HTML
 * string in chunks.
 * Returns a Promise resolving as a Document rather than synchronously parsing and returning the
 * Document as in Domino's own implementation.
 * @param {?string} html HTML string
 * @return {!Promise} a promise resolving in a Domino HTML document representing the input
 */
function createDocument(html) {
    const MAX_PARSING_MS_PER_TICK = 200;

    function pauseAfter(ms) {
        const start = Date.now();
        return () => (Date.now() - start) >= ms;
    }

    function processIncremental(parser) {
        return new P((res, rej) => setImmediate(() => {
            try {
                if (parser.process(pauseAfter(MAX_PARSING_MS_PER_TICK))) {
                    res(processIncremental(parser));
                } else {
                    res(parser.document());
                }
            } catch (e) {
                rej(e);
            }
        }));
    }

    return P.resolve(domino.createIncrementalHTMLParser())
        .then((parser) => {
            parser.end(html);
            return processIncremental(parser);
        });
}

module.exports = { createDocument };

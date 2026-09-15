'use strict';

const assert = require('../utils/assert');
const domino = require('domino');
const didYouKnow = require('../../lib/did-you-know');

describe('did-you-know-unit', () => {
    it('should skip empty entries', () => {
        const doc = domino.createDocument(`
            <section>
                <ul>
                    <li>First DYK entry</li>
                    <li></li>
                    <li>Second DYK entry</li>
                </ul>
            </section>
        `);

        const items = didYouKnow.testing.extractDYKItems(doc, 'en');

        assert.deepEqual(items.length, 2);
        assert.deepEqual(items[0].text, 'First DYK entry');
        assert.deepEqual(items[1].text, 'Second DYK entry');
    });
});

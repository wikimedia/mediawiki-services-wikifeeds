'use strict';

const assert = require('../utils/assert');
const PICTURED_REGEX = require('../../etc/pictured-regex');

describe('pictured-regex-unit', () => {

    // For each language: a list of snippets containing the "(pictured)"
    // parenthetical, paired with the expected result after stripping it.
    const cases = {
        ar: [
            { input: 'حقيقة مثيرة (في الصورة) عن الموضوع.', expected: 'حقيقة مثيرة عن الموضوع.' }
        ],
        de: [
            { input: 'Eine Tatsache (Bild) über das Thema.', expected: 'Eine Tatsache über das Thema.' },
            { input: 'Eine Tatsache (im Bild) über das Thema.', expected: 'Eine Tatsache über das Thema.' },
            { input: 'Eine Tatsache (Bild rechts) über das Thema.', expected: 'Eine Tatsache über das Thema.' }
        ],
        en: [
            { input: 'A fact (pictured) about the subject.', expected: 'A fact about the subject.' },
            { input: 'A fact (pictured right) about the subject.', expected: 'A fact about the subject.' },
            { input: 'A fact (Pictured) about the subject.', expected: 'A fact about the subject.' }
        ],
        hi: [
            { input: 'एक तथ्य (चित्रित) विषय के बारे में।', expected: 'एक तथ्य विषय के बारे में।' }
        ],
        pt: [
            { input: 'Um fato (imagem) sobre o assunto.', expected: 'Um fato sobre o assunto.' },
            { input: 'Um fato (na imagem) sobre o assunto.', expected: 'Um fato sobre o assunto.' }
        ],
        ru: [
            { input: 'Факт (на иллюстрации) о предмете.', expected: 'Факт о предмете.' },
            { input: 'Факт (на илл.) о предмете.', expected: 'Факт о предмете.' }
        ],
        uk: [
            { input: 'Факт (на зображенні) про предмет.', expected: 'Факт про предмет.' }
        ]
    };

    // Every language defined in the module must be exercised by a test case,
    // so new languages don't silently go untested.
    it('every language regex has at least one test case', () => {
        assert.deepEqual(Object.keys(PICTURED_REGEX).sort(), Object.keys(cases).sort());
    });

    Object.keys(cases).forEach((lang) => {
        const regex = PICTURED_REGEX[lang];

        it(`${lang}: is a RegExp`, () => {
            assert.ok(regex instanceof RegExp, 'expected a RegExp');
        });

        cases[lang].forEach(({ input, expected }) => {
            it(`${lang}: strips "(pictured)" from "${input}"`, () => {
                assert.deepEqual(input.replace(regex, ''), expected);
            });
        });

        it(`${lang}: leaves text without a "(pictured)" parenthetical untouched`, () => {
            const plain = 'A snippet with no image reference.';
            assert.deepEqual(plain.replace(regex, ''), plain);
        });
    });
});

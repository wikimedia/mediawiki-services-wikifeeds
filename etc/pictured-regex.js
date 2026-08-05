'use strict';

/**
 * Regular expressions for stripping "(pictured)"-style parentheticals from feed
 * snippets, keyed by Wikipedia language code. These parentheticals refer to an
 * image associated with the snippet; since we display only the text of the
 * snippet (Did You Know, In The News) and not the image, we strip them away.
 *
 * @type {Object.<string, RegExp>} Map of Wikipedia language codes to regexes
 */
module.exports = {
    ar: /\s*\(في الصورة\)/i,
    de: /\s*\([^)]*Bild[^)]*\)/i,
    en: /\s*\([^)]*picture[^)]*\)/i,
    hi: /\s*\([^)]*चित्रित[^)]*\)/i,
    pt: /\s*\([^)]*imagem[^)]*\)/i,
    ru: /\s*\([^)]*на[^)]*илл[^)]*\)/i,
    uk: /\s*\([^)]*на[^)]*зобр[^)]*\)/i
};

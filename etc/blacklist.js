'use strict';

/**
 * A list of titles persistently in the most-read results but that appear to
 * have few human viewers based on their traffic being almost all mobile or
 * almost all non-mobile. See https://phabricator.wikimedia.org/T124716#2080637.
 * TODO: Get this filtering or something like it into the upstream pageview API.
 */
const BLACKLIST = [
    '-',
    'Test_card',
    'Web_scraping',
    'XHamster',
    'Java_(programming_language)',
    'Images/upload/bel.jpg',
    'Superintelligence:_Paths,_Dangers,_Strategies',
    'Okto',
    'Proyecto_40',
    'AMGTV',
    'Lali_Espósito',
    'La7',
    'Vagina',
    'کس', // mznwiki
    'مقعد', // mznwiki
    'Tobias_Sammet', // dewiki T238942
    'Avantasia', // dewiki T238942
    'Edguy' // dewiki T238942
];

module.exports = BLACKLIST;

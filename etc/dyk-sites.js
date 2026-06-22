/* eslint no-underscore-dangle: 0 */
'use strict';

class DykSite {
    constructor(title, dykSelectorAll) {
        this._title = title;
        this._dykSelectorAll = dykSelectorAll;
    }

    get title() {
        return this._title;
    }

    get dykSelectorAll() {
        return this._dykSelectorAll;
    }
}

module.exports = {
    ar: new DykSite('ويكيبيديا:هل تعلم', 'section > ul > li'),
    de: new DykSite('Wikipedia:Hauptseite/Schon_gewusst', 'ul > li'),
    en: new DykSite('Template:Did_you_know', 'section > ul > li'),
    hi: new DykSite('साँचा:क्या_आप_जानते_हैं', 'div > ul > li'),
    pt: new DykSite('Predefinição:Sabia_que', 'section > p:not(.mw-empty-elt)'),
    ru: new DykSite('Шаблон:Знаете_ли_вы', 'section > ul > li'),
    uk: new DykSite('Шаблон:Чи_знаєте_ви,_що', 'section > ul > li')
};

/* eslint no-underscore-dangle: 0 */
'use strict';

class DykSite {
    constructor(title, dykSelectorAll, picturedRegex) {
        this._title = title;
        this._dykSelectorAll = dykSelectorAll;
        this._picturedRegex = picturedRegex;
    }

    get title() {
        return this._title;
    }

    get dykSelectorAll() {
        return this._dykSelectorAll;
    }

    /**
     * Regex to remove the "(pictured)" text from DYK items
     */
    get picturedRegex() {
        return this._picturedRegex;
    }
}

module.exports = {
    ar: new DykSite('ويكيبيديا:هل تعلم', 'section > ul > li', /\s*\(في الصورة\)/i),
    de: new DykSite('Wikipedia:Hauptseite/Schon_gewusst', 'ul > li', /\s*\(Bild\)/i),
    en: new DykSite('Template:Did_you_know', 'section > ul > li', /\s*\(pictured\)/i),
    hi: new DykSite('साँचा:क्या_आप_जानते_हैं', 'div > ul > li', /\s*\(चित्रित\)/i),
    pt: new DykSite('Predefinição:Sabia_que', 'section > p:not(.mw-empty-elt)', /\s*\(imagem\)/i),
    ru: new DykSite('Шаблон:Знаете_ли_вы', 'section > ul > li', /\s*\(на\s*илл.\)/i),
    uk: new DykSite('Шаблон:Чи_знаєте_ви,_що', 'section > ul > li', /\s*\(на\s*зобр.\)/i)
};

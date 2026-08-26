const I18N_PARTS = window.GD_I18N_PARTS || [];

const translations = Object.assign({}, ...I18N_PARTS.map((part) => part.translations || {}));
const meta = Object.assign({}, ...I18N_PARTS.map((part) => part.meta || {}));

translations.Fullstack = 'Fullstack development';
translations['REST APIs'] = 'REST APIs';

window.GD_I18N_DATA = { translations, meta };
delete window.GD_I18N_PARTS;

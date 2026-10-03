// Single localization system: a small dictionary lookup (English is the source text / key,
// Arabic is the override). A missing translation shows the English text, never a raw key.
import common from "./messages/common";
import extra from "./messages/extra";
import plurals from "./messages/plurals";
import enums from "./messages/enums";
import shop from "./messages/shop";
import account from "./messages/account";
import admin from "./messages/admin";

export const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "ar", label: "العربية", name: "العربية" },
];
export const STORAGE_KEY = "wasla_language";
export const DEFAULT_LANGUAGE = "en";

const dictionaries = { en: {}, ar: {} };
[common, extra, plurals, enums, shop, account, admin].forEach((m) => {
  Object.assign(dictionaries.en, m.en);
  Object.assign(dictionaries.ar, m.ar);
});

export const isSupported = (code) => LANGUAGES.some((l) => l.code === code);

export const getStoredLanguage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isSupported(raw) ? raw : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};
export const storeLanguage = (code) => {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* storage unavailable */
  }
};

let current = getStoredLanguage();
export const getLanguage = () => current;
export const setCurrentLanguage = (code) => {
  current = isSupported(code) ? code : DEFAULT_LANGUAGE;
};

const interpolate = (text, params) =>
  params ? text.replace(/\{(\w+)\}/g, (m, k) => (params[k] === undefined ? m : String(params[k]))) : text;

// t(key, params, lang?) - plural entries are objects ({ one, other, ... } chosen with Intl.PluralRules via params.count).
export function translate(key, params, lang = current) {
  let entry = dictionaries[lang]?.[key];
  if (entry === undefined) entry = dictionaries.en[key];
  if (entry === undefined) entry = key;
  if (entry && typeof entry === "object") {
    const rule = new Intl.PluralRules(lang).select(Number(params?.count ?? 0));
    const n = Number(params?.count);
    const form = lang === "ar" && n === 0 ? "zero" : rule;
    entry = entry[form] ?? entry.other ?? Object.values(entry)[0];
  }
  return interpolate(String(entry), params);
}
export const t = (key, params) => translate(key, params);

// te("order", status) -> display label for an internal enum value (the stored value is never changed).
export function te(group, value) {
  const key = `${group}.${value}`;
  const hit = dictionaries[current]?.[key] ?? dictionaries.en[key];
  return hit === undefined ? String(value ?? "") : translate(key);
}

// tOr(key, fallback) - the Arabic/English dictionary entry for `key` if there is one, else `fallback`
// (used for labels derived from data, e.g. category slugs, so unknown slugs keep their computed English name).
export function tOr(key, fallback, params) {
  const hit = dictionaries[current]?.[key];
  return hit === undefined ? fallback : interpolate(String(hit), params);
}

// BCP-47 locale for dates/numbers. Arabic keeps Latin digits so prices, order numbers and dates read consistently.
export const getLocale = (lang = current) => (lang === "ar" ? "ar-u-nu-latn" : "en-US");

// Display name of a governorate (the stored value stays English).
export const tGov = (g) => tOr(`gov.${g}`, g);

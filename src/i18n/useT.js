import { useCallback } from "react";
import { useSelector } from "react-redux";
import { translate, te as translateEnum } from "./index";

// { t, te, lang, isRtl } - re-renders the component when the language changes.
export function useT() {
  const lang = useSelector((s) => s.language.lang);
  const t = useCallback((key, params) => translate(key, params, lang), [lang]);
  const te = useCallback(
    (group, value) => {
      const k = `${group}.${value}`;
      const out = translate(k, undefined, lang);
      return out === k ? String(value ?? "") : out;
    },
    [lang]
  );
  return { t, te, lang, isRtl: lang === "ar" };
}
export { translateEnum };

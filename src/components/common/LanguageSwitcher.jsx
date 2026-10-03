import { useDispatch } from "react-redux";
import { changeLanguage } from "../../store/reducers/languageSlice";
import { useT } from "../../i18n/useT";

// One compact toggle: shows the language you can switch TO ("العربية" while English is active, "EN" while Arabic is).
export default function LanguageSwitcher({ className = "" }) {
  const dispatch = useDispatch();
  const { t, lang } = useT();
  const next = lang === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      lang={next}
      className={`btn btn-sm btn-outline-secondary language-switcher ${className}`}
      aria-label={t("Switch language to {language}", { language: next === "ar" ? "العربية" : "English" })}
      title={next === "ar" ? "العربية" : "English"}
      onClick={() => dispatch(changeLanguage(next))}
    >
      {next === "ar" ? "العربية" : "EN"}
    </button>
  );
}

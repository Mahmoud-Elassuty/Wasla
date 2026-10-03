// Applies language + direction to <html> and swaps Bootstrap's LTR/RTL stylesheet (no reload).
import ltrUrl from "bootstrap/dist/css/bootstrap.min.css?url";
import rtlUrl from "bootstrap/dist/css/bootstrap.rtl.min.css?url";

const LINK_ID = "bootstrap-css";

const ensureLink = () => {
  let link = document.getElementById(LINK_ID);
  if (!link) {
    link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    document.head.prepend(link); // first in <head>, so the project's own CSS keeps winning
  }
  return link;
};

// Resolves once Bootstrap's stylesheet for `dir` is ready (or after a short timeout), so the
// first paint never flashes unstyled content.
export function applyDirection(lang) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const root = document.documentElement;
  root.lang = lang;
  root.dir = dir;
  const href = dir === "rtl" ? rtlUrl : ltrUrl;
  const link = ensureLink();
  if (link.getAttribute("href") === href) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => resolve();
    link.addEventListener("load", done, { once: true });
    link.addEventListener("error", done, { once: true });
    setTimeout(done, 1500);
    link.setAttribute("href", href);
  });
}

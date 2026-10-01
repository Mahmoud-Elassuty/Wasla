import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { PAGE_SIZE, paginate, parsePageParam } from "../utils/pagination";

// URL-driven pagination for an already filtered + sorted list.
//   - The only state is the `page` query param, so refresh, Back/Forward and shared links all work.
//   - `loaded` must be true once the product list has really loaded; until then an unusual page
//     number is left alone (an empty list would otherwise look like "page 1 of 1").
//   - Pages reset to page 1 by deleting `page` whenever they change a filter (see each page's setParam).
export default function usePagination(list, { loaded }) {
  const [params, setParams] = useSearchParams();
  const rawPage = params.get("page");
  const requestedPage = parsePageParam(rawPage);

  const result = useMemo(() => paginate(list, requestedPage, PAGE_SIZE), [list, requestedPage]);
  const { page } = result;

  const resultsRef = useRef(null);
  const scrollOnChange = useRef(false);

  // Tidy the URL: invalid values are dropped, too-high values become the last valid page.
  useEffect(() => {
    if (!loaded || rawPage === null || rawPage === "1") return;
    const canonical = page === 1 ? null : String(page);
    if (rawPage === canonical) return;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (canonical === null) next.delete("page");
        else next.set("page", canonical);
        return next;
      },
      { replace: true }
    );
  }, [loaded, rawPage, page, setParams]);

  // After a user-chosen page change, bring the top of the results back into view.
  useEffect(() => {
    if (!scrollOnChange.current) return;
    scrollOnChange.current = false;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [page]);

  const goToPage = useCallback(
    (target) => {
      if (target === page) return;
      scrollOnChange.current = true;
      // A new history entry per page, so the Back button returns to the previous page.
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (target <= 1) next.delete("page");
        else next.set("page", String(target));
        return next;
      });
    },
    [page, setParams]
  );

  return { ...result, goToPage, resultsRef };
}

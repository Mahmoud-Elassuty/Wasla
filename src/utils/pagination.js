// Pure helpers for client-side pagination. No React, no Redux, no side effects.

export const PAGE_SIZE = 12;

// Only a plain positive integer ("1", "2", "15") is a valid page.
// Missing, "abc", "-2", "2.5", "0", "01", "1e3" all fall back to page 1.
export function parsePageParam(raw) {
  return typeof raw === "string" && /^[1-9]\d{0,6}$/.test(raw) ? Number(raw) : 1;
}

// Slice an already filtered + sorted list. A page outside 1..totalPages is clamped to the nearest valid page.
export function paginate(list, requestedPage = 1, pageSize = PAGE_SIZE) {
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (page - 1) * pageSize;
  return {
    items: list.slice(startIndex, startIndex + pageSize),
    page,
    totalPages,
    total,
    start: total === 0 ? 0 : startIndex + 1,
    end: Math.min(startIndex + pageSize, total),
  };
}

// Page buttons to show, with "ellipsis-start" / "ellipsis-end" markers where pages are skipped.
//   9 pages, page 1 -> 1 2 3 … 9      page 5 -> 1 … 4 5 6 … 9      page 9 -> 1 … 7 8 9
// A gap of exactly one page is shown as that page instead of an ellipsis. At most 7 numbers are ever returned.
export function getPageItems(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  let first = page - 1;
  if (page <= 2) first = 1;
  else if (page >= totalPages - 1) first = totalPages - 2;

  const wanted = new Set([1, totalPages, first, first + 1, first + 2]);
  const numbers = [...wanted].sort((a, b) => a - b);

  const items = [];
  numbers.forEach((n, index) => {
    const prev = numbers[index - 1];
    if (prev !== undefined) {
      if (n - prev === 2) items.push(prev + 1);
      else if (n - prev > 2) items.push(index === numbers.length - 1 ? "ellipsis-end" : "ellipsis-start");
    }
    items.push(n);
  });
  return items;
}

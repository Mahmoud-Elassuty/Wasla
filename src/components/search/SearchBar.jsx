import { useEffect, useRef, useState } from "react";
import { addRecentSearch, getRecentSearches } from "../../utils/localStorage";

const SUGGESTION_LIMIT = 6;

// `suggestions` is the full list of product titles to match against (optional — the dropdown
// just won't show title suggestions without it). Recent searches always work, localStorage-only.
export default function SearchBar({ initialValue = "", onSearch, suggestions = [] }) {
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState(() => getRecentSearches());
  const blurTimer = useRef(null);

  // Stay in sync if the query changes from outside (e.g. browser back/forward).
  useEffect(() => setValue(initialValue), [initialValue]);
  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const runSearch = (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecent(addRecentSearch(trimmed));
    setOpen(false);
    onSearch(trimmed);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch(value);
  };

  const titleMatches =
    value.trim().length > 0
      ? [...new Set(suggestions)]
          .filter((title) => title.toLowerCase().includes(value.trim().toLowerCase()))
          .slice(0, SUGGESTION_LIMIT)
      : [];
  const showRecent = value.trim().length === 0 && recent.length > 0;
  const showDropdown = open && (showRecent || titleMatches.length > 0);

  return (
    <form className="search-hero-bar" onSubmit={handleSubmit} role="search">
      <div className="input-group">
        <input
          type="search"
          className="form-control"
          placeholder="Search products, brands, essentials..."
          aria-label="Search products"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay so a click on a dropdown item registers before the dropdown unmounts.
            blurTimer.current = setTimeout(() => setOpen(false), 150);
          }}
        />
        <button className="btn btn-accent" type="submit" aria-label="Search">
          <i className="bi bi-search" aria-hidden="true" />
        </button>
      </div>

      {showDropdown && (
        <div className="dropdown-menu d-block w-100 shadow-sm mt-1 p-2">
          {showRecent && (
            <div className="recent-searches mb-1">
              <div className="d-flex justify-content-between align-items-center px-1 mb-1">
                <span className="small text-secondary">Recent searches</span>
              </div>
              <div className="d-flex flex-wrap gap-2 px-1 pb-1">
                {recent.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="chip"
                    onMouseDown={(e) => e.preventDefault()} // keep focus so onBlur doesn't fire first
                    onClick={() => runSearch(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {titleMatches.map((title) => (
            <button
              key={title}
              type="button"
              className="dropdown-item text-truncate"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => runSearch(title)}
            >
              <i className="bi bi-search small text-secondary me-2" aria-hidden="true" />
              {title}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

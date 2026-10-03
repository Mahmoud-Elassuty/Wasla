import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../../store/reducers/productsSlice";
import { updatePreferences } from "../../store/reducers/authSlice";
import { showSuccess } from "../../utils/notifications";
import { titleCase } from "../../utils/format";

export default function InterestPreferences({ onboarding = false, onComplete }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { items, categories, status } = useSelector((s) => s.products);
  const [selected, setSelected] = useState(() => new Set(Array.isArray(user?.interests) ? user.interests : []));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const options = useMemo(() => {
    const names = new Map(categories.map((category) => [category.slug, category.name]));
    return [...new Set(items.map((product) => product.category).filter((value) => typeof value === "string" && value))]
      .sort((a, b) => a.localeCompare(b))
      .map((slug) => ({ slug, name: names.get(slug) || titleCase(slug) }));
  }, [categories, items]);

  useEffect(() => {
    if (status === "idle") dispatch(fetchProducts());
  }, [dispatch, status]);

  useEffect(() => {
    setSelected(new Set(Array.isArray(user?.interests) ? user.interests : []));
  }, [user?.id, user?.interests]);

  const toggleInterest = (slug) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const save = async (interests) => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await dispatch(updatePreferences({ interests, onboardingCompleted: true })).unwrap();
      dispatch(showSuccess("Your interests have been saved."));
      onComplete?.();
    } catch (error) {
      setSaveError(typeof error === "string" ? error : "We couldn't save your interests. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <>
      <div className="mb-3">
        <h2 id={onboarding ? "interest-onboarding-title" : "interest-settings-title"} className={onboarding ? "h3 mb-2" : "h5 mb-1"}>
          {onboarding ? "What are you interested in?" : "Manage your interests"}
        </h2>
        <p className="text-secondary mb-0">Choose categories to personalize your product suggestions.</p>
      </div>

      {saveError && <div className="alert alert-danger py-2" role="alert">{saveError}</div>}

      {status === "loading" && options.length === 0 ? (
        <div className="placeholder-glow" aria-busy="true" aria-label="Loading categories">
          <span className="placeholder d-block col-12 mb-2" style={{ height: 44 }} />
          <span className="placeholder d-block col-12 mb-2" style={{ height: 44 }} />
          <span className="placeholder d-block col-12" style={{ height: 44 }} />
        </div>
      ) : options.length > 0 ? (
        <div className="customer-interest-options" role="group" aria-label="Product categories">
          {options.map(({ slug, name }) => (
            <label key={slug} className={`customer-interest-option${selected.has(slug) ? " is-selected" : ""}`}>
              <input
                className="form-check-input"
                type="checkbox"
                checked={selected.has(slug)}
                onChange={() => toggleInterest(slug)}
                disabled={saving}
              />
              <span>{name}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="alert alert-warning py-2" role="status">
          Product categories are unavailable right now. You can retry or skip this step.
          <button type="button" className="btn btn-sm btn-link" disabled={status === "loading"} onClick={() => dispatch(fetchProducts())}>
            Retry
          </button>
        </div>
      )}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-4">
        {onboarding ? (
          <button type="button" className="btn btn-link px-0" disabled={saving} onClick={() => save([])}>
            Skip for now
          </button>
        ) : <span />}
        <button
          type="button"
          className="btn btn-accent"
          disabled={saving || (onboarding && selected.size === 0) || options.length === 0}
          onClick={() => save(options.filter(({ slug }) => selected.has(slug)).map(({ slug }) => slug))}
        >
          {saving ? (
            <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Saving...</>
          ) : onboarding ? "Save Preferences" : "Save Interests"}
        </button>
      </div>
    </>
  );

  if (!onboarding) {
    return <section aria-labelledby="interest-settings-title">{content}</section>;
  }

  return (
    <div className="customer-onboarding-backdrop">
      <section className="customer-onboarding-dialog" role="dialog" aria-modal="true" aria-labelledby="interest-onboarding-title">
        {content}
      </section>
    </div>
  );
}
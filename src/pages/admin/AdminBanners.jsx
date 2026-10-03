import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deleteBanner, fetchBanners, setBannerStatus } from "../../store/reducers/bannersSlice";
import { showError, showSuccess } from "../../utils/notifications";
import { useT } from "../../i18n/useT";

function BannerThumbnail({ banner }) {
  const { t } = useT();
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="admin-thumb d-flex align-items-center justify-content-center" aria-label={t("Image unavailable")}>
      <i className="bi bi-image text-secondary" aria-hidden="true" />
    </div>
  ) : (
    <img className="admin-thumb" src={banner.image} alt="" onError={() => setFailed(true)} />
  );
}

export default function AdminBanners() {
  const { t } = useT();
  const dispatch = useDispatch();
  const { items, status, error, deletingIds, updatingIds, actionError } = useSelector((state) => state.banners);
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => { dispatch(fetchBanners()); }, [dispatch]);

  const toggleStatus = async (banner) => {
    const nextStatus = banner.status === "active" ? "inactive" : "active";
    try {
      await dispatch(setBannerStatus({ id: banner.id, status: nextStatus })).unwrap();
      dispatch(showSuccess(`Banner “${banner.title}” is now ${nextStatus}.`));
    } catch (err) {
      dispatch(showError(typeof err === "string" ? err : "Couldn't update the banner status."));
    }
  };

  const confirmDelete = async (banner) => {
    try {
      await dispatch(deleteBanner(banner.id)).unwrap();
      dispatch(showSuccess(`Banner “${banner.title}” deleted.`));
    } catch (err) {
      dispatch(showError(typeof err === "string" ? err : "Couldn't delete the banner."));
    } finally {
      setConfirmingId(null);
    }
  };

  const loading = items.length === 0 && (status === "idle" || status === "loading");
  const failed = status === "failed" && items.length === 0;

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="eyebrow mb-1">{t("Content management")}</p>
          <h1 className="h3 mb-1">{t("Homepage Banners")}</h1>
          {items.length > 0 && <p className="small text-secondary mb-0">{items.length} banners</p>}
        </div>
        <Link to="/admin/banners/new" className="btn btn-accent">
          <i className="bi bi-plus-lg me-1" aria-hidden="true" /> {t("Add Banner")}
        </Link>
      </div>

      {actionError && <div className="alert alert-danger" role="alert">{actionError}</div>}
      {status === "failed" && items.length > 0 && <div className="alert alert-warning" role="alert">Refresh failed: {error}</div>}

      {failed ? (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{error || "We couldn't load the banners."}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => dispatch(fetchBanners())}>{t("Try again")}</button>
        </div>
      ) : loading ? (
        <div className="admin-card p-4 placeholder-glow" aria-busy="true" aria-label={t("Loading banners")}>
          {Array.from({ length: 4 }, (_, index) => <span key={index} className="placeholder d-block col-12 mb-3" style={{ height: 32 }} />)}
        </div>
      ) : (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="table admin-table align-middle mb-0">
              <thead><tr><th>{t("Image")}</th><th>{t("Banner")}</th><th>{t("CTA")}</th><th>{t("Destination")}</th><th>{t("Order")}</th><th>{t("Status")}</th><th>{t("Actions")}</th></tr></thead>
              <tbody>
                {items.map((banner) => {
                  const deleting = deletingIds.some((id) => String(id) === String(banner.id));
                  const updating = updatingIds.some((id) => String(id) === String(banner.id));
                  const confirming = String(confirmingId) === String(banner.id);
                  const active = banner.status === "active";
                  return (
                    <tr key={banner.id}>
                      <td><BannerThumbnail banner={banner} /></td>
                      <td style={{ minWidth: 190, maxWidth: 280 }}>
                        <div className="fw-semibold">{banner.title}</div>
                        {banner.subtitle && <div className="small text-secondary text-truncate">{banner.subtitle}</div>}
                      </td>
                      <td>{banner.buttonText}</td>
                      <td className="small text-break">{banner.buttonLink}</td>
                      <td>{banner.sortOrder}</td>
                      <td>
                        <button type="button" className={`badge rounded-pill border-0 ${active ? "stock-ok" : "stock-low"}`}
                          disabled={updating} onClick={() => toggleStatus(banner)}
                          aria-label={`Set ${banner.title} ${active ? "inactive" : "active"}`}>
                          {updating ? "Saving…" : active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="text-nowrap">
                        {confirming ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <span className="small">{t("Delete?")}</span>
                            <button type="button" className="btn btn-sm btn-danger" disabled={deleting} onClick={() => confirmDelete(banner)}>{t("Yes")}</button>
                            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={deleting} onClick={() => setConfirmingId(null)}>{t("No")}</button>
                          </span>
                        ) : (
                          <span className="d-inline-flex gap-2">
                            <Link to={`/admin/banners/${banner.id}/edit`} className="btn btn-sm btn-outline-secondary" aria-label={`Edit ${banner.title}`}>{t("Edit")}</Link>
                            <button type="button" className="btn btn-sm btn-outline-danger" disabled={deleting} onClick={() => setConfirmingId(banner.id)}>
                              {deleting ? t("Deleting...") : t("Delete")}
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && <tr><td colSpan={7} className="text-center text-secondary py-5">{t("No homepage banners yet.")}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
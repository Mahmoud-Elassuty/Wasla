import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmails } from "../../store/reducers/emailSlice";
import EmailPreview from "../../components/email/EmailPreview";
import "../../styles/email.css";
import { getLocale } from "../../i18n";
import { useT } from "../../i18n/useT";

const TYPE_LABEL = {
  order_confirmation: "Order confirmation",
  password_reset: "Password reset",
  welcome: "Welcome",
};

export default function AdminEmails() {
  const { t } = useT();
  const dispatch = useDispatch();
  const { sentEmails, status, error } = useSelector((s) => s.email);
  const [type, setType] = useState("");
  const [previewing, setPreviewing] = useState(null);

  useEffect(() => {
    const request = dispatch(fetchEmails());
    return () => request.abort();
  }, [dispatch]);

  const visible = sentEmails.filter((e) => !type || e.type === type);
  const hasEmails = sentEmails.length > 0;
  const loading = !hasEmails && (status === "idle" || status === "loading");
  const failed = !hasEmails && status === "failed";

  return (
    <>
      <div className="mb-4">
        <p className="eyebrow mb-1">{t("Emails (mock)")}</p>
        <h1 className="h3 mb-1">سجل البريد الإلكتروني</h1>
        {hasEmails && (
          <p className="small text-secondary mb-0">
            {t("Showing {shown} of {total} emails", { shown: visible.length, total: sentEmails.length })}
          </p>
        )}
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md-4 col-lg-3">
          <select className="form-select" aria-label={t("Filter by type")} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">{t("All types")}</option>
            {Object.entries(TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {failed ? (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{error || "We couldn't load the emails."}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => dispatch(fetchEmails())}>
            {t("Try again")}
          </button>
        </div>
      ) : loading ? (
        <div className="admin-card p-4 placeholder-glow" aria-busy="true" aria-label={t("Loading emails")}>
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="placeholder d-block col-12 mb-3" style={{ height: 32 }} />
          ))}
        </div>
      ) : (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="table admin-table align-middle mb-0">
              <thead>
                <tr>
                  <th>{t("To")}</th>
                  <th>{t("Subject")}</th>
                  <th>{t("Type")}</th>
                  <th>{t("Sent")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((email) => (
                  <tr key={email.id}>
                    <td className="text-nowrap">{email.to}</td>
                    <td style={{ maxWidth: 280 }}>
                      <div className="text-truncate">{email.subject}</div>
                    </td>
                    <td>
                      <span className="badge rounded-pill bg-wasla-soft text-wasla">
                        {TYPE_LABEL[email.type] ?? email.type}
                      </span>
                    </td>
                    <td className="text-nowrap">{new Date(email.sentAt).toLocaleString(getLocale())}</td>
                    <td>
                      <span className="badge bg-success-subtle text-success-emphasis text-capitalize">
                        {email.status}
                      </span>
                    </td>
                    <td className="text-nowrap">
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setPreviewing(email)}>
                        {t("View preview")}
                      </button>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-secondary py-5">
                      {hasEmails ? t("No emails match this filter.") : t("No emails sent yet.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EmailPreview email={previewing} onClose={() => setPreviewing(null)} />
    </>
  );
}

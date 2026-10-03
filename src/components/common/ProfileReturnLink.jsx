import { Link, useSearchParams } from "react-router-dom";
import { useT } from "../../i18n/useT";

export default function ProfileReturnLink({ className = "btn btn-outline-secondary" }) {
  const { t } = useT();
  const [params] = useSearchParams();
  if (params.get("from") !== "profile") return null;

  return (
    <Link to="/profile" className={className}>
      <i className="bi bi-arrow-left me-1" aria-hidden="true" />
      {t("Back to Profile")}
    </Link>
  );
}

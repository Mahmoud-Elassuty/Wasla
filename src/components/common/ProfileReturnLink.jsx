import { Link, useSearchParams } from "react-router-dom";

export default function ProfileReturnLink({ className = "btn btn-outline-secondary" }) {
  const [params] = useSearchParams();
  if (params.get("from") !== "profile") return null;

  return (
    <Link to="/profile" className={className}>
      <i className="bi bi-arrow-left me-1" aria-hidden="true" />
      Back to Profile
    </Link>
  );
}

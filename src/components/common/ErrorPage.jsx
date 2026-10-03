import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { useT } from "../../i18n/useT";

export default function ErrorPage() {
  const { t } = useT();
  const error = useRouteError();
  const notFound = !error || (isRouteErrorResponse(error) && error.status === 404);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center text-center px-3">
      <div>
        <p className="font-display fw-bold text-wasla mb-2" style={{ fontSize: "5rem", lineHeight: 1 }}>
          {notFound ? "404" : t("Oops!")}
        </p>
        <h1 className="h4 mb-2">{notFound ? t("Page not found") : t("Something went wrong")}</h1>
        <p className="text-secondary mb-4">
          {notFound
            ? t("The page you're looking for doesn't exist or has moved.")
            : t("An unexpected error occurred. Try again or head back to the store.")}
        </p>
        <Link to="/" className="btn btn-accent px-4 py-2">{t("Go back home")}</Link>
      </div>
    </div>
  );
}

import { useT } from "../../i18n/useT";
// Pure presentational header for the Offers page — mirrors CategoryHeader's shape
// (title + supporting line + live count) so the two "browse" pages feel consistent.
export default function OffersHeader({ count, loading }) {
  const { t } = useT();
  return (
    <div className="offers-header mb-4 text-center text-md-start">
      <div className="d-flex flex-wrap align-items-baseline gap-2 justify-content-center justify-content-md-start">
        <h1 className="h3 font-display mb-0">{t("Special Offers")}</h1>
        
      </div>
      <p className="text-secondary mb-1">{t("Save big on top products")}</p>
      <p className="small text-secondary mb-0">
        {loading ? t("Loading offers…") : t("offers.productsOnSale", { count })}
      </p>
    </div>
  );
}

import { Link, useLocation } from "react-router-dom";
import OrderStatus from "./OrderStatus";
import { formatPrice } from "../../utils/format";
import { formatOrderDate, orderItemCount, orderNumber } from "../../utils/checkout";
import { useT } from "../../i18n/useT";

const MAX_THUMBS = 4;

export default function OrderCard({ order }) {
  const { t } = useT();
  const { search } = useLocation();
  const fromProfile = new URLSearchParams(search).get("from") === "profile";
  const items = order.items ?? [];
  const count = orderItemCount(order);
  const extra = items.length - MAX_THUMBS;
  const detailsTo = `/orders/${order.id}${fromProfile ? "?from=profile" : ""}`;

  return (
    <article className="bg-white border rounded-4 p-3 p-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h2 className="h6 font-display text-break mb-1"><bdi dir="ltr">#{orderNumber(order.id)}</bdi></h2>
          <p className="small text-secondary mb-0">
            {formatOrderDate(order.createdAt)} · {t("count.items", { count })}
          </p>
        </div>
        <OrderStatus status={order.status} />
      </div>

      {items.length > 0 && (
        <div className="d-flex align-items-center gap-2 my-3">
          {items.slice(0, MAX_THUMBS).map((item, i) => (
            <span key={`${item.productId}-${i}`} className="cart-thumb sm">
              <img src={item.thumbnail} alt="" />
            </span>
          ))}
          {extra > 0 && <span className="small text-secondary">+{extra}</span>}
        </div>
      )}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 border-top pt-3">
        <div>
          <span className="small text-secondary d-block">{t("Total")}</span>
          <span className="font-display fs-5 fw-semibold">{formatPrice(order.total)}</span>
        </div>
        <Link to={detailsTo} className="btn btn-outline-secondary">
          {t("View details")}
        </Link>
      </div>
    </article>
  );
}

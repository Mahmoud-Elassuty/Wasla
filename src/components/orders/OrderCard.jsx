import { Link } from "react-router-dom";
import OrderStatus from "./OrderStatus";
import { formatPrice } from "../../utils/format";
import { formatOrderDate, orderItemCount, orderNumber } from "../../utils/checkout";

const MAX_THUMBS = 4;

export default function OrderCard({ order }) {
  const items = order.items ?? [];
  const count = orderItemCount(order);
  const extra = items.length - MAX_THUMBS;

  return (
    <article className="bg-white border rounded-4 p-3 p-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h2 className="h6 font-display mb-1">#{orderNumber(order.id)}</h2>
          <p className="small text-secondary mb-0">
            {formatOrderDate(order.createdAt)} · {count} {count === 1 ? "item" : "items"}
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

      <div className="d-flex justify-content-between align-items-center border-top pt-3">
        <div>
          <span className="small text-secondary d-block">Total</span>
          <span className="font-display fs-5 fw-semibold">{formatPrice(order.total)}</span>
        </div>
        <Link to={`/orders/${order.id}`} className="btn btn-outline-secondary">
          View details
        </Link>
      </div>
    </article>
  );
}

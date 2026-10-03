import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import OrderStatus from "../orders/OrderStatus";
import { formatPrice } from "../../utils/format";
import { getCategoryDisplayName } from "../../utils/categoryDisplay";
import {
  DEFAULT_RANGE,
  LOW_STOCK_THRESHOLD,
  RANGES,
  buildCategorySales,
  buildSalesSeries,
  buildStatusBreakdown,
  buildTopProducts,
  countCustomers,
  countLowStock,
  filterOrdersByRange,
  summarizeOrders,
} from "../../utils/adminAnalytics";
import { STRINGS, useAnalyticsLang } from "./analyticsStrings";

const RANGE_KEYS = { "7d": "range7d", "30d": "range30d", all: "rangeAll" };
const STATUS_COLORS = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#10b981",
  cancelled: "#ef4444",
  unknown: "#9ca3af",
};
const MAX_X_LABELS = 5;

const count = new Intl.NumberFormat("en-US");

function Segmented({ label, options, value, onChange }) {
  return (
    <div className="an-seg" role="group" aria-label={label}>
      {options.map(({ id, text }) => (
        <button
          key={id}
          type="button"
          className={`an-seg-btn${id === value ? " active" : ""}`}
          aria-pressed={id === value}
          onClick={() => onChange(id)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function Kpi({ label, value, note, icon, tone, to, loading, loadingText }) {
  const card = (
    <div className="stat-card an-kpi">
      <div className="d-flex justify-content-between align-items-start gap-2">
        <div className="min-w-0">
          <p className="small text-secondary mb-1">{label}</p>
          {loading ? (
            <p className="fs-5 text-secondary mb-0" aria-live="polite">{loadingText}</p>
          ) : (
            <p className="font-display fs-2 fw-bold mb-0">{value}</p>
          )}
          {!loading && <p className="an-note mb-0">{note}</p>}
        </div>
        <span className={`stat-icon ${tone}`}>
          <i className={`bi ${icon}`} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
  return to ? <Link to={to} className="an-kpi-link">{card}</Link> : card;
}

function SalesChart({ series, metric, t, fmtBucket, fmtValue, rtl }) {
  const [active, setActive] = useState(null);
  const values = series.map((p) => p[metric]);
  const max = Math.max(0, ...values);
  const last = series.length - 1;
  const latestWithData = values.reduce((found, v, i) => (v > 0 ? i : found), last);
  const index = active !== null && active <= last ? active : latestWithData;
  const point = series[index];
  const step = series.length > MAX_X_LABELS ? Math.ceil(series.length / MAX_X_LABELS) : 1;

  const onKeyDown = (e) => {
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    if (e.key === forward) setActive(Math.min(last, index + 1));
    else if (e.key === back) setActive(Math.max(0, index - 1));
    else return;
    e.preventDefault();
  };

  return (
    <div>
      <p className="an-readout" aria-live="polite">
        <strong>{fmtBucket(point)}</strong>
        <span>{fmtValue(point[metric])}</span>
        {metric === "revenue" && <span className="text-secondary">· {t.ordersCount(point.orders)}</span>}
      </p>
      <div className="an-chart" role="group" aria-label={t.salesOverview} tabIndex={0} onKeyDown={onKeyDown}>
        <span className="an-axis-max" aria-hidden="true">{fmtValue(max)}</span>
        <div className="an-plot">
          {series.map((p, i) => (
            <button
              key={p.key}
              type="button"
              tabIndex={-1}
              className={`an-col${i === index ? " is-active" : ""}`}
              aria-label={`${fmtBucket(p)}: ${fmtValue(p[metric])}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
            >
              <span className="an-bar" style={{ height: max > 0 ? `${(values[i] / max) * 100}%` : "0%" }} />
            </button>
          ))}
        </div>
        <div className="an-xaxis" aria-hidden="true">
          {series.map((p, i) => (
            <span key={p.key} className="an-xcell">
              {i % step === 0 && <span className="an-xlabel">{fmtBucket(p, true)}</span>}
            </span>
          ))}
        </div>
      </div>
      <p className="an-note mt-2 mb-0">{t.chartHint}</p>
    </div>
  );
}

export default function AnalyticsOverview({
  orders,
  products,
  users,
  ordersLoading,
  productsLoading,
  usersLoading,
}) {
  const lang = useAnalyticsLang();
  const t = STRINGS[lang];
  const rtl = lang === "ar";
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [metric, setMetric] = useState("revenue");
  const [now] = useState(Date.now);

  const locale = rtl ? "ar-EG-u-nu-latn" : "en-US";
  const dayFmt = useMemo(() => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }), [locale]);
  const monthFmt = useMemo(() => new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }), [locale]);
  // Axis labels use a compact form so they never collide on narrow screens; the readout and aria labels use the full one.
  const axisDayFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, rtl ? { day: "numeric", month: "numeric" } : { month: "short", day: "numeric" }),
    [locale, rtl],
  );
  const axisMonthFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, rtl ? { month: "numeric", year: "2-digit" } : { month: "short", year: "2-digit" }),
    [locale, rtl],
  );
  const fmtBucket = (p, compact = false) => {
    const [day, month] = compact ? [axisDayFmt, axisMonthFmt] : [dayFmt, monthFmt];
    return (p.unit === "month" ? month : day).format(p.date);
  };
  const fmtValue = (v) => (metric === "revenue" ? formatPrice(v) : count.format(v));

  const filtered = useMemo(() => filterOrdersByRange(orders, range, now), [orders, range, now]);
  const summary = useMemo(() => summarizeOrders(filtered), [filtered]);
  const series = useMemo(() => buildSalesSeries(filtered, range, now), [filtered, range, now]);
  const statuses = useMemo(() => buildStatusBreakdown(filtered), [filtered]);
  const topProducts = useMemo(() => buildTopProducts(filtered, products), [filtered, products]);
  const categories = useMemo(() => buildCategorySales(filtered, products), [filtered, products]);
  const customers = useMemo(() => countCustomers(users), [users]);
  const lowStock = useMemo(() => countLowStock(products), [products]);

  const chartHasData = series.length > 0 && (metric === "revenue" ? summary.revenue > 0 : summary.totalOrders > 0);
  const topCategoryRevenue = categories[0]?.revenue || 0;
  const loadingText = t.loading;

  return (
    <section className="an-section mb-4" dir={rtl ? "rtl" : "ltr"} lang={lang} aria-labelledby="analytics-title">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
        <div className="min-w-0">
          <h2 id="analytics-title" className="h4 mb-1">{t.title}</h2>
          <p className="small text-secondary mb-0">{t.subtitle}</p>
        </div>
        <Segmented
          label={t.rangeLabel}
          value={range}
          onChange={setRange}
          options={RANGES.map((id) => ({ id, text: t[RANGE_KEYS[id]] }))}
        />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4">
          <Kpi label={t.revenue} value={formatPrice(summary.revenue)} note={t.revenueNote} icon="bi-cash-stack" tone="stat-green" loading={ordersLoading} loadingText={loadingText} />
        </div>
        <div className="col-6 col-md-4">
          <Kpi label={t.orders} value={count.format(summary.totalOrders)} note={t.ordersNote(summary.cancelledOrders)} icon="bi-receipt" tone="stat-blue" to="/admin/orders" loading={ordersLoading} loadingText={loadingText} />
        </div>
        <div className="col-6 col-md-4">
          <Kpi label={t.aov} value={formatPrice(summary.averageOrderValue)} note={t.aovNote} icon="bi-graph-up-arrow" tone="stat-purple" loading={ordersLoading} loadingText={loadingText} />
        </div>
        <div className="col-6 col-md-4">
          <Kpi label={t.customers} value={count.format(customers)} note={t.customersNote} icon="bi-people" tone="stat-blue" to="/admin/users" loading={usersLoading} loadingText={loadingText} />
        </div>
        <div className="col-6 col-md-4">
          <Kpi label={t.pending} value={count.format(summary.pendingOrders)} note={t.pendingNote} icon="bi-hourglass-split" tone="stat-orange" to="/admin/orders?status=pending" loading={ordersLoading} loadingText={loadingText} />
        </div>
        <div className="col-6 col-md-4">
          <Kpi label={t.lowStock} value={count.format(lowStock)} note={t.lowStockNote(LOW_STOCK_THRESHOLD)} icon="bi-box-seam" tone="stat-orange" to="/admin/products" loading={productsLoading} loadingText={loadingText} />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="admin-card p-3 p-md-4 h-100">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h3 className="h5 mb-0">{t.salesOverview}</h3>
              <Segmented
                label={t.metricToggle}
                value={metric}
                onChange={setMetric}
                options={[
                  { id: "revenue", text: t.metricRevenue },
                  { id: "orders", text: t.metricOrders },
                ]}
              />
            </div>
            {ordersLoading ? (
              <p className="text-secondary mb-0">{loadingText}</p>
            ) : chartHasData ? (
              <SalesChart series={series} metric={metric} t={t} fmtBucket={fmtBucket} fmtValue={fmtValue} rtl={rtl} />
            ) : (
              <p className="an-empty mb-0">{metric === "revenue" && summary.totalOrders > 0 ? t.chartEmptyRevenue : t.chartEmpty}</p>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="admin-card p-3 p-md-4 h-100">
            <h3 className="h5 mb-3">{t.statusTitle}</h3>
            {ordersLoading ? (
              <p className="text-secondary mb-0">{loadingText}</p>
            ) : statuses.length === 0 ? (
              <p className="an-empty mb-0">{t.statusEmpty}</p>
            ) : (
              <ul className="list-unstyled d-grid gap-3 mb-0">
                {statuses.map(({ status, count: n, percent }) => (
                  <li key={status}>
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-1">
                      <OrderStatus status={status} />
                      <span className="small fw-semibold">
                        {count.format(n)} <span className="text-secondary fw-normal">({Math.round(percent)}%)</span>
                      </span>
                    </div>
                    <div className="an-progress" aria-hidden="true">
                      <span style={{ width: `${percent}%`, background: STATUS_COLORS[status] ?? STATUS_COLORS.unknown }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="admin-card p-3 p-md-4 h-100">
            <h3 className="h5 mb-3">{t.topProducts}</h3>
            {ordersLoading ? (
              <p className="text-secondary mb-0">{loadingText}</p>
            ) : topProducts.length === 0 ? (
              <p className="an-empty mb-0">{t.topProductsEmpty}</p>
            ) : (
              <ol className="list-unstyled d-grid gap-3 mb-0">
                {topProducts.map((p) => (
                  <li key={p.id} className="d-flex align-items-center gap-2">
                    {p.thumbnail ? <img src={p.thumbnail} alt="" className="admin-thumb" loading="lazy" /> : <span className="admin-thumb" aria-hidden="true" />}
                    <div className="flex-grow-1 min-w-0">
                      <div className="small fw-semibold text-truncate" title={p.title}>{p.title}</div>
                      <div className="an-note">{t.unitsSold(count.format(p.units))}</div>
                    </div>
                    <div className="small fw-semibold text-nowrap">{formatPrice(p.revenue)}</div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="admin-card p-3 p-md-4 h-100">
            <h3 className="h5 mb-3">{t.categories}</h3>
            {ordersLoading || productsLoading ? (
              <p className="text-secondary mb-0">{loadingText}</p>
            ) : categories.length === 0 ? (
              <p className="an-empty mb-0">{t.categoriesEmpty}</p>
            ) : (
              <ul className="list-unstyled d-grid gap-3 mb-0">
                {categories.map((c) => (
                  <li key={c.category}>
                    <div className="d-flex justify-content-between align-items-baseline gap-2 mb-1">
                      <span className="small fw-semibold text-truncate">{getCategoryDisplayName(c.category)}</span>
                      <span className="small fw-semibold text-nowrap">{formatPrice(c.revenue)}</span>
                    </div>
                    <div className="an-progress" aria-hidden="true">
                      <span style={{ width: `${topCategoryRevenue > 0 ? (c.revenue / topCategoryRevenue) * 100 : 0}%` }} />
                    </div>
                    <div className="an-note mt-1">{t.units(count.format(c.units))}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

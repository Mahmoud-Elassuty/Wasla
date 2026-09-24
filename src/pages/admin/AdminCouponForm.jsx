import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  createCoupon,
  fetchAdminCoupons,
  resetCouponSave,
  resetCouponsStatus,
  updateCoupon,
} from "../../store/reducers/adminSlice";
import FormField from "../../components/common/FormField";

const FIELD_ORDER = ["code", "discount", "type", "minTotal", "maxDiscount", "validFrom", "validUntil", "usageLimit"];

const toForm = (c) => ({
  code: c?.code ?? "",
  discount: c ? String(c.discount) : "",
  type: c?.type ?? "percentage",
  minTotal: c?.minTotal != null ? String(c.minTotal) : "",
  maxDiscount: c?.maxDiscount != null ? String(c.maxDiscount) : "",
  validFrom: c?.validFrom ?? "",
  validUntil: c?.validUntil ?? "",
  usageLimit: c?.usageLimit != null ? String(c.usageLimit) : "",
  active: c?.active ?? true,
});

function validate(v) {
  const e = {};
  if (!v.code.trim()) e.code = "Code is required";
  else if (!/^[A-Z0-9-]{3,20}$/.test(v.code.trim().toUpperCase())) {
    e.code = "Use 3-20 letters, numbers or dashes";
  }

  const discount = Number(v.discount);
  if (v.discount.trim() === "") e.discount = "Discount is required";
  else if (!Number.isFinite(discount) || discount <= 0) e.discount = "Enter a discount greater than 0";
  else if (v.type === "percentage" && discount > 100) e.discount = "A percentage discount can't exceed 100";

  if (v.minTotal.trim() !== "") {
    const n = Number(v.minTotal);
    if (!Number.isFinite(n) || n < 0) e.minTotal = "Minimum total must be 0 or more";
  }

  if (v.maxDiscount.trim() !== "") {
    const n = Number(v.maxDiscount);
    if (!Number.isFinite(n) || n <= 0) e.maxDiscount = "Max discount must be greater than 0";
  }

  if (v.validFrom && v.validUntil && v.validUntil < v.validFrom) {
    e.validUntil = "Must be on or after the start date";
  }

  if (v.usageLimit.trim() !== "") {
    const n = Number(v.usageLimit);
    if (!Number.isInteger(n) || n <= 0) e.usageLimit = "Usage limit must be a whole number greater than 0";
  }

  return e;
}

function CouponFormView({ coupon }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { couponSaveStatus, couponSaveError } = useSelector((s) => s.admin);
  const [values, setValues] = useState(() => toForm(coupon));
  const [errors, setErrors] = useState({});
  const saving = couponSaveStatus === "loading";
  const editing = Boolean(coupon);

  useEffect(() => {
    dispatch(resetCouponSave()); // forget an old error from a previous visit
  }, [dispatch]);

  const handleChange = ({ target: { name, value, type, checked } }) => {
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const found = validate(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((f) => found[f]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    const data = {
      // PUT replaces the whole record, so start from everything the coupon already has
      ...(coupon ?? { usedCount: 0 }),
      code: values.code.trim().toUpperCase(),
      discount: Number(values.discount),
      type: values.type,
      minTotal: values.minTotal.trim() === "" ? undefined : Number(values.minTotal),
      maxDiscount: values.type === "percentage" && values.maxDiscount.trim() !== "" ? Number(values.maxDiscount) : undefined,
      validFrom: values.validFrom || undefined,
      validUntil: values.validUntil || undefined,
      usageLimit: values.usageLimit.trim() === "" ? undefined : Number(values.usageLimit),
      active: values.active,
    };

    try {
      if (editing) await dispatch(updateCoupon({ id: coupon.id, data })).unwrap();
      else await dispatch(createCoupon(data)).unwrap();
      navigate("/admin/coupons", { state: { notice: editing ? "Coupon updated." : "Coupon created." } });
    } catch {
      /* the error message is already in the store */
    }
  };

  const field = (name) => ({ id: name, value: values[name], onChange: handleChange, error: errors[name] });

  return (
    <>
      <div className="mb-4">
        <p className="eyebrow mb-1">{editing ? "Edit coupon" : "New coupon"}</p>
        <h1 className="h3 mb-0">{editing ? "تعديل كوبون" : "إضافة كوبون"}</h1>
      </div>

      <form className="admin-card p-3 p-md-4" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={saving} className="border-0 p-0 m-0">
          <div className="row">
            <div className="col-md-6">
              <FormField
                {...field("code")}
                label="Code"
                placeholder="WASLA10"
                maxLength={20}
                style={{ textTransform: "uppercase" }}
                spellCheck={false}
              />
            </div>
            <div className="col-md-6">
              <FormField {...field("type")} as="select" label="Type">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </FormField>
            </div>
            <div className="col-md-6">
              <FormField
                {...field("discount")}
                type="number" min="0" step="0.01" inputMode="decimal"
                label={values.type === "percentage" ? "Discount (%)" : "Discount (USD)"}
                placeholder={values.type === "percentage" ? "10" : "50"}
              />
            </div>
            <div className="col-md-6">
              <FormField
                {...field("maxDiscount")}
                type="number" min="0" step="0.01" inputMode="decimal"
                label="Max discount (optional)"
                placeholder="No cap"
                disabled={saving || values.type !== "percentage"}
              />
              {values.type !== "percentage" && (
                <p className="form-text" style={{ marginTop: "-0.5rem" }}>
                  Only applies to percentage coupons.
                </p>
              )}
            </div>
            <div className="col-md-6">
              <FormField
                {...field("minTotal")}
                type="number" min="0" step="0.01" inputMode="decimal"
                label="Minimum cart total (optional)"
                placeholder="No minimum"
              />
            </div>
            <div className="col-md-6">
              <FormField
                {...field("usageLimit")}
                type="number" min="1" step="1" inputMode="numeric"
                label="Usage limit (optional)"
                placeholder="Unlimited"
              />
            </div>
            <div className="col-md-6">
              <FormField {...field("validFrom")} type="date" label="Valid from (optional)" />
            </div>
            <div className="col-md-6">
              <FormField {...field("validUntil")} type="date" label="Valid until (optional)" />
            </div>
            <div className="col-12">
              <div className="form-check">
                <input
                  id="active"
                  name="active"
                  type="checkbox"
                  className="form-check-input"
                  checked={values.active}
                  onChange={handleChange}
                />
                <label htmlFor="active" className="form-check-label small fw-semibold">
                  Active
                </label>
              </div>
            </div>
          </div>
        </fieldset>

        {couponSaveError && (
          <div className="alert alert-danger py-2 mt-3" role="alert">
            {couponSaveError}
          </div>
        )}

        <div className="d-flex flex-wrap gap-2 pt-3">
          <button type="submit" className="btn btn-accent px-4" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
          <Link to="/admin/coupons" className="btn btn-outline-secondary px-4">Cancel</Link>
        </div>
      </form>
    </>
  );
}

export default function AdminCouponForm() {
  const { id } = useParams(); // undefined on /admin/coupons/new
  const dispatch = useDispatch();
  const { coupons, couponsStatus, couponsError } = useSelector((s) => s.admin);
  const editing = id !== undefined;

  useEffect(() => {
    if (!editing) return;
    const request = dispatch(fetchAdminCoupons());
    return () => {
      request.abort();
      dispatch(resetCouponsStatus());
    };
  }, [dispatch, editing]);

  if (!editing) return <CouponFormView key="new" />;

  const coupon = coupons.find((c) => String(c.id) === id);
  if (coupon) return <CouponFormView key={coupon.id} coupon={coupon} />;

  if (couponsStatus === "succeeded" || couponsStatus === "failed") {
    return (
      <div className="text-center py-5">
        <h1 className="h4">We couldn't find this coupon</h1>
        <p className="text-secondary">
          {couponsStatus === "failed" ? couponsError : "It may have been deleted."}
        </p>
        <Link to="/admin/coupons" className="btn btn-outline-secondary">Back to coupons</Link>
      </div>
    );
  }

  return (
    <div className="text-center py-5" role="status">
      <div className="spinner-border text-primary" />
      <span className="visually-hidden">Loading coupon...</span>
    </div>
  );
}

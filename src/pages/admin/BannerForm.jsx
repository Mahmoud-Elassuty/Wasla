import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import FormField from "../../components/common/FormField";
import { createBanner, fetchBannerById, resetBannerSave, updateBanner } from "../../store/reducers/bannersSlice";
import { showError, showSuccess } from "../../utils/notifications";

const FIELD_ORDER = ["title", "image", "buttonText", "buttonLink", "status", "sortOrder"];
const toForm = (banner) => ({
  title: banner?.title ?? "",
  subtitle: banner?.subtitle ?? "",
  image: banner?.image ?? "",
  buttonText: banner?.buttonText ?? "",
  buttonLink: banner?.buttonLink ?? "",
  status: banner?.status ?? "active",
  sortOrder: banner ? String(banner.sortOrder) : "1",
});

function isHttpUrl(value) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch { return false; }
}

function validate(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = "Title is required";
  if (!values.image.trim()) errors.image = "Image URL is required";
  else if (!isHttpUrl(values.image.trim())) errors.image = "Enter a valid HTTP or HTTPS URL";
  if (!values.buttonText.trim()) errors.buttonText = "Button text is required";
  if (!values.buttonLink.trim()) errors.buttonLink = "Button link is required";
  else if (!/^\/(?!\/)[^\\\s]*$/.test(values.buttonLink.trim())) errors.buttonLink = "Use an internal path beginning with /";
  if (!["active", "inactive"].includes(values.status)) errors.status = "Choose Active or Inactive";
  const sortOrder = Number(values.sortOrder);
  if (values.sortOrder.trim() === "") errors.sortOrder = "Sort order is required";
  else if (!Number.isInteger(sortOrder) || sortOrder <= 0) errors.sortOrder = "Enter a positive whole number";
  return errors;
}

function BannerFormView({ banner }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { saveStatus, saveError } = useSelector((state) => state.banners);
  const editing = Boolean(banner);
  const saving = saveStatus === "loading";
  const [values, setValues] = useState(() => toForm(banner));
  const [errors, setErrors] = useState({});

  useEffect(() => { dispatch(resetBannerSave()); }, [dispatch]);

  const handleChange = ({ target: { name, value } }) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const found = validate(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    const now = new Date().toISOString();
    const data = {
      title: values.title.trim(),
      subtitle: values.subtitle.trim(),
      image: values.image.trim(),
      buttonText: values.buttonText.trim(),
      buttonLink: values.buttonLink.trim(),
      status: values.status,
      sortOrder: Number(values.sortOrder),
      updatedAt: now,
      ...(!editing ? { createdAt: now } : {}),
    };

    try {
      if (editing) await dispatch(updateBanner({ id: banner.id, data })).unwrap();
      else await dispatch(createBanner(data)).unwrap();
      dispatch(showSuccess(editing ? "Banner updated." : "Banner created."));
      navigate("/admin/banners");
    } catch (err) {
      dispatch(showError(typeof err === "string" ? err : "Couldn't save the banner."));
    }
  };

  const field = (name) => ({ id: name, value: values[name], onChange: handleChange, error: errors[name] });

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="eyebrow mb-1">{editing ? "Edit homepage banner" : "New homepage banner"}</p>
          <h1 className="h3 mb-0">{editing ? "Edit Banner" : "Add Banner"}</h1>
        </div>
        <Link to="/admin/banners" className="btn btn-outline-secondary">Back to banners</Link>
      </div>
      <form className="admin-card p-3 p-md-4" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={saving} className="border-0 p-0 m-0">
          {saveError && <div className="alert alert-danger" role="alert">{saveError}</div>}
          <div className="row">
            <div className="col-md-6"><FormField {...field("title")} label="Title" maxLength={120} /></div>
            <div className="col-md-6"><FormField {...field("subtitle")} label="Subtitle (optional)" maxLength={240} /></div>
            <div className="col-12"><FormField {...field("image")} label="Image URL" type="url" placeholder="https://example.com/banner.jpg" /></div>
            <div className="col-md-6"><FormField {...field("buttonText")} label="Button text" maxLength={40} /></div>
            <div className="col-md-6"><FormField {...field("buttonLink")} label="Internal button link" placeholder="/products" /></div>
            <div className="col-md-6">
              <FormField {...field("status")} as="select" label="Status">
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </FormField>
            </div>
            <div className="col-md-6"><FormField {...field("sortOrder")} label="Sort order" type="number" min="1" step="1" inputMode="numeric" /></div>
          </div>
        </fieldset>
        <div className="d-flex flex-wrap gap-2 mt-2">
          <button type="submit" className="btn btn-accent px-4" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create banner"}
          </button>
          <Link to="/admin/banners" className="btn btn-outline-secondary px-4">Cancel</Link>
        </div>
      </form>
    </>
  );
}

export default function BannerForm() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const state = useSelector((root) => root.banners);
  const editing = id !== undefined;

  useEffect(() => {
    if (editing) dispatch(fetchBannerById(id));
  }, [dispatch, editing, id]);

  if (!editing) return <BannerFormView key="new" />;
  const banner = state.selectedBanner && String(state.selectedBanner.id) === id ? state.selectedBanner : null;
  if (banner) return <BannerFormView key={banner.id} banner={banner} />;

  if (state.detailStatus === "succeeded" && String(state.detailId) === id) {
    return (
      <div className="text-center py-5">
        <h1 className="h4">We couldn't find this banner</h1>
        <p className="text-secondary">It may have been deleted or the link is incorrect.</p>
        <Link to="/admin/banners" className="btn btn-outline-secondary">Back to banners</Link>
      </div>
    );
  }
  if (state.detailStatus === "failed" && String(state.detailId) === id) {
    return (
      <div className="alert alert-danger" role="alert">
        <p className="mb-3">{state.detailError || "We couldn't load this banner."}</p>
        <button type="button" className="btn btn-outline-danger me-2" onClick={() => dispatch(fetchBannerById(id))}>Try again</button>
        <Link to="/admin/banners" className="btn btn-outline-secondary">Back to banners</Link>
      </div>
    );
  }
  return (
    <div className="text-center py-5" role="status">
      <div className="spinner-border text-primary" /><span className="visually-hidden">Loading banner...</span>
    </div>
  );
}
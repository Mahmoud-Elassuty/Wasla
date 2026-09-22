import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  createProduct,
  fetchAdminProducts,
  resetProductsStatus,
  resetSave,
  updateProduct,
} from "../../store/reducers/adminSlice";
import { fetchCategories } from "../../store/reducers/productsSlice";
import FormField from "../../components/common/FormField";
import { titleCase } from "../../utils/format";

const FIELD_ORDER = ["title", "description", "price", "discountPercentage", "stock", "category", "brand", "images"];

const parseImages = (text) => text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
const isUrl = (s) => {
  try {
    const { protocol } = new URL(s);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

const toForm = (p) => ({
  title: p?.title ?? "",
  description: p?.description ?? "",
  price: p ? String(p.price) : "",
  discountPercentage: p?.discountPercentage ? String(p.discountPercentage) : "",
  category: p?.category ?? "",
  stock: p ? String(p.stock) : "",
  images: (p?.images?.length ? p.images : p?.thumbnail ? [p.thumbnail] : []).join("\n"),
  brand: p?.brand ?? "",
});

function validate(v) {
  const e = {};
  if (!v.title.trim()) e.title = "Name is required";
  if (!v.description.trim()) e.description = "Description is required";

  const price = Number(v.price);
  if (v.price.trim() === "") e.price = "Price is required";
  else if (!Number.isFinite(price) || price <= 0) e.price = "Enter a price greater than 0";

  if (v.discountPercentage.trim() !== "") {
    const d = Number(v.discountPercentage);
    if (!Number.isFinite(d) || d < 0 || d > 100) e.discountPercentage = "Discount must be between 0 and 100";
  }

  if (!v.category) e.category = "Choose a category";

  const stock = Number(v.stock);
  if (v.stock.trim() === "") e.stock = "Stock is required";
  else if (!Number.isInteger(stock) || stock < 0) e.stock = "Stock must be a whole number, 0 or more";

  const images = parseImages(v.images);
  if (images.length === 0) e.images = "Add at least one image URL";
  else {
    const bad = images.find((url) => !isUrl(url));
    if (bad) e.images = `"${bad}" is not a valid http(s) URL`;
  }
  return e;
}

function ProductFormView({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { saveStatus, saveError, products } = useSelector((s) => s.admin);
  const publicCategories = useSelector((s) => s.products.categories);
  const [values, setValues] = useState(() => toForm(product));
  const [errors, setErrors] = useState({});
  const saving = saveStatus === "loading";
  const editing = Boolean(product);

  useEffect(() => {
    dispatch(resetSave()); // forget an old error from a previous visit
    dispatch(fetchCategories());
  }, [dispatch]);

  const categories = publicCategories.length
    ? publicCategories
    : [...new Set(products.map((p) => p.category))].map((slug) => ({ slug, name: titleCase(slug) }));
  const categoryOptions =
    values.category && !categories.some((c) => c.slug === values.category)
      ? [...categories, { slug: values.category, name: titleCase(values.category) }]
      : categories;

  const handleChange = ({ target: { name, value } }) => {
    setValues((v) => ({ ...v, [name]: value }));
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

    const images = parseImages(values.images);
    const imagesChanged = !editing || JSON.stringify(images) !== JSON.stringify(product.images ?? []);
    const data = {
      // PUT replaces the whole record, so start from everything the product already has
      ...(product ?? { rating: 0, tags: [], reviews: [] }),
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      price: Math.round(Number(values.price) * 100) / 100,
      discountPercentage: values.discountPercentage.trim() === "" ? 0 : Number(values.discountPercentage),
      stock: Number(values.stock),
      brand: values.brand.trim(),
      images,
      thumbnail: !imagesChanged && product.thumbnail ? product.thumbnail : images[0],
    };

    try {
      if (editing) await dispatch(updateProduct({ id: product.id, data })).unwrap();
      else await dispatch(createProduct(data)).unwrap();
      navigate("/admin/products", { state: { notice: editing ? "Product updated." : "Product created." } });
    } catch {
      /* the error message is already in the store */
    }
  };

  const field = (name) => ({ id: name, value: values[name], onChange: handleChange, error: errors[name] });
  const previews = parseImages(values.images).filter(isUrl).slice(0, 4);

  return (
    <>
      <div className="mb-4">
        <p className="eyebrow mb-1">{editing ? "Edit product" : "New product"}</p>
        <h1 className="h3 mb-0">{editing ? "تعديل منتج" : "إضافة منتج"}</h1>
      </div>

      <form className="admin-card p-3 p-md-4" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={saving} className="border-0 p-0 m-0">
          <div className="row">
            <div className="col-12">
              <FormField {...field("title")} label="Name" placeholder="Product name" maxLength={120} />
            </div>
            <div className="col-12">
              <FormField {...field("description")} as="textarea" rows={4} label="Description" placeholder="What is this product?" />
            </div>
            <div className="col-md-4">
              <FormField {...field("price")} type="number" min="0" step="0.01" inputMode="decimal" label="Price (USD)" placeholder="0.00" />
            </div>
            <div className="col-md-4">
              <FormField
                {...field("discountPercentage")}
                type="number" min="0" max="100" step="0.01" inputMode="decimal"
                label="Discount % (optional)" placeholder="0"
              />
            </div>
            <div className="col-md-4">
              <FormField {...field("stock")} type="number" min="0" step="1" inputMode="numeric" label="Stock" placeholder="0" />
            </div>
            <div className="col-md-6">
              <FormField {...field("category")} as="select" label="Category">
                <option value="">Select category</option>
                {categoryOptions.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </FormField>
            </div>
            <div className="col-md-6">
              <FormField {...field("brand")} label="Brand (optional)" placeholder="Brand name" maxLength={80} />
            </div>
            <div className="col-12">
              <FormField
                {...field("images")}
                as="textarea"
                rows={4}
                label="Image URLs"
                placeholder="https://example.com/photo.jpg"
                spellCheck={false}
              />
              <p className="form-text" style={{ marginTop: "-0.5rem" }}>One URL per line. The first image is the main one.</p>
              {previews.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {previews.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className="admin-thumb"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </fieldset>

        {saveError && (
          <div className="alert alert-danger py-2" role="alert">
            {saveError}
          </div>
        )}

        <div className="d-flex flex-wrap gap-2 pt-2">
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
          <Link to="/admin/products" className="btn btn-outline-secondary px-4">Cancel</Link>
        </div>
      </form>
    </>
  );
}

export default function AdminProductForm() {
  const { id } = useParams(); // undefined on /admin/products/new
  const dispatch = useDispatch();
  const { products, productsStatus, productsError } = useSelector((s) => s.admin);
  const editing = id !== undefined;

  useEffect(() => {
    if (!editing) return;
    const request = dispatch(fetchAdminProducts());
    return () => {
      request.abort();
      dispatch(resetProductsStatus());
    };
  }, [dispatch, editing]);

  if (!editing) return <ProductFormView key="new" />;

  const product = products.find((p) => String(p.id) === id);
  if (product) return <ProductFormView key={product.id} product={product} />;

  if (productsStatus === "succeeded" || productsStatus === "failed") {
    return (
      <div className="text-center py-5">
        <h1 className="h4">We couldn't find this product</h1>
        <p className="text-secondary">
          {productsStatus === "failed" ? productsError : "It may have been deleted."}
        </p>
        <Link to="/admin/products" className="btn btn-outline-secondary">Back to products</Link>
      </div>
    );
  }

  return (
    <div className="text-center py-5" role="status">
      <div className="spinner-border text-primary" />
      <span className="visually-hidden">Loading product...</span>
    </div>
  );
}

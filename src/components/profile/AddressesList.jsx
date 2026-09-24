import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addAddress,
  clearActionError,
  deleteAddress,
  resetAddressSave,
  setDefaultAddress,
  updateAddress,
} from "../../store/reducers/profileSlice";
import AddressForm from "./AddressForm";

export default function AddressesList() {
  const dispatch = useDispatch();
  const {
    addresses,
    addressesStatus,
    addressesError,
    addressSaveStatus,
    addressSaveError,
    deletingAddressIds,
    settingDefaultIds,
    actionError,
  } = useSelector((s) => s.profile);
  const [mode, setMode] = useState(null); // null | "add" | address.id being edited
  const [confirmingId, setConfirmingId] = useState(null);
  const saving = addressSaveStatus === "loading";

  const openAdd = () => {
    dispatch(resetAddressSave());
    setMode("add");
  };
  const openEdit = (id) => {
    dispatch(resetAddressSave());
    setMode(id);
  };
  const closeForm = () => {
    dispatch(resetAddressSave());
    setMode(null);
  };

  const handleAdd = (values) => dispatch(addAddress(values)).unwrap().then(closeForm).catch(() => {});
  const handleEdit = (id, existing) => (values) =>
    dispatch(updateAddress({ id, data: { ...existing, ...values, id } }))
      .unwrap()
      .then(closeForm)
      .catch(() => {});

  const loading = addresses.length === 0 && (addressesStatus === "idle" || addressesStatus === "loading");
  const failed = addresses.length === 0 && addressesStatus === "failed";

  if (loading) {
    return (
      <div className="placeholder-glow" aria-busy="true" aria-label="Loading addresses">
        {Array.from({ length: 2 }, (_, i) => (
          <span key={i} className="placeholder d-block col-12 mb-3" style={{ height: 90 }} />
        ))}
      </div>
    );
  }

  if (failed) {
    return (
      <div className="alert alert-danger py-2" role="alert">
        {addressesError || "We couldn't load your addresses."}
      </div>
    );
  }

  return (
    <div>
      {actionError && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center gap-3" role="alert">
          <span>{actionError}</span>
          <button type="button" className="btn-close" aria-label="Dismiss" onClick={() => dispatch(clearActionError())} />
        </div>
      )}

      {addresses.length === 0 && mode !== "add" && (
        <p className="text-secondary mb-3">You don't have any saved addresses yet.</p>
      )}

      {addresses.map((address) =>
        mode === address.id ? (
          <AddressForm
            key={address.id}
            initialValues={address}
            saving={saving}
            error={addressSaveError}
            onCancel={closeForm}
            onSubmit={handleEdit(address.id, address)}
          />
        ) : (
          <div key={address.id} className="address-card border rounded-4 p-3 mb-3 bg-white">
            <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
              <h3 className="h6 mb-0">
                {address.name}
                {address.isDefault && <span className="badge rounded-pill stock-ok ms-2">Default</span>}
              </h3>
            </div>
            <p className="text-secondary mb-1">
              {address.address}, {address.city}, {address.governorate}
              {address.postalCode ? ` ${address.postalCode}` : ""}
            </p>
            <p className="small text-secondary mb-3">{address.phone}</p>
            <div className="d-flex flex-wrap gap-2">
              {!address.isDefault && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={settingDefaultIds.includes(address.id)}
                  onClick={() => dispatch(setDefaultAddress(address.id))}
                >
                  {settingDefaultIds.includes(address.id) ? "Saving..." : "Set as default"}
                </button>
              )}
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(address.id)}>
                Edit
              </button>
              {confirmingId === address.id ? (
                <span className="d-inline-flex align-items-center gap-2">
                  <span className="small">Delete?</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    disabled={deletingAddressIds.includes(address.id)}
                    onClick={() => {
                      dispatch(deleteAddress(address.id));
                      setConfirmingId(null);
                    }}
                  >
                    Yes
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmingId(null)}>
                    No
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  disabled={deletingAddressIds.includes(address.id)}
                  onClick={() => setConfirmingId(address.id)}
                >
                  {deletingAddressIds.includes(address.id) ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
          </div>
        )
      )}

      {mode === "add" && (
        <AddressForm saving={saving} error={addressSaveError} onCancel={closeForm} onSubmit={handleAdd} />
      )}

      {mode === null && (
        <button type="button" className="btn btn-outline-secondary" onClick={openAdd}>
          <i className="bi bi-plus-lg me-1" aria-hidden="true" />
          Add new address
        </button>
      )}
    </div>
  );
}

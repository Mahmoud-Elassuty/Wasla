import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearActionError } from "../../store/reducers/wishlistSlice";

// Small dismissible notice for a failed add/remove. Clears itself after 5 seconds.
export default function WishlistNotice() {
  const dispatch = useDispatch();
  const message = useSelector((s) => s.wishlist.actionError);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => dispatch(clearActionError()), 5000);
    return () => clearTimeout(timer);
  }, [message, dispatch]);

  if (!message) return null;

  return (
    <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4 px-3" style={{ zIndex: 1080 }}>
      <div className="alert alert-danger d-flex align-items-center gap-3 shadow mb-0" role="alert">
        <span>Couldn't update your wishlist. {message}</span>
        <button
          type="button"
          className="btn-close"
          aria-label="Dismiss"
          onClick={() => dispatch(clearActionError())}
        />
      </div>
    </div>
  );
}

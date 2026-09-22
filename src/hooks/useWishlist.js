import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  addToWishlist,
  removeFromWishlist,
  selectIsWishlisted,
  selectIsWishlistPending,
} from "../store/reducers/wishlistSlice";

// Heart toggle for one product. Guests are sent to login (and come back afterwards).
export default function useWishlist(productId) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((s) => s.auth.user);
  const wished = useSelector(selectIsWishlisted(productId));
  const pending = useSelector(selectIsWishlistPending(productId));

  const toggle = () => {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }
    if (pending) return;
    dispatch(wished ? removeFromWishlist(productId) : addToWishlist(productId));
  };

  return { wished, pending, toggle };
}

import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { validateSession } from "../../store/reducers/authSlice";

// Usage: <ProtectedRoute roles={["admin"]}><Page /></ProtectedRoute>  (roles optional)
export default function ProtectedRoute({ children, roles }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const location = useLocation();
  const userId = user?.id;

  // A restricted or soft-deleted user is signed out on the next protected navigation.
  useEffect(() => {
    if (userId != null) dispatch(validateSession());
  }, [dispatch, userId, location.pathname]);

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children ?? <Outlet />;
}

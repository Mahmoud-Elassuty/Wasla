import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ErrorPage from "../components/common/ErrorPage";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Products from "../pages/Products";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";
import OrderDetails from "../pages/OrderDetails";
import Wishlist from "../pages/Wishlist";
import Profile from "../pages/Profile";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminProducts from "../pages/admin/AdminProducts";
import AdminProductForm from "../pages/admin/AdminProductForm";
import AdminReviews from "../pages/admin/AdminReviews";
import AdminCoupons from "../pages/admin/AdminCoupons";
import AdminCouponForm from "../pages/admin/AdminCouponForm";
import ProductDetails from "../pages/ProductDetails";
import Category from "../pages/Category";
import Offers from "../pages/Offers";
import Search from "../pages/Search";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "products", element: <Products /> },
      { path: "products/:id", element: <ProductDetails /> },
      { path: "category/:slug", element: <Category /> },
      { path: "offers", element: <Offers /> },
      { path: "search", element: <Search /> },
      { path: "cart", element: <Cart /> },
      {
        // everything below needs a logged-in user
        element: <ProtectedRoute />,
        children: [
          { path: "checkout", element: <Checkout /> },
          { path: "orders", element: <Orders /> },
          { path: "orders/:id", element: <OrderDetails /> },
          { path: "wishlist", element: <Wishlist /> },
          { path: "profile", element: <Profile /> },
        ],
      },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
    ],
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "orders", element: <AdminOrders /> },
      { path: "products", element: <AdminProducts /> },
      { path: "products/new", element: <AdminProductForm /> },
      { path: "products/:id/edit", element: <AdminProductForm /> },
      { path: "reviews", element: <AdminReviews /> },
      { path: "coupons", element: <AdminCoupons /> },
      { path: "coupons/new", element: <AdminCouponForm /> },
      { path: "coupons/:id/edit", element: <AdminCouponForm /> },
    ],
  },
  { path: "*", element: <ErrorPage /> },
]);

export default router;

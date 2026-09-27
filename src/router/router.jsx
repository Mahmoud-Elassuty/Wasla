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
import Payment from "../pages/Payment";
import Orders from "../pages/Orders";
import OrderDetails from "../pages/OrderDetails";
import Wishlist from "../pages/Wishlist";
import Profile from "../pages/Profile";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminOrderDetails from "../pages/admin/AdminOrderDetails";
import AdminProducts from "../pages/admin/AdminProducts";
import AdminProductForm from "../pages/admin/AdminProductForm";
import AdminReviews from "../pages/admin/AdminReviews";
import AdminCoupons from "../pages/admin/AdminCoupons";
import AdminCouponForm from "../pages/admin/AdminCouponForm";
import AdminEmails from "../pages/admin/AdminEmails";
import ProductDetails from "../pages/ProductDetails";
import Category from "../pages/Category";
import Offers from "../pages/Offers";
import Search from "../pages/Search";
import SellerLayout from "../layouts/SellerLayout";
import SellerDashboard from "../pages/seller/SellerDashboard";
import SellerProducts from "../pages/seller/SellerProducts";
import SellerProductForm from "../pages/seller/SellerProductForm";
import SellerOrders from "../pages/seller/SellerOrders";
import SellerOrderDetails from "../pages/seller/SellerOrderDetails";
import SellerProfile from "../pages/seller/SellerProfile";

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
          { path: "payment", element: <Payment /> },
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
      { path: "orders/:id", element: <AdminOrderDetails /> },
      { path: "products", element: <AdminProducts /> },
      { path: "products/new", element: <AdminProductForm /> },
      { path: "products/:id/edit", element: <AdminProductForm /> },
      { path: "reviews", element: <AdminReviews /> },
      { path: "coupons", element: <AdminCoupons /> },
      { path: "coupons/new", element: <AdminCouponForm /> },
      { path: "coupons/:id/edit", element: <AdminCouponForm /> },
      { path: "emails", element: <AdminEmails /> },
    ],
  },
  {
    path: "/seller",
    element: (
      <ProtectedRoute roles={["seller"]}>
        <SellerLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <SellerDashboard /> },
      { path: "products", element: <SellerProducts /> },
      { path: "products/new", element: <SellerProductForm /> },
      { path: "products/:id/edit", element: <SellerProductForm /> },
      { path: "orders", element: <SellerOrders /> },
      { path: "orders/:id", element: <SellerOrderDetails /> },
      { path: "profile", element: <SellerProfile /> },
    ],
  },
  { path: "*", element: <ErrorPage /> },
]);

export default router;

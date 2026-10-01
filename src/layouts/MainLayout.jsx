import { Outlet } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import MobileBottomNav, { useShowMobileBottomNav } from "../components/common/MobileBottomNav";
import ChatButton from "../components/chatbot/ChatButton";
import ChatWindow from "../components/chatbot/ChatWindow";

export default function MainLayout() {
  const showBottomNav = useShowMobileBottomNav();

  return (
    <div className={`d-flex flex-column min-vh-100${showBottomNav ? " has-mobile-nav" : ""}`}>
      <Navbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
      {/* Storefront-only assistant: Admin and Seller use their own layouts */}
      <ChatButton />
      <ChatWindow />
      {/* Mobile-only, rendered once here so Admin/Seller layouts never get it */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}

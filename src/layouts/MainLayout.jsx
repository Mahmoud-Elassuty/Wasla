import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import MobileBottomNav, { useShowMobileBottomNav } from "../components/common/MobileBottomNav";
import ChatButton from "../components/chatbot/ChatButton";
import ChatWindow from "../components/chatbot/ChatWindow";
import ScrollToTop from "../components/common/ScrollToTop";

export default function MainLayout() {
  const showBottomNav = useShowMobileBottomNav();

  useEffect(() => {
    const header = document.querySelector(".site-header");
    const root = document.documentElement;
    if (!header) return undefined;

    const syncHeaderHeight = () => {
      root.style.setProperty("--site-header-height", `${header.getBoundingClientRect().height}px`);
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);
    window.addEventListener("resize", syncHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeaderHeight);
    };
  }, []);

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
      {/* Single global back-to-top button, stacked above the chat launcher */}
      <ScrollToTop />
      {/* Mobile-only, rendered once here so Admin/Seller layouts never get it */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}

import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";
import "./types/global.d.ts";
import Layout from "@/components/Layout";
import ProductDetails from "./pages/ProductDetails";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Cart = lazy(() => import("./pages/Cart.tsx"));
const UploadPrescription = lazy(() => import("./pages/UploadPrescription.tsx"));
const SearchResults = lazy(() => import("./pages/SearchResults.tsx"));
const ConsultHomeopath = lazy(() => import("./pages/ConsultHomeopath.tsx"));
const Wholesale = lazy(() => import("./pages/Wholesale.tsx"));
const CategoryLanding = lazy(() => import("./pages/CategoryLanding.tsx"));
const Checkout = lazy(() => import("./pages/Checkout.tsx"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation.tsx"));
const OrderHistory = lazy(() => import("./pages/OrderHistory.tsx"));
const UserDashboard = lazy(() => import("./pages/UserDashboard.tsx"));

// Admin Pages
const AdminLayout = lazy(() => import("./components/AdminLayout.tsx"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.tsx"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts.tsx"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders.tsx"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers.tsx"));
const AdminDoctors = lazy(() => import("./pages/admin/AdminDoctors.tsx"));
const AdminPrescriptions = lazy(() => import("./pages/admin/AdminPrescriptions.tsx"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <BrowserRouter>
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/consult" element={<ConsultHomeopath />} />
              <Route path="/wholesale" element={<Wholesale />} />
              <Route path="/upload" element={<UploadPrescription />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
              <Route path="/orders" element={<OrderHistory />} />
              <Route path="/account" element={<UserDashboard />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/category/:category" element={<CategoryLanding />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="doctors" element={<AdminDoctors />} />
              <Route path="prescriptions" element={<AdminPrescriptions />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="/auth" element={<AuthPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ConvexAuthProvider>
  </StrictMode>,
);
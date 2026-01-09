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
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs.tsx"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews.tsx"));
const AdminRoles = lazy(() => import("./pages/admin/AdminRoles.tsx"));
const AdminTeam = lazy(() => import("./pages/admin/AdminTeam.tsx"));
const AdminBackup = lazy(() => import("./pages/admin/AdminBackup.tsx"));
const AdminOptimization = lazy(() => import("./pages/admin/AdminOptimization.tsx"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports.tsx"));
const AdminWorkflows = lazy(() => import("./pages/admin/AdminWorkflows.tsx"));
const AdminRules = lazy(() => import("./pages/admin/AdminRules.tsx"));
const AdminIntegrations = lazy(() => import("./pages/admin/AdminIntegrations.tsx"));

// Communication & Analytics Pages
const AdminCampaigns = lazy(() => import("./pages/admin/AdminCampaigns.tsx"));
const AdminTemplates = lazy(() => import("./pages/admin/AdminTemplates.tsx"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages.tsx"));
const AdminActivityFeed = lazy(() => import("./pages/admin/AdminActivityFeed.tsx"));
const AdminHeatmaps = lazy(() => import("./pages/admin/AdminHeatmaps.tsx"));
const AdminABTests = lazy(() => import("./pages/admin/AdminABTests.tsx"));
const AdminCohorts = lazy(() => import("./pages/admin/AdminCohorts.tsx"));
const AdminFunnels = lazy(() => import("./pages/admin/AdminFunnels.tsx"));
const AdminDashboardBuilder = lazy(() => import("./pages/admin/AdminDashboardBuilder.tsx"));

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
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="roles" element={<AdminRoles />} />
              <Route path="team" element={<AdminTeam />} />
              <Route path="backup" element={<AdminBackup />} />
              <Route path="optimization" element={<AdminOptimization />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="workflows" element={<AdminWorkflows />} />
              <Route path="rules" element={<AdminRules />} />
              <Route path="integrations" element={<AdminIntegrations />} />
              {/* Communication Features */}
              <Route path="campaigns" element={<AdminCampaigns />} />
              <Route path="templates" element={<AdminTemplates />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="activity-feed" element={<AdminActivityFeed />} />
              {/* Analytics Features */}
              <Route path="heatmaps" element={<AdminHeatmaps />} />
              <Route path="ab-tests" element={<AdminABTests />} />
              <Route path="cohorts" element={<AdminCohorts />} />
              <Route path="funnels" element={<AdminFunnels />} />
              <Route path="dashboard-builder" element={<AdminDashboardBuilder />} />
            </Route>
            <Route path="/auth" element={<AuthPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ConvexAuthProvider>
  </StrictMode>,
);
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { ReactNode } from "react";

import { roleHomePath, useAuth, UserRole } from "../store/auth";
import { ProviderLayout } from "../components/layout/ProviderLayout";
import { AdminLayout } from "../components/layout/AdminLayout";
import { ManagerLayout } from "../components/layout/ManagerLayout";
import { WorkerLayout } from "../components/layout/WorkerLayout";

import LandingPage from "../pages/landing/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import AdminDashboardPage from "../pages/admin/DashboardPage";
import ManagerDashboardPage from "../pages/manager/DashboardPage";
import WorkerDashboardPage from "../pages/worker/DashboardPage";
import ProviderDashboardPage from "../pages/provider/DashboardPage";
import ProviderLoginPage from "../pages/provider/ProviderLoginPage";
import OrganizationsPage from "../pages/provider/OrganizationsPage";
import OrganizationDetailPage from "../pages/provider/OrganizationDetailPage";
import SubscriptionsPage from "../pages/provider/SubscriptionsPage";
import ProviderSettingsPage from "../pages/provider/SettingsPage";
import ProviderUsersPage from "../pages/provider/UsersPage";
import AccessRequestsPage from "../pages/provider/AccessRequestsPage";
import AccessRequestDetailPage from "../pages/provider/AccessRequestDetailPage";
import AboutPage from "../pages/marketing/AboutPage";
import ContactPage from "../pages/marketing/ContactPage";
import RequestAccessPage from "../pages/marketing/RequestAccessPage";
import PrivacyPage from "../pages/marketing/PrivacyPage";
import TermsPage from "../pages/marketing/TermsPage";
import FeaturesPage from "../pages/marketing/FeaturesPage";
import PricingPage from "../pages/marketing/PricingPage";
import HowItWorksPage from "../pages/marketing/HowItWorksPage";
import NotFoundPage from "../pages/NotFoundPage";

/**
 * Protect a subtree of routes. Redirect behaviour:
 *   - not authenticated    → /login (or /provider for provider routes)
 *   - wrong role           → their own role dashboard (via roleHomePath)
 */
export interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  /** Where to send unauthenticated users. Defaults to /login. */
  redirectTo?: string;
  children: ReactNode;
}

export function ProtectedRoute({
  allowedRoles,
  redirectTo = "/login",
  children,
}: ProtectedRouteProps) {
  const { user, accessToken } = useAuth();
  const location = useLocation();

  if (!accessToken || !user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ───────────────────────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/request-access" element={<RequestAccessPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/provider" element={<ProviderLoginPage />} />

        {/* ── Admin portal ─────────────────────────────────────────── */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["owner", "admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Route>

        {/* ── Manager portal ───────────────────────────────────────── */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/manager/dashboard"
            element={<ManagerDashboardPage />}
          />
        </Route>

        {/* ── Worker portal ────────────────────────────────────────── */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <WorkerLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/worker/dashboard"
            element={<WorkerDashboardPage />}
          />
        </Route>

        {/* ── Provider portal ──────────────────────────────────────── */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["superadmin", "provider"]}
              redirectTo="/provider"
            >
              <ProviderLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/provider/dashboard" element={<ProviderDashboardPage />} />
          {/* New canonical path — AGENT_FIX_PROMPT §252 */}
          <Route path="/provider/tenants" element={<OrganizationsPage />} />
          <Route
            path="/provider/tenants/:id"
            element={<OrganizationDetailPage />}
          />
          {/* Legacy alias — keep working during Stage 2 rename */}
          <Route
            path="/provider/organizations"
            element={<Navigate to="/provider/tenants" replace />}
          />
          <Route
            path="/provider/organizations/:id"
            element={<OrganizationDetailPage />}
          />
          <Route
            path="/provider/subscriptions"
            element={<SubscriptionsPage />}
          />
          <Route path="/provider/users" element={<ProviderUsersPage />} />
          <Route
            path="/provider/access-requests"
            element={<AccessRequestsPage />}
          />
          <Route
            path="/provider/access-requests/:id"
            element={<AccessRequestDetailPage />}
          />
          <Route path="/provider/settings" element={<ProviderSettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

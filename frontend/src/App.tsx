import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import Breadcrumb from './components/Breadcrumb';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoading from './components/PageLoading';
import SectionErrorBoundary from './components/SectionErrorBoundary';
// Password gate disabled - import PasswordGate from './components/PasswordGate';
import { Toaster } from 'sonner';
import './App.css';

// Lazy load all pages for code splitting

// Public pages
const Home = React.lazy(() => import('./pages/public/Home'));
const ToursList = React.lazy(() => import('./pages/public/ToursList'));
const TourDetail = React.lazy(() => import('./pages/public/TourDetail'));
const Compare = React.lazy(() => import('./pages/public/Compare'));
const Chat = React.lazy(() => import('./pages/public/Chat'));
const Favorites = React.lazy(() => import('./pages/public/Favorites'));
const Profile = React.lazy(() => import('./pages/public/Profile'));
const SupportPage = React.lazy(() => import('./pages/public/SupportPage'));
const MyTickets = React.lazy(() => import('./pages/public/MyTickets'));
const TicketDetail = React.lazy(() => import('./pages/public/TicketDetail'));
const TermsPage = React.lazy(() => import('./pages/public/TermsPage'));
const PrivacyPage = React.lazy(() => import('./pages/public/PrivacyPage'));
const TrustFaqPage = React.lazy(() => import('./pages/public/TrustFaqPage'));
const NotFound = React.lazy(() => import('./pages/public/NotFound'));

// Auth pages
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));
const EmailVerification = React.lazy(() => import('./pages/auth/EmailVerification'));
const VerificationPage = React.lazy(() => import('./pages/auth/VerificationPage'));

// Operator pages
const OperatorRegister = React.lazy(() => import('./pages/operator/OperatorRegister'));
const OperatorDashboard = React.lazy(() => import('./pages/operator/OperatorDashboard'));
const OperatorTourForm = React.lazy(() => import('./pages/operator/OperatorTourForm'));

// Admin pages
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminApproval = React.lazy(() => import('./pages/admin/AdminApproval'));
const AdminImport = React.lazy(() => import('./pages/admin/AdminImport'));
const AdminReviewModeration = React.lazy(() => import('./pages/admin/AdminReviewModeration'));
const AdminTourCreate = React.lazy(() => import('./pages/admin/AdminTourCreate'));
const AdminLayout = React.lazy(() => import('./components/AdminLayout'));
const AdminAuditLog = React.lazy(() => import('./pages/admin/AdminAuditLog'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminFileManager = React.lazy(() => import('./pages/admin/AdminFileManager'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminVerification = React.lazy(() => import('./pages/admin/AdminVerification'));
const AdminNotifications = React.lazy(() => import('./pages/admin/AdminNotifications'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const AdminCMS = React.lazy(() => import('./pages/admin/AdminCMS'));
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports'));
const AdminHistory = React.lazy(() => import('./pages/admin/AdminHistory'));
const AdminFeatureFlags = React.lazy(() => import('./pages/admin/AdminFeatureFlags'));
const AdminUptime = React.lazy(() => import('./pages/admin/AdminUptime'));
const AdminRateLimits = React.lazy(() => import('./pages/admin/AdminRateLimits'));
const AdminEmailQueue = React.lazy(() => import('./pages/admin/AdminEmailQueue'));
const AdminScheduledActions = React.lazy(() => import('./pages/admin/AdminScheduledActions'));
const AdminOperatorPerformance = React.lazy(() => import('./pages/admin/AdminOperatorPerformance'));
const AdminSystemInfo = React.lazy(() => import('./pages/admin/AdminSystemInfo'));
const AdminTickets = React.lazy(() => import('./pages/admin/AdminTickets'));
const AdminTicketDetail = React.lazy(() => import('./pages/admin/AdminTicketDetail'));



function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  // super_admin, admin ve support rolleri admin paneline erişebilir
  const allowedRoles = ['super_admin', 'admin', 'support'];
  return user && user.role && allowedRoles.includes(user.role) ? <>{children}</> : <Navigate to="/" />;
}

function OperatorRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return user && user.role === 'operator' ? <>{children}</> : <Navigate to="/" />;
}

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  return (
    <div className="app">
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && <Breadcrumb />}
      <main className={isAdminRoute ? undefined : "main-content"}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/tours" />} />
              <Route path="/register" element={!user ? <Register /> : <Navigate to="/tours" />} />
              <Route path="/operator/register" element={!user ? <OperatorRegister /> : <Navigate to="/operator/dashboard" />} />
              <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/tours" />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/verification" element={<VerificationPage />} />
              <Route path="/trust-faq" element={<TrustFaqPage />} />
              {/* Public Tour Pages - No login required */}
              <Route path="/tours" element={<ToursList />} />
              <Route path="/tours/:id" element={<TourDetail />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/profile" element={<Profile />} />
              <Route
                path="/operator/dashboard"
                element={
                  <OperatorRoute>
                    <SectionErrorBoundary sectionName="Operatör Paneli">
                      <OperatorDashboard />
                    </SectionErrorBoundary>
                  </OperatorRoute>
                }
              />
              <Route
                path="/operator/create"
                element={
                  <OperatorRoute>
                    <SectionErrorBoundary sectionName="Operatör Paneli">
                      <OperatorTourForm />
                    </SectionErrorBoundary>
                  </OperatorRoute>
                }
              />
              <Route
                path="/operator/edit/:id"
                element={
                  <OperatorRoute>
                    <SectionErrorBoundary sectionName="Operatör Paneli">
                      <OperatorTourForm />
                    </SectionErrorBoundary>
                  </OperatorRoute>
                }
              />

              {/* ═══════════════════════════════════════════
                  ADMIN ROUTES - Nested Layout with Sidebar
                  ═══════════════════════════════════════════ */}
              <Route path="/admin" element={<AdminRoute><SectionErrorBoundary sectionName="Admin Paneli"><AdminLayout /></SectionErrorBoundary></AdminRoute>}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="approval" element={<AdminApproval />} />
                <Route path="import" element={<AdminImport />} />
                <Route path="reviews" element={<AdminReviewModeration />} />
                <Route path="tours/new" element={<AdminTourCreate />} />
                <Route path="add-tour" element={<AdminTourCreate />} />
                <Route path="tickets" element={<AdminTickets />} />
                <Route path="tickets/:id" element={<AdminTicketDetail />} />
                <Route path="audit" element={<AdminAuditLog />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="files" element={<AdminFileManager />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="verification" element={<AdminVerification />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="cms" element={<AdminCMS />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="history" element={<AdminHistory />} />
                <Route path="feature-flags" element={<AdminFeatureFlags />} />
                <Route path="uptime" element={<AdminUptime />} />
                <Route path="rate-limits" element={<AdminRateLimits />} />
                <Route path="email-queue" element={<AdminEmailQueue />} />
                <Route path="scheduled-actions" element={<AdminScheduledActions />} />
                <Route path="operator-performance" element={<AdminOperatorPerformance />} />
                <Route path="system-info" element={<AdminSystemInfo />} />
              </Route>

              {/* Support Ticket Routes */}
              <Route path="/support" element={<SupportPage />} />
              <Route
                path="/support/tickets"
                element={
                  <PrivateRoute>
                    <MyTickets />
                  </PrivateRoute>
                }
              />
              <Route
                path="/support/tickets/:id"
                element={
                  <PrivateRoute>
                    <TicketDetail />
                  </PrivateRoute>
                }
              />
              {/* 404 Catch-All Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <BottomNav />}
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
// Password gate disabled - import PasswordGate from './components/PasswordGate';
import { Toaster } from 'sonner';
import './App.css';

// Lazy load all pages for code splitting
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const OperatorRegister = React.lazy(() => import('./pages/OperatorRegister'));
const ToursList = React.lazy(() => import('./pages/ToursList'));
const TourDetail = React.lazy(() => import('./pages/TourDetail'));
const Compare = React.lazy(() => import('./pages/Compare'));
const Chat = React.lazy(() => import('./pages/Chat'));
const AdminImport = React.lazy(() => import('./pages/AdminImport'));
const AdminApproval = React.lazy(() => import('./pages/AdminApproval'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const OperatorDashboard = React.lazy(() => import('./pages/OperatorDashboard'));
const OperatorTourForm = React.lazy(() => import('./pages/OperatorTourForm'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
// Support Ticket Pages
const SupportPage = React.lazy(() => import('./pages/SupportPage'));
const MyTickets = React.lazy(() => import('./pages/MyTickets'));
const TicketDetail = React.lazy(() => import('./pages/TicketDetail'));
const AdminTickets = React.lazy(() => import('./pages/AdminTickets'));
const AdminTicketDetail = React.lazy(() => import('./pages/AdminTicketDetail'));
const EmailVerification = React.lazy(() => import('./pages/EmailVerification'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const VerificationPage = React.lazy(() => import('./pages/VerificationPage'));
const TrustFaqPage = React.lazy(() => import('./pages/TrustFaqPage'));
const Favorites = React.lazy(() => import('./pages/Favorites'));
const Profile = React.lazy(() => import('./pages/Profile'));
const AdminReviewModeration = React.lazy(() => import('./pages/AdminReviewModeration'));
const AdminTourCreate = React.lazy(() => import('./pages/AdminTourCreate'));
const AdminLayout = React.lazy(() => import('./components/AdminLayout'));
const AdminAuditLog = React.lazy(() => import('./pages/AdminAuditLog'));
const AdminAnalytics = React.lazy(() => import('./pages/AdminAnalytics'));
const AdminFileManager = React.lazy(() => import('./pages/AdminFileManager'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));
const AdminVerification = React.lazy(() => import('./pages/AdminVerification'));
const AdminNotifications = React.lazy(() => import('./pages/AdminNotifications'));
const AdminSettings = React.lazy(() => import('./pages/AdminSettings'));
const AdminCMS = React.lazy(() => import('./pages/AdminCMS'));
const AdminReports = React.lazy(() => import('./pages/AdminReports'));
const AdminHistory = React.lazy(() => import('./pages/AdminHistory'));
const AdminFeatureFlags = React.lazy(() => import('./pages/AdminFeatureFlags'));
const AdminUptime = React.lazy(() => import('./pages/AdminUptime'));
const AdminRateLimits = React.lazy(() => import('./pages/AdminRateLimits'));
const AdminEmailQueue = React.lazy(() => import('./pages/AdminEmailQueue'));
const AdminScheduledActions = React.lazy(() => import('./pages/AdminScheduledActions'));
const AdminOperatorPerformance = React.lazy(() => import('./pages/AdminOperatorPerformance'));
const AdminSystemInfo = React.lazy(() => import('./pages/AdminSystemInfo'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Loading component for Suspense fallback
const PageLoading = () => (
  <div className="loading" style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    fontSize: '1.25rem',
    color: 'var(--primary-teal)'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕋</div>
      <div>Yükleniyor...</div>
    </div>
  </div>
);

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
                    <OperatorDashboard />
                  </OperatorRoute>
                }
              />
              <Route
                path="/operator/create"
                element={
                  <OperatorRoute>
                    <OperatorTourForm />
                  </OperatorRoute>
                }
              />
              <Route
                path="/operator/edit/:id"
                element={
                  <OperatorRoute>
                    <OperatorTourForm />
                  </OperatorRoute>
                }
              />

              {/* ═══════════════════════════════════════════
                  ADMIN ROUTES - Nested Layout with Sidebar
                  ═══════════════════════════════════════════ */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
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

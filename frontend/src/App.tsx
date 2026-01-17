import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import PasswordGate from './components/PasswordGate';
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

  return user && user.role === 'admin' ? <>{children}</> : <Navigate to="/" />;
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

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
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
              <Route
                path="/tours"
                element={
                  <PrivateRoute>
                    <ToursList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/tours/:id"
                element={
                  <PrivateRoute>
                    <TourDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/compare"
                element={
                  <PrivateRoute>
                    <Compare />
                  </PrivateRoute>
                }
              />
              <Route path="/chat" element={<Chat />} />
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
              <Route
                path="/admin/import"
                element={
                  <AdminRoute>
                    <AdminImport />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/approval"
                element={
                  <AdminRoute>
                    <AdminApproval />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
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
              <Route
                path="/admin/tickets"
                element={
                  <AdminRoute>
                    <AdminTickets />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/tickets/:id"
                element={
                  <AdminRoute>
                    <AdminTicketDetail />
                  </AdminRoute>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <BottomNav />
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

function App() {
  return (
    <PasswordGate>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </PasswordGate>
  );
}

export default App;

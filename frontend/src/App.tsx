import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import OperatorRegister from './pages/OperatorRegister';
import Home from './pages/Home';
import ToursList from './pages/ToursList';
import TourDetail from './pages/TourDetail';
import Compare from './pages/Compare';
import Chat from './pages/Chat';
import AdminImport from './pages/AdminImport';
import AdminApproval from './pages/AdminApproval';
import OperatorDashboard from './pages/OperatorDashboard';
import OperatorTourForm from './pages/OperatorTourForm';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';

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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/tours" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/tours" />} />
          <Route path="/operator/register" element={!user ? <OperatorRegister /> : <Navigate to="/operator/dashboard" />} />
          <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/tours" />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
        </Routes>
      </main>
      <Footer />
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

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Home           from './pages/Home';
import Login          from './pages/Login';
import Signup         from './pages/Signup';
import PaymentGateway from './pages/PaymentGateway';
import UserDashboard  from './pages/user/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public Routes (Independent Space/Earth System) ── */}
        <Route path="/"          element={<Home />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/signup"    element={<Signup />} />
        <Route path="/payment"   element={<PaymentGateway />} />
        <Route path="/checkout"  element={<PaymentGateway />} />

        {/* ── User Protected Routes (Continuous Space Mission Control) ── */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute requiredRole="user">
              <AuthenticatedLayout>
                <UserDashboard />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Admin Protected Routes (Continuous Space Mission Control) ── */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AuthenticatedLayout>
                <AdminDashboard />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Catch-all: redirect unknown routes to home ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
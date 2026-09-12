import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Home          from './pages/Home';
import Login         from './pages/Login';
import Signup        from './pages/Signup';
import UserDashboard from './pages/user/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/"       element={<Home />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ── User Protected Routes ── */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute requiredRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* ── Admin Protected Routes ── */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
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
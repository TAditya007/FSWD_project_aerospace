import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const MOCK_USERS = [
  { email: 'user@aerospec.com', password: 'user123', role: 'user', name: 'Operator Vijay' },
  { email: 'admin@aerospec.com', password: 'admin123', role: 'admin', name: 'System Admin' },
];

export default function Login() {
  const [portal, setPortal] = useState('user'); // 'user' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isAdmin = portal === 'admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate a network delay
    await new Promise(r => setTimeout(r, 800));

    // ── TEMP MOCK AUTH ──
    const found = MOCK_USERS.find(
      u => u.email === email && u.password === password && u.role === portal
    );

    if (!found) {
      setError(
        isAdmin
          ? 'Invalid admin credentials. Access denied.'
          : 'Invalid email or password. Please try again.'
      );
      setLoading(false);
      return;
    }

    // Store mock session (TEMP — will be replaced by JWT in Phase 5)
    localStorage.setItem('aerospec_user', JSON.stringify({ name: found.name, email: found.email, role: found.role }));

    // Route based on role
    if (found.role === 'admin') navigate('/admin/dashboard');
    else navigate('/user/dashboard');
  };

  return (
    <div className={`login-root ${isAdmin ? 'admin-theme' : 'user-theme'}`}>
      {/* Background grid */}
      <div className="grid-bg" />
      <div className={`orb orb-login ${isAdmin ? 'orb-admin' : 'orb-user'}`} />

      <div className="login-container">

        {/* Back to Home */}
        <Link to="/" className="back-link-top">← AEROSPEC</Link>

        {/* Portal Toggle */}
        <div className="portal-toggle">
          <button
            className={`portal-tab ${portal === 'user' ? 'active-user' : ''}`}
            onClick={() => { setPortal('user'); setError(''); }}
          >
            USER PORTAL
          </button>
          <button
            className={`portal-tab ${portal === 'admin' ? 'active-admin' : ''}`}
            onClick={() => { setPortal('admin'); setError(''); }}
          >
            ADMIN PORTAL
          </button>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={portal}
            className={`login-card ${isAdmin ? 'card-admin' : 'card-user'}`}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {/* Top accent bar */}
            <div className={`card-accent ${isAdmin ? 'accent-admin' : 'accent-user'}`} />

            {/* Header */}
            <div className="card-header">
              <span className={`card-badge ${isAdmin ? 'badge-admin' : 'badge-user'}`}>
                {isAdmin ? 'RESTRICTED ACCESS' : 'CREW ACCESS'}
              </span>
              <h1 className="card-title">
                {isAdmin ? 'Admin Login' : 'Operator Login'}
              </h1>
              <p className="card-desc">
                {isAdmin
                  ? 'Authenticated admin session required. All activity is logged.'
                  : 'Sign in to access your live telemetry dashboard.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">EMAIL ADDRESS</label>
                <input
                  type="email"
                  className={`form-input ${isAdmin ? 'input-admin' : 'input-user'}`}
                  placeholder={isAdmin ? 'admin@aerospec.com' : 'operator@aerospec.com'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">PASSWORD</label>
                <input
                  type="password"
                  className={`form-input ${isAdmin ? 'input-admin' : 'input-user'}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="form-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    ⚠ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                className={`submit-btn ${isAdmin ? 'btn-admin' : 'btn-user'}`}
                disabled={loading}
              >
                {loading ? 'AUTHENTICATING...' : (isAdmin ? 'ACCESS SYSTEM →' : 'SIGN IN →')}
              </button>
            </form>

            {/* Footer */}
            <div className="card-footer">
              {portal === 'user' && (
                <p className="footer-text">
                  No account?{' '}
                  <Link to="/signup" className="footer-link">Create one →</Link>
                </p>
              )}
              {portal === 'admin' && (
                <p className="footer-text" style={{ color: '#451a03' }}>
                  Admin accounts are provisioned by the system administrator only.
                </p>
              )}
            </div>

            {/* TEMP HINT — remove when backend is ready */}
            <div className="temp-hint">
              <span>⚡ DEMO: </span>
              {isAdmin
                ? 'admin@aerospec.com / admin123'
                : 'user@aerospec.com / user123'}
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}

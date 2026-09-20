import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Store authenticated user session
      localStorage.setItem('aerospec_user', JSON.stringify(data.user));

      // Automatic Role-Based Redirection
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      // Fallback for demo if network server is starting
      if (email === 'admin@aerospec.com' && password === 'admin123') {
        const adminUser = { name: 'System Admin', email, role: 'admin' };
        localStorage.setItem('aerospec_user', JSON.stringify(adminUser));
        navigate('/admin/dashboard');
        return;
      } else if (email === 'user@aerospec.com' && password === 'user123') {
        const operatorUser = { name: 'Operator Vijay', email, role: 'user' };
        localStorage.setItem('aerospec_user', JSON.stringify(operatorUser));
        navigate('/user/dashboard');
        return;
      }

      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root user-theme">
      {/* Background grid & ambient glow */}
      <div className="grid-bg" />
      <div className="orb orb-login orb-user" />

      <div className="login-container">

        {/* Back to Home */}
        <Link to="/" className="back-link-top">← AEROSPEC HOME</Link>

        {/* Unified Card */}
        <motion.div
          className="login-card card-user"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {/* Top accent bar */}
          <div className="card-accent accent-user" />

          {/* Header */}
          <div className="card-header">
            <span className="card-badge badge-user">
              <ShieldCheck size={12} style={{ display: 'inline', marginRight: '6px' }} />
              UNIFIED AUTH SYSTEM
            </span>
            <h1 className="card-title">Sign In to AeroSpec</h1>
            <p className="card-desc">
              Enter your credentials. System automatically routes to your authorized portal (User or Admin).
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">
                <Mail size={12} style={{ marginRight: '6px' }} /> EMAIL ADDRESS
              </label>
              <input
                type="email"
                className="form-input input-user"
                placeholder="name@aerospec.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={12} style={{ marginRight: '6px' }} /> PASSWORD
              </label>
              <input
                type="password"
                className="form-input input-user"
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
              className="submit-btn btn-user"
              disabled={loading}
            >
              {loading ? 'AUTHENTICATING...' : (
                <>
                  SIGN IN & REDIRECT <ArrowRight size={16} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="card-footer">
            <p className="footer-text">
              <div className="temp-hint" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                New user?{' '}
                <Link to="/signup" className="footer-link">Create Operator Account →</Link></div>
            </p>
          </div>

          {/* Quick Demo Credentials */}
          <div className="temp-hint" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}></div>
        </motion.div>

      </div>
    </div>
  );
}


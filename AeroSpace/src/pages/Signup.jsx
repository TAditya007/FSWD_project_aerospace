import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

function validate(form) {
  const errors = {};
  if (!form.name.trim())         errors.name = 'Full name is required.';
  if (!form.email.includes('@')) errors.email = 'Enter a valid email address.';
  if (form.password.length < 6)  errors.password = 'Password must be at least 6 characters.';
  if (form.password !== form.confirm) errors.confirm = 'Passwords do not match.';
  return errors;
}

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear field error on change
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);

    // Simulate network delay
    await new Promise(r => setTimeout(r, 900));

    // ── TEMP MOCK SIGNUP ──
    // Role is hardcoded to 'user'. Users CANNOT self-register as admin.
    const newUser = {
      name:  form.name,
      email: form.email,
      role:  'user',  // Always 'user' — backend enforces this in Phase 5
    };

    localStorage.setItem('aerospec_user', JSON.stringify(newUser));
    setLoading(false);
    setSuccess(true);

    // Redirect to user dashboard after 1.5s
    setTimeout(() => navigate('/user/dashboard'), 1500);
  };

  return (
    <div className="login-root user-theme">
      <div className="grid-bg" />
      <div className="orb orb-login orb-user" />

      <div className="login-container">
        <Link to="/" className="back-link-top">← AEROSPEC</Link>

        <motion.div
          className="login-card card-user"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="card-accent accent-user" />

          {/* Header */}
          <div className="card-header">
            <span className="card-badge badge-user">NEW OPERATOR</span>
            <h1 className="card-title">Create Account</h1>
            <p className="card-desc">
              Register to receive live RF telemetry. Your role is set to <strong>User</strong> by default.
            </p>
          </div>

          {/* Success State */}
          <AnimatePresence>
            {success && (
              <motion.div
                className="success-banner"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                ✓ Account created! Redirecting to dashboard...
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="login-form">

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">FULL NAME</label>
                <input
                  type="text"
                  name="name"
                  className={`form-input input-user ${errors.name ? 'input-error' : ''}`}
                  placeholder="e.g. Vijay Kumar"
                  value={form.name}
                  onChange={handleChange}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">EMAIL ADDRESS</label>
                <input
                  type="email"
                  name="email"
                  className={`form-input input-user ${errors.email ? 'input-error' : ''}`}
                  placeholder="operator@aerospec.com"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">PASSWORD</label>
                <input
                  type="password"
                  name="password"
                  className={`form-input input-user ${errors.password ? 'input-error' : ''}`}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">CONFIRM PASSWORD</label>
                <input
                  type="password"
                  name="confirm"
                  className={`form-input input-user ${errors.confirm ? 'input-error' : ''}`}
                  placeholder="Re-enter password"
                  value={form.confirm}
                  onChange={handleChange}
                />
                {errors.confirm && <span className="field-error">{errors.confirm}</span>}
              </div>

              {/* Role notice */}
              <div className="role-notice">
                🔒 Your account will be created with role: <strong>USER</strong>. Admin access must be granted by a system administrator.
              </div>

              <button type="submit" className="submit-btn btn-user" disabled={loading}>
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT →'}
              </button>
            </form>
          )}

          <div className="card-footer">
            <p className="footer-text">
              Already have an account?{' '}
              <Link to="/login" className="footer-link">Sign in →</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

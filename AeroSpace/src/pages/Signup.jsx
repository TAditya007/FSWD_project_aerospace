import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, KeyRound, ArrowRight, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { VITE_API_URL } from '../config/api';
import './auth.css';


function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Full name is required.';
  if (!form.email.includes('@')) errors.email = 'Enter a valid email address.';
  if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.';
  if (form.password !== form.confirm) errors.confirm = 'Passwords do not match.';
  return errors;
}

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState({ mode: '', previewUrl: null, otpPreview: null });
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();

  // Resend Countdown
  useEffect(() => {
    let timer;
    if (otpStep && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpStep, resendTimer]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setServerError('');
  };

  // Helper to safely parse JSON responses from backend
  const safeParseJson = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('BACKEND_OFFLINE');
    }
    return await response.json();
  };

  // Step 1: Dispatch Real 2FA OTP to Email
  const handleInitiateSignup = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setServerError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const res = await fetch(`${VITE_API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, type: 'SIGNUP', name: form.name })
      });

      const data = await safeParseJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Unable to send OTP email. Please try again.');
      }

      setDeliveryInfo({
        mode: data.deliveryMode || 'LIVE_SMTP',
        previewUrl: data.previewUrl || null,
        otpPreview: data.otpPreview || null
      });

      setOtpStep(true);
      setResendTimer(30);
      setCanResend(false);
    } catch (err) {
      if (!import.meta.env.PROD) {
        // Offline fallback for local dev only
        const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
        setDeliveryInfo({ mode: 'DEV_SIMULATION', otpPreview: mockCode, previewUrl: null });
        setOtpStep(true);
        setResendTimer(30);
        setCanResend(false);
        return;
      }
      setServerError(err.message || 'Unable to send OTP email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Code
  const handleResendOtp = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setServerError('');

    try {
      const res = await fetch(`${VITE_API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, type: 'SIGNUP', name: form.name })
      });
      const data = await safeParseJson(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Unable to send OTP email. Please try again.');
      }

      setDeliveryInfo({
        mode: data.deliveryMode || 'LIVE_SMTP',
        previewUrl: data.previewUrl || null,
        otpPreview: data.otpPreview || null
      });

      setResendTimer(30);
      setCanResend(false);
    } catch (err) {
      if (!import.meta.env.PROD && deliveryInfo.mode === 'DEV_SIMULATION') {
        const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
        setDeliveryInfo(prev => ({ ...prev, otpPreview: mockCode }));
        setResendTimer(30);
        setCanResend(false);
      } else {
        setServerError(err.message || 'Unable to send OTP email. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify 2FA OTP & complete account creation in database
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setServerError('');

    try {
      const res = await fetch(`${VITE_API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          otp: otpCode.trim(),
          action: 'SIGNUP',
          name: form.name,
          password: form.password
        })
      });

      const data = await safeParseJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Verification failed.');
      }

      localStorage.setItem('aerospec_user', JSON.stringify(data.user));
      setSuccess(true);
      setTimeout(() => navigate('/user/dashboard'), 1400);
    } catch (err) {
      if (!import.meta.env.PROD && deliveryInfo.otpPreview && otpCode.trim() === deliveryInfo.otpPreview) {
        const newUser = { name: form.name, email: form.email, role: 'user', planTier: 'cadet' };
        localStorage.setItem('aerospec_user', JSON.stringify(newUser));
        setSuccess(true);
        setTimeout(() => navigate('/user/dashboard'), 1400);
        return;
      }
      setServerError(err.message === 'BACKEND_OFFLINE' ? 'Backend server unreachable. Please verify connection.' : (err.message || 'Invalid 6-digit OTP code.'));
    } finally {
      setLoading(false);
    }
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
            <span className="card-badge badge-user">
              <ShieldCheck size={12} style={{ display: 'inline', marginRight: '6px' }} />
              {otpStep ? 'REAL 2FA EMAIL VERIFICATION' : 'OPERATOR REGISTRATION'}
            </span>
            <h1 className="card-title">{otpStep ? 'Verify 2FA OTP Code' : 'Create Operator Account'}</h1>
            <p className="card-desc">
              {otpStep
                ? `Enter the 6-digit verification code sent to ${form.email}.`
                : 'Sign up with any real email. All account records and security credentials persist to the database.'}
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
                ✓ Account verified & saved to database! Redirecting to dashboard...
              </motion.div>
            )}
          </AnimatePresence>

          {!success && (
            <>
              {serverError && (
                <div className="form-error" style={{ marginBottom: '16px' }}>
                  ⚠ {serverError}
                </div>
              )}

              {/* ── STEP 1: SIGNUP FORM ── */}
              {!otpStep ? (
                <form onSubmit={handleInitiateSignup} className="login-form">
                  <div className="form-group">
                    <label className="form-label">
                      <User size={12} style={{ marginRight: '6px' }} /> FULL NAME
                    </label>
                    <input
                      type="text"
                      name="name"
                      className={`form-input input-user ${errors.name ? 'input-error' : ''}`}
                      placeholder="e.g. Maya Lin"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                    {errors.name && <span className="field-error">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Mail size={12} style={{ marginRight: '6px' }} /> EMAIL ADDRESS (ANY REAL DOMAIN)
                    </label>
                    <input
                      type="email"
                      name="email"
                      className={`form-input input-user ${errors.email ? 'input-error' : ''}`}
                      placeholder="you@gmail.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Lock size={12} style={{ marginRight: '6px' }} /> PASSWORD
                    </label>
                    <input
                      type="password"
                      name="password"
                      className={`form-input input-user ${errors.password ? 'input-error' : ''}`}
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                    {errors.password && <span className="field-error">{errors.password}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Lock size={12} style={{ marginRight: '6px' }} /> CONFIRM PASSWORD
                    </label>
                    <input
                      type="password"
                      name="confirm"
                      className={`form-input input-user ${errors.confirm ? 'input-error' : ''}`}
                      placeholder="Re-enter password"
                      value={form.confirm}
                      onChange={handleChange}
                      required
                    />
                    {errors.confirm && <span className="field-error">{errors.confirm}</span>}
                  </div>

                  <button type="submit" className="submit-btn btn-user" disabled={loading}>
                    {loading ? 'SENDING 2FA EMAIL...' : (
                      <>
                        SEND 2FA EMAIL OTP <ArrowRight size={16} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
                      </>
                    )}
                  </button>

                </form>

              ) : (
                /* ── STEP 2: 2FA OTP VERIFICATION ── */
                <form onSubmit={handleVerifyAndRegister} className="login-form">
                  
                  {/* Real Email Dispatch Notification */}
                  <div style={{ padding: '14px 16px', background: 'rgba(0, 245, 255, 0.07)', border: '1px solid rgba(0, 245, 255, 0.25)', borderRadius: '10px', fontSize: '12px', color: '#ffedd6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00f5ff', fontWeight: 600 }}>
                        <Mail size={15} /> Real 2FA OTP Sent:
                      </div>
                      <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                        VERIFY EMAIL
                      </span>
                    </div>

                    <div style={{ color: '#c4bcaf', lineHeight: 1.4 }}>
                      <div>Official Sender: <strong style={{ color: '#f59e0b' }}>bikkinavijay0@gmail.com</strong></div>
                      <div>Recipient: <strong style={{ color: '#00f5ff' }}>{form.email}</strong></div>
                      <div style={{ fontSize: '11px', color: '#8c857b', marginTop: '2px' }}>
                        Please check your inbox & spam folder. Valid for 10 minutes.
                      </div>
                    </div>

                    {/* Ethereal Web Inbox Link */}
                    {deliveryInfo.previewUrl && (
                      <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed rgba(0, 245, 255, 0.2)' }}>
                        <a
                          href={deliveryInfo.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#f59e0b', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                        >
                          <ExternalLink size={13} /> View Dispatched Email in Live Test Mailbox →
                        </a>
                      </div>
                    )}

                    {/* Quick Dev Code */}
                    {deliveryInfo.otpPreview && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px', marginTop: '2px' }}>
                        <span style={{ color: '#8c857b', fontSize: '11px' }}>Quick Dev Code:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#10b981', fontWeight: 700, letterSpacing: '2px', fontSize: '14px' }}>
                          {deliveryInfo.otpPreview}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ margin: 0 }}>
                        <KeyRound size={12} style={{ marginRight: '6px' }} /> ENTER 6-DIGIT OTP
                      </label>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={!canResend || resending}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: canResend ? '#00f5ff' : '#6e675d',
                          cursor: canResend ? 'pointer' : 'default',
                          fontSize: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: canResend ? 'underline' : 'none'
                        }}
                      >
                        <RefreshCw size={11} className={resending ? 'spin' : ''} />
                        {resending ? 'Sending...' : canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                      </button>
                    </div>

                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      className="form-input input-user"
                      placeholder="● ● ● ● ● ●"
                      style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>

                  <button type="submit" className="submit-btn btn-user" disabled={loading || otpCode.length < 6}>
                    {loading ? 'VERIFYING & CREATING ACCOUNT...' : 'VERIFY & CREATE ACCOUNT →'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    style={{ background: 'transparent', border: 'none', color: '#8c857b', cursor: 'pointer', fontSize: '12px', textAlign: 'center', marginTop: '6px' }}
                  >
                    ← Edit account details
                  </button>
                </form>
              )}
            </>
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

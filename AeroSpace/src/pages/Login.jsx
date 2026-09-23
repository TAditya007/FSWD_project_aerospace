import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, KeyRound, CheckCircle, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';
import { signInWithGoogle } from '../config/firebase';
import './auth.css';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState({ mode: '', previewUrl: null, otpPreview: null });
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  // Countdown timer for OTP Resend
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

  const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

  // Helper to safely parse JSON responses from backend
  const safeParseJson = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('BACKEND_OFFLINE');
    }
    return await response.json();
  };

  // Phase 1: Validate Email & Password, Request Real 2FA OTP
  const handleInitiateLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Verify credentials against DB
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await safeParseJson(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      // 2. Dispatch real 2FA OTP via nodemailer
      const otpRes = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'LOGIN' })
      });
      const otpData = await safeParseJson(otpRes);

      if (!otpRes.ok || !otpData.success) {
        throw new Error(otpData.message || 'Unable to send OTP email. Please try again.');
      }

      setDeliveryInfo({
        mode: otpData.deliveryMode || 'LIVE_SMTP',
        previewUrl: otpData.previewUrl || null,
        otpPreview: otpData.otpPreview || null
      });

      setOtpStep(true);
      setResendTimer(30);
      setCanResend(false);
    } catch (err) {
      // In production: NEVER fall back to dev simulation or expose mock OTP!
      if (!import.meta.env.PROD) {
        const lower = email.toLowerCase().trim();
        const isAditya = (lower === 'aditya@aerospec.com' || lower === 'adityalap007@gmail.com') && password === 'aditya@007';
        const isVijay = (lower === 'vijay@aerospec.com' && password === 'vijay@2007') || (lower === 'bikkinavijay0@gmail.com' && password === 'ans14');
        const isUser = lower === 'user@aerospec.com' && password === 'user123';

        if (isAditya || isVijay || isUser) {
          const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
          setDeliveryInfo({ mode: 'DEV_SIMULATION', otpPreview: mockCode, previewUrl: null });
          setOtpStep(true);
          setResendTimer(30);
          setCanResend(false);
          return;
        }
      }

      if (err.message === 'BACKEND_OFFLINE' || err.message?.includes('<!doctype') || err.message?.includes('Unexpected token')) {
        setError('Backend API server is offline or unreachable. Please try again.');
      } else {
        setError(err.message || 'Unable to send OTP email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Action
  const handleResendOtp = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError('');

    try {
      const otpRes = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'LOGIN' })
      });
      const otpData = await safeParseJson(otpRes);

      if (!otpRes.ok || !otpData.success) {
        throw new Error(otpData.message || 'Unable to send OTP email. Please try again.');
      }

      setDeliveryInfo({
        mode: otpData.deliveryMode || 'LIVE_SMTP',
        previewUrl: otpData.previewUrl || null,
        otpPreview: otpData.otpPreview || null
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
        setError(err.message || 'Unable to send OTP email. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  // Phase 2: Verify Real 2FA OTP & Redirect
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode.trim(), action: 'LOGIN' })
      });

      const data = await safeParseJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid 2FA OTP.');
      }

      localStorage.setItem('aerospec_user', JSON.stringify(data.user));

      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      // Fallback verification for offline local dev only
      if (!import.meta.env.PROD && deliveryInfo.otpPreview && otpCode.trim() === deliveryInfo.otpPreview) {
        const lower = email.toLowerCase().trim();
        const isVijayAdmin = lower === 'vijay@aerospec.com' || lower === 'bikkinavijay0@gmail.com';
        const isAdityaAdmin = lower === 'aditya@aerospec.com' || lower === 'adityalap007@gmail.com';
        const isAdmin = isVijayAdmin || isAdityaAdmin;

        const authUser = {
          name: isVijayAdmin ? 'System Admin Vijay' : isAdityaAdmin ? 'System Admin Aditya' : email.split('@')[0],
          email,
          role: isAdmin ? 'admin' : 'user'
        };

        localStorage.setItem('aerospec_user', JSON.stringify(authUser));
        if (isAdmin) {
          navigate('/admin/dashboard');
        } else {
          navigate('/user/dashboard');
        }
        return;
      }

      if (err.message === 'BACKEND_OFFLINE') {
        setError('Backend server unreachable. Please verify connection.');
      } else {
        setError(err.message || 'Invalid 6-digit OTP code.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Phase 3: Firebase Google Authentication
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const u = result.user;
      const emailLower = (u.email || '').toLowerCase().trim();
      const isVijayAdmin = emailLower === 'vijay@aerospec.com' || emailLower === 'bikkinavijay0@gmail.com';
      const isAdityaAdmin = emailLower === 'aditya@aerospec.com' || emailLower === 'adityalap007@gmail.com';
      const isAdmin = isVijayAdmin || isAdityaAdmin;

      const authUser = {
        name: u.displayName || (isVijayAdmin ? 'System Admin Vijay' : isAdityaAdmin ? 'System Admin Aditya' : emailLower.split('@')[0]),
        email: u.email,
        role: isAdmin ? 'admin' : 'user',
        photoURL: u.photoURL,
        uid: u.uid,
        authProvider: 'firebase-google'
      };

      localStorage.setItem('aerospec_user', JSON.stringify(authUser));

      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Firebase Google Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const setAdminVijay = () => {

    setEmail('vijay@aerospec.com');
    setPassword('vijay@2007');
    setError('');
  };

  const setAdminAditya = () => {
    setEmail('aditya@aerospec.com');
    setPassword('aditya@007');
    setError('');
  };

  const setDemoUser = () => {
    setEmail('user@aerospec.com');
    setPassword('user123');
    setError('');
  };

  return (
    <div className="login-root user-theme">
      <div className="grid-bg" />
      <div className="orb orb-login orb-user" />

      <div className="login-container">
        <Link to="/" className="back-link-top">← AEROSPEC HOME</Link>

        <motion.div
          className="login-card card-user"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="card-accent accent-user" />

          {/* Header */}
          <div className="card-header">
            <span className="card-badge badge-user">
              <ShieldCheck size={12} style={{ display: 'inline', marginRight: '6px' }} />
              {otpStep ? 'REAL 2FA EMAIL VERIFICATION' : 'AEROSPACE SECURE ACCESS'}
            </span>
            <h1 className="card-title">{otpStep ? 'Enter Verification Code' : 'Sign In to AeroSpec'}</h1>
            <p className="card-desc">
              {otpStep
                ? `An official 6-digit authorization code was dispatched to ${email}.`
                : 'Sign in with your email & password. Role-based routing directs to Operator or Admin Center.'}
            </p>
          </div>

          {/* ── STEP 1: CREDENTIALS INPUT ── */}
          {!otpStep ? (
            <form onSubmit={handleInitiateLogin} className="login-form">
              <div className="form-group">
                <label className="form-label">
                  <Mail size={12} style={{ marginRight: '6px' }} /> EMAIL ADDRESS (ANY DOMAIN)
                </label>
                <input
                  type="email"
                  className="form-input input-user"
                  placeholder="your.name@gmail.com"
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

              {/* Error Alert */}
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

              <button type="submit" className="submit-btn btn-user" disabled={loading}>
                {loading ? 'VERIFYING CREDENTIALS...' : (
                  <>
                    DISPATCH 2FA EMAIL CODE <ArrowRight size={16} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0 14px', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 237, 214, 0.1)' }} />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#8c857b', letterSpacing: '1px' }}>OR INSTANT ACCESS</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 237, 214, 0.1)' }} />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 237, 214, 0.15)',
                  borderRadius: '8px',
                  color: '#ffedd6',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255, 87, 34, 0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; e.currentTarget.style.borderColor = 'rgba(255, 237, 214, 0.15)'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                CONTINUE WITH GOOGLE (FIREBASE)
              </button>
            </form>

          ) : (
            /* ── STEP 2: 2FA REAL EMAIL OTP INPUT ── */
            <form onSubmit={handleVerify2FA} className="login-form">

              {/* Real Email Dispatch Notification */}
              <div style={{ padding: '14px 16px', background: 'rgba(0, 245, 255, 0.07)', border: '1px solid rgba(0, 245, 255, 0.25)', borderRadius: '10px', fontSize: '12px', color: '#ffedd6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00f5ff', fontWeight: 600 }}>
                    <Mail size={15} /> Real Email Dispatched:
                  </div>
                  <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                    ACTIVE 2FA
                  </span>
                </div>

                <div style={{ color: '#c4bcaf', lineHeight: 1.4 }}>
                  <div>Official Sender: <strong style={{ color: '#f59e0b' }}>bikkinavijay0@gmail.com</strong></div>
                  <div>Recipient: <strong style={{ color: '#00f5ff' }}>{email}</strong></div>
                  <div style={{ fontSize: '11px', color: '#8c857b', marginTop: '2px' }}>
                    Check your Inbox & Spam folders. Code valid for 10 minutes.
                  </div>
                </div>

                {/* Ethereal Web Inbox Link if in test mode */}
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

                {/* OTP Preview for Quick Development */}
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

              {/* Error Alert */}
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

              <button type="submit" className="submit-btn btn-user" disabled={loading || otpCode.length < 6}>
                {loading ? 'AUTHENTICATING CODE...' : 'VERIFY & ENTER COCKPIT →'}
              </button>

              <button
                type="button"
                onClick={() => setOtpStep(false)}
                style={{ background: 'transparent', border: 'none', color: '#8c857b', cursor: 'pointer', fontSize: '12px', textAlign: 'center', marginTop: '6px' }}
              >
                ← Change Email or Password
              </button>
            </form>
          )}

          {/* Whitelisted Admin & Operator Quick Fill Buttons */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 237, 214, 0.08)' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#8c857b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={12} color="#f59e0b" /> Quick Whitelisted Admins:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={setAdminVijay}
                style={{ padding: '6px 10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
              >
                Admin Vijay (vijay@)
              </button>
              <button
                type="button"
                onClick={setAdminAditya}
                style={{ padding: '6px 10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
              >
                Admin Aditya (aditya@)
              </button>
              <button
                type="button"
                onClick={setDemoUser}
                style={{ padding: '6px 10px', background: 'rgba(0, 245, 255, 0.08)', border: '1px solid rgba(0, 245, 255, 0.25)', color: '#00f5ff', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
              >
                Operator (user@)
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="card-footer">
            <p className="footer-text">
              Don't have an account?{' '}
              <Link to="/signup" className="footer-link">Register with Your Real Email →</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

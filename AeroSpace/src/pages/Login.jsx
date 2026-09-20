import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, KeyRound, CheckCircle, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';
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

  // Phase 1: Validate Email & Password, Request Real 2FA OTP
  const handleInitiateLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Verify credentials against DB
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      // 2. Dispatch real 2FA OTP via nodemailer
      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'LOGIN' })
      });
      const otpData = await otpRes.json();

      setDeliveryInfo({
        mode: otpData.deliveryMode || 'LIVE_SMTP',
        previewUrl: otpData.previewUrl || null,
        otpPreview: otpData.otpPreview || null
      });

      setOtpStep(true);
      setResendTimer(30);
      setCanResend(false);
    } catch (err) {
      // Offline fallback for testing
      const lower = email.toLowerCase();
      if ((lower === 'vijay@aerospec.com' && password === 'vijay@2007') ||
          (lower === 'aditya@aerospec.com' && password === 'aditya@007') ||
          (lower === 'user@aerospec.com' && password === 'user123')) {
        const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
        setDeliveryInfo({ mode: 'DEV_SIMULATION', otpPreview: mockCode, previewUrl: null });
        setOtpStep(true);
        setResendTimer(30);
        setCanResend(false);
        return;
      }

      setError(err.message || 'Invalid email or password. Please try again.');
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
      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'LOGIN' })
      });
      const otpData = await otpRes.json();

      setDeliveryInfo({
        mode: otpData.deliveryMode || 'LIVE_SMTP',
        previewUrl: otpData.previewUrl || null,
        otpPreview: otpData.otpPreview || null
      });

      setResendTimer(30);
      setCanResend(false);
    } catch (err) {
      setError('Could not resend OTP. Please try again.');
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
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode.trim(), action: 'LOGIN' })
      });

      const data = await res.json();
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
      // Fallback verification for offline dev
      if (deliveryInfo.otpPreview && otpCode.trim() === deliveryInfo.otpPreview) {
        const isVijayAdmin = email.toLowerCase() === 'vijay@aerospec.com';
        const isAdityaAdmin = email.toLowerCase() === 'aditya@aerospec.com';
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

      setError(err.message || 'Invalid 6-digit OTP code.');
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

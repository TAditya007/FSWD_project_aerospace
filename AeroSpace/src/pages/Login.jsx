import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, KeyRound, CheckCircle, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';
import { VITE_API_URL } from '../config/api';
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

  // Forgot Password Flow States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState('EMAIL'); // 'EMAIL' | 'OTP_AND_PASSWORD' | 'SUCCESS'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotDeliveryInfo, setForgotDeliveryInfo] = useState({ mode: '', previewUrl: null, otpPreview: null });
  const [forgotResendTimer, setForgotResendTimer] = useState(30);
  const [forgotCanResend, setForgotCanResend] = useState(false);

  // Countdown timer for OTP Resend (Login)
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

  // Countdown timer for Forgot Password OTP Resend
  useEffect(() => {
    let timer;
    if (isForgotPassword && forgotStep === 'OTP_AND_PASSWORD' && forgotResendTimer > 0) {
      timer = setInterval(() => {
        setForgotResendTimer(prev => {
          if (prev <= 1) {
            setForgotCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isForgotPassword, forgotStep, forgotResendTimer]);

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
      const res = await fetch(`${VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await safeParseJson(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      // 2. Dispatch real 2FA OTP via nodemailer
      const otpRes = await fetch(`${VITE_API_URL}/api/auth/send-otp`, {
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
      const otpRes = await fetch(`${VITE_API_URL}/api/auth/send-otp`, {
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
      const res = await fetch(`${VITE_API_URL}/api/auth/verify-otp`, {
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

  // Phase 1 (Forgot Password): Request Reset OTP
  const handleRequestForgotOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    const cleanEmail = (forgotEmail || email).trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setForgotError('Please enter a valid registered email address.');
      return;
    }
    setForgotLoading(true);

    try {
      const res = await fetch(`${VITE_API_URL}/api/auth/forgot-password/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await safeParseJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'No account registered with this email address.');
      }

      setForgotDeliveryInfo({
        mode: data.deliveryMode || 'LIVE_SMTP',
        previewUrl: data.previewUrl || null,
        otpPreview: data.otpPreview || null
      });

      setForgotEmail(cleanEmail);
      setForgotStep('OTP_AND_PASSWORD');
      setForgotResendTimer(30);
      setForgotCanResend(false);
    } catch (err) {
      if (!import.meta.env.PROD && (cleanEmail === 'user@aerospec.com' || cleanEmail === 'vijay@aerospec.com' || cleanEmail === 'aditya@aerospec.com')) {
        const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
        setForgotDeliveryInfo({ mode: 'DEV_SIMULATION', otpPreview: mockCode, previewUrl: null });
        setForgotEmail(cleanEmail);
        setForgotStep('OTP_AND_PASSWORD');
        setForgotResendTimer(30);
        setForgotCanResend(false);
        return;
      }
      setForgotError(err.message || 'Unable to dispatch password reset code.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Resend Forgot Password OTP
  const handleResendForgotOtp = async () => {
    if (!forgotCanResend || forgotLoading) return;
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await fetch(`${VITE_API_URL}/api/auth/forgot-password/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() })
      });
      const data = await safeParseJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Unable to resend reset OTP.');
      }
      setForgotDeliveryInfo({
        mode: data.deliveryMode || 'LIVE_SMTP',
        previewUrl: data.previewUrl || null,
        otpPreview: data.otpPreview || null
      });
      setForgotResendTimer(30);
      setForgotCanResend(false);
    } catch (err) {
      setForgotError(err.message || 'Unable to resend reset code.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Phase 2 (Forgot Password): Verify OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setForgotError('Please enter the 6-digit authorization code received via email.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${VITE_API_URL}/api/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          otp: forgotOtp.trim(),
          newPassword
        })
      });
      const data = await safeParseJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password.');
      }
      setForgotStep('SUCCESS');
    } catch (err) {
      if (!import.meta.env.PROD && forgotDeliveryInfo.otpPreview && forgotOtp.trim() === forgotDeliveryInfo.otpPreview) {
        setForgotStep('SUCCESS');
        return;
      }
      setForgotError(err.message || 'Unable to reset password.');
    } finally {
      setForgotLoading(false);
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
              {isForgotPassword
                ? (forgotStep === 'SUCCESS' ? 'SECURITY CREDENTIAL RESTORED' : 'AEROSPACE PASSWORD RECOVERY')
                : otpStep
                ? 'REAL 2FA EMAIL VERIFICATION'
                : 'AEROSPACE SECURE ACCESS'}
            </span>
            <h1 className="card-title">
              {isForgotPassword
                ? (forgotStep === 'SUCCESS' ? 'Password Reset Complete' : forgotStep === 'OTP_AND_PASSWORD' ? 'Enter Reset Code & Password' : 'Reset Your Password')
                : otpStep
                ? 'Enter Verification Code'
                : 'Sign In to AeroSpec'}
            </h1>
            <p className="card-desc">
              {isForgotPassword
                ? (forgotStep === 'SUCCESS'
                    ? 'Your AeroSpec account password has been updated. You can now sign in.'
                    : forgotStep === 'OTP_AND_PASSWORD'
                    ? `An official 6-digit authorization code was dispatched to ${forgotEmail}.`
                    : 'Enter your registered email address to receive an official password reset code.')
                : otpStep
                ? `An official 6-digit authorization code was dispatched to ${email}.`
                : 'Sign in with your email & password. Role-based routing directs to Operator or Admin Center.'}
            </p>
          </div>

          {/* ── FORGOT PASSWORD FLOW ── */}
          {isForgotPassword ? (
            forgotStep === 'SUCCESS' ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', marginBottom: '16px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <CheckCircle size={32} />
                </div>
                <h3 style={{ color: '#ffedd6', fontSize: '18px', margin: '0 0 8px', fontWeight: 700 }}>Password Reset Successful!</h3>
                <p style={{ color: '#b4aa9d', fontSize: '13px', lineHeight: 1.6, margin: '0 0 24px' }}>
                  Your password has been securely updated and a confirmation notification was dispatched to <strong style={{ color: '#00f5ff' }}>{forgotEmail}</strong>. You may now return to the cockpit sign-in page.
                </p>
                <button
                  type="button"
                  className="submit-btn btn-user"
                  onClick={() => {
                    setEmail(forgotEmail);
                    setPassword('');
                    setIsForgotPassword(false);
                    setForgotStep('EMAIL');
                    setForgotOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  RETURN TO SIGN IN →
                </button>
              </div>
            ) : forgotStep === 'OTP_AND_PASSWORD' ? (
              <form onSubmit={handleResetPassword} className="login-form">
                {/* Real Email Dispatch Notification */}
                <div style={{ padding: '14px 16px', background: 'rgba(0, 245, 255, 0.07)', border: '1px solid rgba(0, 245, 255, 0.25)', borderRadius: '10px', fontSize: '12px', color: '#ffedd6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00f5ff', fontWeight: 600 }}>
                      <Mail size={15} /> Real Reset OTP Dispatched:
                    </div>
                    <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                      PASSWORD RESET
                    </span>
                  </div>

                  <div style={{ color: '#c4bcaf', lineHeight: 1.4 }}>
                    <div>Official Sender: <strong style={{ color: '#f59e0b' }}>bikkinavijay0@gmail.com</strong></div>
                    <div>Recipient: <strong style={{ color: '#00f5ff' }}>{forgotEmail}</strong></div>
                    <div style={{ fontSize: '11px', color: '#8c857b', marginTop: '2px' }}>
                      Check your Inbox & Spam folders. Code valid for 10 minutes.
                    </div>
                  </div>

                  {forgotDeliveryInfo.previewUrl && (
                    <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed rgba(0, 245, 255, 0.2)' }}>
                      <a
                        href={forgotDeliveryInfo.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#f59e0b', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '11px' }}
                      >
                        <ExternalLink size={12} /> View Dispatched Email in Live Test Mailbox →
                      </a>
                    </div>
                  )}

                  {forgotDeliveryInfo.otpPreview && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px', marginTop: '2px' }}>
                      <span style={{ color: '#8c857b', fontSize: '11px' }}>Quick Dev Code:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#10b981', fontWeight: 700, letterSpacing: '2px', fontSize: '14px' }}>
                        {forgotDeliveryInfo.otpPreview}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      <KeyRound size={12} style={{ marginRight: '6px' }} /> ENTER 6-DIGIT RESET OTP
                    </label>
                    <button
                      type="button"
                      onClick={handleResendForgotOtp}
                      disabled={!forgotCanResend || forgotLoading}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: forgotCanResend ? '#00f5ff' : '#6e675d',
                        cursor: forgotCanResend ? 'pointer' : 'default',
                        fontSize: '11px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: forgotCanResend ? 'underline' : 'none'
                      }}
                    >
                      <RefreshCw size={11} className={forgotLoading ? 'spin' : ''} />
                      {forgotLoading ? 'Sending...' : forgotCanResend ? 'Resend OTP' : `Resend in ${forgotResendTimer}s`}
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    className="form-input input-user"
                    placeholder="● ● ● ● ● ●"
                    style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    value={forgotOtp}
                    onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Lock size={12} style={{ marginRight: '6px' }} /> NEW PASSWORD (MIN 6 CHARACTERS)
                  </label>
                  <input
                    type="password"
                    className="form-input input-user"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Lock size={12} style={{ marginRight: '6px' }} /> CONFIRM NEW PASSWORD
                  </label>
                  <input
                    type="password"
                    className="form-input input-user"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Error Alert */}
                <AnimatePresence>
                  {forgotError && (
                    <motion.div
                      className="form-error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      ⚠ {forgotError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" className="submit-btn btn-user" disabled={forgotLoading || forgotOtp.length < 6 || !newPassword || !confirmPassword}>
                  {forgotLoading ? 'VERIFYING CODE & UPDATING...' : 'RESET PASSWORD & SECURE ACCOUNT ✓'}
                </button>

                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setForgotStep('EMAIL'); setForgotError(''); }}
                  style={{ background: 'transparent', border: 'none', color: '#8c857b', cursor: 'pointer', fontSize: '12px', textAlign: 'center', marginTop: '6px' }}
                >
                  ← Return to Sign In
                </button>
              </form>
            ) : (
              /* forgotStep === 'EMAIL' */
              <form onSubmit={handleRequestForgotOtp} className="login-form">
                <div className="form-group">
                  <label className="form-label">
                    <Mail size={12} style={{ marginRight: '6px' }} /> REGISTERED ACCOUNT EMAIL
                  </label>
                  <input
                    type="email"
                    className="form-input input-user"
                    placeholder="your.registered.email@example.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <div style={{ fontSize: '11px', color: '#8c857b', marginTop: '4px' }}>
                    Enter your account email to receive a 6-digit security reset code via Brevo.
                  </div>
                </div>

                {/* Error Alert */}
                <AnimatePresence>
                  {forgotError && (
                    <motion.div
                      className="form-error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      ⚠ {forgotError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" className="submit-btn btn-user" disabled={forgotLoading || !forgotEmail}>
                  {forgotLoading ? 'VERIFYING ACCOUNT & DISPATCHING...' : (
                    <>
                      DISPATCH RESET OTP <ArrowRight size={16} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setForgotStep('EMAIL'); setForgotError(''); }}
                  style={{ background: 'transparent', border: 'none', color: '#8c857b', cursor: 'pointer', fontSize: '12px', textAlign: 'center', marginTop: '6px' }}
                >
                  ← Return to Sign In
                </button>
              </form>
            )
          ) : !otpStep ? (
            /* ── STEP 1: CREDENTIALS INPUT ── */
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    <Lock size={12} style={{ marginRight: '6px' }} /> PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setForgotStep('EMAIL');
                      setForgotEmail(email || '');
                      setForgotError('');
                      setError('');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#00f5ff',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
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

          {/* Whitelisted Admin & Operator Quick Fill Buttons (Hidden during Forgot Password) */}
          {!isForgotPassword && (
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
          )}

          {/* Footer */}
          <div className="card-footer">
            <p className="footer-text">
              {isForgotPassword ? (
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setForgotStep('EMAIL'); }}
                  style={{ background: 'transparent', border: 'none', color: '#00f5ff', cursor: 'pointer', fontSize: '13px' }}
                >
                  ← Return to Sign In
                </button>
              ) : (
                <>
                  Don't have an account?{' '}
                  <Link to="/signup" className="footer-link">Register with Your Real Email →</Link>
                </>
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

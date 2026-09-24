import { useState } from 'react';
import { Mail, CheckCircle, AlertTriangle, KeyRound, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { VITE_API_URL } from '../config/api';

export default function EmailChangeModal({ 
  isOpen,
  user, 
  currentUser,
  onClose, 
  onEmailUpdated,
  onEmailChanged 
}) {
  if (!isOpen) return null;

  const activeUser = user || currentUser || {};
  const [step, setStep] = useState(1); // 1: Enter new email, 2: Enter OTP
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('');
  const [otpPreview, setOtpPreview] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!newEmail || !newEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (newEmail.toLowerCase() === (activeUser.email || '').toLowerCase()) {
      setError('New email must be different from current email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${VITE_API_URL}/api/user/email/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEmail: activeUser.email,
          newEmail: newEmail.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to dispatch verification code.');
      }

      setDeliveryMode(data.deliveryMode);
      if (!import.meta.env.PROD && data.otpPreview) {
        setOtpPreview(data.otpPreview);
      }
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit security code sent to your new email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${VITE_API_URL}/api/user/email/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEmail: activeUser.email,
          newEmail: newEmail.trim(),
          otp: otp.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid or expired OTP code.');
      }

      setSuccessMsg('Email updated successfully! Future logins will use your new email.');
      const callback = onEmailUpdated || onEmailChanged;
      if (callback) {
        callback(data.user?.email || newEmail.trim());
      }
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ud-modal-backdrop" onClick={onClose}>
      <div className="ud-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="ud-modal-title" style={{ margin: 0 }}>
            <Mail size={20} color="var(--hud-accent, #00f5ff)" /> Update Account Email
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
            ⚠ {error}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '12px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
            ✓ {successMsg}
          </div>
        )}

        {step === 1 && !successMsg && (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Current verified email: <strong style={{ color: '#f8fafc' }}>{activeUser?.email || 'N/A'}</strong>
            </div>

            <div className="ud-modal-field">
              <label className="ud-modal-label">Enter New Registered Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. operator.flight@gmail.com"
                className="ud-modal-input"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
            </div>

            <div style={{ fontSize: '11px', color: '#8c857b' }}>
              A 6-digit security authorization code will be dispatched to this new email to verify ownership.
            </div>

            <div className="ud-modal-actions">
              <button type="button" className="ud-modal-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="ud-modal-submit" disabled={loading}>
                {loading ? 'SENDING SECURITY CODE...' : 'Send Verification OTP →'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && !successMsg && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '10px 14px', background: 'rgba(0, 245, 255, 0.08)', border: '1px solid rgba(0, 245, 255, 0.25)', borderRadius: '6px', fontSize: '12px', color: '#f8fafc' }}>
              ✉ 6-digit security code sent to: <strong style={{ color: 'var(--hud-accent, #00f5ff)' }}>{newEmail}</strong>
            </div>

            {otpPreview && (
              <div style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed #f59e0b', color: '#fbbf24', borderRadius: '6px', fontSize: '11px' }}>
                Simulator OTP Preview: <strong>{otpPreview}</strong>
              </div>
            )}

            <div className="ud-modal-field">
              <label className="ud-modal-label">Enter 6-Digit OTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="• • • • • •"
                className="ud-modal-input"
                style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '8px', fontFamily: 'var(--font-mono)' }}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="ud-modal-actions">
              <button type="button" className="ud-modal-cancel" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button type="submit" className="ud-modal-submit" disabled={loading || otp.length < 6}>
                {loading ? 'VERIFYING...' : 'Verify & Update Email ✓'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

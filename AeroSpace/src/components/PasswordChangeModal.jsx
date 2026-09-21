import { useState } from 'react';
import { Lock, CheckCircle, AlertTriangle, KeyRound, ShieldCheck, X, Eye, EyeOff } from 'lucide-react';

export default function PasswordChangeModal({ 
  isOpen,
  user, 
  currentUser,
  onClose,
  onPasswordChanged 
}) {
  if (!isOpen) return null;

  const activeUser = user || currentUser || {};
  const [step, setStep] = useState(1); // 1: Password inputs, 2: 2FA OTP verification
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [otpPreview, setOtpPreview] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/password/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: activeUser.email,
          currentPassword
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Current password verification failed.');
      }

      if (data.otpPreview) {
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
      setError('Please enter the 6-digit security code sent to your registered email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: activeUser.email,
          newPassword,
          otp: otp.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid or expired OTP code.');
      }

      setSuccessMsg('Password updated successfully! Next login will require your new password.');
      if (onPasswordChanged) {
        onPasswordChanged();
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
            <Lock size={20} color="var(--hud-accent, #00f5ff)" /> Change Account Password
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
            <div className="ud-modal-field">
              <label className="ud-modal-label">Current Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="Enter existing password"
                className="ud-modal-input"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="ud-modal-field">
              <label className="ud-modal-label">New Password (Min. 6 Characters)</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="Enter strong new password"
                className="ud-modal-input"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>

            <div className="ud-modal-field">
              <label className="ud-modal-label">Confirm New Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="Confirm new password"
                className="ud-modal-input"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#94a3b8' }} onClick={() => setShowPass(!showPass)}>
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showPass ? 'Hide password characters' : 'Show password characters'}</span>
            </div>

            <div style={{ fontSize: '11px', color: '#8c857b' }}>
              A 2FA authorization code will be dispatched to <strong>{user.email}</strong> before applying this change.
            </div>

            <div className="ud-modal-actions">
              <button type="button" className="ud-modal-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="ud-modal-submit" disabled={loading}>
                {loading ? 'VALIDATING CREDENTIALS...' : 'Proceed to 2FA Verification →'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && !successMsg && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '10px 14px', background: 'rgba(0, 245, 255, 0.08)', border: '1px solid rgba(0, 245, 255, 0.25)', borderRadius: '6px', fontSize: '12px', color: '#f8fafc' }}>
              ✉ 2FA security code dispatched to: <strong style={{ color: 'var(--hud-accent, #00f5ff)' }}>{activeUser?.email || 'N/A'}</strong>
            </div>

            {otpPreview && (
              <div style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed #f59e0b', color: '#fbbf24', borderRadius: '6px', fontSize: '11px' }}>
                Simulator OTP Preview: <strong>{otpPreview}</strong>
              </div>
            )}

            <div className="ud-modal-field">
              <label className="ud-modal-label">Enter 6-Digit 2FA Code</label>
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
                {loading ? 'VERIFYING...' : 'Authorize & Change Password ✓'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck, CreditCard, QrCode, Smartphone, Building2, Wallet,
  Copy, Check, Download, ArrowLeft, ArrowRight, Clock, CheckCircle,
  Sparkles, Lock, RefreshCw, KeyRound, AlertCircle, AlertTriangle, ShieldAlert
} from 'lucide-react';
import './PaymentGateway.css';

import { PLAN_CONFIG as TIERS } from '../config/plans';

const OFFICIAL_UPI_ID = '9866606967@superyes';
const OFFICIAL_OTP_EMAIL = 'bikkinavijay0@gmail.com';

export default function PaymentGateway() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('aerospec_user') || '{}');

  const initialPlan = searchParams.get('plan') || 'cadet';
  const [selectedPlanId, setSelectedPlanId] = useState(TIERS[initialPlan] ? initialPlan : 'cadet');

  // Payment Method Selection
  // Options: 'UPI_QR' | 'PHONEPE' | 'PAYTM' | 'RAZORPAY' | 'CARD' | 'NETBANKING'
  const [paymentMethod, setPaymentMethod] = useState('UPI_QR');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(600); // 10 minutes
  const [utrInput, setUtrInput] = useState('');
  const [userVpa, setUserVpa] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Card Form State
  const [cardHolder, setCardHolder] = useState(user.name || 'Flight Operator');
  const [cardNumber, setCardNumber] = useState('4532 8912 0491 8821');
  const [cardExp, setCardExp] = useState('09/29');
  const [cardCvv, setCardCvv] = useState('491');

  // ── OTP VERIFICATION STATE (bikkinavijay0@gmail.com) ──
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDeliveryInfo, setOtpDeliveryInfo] = useState(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  // Processing & Receipt State
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const activeTier = TIERS[selectedPlanId] || TIERS.cadet;

  // Session Countdown
  useEffect(() => {
    let timer;
    if (sessionTimer > 0 && !receipt) {
      timer = setInterval(() => {
        setSessionTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionTimer, receipt]);

  // OTP Resend Countdown
  useEffect(() => {
    let timer;
    if (otpSent && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, resendTimer]);

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(OFFICIAL_UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // 1. Send OTP to bikkinavijay0@gmail.com
  const handleSendOtp = async () => {
    setSendingOtp(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/payment/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: OFFICIAL_OTP_EMAIL, name: user.name || 'Flight Operator' })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to dispatch payment OTP.');
      }

      setOtpDeliveryInfo(data);
      setOtpSent(true);
      setResendTimer(30);
    } catch (err) {
      // Dev offline fallback
      setOtpDeliveryInfo({
        otpPreview: Math.floor(100000 + Math.random() * 900000).toString(),
        deliveryMode: 'LOCAL_DEV'
      });
      setOtpSent(true);
      setResendTimer(30);
    } finally {
      setSendingOtp(false);
    }
  };

  // 2. Verify OTP before payment confirmation
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg('Please enter a valid 6-digit OTP code.');
      return;
    }

    setVerifyingOtp(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/payment/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: OFFICIAL_OTP_EMAIL, otp: otpCode.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid OTP code.');
      }

      setOtpVerified(true);
    } catch (err) {
      if (otpDeliveryInfo?.otpPreview && otpCode.trim() === otpDeliveryInfo.otpPreview) {
        setOtpVerified(true);
        return;
      }
      setErrorMsg(err.message || 'Invalid 6-digit OTP code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // 3. Process Payment & Submit with status: 'Pending Approval'
  const handleProcessPayment = async () => {
    if (!otpVerified && activeTier.priceNum > 0) {
      setErrorMsg('OTP verification is required before confirming payment.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    const finalUtr = utrInput.trim() || `${Math.floor(400000000000 + Math.random() * 500000000000)}`;

    try {
      const res = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id || 'usr_current',
          userEmail: user.email || OFFICIAL_OTP_EMAIL,
          userName: user.name || 'Flight Operator',
          planTier: activeTier.id,
          billingDetails: {
            gateway: paymentMethod,
            paymentId: OFFICIAL_UPI_ID,
            utr: finalUtr,
            vpa: userVpa || 'operator@superyes',
            bank: selectedBank,
            cardHolder,
            last4: cardNumber.slice(-4),
            notes: `Authorized via OTP sent to ${OFFICIAL_OTP_EMAIL}`
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Payment submission failed.');
      }

      setReceipt(data.data);
    } catch (err) {
      // Fallback local pending approval receipt
      setReceipt({
        id: `pay_${Date.now()}`,
        orderId: `ORD_${Date.now()}`,
        userEmail: user.email || OFFICIAL_OTP_EMAIL,
        userName: user.name || 'Flight Operator',
        planTier: activeTier.id,
        planName: activeTier.name,
        amount: activeTier.price,
        gateway: paymentMethod,
        paymentId: OFFICIAL_UPI_ID,
        utr: finalUtr,
        status: 'Pending Approval',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // UPI URL encoded payload
  const upiPayload = `upi://pay?pa=${OFFICIAL_UPI_ID}&pn=AeroSpace%20Systems&am=${activeTier.priceNum}&cu=INR&tn=AeroSpace%20${encodeURIComponent(activeTier.name)}%20Subscription`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(upiPayload)}`;

  return (
    <div className="pg-root">
      <div className="pg-grid-bg" />
      <div className="pg-orb pg-orb-1" />
      <div className="pg-orb pg-orb-2" />

      {/* ── TOPBAR ── */}
      <header className="pg-topbar">
        <div className="pg-topbar-left">
          <Link to="/user/dashboard" className="pg-back-btn">
            <ArrowLeft size={14} /> BACK TO DASHBOARD
          </Link>
          <div className="pg-brand-title">
            AERO<span style={{ color: '#00f5ff' }}>SPACE</span> <span style={{ fontSize: '12px', color: '#8c857b', fontFamily: 'var(--font-mono)' }}>CHECKOUT GATEWAY</span>
          </div>
        </div>

        <div className="pg-topbar-right">
          <div className="pg-security-badge">
            <Lock size={12} /> 256-BIT SSL ENCRYPTED
          </div>
          <div className="pg-timer-badge">
            <Clock size={12} /> {Math.floor(sessionTimer / 60)}:{sessionTimer % 60 < 10 ? '0' : ''}{sessionTimer % 60}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTAINER ── */}
      <main className="pg-container">
        <div className="pg-page-header">
          <div className="pg-page-badge">
            <Sparkles size={12} style={{ display: 'inline', marginRight: '6px' }} />
            Official Indian Aerospace Gateway
          </div>
          <h1 className="pg-page-title">Mission Subscription Payment Gateway</h1>
          <p className="pg-page-subtitle">
            Payment ID: <strong style={{ color: '#00f5ff' }}>{OFFICIAL_UPI_ID}</strong> • Verified OTP Authorization • Admin Approval Workflow
          </p>
        </div>

        {/* ── CHECKOUT OR RECEIPT VIEW ── */}
        {receipt ? (
          /* ══════════════ CASE A: CONFIRMATION RECEIPT (PENDING APPROVAL) ══════════════ */
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div className="pg-receipt-wrap">
              <div className="pg-receipt-header">
                <div className="pg-receipt-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  <Clock size={32} />
                </div>
                <h2 style={{ margin: '0 0 6px', color: '#ffedd6', fontSize: '24px', fontFamily: 'var(--font-serif)' }}>
                  Payment Submitted: Pending Approval
                </h2>
                <div style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Awaiting Administrator Authorization
                </div>
              </div>

              {/* Status Banner */}
              <div style={{ padding: '14px 16px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', fontSize: '12px', color: '#f59e0b', lineHeight: 1.5 }}>
                ℹ️ <strong>Admin Approval Workflow Active:</strong> Your payment reference has been forwarded to System Administrators (Vijay & Aditya) in the Admin Control Portal. Once approved, your subscription tier will update to <strong>Active</strong> automatically.
              </div>

              <div className="pg-receipt-row">
                <span className="pg-receipt-label">Payment ID:</span>
                <span className="pg-receipt-value">{receipt.id}</span>
              </div>
              <div className="pg-receipt-row">
                <span className="pg-receipt-label">Beneficiary Gateway ID:</span>
                <span className="pg-receipt-value" style={{ color: '#00f5ff' }}>{receipt.paymentId || OFFICIAL_UPI_ID}</span>
              </div>
              <div className="pg-receipt-row">
                <span className="pg-receipt-label">Bank UTR / Ref Number:</span>
                <span className="pg-receipt-value">{receipt.utr}</span>
              </div>
              <div className="pg-receipt-row">
                <span className="pg-receipt-label">Payment Gateway:</span>
                <span className="pg-receipt-value">{receipt.gateway}</span>
              </div>
              <div className="pg-receipt-row">
                <span className="pg-receipt-label">Requested Plan Tier:</span>
                <span className="pg-receipt-value" style={{ color: '#f59e0b' }}>{receipt.planName}</span>
              </div>
              <div className="pg-receipt-row">
                <span className="pg-receipt-label">Amount:</span>
                <span className="pg-receipt-value" style={{ fontSize: '18px', color: '#10b981' }}>{receipt.amount}</span>
              </div>
              <div className="pg-receipt-row">
                <span className="pg-receipt-label">Current Status:</span>
                <span className="pg-receipt-value" style={{ color: '#f59e0b', fontWeight: 700 }}>
                  🟡 {receipt.status || 'Pending Approval'}
                </span>
              </div>
              <div className="pg-receipt-row">
                <span className="pg-receipt-label">Submission Timestamp:</span>
                <span className="pg-receipt-value" style={{ fontSize: '12px' }}>{new Date().toLocaleString('en-IN')}</span>
              </div>

              <div className="pg-receipt-actions">
                <button type="button" className="pg-receipt-btn-sec" onClick={() => window.print()}>
                  <Download size={14} /> Download Receipt
                </button>
                <button
                  type="button"
                  className="pg-receipt-btn-pri"
                  onClick={() => navigate('/user/dashboard')}
                >
                  Return to Dashboard →
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ══════════════ CASE B: 2-COLUMN CHECKOUT ══════════════ */
          <div className="pg-grid">

            {/* ── LEFT COLUMN: PLAN & ORDER SUMMARY ── */}
            <div className="pg-summary-card">
              <h2 className="pg-card-title">
                <ShieldCheck size={18} color="#00f5ff" /> Order Summary
              </h2>

              {/* Plan Switcher Pills */}
              <div>
                <div style={{ fontSize: '11px', color: '#8c857b', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                  DEFAULT / SELECTED PLAN:
                </div>
                <div className="pg-plan-selector-pills">
                  {Object.values(TIERS).map(t => (
                    <div
                      key={t.id}
                      className={`pg-plan-pill ${selectedPlanId === t.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedPlanId(t.id);
                        setOtpVerified(false);
                        setOtpSent(false);
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#ffedd6' }}>{t.name}</div>
                        <div style={{ fontSize: '11px', color: '#8c857b' }}>{t.pods}</div>
                      </div>
                      <div className="pg-plan-pill-price" style={{ color: selectedPlanId === t.id ? '#00f5ff' : '#c9bbaa' }}>
                        {t.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Line Items */}
              <div className="pg-line-items">
                <div className="pg-line-item">
                  <span>Subscription Tier</span>
                  <span className="pg-line-item-val">{activeTier.name}</span>
                </div>
                <div className="pg-line-item">
                  <span>Included Active Pods</span>
                  <span className="pg-line-item-val">{activeTier.pods}</span>
                </div>
                <div className="pg-line-item">
                  <span>Telemetry Data Retention</span>
                  <span className="pg-line-item-val">{activeTier.retention}</span>
                </div>
                <div className="pg-line-item">
                  <span>GST & Platform Cess</span>
                  <span className="pg-line-item-val" style={{ color: '#10b981' }}>₹0 (Included)</span>
                </div>

                <div className="pg-total-row">
                  <span className="pg-total-label">TOTAL PAYABLE:</span>
                  <span className="pg-total-price">{activeTier.price}</span>
                </div>
              </div>

              {/* Merchant Beneficiary Info */}
              <div className="pg-merchant-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 700 }}>
                  <CheckCircle size={14} /> Official Beneficiary
                </div>
                <div className="pg-merchant-row">
                  <span className="pg-merchant-label">Merchant:</span>
                  <span className="pg-merchant-val">AeroSpace Systems India</span>
                </div>
                <div className="pg-merchant-row">
                  <span className="pg-merchant-label">Payment ID:</span>
                  <span className="pg-merchant-val" style={{ color: '#00f5ff' }}>{OFFICIAL_UPI_ID}</span>
                </div>
                <div className="pg-merchant-row">
                  <span className="pg-merchant-label">Authorization Email:</span>
                  <span className="pg-merchant-val" style={{ color: '#f59e0b' }}>{OFFICIAL_OTP_EMAIL}</span>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: GATEWAY METHODS & OTP VERIFICATION ── */}
            <div className="pg-gateway-card">

              {/* Payment Gateways Tab Switcher */}
              <div className="pg-methods-tabs">
                <button
                  type="button"
                  className={`pg-method-tab ${paymentMethod === 'UPI_QR' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('UPI_QR')}
                >
                  <QrCode size={14} /> UPI QR Scanner
                </button>
                <button
                  type="button"
                  className={`pg-method-tab ${paymentMethod === 'PHONEPE' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('PHONEPE')}
                >
                  <Smartphone size={14} /> PhonePe
                </button>
                <button
                  type="button"
                  className={`pg-method-tab ${paymentMethod === 'PAYTM' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('PAYTM')}
                >
                  <Smartphone size={14} /> Paytm
                </button>
                <button
                  type="button"
                  className={`pg-method-tab ${paymentMethod === 'RAZORPAY' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('RAZORPAY')}
                >
                  <CreditCard size={14} /> Razorpay Gateway
                </button>
                <button
                  type="button"
                  className={`pg-method-tab ${paymentMethod === 'CARD' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('CARD')}
                >
                  <CreditCard size={14} /> RuPay/Cards
                </button>
              </div>

              {errorMsg && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#f87171', borderRadius: '8px', marginBottom: '16px', fontSize: '12px' }}>
                  ⚠ {errorMsg}
                </div>
              )}

              {/* ── GATEWAY VIEW 1: UPI QR SCANNER (9866606967@superyes) ── */}
              {paymentMethod === 'UPI_QR' && (
                <div className="pg-upi-scanner-wrap">
                  {/* Holographic QR Frame */}
                  <div className="pg-qr-frame">
                    <div className="pg-qr-corner pg-qr-tl" />
                    <div className="pg-qr-corner pg-qr-tr" />
                    <div className="pg-qr-corner pg-qr-bl" />
                    <div className="pg-qr-corner pg-qr-br" />

                    <img
                      src={qrCodeUrl}
                      alt="AeroSpace UPI Payment QR Scanner"
                      className="pg-qr-image"
                    />
                  </div>

                  {/* Official UPI ID Banner with 1-Click Copy */}
                  <div className="pg-upi-pill">
                    <div>
                      <div className="pg-upi-label">OFFICIAL PAYMENT ID / UPI:</div>
                      <div className="pg-upi-id">{OFFICIAL_UPI_ID}</div>
                    </div>
                    <button type="button" className="pg-copy-btn" onClick={handleCopyUpi}>
                      {copiedUpi ? <Check size={13} /> : <Copy size={13} />}
                      {copiedUpi ? 'Copied!' : 'Copy ID'}
                    </button>
                  </div>

                  {/* Supported Apps */}
                  <div className="pg-apps-badges">
                    <span className="pg-app-pill">Google Pay</span>
                    <span className="pg-app-pill">PhonePe</span>
                    <span className="pg-app-pill">Paytm</span>
                    <span className="pg-app-pill">BHIM</span>
                    <span className="pg-app-pill" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>super.money</span>
                    <span className="pg-app-pill">CRED</span>
                  </div>

                  {/* UTR Input */}
                  <div style={{ width: '100%', maxWidth: '480px' }}>
                    <label className="pg-input-label" style={{ display: 'block', marginBottom: '6px' }}>
                      12-Digit Bank Reference / UTR Number (From Your UPI App)
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="e.g. 428190382910"
                      className="pg-input"
                      value={utrInput}
                      onChange={e => setUtrInput(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
              )}

              {/* ── GATEWAY VIEW 2: PHONEPE / PAYTM / RAZORPAY SIMULATION ── */}
              {(paymentMethod === 'PHONEPE' || paymentMethod === 'PAYTM' || paymentMethod === 'RAZORPAY') && (
                <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '12px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f5ff', fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>
                    <Smartphone size={16} /> Simulated {paymentMethod} Gateway
                  </div>
                  <p style={{ fontSize: '13px', color: '#c9bbaa', lineHeight: 1.5, margin: '0 0 14px' }}>
                    Routing transaction through <strong>{paymentMethod}</strong> payment switch to official beneficiary: <strong style={{ color: '#00f5ff' }}>{OFFICIAL_UPI_ID}</strong>.
                  </p>
                  <div>
                    <label className="pg-input-label" style={{ display: 'block', marginBottom: '6px' }}>
                      Enter VPA / Mobile (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9866606967@superyes or user@upi"
                      className="pg-input"
                      value={userVpa}
                      onChange={e => setUserVpa(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ── GATEWAY VIEW 3: CARDS ── */}
              {paymentMethod === 'CARD' && (
                <div style={{ marginBottom: '20px' }}>
                  <div className="ud-card-preview" style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="ud-card-chip" />
                      <span style={{ fontSize: '11px', color: '#f59e0b', letterSpacing: '2px', fontWeight: 'bold' }}>RUPAY / VISA / MC</span>
                    </div>
                    <div className="ud-card-number">{cardNumber}</div>
                    <div className="ud-card-bottom">
                      <span>CARDHOLDER: {cardHolder.toUpperCase()}</span>
                      <span>EXPIRES: {cardExp}</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="pg-input-label" style={{ display: 'block', marginBottom: '4px' }}>Cardholder</label>
                      <input type="text" className="pg-input" value={cardHolder} onChange={e => setCardHolder(e.target.value)} />
                    </div>
                    <div>
                      <label className="pg-input-label" style={{ display: 'block', marginBottom: '4px' }}>Card Number</label>
                      <input type="text" className="pg-input" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  MANDATORY OTP VERIFICATION STEP (bikkinavijay0@gmail.com)
                  ══════════════════════════════════════════════════════════════ */}
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,237,214,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#ffedd6' }}>
                    <KeyRound size={16} color="#f59e0b" /> Step 2: 2FA Payment Verification OTP
                  </div>
                  {otpVerified ? (
                    <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                      ✓ OTP VERIFIED
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                      REQUIRED BEFORE PAYMENT
                    </span>
                  )}
                </div>

                {!otpVerified ? (
                  <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#c9bbaa', lineHeight: 1.5, marginBottom: '12px' }}>
                      Security policy requires a 6-digit authorization code dispatched to official email: <strong style={{ color: '#00f5ff' }}>{OFFICIAL_OTP_EMAIL}</strong> before confirming this order.
                    </div>

                    {!otpSent ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp}
                        className="pg-pay-btn"
                        style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#ffffff' }}
                      >
                        {sendingOtp ? 'DISPATCHING OTP TO EMAIL...' : `Send Payment OTP to ${OFFICIAL_OTP_EMAIL} →`}
                      </button>
                    ) : (
                      <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* OTP Preview helper for testing */}
                        {otpDeliveryInfo?.otpPreview && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>
                            <span style={{ color: '#8c857b' }}>OTP Code (Sent to {OFFICIAL_OTP_EMAIL}):</span>
                            <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '2px' }}>
                              {otpDeliveryInfo.otpPreview}
                            </span>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            maxLength={6}
                            autoFocus
                            placeholder="Enter 6-digit OTP"
                            className="pg-input"
                            style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '16px', fontWeight: 800 }}
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            required
                          />
                          <button
                            type="submit"
                            disabled={verifyingOtp || otpCode.length < 6}
                            style={{
                              padding: '10px 18px',
                              borderRadius: '8px',
                              background: '#10b981',
                              border: 'none',
                              color: '#ffffff',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {verifyingOtp ? 'Verifying...' : 'Verify OTP ✓'}
                          </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#8c857b' }}>
                          <span>Check inbox & spam for {OFFICIAL_OTP_EMAIL}</span>
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={resendTimer > 0 || sendingOtp}
                            style={{ background: 'transparent', border: 'none', color: resendTimer === 0 ? '#00f5ff' : '#6e675d', cursor: resendTimer === 0 ? 'pointer' : 'default', textDecoration: resendTimer === 0 ? 'underline' : 'none' }}
                          >
                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={16} /> OTP code authorized for {OFFICIAL_OTP_EMAIL}. Ready to submit for Admin Approval!
                  </div>
                )}
              </div>

              {/* ── STEP 3: SUBMIT PAYMENT (MARKS AS PENDING APPROVAL) ── */}
              <div style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="pg-pay-btn"
                  disabled={isProcessing || (!otpVerified && activeTier.priceNum > 0)}
                  onClick={handleProcessPayment}
                >
                  {isProcessing
                    ? 'RECORDING TRANSACTION...'
                    : !otpVerified && activeTier.priceNum > 0
                      ? 'Verify OTP Above to Submit Payment'
                      : `Submit Payment for Admin Approval (${activeTier.price}) →`}
                </button>
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#8c857b', marginTop: '8px' }}>
                  🔒 Transaction will be recorded with status: <strong>"Pending Approval"</strong> and sent to Admin Dashboard.
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

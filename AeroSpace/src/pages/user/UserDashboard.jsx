import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Radio, Activity, Wifi, Cpu, LogOut, User, ChevronDown, Bell, Settings,
  FileText, Download, BarChart2, RefreshCw, CheckCircle, Sliders, MapPin,
  Gauge, Plus, Rocket, Shield, ShieldCheck, AlertTriangle, CreditCard, Check,
  QrCode, Smartphone, Building2, Wallet, Copy, Receipt, ExternalLink, Sparkles,
  Lock, Key, Mail, Globe, Palette, FileSpreadsheet
} from 'lucide-react';
import './UserDashboard.css';
import { PLAN_CONFIG as PLAN_MAP } from '../../config/plans';
import { useMissionControl } from '../../components/AuthenticatedLayout';
import { THEMES, DEFAULT_THEME_ID } from '../../config/themes';
import EmailChangeModal from '../../components/EmailChangeModal';
import PasswordChangeModal from '../../components/PasswordChangeModal';
import DataSheetModal from '../../components/DataSheetModal';

export default function UserDashboard() {
  const navigate = useNavigate();
  const missionControl = useMissionControl();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aerospec_user') || '{}');
    } catch {
      return {};
    }
  });

  // Navigation Tabs: 'dashboard' | 'missions' | 'subscription' | 'telemetry' | 'reports' | 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profileOpen, setProfileOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  // Security & Mission Control Modals
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [dataSheetModalOpen, setDataSheetModalOpen] = useState(false);

  // Active theme and satellite identity from Mission Control
  const activeThemeId = missionControl?.themeId || user.theme || DEFAULT_THEME_ID;
  const activeTheme = THEMES[activeThemeId] || THEMES[DEFAULT_THEME_ID];
  const satIdentity = missionControl?.satellite || {
    callsign: 'AEROSPEC-SAT-042',
    noradId: 'NORAD-59142',
    orbitType: 'Low Earth Orbit (LEO)',
    altitudeKm: 540,
    inclinationDeg: 53.2,
    velocityKmS: 7.62,
    uplinkFreq: '440.920 MHz',
    status: 'OPTIMAL LOCK'
  };

  const handleSetTheme = (newThemeId) => {
    if (missionControl?.setThemeId) {
      missionControl.setThemeId(newThemeId);
    }
  };

  // SaaS Data
  const [tenant, setTenant] = useState(null);
  const [pods, setPods] = useState([]);
  const [selectedPodId, setSelectedPodId] = useState('pod_01');
  const [podHistory, setPodHistory] = useState([]);
  const [missions, setMissions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & User Action State
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [missionModalOpen, setMissionModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);

  // Multi-Gateway Payment State
  const [paymentMethod, setPaymentMethod] = useState('UPI_QR'); // 'UPI_QR' | 'UPI_ID' | 'CARD' | 'NETBANKING' | 'WALLET'
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [userVpa, setUserVpa] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Paytm');
  const [utrInput, setUtrInput] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [qrExpiry, setQrExpiry] = useState(600); // 10 minutes

  // Card Form State
  const [cardHolder, setCardHolder] = useState(user.name || 'Flight Operator');
  const [cardNumber, setCardNumber] = useState('4532 8912 0491 8821');
  const [cardExp, setCardExp] = useState('09/29');
  const [cardCvv, setCardCvv] = useState('491');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const [newPodData, setNewPodData] = useState({ callsign: '', model: 'AEROSPEC Pro', frequencyMHz: '444.250' });
  const [newMissionData, setNewMissionData] = useState({ title: '', targetOrbit: 'Low Earth Orbit (LEO) - 450 km' });
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Settings local state
  const [refreshInterval, setRefreshInterval] = useState('2s');
  const [contrastMode, setContrastMode] = useState('high');

  const handleLogout = () => {
    localStorage.removeItem('aerospec_user');
    navigate('/login');
  };

  useEffect(() => {
    fetchSaaSData();
  }, []);

  useEffect(() => {
    if (selectedPodId) {
      fetchPodHistory(selectedPodId);
    }
  }, [selectedPodId]);

  // QR Expiry countdown timer
  useEffect(() => {
    let timer;
    if (checkoutModalOpen && qrExpiry > 0 && !receiptData) {
      timer = setInterval(() => {
        setQrExpiry(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [checkoutModalOpen, qrExpiry, receiptData]);

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText('9866606967@superyes');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const fetchSaaSData = async () => {
    setLoading(true);
    try {
      const fetchPromises = [
        fetch('/api/saas/tenant'),
        fetch('/api/saas/pods'),
        fetch('/api/saas/missions'),
        fetch('/api/user/reports')
      ];

      if (user.email) {
        fetchPromises.push(fetch(`/api/auth/me?email=${encodeURIComponent(user.email)}`));
      }

      const results = await Promise.all(fetchPromises);
      const [tRes, pRes, mRes, rRes, uRes] = results;

      if (tRes && tRes.ok) {
        const tData = await tRes.json();
        if (tData.success) setTenant(tData.data);
      }
      if (pRes && pRes.ok) {
        const pData = await pRes.json();
        if (pData.success && pData.data.length > 0) {
          setPods(pData.data);
          if (!selectedPodId) setSelectedPodId(pData.data[0].id);
        }
      }
      if (mRes && mRes.ok) {
        const mData = await mRes.json();
        if (mData.success) setMissions(mData.data);
      }
      if (rRes && rRes.ok) {
        const rData = await rRes.json();
        if (rData.success) setReports(rData.data);
      }
      if (uRes && uRes.ok) {
        const uData = await uRes.json();
        if (uData.success && uData.user) {
          setUser(uData.user);
          localStorage.setItem('aerospec_user', JSON.stringify(uData.user));
        }
      }
    } catch (err) {
      console.warn('Backend API offline, using fallback state:', err);
      // Default fallback
      setTenant(prev => prev || {
        name: user.organization || 'Apex Orbital Systems',
        planTier: user.planTier || 'cadet',
        planDetails: PLAN_MAP[user.planTier || 'cadet'] || PLAN_MAP.cadet,
        currentUsage: { activePods: 2, maxPods: 2, quotaPct: 100 }
      });
      setPods([
        {
          id: 'pod_01',
          callsign: 'AERO-POD-09',
          model: 'AEROSPEC Pro',
          status: 'ONLINE',
          frequencyMHz: 440.920,
          gainDBm: 18.5,
          batteryPct: 94,
          rssiDBm: -62,
          snrDB: 18.4,
          altitudeFt: 12450,
          speedKmh: 480,
          latitude: 28.6139,
          longitude: 77.2090,
          temperatureC: 22.4,
          uptime: '14h 32m'
        },
        {
          id: 'pod_02',
          callsign: 'PHOENIX-X1',
          model: 'AEROSPEC Pro Max',
          status: 'TRANSMITTING',
          frequencyMHz: 442.150,
          gainDBm: 21.0,
          batteryPct: 88,
          rssiDBm: -54,
          snrDB: 22.1,
          altitudeFt: 28900,
          speedKmh: 820,
          latitude: 19.0760,
          longitude: 72.8777,
          temperatureC: -14.2,
          uptime: '42h 10m'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPodHistory = async (podId) => {
    try {
      const res = await fetch(`/api/saas/pods/${podId}/history`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setPodHistory(data.data);
      }
    } catch (err) {
      setPodHistory([
        { id: '1', time: '17:20', altitudeFt: 10200, speedKmh: 420, rssiDBm: -68 },
        { id: '2', time: '17:25', altitudeFt: 11100, speedKmh: 450, rssiDBm: -65 },
        { id: '3', time: '17:30', altitudeFt: 11800, speedKmh: 470, rssiDBm: -64 },
        { id: '4', time: '17:35', altitudeFt: 12200, speedKmh: 480, rssiDBm: -63 },
        { id: '5', time: '17:40', altitudeFt: 12450, speedKmh: 480, rssiDBm: -62 }
      ]);
    }
  };

  const handleOpenCheckout = (planKey, planName, planPrice) => {
    navigate(`/payment?plan=${planKey}`);
  };

  const handleConfirmSubscription = async (overrideMethod = null) => {
    setPaymentProcessing(true);
    const activeGateway = overrideMethod || paymentMethod;
    const finalUtr = utrInput.trim() || `${Math.floor(400000000000 + Math.random() * 500000000000)}`;

    try {
      const res = await fetch('/api/user/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id || 'usr_current',
          planTier: selectedPlanForCheckout.id,
          billingDetails: {
            gateway: activeGateway,
            upiId: '9866606967@superyes',
            utr: finalUtr,
            vpa: userVpa || 'operator@superyes',
            bank: selectedBank,
            cardHolder,
            last4: cardNumber.slice(-4)
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Payment authorization failed');
      }

      setReceiptData(data.data?.receipt || {
        orderId: `ORD_${Date.now()}`,
        transactionId: `TXN_${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        utr: finalUtr,
        gateway: activeGateway,
        upiId: '9866606967@superyes',
        amount: selectedPlanForCheckout.price,
        planName: selectedPlanForCheckout.name,
        timestamp: new Date().toISOString(),
        status: 'PAID & ACTIVATED'
      });

      setActionMsg(`🎉 Payment verified! Subscribed to ${selectedPlanForCheckout.name} (${selectedPlanForCheckout.price}).`);
      const updatedUser = { ...user, planTier: selectedPlanForCheckout.id };
      setUser(updatedUser);
      localStorage.setItem('aerospec_user', JSON.stringify(updatedUser));
      fetchSaaSData();
    } catch (err) {
      // Fallback local upgrade
      const updatedUser = { ...user, planTier: selectedPlanForCheckout.id };
      setUser(updatedUser);
      localStorage.setItem('aerospec_user', JSON.stringify(updatedUser));
      if (tenant) {
        setTenant(prev => ({
          ...prev,
          planTier: selectedPlanForCheckout.id,
          planDetails: { ...prev.planDetails, name: selectedPlanForCheckout.name, price: selectedPlanForCheckout.price }
        }));
      }
      setReceiptData({
        orderId: `ORD_${Date.now()}`,
        transactionId: `TXN_${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        utr: finalUtr,
        gateway: activeGateway,
        upiId: '9866606967@superyes',
        amount: selectedPlanForCheckout.price,
        planName: selectedPlanForCheckout.name,
        timestamp: new Date().toISOString(),
        status: 'PAID & ACTIVATED'
      });
      setActionMsg(`🎉 Subscribed to ${selectedPlanForCheckout.name}!`);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleProvisionPod = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch('/api/saas/pods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPodData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to provision pod');
      }

      setActionMsg(`Telemetry Pod ${data.data.callsign} successfully added to fleet.`);
      setProvisionModalOpen(false);
      setNewPodData({ callsign: '', model: 'AEROSPEC Pro', frequencyMHz: '444.250' });
      fetchSaaSData();
      setSelectedPodId(data.data.id);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleScheduleMission = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/saas/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMissionData.title,
          targetOrbit: newMissionData.targetOrbit,
          assignedPods: [selectedPodId],
          leadOperator: user.name || 'Operator Vijay'
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`Mission ${data.data.code} scheduled.`);
        setMissionModalOpen(false);
        setNewMissionData({ title: '', targetOrbit: 'Low Earth Orbit (LEO) - 450 km' });
        fetchSaaSData();
      }
    } catch (err) {
      setErrorMsg('Failed to schedule mission');
    }
  };

  const handleUpdateMissionStatus = async (missionId, nextStatus, nextPct) => {
    try {
      const res = await fetch(`/api/saas/missions/${missionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, progressPct: nextPct })
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`Mission status updated to ${nextStatus}.`);
        fetchSaaSData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activePod = pods.find(p => p.id === selectedPodId) || pods[0] || {};

  // Resolved dynamic active plan & organization parameters
  const activePlanTier = user.planTier || tenant?.planTier || 'cadet';
  const activePlanDetails = PLAN_MAP[activePlanTier] || tenant?.planDetails || PLAN_MAP.cadet;
  const orgName = user.organization || user.orgName || tenant?.name || `${user.name || 'Flight'}'s Aerospace Unit`;
  const hardwareApiKey = user.apiKey || (user.id ? `aero_live_${user.id.replace('usr_', '')}_${(user.name || 'operator').toLowerCase().replace(/[^a-z0-9]/g, '')}` : 'aero_live_telemetry_key');

  const metrics = [
    { label: 'Signal RSSI', value: `${activePod.rssiDBm || -62} dBm`, color: '#00f5ff', icon: <Wifi size={20} /> },
    { label: 'Frequency', value: `${activePod.frequencyMHz || 440.920} MHz`, color: '#10b981', icon: <Activity size={20} /> },
    { label: 'Battery Level', value: `${activePod.batteryPct || 94}%`, color: '#34d399', icon: <Cpu size={20} /> },
    { label: 'SNR Signal Ratio', value: `${activePod.snrDB || 18.4} dB`, color: '#a855f7', icon: <Radio size={20} /> },
  ];

  return (
    <div className="ud-root">

      {/* ══════════════ TOP BAR ══════════════ */}
      <header className="ud-topbar">
        <div className="ud-topbar-left">
          <div className="ud-logo-wrap" onClick={() => navigate('/')}>
            <div className="ud-logo-icon">
              <Radio size={16} />
            </div>
            <span className="ud-logo-text">AEROSPEC</span>
            <span className="ud-badge">OPERATOR PORTAL</span>
          </div>

          <div className="ud-tenant-chip" title="Organization & Active Subscription Plan">
            <span>{orgName}</span>
            <span className="ud-plan-badge">{activePlanDetails.name}</span>
          </div>

          {/* Nav links */}
          <nav className="ud-nav-links" style={{ marginLeft: '16px' }}>
            <button
              className={`ud-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`ud-nav-link ${activeTab === 'missions' ? 'active' : ''}`}
              onClick={() => setActiveTab('missions')}
            >
              Missions ({missions.length})
            </button>
            <button
              className={`ud-nav-link ${activeTab === 'subscription' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscription')}
              title="Open Aerospace Subscription Plans"
            >
              Subscription
            </button>
            <button
              className={`ud-nav-link ${activeTab === 'telemetry' ? 'active' : ''}`}
              onClick={() => setActiveTab('telemetry')}
            >
              RF Analyzer
            </button>
            <button
              className={`ud-nav-link ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Reports ({reports.length})
            </button>
            <button
              className={`ud-nav-link ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="ud-topbar-right">
          <div className="ud-live-pill">
            <span className="ud-live-dot" />
            LIVE TELEMETRY
          </div>

          {/* Theme Switcher Quick Menu */}
          <div style={{ position: 'relative' }}>
            <button
              className="ud-icon-btn"
              title="Mission Control Space Theme"
              onClick={() => setThemePickerOpen(!themePickerOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                width: 'auto',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--hud-border-glow, rgba(0, 245, 255, 0.3))',
                borderRadius: '8px'
              }}
            >
              <Palette size={13} color="var(--hud-accent, #00f5ff)" />
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--hud-accent, #00f5ff)', fontWeight: 700 }}>
                {activeTheme.name}
              </span>
              <ChevronDown size={11} color="var(--hud-accent, #00f5ff)" />
            </button>

            {themePickerOpen && (
              <div
                className="ud-dropdown"
                style={{ right: 0, top: '44px', width: '240px', zIndex: 120 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="ud-dropdown-header">
                  <span className="ud-dropdown-name">Mission Control Themes</span>
                  <span className="ud-dropdown-email">Continuous Space Environment</span>
                </div>
                <div className="ud-dropdown-divider" />
                {Object.values(THEMES).map((t) => (
                  <button
                    key={t.id}
                    className={`ud-dropdown-item ${activeThemeId === t.id ? 'active' : ''}`}
                    onClick={() => { handleSetTheme(t.id); setThemePickerOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.accent, boxShadow: `0 0 6px ${t.accent}` }} />
                      <span style={{ color: activeThemeId === t.id ? t.accent : '#ffedd6', fontWeight: activeThemeId === t.id ? 700 : 400 }}>
                        {t.name}
                      </span>
                    </div>
                    {activeThemeId === t.id && <Check size={13} color={t.accent} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Data Sheet Export */}
          <button
            className="ud-icon-btn"
            title="Download Sanitized Mission Telemetry Data Sheet"
            onClick={() => setDataSheetModalOpen(true)}
            style={{ border: '1px solid rgba(0, 245, 255, 0.3)', color: '#00f5ff' }}
          >
            <Download size={14} />
          </button>

          <button className="ud-icon-btn" title="Refresh Data" onClick={fetchSaaSData} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>

          {/* Profile Dropdown */}
          <div className="ud-profile-wrap">
            <button className="ud-profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
              <div className="ud-avatar">
                <User size={14} />
              </div>
              <span className="ud-username">{user.name?.split(' ')[0] || 'Operator'}</span>
              <ChevronDown size={14} className={`ud-chevron ${profileOpen ? 'open' : ''}`} />
            </button>

            {profileOpen && (
              <div className="ud-dropdown">
                <div className="ud-dropdown-header">
                  <span className="ud-dropdown-name">{user.name || 'Operator'}</span>
                  <span className="ud-dropdown-email">{user.email || 'user@aerospec.com'}</span>
                </div>
                <div className="ud-dropdown-divider" />
                <button className="ud-dropdown-item" onClick={() => { setDataSheetModalOpen(true); setProfileOpen(false); }}>
                  <FileSpreadsheet size={14} color="#00f5ff" /> Download Data Sheet
                </button>
                <button className="ud-dropdown-item" onClick={() => { setEmailModalOpen(true); setProfileOpen(false); }}>
                  <Mail size={14} color="#38bdf8" /> Change Email (OTP)
                </button>
                <button className="ud-dropdown-item" onClick={() => { setPasswordModalOpen(true); setProfileOpen(false); }}>
                  <Key size={14} color="#f59e0b" /> Change Password (2FA)
                </button>
                <div className="ud-dropdown-divider" />
                <button className="ud-dropdown-item" onClick={() => { navigate('/payment'); setProfileOpen(false); }}>
                  <CreditCard size={14} /> Buy / Upgrade Plan
                </button>
                <button className="ud-dropdown-item" onClick={() => { setActiveTab('settings'); setProfileOpen(false); }}>
                  <Settings size={14} /> Profile & Settings
                </button>
                <div className="ud-dropdown-divider" />
                <button className="ud-dropdown-item danger" onClick={handleLogout}>
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════ BODY ══════════════ */}
      <main className="ud-body">

        {actionMsg && (
          <div style={{ padding: '12px 18px', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#34d399', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>✓ {actionMsg}</span>
            <button onClick={() => setActionMsg('')} style={{ background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: '16px' }}>×</button>
          </div>
        )}

        {/* ── FLEET POD SELECTOR BAR ── */}
        <div className="ud-fleet-bar">
          <span className="ud-fleet-title">FLEET PODS:</span>
          {pods.map(p => (
            <button
              key={p.id}
              className={`ud-fleet-pill ${selectedPodId === p.id ? 'active' : ''}`}
              onClick={() => setSelectedPodId(p.id)}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: p.status === 'ONLINE' ? '#10b981' : p.status === 'TRANSMITTING' ? '#00f5ff' : '#f59e0b' }} />
              <span>{p.callsign}</span>
              <span style={{ fontSize: '10px', opacity: 0.6 }}>[{p.model}]</span>
            </button>
          ))}

          <button className="ud-fleet-add-btn" onClick={() => setProvisionModalOpen(true)}>
            <Plus size={14} /> Provision Pod
          </button>

          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8c857b' }}>
            Fleet Quota: <strong style={{ color: '#00f5ff' }}>{pods.length}</strong> / {activePlanDetails.maxPods || 15} Pods ({activePlanDetails.name})
          </span>
        </div>

        {/* ── TAB 1: DASHBOARD OVERVIEW ── */}
        {activeTab === 'dashboard' && (
          <>
            <div className="ud-welcome-banner">
              <div className="ud-welcome-text">
                <h1 className="ud-greeting">
                  Welcome, <span className="ud-greeting-name">{user.name || 'Operator'}</span>
                </h1>
                <p className="ud-sub">
                  Active Vehicle: <strong>{activePod.callsign}</strong> ({activePod.model}) — Sub-GHz Link Nominal
                </p>
              </div>
              <div className="ud-status-chip">
                <span className="ud-status-dot-green" />
                {activePod.status || 'LINK ACTIVE'}
              </div>
            </div>

            {/* ── PERSONAL SATELLITE TELEMETRY & TARGET LOCK HUD ── */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.06) 0%, rgba(2, 6, 23, 0.8) 100%)',
              border: '1px solid var(--hud-border-glow, rgba(0, 245, 255, 0.3))',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(0, 245, 255, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0, 245, 255, 0.12)', border: '1px solid var(--hud-accent, #00f5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hud-accent, #00f5ff)' }}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffedd6', letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>
                        {satIdentity.callsign}
                      </span>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', border: '1px solid rgba(57, 255, 20, 0.4)', fontWeight: '700', letterSpacing: '1px' }}>
                        TARGET LOCK • {satIdentity.noradId}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c857b', marginTop: '2px' }}>
                      Deterministic 3D Satellite Assigned to <strong style={{ color: 'var(--hud-accent, #00f5ff)' }}>{user.email || 'Flight Operator'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => setDataSheetModalOpen(true)}
                    style={{
                      background: 'rgba(0, 245, 255, 0.1)',
                      border: '1px solid var(--hud-border-glow, rgba(0, 245, 255, 0.4))',
                      color: 'var(--hud-accent, #00f5ff)',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '600'
                    }}
                  >
                    <Download size={13} /> Export Telemetry Sheet
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffedd6',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Sliders size={13} /> Orbit Spec
                  </button>
                </div>
              </div>

              {/* Orbital Telemetry Parameters Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#8c857b', display: 'block' }}>ORBIT REGIME</span>
                  <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{satIdentity.orbitType}</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#8c857b', display: 'block' }}>ALTITUDE</span>
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{satIdentity.altitudeKm} km</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#8c857b', display: 'block' }}>INCLINATION</span>
                  <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{satIdentity.inclinationDeg}°</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#8c857b', display: 'block' }}>ORBITAL VELOCITY</span>
                  <span style={{ fontSize: '12px', color: '#a855f7', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{satIdentity.velocityKmS} km/s</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#8c857b', display: 'block' }}>LASER DATA LINK</span>
                  <span style={{ fontSize: '12px', color: 'var(--hud-accent, #00f5ff)', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{satIdentity.uplinkFreq}</span>
                </div>
              </div>
            </div>

            {/* Metric HUD Cards */}
            <div className="ud-metrics-grid">
              {metrics.map((m) => (
                <div key={m.label} className="ud-metric-card" style={{ '--card-color': m.color }}>
                  <div className="ud-metric-icon" style={{ color: m.color }}>
                    {m.icon}
                  </div>
                  <span className="ud-metric-label">{m.label}</span>
                  <span className="ud-metric-value" style={{ color: m.color }}>{m.value}</span>
                  <div className="ud-metric-glow" style={{ background: m.color }} />
                </div>
              ))}
            </div>

            {/* Live Telemetry Trajectory Chart (SVG) */}
            <div className="ud-chart-panel">
              <div className="ud-chart-header">
                <h3 className="ud-chart-title">
                  <Activity size={18} color="#00f5ff" />
                  Live Telemetry Trajectory — {activePod.callsign}
                </h3>
                <div className="ud-chart-legend">
                  <div className="ud-legend-item">
                    <span className="ud-legend-dot" style={{ background: '#00f5ff' }} />
                    <span style={{ color: '#00f5ff' }}>Altitude (ft)</span>
                  </div>
                  <div className="ud-legend-item">
                    <span className="ud-legend-dot" style={{ background: '#ff5722' }} />
                    <span style={{ color: '#ff5722' }}>Signal RSSI (dBm)</span>
                  </div>
                </div>
              </div>

              <div className="ud-chart-svg-wrap">
                <svg className="ud-chart-svg" viewBox="0 0 800 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#00f5ff" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <line x1="0" y1="50" x2="800" y2="50" stroke="rgba(255,237,214,0.06)" strokeDasharray="4" />
                  <line x1="0" y1="100" x2="800" y2="100" stroke="rgba(255,237,214,0.06)" strokeDasharray="4" />
                  <line x1="0" y1="150" x2="800" y2="150" stroke="rgba(255,237,214,0.06)" strokeDasharray="4" />

                  <polygon
                    points="50,160 200,120 380,85 560,60 750,45 750,180 50,180"
                    fill="url(#cyanGrad)"
                  />
                  <polyline
                    points="50,160 200,120 380,85 560,60 750,45"
                    fill="none"
                    stroke="#00f5ff"
                    strokeWidth="3"
                  />

                  <polyline
                    points="50,140 200,135 380,128 560,125 750,120"
                    fill="none"
                    stroke="#ff5722"
                    strokeWidth="2"
                    strokeDasharray="5"
                  />

                  {[[50, 160], [200, 120], [380, 85], [560, 60], [750, 45]].map(([x, y], idx) => (
                    <circle key={idx} cx={x} cy={y} r="5" fill="#00f5ff" stroke="#020208" strokeWidth="2" />
                  ))}
                </svg>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8c857b' }}>
                <span>17:20 UTC</span>
                <span>17:25 UTC</span>
                <span>17:30 UTC</span>
                <span>17:35 UTC</span>
                <span>17:40 UTC (CURRENT)</span>
              </div>
            </div>

            {/* Hardware Telemetry Parameters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div className="ud-info-card">
                <h3 className="ud-info-title">
                  <Gauge size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Flight Parameters
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>ALTITUDE</span>
                    <strong style={{ fontSize: '1.4rem', color: '#00f5ff' }}>{activePod.altitudeFt?.toLocaleString() || '12,450'} ft</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>SPEED</span>
                    <strong style={{ fontSize: '1.4rem', color: '#39ff14' }}>{activePod.speedKmh || '480'} km/h</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>TEMP</span>
                    <strong style={{ fontSize: '1.4rem', color: '#ff5722' }}>{activePod.temperatureC || '22.4'} °C</strong>
                  </div>
                </div>
              </div>

              <div className="ud-info-card">
                <h3 className="ud-info-title">
                  <MapPin size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> GPS Geo-Coordinates & Uplink
                </h3>
                <p className="ud-info-desc">
                  Latitude: <strong>{activePod.latitude || '28.6139° N'}</strong> | Longitude: <strong>{activePod.longitude || '77.2090° E'}</strong>
                </p>
                <div className="ud-progress-bar" style={{ marginTop: '16px' }}>
                  <div className="ud-progress-fill" style={{ width: '94%' }} />
                </div>
                <span className="ud-progress-label">GPS Fix Signal Confidence: 94% • Active Uptime: {activePod.uptime}</span>
              </div>
            </div>
          </>
        )}

        {/* ── TAB 2: MISSIONS & FLIGHT OPERATIONS ── */}
        {activeTab === 'missions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="ud-welcome-banner" style={{ justifyContent: 'space-between' }}>
              <div>
                <h1 className="ud-greeting">Flight Operations & Orbital Missions</h1>
                <p className="ud-sub">Plan, dispatch, and track orbital and atmospheric flight plans.</p>
              </div>
              <button className="ud-modal-submit" onClick={() => setMissionModalOpen(true)}>
                + Schedule Mission
              </button>
            </div>

            <div className="ud-missions-grid">
              {missions.map(m => (
                <div key={m.id} className="ud-mission-card">
                  <div className="ud-mission-header">
                    <div>
                      <span className="ud-mission-code">{m.code}</span>
                      <h4 className="ud-mission-title">{m.title}</h4>
                    </div>
                    <span className={`ud-mission-status-pill ${m.status === 'ACTIVE_FLIGHT' ? 'status-active-flight' : m.status === 'COMPLETED' ? 'status-completed' : 'status-planning'}`}>
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="ud-mission-meta-row">
                    <span>Target: {m.targetOrbit}</span>
                    <span>Lead: {m.leadOperator}</span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#8c857b', marginBottom: '6px' }}>
                      <span>Mission Progress</span>
                      <span style={{ color: '#00f5ff' }}>{m.progressPct}%</span>
                    </div>
                    <div className="ud-progress-bar">
                      <div className="ud-progress-fill" style={{ width: `${m.progressPct}%` }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    {m.status === 'PLANNING' && (
                      <button
                        className="ud-mission-action-btn"
                        onClick={() => handleUpdateMissionStatus(m.id, 'ACTIVE_FLIGHT', 35)}
                      >
                        Launch Mission Flight →
                      </button>
                    )}
                    {m.status === 'ACTIVE_FLIGHT' && (
                      <button
                        className="ud-mission-action-btn"
                        onClick={() => handleUpdateMissionStatus(m.id, 'COMPLETED', 100)}
                      >
                        Complete Mission Flight ✓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: SUBSCRIPTIONS & PLANS STORE ── */}
        {activeTab === 'subscription' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="ud-welcome-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 className="ud-greeting">Aerospace Telemetry Subscription Plans</h1>
                <p className="ud-sub">Upgrade your mission capacity, unlock extra pods, and expand data retention.</p>
              </div>
              <Link
                to="/payment?plan=orbital_pro"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #00f5ff 0%, #00a3ff 100%)',
                  color: '#050811',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 800,
                  boxShadow: '0 0 16px rgba(0,245,255,0.35)'
                }}
              >
                <CreditCard size={15} /> Open Full Payment Gateway Page →
              </Link>
            </div>

            <div className="ud-plans-grid">
              {Object.values(PLAN_MAP).map(tier => {
                const isCurrent = activePlanTier === tier.id;
                return (
                  <div
                    key={tier.id}
                    className={`ud-plan-card ${tier.featured ? 'featured' : ''} ${isCurrent ? 'active-tier' : ''}`}
                  >
                    {tier.featured && (
                      <div style={{ position: 'absolute', top: '-12px', right: '20px', background: '#ff5722', color: '#fff', fontSize: '10px', fontWeight: '800', letterSpacing: '1px', padding: '3px 10px', borderRadius: '12px' }}>
                        MOST POPULAR
                      </div>
                    )}

                    <div className="ud-plan-header">
                      <div>
                        <h3 className="ud-plan-name">{tier.name}</h3>
                        <div style={{ fontSize: '12px', color: '#8c857b' }}>{tier.desc}</div>
                      </div>
                      <span className="ud-plan-price" style={{ color: tier.themeColor || '#00f5ff' }}>
                        {tier.price.split('/')[0]}
                        <span style={{ fontSize: '14px', color: '#8c857b' }}>/{tier.billingPeriod === 'month' ? 'mo' : tier.billingPeriod}</span>
                      </span>
                    </div>

                    <ul className="ud-plan-features">
                      {tier.features.map((f, fIdx) => (
                        <li key={fIdx} className="ud-plan-feature-item">
                          <Check size={14} color="#10b981" /> {f}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <div
                        className="ud-plan-current-btn"
                        style={{
                          borderColor: tier.themeColor || '#00f5ff',
                          color: tier.themeColor || '#00f5ff',
                          background: `${tier.themeColor || '#00f5ff'}18`
                        }}
                      >
                        ✓ CURRENT ACTIVE PLAN
                      </div>
                    ) : (
                      <button
                        className="ud-plan-buy-btn"
                        style={tier.id === 'interstellar_max' ? { background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' } : {}}
                        onClick={() => handleOpenCheckout(tier.id, tier.name, tier.price)}
                      >
                        {tier.id === 'cadet' ? 'Switch to Basic Cadet' : `Upgrade to ${tier.name} →`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 4: RF ANALYZER VIEW ── */}
        {activeTab === 'telemetry' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="ud-welcome-banner">
              <div>
                <h1 className="ud-greeting">RF Transceiver & Signal Analyzer</h1>
                <p className="ud-sub">Diagnostic spectrum for pod {activePod.callsign} ({activePod.frequencyMHz} MHz).</p>
              </div>
            </div>

            <div className="ud-info-card">
              <h3 className="ud-info-title">
                <BarChart2 size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Real-Time Signal Spectral Density
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '6px', margin: '20px 0', padding: '16px', background: '#0a0f1d', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                {[40, 65, 80, 45, 90, 75, 55, 85, 95, 60, 70, 88, 50, 68, 82, 92, 45, 78, 86, 62, 74].map((h, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      background: idx % 3 === 0 ? '#00f5ff' : idx % 3 === 1 ? '#10b981' : '#ff5722',
                      borderRadius: '3px',
                      opacity: 0.85
                    }}
                  />
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>TRANSMIT GAIN</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00f5ff' }}>+{activePod.gainDBm || 18.5} dBm</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>CIPHER SCHEME</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#39ff14' }}>{activePod.encryption || 'AES-256-GCM'}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>HARDWARE TIER</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f59e0b' }}>{activePod.model || 'AEROSPEC Pro'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: REPORTS VIEW ── */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="ud-welcome-banner">
              <div>
                <h1 className="ud-greeting">Telemetry Reports & Archive</h1>
                <p className="ud-sub">Download verified RF transmission logs and hardware diagnostics.</p>
              </div>
            </div>

            <div className="ud-info-card">
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#f8fafc', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#00f5ff' }}>
                    <th style={{ padding: '12px' }}>REPORT ID</th>
                    <th style={{ padding: '12px' }}>TITLE</th>
                    <th style={{ padding: '12px' }}>TYPE</th>
                    <th style={{ padding: '12px' }}>DATE</th>
                    <th style={{ padding: '12px' }}>FILE SIZE</th>
                    <th style={{ padding: '12px' }}>STATUS</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#38bdf8' }}>{r.id}</td>
                      <td style={{ padding: '12px' }}>{r.title}</td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{r.type}</td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{r.date}</td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{r.size}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(57, 255, 20, 0.15)', color: '#39ff14', fontSize: '12px', border: '1px solid rgba(57, 255, 20, 0.3)' }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button 
                          onClick={() => alert(`Downloading telemetry package for ${r.id}...`)}
                          style={{ padding: '6px 12px', background: 'rgba(0, 245, 255, 0.1)', border: '1px solid #00f5ff', color: '#00f5ff', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                        >
                          <Download size={14} /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 6: SETTINGS VIEW ── */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="ud-welcome-banner">
              <div>
                <h1 className="ud-greeting">Operator Profile, Security & Mission Control</h1>
                <p className="ud-sub">Manage 2FA credentials, data sheets, persistent themes, and deterministic satellite nodes.</p>
              </div>
            </div>

            {/* 1. Organization & Active Subscription Plan */}
            <div className="ud-info-card">
              <h3 className="ud-info-title"><Sliders size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Organization & Plan</h3>
              <div style={{ marginTop: '14px', padding: '16px', background: 'rgba(0, 245, 255, 0.04)', border: '1px solid var(--hud-border-glow, rgba(0, 245, 255, 0.2))', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <strong style={{ color: '#ffedd6', fontSize: '16px' }}>{orgName}</strong>
                    <div style={{ fontSize: '12px', color: '#8c857b', marginTop: '4px' }}>
                      Active Plan: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{activePlanDetails.name}</span> ({activePlanDetails.price})
                    </div>
                  </div>
                  <button className="ud-fleet-add-btn" onClick={() => setActiveTab('subscription')}>
                    Manage / Upgrade Plan →
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Account Security & Two-Factor Authentication (OTP / 2FA) */}
            <div className="ud-info-card">
              <h3 className="ud-info-title">
                <ShieldCheck size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#10b981' }} /> Account Credentials & Two-Factor Authentication
              </h3>
              <p className="ud-info-desc" style={{ marginBottom: '16px' }}>
                All credential modifications require verified email OTP tokens dispatched via secure aerospace relay.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Email Address Panel */}
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} color="#38bdf8" />
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>OPERATOR EMAIL ADDRESS</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#ffedd6', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {user.email || 'operator@aerospec.com'}
                  </div>
                  <button
                    onClick={() => setEmailModalOpen(true)}
                    style={{
                      marginTop: 'auto',
                      padding: '8px 14px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Mail size={14} /> Change Email (OTP Verified) →
                  </button>
                </div>

                {/* Password & 2FA Panel */}
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Key size={16} color="#f59e0b" />
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>SECURITY CREDENTIALS</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#ffedd6', fontFamily: 'var(--font-mono)' }}>
                    •••••••••••• <span style={{ fontSize: '11px', color: '#10b981', marginLeft: '6px' }}>(2FA Protected)</span>
                  </div>
                  <button
                    onClick={() => setPasswordModalOpen(true)}
                    style={{
                      marginTop: 'auto',
                      padding: '8px 14px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid #f59e0b',
                      color: '#f59e0b',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Lock size={14} /> Change Password (2FA Protected) →
                  </button>
                </div>
              </div>

              {/* Hardware Uplink Key */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>HARDWARE UPLINK API KEY:</span>
                  <code style={{ color: '#00f5ff', background: 'rgba(0,245,255,0.08)', padding: '4px 10px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                    {hardwareApiKey}
                  </code>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(hardwareApiKey);
                    setActionMsg('Hardware Uplink API Key copied to clipboard.');
                  }}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffedd6', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Copy size={13} /> Copy Key
                </button>
              </div>
            </div>

            {/* 3. Mission Telemetry Data Sheet Exporter */}
            <div className="ud-info-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 className="ud-info-title">
                    <FileSpreadsheet size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#00f5ff' }} /> Mission Telemetry Data Sheet Exporter
                  </h3>
                  <p className="ud-info-desc">
                    Download sanitized mission specifications, telemetry logs, and orbital parameters as JSON or CSV packages.
                  </p>
                </div>
                <button
                  onClick={() => setDataSheetModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #00f5ff 0%, #0284c7 100%)',
                    border: 'none',
                    color: '#020208',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Download size={15} /> Download Data Sheet Package →
                </button>
              </div>
            </div>

            {/* 4. Mission Control Aesthetic Theme Engine */}
            <div className="ud-info-card">
              <h3 className="ud-info-title">
                <Palette size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: activeTheme.accent }} /> Mission Control HUD Theme Engine
              </h3>
              <p className="ud-info-desc" style={{ marginBottom: '16px' }}>
                Select an aerospace colorway to instantly customize the 3D space environment, orbits, Earth shader, and HUD interface.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {Object.values(THEMES).map((t) => {
                  const isSelected = activeThemeId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSetTheme(t.id)}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1.5px solid ${isSelected ? t.accent : 'rgba(255, 255, 255, 0.08)'}`,
                        boxShadow: isSelected ? `0 0 16px ${t.glow}` : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: isSelected ? t.accent : '#ffedd6', fontSize: '14px' }}>{t.name}</strong>
                        {isSelected && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: `${t.accent}22`, color: t.accent, border: `1px solid ${t.accent}66`, fontWeight: 700 }}>
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '11px', color: '#8c857b' }}>{t.tagline}</div>

                      {/* Swatch palette */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: t.accent, border: '1px solid rgba(255,255,255,0.2)' }} title="Primary Accent" />
                        <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: t.secondary, border: '1px solid rgba(255,255,255,0.2)' }} title="Secondary Highlight" />
                        <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: t.bg, border: '1px solid rgba(255,255,255,0.2)' }} title="Cosmic Background" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Deterministic Assigned Satellite Node Telemetry */}
            <div className="ud-info-card">
              <h3 className="ud-info-title">
                <Sparkles size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#00f5ff' }} /> Cryptographic Satellite Assignment Specification
              </h3>
              <p className="ud-info-desc" style={{ marginBottom: '14px' }}>
                Your account is bound to a persistent 3D orbital node rendered continuously across all mission-control views.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#8c857b', display: 'block' }}>SATELLITE CALLSIGN</span>
                  <span style={{ fontSize: '13px', color: '#00f5ff', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{satIdentity.callsign}</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#8c857b', display: 'block' }}>NORAD CATALOG ID</span>
                  <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{satIdentity.noradId}</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#8c857b', display: 'block' }}>ORBITAL INCLINATION</span>
                  <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{satIdentity.inclinationDeg}° (LEO)</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#8c857b', display: 'block' }}>ORBIT VELOCITY</span>
                  <span style={{ fontSize: '13px', color: '#a855f7', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{satIdentity.velocityKmS} km/s</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ══════════════ MODAL: MULTI-GATEWAY PAYMENT CHECKOUT (UPI 9866606967@superyes) ══════════════ */}
      {checkoutModalOpen && selectedPlanForCheckout && (
        <div className="ud-modal-backdrop" onClick={() => setCheckoutModalOpen(false)}>
          <div className="ud-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            
            {/* ── CASE A: PAYMENT RECEIPT / INVOICE ── */}
            {receiptData ? (
              <div className="ud-receipt-box">
                <div style={{ textAlign: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(16,185,129,0.3)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#10b981', marginBottom: '8px' }}>
                    <CheckCircle size={28} />
                  </div>
                  <h3 style={{ margin: 0, color: '#ffedd6', fontSize: '20px', fontFamily: 'var(--font-serif)' }}>Payment Verified & Activated!</h3>
                  <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>
                    Official Aerospace Mission Order Confirmed
                  </div>
                </div>

                <div className="ud-receipt-row">
                  <span className="ud-receipt-label">Order Reference:</span>
                  <span className="ud-receipt-val">{receiptData.orderId}</span>
                </div>
                <div className="ud-receipt-row">
                  <span className="ud-receipt-label">Gateway Payment ID:</span>
                  <span className="ud-receipt-val" style={{ color: '#00f5ff' }}>{receiptData.upiId}</span>
                </div>
                <div className="ud-receipt-row">
                  <span className="ud-receipt-label">Bank Ref / UTR:</span>
                  <span className="ud-receipt-val">{receiptData.utr}</span>
                </div>
                <div className="ud-receipt-row">
                  <span className="ud-receipt-label">Activated Plan Tier:</span>
                  <span className="ud-receipt-val" style={{ color: '#f59e0b' }}>{receiptData.planName}</span>
                </div>
                <div className="ud-receipt-row">
                  <span className="ud-receipt-label">Amount Paid:</span>
                  <span className="ud-receipt-val" style={{ fontSize: '16px', color: '#10b981' }}>{receiptData.amount}</span>
                </div>
                <div className="ud-receipt-row">
                  <span className="ud-receipt-label">Timestamp:</span>
                  <span className="ud-receipt-val" style={{ fontSize: '11px' }}>{new Date().toLocaleString('en-IN')}</span>
                </div>

                <div className="ud-modal-actions" style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="ud-modal-cancel"
                    onClick={() => window.print()}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Download size={14} /> Print Receipt
                  </button>
                  <button
                    type="button"
                    className="ud-modal-submit"
                    onClick={() => setCheckoutModalOpen(false)}
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                  >
                    Enter Mission Cockpit →
                  </button>
                </div>
              </div>
            ) : (
              /* ── CASE B: MULTI-GATEWAY CHECKOUT ── */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="ud-modal-title" style={{ margin: 0 }}>
                    <ShieldCheck size={20} color="#00f5ff" /> AeroSpace Mission Gateway
                  </h3>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.25)' }}>
                    Session: {Math.floor(qrExpiry / 60)}:{qrExpiry % 60 < 10 ? '0' : ''}{qrExpiry % 60}
                  </div>
                </div>

                {/* Plan Summary Bar */}
                <div style={{ background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.25)', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 10px' }}>
                  <div>
                    <span style={{ color: '#ffedd6', fontWeight: 'bold' }}>{selectedPlanForCheckout.name}</span>
                    <div style={{ fontSize: '11px', color: '#8c857b' }}>Monthly Flight Constellation Access</div>
                  </div>
                  <span style={{ fontSize: '22px', fontWeight: '800', color: '#00f5ff', fontFamily: 'var(--font-mono)' }}>
                    {selectedPlanForCheckout.price}
                  </span>
                </div>

                {/* Multi-Gateway Tabs */}
                <div className="ud-payment-tabs">
                  <button
                    type="button"
                    className={`ud-payment-tab-btn ${paymentMethod === 'UPI_QR' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('UPI_QR')}
                  >
                    <QrCode size={13} /> UPI QR Scanner
                  </button>
                  <button
                    type="button"
                    className={`ud-payment-tab-btn ${paymentMethod === 'UPI_ID' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('UPI_ID')}
                  >
                    <Smartphone size={13} /> UPI ID / VPA
                  </button>
                  <button
                    type="button"
                    className={`ud-payment-tab-btn ${paymentMethod === 'CARD' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('CARD')}
                  >
                    <CreditCard size={13} /> Cards (RuPay/Visa)
                  </button>
                  <button
                    type="button"
                    className={`ud-payment-tab-btn ${paymentMethod === 'NETBANKING' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('NETBANKING')}
                  >
                    <Building2 size={13} /> Net Banking
                  </button>
                  <button
                    type="button"
                    className={`ud-payment-tab-btn ${paymentMethod === 'WALLET' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('WALLET')}
                  >
                    <Wallet size={13} /> Wallets
                  </button>
                </div>

                {/* ── METHOD 1: REAL UPI QR SCANNER (9866606967@superyes) ── */}
                {paymentMethod === 'UPI_QR' && (
                  <div className="ud-qr-wrapper">
                    {/* Scanner Frame */}
                    <div className="ud-qr-scanner-frame">
                      <div className="ud-qr-scanner-corner ud-qr-tl" />
                      <div className="ud-qr-scanner-corner ud-qr-tr" />
                      <div className="ud-qr-scanner-corner ud-qr-bl" />
                      <div className="ud-qr-scanner-corner ud-qr-br" />

                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(
                          `upi://pay?pa=9866606967@superyes&pn=AeroSpace%20Systems&am=${
                            selectedPlanForCheckout.price.replace(/\D/g, '') || 0
                          }&cu=INR&tn=AeroSpace%20${encodeURIComponent(selectedPlanForCheckout.name)}%20Subscription`
                        )}`}
                        alt="AeroSpace UPI Payment QR Scanner"
                        className="ud-qr-img"
                      />
                    </div>

                    {/* Official UPI ID with Copy action */}
                    <div className="ud-upi-id-pill">
                      <div>
                        <span style={{ fontSize: '10px', color: '#8c857b', display: 'block' }}>OFFICIAL PAYMENT ID:</span>
                        <strong style={{ color: '#00f5ff' }}>9866606967@superyes</strong>
                      </div>
                      <button type="button" className="ud-upi-copy-btn" onClick={handleCopyUpi}>
                        {copiedUpi ? <Check size={12} /> : <Copy size={12} />}
                        {copiedUpi ? 'Copied!' : 'Copy UPI ID'}
                      </button>
                    </div>

                    {/* Supported Apps Badges */}
                    <div className="ud-upi-apps-row">
                      <span className="ud-upi-app-badge">Google Pay</span>
                      <span className="ud-upi-app-badge">PhonePe</span>
                      <span className="ud-upi-app-badge">Paytm</span>
                      <span className="ud-upi-app-badge">BHIM</span>
                      <span className="ud-upi-app-badge" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>super.money</span>
                      <span className="ud-upi-app-badge">CRED</span>
                    </div>

                    {/* UTR Input & Submit */}
                    <div style={{ width: '100%', marginTop: '8px' }}>
                      <div className="ud-modal-field">
                        <label className="ud-modal-label">12-Digit UPI Ref / UTR Number (From Your UPI App)</label>
                        <input
                          type="text"
                          maxLength={12}
                          placeholder="e.g. 428190382910 (Or leave blank to auto-generate)"
                          className="ud-modal-input"
                          value={utrInput}
                          onChange={e => setUtrInput(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>

                      <div className="ud-modal-actions" style={{ marginTop: '12px' }}>
                        <button type="button" className="ud-modal-cancel" onClick={() => setCheckoutModalOpen(false)}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="ud-modal-submit"
                          disabled={paymentProcessing}
                          onClick={() => handleConfirmSubscription('UPI_SCAN')}
                        >
                          {paymentProcessing ? 'VERIFYING NPCI TRANSACTION...' : `I Have Paid (${selectedPlanForCheckout.price}) →`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── METHOD 2: DIRECT UPI ID / VPA ── */}
                {paymentMethod === 'UPI_ID' && (
                  <form onSubmit={e => { e.preventDefault(); handleConfirmSubscription('UPI_COLLECT'); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px 0' }}>
                    <div className="ud-modal-field">
                      <label className="ud-modal-label">Your UPI ID / VPA Address</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                        className="ud-modal-input"
                        value={userVpa}
                        onChange={e => setUserVpa(e.target.value)}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#8c857b', lineHeight: 1.4 }}>
                      A collect request for <strong>{selectedPlanForCheckout.price}</strong> will be sent to your UPI app from beneficiary <strong>9866606967@superyes</strong>.
                    </div>

                    <div className="ud-modal-actions" style={{ marginTop: '12px' }}>
                      <button type="button" className="ud-modal-cancel" onClick={() => setCheckoutModalOpen(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="ud-modal-submit" disabled={paymentProcessing || !userVpa}>
                        {paymentProcessing ? 'REQUESTING COLLECT...' : `Send Collect Request (${selectedPlanForCheckout.price}) →`}
                      </button>
                    </div>
                  </form>
                )}

                {/* ── METHOD 3: CREDIT / DEBIT CARDS ── */}
                {paymentMethod === 'CARD' && (
                  <form onSubmit={e => { e.preventDefault(); handleConfirmSubscription('CREDIT_DEBIT_CARD'); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="ud-card-preview">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="ud-card-chip" />
                        <span style={{ fontSize: '12px', color: '#f59e0b', letterSpacing: '2px', fontWeight: 'bold' }}>RUPAY / VISA / MC</span>
                      </div>
                      <div className="ud-card-number">{cardNumber}</div>
                      <div className="ud-card-bottom">
                        <span>CARDHOLDER: {cardHolder.toUpperCase()}</span>
                        <span>EXPIRES: {cardExp}</span>
                      </div>
                    </div>

                    <div className="ud-modal-field">
                      <label className="ud-modal-label">Cardholder Name</label>
                      <input
                        type="text"
                        required
                        className="ud-modal-input"
                        value={cardHolder}
                        onChange={e => setCardHolder(e.target.value)}
                      />
                    </div>

                    <div className="ud-modal-field">
                      <label className="ud-modal-label">Card Number</label>
                      <input
                        type="text"
                        required
                        maxLength={19}
                        className="ud-modal-input"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="ud-modal-field">
                        <label className="ud-modal-label">Expiration (MM/YY)</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          className="ud-modal-input"
                          value={cardExp}
                          onChange={e => setCardExp(e.target.value)}
                        />
                      </div>
                      <div className="ud-modal-field">
                        <label className="ud-modal-label">CVV</label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          className="ud-modal-input"
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="ud-modal-actions">
                      <button type="button" className="ud-modal-cancel" onClick={() => setCheckoutModalOpen(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="ud-modal-submit" disabled={paymentProcessing}>
                        {paymentProcessing ? 'AUTHORIZING CARD...' : `Authorize Card (${selectedPlanForCheckout.price}) →`}
                      </button>
                    </div>
                  </form>
                )}

                {/* ── METHOD 4: NET BANKING ── */}
                {paymentMethod === 'NETBANKING' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '6px 0' }}>
                    <div style={{ fontSize: '12px', color: '#c9bbaa' }}>Select your Bank for Net Banking:</div>
                    <div className="ud-banks-grid">
                      {['HDFC Bank', 'State Bank of India (SBI)', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank (PNB)'].map(b => (
                        <div
                          key={b}
                          className={`ud-bank-pill ${selectedBank === b ? 'active' : ''}`}
                          onClick={() => setSelectedBank(b)}
                        >
                          <Building2 size={14} color={selectedBank === b ? '#00f5ff' : '#8c857b'} />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>

                    <div className="ud-modal-actions" style={{ marginTop: '12px' }}>
                      <button type="button" className="ud-modal-cancel" onClick={() => setCheckoutModalOpen(false)}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="ud-modal-submit"
                        disabled={paymentProcessing}
                        onClick={() => handleConfirmSubscription('NET_BANKING')}
                      >
                        {paymentProcessing ? 'CONNECTING BANK...' : `Pay with ${selectedBank} (${selectedPlanForCheckout.price}) →`}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── METHOD 5: WALLETS ── */}
                {paymentMethod === 'WALLET' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '6px 0' }}>
                    <div style={{ fontSize: '12px', color: '#c9bbaa' }}>Select your Preferred Digital Wallet:</div>
                    <div className="ud-banks-grid">
                      {['Paytm Wallet', 'Amazon Pay', 'PhonePe Wallet', 'MobiKwik'].map(w => (
                        <div
                          key={w}
                          className={`ud-bank-pill ${selectedWallet === w ? 'active' : ''}`}
                          onClick={() => setSelectedWallet(w)}
                        >
                          <Wallet size={14} color={selectedWallet === w ? '#00f5ff' : '#8c857b'} />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>

                    <div className="ud-modal-actions" style={{ marginTop: '12px' }}>
                      <button type="button" className="ud-modal-cancel" onClick={() => setCheckoutModalOpen(false)}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="ud-modal-submit"
                        disabled={paymentProcessing}
                        onClick={() => handleConfirmSubscription('WALLET')}
                      >
                        {paymentProcessing ? 'LINKING WALLET...' : `Pay with ${selectedWallet} (${selectedPlanForCheckout.price}) →`}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* ══════════════ MODAL: PROVISION POD ══════════════ */}
      {provisionModalOpen && (
        <div className="ud-modal-backdrop" onClick={() => setProvisionModalOpen(false)}>
          <div className="ud-modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="ud-modal-title">
              <Radio size={20} color="#ff5722" /> Provision New Telemetry Pod
            </h3>

            {errorMsg && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', borderRadius: '6px', fontSize: '12px' }}>
                ⚠ {errorMsg}
              </div>
            )}

            <form onSubmit={handleProvisionPod} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="ud-modal-field">
                <label className="ud-modal-label">Pod Callsign / Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AERO-POD-12 or ODYSSEY-01"
                  className="ud-modal-input"
                  value={newPodData.callsign}
                  onChange={e => setNewPodData({ ...newPodData, callsign: e.target.value })}
                />
              </div>

              <div className="ud-modal-field">
                <label className="ud-modal-label">Hardware Tier Model</label>
                <select
                  className="ud-modal-input"
                  value={newPodData.model}
                  onChange={e => setNewPodData({ ...newPodData, model: e.target.value })}
                >
                  <option value="AEROSPEC">AEROSPEC (Single Layer)</option>
                  <option value="AEROSPEC Pro">AEROSPEC Pro (Biplane Dual-Band)</option>
                  <option value="AEROSPEC Pro Max">AEROSPEC Pro Max (Triplane Multi-Band)</option>
                </select>
              </div>

              <div className="ud-modal-field">
                <label className="ud-modal-label">Primary Frequency (MHz)</label>
                <input
                  type="text"
                  required
                  className="ud-modal-input"
                  value={newPodData.frequencyMHz}
                  onChange={e => setNewPodData({ ...newPodData, frequencyMHz: e.target.value })}
                />
              </div>

              <div className="ud-modal-actions">
                <button type="button" className="ud-modal-cancel" onClick={() => setProvisionModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="ud-modal-submit">
                  Provision Fleet Pod
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: SCHEDULE MISSION ══════════════ */}
      {missionModalOpen && (
        <div className="ud-modal-backdrop" onClick={() => setMissionModalOpen(false)}>
          <div className="ud-modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="ud-modal-title">
              <Rocket size={20} color="#00f5ff" /> Schedule Flight Mission
            </h3>

            <form onSubmit={handleScheduleMission} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="ud-modal-field">
                <label className="ud-modal-label">Mission Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solar Apex Radiation Survey"
                  className="ud-modal-input"
                  value={newMissionData.title}
                  onChange={e => setNewMissionData({ ...newMissionData, title: e.target.value })}
                />
              </div>

              <div className="ud-modal-field">
                <label className="ud-modal-label">Target Flight Orbit</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Polar Orbit (SSO) - 520 km"
                  className="ud-modal-input"
                  value={newMissionData.targetOrbit}
                  onChange={e => setNewMissionData({ ...newMissionData, targetOrbit: e.target.value })}
                />
              </div>

              <div className="ud-modal-actions">
                <button type="button" className="ud-modal-cancel" onClick={() => setMissionModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="ud-modal-submit">
                  Authorize Mission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: EMAIL CHANGE WITH OTP ══════════════ */}
      <EmailChangeModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        currentUser={user}
        onEmailChanged={(newEmail) => {
          const updated = { ...user, email: newEmail };
          setUser(updated);
          localStorage.setItem('aerospec_user', JSON.stringify(updated));
          if (missionControl?.setUser) missionControl.setUser(updated);
          setActionMsg(`Email address successfully updated to ${newEmail}`);
        }}
      />

      {/* ══════════════ MODAL: PASSWORD CHANGE WITH 2FA OTP ══════════════ */}
      <PasswordChangeModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        currentUser={user}
        onPasswordChanged={() => {
          setActionMsg('Account security credentials updated with verified 2FA token.');
        }}
      />

      {/* ══════════════ MODAL: DOWNLOAD MISSION TELEMETRY DATA SHEET ══════════════ */}
      <DataSheetModal
        isOpen={dataSheetModalOpen}
        onClose={() => setDataSheetModalOpen(false)}
        user={user}
        currentUser={user}
        satellite={satIdentity}
        tenant={tenant}
        pods={pods}
        missions={missions}
        reports={reports}
      />

    </div>
  );
}

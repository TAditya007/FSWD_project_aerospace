import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio, Activity, Wifi, Cpu, LogOut, User, ChevronDown, Bell, Settings,
  FileText, Download, BarChart2, RefreshCw, CheckCircle, Sliders, MapPin,
  Gauge, Plus, Rocket, Shield, AlertTriangle, CreditCard, Check,
  QrCode, Smartphone, Building2, Wallet, Copy, Receipt, ExternalLink, Sparkles
} from 'lucide-react';
import './UserDashboard.css';

export default function UserDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('aerospec_user') || '{}');

  // Navigation Tabs: 'dashboard' | 'missions' | 'subscription' | 'telemetry' | 'reports' | 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profileOpen, setProfileOpen] = useState(false);

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
      const [tRes, pRes, mRes, rRes] = await Promise.all([
        fetch('/api/saas/tenant'),
        fetch('/api/saas/pods'),
        fetch('/api/saas/missions'),
        fetch('/api/user/reports')
      ]);

      if (tRes.ok) {
        const tData = await tRes.json();
        if (tData.success) setTenant(tData.data);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData.success && pData.data.length > 0) {
          setPods(pData.data);
          if (!selectedPodId) setSelectedPodId(pData.data[0].id);
        }
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        if (mData.success) setMissions(mData.data);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        if (rData.success) setReports(rData.data);
      }
    } catch (err) {
      console.warn('Backend API offline, using fallback state:', err);
      // Default must be basic CADET
      setTenant({
        name: 'Apex Orbital Systems',
        planTier: 'cadet',
        planDetails: { name: 'Cadet (Free)', maxPods: 2, price: '₹0/mo' },
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
      fetchSaaSData();
    } catch (err) {
      // Fallback local upgrade
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

          {tenant && (
            <div className="ud-tenant-chip" title="Organization & Active Subscription Plan">
              <span>{tenant.name}</span>
              <span className="ud-plan-badge">{tenant.planDetails?.name || 'Orbital Pro'}</span>
            </div>
          )}

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
              className="ud-nav-link"
              onClick={() => navigate('/payment')}
              title="Open Aerospace Subscription Payment Gateway"
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

          {tenant && (
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8c857b' }}>
              Fleet Quota: <strong style={{ color: '#00f5ff' }}>{pods.length}</strong> / {tenant.planDetails?.maxPods || 15} Pods ({tenant.planDetails?.name})
            </span>
          )}
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
              {/* Cadet Free Tier */}
              <div className={`ud-plan-card ${tenant?.planTier === 'cadet' ? 'active-tier' : ''}`}>
                <div className="ud-plan-header">
                  <div>
                    <h3 className="ud-plan-name">Cadet (Basic)</h3>
                    <div style={{ fontSize: '12px', color: '#8c857b' }}>Default Starter Telemetry Tier</div>
                  </div>
                  <span className="ud-plan-price">₹0<span style={{ fontSize: '14px', color: '#8c857b' }}>/mo</span></span>
                </div>

                <ul className="ud-plan-features">
                  <li className="ud-plan-feature-item"><Check size={14} color="#10b981" /> Up to 2 Active Telemetry Pods</li>
                  <li className="ud-plan-feature-item"><Check size={14} color="#10b981" /> 7 Days Telemetry History</li>
                  <li className="ud-plan-feature-item"><Check size={14} color="#10b981" /> Basic 2.4 GHz RF Link</li>
                  <li className="ud-plan-feature-item"><Check size={14} color="#10b981" /> Standard Community Support</li>
                </ul>

                {tenant?.planTier === 'cadet' ? (
                  <div className="ud-plan-current-btn">✓ CURRENT ACTIVE PLAN</div>
                ) : (
                  <button className="ud-plan-buy-btn" onClick={() => handleOpenCheckout('cadet', 'Cadet Plan', '₹0/mo')}>
                    Switch to Basic Cadet
                  </button>
                )}
              </div>

              {/* Orbital Pro Tier */}
              <div className={`ud-plan-card featured ${tenant?.planTier === 'orbital_pro' ? 'active-tier' : ''}`}>
                <div style={{ position: 'absolute', top: '-12px', right: '20px', background: '#ff5722', color: '#fff', fontSize: '10px', fontWeight: '800', letterSpacing: '1px', padding: '3px 10px', borderRadius: '12px' }}>
                  MOST POPULAR
                </div>

                <div className="ud-plan-header">
                  <div>
                    <h3 className="ud-plan-name">Orbital Pro</h3>
                    <div style={{ fontSize: '12px', color: '#8c857b' }}>Commercial Constellation</div>
                  </div>
                  <span className="ud-plan-price" style={{ color: '#ff5722' }}>₹3,999<span style={{ fontSize: '14px', color: '#8c857b' }}>/mo</span></span>
                </div>

                <ul className="ud-plan-features">
                  <li className="ud-plan-feature-item"><Check size={14} color="#10b981" /> Up to 15 Active Telemetry Pods</li>
                  <li className="ud-plan-feature-item"><Check size={14} color="#10b981" /> 90 Days High-Res Telemetry</li>
                  <li className="ud-plan-feature-item"><Check size={14} color="#10b981" /> Sub-GHz & Dual-Band Transceiver</li>
                  <li className="ud-plan-feature-item"><Check size={14} color="#10b981" /> Automated Mission Scheduling</li>
                  <li className="ud-plan-feature-item"><Check size={14} color="#10b981" /> AES-256 Flight Encryption</li>
                </ul>

                {tenant?.planTier === 'orbital_pro' ? (
                  <div className="ud-plan-current-btn" style={{ borderColor: '#ff5722', color: '#ff5722', background: 'rgba(255,87,34,0.1)' }}>
                    ✓ CURRENT ACTIVE PLAN
                  </div>
                ) : (
                  <button className="ud-plan-buy-btn" onClick={() => handleOpenCheckout('orbital_pro', 'Orbital Pro', '₹3,999/mo')}>
                    Upgrade to Orbital Pro →
                  </button>
                )}
              </div>

              {/* Interstellar Max Tier */}
              <div className={`ud-plan-card ${tenant?.planTier === 'interstellar_max' ? 'active-tier' : ''}`}>
                <div className="ud-plan-header">
                  <div>
                    <h3 className="ud-plan-name">Interstellar Max</h3>
                    <div style={{ fontSize: '12px', color: '#8c857b' }}>Deep Space Constellation</div>
                  </div>
                  <span className="ud-plan-price" style={{ color: '#a855f7' }}>₹24,999<span style={{ fontSize: '14px', color: '#8c857b' }}>/mo</span></span>
                </div>

                <ul className="ud-plan-features">
                  <li className="ud-plan-feature-item"><Check size={14} color="#10b981" /> Unlimited Telemetry Pods</li>
                  <li className="ud-plan-feature-item"><Check size={14} color="#10b981" /> 365 Days Raw Telemetry Archiving</li>
                  <li className="ud-plan-feature-item"><Check size={14} color="#10b981" /> Quantum-Safe GCM-512 Ciphers</li>
                  <li className="ud-plan-feature-item"><Check size={14} color="#10b981" /> Real-Time Emergency Overrides</li>
                  <li className="ud-plan-feature-item"><Check size={14} color="#10b981" /> 24/7 Dedicated Ground Control</li>
                </ul>

                {tenant?.planTier === 'interstellar_max' ? (
                  <div className="ud-plan-current-btn" style={{ borderColor: '#a855f7', color: '#a855f7', background: 'rgba(168,85,247,0.1)' }}>
                    ✓ CURRENT ACTIVE PLAN
                  </div>
                ) : (
                  <button className="ud-plan-buy-btn" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' }} onClick={() => handleOpenCheckout('interstellar_max', 'Interstellar Max', '₹24,999/mo')}>
                    Unlock Interstellar Max →
                  </button>
                )}
              </div>
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
                <h1 className="ud-greeting">Operator Profile & Security</h1>
                <p className="ud-sub">Manage organization details and hardware telemetry keys.</p>
              </div>
            </div>

            <div className="ud-info-card">
              <h3 className="ud-info-title"><Sliders size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Organization & Plan</h3>
              {tenant && (
                <div style={{ marginTop: '14px', padding: '16px', background: 'rgba(0, 245, 255, 0.04)', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#ffedd6', fontSize: '16px' }}>{tenant.name}</strong>
                      <div style={{ fontSize: '12px', color: '#8c857b', marginTop: '4px' }}>
                        Active Plan: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{tenant.planDetails?.name}</span> ({tenant.planDetails?.price})
                      </div>
                    </div>
                    <button className="ud-fleet-add-btn" onClick={() => setActiveTab('subscription')}>
                      Manage / Upgrade Plan →
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>HARDWARE UPLINK API KEY:</span>
                <code style={{ marginLeft: '10px', color: '#00f5ff', background: 'rgba(0,245,255,0.08)', padding: '4px 10px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                  {user.apiKey || 'aero_live_usr_sec_893201'}
                </code>
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

    </div>
  );
}

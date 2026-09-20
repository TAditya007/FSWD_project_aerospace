import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio, Activity, Wifi, Cpu, LogOut, User, ChevronDown, Bell, Settings,
  FileText, Download, BarChart2, ShieldCheck, RefreshCw, CheckCircle, Sliders, MapPin, Gauge
} from 'lucide-react';

export default function UserDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('aerospec_user') || '{}');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'telemetry' | 'reports' | 'settings'
  const [profileOpen, setProfileOpen] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settings local state
  const [refreshInterval, setRefreshInterval] = useState('2s');
  const [contrastMode, setContrastMode] = useState('high');

  const handleLogout = () => {
    localStorage.removeItem('aerospec_user');
    navigate('/login');
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, rRes] = await Promise.all([
        fetch('/api/user/telemetry'),
        fetch('/api/user/reports')
      ]);

      if (tRes.ok) {
        const tData = await tRes.json();
        if (tData.success) setTelemetry(tData.data);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        if (rData.success) setReports(rData.data);
      }
    } catch (err) {
      console.warn('Backend API offline, loading fallback client state:', err);
      setTelemetry({
        podId: 'AERO-POD-09',
        status: 'ONLINE',
        frequency: '440.92 MHz',
        rssi: '-62 dBm',
        snr: '18.4 dB',
        battery: '94%',
        altitude: '12,450 ft',
        speed: '480 km/h'
      });
      setReports([
        { id: 'REP-1049', title: 'Orbital Pod Signal Telemetry Log', date: '2026-09-18', type: 'RF Telemetry', size: '2.4 MB', status: 'Verified' },
        { id: 'REP-1048', title: 'Atmospheric Sensor Diagnostic', date: '2026-09-17', type: 'Diagnostic', size: '1.8 MB', status: 'Verified' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { label: 'Signal Strength', value: telemetry?.rssi || '-62 dBm', color: '#38bdf8', icon: <Wifi size={20} /> },
    { label: 'Frequency', value: telemetry?.frequency || '440.92 MHz', color: '#22c55e', icon: <Activity size={20} /> },
    { label: 'Pod Status', value: telemetry?.status || 'ONLINE', color: '#0ea5e9', icon: <Cpu size={20} /> },
    { label: 'SNR Signal Ratio', value: telemetry?.snr || '18.4 dB', color: '#a855f7', icon: <Radio size={20} /> },
  ];

  return (
    <div className="ud-root">

      {/* ══════════════ TOP BAR ══════════════ */}
      <header className="ud-topbar">
        {/* Left: Logo */}
        <div className="ud-topbar-left">
          <div className="ud-logo-wrap" onClick={() => navigate('/')}>
            <div className="ud-logo-icon">
              <Radio size={16} />
            </div>
            <span className="ud-logo-text">AEROSPEC</span>
            <span className="ud-badge">OPERATOR PORTAL</span>
          </div>

          {/* Nav links */}
          <nav className="ud-nav-links">
            <button
              className={`ud-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`ud-nav-link ${activeTab === 'telemetry' ? 'active' : ''}`}
              onClick={() => setActiveTab('telemetry')}
            >
              Telemetry
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
          {/* Live status pill */}
          <div className="ud-live-pill">
            <span className="ud-live-dot" />
            LIVE DATA
          </div>

          {/* Notifications */}
          <button className="ud-icon-btn" title="Notifications">
            <Bell size={18} />
            <span className="ud-notif-badge">3</span>
          </button>

          {/* Quick Refresh */}
          <button className="ud-icon-btn" title="Refresh Data" onClick={fetchData}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>

          {/* Profile Dropdown */}
          <div className="ud-profile-wrap">
            <button
              className="ud-profile-btn"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="ud-avatar">
                <User size={15} />
              </div>
              <span className="ud-username">{user.name?.split(' ')[0] || 'Operator'}</span>
              <ChevronDown size={14} className={`ud-chevron ${profileOpen ? 'open' : ''}`} />
            </button>

            {profileOpen && (
              <div className="ud-dropdown">
                <div className="ud-dropdown-header">
                  <span className="ud-dropdown-name">{user.name || 'Operator Vijay'}</span>
                  <span className="ud-dropdown-email">{user.email || 'user@aerospec.com'}</span>
                </div>
                <div className="ud-dropdown-divider" />
                <button className="ud-dropdown-item" onClick={() => { setActiveTab('settings'); setProfileOpen(false); }}>
                  <User size={14} /> Profile & Settings
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

        {/* ── TAB 1: DASHBOARD OVERVIEW ── */}
        {activeTab === 'dashboard' && (
          <>
            <div className="ud-welcome-banner">
              <div className="ud-welcome-text">
                <h1 className="ud-greeting">
                  Welcome back, <span className="ud-greeting-name">{user.name || 'Operator Vijay'}</span> 👋
                </h1>
                <p className="ud-sub">Active Telemetry Pod: <strong>{telemetry?.podId || 'AERO-POD-09'}</strong> — Signal link nominal.</p>
              </div>
              <div className="ud-status-chip">
                <span className="ud-status-dot-green" />
                POD LINK ONLINE
              </div>
            </div>

            {/* Metric Cards */}
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

            {/* Grid Detail Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '24px' }}>
              <div className="ud-info-card">
                <h3 className="ud-info-title"><Gauge size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Pod Altitude & Velocity</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>ALTITUDE</span>
                    <strong style={{ fontSize: '1.4rem', color: '#00f5ff' }}>{telemetry?.altitude || '12,450 ft'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>SPEED</span>
                    <strong style={{ fontSize: '1.4rem', color: '#39ff14' }}>{telemetry?.speed || '480 km/h'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>BATTERY</span>
                    <strong style={{ fontSize: '1.4rem', color: '#00ff88' }}>{telemetry?.battery || '94%'}</strong>
                  </div>
                </div>
              </div>

              <div className="ud-info-card">
                <h3 className="ud-info-title"><MapPin size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Telemetry Coordinates</h3>
                <p className="ud-info-desc">
                  Latitude: <strong>{telemetry?.latitude || '28.6139° N'}</strong> | Longitude: <strong>{telemetry?.longitude || '77.2090° E'}</strong>
                </p>
                <div className="ud-progress-bar" style={{ marginTop: '20px' }}>
                  <div className="ud-progress-fill" style={{ width: '92%' }} />
                </div>
                <span className="ud-progress-label">GPS Fix Signal Confidence: 92%</span>
              </div>
            </div>
          </>
        )}

        {/* ── TAB 2: TELEMETRY VIEW ── */}
        {activeTab === 'telemetry' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="ud-welcome-banner">
              <div>
                <h1 className="ud-greeting">RF Signal Telemetry Analyzer</h1>
                <p className="ud-sub">Real-time spectrum analysis & channel frequency diagnostic.</p>
              </div>
            </div>

            <div className="ud-info-card">
              <h3 className="ud-info-title"><BarChart2 size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Real-Time Signal Waveform</h3>
              {/* Animated Waveform Bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '6px', margin: '20px 0', padding: '16px', background: '#0a0f1d', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                {[40, 65, 80, 45, 90, 75, 55, 85, 95, 60, 70, 88, 50, 68, 82, 92, 45, 78, 86, 62, 74].map((h, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      background: idx % 3 === 0 ? '#38bdf8' : idx % 3 === 1 ? '#22c55e' : '#a855f7',
                      borderRadius: '3px',
                      opacity: 0.85,
                      boxShadow: '0 0 4px rgba(56, 189, 248, 0.3)'
                    }}
                  />
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>BANDWIDTH</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00f5ff' }}>125 kHz</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>CODING RATE</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#39ff14' }}>4/5</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>SPREADING FACTOR</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff6bff' }}>SF 7</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: REPORTS VIEW ── */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="ud-welcome-banner">
              <div>
                <h1 className="ud-greeting">Telemetry Reports Archive</h1>
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
                        <button style={{ padding: '6px 12px', background: 'rgba(0, 245, 255, 0.1)', border: '1px solid #00f5ff', color: '#00f5ff', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
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

        {/* ── TAB 4: SETTINGS VIEW ── */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="ud-welcome-banner">
              <div>
                <h1 className="ud-greeting">Operator Profile & Display Preferences</h1>
                <p className="ud-sub">Manage account preferences and neon UI display contrast.</p>
              </div>
            </div>

            <div className="ud-info-card">
              <h3 className="ud-info-title"><Sliders size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> UI Refresh & Neon Contrast</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', color: '#94a3b8' }}>TELEMETRY POLLING REFRESH RATE</label>
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(e.target.value)}
                    style={{ padding: '10px', background: '#0a0f1d', border: '1px solid rgba(0, 245, 255, 0.3)', color: '#fff', borderRadius: '6px' }}
                  >
                    <option value="1s">1 Second (Real-Time)</option>
                    <option value="2s">2 Seconds (Balanced)</option>
                    <option value="5s">5 Seconds (Low Bandwidth)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', color: '#94a3b8' }}>NEON PALETTE CONTRAST MODE</label>
                  <select
                    value={contrastMode}
                    onChange={(e) => setContrastMode(e.target.value)}
                    style={{ padding: '10px', background: '#0a0f1d', border: '1px solid rgba(0, 245, 255, 0.3)', color: '#fff', borderRadius: '6px' }}
                  >
                    <option value="high">Vibrant Neon (High Contrast)</option>
                    <option value="balanced">Balanced Dark Glass</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>ACCOUNT EMAIL:</span>
                <strong style={{ marginLeft: '8px', color: '#00f5ff' }}>{user.email || 'user@aerospec.com'}</strong>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

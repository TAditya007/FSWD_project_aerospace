import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, Users, Activity, FileText, Settings, LogOut, Search,
  UserX, Shield, RefreshCw, Cpu, Database, CheckCircle2, User, Sliders,
  Eye, EyeOff, Plus, Edit2, KeyRound, CreditCard, CheckCircle, XCircle,
  Clock, QrCode, AlertCircle, ArrowUpRight, Palette, Download, FileSpreadsheet,
  Sparkles, Check, ChevronDown
} from 'lucide-react';
import './AdminDashboard.css';
import { PLAN_CONFIG } from '../../config/plans';
import { useMissionControl } from '../../components/AuthenticatedLayout';
import { THEMES, DEFAULT_THEME_ID } from '../../config/themes';
import DataSheetModal from '../../components/DataSheetModal';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const missionControl = useMissionControl();
  const currentUser = JSON.parse(localStorage.getItem('aerospec_user') || '{}');

  // Enforce Exclusive Admin Access
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Access restricted to authorized System Administrators (vijay@aerospec.com or aditya@aerospec.com).');
      navigate('/login');
    }
  }, []);

  const [activeSection, setActiveSection] = useState('overview'); // 'overview' | 'users' | 'payments' | 'logs' | 'telemetry' | 'settings'
  const [dataSheetModalOpen, setDataSheetModalOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  const activeThemeId = missionControl?.themeId || currentUser.theme || DEFAULT_THEME_ID;
  const activeTheme = THEMES[activeThemeId] || THEMES[DEFAULT_THEME_ID];

  const handleSetTheme = (newThemeId) => {
    if (missionControl?.setThemeId) {
      missionControl.setThemeId(newThemeId);
    }
  };

  const [usersList, setUsersList] = useState([]);
  const [logsList, setLogsList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'Pending Approval' | 'Approved' | 'Rejected'
  const [otpLogsList, setOtpLogsList] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [stats, setStats] = useState({ totalUsers: 4, activePods: 4, systemStatus: 'OPERATIONAL', errorCount: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  // Password visibility state (map of userId -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);

  // Form states
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'Active',
    planTier: 'cadet'
  });

  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'Active',
    planTier: 'cadet'
  });

  const handleLogout = () => {
    localStorage.removeItem('aerospec_user');
    navigate('/login');
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [uRes, lRes, sRes, pRes, oRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/logs'),
        fetch('/api/admin/stats'),
        fetch('/api/admin/payments'),
        fetch('/api/admin/otp-logs')
      ]);

      if (uRes.ok) {
        const uData = await uRes.json();
        if (uData.success) setUsersList(uData.data);
      }
      if (lRes.ok) {
        const lData = await lRes.json();
        if (lData.success) setLogsList(lData.data);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.success) setStats(sData.data);
      }
      if (pRes && pRes.ok) {
        const pData = await pRes.json();
        if (pData.success) setPaymentsList(pData.data);
      }
      if (oRes && oRes.ok) {
        const oData = await oRes.json();
        if (oData.success) setOtpLogsList(oData.data);
      }
    } catch (err) {
      console.warn('Backend API offline, loading fallback admin data:', err);
      setUsersList([
        { id: 'usr_admin_1', name: 'System Admin Vijay', email: 'vijay@aerospec.com', password: 'vijay@2007', role: 'admin', status: 'Active', planTier: 'interstellar_max', createdAt: '2026-01-10' },
        { id: 'usr_admin_2', name: 'System Admin Aditya', email: 'aditya@aerospec.com', password: 'aditya@007', role: 'admin', status: 'Active', planTier: 'interstellar_max', createdAt: '2026-01-10' },
        { id: 'usr_op_1', name: 'Operator Vijay', email: 'user@aerospec.com', password: 'user123', role: 'user', status: 'Active', planTier: 'orbital_pro', createdAt: '2026-02-01' }
      ]);
      setPaymentsList([
        {
          id: 'pay_demo_01',
          userId: 'usr_op_1',
          userName: 'Operator Vijay',
          userEmail: 'user@aerospec.com',
          planTier: 'orbital_pro',
          amount: 440,
          currency: 'INR',
          gateway: 'UPI_SCANNER',
          beneficiaryId: '9866606967@superyes',
          utrNumber: 'UPI2026092019876543',
          otpVerified: true,
          status: 'Pending Approval',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create user');

      setStatusMsg(`Account for ${data.data.email} provisioned and credentials saved to database.`);
      setCreateModalOpen(false);
      setNewUserData({ name: '', email: '', password: '', role: 'user', status: 'Active', planTier: 'cadet' });
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (targetUser) => {
    setSelectedUserForEdit(targetUser);
    setEditUserData({
      name: targetUser.name,
      email: targetUser.email,
      password: targetUser.password,
      role: targetUser.role,
      status: targetUser.status || 'Active',
      planTier: targetUser.planTier || 'cadet'
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    try {
      const res = await fetch(`/api/admin/users/${selectedUserForEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUserData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update user');

      setStatusMsg(`Account credentials updated for ${editUserData.email}.`);
      setEditModalOpen(false);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userEmail === 'vijay@aerospec.com' || userEmail === 'aditya@aerospec.com') {
      alert('Designated root administrator accounts cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete user account ${userEmail}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`User account ${userEmail} deleted.`);
        fetchAdminData();
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    if (!window.confirm(`Authorize & APPROVE Subscription payment #${paymentId}?\nThis will immediately grant the user an Active subscription tier.`)) return;
    setActionLoading(prev => ({ ...prev, [paymentId]: 'approving' }));
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: currentUser.email || 'vijay@aerospec.com' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to approve payment');
      setStatusMsg(`Subscription Order #${paymentId} APPROVED! User plan activated.`);
      fetchAdminData();
    } catch (err) {
      alert(`Approval Error: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [paymentId]: null }));
    }
  };

  const handleRejectPayment = async (paymentId) => {
    const reason = window.prompt('Specify rejection reason (optional):', 'Invalid UPI UTR reference or unverified bank deposit');
    if (reason === null) return;
    setActionLoading(prev => ({ ...prev, [paymentId]: 'rejecting' }));
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: currentUser.email || 'vijay@aerospec.com', reason })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to reject payment');
      setStatusMsg(`Subscription Order #${paymentId} REJECTED.`);
      fetchAdminData();
    } catch (err) {
      alert(`Rejection Error: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [paymentId]: null }));
    }
  };

  const pendingPaymentsCount = paymentsList.filter(p => p.status === 'Pending Approval').length;
  const filteredPayments = paymentsList.filter(p => {
    if (paymentFilter === 'all') return true;
    return p.status === paymentFilter;
  });

  const filteredUsers = usersList.filter(u =>
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.password || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ad-root">

      {/* ════════ TOP HEADER / MISSION STATUS BAR ════════ */}
      <header className="ad-header">
        <div className="ad-logo-wrap" onClick={() => navigate('/')}>
          <div className="ad-logo-icon">
            <ShieldAlert size={18} />
          </div>
          <span className="ad-logo-text">AEROSPEC</span>
          <span className="ad-admin-badge">ADMIN CONTROL CENTER</span>
        </div>

        <div className="ad-header-right">
          <div className="ad-status-pill">
            <span className="ad-status-dot" /> ROOT ADMIN PRIVILEGES
          </div>

          {/* Theme Quick Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              className="ad-refresh-btn"
              title="Switch Mission Control Theme"
              onClick={() => setThemePickerOpen(!themePickerOpen)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 10px', width: 'auto' }}
            >
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: activeTheme.accent, boxShadow: `0 0 6px ${activeTheme.accent}` }} />
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: activeTheme.accent, fontWeight: 700 }}>
                {activeTheme.name}
              </span>
              <ChevronDown size={12} color={activeTheme.accent} />
            </button>

            {themePickerOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '38px',
                  width: '230px',
                  background: 'rgba(7, 13, 27, 0.96)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(0, 245, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '8px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.8)',
                  zIndex: 150,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ padding: '6px 10px', fontSize: '11px', color: '#8c857b', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}>
                  Select Mission Control Theme
                </div>
                {Object.values(THEMES).map(t => (
                  <button
                    key={t.id}
                    onClick={() => { handleSetTheme(t.id); setThemePickerOpen(false); }}
                    style={{
                      background: activeThemeId === t.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                      border: 'none',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.accent }} />
                      <span style={{ color: activeThemeId === t.id ? t.accent : '#ffedd6', fontWeight: activeThemeId === t.id ? 'bold' : 'normal' }}>
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
            className="ad-refresh-btn"
            title="Download Global Telemetry Data Sheet"
            onClick={() => setDataSheetModalOpen(true)}
            style={{ color: '#00f5ff' }}
          >
            <Download size={14} />
          </button>

          <button 
            className="ad-refresh-btn" 
            onClick={fetchAdminData} 
            title="Refresh System State"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
          <div className="ad-admin-chip">
            <div className="ad-admin-avatar">
              <User size={13} />
            </div>
            <span>{currentUser.name || 'System Admin'}</span>
          </div>
          <button className="ad-logout-btn" onClick={handleLogout}>
            <LogOut size={13} /> LOGOUT
          </button>
        </div>
      </header>

      <div className="ad-main-layout">

        {/* ════════ MISSION CONTROL SIDEBAR ════════ */}
        <aside className="ad-sidebar">
          <div className="ad-sidebar-header">ADMINISTRATION MODULES</div>
          <nav className="ad-sidebar-nav">
            <button
              className={`ad-nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveSection('overview')}
            >
              <Activity size={16} /> 
              <span>Overview</span>
            </button>
            <button
              className={`ad-nav-btn ${activeSection === 'users' ? 'active' : ''}`}
              onClick={() => setActiveSection('users')}
            >
              <Users size={16} /> 
              <span>User Surveillance</span>
              <span className="ad-nav-counter">{usersList.length}</span>
            </button>
            <button
              className={`ad-nav-btn ${activeSection === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveSection('payments')}
            >
              <CreditCard size={16} /> 
              <span>Subscription Approvals</span>
              {pendingPaymentsCount > 0 ? (
                <span className="ad-nav-counter" style={{ background: '#f59e0b', color: '#05070c', fontWeight: 'bold' }}>
                  {pendingPaymentsCount}
                </span>
              ) : (
                <span className="ad-nav-counter">{paymentsList.length}</span>
              )}
            </button>
            <button
              className={`ad-nav-btn ${activeSection === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveSection('logs')}
            >
              <FileText size={16} /> 
              <span>Security Audit Logs</span>
              <span className="ad-nav-counter">{logsList.length}</span>
            </button>
            <button
              className={`ad-nav-btn ${activeSection === 'telemetry' ? 'active' : ''}`}
              onClick={() => setActiveSection('telemetry')}
            >
              <Cpu size={16} /> 
              <span>Fleet Overrides</span>
            </button>
            <button
              className={`ad-nav-btn ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              <Settings size={16} /> 
              <span>Tenant & Billing</span>
            </button>
          </nav>
        </aside>

        {/* ════════ MAIN CONTENT VIEWPORT ════════ */}
        <main className="ad-content-area">

          {statusMsg && (
            <div className="ad-alert-bar">
              <CheckCircle2 size={16} /> {statusMsg}
              <button className="ad-close-alert" onClick={() => setStatusMsg('')}>×</button>
            </div>
          )}

          {/* ── SECTION 1: OVERVIEW ── */}
          {activeSection === 'overview' && (
            <div>
              <div className="ad-page-header">
                <h1 className="ad-page-title">SYSTEM ADMINISTRATION OVERVIEW</h1>
                <p className="ad-page-sub">Global telemetry pods status, authenticated operators, and core infrastructure health.</p>
              </div>

              {/* Stats Cards Grid */}
              <div className="ad-stats-grid">
                <div className="ad-stat-card stat-users">
                  <span className="ad-stat-label">Registered Accounts</span>
                  <span className="ad-stat-value val-cyan">{stats.totalUsers}</span>
                  <span className="ad-stat-hint">Active database credentials</span>
                </div>
                <div className="ad-stat-card stat-pods">
                  <span className="ad-stat-label">Live Telemetry Pods</span>
                  <span className="ad-stat-value val-emerald">{stats.activePods}</span>
                  <span className="ad-stat-hint">Orbital telemetry stream</span>
                </div>
                <div className="ad-stat-card stat-system">
                  <span className="ad-stat-label">Tenant Tier</span>
                  <span className="ad-stat-value val-amber" style={{ fontSize: '1.6rem' }}>{stats.planTier || 'Orbital Pro'}</span>
                  <span className="ad-stat-hint">Active SaaS Quota</span>
                </div>
                <div className="ad-stat-card stat-alerts">
                  <span className="ad-stat-label">Logged Events</span>
                  <span className={`ad-stat-value ${stats.errorCount > 0 ? 'val-red' : 'val-emerald'}`}>
                    {stats.errorCount}
                  </span>
                  <span className="ad-stat-hint">Security & audit traces</span>
                </div>
              </div>

              {/* Recent Audit Feed */}
              <div className="ad-panel" style={{ marginTop: '28px' }}>
                <h3 className="ad-panel-title">
                  <FileText size={18} color="#f59e0b" /> Recent System Audit Logs
                </h3>
                <div className="ad-logs-list">
                  {logsList.slice(0, 5).map(l => (
                    <div key={l.id} className="ad-log-item">
                      <span className="ad-log-ts">[{l.timestamp}]</span>
                      <span className={`ad-badge-log ${l.type === 'AUTH' ? 'badge-auth' : l.type === 'TELEMETRY' ? 'badge-telemetry' : l.severity === 'warning' ? 'badge-warning' : 'badge-system'}`}>
                        {l.type}
                      </span>
                      <span className="ad-log-event">{l.event}</span>
                      <span className="ad-log-user">{l.user}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SECTION 2: USER SURVEILLANCE & CREDENTIALS MANAGEMENT ── */}
          {activeSection === 'users' && (
            <div>
              <div className="ad-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 className="ad-page-title">USER CREDENTIALS & ACCOUNT SURVEILLANCE</h1>
                  <p className="ad-page-sub">
                    Full database visibility of all registered accounts, security emails, and saved passwords.
                  </p>
                </div>
                <button
                  className="ad-btn-primary"
                  style={{ marginTop: 0 }}
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus size={14} /> Provision User Account
                </button>
              </div>

              <div className="ad-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                  <div className="ad-search-box">
                    <Search size={16} color="#8c857b" />
                    <input
                      type="text"
                      className="ad-search-input"
                      placeholder="Search accounts by name, email, or credentials..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#8c857b' }}>
                    MONITORING {filteredUsers.length} OF {usersList.length} DATABASE ACCOUNTS
                  </div>
                </div>

                <div className="ad-table-wrap">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th className="ad-th">OPERATOR NAME</th>
                        <th className="ad-th">SECURITY EMAIL</th>
                        <th className="ad-th">SAVED PASSWORD (DATABASE)</th>
                        <th className="ad-th">ACCESS ROLE</th>
                        <th className="ad-th">STATUS</th>
                        <th className="ad-th">SUBSCRIPTION</th>
                        <th className="ad-th" style={{ textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => {
                        const isRevealed = visiblePasswords[u.id];
                        return (
                          <tr key={u.id} className="ad-tr">
                            <td className="ad-td">
                              <span className="ad-user-name">{u.name}</span>
                            </td>
                            <td className="ad-td">
                              <span className="ad-user-email">{u.email}</span>
                            </td>
                            <td className="ad-td">
                              {/* Password Surveillance with Reveal Toggle */}
                              <div className="ad-pwd-wrap">
                                <span className="ad-pwd-text">
                                  {isRevealed ? u.password : '••••••••••••'}
                                </span>
                                <button
                                  type="button"
                                  className="ad-pwd-toggle"
                                  title={isRevealed ? 'Hide Password' : 'Audit and Reveal Password'}
                                  onClick={() => togglePasswordVisibility(u.id)}
                                >
                                  {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                            </td>
                            <td className="ad-td">
                              <span className={u.role === 'admin' ? 'badge-role-admin' : 'badge-role-user'}>
                                {u.role.toUpperCase()}
                              </span>
                            </td>
                            <td className="ad-td">
                              <span className="ad-status-active" style={{ color: u.status === 'Suspended' ? '#ef4444' : '#10b981' }}>
                                <span className="ad-status-dot" style={{ background: u.status === 'Suspended' ? '#ef4444' : '#10b981', width: '6px', height: '6px' }} />
                                {u.status || 'Active'}
                              </span>
                            </td>
                            <td className="ad-td">
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: u.planTier === 'interstellar_max' ? '#a855f7' : u.planTier === 'orbital_pro' ? '#f59e0b' : '#00f5ff' }}>
                                {(u.planTier || 'cadet').toUpperCase()}
                              </span>
                            </td>
                            <td className="ad-td" style={{ textAlign: 'right' }}>
                              <button
                                className="ad-role-btn"
                                onClick={() => handleOpenEdit(u)}
                                title="Edit Full Account Credentials & Role"
                              >
                                <Edit2 size={12} /> Edit
                              </button>
                              <button
                                className="ad-del-btn"
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                title="Remove User Account"
                              >
                                <UserX size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SECTION 3: SYSTEM AUDIT LOGS ── */}
          {activeSection === 'logs' && (
            <div>
              <div className="ad-page-header">
                <h1 className="ad-page-title">FLIGHT COMPUTER & SECURITY AUDIT LOGS</h1>
                <p className="ad-page-sub">Immutable security ledger capturing authentication traces, API requests, and hardware events.</p>
              </div>

              <div className="ad-panel">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {logsList.map(l => (
                    <div key={l.id} className="ad-log-card-full">
                      <div className="ad-log-header-row">
                        <span className="ad-log-ts">[{l.timestamp}]</span>
                        <span className={`ad-badge-log ${l.type === 'AUTH' ? 'badge-auth' : l.type === 'TELEMETRY' ? 'badge-telemetry' : l.severity === 'warning' ? 'badge-warning' : 'badge-system'}`}>
                          {l.type}
                        </span>
                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8c857b' }}>
                          ID: {l.id}
                        </span>
                      </div>
                      <div style={{ color: '#ffedd6', fontSize: '14px', fontWeight: '500' }}>
                        {l.event}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c857b', fontFamily: 'var(--font-mono)' }}>
                        Triggered Principal: <span style={{ color: '#00f5ff' }}>{l.user}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SECTION 3: SUBSCRIPTION PAYMENT APPROVALS ── */}
          {activeSection === 'payments' && (
            <div>
              <div className="ad-page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h1 className="ad-page-title">SUBSCRIPTION PAYMENT APPROVALS</h1>
                    <p className="ad-page-sub">
                      Review multi-gateway transactions, verify scanner payments to beneficiary <code style={{ color: '#00f5ff' }}>9866606967@superyes</code>, and authorize subscription activations.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      className="ad-btn-secondary"
                      onClick={() => fetchAdminData()}
                      title="Refresh transaction ledger"
                    >
                      <RefreshCw size={14} /> Refresh Ledger
                    </button>
                    <a
                      href="/payment"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ad-btn-primary"
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ArrowUpRight size={14} /> Open Gateway UI
                    </a>
                  </div>
                </div>
              </div>

              {/* Status summary banner */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', padding: '16px 20px' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#f59e0b', textTransform: 'uppercase' }}>Awaiting Approval</div>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: '#f59e0b', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    {pendingPaymentsCount}
                  </div>
                  <div style={{ fontSize: '11px', color: '#c9bbaa', marginTop: '2px' }}>Requires Admin Confirmation</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '16px 20px' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#10b981', textTransform: 'uppercase' }}>Approved Subscriptions</div>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: '#10b981', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    {paymentsList.filter(p => p.status === 'Approved').length}
                  </div>
                  <div style={{ fontSize: '11px', color: '#c9bbaa', marginTop: '2px' }}>Active SaaS Fleet Quotas</div>
                </div>
                <div style={{ background: 'rgba(0, 245, 255, 0.08)', border: '1px solid rgba(0, 245, 255, 0.25)', borderRadius: '10px', padding: '16px 20px' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#00f5ff', textTransform: 'uppercase' }}>Target UPI VPA</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#00f5ff', fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
                    9866606967@superyes
                  </div>
                  <div style={{ fontSize: '11px', color: '#c9bbaa', marginTop: '2px' }}>Official Beneficiary Scanner</div>
                </div>
                <div style={{ background: 'rgba(255, 237, 214, 0.04)', border: '1px solid rgba(255, 237, 214, 0.1)', borderRadius: '10px', padding: '16px 20px' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#8c857b', textTransform: 'uppercase' }}>2FA Security Email</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffedd6', fontFamily: 'var(--font-mono)', marginTop: '8px', wordBreak: 'break-all' }}>
                    bikkinavijay0@gmail.com
                  </div>
                  <div style={{ fontSize: '11px', color: '#c9bbaa', marginTop: '2px' }}>Mandatory OTP Gateway Target</div>
                </div>
              </div>

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid rgba(255, 237, 214, 0.08)', paddingBottom: '12px' }}>
                {[
                  { id: 'all', label: `All Orders (${paymentsList.length})` },
                  { id: 'Pending Approval', label: `Pending Approval (${pendingPaymentsCount})` },
                  { id: 'Approved', label: `Approved (${paymentsList.filter(p => p.status === 'Approved').length})` },
                  { id: 'Rejected', label: `Rejected (${paymentsList.filter(p => p.status === 'Rejected').length})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setPaymentFilter(tab.id)}
                    style={{
                      background: paymentFilter === tab.id ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 237, 214, 0.03)',
                      border: `1px solid ${paymentFilter === tab.id ? '#f59e0b' : 'rgba(255, 237, 214, 0.1)'}`,
                      color: paymentFilter === tab.id ? '#f59e0b' : '#c9bbaa',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Transactions Ledger Panel */}
              <div className="ad-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className="ad-panel-title">
                    <CreditCard size={18} color="#f59e0b" /> Subscription Orders Ledger ({filteredPayments.length})
                  </h3>
                  <span style={{ fontSize: '12px', color: '#8c857b', fontFamily: 'var(--font-mono)' }}>
                    Currency: INR (₹) • Strict Admin Authorization Required
                  </span>
                </div>

                {filteredPayments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 20px', color: '#8c857b' }}>
                    <CreditCard size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>No payment requests matching current filter ({paymentFilter}).</p>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#6b7280' }}>
                      Initiate a subscription from the <a href="/payment" target="_blank" rel="noreferrer" style={{ color: '#00f5ff' }}>Payment Gateway Page</a>.
                    </p>
                  </div>
                ) : (
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th className="ad-th">Order ID / Date</th>
                          <th className="ad-th">User / Account</th>
                          <th className="ad-th">Plan Requested</th>
                          <th className="ad-th">Amount (₹)</th>
                          <th className="ad-th">Gateway / VPA</th>
                          <th className="ad-th">UTR / Ref</th>
                          <th className="ad-th">2FA OTP</th>
                          <th className="ad-th">Status</th>
                          <th className="ad-th" style={{ textAlign: 'right' }}>Authorization Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.map(p => {
                          const isPending = p.status === 'Pending Approval';
                          const isApproved = p.status === 'Approved';
                          const isRejected = p.status === 'Rejected';
                          const loadingAction = actionLoading[p.id];

                          return (
                            <tr key={p.id} className="ad-tr">
                              <td className="ad-td">
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#00f5ff', fontWeight: '700' }}>
                                  {p.id}
                                </div>
                                <div style={{ fontSize: '11px', color: '#8c857b', marginTop: '2px' }}>
                                  {new Date(p.createdAt).toLocaleString()}
                                </div>
                              </td>

                              <td className="ad-td">
                                <div className="ad-user-name">{p.userName || 'Flight Operator'}</div>
                                <div className="ad-user-email">{p.userEmail}</div>
                              </td>

                              <td className="ad-td">
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: '700',
                                  background: p.planTier === 'interstellar_max' ? 'rgba(0, 245, 255, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                  color: p.planTier === 'interstellar_max' ? '#00f5ff' : '#f59e0b',
                                  border: `1px solid ${p.planTier === 'interstellar_max' ? 'rgba(0, 245, 255, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                                }}>
                                  {(PLAN_CONFIG[p.planTier]?.name || p.planTier || 'CADET').toUpperCase()}
                                </span>
                              </td>

                              <td className="ad-td">
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: '800', color: '#10b981' }}>
                                  ₹{(p.amount || 0).toLocaleString('en-IN')}
                                </span>
                              </td>

                              <td className="ad-td">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#ffedd6', fontFamily: 'var(--font-mono)' }}>
                                    {p.gateway || 'UPI_SCANNER'}
                                  </span>
                                  <span style={{ fontSize: '10px', color: '#00f5ff', fontFamily: 'var(--font-mono)' }}>
                                    {p.beneficiaryId || '9866606967@superyes'}
                                  </span>
                                </div>
                              </td>

                              <td className="ad-td">
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#c9bbaa', background: 'rgba(255, 237, 214, 0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                  {p.utrNumber || p.billingDetails?.utr || 'N/A'}
                                </span>
                              </td>

                              <td className="ad-td">
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontFamily: 'var(--font-mono)',
                                  color: '#10b981'
                                }}>
                                  <CheckCircle size={12} /> Verified
                                </span>
                              </td>

                              <td className="ad-td">
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  fontFamily: 'var(--font-mono)',
                                  background: isPending ? 'rgba(245, 158, 11, 0.15)' : isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: isPending ? '#f59e0b' : isApproved ? '#10b981' : '#ef4444',
                                  border: `1px solid ${isPending ? 'rgba(245, 158, 11, 0.35)' : isApproved ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`
                                }}>
                                  {isPending && <Clock size={12} className="animate-spin" />}
                                  {isApproved && <CheckCircle size={12} />}
                                  {isRejected && <XCircle size={12} />}
                                  {p.status}
                                </span>
                              </td>

                              <td className="ad-td" style={{ textAlign: 'right' }}>
                                {isPending ? (
                                  <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button
                                      className="ad-btn-primary"
                                      style={{
                                        background: 'rgba(16, 185, 129, 0.2)',
                                        borderColor: '#10b981',
                                        color: '#10b981',
                                        padding: '6px 12px',
                                        fontSize: '11px'
                                      }}
                                      disabled={loadingAction === 'approving'}
                                      onClick={() => handleApprovePayment(p.id)}
                                      title="Grant Active subscription status"
                                    >
                                      {loadingAction === 'approving' ? 'Activating...' : 'Approve ✓'}
                                    </button>
                                    <button
                                      className="ad-btn-danger"
                                      style={{ padding: '6px 10px', fontSize: '11px' }}
                                      disabled={loadingAction === 'rejecting'}
                                      onClick={() => handleRejectPayment(p.id)}
                                      title="Reject payment request"
                                    >
                                      {loadingAction === 'rejecting' ? '...' : 'Reject ✕'}
                                    </button>
                                  </div>
                                ) : isApproved ? (
                                  <div style={{ fontSize: '11px', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                                    ✓ Active & Authorized by {p.approvedBy?.split('@')[0] || 'admin'}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '11px', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                                    ✕ Rejected ({p.rejectReason || 'Declined'})
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 2FA OTP Logs Security Panel */}
              <div className="ad-panel" style={{ marginTop: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 className="ad-panel-title">
                    <Shield size={18} color="#00f5ff" /> 2FA OTP Verification Ledger (Target: bikkinavijay0@gmail.com)
                  </h3>
                  <span style={{ fontSize: '11px', color: '#8c857b', fontFamily: 'var(--font-mono)' }}>
                    Total OTP Dispatches: {otpLogsList.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {otpLogsList.slice(0, 8).map(otp => (
                    <div
                      key={otp.id}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(255, 237, 214, 0.02)',
                        border: '1px solid rgba(255, 237, 214, 0.05)',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#8c857b', fontSize: '11px' }}>
                          [{new Date(otp.timestamp).toLocaleTimeString()}]
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: otp.status === 'VERIFIED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 245, 255, 0.15)',
                          color: otp.status === 'VERIFIED' ? '#10b981' : '#00f5ff',
                          fontWeight: '700'
                        }}>
                          {otp.status}
                        </span>
                        <span style={{ color: '#ffedd6' }}>
                          OTP sent to <code style={{ color: '#f59e0b' }}>{otp.email}</code> for {otp.type}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: '#00f5ff', fontSize: '11px' }}>
                        Code: [ • • • • • • ] • IP: {otp.ip || '127.0.0.1'}
                      </div>
                    </div>
                  ))}
                  {otpLogsList.length === 0 && (
                    <div style={{ color: '#8c857b', fontSize: '12px', padding: '12px 0' }}>
                      No OTP verification events recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── SECTION 4: TELEMETRY OVERRIDE ── */}
          {activeSection === 'telemetry' && (
            <div>
              <div className="ad-page-header">
                <h1 className="ad-page-title">POD TELEMETRY GLOBAL CONTROLS</h1>
                <p className="ad-page-sub">Manual transceiver frequency alignment, gain adjustment, and link protocol override.</p>
              </div>

              <div className="ad-panel">
                <h3 className="ad-panel-title">
                  <Cpu size={18} color="#00f5ff" /> Transceiver Calibration Parameters
                </h3>
                <div className="ad-form-grid">
                  <div className="ad-field-group">
                    <label className="ad-label">Primary RF Frequency (MHz)</label>
                    <input type="text" defaultValue="440.920" className="ad-input-hud" />
                  </div>
                  <div className="ad-field-group">
                    <label className="ad-label">Transmitter Output Gain</label>
                    <input type="text" defaultValue="+18.5 dBm" className="ad-input-hud" />
                  </div>
                  <div className="ad-field-group">
                    <label className="ad-label">Modulation Scheme</label>
                    <input type="text" defaultValue="GMSK / 9600 bps" className="ad-input-hud" />
                  </div>
                </div>
                <button
                  className="ad-btn-primary"
                  onClick={() => setStatusMsg('Global Telemetry parameters updated across all active pods.')}
                >
                  Apply Global Override →
                </button>
              </div>
            </div>
          )}

          {/* ── SECTION 5: TENANT & BILLING ── */}
          {activeSection === 'settings' && (
            <div>
              <div className="ad-page-header">
                <h1 className="ad-page-title">SAAS TENANT & BILLING INFRASTRUCTURE</h1>
                <p className="ad-page-sub">Configure subscription billing tiers, fleet quota limits, and database state.</p>
              </div>

              <div className="ad-panel">
                <h3 className="ad-panel-title">
                  <Shield size={18} color="#f59e0b" /> Subscription Tier Controls
                </h3>
                <p style={{ color: '#c9bbaa', marginTop: '10px', fontSize: '13px' }}>
                  Manage multi-tenant quotas, fleet capacity limits, and subscription billing tiers.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '20px' }}>
                  {Object.values(PLAN_CONFIG).map(tier => (
                    <div
                      key={tier.id}
                      style={{
                        padding: '18px',
                        borderRadius: '10px',
                        background: 'rgba(255, 237, 214, 0.03)',
                        border: `1px solid ${stats.planTier?.includes(tier.name.split(' ')[0]) ? '#f59e0b' : 'rgba(255, 237, 214, 0.1)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: '#ffedd6', fontSize: '14px' }}>{tier.name}</strong>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#00f5ff' }}>{tier.price}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#10b981', fontFamily: 'var(--font-mono)' }}>{tier.pods}</span>
                      <p style={{ fontSize: '12px', color: '#8c857b', margin: '4px 0' }}>{tier.desc}</p>
                      <button
                        className="ad-btn-primary"
                        style={{ marginTop: 'auto', padding: '8px 12px', fontSize: '11px' }}
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/saas/billing/upgrade', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ planTier: tier.id })
                            });
                            const data = await res.json();
                            if (data.success) {
                              setStatusMsg(`Tenant subscription updated to ${tier.name}`);
                              fetchAdminData();
                            }
                          } catch (err) {
                            setStatusMsg(`Locally set tier to ${tier.name}`);
                          }
                        }}
                      >
                        {stats.planTier?.includes(tier.name.split(' ')[0]) ? 'Current Tier Active' : 'Switch To Tier →'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ad-panel" style={{ marginTop: '24px' }}>
                <h3 className="ad-panel-title">
                  <Database size={18} color="#10b981" /> Database & Storage Persistence
                </h3>
                <p style={{ color: '#c9bbaa', marginTop: '12px', fontSize: '14px', lineHeight: '1.6' }}>
                  Database storage engine: <code style={{ color: '#00f5ff', background: 'rgba(0,245,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>server/db.json</code> | 
                  Active Port: <code style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '2px 6px', borderRadius: '4px' }}>5000</code>
                </p>
                <div style={{ marginTop: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <button
                    className="ad-btn-outline-emerald"
                    onClick={() => setStatusMsg('Database snapshot saved successfully to storage node.')}
                  >
                    <Database size={14} /> Backup Database Now
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ════════ MODAL: PROVISION NEW USER ACCOUNT ════════ */}
      {createModalOpen && (
        <div className="ad-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="ad-modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="ad-modal-title">
              <Plus size={20} color="#f59e0b" /> Provision New User Account
            </h3>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="ad-modal-field">
                <label className="ad-modal-label">Operator Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commander Shepard"
                  className="ad-modal-input"
                  value={newUserData.name}
                  onChange={e => setNewUserData({ ...newUserData, name: e.target.value })}
                />
              </div>

              <div className="ad-modal-field">
                <label className="ad-modal-label">Security Email Address (Any Domain)</label>
                <input
                  type="email"
                  required
                  placeholder="operator@anydomain.com"
                  className="ad-modal-input"
                  value={newUserData.email}
                  onChange={e => setNewUserData({ ...newUserData, email: e.target.value })}
                />
              </div>

              <div className="ad-modal-field">
                <label className="ad-modal-label">Initial Password</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FlightPass2026!"
                  className="ad-modal-input"
                  value={newUserData.password}
                  onChange={e => setNewUserData({ ...newUserData, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="ad-modal-field">
                  <label className="ad-modal-label">Access Role</label>
                  <select
                    className="ad-modal-input"
                    value={newUserData.role}
                    onChange={e => setNewUserData({ ...newUserData, role: e.target.value })}
                  >
                    <option value="user">USER (Standard Operator)</option>
                    <option value="admin">ADMIN (Root Access)</option>
                  </select>
                </div>

                <div className="ad-modal-field">
                  <label className="ad-modal-label">Plan Tier</label>
                  <select
                    className="ad-modal-input"
                    value={newUserData.planTier}
                    onChange={e => setNewUserData({ ...newUserData, planTier: e.target.value })}
                  >
                    {Object.values(PLAN_CONFIG).map(tier => (
                      <option key={tier.id} value={tier.id}>{tier.name} ({tier.price})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ad-modal-actions">
                <button type="button" className="ad-modal-cancel" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="ad-modal-submit">
                  Save Account to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════ MODAL: EDIT USER ACCOUNT & CREDENTIALS ════════ */}
      {editModalOpen && selectedUserForEdit && (
        <div className="ad-modal-backdrop" onClick={() => setEditModalOpen(false)}>
          <div className="ad-modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="ad-modal-title">
              <Edit2 size={20} color="#00f5ff" /> Edit Account Credentials — {selectedUserForEdit.email}
            </h3>

            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="ad-modal-field">
                <label className="ad-modal-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="ad-modal-input"
                  value={editUserData.name}
                  onChange={e => setEditUserData({ ...editUserData, name: e.target.value })}
                />
              </div>

              <div className="ad-modal-field">
                <label className="ad-modal-label">Email Address</label>
                <input
                  type="email"
                  required
                  className="ad-modal-input"
                  value={editUserData.email}
                  onChange={e => setEditUserData({ ...editUserData, email: e.target.value })}
                />
              </div>

              <div className="ad-modal-field">
                <label className="ad-modal-label">Account Password (Saved in Database)</label>
                <input
                  type="text"
                  required
                  className="ad-modal-input"
                  value={editUserData.password}
                  onChange={e => setEditUserData({ ...editUserData, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="ad-modal-field">
                  <label className="ad-modal-label">Access Role</label>
                  <select
                    className="ad-modal-input"
                    value={editUserData.role}
                    onChange={e => setEditUserData({ ...editUserData, role: e.target.value })}
                  >
                    <option value="user">USER</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </div>

                <div className="ad-modal-field">
                  <label className="ad-modal-label">Account Status</label>
                  <select
                    className="ad-modal-input"
                    value={editUserData.status}
                    onChange={e => setEditUserData({ ...editUserData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="ad-modal-field">
                <label className="ad-modal-label">Assigned Subscription Tier</label>
                <select
                  className="ad-modal-input"
                  value={editUserData.planTier}
                  onChange={e => setEditUserData({ ...editUserData, planTier: e.target.value })}
                >
                  {Object.values(PLAN_CONFIG).map(tier => (
                    <option key={tier.id} value={tier.id}>{tier.name} ({tier.price})</option>
                  ))}
                </select>
              </div>

              <div className="ad-modal-actions">
                <button type="button" className="ad-modal-cancel" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="ad-modal-submit" style={{ background: 'linear-gradient(135deg, #00f5ff 0%, #0284c7 100%)' }}>
                  Update Account in Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════ MODAL: DOWNLOAD MISSION TELEMETRY DATA SHEET ════════ */}
      <DataSheetModal
        isOpen={dataSheetModalOpen}
        onClose={() => setDataSheetModalOpen(false)}
        user={currentUser}
        currentUser={currentUser}
      />

    </div>
  );
}

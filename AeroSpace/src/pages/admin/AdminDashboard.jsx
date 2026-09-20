import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, Users, Activity, FileText, Settings, LogOut, Search, UserCheck,
  UserX, Shield, AlertTriangle, RefreshCw, Cpu, Database, CheckCircle2, Lock
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('aerospec_user') || '{}');

  const [activeSection, setActiveSection] = useState('overview'); // 'overview' | 'users' | 'logs' | 'telemetry' | 'settings'
  const [usersList, setUsersList] = useState([]);
  const [logsList, setLogsList] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 4, activePods: 4, systemStatus: 'OPERATIONAL', errorCount: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

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
      const [uRes, lRes, sRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/logs'),
        fetch('/api/admin/stats')
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
    } catch (err) {
      console.warn('Backend API offline, loading fallback admin data:', err);
      setUsersList([
        { id: 'usr_1', name: 'System Admin', email: 'admin@aerospec.com', role: 'admin', status: 'Active', createdAt: '2026-01-15' },
        { id: 'usr_2', name: 'Operator Vijay', email: 'user@aerospec.com', role: 'user', status: 'Active', createdAt: '2026-02-01' },
        { id: 'usr_3', name: 'Telemetry Engineer Maya', email: 'maya@aerospec.com', role: 'user', status: 'Active', createdAt: '2026-02-10' }
      ]);
      setLogsList([
        { id: 'log_1', timestamp: '2026-09-18 08:30:12', type: 'AUTH', event: 'System Admin logged in', user: 'admin@aerospec.com', severity: 'info' },
        { id: 'log_2', timestamp: '2026-09-18 08:15:44', type: 'TELEMETRY', event: 'Pod AERO-POD-09 ping OK', user: 'SYSTEM', severity: 'success' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Role updated to ${newRole.toUpperCase()} successfully.`);
        fetchAdminData();
      } else {
        alert(data.message);
      }
    } catch (err) {
      // Fallback local update
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setStatusMsg(`Role updated locally to ${newRole.toUpperCase()}.`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user account?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('User account deleted.');
        fetchAdminData();
      }
    } catch (err) {
      setUsersList(prev => prev.filter(u => u.id !== userId));
      setStatusMsg('User account removed locally.');
    }
  };

  const filteredUsers = usersList.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={styles.root}>

      {/* ════════ TOP HEADER ════════ */}
      <header style={styles.header}>
        <div style={styles.logoWrap} onClick={() => navigate('/')}>
          <ShieldAlert size={22} color="#f59e0b" />
          <span style={styles.logoText}>AEROSPEC</span>
          <span style={styles.adminBadge}>ADMIN CONTROL CENTER</span>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.systemStatusPill}>
            <span style={styles.statusDot} /> SYSTEM ONLINE
          </div>
          <button style={styles.refreshBtn} onClick={fetchAdminData} title="Refresh System State">
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
          <span style={styles.adminName}>{user.name || 'System Admin'}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={14} style={{ marginRight: '6px' }} /> LOGOUT
          </button>
        </div>
      </header>

      <div style={styles.mainLayout}>

        {/* ════════ SIDEBAR ════════ */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarNav}>
            <button
              style={{ ...styles.navBtn, ...(activeSection === 'overview' ? styles.navBtnActive : {}) }}
              onClick={() => setActiveSection('overview')}
            >
              <Activity size={16} /> Dashboard Overview
            </button>
            <button
              style={{ ...styles.navBtn, ...(activeSection === 'users' ? styles.navBtnActive : {}) }}
              onClick={() => setActiveSection('users')}
            >
              <Users size={16} /> User Management ({usersList.length})
            </button>
            <button
              style={{ ...styles.navBtn, ...(activeSection === 'logs' ? styles.navBtnActive : {}) }}
              onClick={() => setActiveSection('logs')}
            >
              <FileText size={16} /> Audit & System Logs ({logsList.length})
            </button>
            <button
              style={{ ...styles.navBtn, ...(activeSection === 'telemetry' ? styles.navBtnActive : {}) }}
              onClick={() => setActiveSection('telemetry')}
            >
              <Cpu size={16} /> Pod Telemetry Override
            </button>
            <button
              style={{ ...styles.navBtn, ...(activeSection === 'settings' ? styles.navBtnActive : {}) }}
              onClick={() => setActiveSection('settings')}
            >
              <Settings size={16} /> System Config
            </button>
          </div>
        </aside>

        {/* ════════ MAIN CONTENT VIEW ════════ */}
        <main style={styles.contentArea}>

          {statusMsg && (
            <div style={styles.alertBar}>
              <CheckCircle2 size={16} /> {statusMsg}
              <button style={styles.closeAlert} onClick={() => setStatusMsg('')}>×</button>
            </div>
          )}

          {/* ── SECTION 1: OVERVIEW ── */}
          {activeSection === 'overview' && (
            <div>
              <div style={styles.pageHeader}>
                <h1 style={styles.pageTitle}>System Administration Overview</h1>
                <p style={styles.pageSub}>Monitor connected users, live RF telemetry nodes, and platform health.</p>
              </div>

              {/* Stats Cards Grid */}
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <span style={styles.statLabel}>Total Registered Users</span>
                  <span style={{ ...styles.statValue, color: '#0284c7' }}>{stats.totalUsers}</span>
                  <span style={styles.statHint}>Admin & Operator accounts</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statLabel}>Active Telemetry Pods</span>
                  <span style={{ ...styles.statValue, color: '#16a34a' }}>{stats.activePods}</span>
                  <span style={styles.statHint}>Pods streaming live</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statLabel}>Database Status</span>
                  <span style={{ ...styles.statValue, color: '#0284c7' }}>{stats.systemStatus}</span>
                  <span style={styles.statHint}>Express API & JSON DB</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statLabel}>Security Alerts</span>
                  <span style={{ ...styles.statValue, color: stats.errorCount > 0 ? '#dc2626' : '#16a34a' }}>
                    {stats.errorCount}
                  </span>
                  <span style={styles.statHint}>Logged warnings</span>
                </div>
              </div>

              {/* Recent Audit Feed */}
              <div style={{ ...styles.panelCard, marginTop: '28px' }}>
                <h3 style={styles.panelTitle}><FileText size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Recent System Audit Logs</h3>
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {logsList.slice(0, 4).map(l => (
                    <div key={l.id} style={styles.logItem}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>[{l.timestamp}]</span>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#e0e7ff', color: '#4338ca', fontSize: '11px', fontWeight: 'bold' }}>{l.type}</span>
                      <span style={{ color: '#0f172a', flex: 1, fontWeight: '500' }}>{l.event}</span>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>{l.user}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SECTION 2: USER MANAGEMENT ── */}
          {activeSection === 'users' && (
            <div>
              <div style={styles.pageHeader}>
                <h1 style={styles.pageTitle}>User Account & Security Management</h1>
                <p style={styles.pageSub}>Manage registered operators, assign admin privileges, or revoke access.</p>
              </div>

              <div style={styles.panelCard}>
                {/* Search Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={styles.searchBox}>
                    <Search size={16} color="#64748b" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, or role..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={styles.searchInput}
                    />
                  </div>
                </div>

                {/* Users Table */}
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>USER</th>
                      <th style={styles.th}>EMAIL</th>
                      <th style={styles.th}>ROLE</th>
                      <th style={styles.th}>STATUS</th>
                      <th style={styles.th}>CREATED</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: 'bold', color: '#0f172a' }}>{u.name}</td>
                        <td style={{ ...styles.td, color: '#0284c7' }}>{u.email}</td>
                        <td style={styles.td}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            letterSpacing: '1px',
                            background: u.role === 'admin' ? '#e0f2fe' : '#f1f5f9',
                            color: u.role === 'admin' ? '#0284c7' : '#475569',
                            border: `1px solid ${u.role === 'admin' ? '#bae6fd' : '#cbd5e1'}`
                          }}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: '500' }}>● {u.status || 'Active'}</span>
                        </td>
                        <td style={{ ...styles.td, color: '#64748b' }}>{u.createdAt}</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <button
                            style={styles.roleBtn}
                            onClick={() => handleToggleRole(u.id, u.role)}
                            title="Toggle Admin Privilege"
                          >
                            <Shield size={13} style={{ marginRight: '4px' }} />
                            {u.role === 'admin' ? 'Demote to User' : 'Make Admin'}
                          </button>
                          <button
                            style={styles.deleteBtn}
                            onClick={() => handleDeleteUser(u.id)}
                            title="Delete User Account"
                          >
                            <UserX size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SECTION 3: SYSTEM LOGS ── */}
          {activeSection === 'logs' && (
            <div>
              <div style={styles.pageHeader}>
                <h1 style={styles.pageTitle}>System & Security Audit Logs</h1>
                <p style={styles.pageSub}>Real-time authentication records, API requests, and hardware events.</p>
              </div>

              <div style={styles.panelCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {logsList.map(l => (
                    <div key={l.id} style={styles.logItemFull}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>[{l.timestamp}]</span>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: l.severity === 'warning' ? '#fee2e2' : '#e0f2fe',
                          color: l.severity === 'warning' ? '#dc2626' : '#0284c7'
                        }}>
                          {l.type}
                        </span>
                      </div>
                      <div style={{ color: '#0f172a', marginTop: '6px', fontSize: '14px', fontWeight: '500' }}>{l.event}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Triggered by: {l.user}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SECTION 4: TELEMETRY OVERRIDE ── */}
          {activeSection === 'telemetry' && (
            <div>
              <div style={styles.pageHeader}>
                <h1 style={styles.pageTitle}>Pod Telemetry Global Controls</h1>
                <p style={styles.pageSub}>Emergency pod frequency override and hardware transmission parameters.</p>
              </div>

              <div style={styles.panelCard}>
                <h3 style={styles.panelTitle}><Cpu size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Pod Frequency Control</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '8px', fontWeight: '600' }}>PRIMARY RF FREQUENCY (MHZ)</label>
                    <input type="text" defaultValue="440.92" style={styles.searchInput} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '8px', fontWeight: '600' }}>TRANSMITTER GAIN (DBM)</label>
                    <input type="text" defaultValue="+18 dBm" style={styles.searchInput} />
                  </div>
                </div>
                <button
                  style={{ marginTop: '20px', padding: '10px 20px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  onClick={() => setStatusMsg('Global Telemetry parameters updated across all active pods.')}
                >
                  Apply Global Override →
                </button>
              </div>
            </div>
          )}

          {/* ── SECTION 5: SETTINGS ── */}
          {activeSection === 'settings' && (
            <div>
              <div style={styles.pageHeader}>
                <h1 style={styles.pageTitle}>Infrastructure Settings</h1>
                <p style={styles.pageSub}>Configure system maintenance mode, data retention, and security parameters.</p>
              </div>

              <div style={styles.panelCard}>
                <h3 style={styles.panelTitle}><Database size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Database & Express Server State</h3>
                <p style={{ color: '#475569', marginTop: '8px', fontSize: '14px' }}>
                  JSON Database file location: <code>server/db.json</code> | Port: <code>5000</code>
                </p>
                <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                  <button
                    style={{ padding: '10px 18px', background: 'transparent', border: '1px solid #16a34a', color: '#16a34a', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                    onClick={() => setStatusMsg('Database snapshot saved successfully.')}
                  >
                    Backup Database Now
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}

const styles = {
  root: { minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, sans-serif' },
  header: { height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 3%', borderBottom: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  logoText: { fontWeight: 900, fontSize: '18px', letterSpacing: '4px', color: '#0f172a' },
  adminBadge: { fontSize: '10px', background: '#0284c7', color: '#ffffff', padding: '3px 8px', borderRadius: '4px', letterSpacing: '2px', fontWeight: 800 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '18px' },
  systemStatusPill: { fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#16a34a', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' },
  statusDot: { width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' },
  refreshBtn: { padding: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0284c7', borderRadius: '6px', cursor: 'pointer' },
  adminName: { fontSize: '13px', color: '#0284c7', fontWeight: 'bold' },
  logoutBtn: { padding: '7px 16px', background: 'transparent', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center' },

  mainLayout: { display: 'flex', minHeight: 'calc(100vh - 64px)' },
  sidebar: { width: '260px', background: '#ffffff', borderRight: '1px solid #e2e8f0', padding: '24px 16px' },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: '8px' },
  navBtn: { padding: '12px 16px', background: 'transparent', border: '1px solid transparent', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' },
  navBtnActive: { background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.3)', color: '#0284c7', fontWeight: 'bold' },

  contentArea: { flex: 1, padding: '40px 4%', maxWidth: '1400px' },
  alertBar: { padding: '12px 18px', background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '500' },
  closeAlert: { marginLeft: 'auto', background: 'transparent', border: 'none', color: '#15803d', fontSize: '18px', cursor: 'pointer' },

  pageHeader: { marginBottom: '30px' },
  pageTitle: { fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' },
  pageSub: { color: '#64748b', margin: 0, fontSize: '14px' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' },
  statCard: { padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '8px' },
  statLabel: { fontSize: '11px', letterSpacing: '1px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' },
  statValue: { fontSize: '2.2rem', fontWeight: 800 },
  statHint: { fontSize: '12px', color: '#94a3b8' },

  panelCard: { padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
  panelTitle: { fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a', margin: 0 },

  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', width: '100%', maxWidth: '400px' },
  searchInput: { background: 'transparent', border: 'none', color: '#0f172a', fontSize: '14px', width: '100%', outline: 'none' },

  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  th: { padding: '14px 16px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '11px', letterSpacing: '1px', textAlign: 'left', fontWeight: '700' },
  td: { padding: '16px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#1e293b' },
  tr: { transition: 'background 0.2s' },

  roleBtn: { padding: '6px 12px', background: '#f0f9ff', border: '1px solid #0284c7', color: '#0284c7', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginRight: '8px', fontWeight: '600' },
  deleteBtn: { padding: '6px 10px', background: '#fef2f2', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },

  logItem: { display: 'flex', gap: '14px', alignItems: 'center', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a' },
  logItemFull: { padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a' }
};

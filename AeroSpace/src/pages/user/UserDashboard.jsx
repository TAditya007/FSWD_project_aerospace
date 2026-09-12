import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('aerospec_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('aerospec_user');
    navigate('/login');
  };

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <span style={styles.logo}>AEROSPEC <span style={styles.badge}>USER</span></span>
        <div style={styles.right}>
          <span style={styles.name}>{user.name || 'Operator'}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>LOGOUT</button>
        </div>
      </div>
      <div style={styles.body}>
        <h1 style={styles.greeting}>Welcome back, {user.name?.split(' ')[0] || 'Operator'} 👋</h1>
        <p style={styles.sub}>Your telemetry dashboard is being set up — Phase 3 coming soon.</p>
        <div style={styles.cards}>
          {[
            { label: 'Signal Strength', value: '-62 dBm', color: '#38bdf8' },
            { label: 'Frequency',       value: '433.92 MHz', color: '#34d399' },
            { label: 'Pod Status',      value: 'ONLINE',     color: '#22c55e' },
            { label: 'SNR',             value: '18.4 dB',    color: '#a78bfa' },
          ].map(c => (
            <div key={c.label} style={styles.card}>
              <span style={{ ...styles.cardLabel }}>{c.label}</span>
              <span style={{ ...styles.cardValue, color: c.color }}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  root:       { minHeight: '100vh', background: '#020617', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' },
  header:     { height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5%', borderBottom: '1px solid #1e293b', background: '#0f172a' },
  logo:       { fontWeight: 900, fontSize: '18px', letterSpacing: '4px', color: '#f8fafc' },
  badge:      { fontSize: '10px', background: '#0ea5e9', color: '#020617', padding: '3px 8px', borderRadius: '4px', marginLeft: '10px', letterSpacing: '2px', fontWeight: 700 },
  right:      { display: 'flex', alignItems: 'center', gap: '20px' },
  name:       { fontSize: '13px', color: '#94a3b8' },
  logoutBtn:  { padding: '7px 16px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', letterSpacing: '1px' },
  body:       { padding: '60px 5%', maxWidth: '1200px', margin: '0 auto' },
  greeting:   { fontSize: '2.5rem', fontWeight: 900, margin: '0 0 12px 0' },
  sub:        { color: '#475569', marginBottom: '50px' },
  cards:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' },
  card:       { padding: '28px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  cardLabel:  { fontSize: '11px', letterSpacing: '2px', color: '#475569', textTransform: 'uppercase' },
  cardValue:  { fontSize: '2rem', fontWeight: 800 },
};

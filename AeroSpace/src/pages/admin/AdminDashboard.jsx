import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('aerospec_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('aerospec_user');
    navigate('/login');
  };

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <span style={styles.logo}>AEROSPEC <span style={styles.badge}>ADMIN</span></span>
        <div style={styles.right}>
          <span style={styles.name}>{user.name || 'Administrator'}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>LOGOUT</button>
        </div>
      </div>
      <div style={styles.body}>
        <h1 style={styles.greeting}>Admin Control Center 🛡</h1>
        <p style={styles.sub}>System administration panel — Phase 3 & 9 will build this out fully.</p>
        <div style={styles.cards}>
          {[
            { label: 'Total Users',    value: '12',         color: '#f59e0b' },
            { label: 'Active Pods',    value: '3',          color: '#f59e0b' },
            { label: 'System Status',  value: 'OPERATIONAL', color: '#22c55e' },
            { label: 'Alerts',         value: '0',          color: '#ef4444' },
          ].map(c => (
            <div key={c.label} style={styles.card}>
              <span style={styles.cardLabel}>{c.label}</span>
              <span style={{ ...styles.cardValue, color: c.color }}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  root:       { minHeight: '100vh', background: '#0c0a00', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' },
  header:     { height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5%', borderBottom: '1px solid #292400', background: '#1c1500' },
  logo:       { fontWeight: 900, fontSize: '18px', letterSpacing: '4px', color: '#f8fafc' },
  badge:      { fontSize: '10px', background: '#f59e0b', color: '#0c0a00', padding: '3px 8px', borderRadius: '4px', marginLeft: '10px', letterSpacing: '2px', fontWeight: 700 },
  right:      { display: 'flex', alignItems: 'center', gap: '20px' },
  name:       { fontSize: '13px', color: '#92400e' },
  logoutBtn:  { padding: '7px 16px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', letterSpacing: '1px' },
  body:       { padding: '60px 5%', maxWidth: '1200px', margin: '0 auto' },
  greeting:   { fontSize: '2.5rem', fontWeight: 900, margin: '0 0 12px 0' },
  sub:        { color: '#78350f', marginBottom: '50px' },
  cards:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' },
  card:       { padding: '28px', background: '#1c1500', border: '1px solid #292400', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  cardLabel:  { fontSize: '11px', letterSpacing: '2px', color: '#78350f', textTransform: 'uppercase' },
  cardValue:  { fontSize: '2rem', fontWeight: 800 },
};

import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>AeroSpec</div>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Home</Link>
        <Link to="/dashboard" style={styles.link}>Dashboard</Link>
        <Link to="/login" style={styles.link}>Login</Link>
        <Link to="/signup" style={styles.link}>Signup</Link>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    alignItems: 'center',
    borderBottom: '1px solid #1e293b'
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#38bdf8'
  },
  links: {
    display: 'flex',
    gap: '1.5rem'
  },
  link: {
    color: '#e2e8f0',
    textDecoration: 'none',
    fontWeight: '500'
  }
};

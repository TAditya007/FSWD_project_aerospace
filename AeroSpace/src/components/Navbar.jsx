import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (item) => {
    setMobileMenuOpen(false);
    if (item.path) {
      navigate(item.path);
      return;
    }
    const element = document.getElementById(item.id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(item.id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  const navItems = [
    { label: 'Intro',            id: 'hero' },
    { label: 'Intelligence',     id: 'intelligence' },
    { label: 'Capabilities',     id: 'capabilities' },
    { label: 'Technology',       id: 'technology' },
    { label: 'Global Orbit',     id: 'global' },
    { label: 'Modules & Cipher', id: 'modules' },
    { label: 'Contact Us',       id: 'contact' },
  ];

  return (
    <header className={`aero-navbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="nav-container">

        {/* Brand Logo & Telemetry Status Pill */}
        <div className="nav-brand-group">
          <div className="nav-brand" onClick={() => handleNavClick({ id: 'hero' })}>
            <span className="nav-logo-text">AEROSPEC</span>
          </div>

          <div className="nav-status-pill">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 8px #00f5ff' }} />
            <span>24/7 ORBITAL RELAY</span>
          </div>
        </div>

        {/* Desktop Monospaced Nav Links */}
        <nav className="nav-links-desktop">
          {navItems.map((item) => (
            <button
              key={item.label}
              className="nav-link-btn"
              onClick={() => handleNavClick(item)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="nav-actions-desktop" style={{ display: 'flex', gap: '12px' }}>
          <button className="btn is-dark" onClick={() => navigate('/login')}>
            Sign In
          </button>
          <button className="btn is-orange" onClick={() => navigate('/signup')}>
            Join Crew
          </button>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'transparent', border: 'none', color: '#ffedd6', cursor: 'pointer', display: 'none' }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="nav-mobile-menu">
          {navItems.map((item) => (
            <button
              key={item.label}
              className="nav-mobile-link"
              onClick={() => handleNavClick(item)}
            >
              {item.label}
            </button>
          ))}
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button className="btn is-dark" style={{ flex: 1 }} onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
              Sign In
            </button>
            <button className="btn is-orange" style={{ flex: 1 }} onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }}>
              Join Crew
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

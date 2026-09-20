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
    { label: 'Powered by AI*',   id: 'ai-parody' },
    { label: 'Features',         id: 'features' },
    { label: 'Cipher',           id: 'cipher' },
    { label: 'Product Matrix',   id: 'tiers' },
    { label: 'SOTA Model',       id: 'open-weight' },
    { label: 'Reviews',          id: 'reviews' },
    { label: 'Contact',          id: 'contact' },
  ];

  return (
    <header className="aero-navbar">
      <div className="nav-container">

        {/* Brand Logo & Telemetry Status Pill */}
        <div className="nav-brand-group">
          <div className="nav-brand" onClick={() => handleNavClick({ id: 'hero' })}>
            <span className="nav-logo-text">AEROSPEC</span>
          </div>

          <div className="nav-status-pill">
            <span>24/7 ONLINE</span>
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
      </div>
    </header>
  );
}

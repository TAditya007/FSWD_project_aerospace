import { useState } from 'react';
import { ArrowUp, Radio, Shield, Globe, Copy, Check, Send, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 3000);
  };

  return (
    <footer className="aero-footer">
      {/* Oryzo-Style Viral Punchline Header Banner */}
      <div className="footer-viral-banner">
        <div className="viral-banner-content">
          <h2 className="viral-title">
            We caught your attention with an unnecessarily sophisticated paper plane telemetry pod.
          </h2>
          <p className="viral-subtitle">
            If we can market a paper aeroplane, imagine what we can do for your aerospace mission.
          </p>
        </div>
      </div>

      <div className="footer-main-container">
        <div className="footer-grid">
          
          {/* Col 1: Brand & Copy URL */}
          <div className="footer-col-brand">
            <div className="footer-logo" onClick={scrollToTop}>
              <Radio size={20} className="text-sky" />
              <span className="footer-logo-text">AEROSPEC</span>
            </div>
            <p className="footer-brand-desc">
              Built with <Heart size={14} className="heart-icon" /> by AeroSpace Lab.
              Share with fellow operators if you enjoyed the flight!
            </p>
            <button className="copy-url-btn" onClick={handleCopyUrl}>
              {copiedUrl ? <Check size={14} className="icon-cyan" /> : <Copy size={14} />}
              <span>{copiedUrl ? 'Link Copied!' : 'Copy Site URL'}</span>
            </button>
          </div>

          {/* Col 2: Navigation */}
          <div className="footer-col">
            <h5 className="footer-col-title">MISSION NAVIGATION</h5>
            <ul className="footer-link-list">
              <li><button onClick={scrollToTop} className="footer-link">Intro</button></li>
              <li><button onClick={() => navigate('/login')} className="footer-link">Sign In</button></li>
              <li><button onClick={() => navigate('/signup')} className="footer-link">Register Crew</button></li>
              <li><button onClick={() => navigate('/user/dashboard')} className="footer-link">User Dashboard</button></li>
            </ul>
          </div>

          {/* Col 3: Newsletter Sign up */}
          <div className="footer-col-newsletter">
            <h5 className="footer-col-title">FLIGHT DISPATCH NEWSLETTER</h5>
            <p className="newsletter-desc">Subscribe for telemetry updates & paper plane flight logs:</p>
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input
                type="email"
                className="newsletter-input"
                placeholder="operator@aerospace.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="newsletter-btn">
                {subscribed ? <Check size={16} /> : <Send size={16} />}
              </button>
            </form>
            {subscribed && <span className="newsletter-success">Subscribed to AeroSpec updates!</span>}
          </div>

        </div>

        {/* Satirical Parody Disclaimer */}
        <div className="footer-parody-disclaimer">
          <p>
            <strong>Disclaimer:</strong> This page includes a fictional creative parody project by AeroSpace.
            AeroSpec-1 is a satirical homage to AI hardware product launches. All extreme aerodynamic claims are for entertainment & inspiration purposes.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-copyright">
            © {new Date().getFullYear()} AeroSpace Technologies Inc. All rights reserved.
          </div>
          <button className="btn-back-to-top" onClick={scrollToTop} aria-label="Back to Top">
            <span>TOP</span>
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
}

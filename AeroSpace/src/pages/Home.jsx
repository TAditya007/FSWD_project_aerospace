import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Radio, 
  Cpu, 
  Activity, 
  Wifi, 
  RefreshCw, 
  Copy, 
  Check, 
  Box, 
  FileText, 
  AlertTriangle, 
  Globe, 
  Compass, 
  MapPin, 
  Sliders, 
  ChevronRight, 
  Satellite, 
  Shield, 
  Zap, 
  Eye, 
  Code,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import SpaceScene from '../components/home/SpaceScene';
import Navbar from '../components/Navbar';
import { LiveTelemetryBadge, TargetLockIndicator, MissionHUDCard } from '../components/home/HomeHUD';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  // Scroll Progress Tracking (0.0 to 1.0)
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(0);

  // Smart Flip Encryption Cipher State
  const [inputText, setInputText] = useState('AEROSPEC');
  const [displayText, setDisplayText] = useState('AEROSPEC');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Thermodynamic Slider State
  const [tempSetting, setTempSetting] = useState(1);

  // Hardware Tier Tab State
  const [tierIdx, setTierIdx] = useState(0);

  // Copy State
  const [copiedBib, setCopiedBib] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Active Mission Intelligence Category (0 to 3)
  const [intelCategory, setIntelCategory] = useState(0);

  // Track Window Scroll for Continuous 3D Scene Interpolation
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Encrypt Flip Action
  const handleFlip = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const CIPHER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ΔΨΩΣΠΞ#$@%&*!';
    const target = isEncrypted 
      ? inputText 
      : inputText.split('').map(c => c === ' ' ? ' ' : CIPHER[Math.floor(Math.random() * CIPHER.length)]).join('');

    let step = 0;
    const interval = setInterval(() => {
      setDisplayText(prev => 
        prev.split('').map((c, i) => i < step ? target[i] : CIPHER[Math.floor(Math.random() * CIPHER.length)]).join('')
      );
      step++;
      if (step > target.length + 5) {
        clearInterval(interval);
        setDisplayText(target);
        setIsEncrypted(!isEncrypted);
        setIsAnimating(false);
      }
    }, 40);
  };

  const bibtexCode = `@misc{aerospec2026,
  title        = {AeroSpec-1: Open-Weight Aeroplane & Telemetry Pod Model},
  author       = {AeroSpace Creative Studio},
  year         = {2026},
  howpublished = {OBJ mesh release},
  note         = {A high-fidelity 3D model of a paper aeroplane with RF telemetry pod. Code: coming soon.}
}`;

  const handleCopyBib = () => {
    navigator.clipboard.writeText(bibtexCode);
    setCopiedBib(true);
    setTimeout(() => setCopiedBib(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const categories = [
    {
      title: 'Climate & Environment',
      tag: 'EARTH OBSERVATION',
      desc: 'High-cadence multispectral telemetry tracking atmospheric methane plumes, polar ice volume changes, and sea surface temperature anomalies.',
      metrics: [
        { label: 'CO₂ FLUX', val: '421.4 PPM', color: '#10b981' },
        { label: 'ICE MELT RES', val: '0.04 MM/YR', color: '#00f5ff' },
        { label: 'COVERAGE', val: '100% GLOBAL', color: '#38bdf8' }
      ]
    },
    {
      title: 'Disaster Management',
      tag: 'RAPID RESPONSE',
      desc: 'Sub-meter thermal infrared and optical reconnaissance delivering autonomous wildfire early warning, flood boundary mapping, and post-seismic assessment.',
      metrics: [
        { label: 'THERMAL LATENCY', val: '12 SEC', color: '#ff5722' },
        { label: 'SWATH WIDTH', val: '180 KM', color: '#f59e0b' },
        { label: 'INCIDENT LOCK', val: 'AUTOMATIC', color: '#10b981' }
      ]
    },
    {
      title: 'Agriculture Intelligence',
      tag: 'MULTISPECTRAL NDVI',
      desc: 'Hyperspectral vegetation indexing, soil moisture radar profiling, and automated crop yield predictions enabling algorithmic planetary resource governance.',
      metrics: [
        { label: 'NDVI INDEX', val: '0.78 HIGH', color: '#10b981' },
        { label: 'SOIL MOISTURE', val: '32% OPTIMAL', color: '#00f5ff' },
        { label: 'SURVEY INTERVAL', val: '4 HOURS', color: '#f59e0b' }
      ]
    },
    {
      title: 'Urban Infrastructure & SAR',
      tag: 'SYNTHETIC APERTURE RADAR',
      desc: 'Interferometric SAR tracking millimeter-level ground subsidence, structural integrity of bridges and dams, and nighttime economic radiance density.',
      metrics: [
        { label: 'SAR PRECISION', val: '±1.2 MM', color: '#00f5ff' },
        { label: 'STRUCTURAL RISK', val: 'ZERO ALERT', color: '#10b981' },
        { label: 'NIGHT RADIANCE', val: '98.6 W/SR', color: '#f59e0b' }
      ]
    }
  ];

  const products = [
    {
      name: 'AEROSPEC',
      headline: 'One plane. One mission. Done beautifully.',
      desc: 'The original RF paper plane. Refined until it feels inevitable. Lifts just enough, glides just right, and quietly beams telemetry like it was never there.',
      stack: '1 Layer Wing',
      lift: '1 Plane Thick',
      material: 'Aerospace Poly-Paper',
      connectivity: '2.4 GHz Telemetry',
      pairing: 'Not Required',
      updates: 'Never (Perfect by design)',
      bestFor: 'Daily flights and quiet desks'
    },
    {
      name: 'AEROSPEC Pro',
      headline: 'Twice the wings. Double the telemetry.',
      desc: 'A biplane with double presence. Twice the paper, double the flight stability - without losing the plot.',
      stack: '2 Layer Biplane',
      lift: '2 Planes Thick',
      material: 'Dual-Layer Carbon Matrix',
      connectivity: '2.4 / 5.8 GHz Dual-Band',
      pairing: 'Not Required',
      updates: 'Never',
      bestFor: 'Taller trajectories & extra stability'
    },
    {
      name: 'AEROSPEC Pro Max',
      headline: 'Maximum stack for maximum unnecessary satisfaction.',
      desc: 'Triplane stack for maximum aerodynamic supremacy. A bold pedestal for your flight log and a quiet flex for the entire ground control command.',
      stack: '3 Layer Triplane',
      lift: '3 Planes Thick',
      material: 'Titanium-Kevlar Foil',
      connectivity: 'Multi-Band RF & Sub-GHz',
      pairing: 'Not Required',
      updates: 'Never',
      bestFor: 'Maximum lift & supersonic presence'
    }
  ];

  return (
    <div className="home-root">
      {/* ════════════════════════════════════════════════════════════
          1. PERSISTENT CONTINUOUS 3D SPACE UNIVERSE
          Single shared Three.js scene reacting to scrollProgress (0 to 1)
         ════════════════════════════════════════════════════════════ */}
      <SpaceScene 
        scrollProgress={scrollProgress} 
        onStageChange={(stage) => setActiveStage(stage)} 
      />

      {/* ════════════════════════════════════════════════════════════
          2. GLASS NAVIGATION BAR
         ════════════════════════════════════════════════════════════ */}
      <Navbar />

      {/* ════════════════════════════════════════════════════════════
          STAGE 0 / SECTION 1: CINEMATIC HERO (#hero)
         ════════════════════════════════════════════════════════════ */}
      <section id="hero" className="home-stage-hero">
        <div className="home-container hero-flex-layout">
          
          {/* Left Column: Hero Mission Intelligence */}
          <div className="hero-text-column">
            <div className="hero-eyebrow-pill">
              <span className="live-dot-cyan" />
              <span>ORBITAL RECONNAISSANCE PLATFORM // NORAD ID 59142</span>
            </div>

            <h1 className="hero-main-heading">
              AEROSPEC<br />
              <span className="text-gradient-cyan">MISSION CONTROL</span>
            </h1>

            <p className="hero-main-description">
              Real-time sub-GHz telemetry, constellation tracking, and deep-space orbital intelligence. 
              Experience seamless planetary surveillance rendered continuously as you travel across low Earth orbit.
            </p>

            <div className="hero-actions-row">
              <button className="btn is-orange" onClick={() => navigate('/signup')}>
                <span>Get Started</span>
                <ArrowRight size={15} />
              </button>
              
              <button 
                className="btn is-dark" 
                onClick={() => {
                  const el = document.getElementById('intelligence');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Compass size={15} />
                <span>Explore Orbit ↓</span>
              </button>
            </div>

            {/* Real-Time Telemetry Stat HUD Bar */}
            <div className="hero-telemetry-hud-card">
              <div className="telemetry-item">
                <span className="telemetry-label">ORBIT REGIME</span>
                <strong className="telemetry-value val-cyan">LEO (540 KM)</strong>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-label">INCLINATION</span>
                <strong className="telemetry-value val-amber">53.2°</strong>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-label">ORBIT VELOCITY</span>
                <strong className="telemetry-value val-emerald">7.62 KM/S</strong>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-label">RF LINK STATUS</span>
                <strong className="telemetry-value val-cyan">NOMINAL LOCK</strong>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Target Lock HUD Overlay */}
          <div className="hero-floating-hud-column">
            <div className="floating-hud-wrapper">
              <LiveTelemetryBadge 
                callsign="AEROSPEC-SAT-01" 
                noradId="NORAD-59142" 
                orbit="LEO 540 KM // 53.2°" 
              />
              
              <div style={{ marginTop: '16px' }}>
                <TargetLockIndicator label="3D PLANETARY TRACK" status="TARGET LOCKED" />
              </div>

              <div className="floating-quick-telemetry">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#8c857b', fontFamily: 'var(--font-mono)' }}>SUB-GHZ TRANSCEIVER</span>
                  <span style={{ fontSize: '11px', color: '#00f5ff', fontFamily: 'var(--font-mono)' }}>440.920 MHz</span>
                </div>
                <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '92%', height: '100%', background: 'linear-gradient(90deg, #00f5ff, #10b981)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: '#8c857b', fontFamily: 'var(--font-mono)' }}>
                  <span>SNR: +18.4 dB</span>
                  <span>BER &lt; 10⁻¹²</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="scroll-invitation-badge">
          <span>SCROLL DOWN TO INITIATE ORBITAL FLIGHT PATH</span>
          <span className="scroll-chevron">↓</span>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          STAGE 1 / SECTION 2: SPACE INTELLIGENCE (#intelligence)
         ════════════════════════════════════════════════════════════ */}
      <section id="intelligence" className="home-stage-section">
        <div className="home-container">
          <div className="section-header-block">
            <div className="section-eyebrow">CONTINUOUS ORBITAL SURVEILLANCE</div>
            <h2 className="section-headline">A NEW ERA OF SPACE INTELLIGENCE</h2>
            <p className="section-subtext">
              Autonomous satellite sensors deliver continuous planetary insights. Explore live operational categories below.
            </p>
          </div>

          <div className="intel-split-layout">
            {/* Category Selector Tabs */}
            <div className="intel-category-nav">
              {categories.map((cat, idx) => (
                <button
                  key={cat.title}
                  className={`intel-tab-btn ${intelCategory === idx ? 'is-active' : ''}`}
                  onClick={() => setIntelCategory(idx)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="intel-tab-title">{cat.title}</span>
                    <ChevronRight size={16} className="intel-chevron" />
                  </div>
                  <span className="intel-tab-tag">{cat.tag}</span>
                </button>
              ))}
            </div>

            {/* Active Category Display Panel */}
            <div className="intel-active-card-wrap">
              <MissionHUDCard 
                icon={Radio}
                title={categories[intelCategory].title}
                desc={categories[intelCategory].desc}
                tag={categories[intelCategory].tag}
                metrics={categories[intelCategory].metrics}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          STAGE 2 / SECTION 3: CORE CAPABILITIES (#capabilities)
         ════════════════════════════════════════════════════════════ */}
      <section id="capabilities" className="home-stage-section">
        <div className="home-container">
          <div className="section-header-block">
            <div className="section-eyebrow">AEROSPACE ARCHITECTURE</div>
            <h2 className="section-headline">BUILT FOR BIGGER MISSIONS</h2>
            <p className="section-subtext">
              Engineered for zero-latency downlinks, deep-space telemetry relay, and multi-tenant fleet command.
            </p>
          </div>

          <div className="capabilities-grid-4">
            <MissionHUDCard 
              icon={Activity}
              title="Real-Time Telemetry"
              desc="Sub-second downlink latency with GMSK modulation and AES-256-GCM hardware cipher encryption across all ground nodes."
              tag="LOW LATENCY"
              metrics={[
                { label: 'DOWNLINK', val: '0.12s', color: '#00f5ff' },
                { label: 'ENCRYPTION', val: 'AES-256', color: '#10b981' }
              ]}
            />

            <MissionHUDCard 
              icon={Cpu}
              title="Advanced Analytics"
              desc="Orbital trajectory interpolation, automated collision avoidance vectors, and atmospheric density drag modeling."
              tag="AI FLIGHT OPS"
              metrics={[
                { label: 'ACCURACY', val: '99.98%', color: '#38bdf8' },
                { label: 'PREDICTION', val: '72H AHEAD', color: '#f59e0b' }
              ]}
            />

            <MissionHUDCard 
              icon={Globe}
              title="Global Coverage"
              desc="360° inclined orbital constellation mesh with cross-satellite laser data links eliminating ground tracking deadzones."
              tag="MESH RELAY"
              metrics={[
                { label: 'SAT NODES', val: '24 FLEET', color: '#10b981' },
                { label: 'BLIND ZONES', val: 'ZERO', color: '#00f5ff' }
              ]}
            />

            <MissionHUDCard 
              icon={ShieldCheck}
              title="Mission Control"
              desc="Multi-tenant role-based access control, cryptographic data sheet export, and instant 2FA verified credential security."
              tag="SECURE RBAC"
              metrics={[
                { label: 'AUTH', val: '2FA OTP', color: '#10b981' },
                { label: 'UPTIME', val: '99.99%', color: '#00f5ff' }
              ]}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          STAGE 3 / SECTION 4: TECHNOLOGY THAT GOES FURTHER (#technology)
         ════════════════════════════════════════════════════════════ */}
      <section id="technology" className="home-stage-section">
        <div className="home-container">
          <div className="tech-split-container">
            
            {/* Left: Satellite Close-Up Telemetry HUD */}
            <div className="tech-hud-overview">
              <div className="tech-badge-title">
                <Satellite size={18} color="#00f5ff" />
                <span>ORBITAL HARDWARE ARCHITECTURE</span>
              </div>

              <div className="tech-telemetry-spec-box">
                <h3 style={{ margin: 0, color: '#ffedd6', fontSize: '20px', fontFamily: 'var(--font-mono)' }}>
                  AEROSPEC BUS // SERIES-IV
                </h3>
                <p style={{ margin: '8px 0 16px', fontSize: '13px', color: '#8c857b' }}>
                  Articulated dual-axis photovoltaic arrays, high-gain parabolic transceiver, and radiation-hardened flight controllers.
                </p>

                <div className="tech-spec-rows">
                  <div className="tech-row">
                    <span className="row-label">POWER EFFICIENCY</span>
                    <span className="row-val val-emerald">98.4% [GaAs Solar Cells]</span>
                  </div>
                  <div className="tech-row">
                    <span className="row-label">TRANSMIT GAIN</span>
                    <span className="row-val val-cyan">+18.5 dBm Nominal</span>
                  </div>
                  <div className="tech-row">
                    <span className="row-label">PROPULSION</span>
                    <span className="row-val val-amber">Cold-Gas Micro-Thrusters</span>
                  </div>
                  <div className="tech-row">
                    <span className="row-label">PAYLOAD CAPACITY</span>
                    <span className="row-val val-cyan">15 Multi-Band Telemetry Pods</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: 4 Technology Pillars */}
            <div className="tech-pillars-column">
              <div className="section-header-block" style={{ textAlign: 'left', marginBottom: '24px' }}>
                <div className="section-eyebrow">PROPULSION & DATA RELAY</div>
                <h2 className="section-headline">TECHNOLOGY THAT GOES FURTHER</h2>
              </div>

              <div className="tech-pillars-list">
                <div className="tech-pillar-item">
                  <div className="pillar-icon"><Zap size={20} /></div>
                  <div>
                    <h4>AI-Driven Autonomy</h4>
                    <p>On-board algorithmic anomaly detection continuously rectifies Keplerian orbital decay and drift.</p>
                  </div>
                </div>

                <div className="tech-pillar-item">
                  <div className="pillar-icon"><Radio size={20} /></div>
                  <div>
                    <h4>24/7 Orbital Monitoring</h4>
                    <p>Uninterrupted sub-GHz telemetry streaming with Doppler shift correction and parity lock.</p>
                  </div>
                </div>

                <div className="tech-pillar-item">
                  <div className="pillar-icon"><Globe size={20} /></div>
                  <div>
                    <h4>Global Constellation Coverage</h4>
                    <p>Equatorial and polar trajectories ensure complete sensor illumination of every square kilometer.</p>
                  </div>
                </div>

                <div className="tech-pillar-item">
                  <div className="pillar-icon"><Shield size={20} /></div>
                  <div>
                    <h4>Secure & Cryptographically Verified</h4>
                    <p>End-to-end AES-256 payload encryption with instant verified cryptographic data sheet exports.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          STAGE 4 / SECTION 5: GLOBAL / EARTH SECTION (#global)
         ════════════════════════════════════════════════════════════ */}
      <section id="global" className="home-stage-section">
        <div className="home-container">
          <div className="section-header-block">
            <div className="section-eyebrow">GLOBAL EARTH OBSERVATION</div>
            <h2 className="section-headline">A SAFER, GREENER TOMORROW</h2>
            <p className="section-subtext">
              Planetary lifelines monitored in real time from sun-synchronous orbit with sub-meter spatial precision.
            </p>
          </div>

          <div className="global-markers-grid">
            <div className="global-marker-card">
              <span className="marker-index">01</span>
              <h4>Atmospheric Aerosol Density</h4>
              <p>Continuous ultraviolet/visible limb sounding verifying global air quality and ozone recovery.</p>
              <span className="marker-status val-emerald">99.4% OPTIMAL SENSOR NOMINAL</span>
            </div>

            <div className="global-marker-card">
              <span className="marker-index">02</span>
              <h4>Ocean Circulation Radar</h4>
              <p>Altimetric surface radar profiling deep-ocean thermohaline circulation vectors and heat anomalies.</p>
              <span className="marker-status val-cyan">CURRENT DYNAMICS STABLE</span>
            </div>

            <div className="global-marker-card">
              <span className="marker-index">03</span>
              <h4>Geostationary Space Weather</h4>
              <p>Solar flare geomagnetic storm indices tracked with early warning downlink to ground electrical grids.</p>
              <span className="marker-status val-amber">SOLAR ACTIVITY: LOW (KP-1)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          STAGE 5 / SECTION 6: SECONDARY MODULES & TOOLS (#modules)
          Preserving Smart Flip Cipher, Gain Slider, Product Matrix, SOTA Model & Reviews
         ════════════════════════════════════════════════════════════ */}
      <section id="modules" className="home-stage-section">
        <div className="home-container">
          <div className="section-header-block">
            <div className="section-eyebrow">MISSION TOOLKIT & VERIFIED AUDITS</div>
            <h2 className="section-headline">SECONDARY MODULES & FLIGHT MATRIX</h2>
            <p className="section-subtext">
              Interactive flight tools, hardware tiers, open-weight research models, and verified operator evaluations.
            </p>
          </div>

          {/* Module A: Smart Flip Encryption Tool */}
          <div className="module-interactive-card">
            <div className="module-header-pill">
              <Radio size={14} color="#ff5722" />
              <span>SMART FLIP ENCRYPTION CIPHER</span>
            </div>
            <h3 style={{ margin: '8px 0 12px', fontSize: '22px', color: '#ffedd6' }}>
              Cryptographic Message Scrambler
            </h3>
            <p style={{ color: '#c9bbaa', fontSize: '14px', maxWidth: '600px', margin: '0 auto 20px' }}>
              Write an aerospace callsign or coordinate message. Flip to scramble and encode in real time.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <input
                type="text"
                className="encryption-input"
                value={inputText}
                maxLength={16}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setInputText(val);
                  if (!isEncrypted) setDisplayText(val);
                }}
              />

              <div className="encryption-scramble-output">
                {displayText}
              </div>

              <button className="btn is-orange" onClick={handleFlip} disabled={isAnimating}>
                <RefreshCw size={15} className={isAnimating ? 'spin-icon' : ''} />
                <span>{isEncrypted ? 'Decode Message' : 'Encode Message'}</span>
              </button>
            </div>
          </div>

          {/* Module B: Thermodynamic & Carrier Gain Slider */}
          <div className="module-interactive-card" style={{ marginTop: '32px' }}>
            <div className="module-header-pill">
              <Sliders size={14} color="#00f5ff" />
              <span>RF CARRIER NOISE & TEMPERATURE SLIDER</span>
            </div>

            <div className="temp-slider-tabs" style={{ margin: '16px auto 14px' }}>
              <button 
                className={`temp-btn ${tempSetting === 0 ? 'is-active' : ''}`}
                onClick={() => setTempSetting(0)}
              >
                Creative T = 10
              </button>
              <button 
                className={`temp-btn ${tempSetting === 1 ? 'is-active' : ''}`}
                onClick={() => setTempSetting(1)}
              >
                Balanced T = 1.0
              </button>
              <button 
                className={`temp-btn ${tempSetting === 2 ? 'is-active' : ''}`}
                onClick={() => setTempSetting(2)}
              >
                Deterministic T = 0.1
              </button>
            </div>

            <div className="temp-math-formula">
              {tempSetting === 0 && <code>fd = (vr / c) · f0  [Max Atmospheric Variance]</code>}
              {tempSetting === 1 && <code>P_rx = P_tx + G_tx + G_rx - FSPL  [Carrier Parity Lock]</code>}
              {tempSetting === 2 && <code>{"BER < 10⁻¹²  [Deterministic Zero Bit-Error Downlink]"}</code>}
            </div>
          </div>

          {/* Module C: Hardware Matrix Table */}
          <div className="module-interactive-card" style={{ marginTop: '32px', textAlign: 'left' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div className="module-header-pill">
                <Box size={14} color="#f59e0b" />
                <span>AEROSPEC HARDWARE MATRIX</span>
              </div>
              <h3 style={{ margin: '8px 0 0', color: '#ffedd6', fontSize: '20px' }}>
                Multi-Tier Hardware Specifications
              </h3>
            </div>

            <div className="product-option-tabs" style={{ justifyContent: 'center', marginBottom: '20px' }}>
              {products.map((p, idx) => (
                <button
                  key={idx}
                  className={`btn is-dark ${tierIdx === idx ? 'is-active' : ''}`}
                  onClick={() => setTierIdx(idx)}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <table className="compare-matrix-table">
              <thead>
                <tr>
                  <th>AEROSPEC</th>
                  <th>AEROSPEC Pro</th>
                  <th>AEROSPEC Pro Max</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Stack:</strong> {products[0].stack}</td>
                  <td><strong>Stack:</strong> {products[1].stack}</td>
                  <td><strong>Stack:</strong> {products[2].stack}</td>
                </tr>
                <tr>
                  <td><strong>Lift:</strong> {products[0].lift}</td>
                  <td><strong>Lift:</strong> {products[1].lift}</td>
                  <td><strong>Lift:</strong> {products[2].lift}</td>
                </tr>
                <tr>
                  <td><strong>Material:</strong> {products[0].material}</td>
                  <td><strong>Material:</strong> {products[1].material}</td>
                  <td><strong>Material:</strong> {products[2].material}</td>
                </tr>
                <tr>
                  <td><strong>Telemetry:</strong> {products[0].connectivity}</td>
                  <td><strong>Telemetry:</strong> {products[1].connectivity}</td>
                  <td><strong>Telemetry:</strong> {products[2].connectivity}</td>
                </tr>
                <tr>
                  <td><strong>Firmware:</strong> {products[0].updates}</td>
                  <td><strong>Firmware:</strong> {products[1].updates}</td>
                  <td><strong>Firmware:</strong> {products[2].updates}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Module D: Open-Weight SOTA Model & BibTeX */}
          <div className="module-interactive-card" style={{ marginTop: '32px' }}>
            <div className="module-header-pill">
              <FileText size={14} color="#00f5ff" />
              <span>SOTA OPEN-WEIGHT MODEL</span>
            </div>
            <h3 style={{ margin: '8px 0 12px', fontSize: '24px', color: '#ffedd6', fontFamily: 'var(--font-mono)' }}>
              AEROSPEC-1
            </h3>
            <p style={{ color: '#c9bbaa', fontSize: '13px', maxWidth: '640px', margin: '0 auto 18px' }}>
              Open-weight 3D model of our telemetry aerodynamic pod for rendering and physical flight simulation.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <button className="btn is-dark" onClick={() => alert('Downloading AeroSpec-1 Technical PDF...')}>
                <FileText size={15} /> <span>Paper (PDF)</span>
              </button>
              <button className="btn is-dark" onClick={() => alert('Downloading AeroSpec-1 Mesh OBJ...')}>
                <Box size={15} /> <span>Model (.OBJ)</span>
              </button>
            </div>

            <pre className="bibtex-pre-block">{bibtexCode}</pre>

            <button className="btn is-dark" onClick={handleCopyBib} style={{ marginTop: '16px' }}>
              {copiedBib ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedBib ? 'Copied' : 'Copy BibTeX Citation'}</span>
            </button>
          </div>

          {/* Module E: Verified Operator Testimonies */}
          <div className="module-interactive-card" style={{ marginTop: '32px', textAlign: 'left' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div className="module-header-pill">
                <Sparkles size={14} color="#10b981" />
                <span>OPERATOR EVALUATIONS [ 4.9 / 5.0 ]</span>
              </div>
              <h3 style={{ margin: '8px 0 0', color: '#ffedd6', fontSize: '20px' }}>
                Global Mission Crew Reviews
              </h3>
            </div>

            <div className="testimonies-table-container">
              <div className="testimonies-row">
                <div>
                  <div className="testimonies-quote">
                    "This is the <span style={{ color: '#00f5ff' }}>best telemetry platform</span> I've ever deployed. Unbeatable orbital visuals."
                  </div>
                  <div className="testimonies-author">Edan K. — NASA astronaut wannabe</div>
                </div>
                <div className="sub2" style={{ color: '#10b981' }}>[ 5.0/5 ]</div>
              </div>

              <div className="testimonies-row">
                <div>
                  <div className="testimonies-quote">
                    "My plane? If you want it, I'll let you have it. Look for it! I left everything together in <span style={{ color: '#f59e0b' }}>one place!</span>"
                  </div>
                  <div className="testimonies-author">Gol D. Roger — Old-school Pirate & Aviator</div>
                </div>
                <div className="sub2" style={{ color: '#10b981' }}>[ 4.5/5 ]</div>
              </div>

              <div className="testimonies-row">
                <div>
                  <div className="testimonies-quote">
                    "<span style={{ color: '#ff5722' }}>We are so cooked</span>. Hollywood is not ready for a telemetry cockpit this cinematic."
                  </div>
                  <div className="testimonies-author">Jamie R. — AI influencer, Ex-Web3 developer</div>
                </div>
                <div className="sub2" style={{ color: '#10b981' }}>[ 5.0/5 ]</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          STAGE 6 / SECTION 7: FINAL MISSION CTA (#contact)
          Preserving the satirical closing concept, Join Crew & Copy URL
         ════════════════════════════════════════════════════════════ */}
      <footer id="contact" className="home-stage-footer">
        <div className="home-container">
          <div className="footer-hud-box">
            
            <div className="footer-status-tag">
              <span className="live-dot-cyan" />
              <span>ORBITAL VOYAGE COMPLETE // ALL SYSTEMS NOMINAL</span>
            </div>

            <h2 className="footer-closing-headline">
              We caught your attention with a non-existent product.<br />
              <span className="text-gradient-cyan">Imagine what we can build for your aerospace brand.</span>
            </h2>

            <div className="footer-closing-sub">
              AeroSpace Creative Lab // Next-Generation Mission Interfaces
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', margin: '32px 0 36px', flexWrap: 'wrap' }}>
              <button className="btn is-orange" onClick={() => navigate('/signup')}>
                <span>Join Mission Crew</span>
                <ArrowRight size={15} />
              </button>
              
              <button className="btn is-dark" onClick={handleCopyUrl}>
                {copiedUrl ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedUrl ? 'Copied Link' : 'Copy Project URL'}</span>
              </button>
            </div>

            <div className="o-dashline" style={{ maxWidth: '800px', margin: '0 auto 24px' }} />

            <div className="footer-disclaimer-note">
              This entire site is a fictional creative project by AeroSpace. AeroSpec doesn't exist. 
              No products are for sale. All claims are satirical and for entertainment purposes only.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

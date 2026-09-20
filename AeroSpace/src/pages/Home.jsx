import { useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  Star, 
  AlertTriangle, 
  FileText, 
  Zap,
  CheckCircle2,
  Cpu,
  Radio,
  Sliders,
  Flame,
  ArrowRight,
  Hand,
  Play,
  Lock,
  Unlock,
  RefreshCw,
  Copy,
  Check,
  Box,
  Code,
  Wind,
  Volume2,
  VolumeX,
  Eye,
  Activity,
  Compass,
  RotateCw
} from 'lucide-react';
import AeroCanvas from '../components/AeroCanvas';

import Navbar from '../components/Navbar';

export default function Home() {
  const navigate = useNavigate();

  // Interstellar Endurance Assembly States
  const [assemblyStatus, setAssemblyStatus] = useState({
    dockedCount: 0,
    totalModules: 12,
    percent: 0,
    currentPodName: 'RANGER & CENTRAL DOCKING HUB',
    isComplete: false,
  });
  const [manualProgress, setManualProgress] = useState(null); // null = scroll driven
  const [isSpinning, setIsSpinning] = useState(true);

  // Smart Encryptor state
  const [inputText, setInputText] = useState('AEROSPEC');
  const [displayText, setDisplayText] = useState('AEROSPEC');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Temperature Slider State
  const [tempSetting, setTempSetting] = useState(1); // 0: T=10, 1: T=1, 2: T=0.1

  // Hardware Tier State
  const [tierIdx, setTierIdx] = useState(0); // 0: AeroSpec, 1: AeroSpec Pro, 2: AeroSpec Pro Max

  // Copy BibTeX state
  const [copiedBib, setCopiedBib] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

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
      {/* Interstellar Endurance 3D Spaceship with Real-Time Scroll Modular Assembly */}
      <AeroCanvas 
        manualProgress={manualProgress}
        isSpinning={isSpinning}
        onAssemblyUpdate={(status) => setAssemblyStatus(status)}
      />

      {/* Navbar */}
      <Navbar />

      {/* ══════════════════════
          SECTION 1: HERO (#hero)
         ══════════════════════ */}
      <section id="hero" className="hero-section">
        <div className="o-container hero-grid-wrapper">
          <div className="hero-content-col">
            <div className="hero-top-tagline sub1">Interstellar Mission Architecture</div>
            <h1 className="hero-title-main">ENDURANCE</h1>
            <p className="hero-copy-body body1">
              Scroll down to watch the Endurance construct in real time. One by one, every habitation, laboratory, and propulsion pod docks into the 360° ring.
            </p>

            <div className="hero-card-box">
              <h4 className="hero-card-header">
                12-Module Endurance System<br />
                with Central Ranger Docking Bay.
              </h4>
              <div className="o-dashline" />
              <div className="hero-card-desc sub2">
                <span>Autonomous orbital assembly with 5.6 RPM centrifugal artificial gravity.</span>
              </div>
            </div>

            {/* Endurance Modular Assembly Cockpit HUD */}
            <div className="hero-3d-cockpit-panel">
              <div className="control-telemetry-badge">
                <span className={`telemetry-live-dot ${assemblyStatus.isComplete ? 'is-flaming' : ''}`} />
                <span className="sub2" style={{ color: assemblyStatus.isComplete ? '#00f5ff' : '#ffedd6' }}>
                  {assemblyStatus.isComplete 
                    ? 'ENDURANCE 100% ASSEMBLED // ALL 12 PODS LOCKED' 
                    : `ASSEMBLY IN PROGRESS: [ ${assemblyStatus.dockedCount} / 12 PODS DOCKED ] — ${assemblyStatus.percent}%`}
                </span>
                <span style={{ opacity: 0.3 }}>|</span>
                <span className="sub2" style={{ color: '#ff5722' }}>
                  {assemblyStatus.currentPodName}
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '4px', background: 'rgba(255, 237, 214, 0.15)', borderRadius: '2px', overflow: 'hidden', marginBottom: '14px' }}>
                <div style={{ width: `${assemblyStatus.percent}%`, height: '100%', background: '#ff5722', transition: 'width 0.25s ease' }} />
              </div>

              {/* Dynamic Telemetry HUD Row */}
              <div className="telemetry-stat-row">
                <div className="stat-pill">
                  <span className="stat-label">VESSEL</span>
                  <span className="stat-val" style={{ fontSize: '11px', color: '#ffedd6' }}>
                    ENDURANCE
                  </span>
                </div>
                <div className="stat-pill">
                  <span className="stat-label">DOCKED PODS</span>
                  <span className="stat-val" style={{ color: '#ff5722' }}>
                    {assemblyStatus.dockedCount} / 12
                  </span>
                </div>
                <div className="stat-pill">
                  <span className="stat-label">ARTIFICIAL GRAVITY</span>
                  <span className="stat-val" style={{ color: isSpinning ? '#00f5ff' : '#8c857b' }}>
                    {isSpinning ? '5.6 RPM (1g)' : '0 RPM (0g)'}
                  </span>
                </div>
                <div className="stat-pill">
                  <span className="stat-label">INTEGRITY</span>
                  <span className="stat-val" style={{ color: assemblyStatus.isComplete ? '#00f5ff' : '#ffedd6' }}>
                    {assemblyStatus.percent}%
                  </span>
                </div>
              </div>

              <div className="hero-btn-row">
                <button 
                  className="btn is-orange"
                  onClick={() => {
                    const next = Math.min(12, assemblyStatus.dockedCount + 1);
                    setManualProgress(next / 12);
                  }}
                  title="Manually dock next Endurance pod"
                >
                  <Layers size={15} />
                  <span>+ Dock Next Pod ({assemblyStatus.dockedCount}/12)</span>
                </button>

                <button 
                  className="btn is-dark"
                  onClick={() => setManualProgress(1.0)}
                  title="Instantly complete all 12 modules"
                >
                  <Sparkles size={15} />
                  <span>Complete Ship (100%)</span>
                </button>

                <button 
                  className="btn is-dark"
                  onClick={() => setManualProgress(null)}
                  title="Return to scroll-driven assembly"
                >
                  <Compass size={15} />
                  <span>{manualProgress === null ? 'Scroll Driven: ACTIVE' : 'Resume Scroll Sync'}</span>
                </button>

                <button 
                  className={`btn ${isSpinning ? 'is-orange' : 'is-dark'}`}
                  onClick={() => setIsSpinning(!isSpinning)}
                  title="Toggle 5.6 RPM artificial gravity rotation"
                >
                  <RefreshCw size={15} className={isSpinning ? 'spin-icon' : ''} />
                  <span>{isSpinning ? 'Spin: 5.6 RPM' : 'Stationary'}</span>
                </button>
              </div>

              <div className="drag-hint-box sub2">
                <Hand size={14} style={{ color: '#ff5722' }} />
                <span>SCROLL DOWN TO WATCH MODULES FLY IN & DOCK — DRAG TO ROTATE 360°</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════
          SECTION 2: POWERED BY AI* (#ai)
         ══════════════════════ */}
      <section id="ai-parody" className="ai-section">
        <div className="o-container">
          <h2 className="ai-pre-heading">isn't just <br />a paper plane.</h2>
          <div className="body1" style={{ margin: '16px 0' }}>
            AeroSpec isn’t just a plane. It’s the result of unprecedented AI<sup>*</sup> breakthroughs.
          </div>

          <h1 className="ai-title-giant">Powered by AI<sup>*</sup></h1>
          <div className="ai-tagline-model">AEROSPEC-1</div>

          <div className="ai-instruction-box">
            <Hand size={16} className="icon-gold" />
            <span>Try to hover hand / drag trajectory</span>
          </div>

          <div className="ai-desc-sub body1">
            AI fills in the gaps. We said pitch up 5°. It heard ninety.
          </div>

          <div className="ai-disclaimer-box">
            <span>* Altitude Indicators</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════
          SECTION 3: WEARABLE & MAGAZINE (#wearable)
         ══════════════════════ */}
      <section className="wearable-section">
        <div className="o-container">
          <h2 className="wearable-title">
            <span>So portable,</span> <span>it's flight ready</span>
          </h2>

          <div className="magazine-cover-box">
            <div className="magazine-issue">ISSUE NO. 00124</div>
            <h1 className="magazine-main-title">We Are So Cooked!</h1>
            <p className="body1" style={{ marginBottom: '24px' }}>
              AeroSpec is taking everyone's pilot jobs... and replacing them with AI paper planes!
            </p>

            <div className="magazine-warning-pill">
              <AlertTriangle size={18} className="icon-gold" />
              <span>Warning: This flight stunt was performed by professionals. Do not attempt at home.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════
          SECTION 4: FEATURES GRID & SLIDER (#features)
         ══════════════════════ */}
      <section id="features" className="features-section">
        <div className="o-container">
          <div className="features-items-grid">
            <div className="features-item-card">
              <div className="features-item-tagline">RISE ABOVE MEDIOCRITY</div>
              <h3 className="features-item-title">Elevate your flight experience</h3>
              <p className="features-item-desc">
                With a precision-engineered lift (exactly one paper-clip thick), AeroSpec doesn’t just hold your flight log - it elevates it. Literally. Above every boring ground station you’ve ever known.
              </p>
              <div className="o-dashline" />
              <code className="sub2">LIFT = ½ · ρ · v² · S · CL</code>
            </div>

            <div className="features-item-card">
              <div className="features-item-tagline">HANDLES EXTREMES WITH EASE</div>
              <h3 className="features-item-title">Thermodynamic stability</h3>
              <p className="features-item-desc">
                From piping-hot friction to sub-zero high-altitude air - AeroSpec stays perfectly stable. Your ground dish tapped out three miles ago.
              </p>
              <div className="o-dashline" />
              <code className="sub2">N = k · T · B  (Noise Floor -124 dBm)</code>
            </div>

            <div className="features-item-card">
              <div className="features-item-tagline">PERFECTLY PITCHED, SERIOUSLY</div>
              <h3 className="features-item-title">Now 37.9% More Aerodynamic</h3>
              <p className="features-item-desc">
                Our flight engineers recalibrated its loop circumference with disturbing levels of attention to detail - just because we could.
              </p>
              <div className="o-dashline" />
              <code className="sub2">RoPE: Roundness Optimization & Perimeter Engineering</code>
            </div>
          </div>

          {/* Temperature / Gain Slider */}
          <div className="temp-slider-container">
            <div className="sub2" style={{ marginBottom: '12px' }}>THERMODYNAMIC & CARRIER GAIN SLIDER</div>
            <div className="temp-slider-tabs">
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
        </div>
      </section>

      {/* ══════════════════════
          SECTION 5: SMART FLIP ENCRYPTION (#encryption)
         ══════════════════════ */}
      <section id="cipher" className="encryption-section">
        <div className="o-container">
          <div className="encryption-box">
            <div className="sub1" style={{ color: '#ff5722' }}>SECURE COMMUNICATIONS SIMPLIFIED</div>
            <h2 className="encryption-title">Smart flip encryption</h2>
            <p className="body2" style={{ marginBottom: '32px' }}>
              Write a message. Flip. Instantly secure - until someone flips it back. Genius.
            </p>

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
              <RefreshCw size={16} className={isAnimating ? 'spin-icon' : ''} />
              <span>{isEncrypted ? 'Decode Message' : 'Encode Message'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════
          SECTION 6: TESTIMONIES TABLE (#testimonies)
         ══════════════════════ */}
      <section id="reviews" className="testimonies-section">
        <div className="o-container">
          <div className="sub1" style={{ marginBottom: '12px' }}>Rating & Reviews</div>
          <h2 className="wearable-title" style={{ fontSize: '42px', marginBottom: '40px' }}>
            People all around the world love AeroSpec
          </h2>

          <div className="testimonies-table-container">
            <div className="testimonies-table-header">
              <div>Custom reviews [ 364 ]</div>
              <div style={{ color: '#ff5722' }}>★★★★★ [ 4.9/5 ]</div>
              <div>AEROSPEC in use</div>
            </div>

            <div className="testimonies-row">
              <div>
                <div className="testimonies-quote">
                  "This is the <span>best paper plane</span> I've ever used. I can't go to space without it."
                </div>
                <div className="testimonies-author">Edan K. — NASA astronaut wannabe</div>
              </div>
              <div className="sub2">[ 5.0/5 ]</div>
            </div>

            <div className="testimonies-row">
              <div>
                <div className="testimonies-quote">
                  "My plane? If you want it, I'll let you have it. Look for it! I left everything together in <span>one place!</span>"
                </div>
                <div className="testimonies-author">Gol D. Roger — Old-school Pirate & Aviator</div>
              </div>
              <div className="sub2">[ 4.5/5 ]</div>
            </div>

            <div className="testimonies-row">
              <div>
                <div className="testimonies-quote">
                  "<span>We are so cooked</span>. Hollywood is not ready for a telemetry pod this cinematic."
                </div>
                <div className="testimonies-author">Jamie R. — AI influencer, Ex-Web3 developer</div>
              </div>
              <div className="sub2">[ 5.0/5 ]</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════
          SECTION 7: PRODUCT COMPARISON MATRIX (#product)
         ══════════════════════ */}
      <section id="tiers" className="product-matrix-section">
        <div className="o-container">
          <div className="sub1" style={{ textAlign: 'center', marginBottom: '12px' }}>CHOOSE YOUR OWN</div>
          <h2 className="wearable-title" style={{ textAlign: 'center', marginBottom: '40px' }}>AEROSPEC HARDWARE MATRIX</h2>

          <div className="product-option-tabs">
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
                <td><strong>Firmware Updates:</strong> {products[0].updates}</td>
                <td><strong>Firmware Updates:</strong> {products[1].updates}</td>
                <td><strong>Firmware Updates:</strong> {products[2].updates}</td>
              </tr>
              <tr>
                <td><strong>Best For:</strong> {products[0].bestFor}</td>
                <td><strong>Best For:</strong> {products[1].bestFor}</td>
                <td><strong>Best For:</strong> {products[2].bestFor}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ══════════════════════
          SECTION 8: OPEN WEIGHT SOTA MODEL (#open-weight)
         ══════════════════════ */}
      <section id="open-weight" className="open-weight-section">
        <div className="o-container">
          <div className="open-weight-box">
            <div className="sub1" style={{ color: '#ff5722' }}>OUR SOTA OPEN WEIGHT MODEL</div>
            <h1 className="open-weight-title-big">AEROSPEC-1</h1>

            <div className="open-weight-btn-group">
              <button className="btn is-dark" onClick={() => alert('Downloading AeroSpec-1 Paper PDF...')}>
                <FileText size={16} /> <span>Paper (PDF)</span>
              </button>
              <button className="btn is-dark" onClick={() => alert('Downloading AeroSpec-1 Mesh .OBJ...')}>
                <Box size={16} /> <span>Model (.OBJ)</span>
              </button>
              <button className="btn is-dark" style={{ opacity: 0.5 }}>
                <Code size={16} /> <span>Code Coming Soon</span>
              </button>
            </div>

            <div className="body2" style={{ marginBottom: '24px' }}>
              <strong>Abstract:</strong> We present AeroSpec-1, an open-weight 3D model of a paper aeroplane for rendering, flight simulation, and gloriously unnecessary aerospace research.
            </div>

            <div className="sub2" style={{ marginBottom: '8px' }}>BibTeX Citation:</div>
            <pre className="bibtex-pre-block">{bibtexCode}</pre>

            <button className="btn is-dark" onClick={handleCopyBib} style={{ marginTop: '16px' }}>
              {copiedBib ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedBib ? 'Copied' : 'Copy BibTeX'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════
          SECTION 9: FOOTER (#footer)
         ══════════════════════ */}
      <footer id="contact" className="footer-section">
        <div className="o-container">
          <h2 className="footer-closing-headline">
            We caught your attention with a non-existent product. If we can sell a paper plane, imagine what we can do for your brand.
          </h2>
          <div className="footer-closing-sub">Built by AeroSpace Creative Lab</div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
            <button className="btn is-orange" onClick={() => navigate('/signup')}>
              Join Mission Crew
            </button>
            <button className="btn is-dark" onClick={handleCopyUrl}>
              {copiedUrl ? 'Copied Link' : 'Copy URL'}
            </button>
          </div>

          <div className="o-dashline" />

          <div className="footer-disclaimer-note">
            This entire site is a fictional creative project by AeroSpace. AeroSpec doesn't exist. No products are for sale. All claims are satirical and for entertainment purposes only.
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Radio, 
  Satellite, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Activity, 
  Wifi, 
  Globe, 
  Zap, 
  ArrowUpRight,
  Server,
  Radar,
  Sliders,
  Maximize2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AboutSection() {
  const navigate = useNavigate();
  const [tempSetting, setTempSetting] = useState(1); // 0: T=10 (Creative), 1: T=1 (Balanced), 2: T=0.1 (Deterministic)

  const tempLabels = [
    { label: 'Creative Flight (T = 10)', desc: 'High variance atmospheric trajectories & experimental updraft pitch.' },
    { label: 'Balanced Telemetry (T = 1.0)', desc: 'Standard orbital carrier lock with active Doppler shift compensation.' },
    { label: 'Deterministic Link (T = 0.1)', desc: 'Zero-jitter telemetry packets down to sub-millisecond precision.' },
  ];

  const metrics = [
    { value: '99.998%', label: 'Signal Link Reliability', sub: 'Multi-ground station carrier lock' },
    { value: '< 8.4 ms', label: 'Downlink Latency', sub: 'Sub-millisecond demodulation pipeline' },
    { value: '12.8 GHz', label: 'RF Spectral Range', sub: 'Continuous L, S, C, X, Ku coverage' },
    { value: 'AES-256', label: 'Telemetry Encryption', sub: 'Zero-trust downlink packet security' },
  ];

  const oryzoFeatures = [
    {
      title: 'Elevate Your Flight Telemetry',
      tagline: 'RISE ABOVE GROUND CLUSTER',
      desc: 'With a precision-engineered wing lift (exactly 1 wing thickness), AeroSpec doesn’t just fly - it elevates above every boring ground station you’ve ever known.',
      formula: 'LIFT = ½ · ρ · v² · S · CL'
    },
    {
      title: 'Thermodynamic & RF Stability',
      tagline: 'HANDLES EXTREMES WITH EASE',
      desc: 'From supersonic friction to sub-zero high-altitude air pressure - AeroSpec stays perfectly locked in. Your ground dish tapped out 3 miles ago.',
      formula: 'N = k · T · B  (Noise Floor -124 dBm)'
    },
    {
      title: 'Now 37.9% More Aerodynamic',
      tagline: 'PERFECTLY PITCHED, SERIOUSLY',
      desc: 'Our flight engineers recalibrated its airfoil circumference with disturbing levels of attention to detail - just because we could.',
      formula: 'RoPE: Roundness Optimization & Perimeter Engineering'
    }
  ];

  return (
    <section id="about" className="about-section">
      <div className="section-container">
        
        {/* Section Header */}
        <motion.div 
          className="section-header-box"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="hud-badge">
            <span className="hud-dot" />
            <span>MISSION DIRECTIVE 01 // ABOUT AEROSPEC</span>
          </div>
          <h2 className="section-main-title">
            Next-Generation Aerospace RF Telemetry & Ground Spectrum Monitoring
          </h2>
          <p className="section-lead-paragraph">
            AeroSpec is a cutting-edge aerospace telemetry platform engineered for 
            high-altitude research crafts, suborbital rockets, cube satellites, and ground operations. 
            We bridge high-frequency avionics with mission control through real-time decibel tracking, 
            predictive anomaly triage, and air-gapped flight portals.
          </p>
        </motion.div>

        {/* Live Metrics Grid */}
        <div id="specs" className="metrics-grid">
          {metrics.map((m, idx) => (
            <motion.div 
              key={idx}
              className="metric-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <div className="metric-val">{m.value}</div>
              <div className="metric-lbl">{m.label}</div>
              <div className="metric-sub">{m.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Oryzo-Style Feature Showcase Cards */}
        <div className="oryzo-features-grid">
          {oryzoFeatures.map((feat, idx) => (
            <div key={idx} className="oryzo-feat-card">
              <div className="feat-top-bar">
                <span className="feat-tagline">{feat.tagline}</span>
              </div>
              <h3 className="feat-title">{feat.title}</h3>
              <p className="feat-desc">{feat.desc}</p>
              <div className="dashline" />
              <div className="feat-formula">
                <code>{feat.formula}</code>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Gain & Thermal Slider (Oryzo Parody Slider) */}
        <div className="slider-card">
          <div className="slider-header">
            <div className="sub-tagline">
              <Sliders size={14} className="icon-cyan" />
              <span>CARRIER LOCK TEMPERATURE & GAIN SLIDER</span>
            </div>
            <h4>Downlink Demodulation Temperature</h4>
          </div>

          <div className="slider-controls">
            <div className="slider-buttons-group">
              {tempLabels.map((t, idx) => (
                <button
                  key={idx}
                  className={`slider-btn ${tempSetting === idx ? 'active' : ''}`}
                  onClick={() => setTempSetting(idx)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="slider-info-box">
              <p>{tempLabels[tempSetting].desc}</p>
              <div className="slider-formula-math">
                <code>
                  {tempSetting === 0 && 'fd = (vr / c) · f0  [Max Variance]'}
                  {tempSetting === 1 && 'P_rx = P_tx + G_tx + G_rx - FSPL  [Carrier Parity]'}
                  {tempSetting === 2 && 'BER < 10⁻¹²  [Deterministic Zero-Bit Error]'}
                </code>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

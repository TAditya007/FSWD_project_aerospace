import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Radio,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Activity,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  University
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ContactSection() {
  const navigate = useNavigate();
  const [priority, setPriority] = useState('Routine');
  const [band, setBand] = useState('S-Band (2.2 - 2.4 GHz - Telemetry)');
  const [formData, setFormData] = useState({
    callsign: '',
    email: '',
    organization: '',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle | transmitting | sent
  const [receipt, setReceipt] = useState(null);

  const priorities = [
    { label: 'Routine Inquiry', color: '#38bdf8' },
    { label: 'Telemetry Access', color: '#34d399' },
    { label: 'High Priority', color: '#f59e0b' },
    { label: 'Emergency Ops', color: '#ef4444' },
  ];

  const bands = [
    'S-Band (2.2 - 2.4 GHz - Telemetry)',
    'UHF / VHF (435 - 438 MHz - Avionics)',
    'L-Band (1.5 - 1.6 GHz - SatCom)',
    'X-Band (8.0 - 8.4 GHz - Deep Space)',
    'Ku-Band (11.7 - 14.5 GHz - High Bandwidth)',
    'Custom Flight Protocol'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.message) return;

    setStatus('transmitting');
    setTimeout(() => {
      const generatedId = `TX-${Math.floor(1000 + Math.random() * 9000)}-AERO`;
      setReceipt({
        id: generatedId,
        timestamp: new Date().toUTCString(),
        operator: formData.callsign || 'Guest Operator',
        priority: priority,
        band: band,
        email: formData.email
      });
      setStatus('sent');
    }, 1200);
  };

  const handleReset = () => {
    setFormData({ callsign: '', email: '', organization: '', message: '' });
    setStatus('idle');
    setReceipt(null);
  };

  return (
    <section id="contact" className="contact-section">
      <div className="section-container">

        {/* Section Header */}
        <motion.div
          className="section-header-box"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="hud-badge emerald">
            <span className="hud-dot emerald" />
            <span>MISSION DIRECTIVE 02 // GROUND STATION DISPATCH</span>
          </div>
          <h2 className="section-main-title">
            Contact Flight Operations & Mission Control
          </h2>
          <p className="section-lead-paragraph">
            Establish a secure communications downlink with our aerospace engineering team. Whether you are
            integrating a custom avionics transceiver, requesting dedicated ground station bandwidth, or seeking
            telemetry pipeline support, our ground operations desk is on active watch.
          </p>
        </motion.div>

        <div className="contact-grid">

          {/* Left Column: Command Desk Information */}
          <motion.div
            className="contact-info-col"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Live Station Alpha Status Card */}
            <div className="station-status-card">
              <div className="station-card-top">
                <div className="station-badge">
                  <span className="pulsing-radar-dot" />
                  <span>GROUND STATION 01 : ONLINE</span>
                </div>
                <span className="station-callsign">ALPHA-STATION // CAPE</span>
              </div>
              <div className="station-stats-row">
                <div className="station-stat-item">
                  <span className="stat-name">CARRIER LOCK</span>
                  <span className="stat-val text-emerald">100% NOMINAL</span>
                </div>
                <div className="station-stat-item">
                  <span className="stat-name">PING LATENCY</span>
                  <span className="stat-val text-sky">7.8 ms</span>
                </div>
                <div className="station-stat-item">
                  <span className="stat-name">AVG RESPONSE</span>
                  <span className="stat-val text-amber">&lt; 15 MIN</span>
                </div>
              </div>
            </div>

            {/* Direct Comms Channels */}
            <div className="comms-channel-list">
              <div className="channel-item">
                <div className="channel-icon-box">
                  <Mail size={18} />
                </div>
                <div className="channel-details">
                  <span className="channel-title">Flight Dispatch Desk</span>
                  <a href="mailto:dispatch@aerospec.aero" className="channel-link">
                    dispatch@aerospec.aero
                  </a>
                  <span className="channel-note">Encrypted PGP downlink available</span>
                </div>
              </div>

              <div className="channel-item">
                <div className="channel-icon-box">
                  <Radio size={18} />
                </div>
                <div className="channel-details">
                  <span className="channel-title">RF Transceiver Frequencies</span>
                  <span className="channel-text">UHF 435.525 MHz · S-Band 2240.00 MHz</span>
                  <span className="channel-note">Direct ground-to-flight demodulation</span>
                </div>
              </div>

              <div className="channel-item">
                <div className="channel-icon-box">
                  <Phone size={18} />
                </div>
                <div className="channel-details">
                  <span className="channel-title">24/7 Operations Hotline</span>
                  <span className="channel-text">+91 9866664786</span>
                  <span className="channel-note">Continuous active flight watch</span>
                </div>
              </div>

              <div className="channel-item">
                <div className="channel-icon-box">
                  <MapPin size={18} />
                </div>
                <div className="channel-details">
                  <span className="channel-title">Mission Control Coordinates</span>
                  <span className="channel-text">Hyderabad, Telangana</span>
                  <span className="channel-note">KLH University</span>
                </div>
              </div>
            </div>

            {/* Direct Portal Quick Links */}
            <div className="portal-quick-links">
              <span className="quick-links-heading">DIRECT PORTAL ACCESS</span>
              <div className="quick-buttons-row">
                <button className="quick-btn user" onClick={() => navigate('/login')}>
                  Crew Dashboard
                </button>
                <button className="quick-btn admin" onClick={() => navigate('/login')}>
                  Flight Admin Command
                </button>
              </div>
            </div>

          </motion.div>

          {/* Right Column: Mission Control Transmission Form */}
          <motion.div
            className="contact-form-col"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="dispatch-form-card">
              <div className="dispatch-card-header">
                <div className="header-left">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot yellow" />
                  <div className="terminal-dot green" />
                  <span className="terminal-title">MISSION-DISPATCH-TERMINAL.exe</span>
                </div>
                <span className="terminal-status">SECURE AES-256</span>
              </div>
              {status === 'sent' && receipt ? (
                /* Transmission Success Receipt */
                <motion.div
                  className="dispatch-success-box"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="success-icon-wrapper">
                    <CheckCircle2 size={44} className="text-emerald" />
                  </div>
                  <h3 className="success-title">DISPATCH TRANSMITTED SUCCESSFULLY</h3>
                  <p className="success-sub">
                    Your flight telemetry packet has been logged by Ground Station Alpha.
                  </p>

                  <div className="receipt-details-table">
                    <div className="receipt-row">
                      <span className="receipt-lbl">DISPATCH REF:</span>
                      <span className="receipt-code text-sky">{receipt.id}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-lbl">TIMESTAMP:</span>
                      <span className="receipt-val">{receipt.timestamp}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-lbl">OPERATOR / CALLSIGN:</span>
                      <span className="receipt-val">{receipt.operator}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-lbl">PRIORITY LEVEL:</span>
                      <span className="receipt-badge">{receipt.priority}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-lbl">BAND PROTOCOL:</span>
                      <span className="receipt-val">{receipt.band}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-lbl">CONFIRMATION DEST:</span>
                      <span className="receipt-val">{receipt.email}</span>
                    </div>
                  </div>

                  <p className="receipt-notice">
                    Flight Operations will establish a return communications channel shortly.
                  </p>

                  <button className="btn-reset-dispatch" onClick={handleReset}>
                    <RotateCcw size={16} />
                    <span>TRANSMIT ANOTHER MISSION BRIEF</span>
                  </button>
                </motion.div>
              ) : (
                /* Active Transmission Form */
                <form onSubmit={handleSubmit} className="dispatch-form">

                  {/* Priority selector */}
                  <div className="form-group">
                    <label className="form-label">
                      COMMUNICATION PRIORITY LEVEL
                    </label>
                    <div className="priority-options">
                      {priorities.map((p) => (
                        <button
                          type="button"
                          key={p.label}
                          className={`priority-btn ${priority === p.label ? 'active' : ''}`}
                          onClick={() => setPriority(p.label)}
                          style={{
                            borderColor: priority === p.label ? p.color : 'rgba(14, 165, 233, 0.2)',
                            boxShadow: priority === p.label ? `0 0 12px ${p.color}40` : 'none'
                          }}
                        >
                          <span
                            className="priority-indicator-dot"
                            style={{ backgroundColor: p.color }}
                          />
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Callsign & Email */}
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label" htmlFor="callsign">
                        CALLSIGN / OPERATOR NAME
                      </label>
                      <input
                        id="callsign"
                        name="callsign"
                        type="text"
                        placeholder="e.g. Commander Marcus Vance"
                        value={formData.callsign}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="email">
                        OFFICIAL COMMS EMAIL <span className="req">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="operator@aerospace.org"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Organization & Frequency Band */}
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label" htmlFor="organization">
                        AGENCY / ORGANIZATION
                      </label>
                      <input
                        id="organization"
                        name="organization"
                        type="text"
                        placeholder="e.g. Space Dynamics / Research Lab"
                        value={formData.organization}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="band-select">
                        TARGET FREQUENCY SPECTRUM
                      </label>
                      <select
                        id="band-select"
                        value={band}
                        onChange={(e) => setBand(e.target.value)}
                        className="form-select"
                      >
                        {bands.map((b) => (
                          <option key={b} value={b} className="select-option">
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Mission Message */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="message">
                      MISSION BRIEF / INQUIRY PARAMETERS <span className="req">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      required
                      placeholder="Detail your telemetry requirements, craft specs, antenna coordinates, or technical questions..."
                      value={formData.message}
                      onChange={handleChange}
                      className="form-textarea"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="dispatch-submit-btn"
                    disabled={status === 'transmitting'}
                  >
                    {status === 'transmitting' ? (
                      <span className="transmitting-state">
                        <Activity className="animate-spin" size={18} />
                        <span>ESTABLISHING RF DOWNLINK...</span>
                      </span>
                    ) : (
                      <span className="idle-state">
                        <Send size={16} />
                        <span>TRANSMIT DISPATCH TO GROUND STATION</span>
                      </span>
                    )}
                  </button>

                  <div className="form-footnote">
                    <ShieldCheck size={14} className="text-emerald" />
                    <span>256-Bit Encrypted Downlink · Non-repudiation audit logging</span>
                  </div>

                </form>
              )}

            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}

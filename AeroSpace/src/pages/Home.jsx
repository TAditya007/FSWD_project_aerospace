import { useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Full SVG Aeroplane facing right
function PlaneSVG({ width = 420, height = 180 }) {
  return (
    <svg viewBox="0 0 420 180" width={width} height={height} xmlns="http://www.w3.org/2000/svg">
      {/* Fuselage (main body tube) */}
      <ellipse cx="210" cy="90" rx="130" ry="22" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
      {/* Nose cone */}
      <path d="M340,82 Q390,90 340,98 Z" fill="#0ea5e9" />
      {/* Tail fin */}
      <path d="M80,88 L40,55 L75,88 Z" fill="#0ea5e9" />
      <path d="M80,92 L40,125 L75,92 Z" fill="#0ea5e9" />
      {/* Top wing (main) */}
      <path d="M200,78 L140,25 L280,75 Z" fill="#38bdf8" opacity="0.95" />
      {/* Bottom wing (main) */}
      <path d="M200,102 L140,155 L280,105 Z" fill="#38bdf8" opacity="0.95" />
      {/* Wing shine */}
      <path d="M205,78 L175,38 L240,76 Z" fill="#bae6fd" opacity="0.3" />
      {/* Engine pods */}
      <ellipse cx="195" cy="68" rx="22" ry="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
      <ellipse cx="195" cy="68" rx="10" ry="5" fill="#0ea5e9" opacity="0.7" />
      <ellipse cx="195" cy="112" rx="22" ry="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
      <ellipse cx="195" cy="112" rx="10" ry="5" fill="#0ea5e9" opacity="0.7" />
      {/* Cockpit windows */}
      <ellipse cx="310" cy="86" rx="16" ry="8" fill="#7dd3fc" opacity="0.6" />
      <ellipse cx="285" cy="85" rx="10" ry="7" fill="#7dd3fc" opacity="0.4" />
      {/* Fuselage stripe */}
      <line x1="90" y1="84" x2="340" y2="84" stroke="#38bdf8" strokeWidth="0.5" opacity="0.4" strokeDasharray="6,4" />
    </svg>
  );
}

export default function Home() {
  const [phase, setPhase] = useState('idle'); // idle | torn
  const navigate = useNavigate();
  const y = useMotionValue(0);
  const controls = useAnimation();

  // Animate wing spread as user pulls down
  const topWingY    = useTransform(y, [0, 280], [0, -90]);
  const bottomWingY = useTransform(y, [0, 280], [0,  90]);
  const topWingRot  = useTransform(y, [0, 280], [0, -20]);
  const bottomWingRot = useTransform(y, [0, 280], [0,  20]);
  const bodyOpacity = useTransform(y, [0, 280], [1, 0.4]);
  const glowRadius  = useTransform(y, [0, 280], [0, 1]);

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 200) {
      setPhase('torn');
    } else {
      controls.start({ y: 0, transition: { type: 'spring', stiffness: 400, damping: 28 } });
    }
  };

  return (
    <div className="home-root">

      {/* ── Animated grid bg ── */}
      <div className="grid-bg" />

      {/* ── Ambient orbs ── */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* ══════════════════════
          PHASE: IDLE — Show plane + pull handle
         ══════════════════════ */}
      {phase === 'idle' && (
        <>
          {/* Brand header */}
          <motion.div
            className="brand-header"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="brand-tag">RF TELEMETRY SYSTEM · LIVE</div>
            <h1 className="brand-title">AEROSPEC</h1>
            <p className="brand-sub">Pull the aeroplane to initialize the mission</p>
          </motion.div>

          {/* Plane + buckle area */}
          <div className="plane-scene">

            {/* Glow halo that intensifies on drag */}
            <motion.div className="plane-halo" style={{ opacity: glowRadius }} />

            {/* ── TOP WING (pulls up) ── */}
            <motion.div
              className="plane-wing wing-top"
              style={{ y: topWingY, rotate: topWingRot }}
            >
              <svg viewBox="0 0 280 80" width="280" height="80">
                <path d="M200,70 L60,5 L230,65 Z" fill="#38bdf8" />
                <path d="M200,70 L130,18 L215,67 Z" fill="#bae6fd" opacity="0.4" />
                <ellipse cx="175" cy="58" rx="20" ry="7" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
                <ellipse cx="175" cy="58" rx="9" ry="4" fill="#0ea5e9" opacity="0.8" />
              </svg>
            </motion.div>

            {/* ── FUSELAGE (stays, fades) ── */}
            <motion.div className="plane-body" style={{ opacity: bodyOpacity }}>
              <svg viewBox="0 0 380 60" width="380" height="60">
                {/* Main body tube */}
                <ellipse cx="190" cy="30" rx="150" ry="18" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                {/* Nose */}
                <path d="M340,24 Q385,30 340,36 Z" fill="#0ea5e9" />
                {/* Tail */}
                <path d="M42,28 L8,10 L38,28 Z" fill="#0ea5e9" />
                <path d="M42,32 L8,50 L38,32 Z" fill="#0ea5e9" />
                {/* Cockpit */}
                <ellipse cx="295" cy="27" rx="18" ry="9" fill="#7dd3fc" opacity="0.65" />
                <ellipse cx="265" cy="27" rx="11" ry="8" fill="#7dd3fc" opacity="0.4" />
                {/* Stripe */}
                <line x1="50" y1="26" x2="320" y2="26" stroke="#38bdf8" strokeWidth="0.5" opacity="0.5" strokeDasharray="6,4" />
              </svg>
            </motion.div>

            {/* ── BOTTOM WING (pulls down) ── */}
            <motion.div
              className="plane-wing wing-bottom"
              style={{ y: bottomWingY, rotate: bottomWingRot }}
            >
              <svg viewBox="0 0 280 80" width="280" height="80">
                <path d="M200,10 L60,75 L230,15 Z" fill="#38bdf8" />
                <path d="M200,10 L130,62 L215,13 Z" fill="#bae6fd" opacity="0.4" />
                <ellipse cx="175" cy="22" rx="20" ry="7" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
                <ellipse cx="175" cy="22" rx="9" ry="4" fill="#0ea5e9" opacity="0.8" />
              </svg>
            </motion.div>

            {/* ── DRAG BUCKLE ── */}
            <motion.div
              className="buckle"
              drag="y"
              dragConstraints={{ top: 0, bottom: 280 }}
              onDragEnd={handleDragEnd}
              animate={controls}
              style={{ y }}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95, cursor: 'grabbing' }}
            >
              <div className="buckle-grip"><span/><span/><span/></div>
              <p className="buckle-label">PULL DOWN</p>
              <div className="buckle-chevron">▼</div>
            </motion.div>

          </div>

          {/* Footer status bar */}
          <motion.div
            className="status-bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <span className="status-dot" />
            <span>SYSTEM ONLINE</span>
            <span className="status-sep">·</span>
            <span>RF POD: ACTIVE</span>
            <span className="status-sep">·</span>
            <span>SIGNAL: -62 dBm</span>
          </motion.div>
        </>
      )}


      {/* ══════════════════════
          PHASE: TORN — Show auth panels
         ══════════════════════ */}
      {phase === 'torn' && (
        <div className="auth-scene">

          {/* Flying plane fragments */}
          <motion.div
            className="fragment frag-top-wing"
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: -600, y: -400, opacity: 0, rotate: -60 }}
            transition={{ duration: 0.65, ease: 'easeIn' }}
          >
            <svg viewBox="0 0 280 80" width="200" height="60">
              <path d="M200,70 L60,5 L230,65 Z" fill="#38bdf8" />
            </svg>
          </motion.div>
          <motion.div
            className="fragment frag-bottom-wing"
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: -500, y: 500, opacity: 0, rotate: 50 }}
            transition={{ duration: 0.65, ease: 'easeIn' }}
          >
            <svg viewBox="0 0 280 80" width="200" height="60">
              <path d="M200,10 L60,75 L230,15 Z" fill="#38bdf8" />
            </svg>
          </motion.div>
          <motion.div
            className="fragment frag-body"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: 700, y: -200, opacity: 0, scale: 0.3, rotate: 30 }}
            transition={{ duration: 0.7, ease: 'easeIn' }}
          >
            <svg viewBox="0 0 380 60" width="280" height="50">
              <ellipse cx="190" cy="30" rx="150" ry="18" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
              <path d="M340,24 Q385,30 340,36 Z" fill="#0ea5e9" />
            </svg>
          </motion.div>

          {/* AUTH PANELS */}
          <div className="auth-panels">

            {/* LEFT — LOGIN */}
            <motion.div
              className="auth-card"
              initial={{ x: -200, opacity: 0, skewX: -5 }}
              animate={{ x: 0, opacity: 1, skewX: 0 }}
              transition={{ delay: 0.3, duration: 0.7, type: 'spring', damping: 16 }}
            >
              <div className="auth-accent-bar" />
              <span className="auth-badge">CREW ACCESS</span>
              <h2 className="auth-card-title">Login</h2>
              <p className="auth-card-desc">
                Resume your mission. Access live RF telemetry and your dashboard.
              </p>
              <button className="auth-btn-primary" onClick={() => navigate('/login')}>
                SIGN IN →
              </button>
              <p className="auth-footnote">Already have an account</p>
            </motion.div>

            {/* DIVIDER */}
            <motion.div
              className="auth-divider"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
            >
              <div className="divider-line" />
              <div className="divider-pill">OR</div>
              <div className="divider-line" />
            </motion.div>

            {/* RIGHT — SIGNUP */}
            <motion.div
              className="auth-card"
              initial={{ x: 200, opacity: 0, skewX: 5 }}
              animate={{ x: 0, opacity: 1, skewX: 0 }}
              transition={{ delay: 0.3, duration: 0.7, type: 'spring', damping: 16 }}
            >
              <div className="auth-accent-bar green" />
              <span className="auth-badge green">NEW OPERATOR</span>
              <h2 className="auth-card-title">Sign Up</h2>
              <p className="auth-card-desc">
                Register a new operator profile. Begin receiving real-time telemetry signals.
              </p>
              <button className="auth-btn-secondary" onClick={() => navigate('/signup')}>
                REGISTER →
              </button>
              <p className="auth-footnote">Create a new account</p>
            </motion.div>

          </div>

          {/* Back option */}
          <motion.button
            className="back-to-landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={() => setPhase('idle')}
          >
            ← BACK TO MISSION START
          </motion.button>

        </div>
      )}

    </div>
  );
}

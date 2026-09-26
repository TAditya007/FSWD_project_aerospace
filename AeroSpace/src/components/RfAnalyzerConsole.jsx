import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Radio, Activity, Wifi, Zap, Sliders, Shield, AlertTriangle,
  RotateCcw, Pause, Play, CheckCircle2, Eye, Compass
} from 'lucide-react';

export default function RfAnalyzerConsole({
  activePod = {},
  podHistory = [],
  streamStatus = 'connected'
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedSpanMHz, setSelectedSpanMHz] = useState(5.0); // 2 MHz, 5 MHz, 10 MHz
  const [rbwKHz, setRbwKHz] = useState(25); // 10, 25, 100 kHz
  const [interferenceSim, setInterferenceSim] = useState(false);
  const [peakHoldMode, setPeakHoldMode] = useState(true);

  // Derive stable live values from activePod and bounded simulated noise
  const centerFreq = Number(activePod.frequencyMHz) || 440.920;
  const currentRssi = Number(activePod.rssiDBm) || -62;
  const currentSnr = Number(activePod.snrDB) || 18.4;
  const currentGain = Number(activePod.gainDBm) || 18.5;

  // Track session peak RSSI
  const [peakRssi, setPeakRssi] = useState(-52.0);
  useEffect(() => {
    if (currentRssi > peakRssi) {
      setPeakRssi(currentRssi);
    }
  }, [currentRssi, peakRssi]);

  // Rolling history buffers for mini charts (last 30 samples)
  const [rssiHistory, setRssiHistory] = useState(() => Array(30).fill(currentRssi));
  const [snrHistory, setSnrHistory] = useState(() => Array(30).fill(currentSnr));
  const [driftHistory, setDriftHistory] = useState(() => Array(30).fill(0));

  // Determine Signal Status Badge
  const signalStatus = useMemo(() => {
    if (streamStatus === 'disconnected') return { label: 'DISCONNECTED', color: '#ef4444', desc: 'Telemetry downlink lost' };
    if (interferenceSim || (currentSnr < 10 && currentSnr > 0)) return { label: 'INTERFERENCE DETECTED', color: '#f59e0b', desc: 'Jamming / high noise floor in passband' };
    if (currentRssi > -75 && currentSnr >= 12) return { label: 'LOCKED', color: '#10b981', desc: 'Carrier locked with high fidelity' };
    if (currentRssi > -92) return { label: 'MONITORING', color: '#00f5ff', desc: 'Nominal Sub-GHz carrier acquired' };
    return { label: 'SEARCHING', color: '#eab308', desc: 'Scanning for beacon packet' };
  }, [streamStatus, interferenceSim, currentSnr, currentRssi]);

  // Computed signal quality (0 - 100%)
  const signalQualityPct = useMemo(() => {
    // Normal RSSI ranges from -110 (0%) to -40 (100%)
    const clampedRssi = Math.max(-110, Math.min(-40, currentRssi));
    const rssiScore = ((clampedRssi + 110) / 70) * 60;
    const clampedSnr = Math.max(0, Math.min(30, currentSnr));
    const snrScore = (clampedSnr / 30) * 40;
    return Math.round(rssiScore + snrScore);
  }, [currentRssi, currentSnr]);

  // Noise floor calculation
  const noiseFloorDBm = -105.4;

  // Channel occupancy index
  const channelOccupancyPct = useMemo(() => {
    const base = 22;
    const variance = (Math.abs(currentRssi) % 15) * 0.8;
    return (base + variance).toFixed(1);
  }, [currentRssi]);

  // Update history buffers on live stream ticks
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      // Small realistic jitter for telemetry smoothing
      const jitter = (Math.random() - 0.5) * 0.8;
      const newRssi = Number((currentRssi + jitter).toFixed(1));
      const newSnr = Number((currentSnr + jitter * 0.4).toFixed(1));
      const newDrift = Math.round((Math.random() - 0.5) * 140); // Hz drift

      setRssiHistory(prev => [...prev.slice(1), newRssi]);
      setSnrHistory(prev => [...prev.slice(1), newSnr]);
      setDriftHistory(prev => [...prev.slice(1), newDrift]);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRssi, currentSnr, isPaused]);

  // Canvas Spectrum Sweep Engine
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const sweepPosRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let phase = 0;

    const renderSpectrum = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Grid Background
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.08)';
      ctx.lineWidth = 1;

      // Horizontal dBm gridlines (-120 to -20 dBm = 10 lines)
      for (let i = 0; i <= 8; i++) {
        const y = (height / 8) * i;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        const dbmVal = -20 - (i * 12.5);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round(dbmVal)}`, 35, y + 3);
      }

      // Vertical Frequency gridlines
      const span = selectedSpanMHz;
      const startFreq = centerFreq - span / 2;
      const numVertDivs = 8;
      for (let j = 0; j <= numVertDivs; j++) {
        const x = 40 + ((width - 40) / numVertDivs) * j;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 20);
        ctx.stroke();

        const freqAtX = startFreq + (span / numVertDivs) * j;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${freqAtX.toFixed(3)}M`, x, height - 6);
      }

      // 2. Draw Noise Floor Dashed Line (-105 dBm)
      const noiseY = height - 20 - ((noiseFloorDBm + 120) / 100) * (height - 20);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.beginPath();
      ctx.moveTo(40, noiseY);
      ctx.lineTo(width, noiseY);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`NOISE FLOOR (${noiseFloorDBm} dBm)`, 45, noiseY - 4);
      ctx.restore();

      // 3. Draw Tuned Center Frequency Vertical Marker
      const centerX = 40 + (width - 40) / 2;
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.7)';
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height - 20);
      ctx.stroke();
      ctx.restore();

      // Center Frequency Cursor Diamond
      ctx.fillStyle = '#00f5ff';
      ctx.beginPath();
      ctx.moveTo(centerX, 6);
      ctx.lineTo(centerX + 5, 12);
      ctx.lineTo(centerX, 18);
      ctx.lineTo(centerX - 5, 12);
      ctx.closePath();
      ctx.fill();

      // Center Frequency Top Badge
      ctx.fillStyle = 'rgba(0, 245, 255, 0.15)';
      ctx.fillRect(centerX - 45, 2, 90, 16);
      ctx.strokeStyle = '#00f5ff';
      ctx.strokeRect(centerX - 45, 2, 90, 16);
      ctx.fillStyle = '#00f5ff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${centerFreq.toFixed(3)} MHz`, centerX, 14);

      // 4. Generate & Draw Smooth Live Spectrum Waveform
      const points = [];
      const numPoints = 180;
      const usableWidth = width - 40;

      for (let p = 0; p < numPoints; p++) {
        const x = 40 + (usableWidth / (numPoints - 1)) * p;
        const normDist = (x - centerX) / (usableWidth / 2); // -1 to +1

        // Baseline noise with random slight jitter
        let dbm = noiseFloorDBm + (Math.sin(p * 0.4 + phase) * 2.2) + ((Math.sin(p * 1.8) * 1.5));

        // Primary Carrier Signal Peak around Center (normDist == 0)
        const primaryPeakWidth = 0.09;
        const primaryPeakHeight = Math.abs(currentRssi - noiseFloorDBm);
        const distFromCenter = Math.abs(normDist);

        if (distFromCenter < primaryPeakWidth * 2.5) {
          const gauss = Math.exp(-Math.pow(distFromCenter / primaryPeakWidth, 2));
          dbm += primaryPeakHeight * gauss;
        }

        // Sideband 1 (Modulation Harmonic - Left)
        const sb1Dist = Math.abs(normDist + 0.35);
        if (sb1Dist < 0.08) {
          dbm += (primaryPeakHeight * 0.45) * Math.exp(-Math.pow(sb1Dist / 0.05, 2));
        }

        // Sideband 2 (Modulation Harmonic - Right)
        const sb2Dist = Math.abs(normDist - 0.35);
        if (sb2Dist < 0.08) {
          dbm += (primaryPeakHeight * 0.40) * Math.exp(-Math.pow(sb2Dist / 0.05, 2));
        }

        // Interference Spur (if enabled)
        if (interferenceSim) {
          const interfDist = Math.abs(normDist - 0.65);
          if (interfDist < 0.12) {
            dbm += (primaryPeakHeight * 0.75) * Math.exp(-Math.pow(interfDist / 0.06, 2));
          }
        }

        // Clamp amplitude to [-120, -10]
        dbm = Math.max(-120, Math.min(-15, dbm));

        // Convert dBm to Canvas Y (y = 0 at -20 dBm, y = height-20 at -120 dBm)
        const y = (height - 20) - ((dbm + 120) / 105) * (height - 25);
        points.push({ x, y, dbm });
      }

      // Draw Waveform Gradient Fill
      const grad = ctx.createLinearGradient(0, 0, 0, height - 20);
      grad.addColorStop(0, 'rgba(0, 245, 255, 0.45)');
      grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
      grad.addColorStop(1, 'rgba(0, 245, 255, 0.01)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, height - 20);
      for (let i = 0; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.lineTo(points[points.length - 1].x, height - 20);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw Main Spectrum Curve Line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = 'rgba(0, 245, 255, 0.7)';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // 5. Draw Peak Labels
      // Peak 1: Primary Center Carrier
      const centerPt = points[Math.floor(points.length / 2)];
      if (centerPt) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(centerPt.x, centerPt.y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`PK1: ${currentRssi} dBm`, centerPt.x, Math.max(28, centerPt.y - 8));
      }

      // Peak 2: Left Sideband
      const leftSbIdx = Math.floor(points.length * 0.325);
      const leftSbPt = points[leftSbIdx];
      if (leftSbPt) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(leftSbPt.x, leftSbPt.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '8px monospace';
        ctx.fillText(`PK2`, leftSbPt.x, leftSbPt.y - 5);
      }

      // 6. Draw Animated Scanning Sweep Beam
      if (!isPaused) {
        sweepPosRef.current = (sweepPosRef.current + 2.5) % usableWidth;
      }
      const sweepX = 40 + sweepPosRef.current;
      const sweepGrad = ctx.createLinearGradient(sweepX - 25, 0, sweepX, 0);
      sweepGrad.addColorStop(0, 'rgba(0, 245, 255, 0)');
      sweepGrad.addColorStop(1, 'rgba(0, 245, 255, 0.25)');
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(sweepX - 25, 0, 25, height - 20);

      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sweepX, 0);
      ctx.lineTo(sweepX, height - 20);
      ctx.stroke();

      phase += 0.05;
      animFrameRef.current = requestAnimationFrame(renderSpectrum);
    };

    renderSpectrum();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [centerFreq, currentRssi, selectedSpanMHz, interferenceSim, isPaused]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── TOP CONSOLE BANNER & CONTROLS ── */}
      <div className="ud-welcome-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Radio size={22} color="var(--hud-accent, #00f5ff)" />
            <h1 className="ud-greeting" style={{ margin: 0, fontSize: '20px' }}>
              Aerospace RF Spectrum & Transceiver Console
            </h1>
          </div>
          <p className="ud-sub" style={{ margin: 0 }}>
            Real-time spectral surveillance for <strong>{activePod.callsign || 'AERO-POD-09'}</strong> ({activePod.model || 'AEROSPEC Pro'}) — Sub-GHz Telemetry Downlink.
          </p>
        </div>

        {/* Live Status Pill & Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: `${signalStatus.color}18`,
            border: `1.5px solid ${signalStatus.color}`,
            color: signalStatus.color,
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: signalStatus.color, boxShadow: `0 0 8px ${signalStatus.color}` }} />
            <span>SIGNAL: {signalStatus.label}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: '#ffedd6',
              fontSize: '11px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {isPaused ? <Play size={13} color="#10b981" /> : <Pause size={13} color="#f59e0b" />}
            {isPaused ? 'Resume Sweep' : 'Pause'}
          </button>

          <button
            type="button"
            onClick={() => setInterferenceSim(!interferenceSim)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: interferenceSim ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${interferenceSim ? '#f59e0b' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '6px',
              color: interferenceSim ? '#f59e0b' : '#ffedd6',
              fontSize: '11px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <AlertTriangle size={13} />
            {interferenceSim ? 'Interference Active' : 'Simulate Jamming'}
          </button>
        </div>
      </div>

      {/* ── SECTION A: LIVE SPECTRUM PANEL ── */}
      <div className="ud-info-card" style={{ padding: '18px', background: '#070b16', border: '1px solid rgba(0, 245, 255, 0.25)' }}>
        {/* Canvas Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#00f5ff" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffedd6', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Real-Time RF Spectral Density Monitor
            </span>
            <span style={{ fontSize: '10px', background: 'rgba(0, 245, 255, 0.1)', color: '#00f5ff', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(0, 245, 255, 0.3)', fontFamily: 'var(--font-mono)' }}>
              RBW: {rbwKHz} kHz
            </span>
          </div>

          {/* Span Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#8c857b' }}>SPAN:</span>
            {[2.0, 5.0, 10.0].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSpanMHz(s)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${selectedSpanMHz === s ? '#00f5ff' : 'rgba(255,255,255,0.1)'}`,
                  background: selectedSpanMHz === s ? 'rgba(0, 245, 255, 0.15)' : 'transparent',
                  color: selectedSpanMHz === s ? '#00f5ff' : '#94a3b8',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer'
                }}
              >
                ±{(s / 2).toFixed(1)} MHz
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Canvas Container */}
        <div style={{ position: 'relative', width: '100%', height: '240px', background: '#040711', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0, 245, 255, 0.15)' }}>
          <canvas
            ref={canvasRef}
            width={780}
            height={240}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />

          {/* Top-Right Mini Watermark Stats */}
          <div style={{ position: 'absolute', top: '10px', right: '12px', background: 'rgba(5, 8, 17, 0.75)', backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '11px', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
            <span style={{ color: '#00f5ff' }}>FC: {centerFreq.toFixed(3)} MHz</span>
            <span style={{ color: '#10b981' }}>PEAK: {currentRssi} dBm</span>
            <span style={{ color: '#8c857b' }}>REF: -20 dBm</span>
          </div>
        </div>

        {/* Spectrum Footer Indicators */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '12px', fontSize: '11px', color: '#8c857b', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>START: {(centerFreq - selectedSpanMHz / 2).toFixed(3)} MHz</span>
            <span style={{ color: '#00f5ff' }}>CENTER: {centerFreq.toFixed(3)} MHz</span>
            <span>STOP: {(centerFreq + selectedSpanMHz / 2).toFixed(3)} MHz</span>
          </div>
          <div>
            <span>SWEEP: <strong style={{ color: '#ffedd6' }}>24.5 ms</strong> (FAST-FFT)</span>
          </div>
        </div>
      </div>

      {/* ── SECTION B: 9 LIVE RF METRICS MATRIX ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        
        {/* 1. Center Frequency */}
        <div style={{ padding: '14px', background: 'rgba(0, 245, 255, 0.03)', border: '1px solid rgba(0, 245, 255, 0.15)', borderRadius: '8px' }}>
          <span style={{ fontSize: '10px', color: '#8c857b', fontFamily: 'var(--font-mono)', display: 'block' }}>CENTER FREQUENCY</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00f5ff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {centerFreq.toFixed(3)} <span style={{ fontSize: '11px', color: '#8c857b' }}>MHz</span>
          </div>
          <span style={{ fontSize: '10px', color: '#38bdf8' }}>Carrier Passband Locked</span>
        </div>

        {/* 2. RSSI */}
        <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '8px' }}>
          <span style={{ fontSize: '10px', color: '#8c857b', fontFamily: 'var(--font-mono)', display: 'block' }}>SIGNAL LEVEL (RSSI)</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: currentRssi > -75 ? '#10b981' : '#f59e0b', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {currentRssi} <span style={{ fontSize: '11px', color: '#8c857b' }}>dBm</span>
          </div>
          <span style={{ fontSize: '10px', color: currentRssi > -75 ? '#10b981' : '#f59e0b' }}>
            {currentRssi > -75 ? 'Strong Direct Wave' : 'Attenuated Link'}
          </span>
        </div>

        {/* 3. Peak RSSI */}
        <div style={{ padding: '14px', background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '8px' }}>
          <span style={{ fontSize: '10px', color: '#8c857b', fontFamily: 'var(--font-mono)', display: 'block' }}>PEAK RSSI (HOLD)</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {peakRssi} <span style={{ fontSize: '11px', color: '#8c857b' }}>dBm</span>
          </div>
          <span style={{ fontSize: '10px', color: '#8c857b' }}>Max In-Session Power</span>
        </div>

        {/* 4. Noise Floor */}
        <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}>
          <span style={{ fontSize: '10px', color: '#8c857b', fontFamily: 'var(--font-mono)', display: 'block' }}>NOISE FLOOR</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffedd6', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {noiseFloorDBm} <span style={{ fontSize: '11px', color: '#8c857b' }}>dBm</span>
          </div>
          <span style={{ fontSize: '10px', color: '#8c857b' }}>Thermal Floor -174 dBm/Hz</span>
        </div>

        {/* 5. SNR */}
        <div style={{ padding: '14px', background: 'rgba(0, 245, 255, 0.03)', border: '1px solid rgba(0, 245, 255, 0.15)', borderRadius: '8px' }}>
          <span style={{ fontSize: '10px', color: '#8c857b', fontFamily: 'var(--font-mono)', display: 'block' }}>SNR (SIGNAL/NOISE)</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: currentSnr >= 15 ? '#10b981' : '#f59e0b', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            +{currentSnr} <span style={{ fontSize: '11px', color: '#8c857b' }}>dB</span>
          </div>
          <span style={{ fontSize: '10px', color: currentSnr >= 15 ? '#10b981' : '#f59e0b' }}>
            {currentSnr >= 15 ? 'Clear Margin (+12 dB)' : 'Close to Limit'}
          </span>
        </div>

        {/* 6. Bandwidth */}
        <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}>
          <span style={{ fontSize: '10px', color: '#8c857b', fontFamily: 'var(--font-mono)', display: 'block' }}>CHANNEL BANDWIDTH</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            250.0 <span style={{ fontSize: '11px', color: '#8c857b' }}>kHz</span>
          </div>
          <span style={{ fontSize: '10px', color: '#8c857b' }}>99% OBW: 218.4 kHz</span>
        </div>

        {/* 7. Gain */}
        <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '8px' }}>
          <span style={{ fontSize: '10px', color: '#8c857b', fontFamily: 'var(--font-mono)', display: 'block' }}>TRANSMIT GAIN</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            +{currentGain.toFixed(1)} <span style={{ fontSize: '11px', color: '#8c857b' }}>dBm</span>
          </div>
          <span style={{ fontSize: '10px', color: '#10b981' }}>Hardware PA Nominal</span>
        </div>

        {/* 8. Signal Quality */}
        <div style={{ padding: '14px', background: 'rgba(0, 245, 255, 0.03)', border: '1px solid rgba(0, 245, 255, 0.15)', borderRadius: '8px' }}>
          <span style={{ fontSize: '10px', color: '#8c857b', fontFamily: 'var(--font-mono)', display: 'block' }}>SIGNAL QUALITY</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: signalQualityPct > 80 ? '#10b981' : '#f59e0b', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {signalQualityPct}%
          </div>
          <span style={{ fontSize: '10px', color: signalQualityPct > 80 ? '#10b981' : '#f59e0b' }}>
            {signalQualityPct > 80 ? 'EXCELLENT LINK' : 'MARGINAL'}
          </span>
        </div>

        {/* 9. Channel Occupancy */}
        <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}>
          <span style={{ fontSize: '10px', color: '#8c857b', fontFamily: 'var(--font-mono)', display: 'block' }}>CHANNEL OCCUPANCY</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00f5ff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {channelOccupancyPct}%
          </div>
          <span style={{ fontSize: '10px', color: '#8c857b' }}>Duty Cycle: 4.2% Tx</span>
        </div>

      </div>

      {/* ── SECTION D: MINI CHARTS (RSSI HISTORY, SNR HISTORY, FREQUENCY DRIFT) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        
        {/* RSSI History Sparkline */}
        <div className="ud-info-card" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#8c857b', fontFamily: 'var(--font-mono)' }}>RSSI HISTORY (LAST 30s)</span>
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{currentRssi} dBm</span>
          </div>
          <svg width="100%" height="60" viewBox="0 0 300 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="rssiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Compute SVG polyline */}
            {(() => {
              const minVal = -95;
              const maxVal = -45;
              const points = rssiHistory.map((val, idx) => {
                const x = (idx / (rssiHistory.length - 1)) * 300;
                const norm = (val - minVal) / (maxVal - minVal);
                const y = 60 - Math.max(5, Math.min(55, norm * 55));
                return `${x},${y}`;
              });
              const polylineStr = points.join(' ');
              const areaStr = `0,60 ${polylineStr} 300,60`;
              return (
                <>
                  <polygon points={areaStr} fill="url(#rssiGrad)" />
                  <polyline points={polylineStr} fill="none" stroke="#10b981" strokeWidth="2" />
                </>
              );
            })()}
          </svg>
        </div>

        {/* SNR History Sparkline */}
        <div className="ud-info-card" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#8c857b', fontFamily: 'var(--font-mono)' }}>SNR RATIO HISTORY (dB)</span>
            <span style={{ fontSize: '12px', color: '#00f5ff', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>+{currentSnr} dB</span>
          </div>
          <svg width="100%" height="60" viewBox="0 0 300 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="snrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00f5ff" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {(() => {
              const minVal = 0;
              const maxVal = 30;
              const points = snrHistory.map((val, idx) => {
                const x = (idx / (snrHistory.length - 1)) * 300;
                const norm = (val - minVal) / (maxVal - minVal);
                const y = 60 - Math.max(5, Math.min(55, norm * 55));
                return `${x},${y}`;
              });
              const polylineStr = points.join(' ');
              const areaStr = `0,60 ${polylineStr} 300,60`;
              return (
                <>
                  <polygon points={areaStr} fill="url(#snrGrad)" />
                  <polyline points={polylineStr} fill="none" stroke="#00f5ff" strokeWidth="2" />
                </>
              );
            })()}
          </svg>
        </div>

        {/* Frequency Drift (Doppler) History */}
        <div className="ud-info-card" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#8c857b', fontFamily: 'var(--font-mono)' }}>DOPPLER FREQ DRIFT</span>
            <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {driftHistory[driftHistory.length - 1] > 0 ? `+${driftHistory[driftHistory.length - 1]}` : driftHistory[driftHistory.length - 1]} Hz
            </span>
          </div>
          <svg width="100%" height="60" viewBox="0 0 300 60" preserveAspectRatio="none">
            {/* Center zero line */}
            <line x1="0" y1="30" x2="300" y2="30" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" strokeWidth="1" />
            {(() => {
              const points = driftHistory.map((val, idx) => {
                const x = (idx / (driftHistory.length - 1)) * 300;
                const y = 30 - (val / 150) * 25;
                return `${x},${y}`;
              });
              return (
                <polyline points={points.join(' ')} fill="none" stroke="#f59e0b" strokeWidth="2" />
              );
            })()}
          </svg>
        </div>

      </div>

      {/* ── SECTION E: VISUAL SIGNAL ELEMENTS (LED BARS & CHANNEL GRID) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
        
        {/* Signal Strength Multi-segment LED Bar */}
        <div className="ud-info-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', color: '#8c857b', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
            CARRIER SIGNAL STRENGTH BAR (16-SEGMENT S-METER)
          </span>

          <div style={{ display: 'flex', gap: '4px', height: '24px', padding: '4px', background: '#040711', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {Array.from({ length: 16 }).map((_, idx) => {
              const threshold = -110 + (idx * 4.3);
              const isActive = currentRssi >= threshold;
              let segColor = '#10b981'; // green for lower
              if (idx > 10) segColor = '#f59e0b'; // amber
              if (idx > 13) segColor = '#ef4444'; // red peak

              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: '100%',
                    borderRadius: '2px',
                    background: isActive ? segColor : 'rgba(255, 255, 255, 0.05)',
                    boxShadow: isActive ? `0 0 6px ${segColor}` : 'none',
                    transition: 'background 0.2s'
                  }}
                />
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8c857b', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
            <span>-110 dBm</span>
            <span>S-1</span>
            <span>S-5</span>
            <span>S-9</span>
            <span>+20 dB</span>
          </div>
        </div>

        {/* Flight Sub-GHz Channels Activity Matrix */}
        <div className="ud-info-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', color: '#8c857b', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
            SUB-GHZ FLIGHT PASSBAND ACTIVITY (CH 01 - CH 12)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
            {Array.from({ length: 12 }).map((_, idx) => {
              const chNum = idx + 1;
              const isTuned = chNum === 5; // e.g. Ch 5 is primary
              const isOccupied = isTuned || chNum === 2 || chNum === 9;
              return (
                <div
                  key={idx}
                  style={{
                    padding: '6px 4px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    background: isTuned ? 'rgba(0, 245, 255, 0.15)' : isOccupied ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                    border: `1px solid ${isTuned ? '#00f5ff' : isOccupied ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                    color: isTuned ? '#00f5ff' : isOccupied ? '#38bdf8' : '#64748b',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  <div style={{ fontWeight: isTuned ? 800 : 400 }}>CH {chNum.toString().padStart(2, '0')}</div>
                  <div style={{ fontSize: '9px', opacity: 0.8 }}>{isTuned ? 'LOCK' : isOccupied ? 'ACT' : 'IDLE'}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

import { Shield, Wifi, Radio, Cpu, Activity, Sparkles, MapPin, Globe, CheckCircle2 } from 'lucide-react';

/**
 * Reusable Glassmorphic HUD Telemetry Badges & Floating Cards
 */
export function LiveTelemetryBadge({ callsign = 'AEROSPEC-01', noradId = 'NORAD-59142', orbit = 'LEO (540 KM)' }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px',
      borderRadius: '8px',
      background: 'rgba(7, 13, 27, 0.75)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(0, 245, 255, 0.3)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 0 12px rgba(0, 245, 255, 0.08)',
      fontFamily: 'var(--font-mono, monospace)',
      fontSize: '11px',
      color: '#ffedd6'
    }}>
      <span style={{
        display: 'inline-block',
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: '#10b981',
        boxShadow: '0 0 8px #10b981'
      }} />
      <span style={{ color: '#00f5ff', fontWeight: 700 }}>{callsign}</span>
      <span style={{ color: '#8c857b' }}>|</span>
      <span style={{ color: '#38bdf8' }}>{noradId}</span>
      <span style={{ color: '#8c857b' }}>|</span>
      <span style={{ color: '#f59e0b' }}>{orbit}</span>
    </div>
  );
}

export function TargetLockIndicator({ label = 'SATELLITE TARGET LOCK', status = 'NOMINAL' }) {
  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: '10px',
      background: 'rgba(4, 10, 24, 0.8)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(16, 185, 129, 0.35)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        background: 'rgba(16, 185, 129, 0.15)',
        border: '1px solid #10b981',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#10b981'
      }}>
        <Sparkles size={16} />
      </div>
      <div>
        <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#8c857b', letterSpacing: '1px' }}>
          {label}
        </div>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: '#10b981', fontWeight: 700 }}>
          {status} // KEPLER-540-LEO
        </div>
      </div>
    </div>
  );
}

export function MissionHUDCard({ icon: Icon, title, desc, tag, metrics = [] }) {
  return (
    <div style={{
      padding: '24px',
      borderRadius: '12px',
      background: 'rgba(7, 13, 27, 0.72)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(0, 245, 255, 0.2)',
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 245, 255, 0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'all 0.3s ease',
      cursor: 'default'
    }}
    className="hud-hover-glow"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: 'rgba(0, 245, 255, 0.1)',
          border: '1px solid rgba(0, 245, 255, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00f5ff'
        }}>
          {Icon ? <Icon size={20} /> : <Activity size={20} />}
        </div>
        {tag && (
          <span style={{
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'rgba(0, 245, 255, 0.08)',
            border: '1px solid rgba(0, 245, 255, 0.25)',
            color: '#00f5ff',
            letterSpacing: '1px'
          }}>
            {tag}
          </span>
        )}
      </div>

      <h3 style={{ margin: 0, fontSize: '18px', color: '#ffedd6', fontFamily: 'var(--font-sans)', fontWeight: 700 }}>
        {title}
      </h3>

      <p style={{ margin: 0, fontSize: '13px', color: '#c9bbaa', lineHeight: '1.6' }}>
        {desc}
      </p>

      {metrics.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${metrics.length}, 1fr)`,
          gap: '8px',
          marginTop: 'auto',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {metrics.map((m, i) => (
            <div key={i}>
              <span style={{ fontSize: '10px', color: '#8c857b', display: 'block', fontFamily: 'var(--font-mono)' }}>
                {m.label}
              </span>
              <strong style={{ fontSize: '13px', color: m.color || '#00f5ff', fontFamily: 'var(--font-mono)' }}>
                {m.val}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Unlock, RefreshCw, Terminal } from 'lucide-react';

const CIPHER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ΔΨΩΣΠΞ#$@%&*!';

export default function SmartEncryptor() {
  const [inputText, setInputText] = useState('AEROSPEC-1');
  const [displayText, setDisplayText] = useState('AEROSPEC-1');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Scramble / Unscramble animation effect
  const handleFlip = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const target = isEncrypted 
      ? inputText 
      : inputText.split('').map(char => {
          if (char === ' ') return ' ';
          return CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
        }).join('');

    let iterations = 0;
    const maxIterations = 12;

    const interval = setInterval(() => {
      setDisplayText(prev => 
        prev.split('').map((char, index) => {
          if (char === ' ') return ' ';
          if (iterations > index * 1.5) {
            return target[index] || '';
          }
          return CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
        }).join('')
      );

      iterations++;
      if (iterations > maxIterations + target.length * 1.5) {
        clearInterval(interval);
        setDisplayText(target);
        setIsEncrypted(!isEncrypted);
        setIsAnimating(false);
      }
    }, 45);
  };

  return (
    <div className="encryption-card">
      <div className="encryption-header">
        <div className="sub-tagline">
          <Terminal size={14} className="icon-cyan" />
          <span>SECURE TELEMETRY LINK SIMPLIFIED</span>
        </div>
        <h2 className="section-title">
          Smart flip <br />
          <span className="gradient-text">downlink cipher</span>
        </h2>
        <p className="body-desc">
          Type your flight directive. Click flip. Instantly encrypted with zero-latency telemetry scramble - until ground crew flips it back. Genius.
        </p>
      </div>

      <div className="encryption-interactive-box">
        {/* Decorative Grid Lines */}
        <div className="grid-decor-lines">
          <div className="line" />
          <div className="line" />
          <div className="line" />
          <div className="line" />
        </div>

        {/* Input & Animated Display */}
        <div className="input-row">
          <input
            type="text"
            className="cipher-input"
            value={inputText}
            maxLength={18}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setInputText(val);
              if (!isEncrypted) setDisplayText(val);
            }}
            placeholder="TYPE CALLSIGN"
          />
          <div className="cipher-status">
            {isEncrypted ? (
              <span className="badge-status locked">
                <Lock size={12} /> ENCRYPTED PACKET
              </span>
            ) : (
              <span className="badge-status open">
                <Unlock size={12} /> CLEAR TEXT STREAM
              </span>
            )}
          </div>
        </div>

        {/* Live Scrambled Output Display */}
        <div className="scramble-display">
          <div className="scramble-chars">
            {displayText.split('').map((char, idx) => (
              <span 
                key={idx} 
                className={`scramble-char ${isEncrypted ? 'encrypted-char' : ''}`}
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Flip Action Button */}
        <button
          className={`flip-btn ${isEncrypted ? 'is-encoded' : ''}`}
          onClick={handleFlip}
          disabled={isAnimating}
        >
          <span className="btn-inner">
            <RefreshCw size={16} className={isAnimating ? 'spin-icon' : ''} />
            <span>{isEncrypted ? 'Decode Telemetry' : 'Encode Telemetry'}</span>
          </span>
        </button>
      </div>

      <div className="cipher-footer-note">
        <ShieldCheck size={14} />
        <span>AES-256 Flight Telemetry · 0.00ms Encryption Overhead · Air-Gapped</span>
      </div>
    </div>
  );
}

// Deterministic Per-User Satellite Identity Generator
// Computes a stable, persistent spacecraft configuration derived from the user's ID/email.

function stringToHash(str) {
  let hash = 0;
  if (!str || str.length === 0) return 42;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

const CONSTELLATIONS = [
  'APEX-ORBITAL', 'NEXUS-LEO', 'AEROSPEC-ION', 'VANGUARD-SAT',
  'POLARIS-X', 'HORIZON-CORONA', 'ASTRIS-DEFENDER', 'AERO-SENTINEL'
];

const ORBIT_TYPES = [
  { type: 'Sun-Synchronous Orbit (SSO)', inclination: 97.4, altitude: 510, period: 94.8, speed: 7.61 },
  { type: 'Low Earth Orbit (LEO - 51.6°)', inclination: 51.6, altitude: 420, period: 92.9, speed: 7.66 },
  { type: 'Polar Reconnaissance Orbit', inclination: 90.0, altitude: 480, period: 94.1, speed: 7.63 },
  { type: 'Equatorial Atmospheric Relay', inclination: 28.5, altitude: 550, period: 95.6, speed: 7.59 },
  { type: 'High-Inclination Telemetry LEO', inclination: 64.8, altitude: 460, period: 93.7, speed: 7.64 }
];

export function generateSatelliteIdentity(user = {}) {
  const seed = `${user.id || ''}_${user.email || 'operator@aerospec.com'}_${user.createdAt || ''}`;
  const hash = stringToHash(seed);

  const satNumber = (hash % 899) + 101; // 101 to 999
  const paddedSatId = String(satNumber).padStart(3, '0');
  const constellation = CONSTELLATIONS[hash % CONSTELLATIONS.length];
  const orbitProfile = ORBIT_TYPES[hash % ORBIT_TYPES.length];
  
  const noradNumber = 50000 + (hash % 9999);
  const channelFreq = (440.0 + ((hash % 1000) / 100)).toFixed(3);
  const gainOffset = (18.0 + ((hash % 30) / 10)).toFixed(1);

  return {
    callsign: `AEROSPEC-SAT-${paddedSatId}`,
    noradId: `NORAD-${noradNumber}`,
    satNumber: paddedSatId,
    constellationName: `${constellation}-${paddedSatId}`,
    displayName: `${constellation} Telemetry Pod ${paddedSatId}`,
    orbitType: orbitProfile.type,
    altitudeKm: orbitProfile.altitude,
    altitudeFormatted: `${orbitProfile.altitude.toLocaleString()} km`,
    inclinationDeg: orbitProfile.inclination,
    inclinationFormatted: `${orbitProfile.inclination.toFixed(1)}°`,
    orbitalPeriodMin: orbitProfile.period,
    periodFormatted: `${orbitProfile.period} min`,
    velocityKmh: Math.round(orbitProfile.speed * 3600),
    velocityFormatted: `${(orbitProfile.speed).toFixed(2)} km/s (${Math.round(orbitProfile.speed * 3600).toLocaleString()} km/h)`,
    frequencyMHz: channelFreq,
    frequencyFormatted: `${channelFreq} MHz Sub-GHz`,
    rfGainDbm: `+${gainOffset} dBm`,
    encryptionScheme: 'QUANTUM-GCM-512 / AEROSPEC CIPHER',
    solarEfficiency: `${(96.5 + ((hash % 30) / 10)).toFixed(1)}%`,
    transponderStatus: 'ACTIVE & TRACKING',
    // 3D Orbital Trajectory parameters for SpaceEnvironment
    orbit3D: {
      radius: 7.5 + ((hash % 20) / 10), // 7.5 to 9.5 units
      speed: 0.003 + ((hash % 10) * 0.0004),
      inclinationAngle: ((orbitProfile.inclination - 45) * Math.PI) / 180,
      phaseOffset: ((hash % 360) * Math.PI) / 180,
      ringColor: '#00f5ff'
    }
  };
}

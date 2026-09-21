// Sanitized Mission & Telemetry Data Sheet Exporter (JSON / CSV)

export function generateDataSheetPayload({
  user = {},
  satellite = {},
  tenant = {},
  pods = [],
  missions = [],
  reports = []
} = {}) {
  const safeUser = user || {};
  const safeSat = satellite || {};
  const safeTenant = tenant || {};
  const safePods = Array.isArray(pods) ? pods : [];
  const safeMissions = Array.isArray(missions) ? missions : [];
  const safeReports = Array.isArray(reports) ? reports : [];

  return {
    aerospecExportMetadata: {
      generatedAt: new Date().toISOString(),
      system: 'AEROSPEC Mission Control Telemetry Platform',
      securityClassification: 'UNCLASSIFIED // OPERATOR TELEMETRY ARCHIVE',
      apiVersion: 'v2.4-SaaS'
    },
    operatorProfile: {
      id: safeUser.id || 'N/A',
      name: safeUser.name || 'Flight Operator',
      email: safeUser.email || 'N/A',
      role: (safeUser.role || 'user').toUpperCase(),
      status: safeUser.status || 'Active',
      organization: safeTenant.name || safeUser.organization || 'Apex Orbital Systems',
      activePlanTier: safeUser.planTier || safeTenant.planTier || 'cadet',
      accountCreated: safeUser.createdAt || 'N/A'
    },
    assignedSatelliteIdentity: {
      callsign: safeSat.callsign || 'N/A',
      noradCatalogId: safeSat.noradId || 'N/A',
      constellation: safeSat.constellationName || 'N/A',
      orbitType: safeSat.orbitType || 'Low Earth Orbit (LEO)',
      altitude: safeSat.altitudeFormatted || '450 km',
      inclination: safeSat.inclinationFormatted || '51.6°',
      orbitalPeriod: safeSat.periodFormatted || '92.9 min',
      orbitalVelocity: safeSat.velocityFormatted || '7.66 km/s',
      uplinkFrequency: safeSat.frequencyFormatted || '440.920 MHz Sub-GHz',
      rfTransmitGain: safeSat.rfGainDbm || '+18.5 dBm',
      encryptionScheme: safeSat.encryptionScheme || 'QUANTUM-GCM-512',
      solarArrayEfficiency: safeSat.solarEfficiency || '98.4%',
      transponderStatus: safeSat.transponderStatus || 'ACTIVE'
    },
    fleetTelemetryPods: safePods.map(p => ({
      id: p.id,
      callsign: p.callsign,
      hardwareModel: p.model,
      status: p.status,
      frequencyMHz: p.frequencyMHz,
      gainDBm: p.gainDBm,
      batteryPercentage: `${p.batteryPct}%`,
      rssiSignalDBm: `${p.rssiDBm} dBm`,
      snrRatioDB: `${p.snrDB} dB`,
      altitudeFeet: p.altitudeFt,
      speedKmh: p.speedKmh,
      latitude: p.latitude,
      longitude: p.longitude,
      temperatureCelsius: p.temperatureC,
      uptime: p.uptime,
      cipherScheme: p.encryption || 'AES-256-GCM'
    })),
    flightOperationsMissions: safeMissions.map(m => ({
      id: m.id,
      missionCode: m.code,
      title: m.title,
      targetOrbit: m.targetOrbit,
      status: m.status,
      leadOperator: m.leadOperator,
      assignedPods: (m.assignedPods || []).join(', '),
      progressPercentage: `${m.progressPct}%`
    })),
    archivedTelemetryReports: safeReports.map(r => ({
      id: r.id,
      title: r.title,
      reportType: r.type,
      date: r.date,
      fileSize: r.size,
      verificationStatus: r.status
    }))
  };
}

export function downloadJsonDataSheet(data, filename = 'AeroSpace_Mission_DataSheet.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCsvDataSheet(data, filename = 'AeroSpace_Telemetry_Fleet.csv') {
  const pods = data.fleetTelemetryPods || [];
  const headers = [
    'Pod ID',
    'Callsign',
    'Model',
    'Status',
    'Frequency (MHz)',
    'Gain (dBm)',
    'Battery',
    'RSSI (dBm)',
    'SNR (dB)',
    'Altitude (ft)',
    'Speed (km/h)',
    'Latitude',
    'Longitude',
    'Temperature (°C)',
    'Uptime',
    'Cipher'
  ];

  const rows = pods.map(p => [
    `"${p.id || ''}"`,
    `"${p.callsign || ''}"`,
    `"${p.hardwareModel || ''}"`,
    `"${p.status || ''}"`,
    p.frequencyMHz || '',
    p.gainDBm || '',
    `"${p.batteryPercentage || ''}"`,
    `"${p.rssiSignalDBm || ''}"`,
    `"${p.snrRatioDB || ''}"`,
    p.altitudeFeet || '',
    p.speedKmh || '',
    p.latitude || '',
    p.longitude || '',
    p.temperatureCelsius || '',
    `"${p.uptime || ''}"`,
    `"${p.cipherScheme || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

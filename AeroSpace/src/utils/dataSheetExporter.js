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
  try {
    const safeData = data || {};
    const jsonStr = JSON.stringify(safeData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      } catch {
        // Safe cleanup
      }
    }, 250);
    return true;
  } catch (err) {
    console.error('Failed to download JSON data sheet:', err);
    return false;
  }
}

export function downloadCsvDataSheet(data, filename = 'AeroSpace_Telemetry_Fleet.csv') {
  try {
    const safeData = data || {};
    let pods = [];
    if (Array.isArray(safeData)) {
      pods = safeData;
    } else if (Array.isArray(safeData.fleetTelemetryPods)) {
      pods = safeData.fleetTelemetryPods;
    } else if (Array.isArray(safeData.pods)) {
      pods = safeData.pods;
    }

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

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = pods.length > 0 ? pods.map(p => [
      escapeCsv(p.id || p.podId || ''),
      escapeCsv(p.callsign || ''),
      escapeCsv(p.hardwareModel || p.model || 'AEROSPEC Standard'),
      escapeCsv(p.status || 'STANDBY'),
      p.frequencyMHz || p.frequency || '',
      p.gainDBm || p.gain || '',
      escapeCsv(typeof p.batteryPct !== 'undefined' ? `${p.batteryPct}%` : (p.batteryPercentage || '100%')),
      escapeCsv(typeof p.rssiDBm !== 'undefined' ? `${p.rssiDBm} dBm` : (p.rssiSignalDBm || '-60 dBm')),
      escapeCsv(typeof p.snrDB !== 'undefined' ? `${p.snrDB} dB` : (p.snrRatioDB || '18 dB')),
      p.altitudeFt || p.altitudeFeet || '',
      p.speedKmh || '',
      p.latitude || '',
      p.longitude || '',
      p.temperatureC || p.temperatureCelsius || '',
      escapeCsv(p.uptime || 'Active'),
      escapeCsv(p.cipherScheme || p.encryption || 'AES-256-GCM')
    ]) : [
      [
        escapeCsv('DEMO-01'),
        escapeCsv('AERO-POD-09'),
        escapeCsv('AEROSPEC Pro'),
        escapeCsv('ONLINE'),
        '440.920',
        '18.5',
        escapeCsv('94%'),
        escapeCsv('-62 dBm'),
        escapeCsv('18.4 dB'),
        '12450',
        '480',
        '28.6139',
        '77.2090',
        '22.4',
        escapeCsv('14h 32m'),
        escapeCsv('AES-256-GCM')
      ]
    ];

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      } catch {
        // Safe cleanup
      }
    }, 250);
    return true;
  } catch (err) {
    console.error('Failed to download CSV data sheet:', err);
    return false;
  }
}

export function downloadReportFile(report, activePod, podHistory = []) {
  const repId = report?.id || 'REP-EXPORT';
  const timestamp = new Date().toISOString().split('T')[0];
  const payload = {
    reportId: repId,
    title: report?.title || 'Flight Telemetry Report',
    type: report?.type || 'RF Telemetry',
    generatedDate: report?.date || timestamp,
    status: report?.status || 'Verified',
    sourceVehicle: activePod?.callsign || 'AERO-POD-09',
    frequency: activePod?.frequencyMHz ? `${activePod.frequencyMHz} MHz` : '440.920 MHz',
    telemetryReadings: Array.isArray(podHistory) && podHistory.length > 0 ? podHistory : [
      { time: '17:20', altitudeFt: 10200, speedKmh: 420, rssiDBm: -68 },
      { time: '17:25', altitudeFt: 11100, speedKmh: 450, rssiDBm: -65 },
      { time: '17:30', altitudeFt: 11800, speedKmh: 470, rssiDBm: -64 },
      { time: '17:35', altitudeFt: 12200, speedKmh: 480, rssiDBm: -63 },
      { time: '17:40', altitudeFt: 12450, speedKmh: 480, rssiDBm: -62 }
    ]
  };

  return downloadJsonDataSheet(payload, `AeroSpec_Report_${repId}_${timestamp}.json`);
}

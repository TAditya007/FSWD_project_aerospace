import { useState } from 'react';
import { Download, FileText, Database, ShieldCheck, Check, X, Sparkles } from 'lucide-react';
import { generateDataSheetPayload, downloadJsonDataSheet, downloadCsvDataSheet } from '../utils/dataSheetExporter';

export default function DataSheetModal({ 
  isOpen,
  onClose,
  user,
  currentUser,
  satellite,
  tenant,
  pods,
  missions,
  reports
}) {
  // If modal is not open, do not render into DOM
  if (!isOpen) return null;

  const [downloadedFormat, setDownloadedFormat] = useState(null);

  // Safely resolve user from either prop
  const activeUser = user || currentUser || {};
  const activeSat = satellite || {
    callsign: 'AEROSPEC-SAT-042',
    noradId: 'NORAD-59142',
    orbitType: 'Low Earth Orbit (LEO)'
  };
  const activePods = Array.isArray(pods) ? pods : [];
  const activeMissions = Array.isArray(missions) ? missions : [];
  const activeReports = Array.isArray(reports) ? reports : [];
  const activeTenant = tenant || {};

  const payload = generateDataSheetPayload({
    user: activeUser,
    satellite: activeSat,
    tenant: activeTenant,
    pods: activePods,
    missions: activeMissions,
    reports: activeReports
  });

  const timestamp = new Date().toISOString().split('T')[0];
  const satCallsign = activeSat?.callsign || 'AEROSPEC-SAT';

  const handleDownloadJson = () => {
    downloadJsonDataSheet(payload, `AeroSpace_MissionData_${satCallsign}_${timestamp}.json`);
    setDownloadedFormat('JSON');
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  const handleDownloadCsv = () => {
    downloadCsvDataSheet(payload, `AeroSpace_FleetTelemetry_${satCallsign}_${timestamp}.csv`);
    setDownloadedFormat('CSV');
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  return (
    <div className="ud-modal-backdrop" onClick={onClose}>
      <div className="ud-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="ud-modal-title" style={{ margin: 0 }}>
            <Database size={20} color="var(--hud-accent, #00f5ff)" /> Export Aerospace Data Sheet
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: '13px', color: '#c9bbaa', lineHeight: '1.5', marginBottom: '16px' }}>
          Generate and download a comprehensive, cryptographically sanitized archive of your flight telemetry, satellite identity, mission history, and active fleet pods.
        </div>

        {/* Security & Sanitization Badge */}
        <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#34d399', marginBottom: '18px' }}>
          <ShieldCheck size={18} />
          <span>Sanitization Active: Passwords, OTPs, and private server secrets are excluded.</span>
        </div>

        {/* Summary Card */}
        <div style={{ background: 'rgba(0, 245, 255, 0.04)', border: '1px solid rgba(0, 245, 255, 0.15)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#8c857b' }}>Operator Call:</span>
            <strong style={{ color: '#f8fafc' }}>
              {activeUser?.name || 'Flight Operator'} ({activeUser?.email || 'N/A'})
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#8c857b' }}>Assigned Satellite:</span>
            <strong style={{ color: 'var(--hud-accent, #00f5ff)' }}>
              {activeSat?.callsign || 'AEROSPEC-SAT'} [{activeSat?.orbitType || 'Low Earth Orbit'}]
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#8c857b' }}>Active Fleet Pods:</span>
            <span style={{ color: '#f8fafc' }}>{activePods.length} Registered Telemetry Pods</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#8c857b' }}>Flight Missions Logged:</span>
            <span style={{ color: '#f8fafc' }}>{activeMissions.length} Missions</span>
          </div>
        </div>

        {downloadedFormat && (
          <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', borderRadius: '6px', fontSize: '12px', marginBottom: '14px', textAlign: 'center' }}>
            ✓ Successfully downloaded {downloadedFormat} Data Sheet!
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <button
            type="button"
            className="ud-modal-submit"
            onClick={handleDownloadJson}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px' }}
          >
            <FileText size={16} /> Download Full JSON Archive
          </button>

          <button
            type="button"
            className="ud-modal-submit"
            onClick={handleDownloadCsv}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' }}
          >
            <Download size={16} /> Download Fleet CSV
          </button>
        </div>

        <div className="ud-modal-actions" style={{ marginTop: '16px' }}>
          <button type="button" className="ud-modal-cancel" style={{ width: '100%' }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

const INITIAL_DATA = {
  users: [
    {
      id: 'usr_1',
      name: 'System Admin',
      email: 'admin@aerospec.com',
      password: 'admin123',
      role: 'admin',
      status: 'Active',
      createdAt: '2026-01-15'
    },
    {
      id: 'usr_2',
      name: 'Operator Vijay',
      email: 'user@aerospec.com',
      password: 'user123',
      role: 'user',
      status: 'Active',
      createdAt: '2026-02-01'
    },
    {
      id: 'usr_3',
      name: 'Telemetry Engineer Maya',
      email: 'maya@aerospec.com',
      password: 'maya123',
      role: 'user',
      status: 'Active',
      createdAt: '2026-02-10'
    },
    {
      id: 'usr_4',
      name: 'Flight Specialist Alex',
      email: 'alex@aerospec.com',
      password: 'alex123',
      role: 'user',
      status: 'Active',
      createdAt: '2026-03-05'
    }
  ],
  telemetry: {
    podId: 'AERO-POD-09',
    status: 'ONLINE',
    frequency: '440.92 MHz',
    rssi: '-62 dBm',
    snr: '18.4 dB',
    battery: '94%',
    latitude: 28.6139,
    longitude: 77.2090,
    altitude: '12,450 ft',
    speed: '480 km/h',
    temperature: '22.4 °C',
    uptime: '14h 32m'
  },
  reports: [
    {
      id: 'REP-1049',
      title: 'Orbital Pod Signal Telemetry Log',
      date: '2026-09-18',
      type: 'RF Telemetry',
      size: '2.4 MB',
      status: 'Verified',
      downloadUrl: '#'
    },
    {
      id: 'REP-1048',
      title: 'Atmospheric Sensor Calibration Diagnostic',
      date: '2026-09-17',
      type: 'Diagnostic',
      size: '1.8 MB',
      status: 'Verified',
      downloadUrl: '#'
    },
    {
      id: 'REP-1047',
      title: 'Transponder Frequency Audit Report',
      date: '2026-09-15',
      type: 'Frequency',
      size: '4.1 MB',
      status: 'Archive',
      downloadUrl: '#'
    },
    {
      id: 'REP-1046',
      title: 'Flight Hardware Thermal Integrity Log',
      date: '2026-09-12',
      type: 'Hardware',
      size: '3.0 MB',
      status: 'Verified',
      downloadUrl: '#'
    }
  ],
  logs: [
    {
      id: 'log_1',
      timestamp: '2026-09-18 08:30:12',
      type: 'AUTH',
      event: 'System Admin authenticated via Unified Portal',
      user: 'admin@aerospec.com',
      severity: 'info'
    },
    {
      id: 'log_2',
      timestamp: '2026-09-18 08:15:44',
      type: 'TELEMETRY',
      event: 'Pod AERO-POD-09 handshake established on 433.92 MHz',
      user: 'SYSTEM',
      severity: 'success'
    },
    {
      id: 'log_3',
      timestamp: '2026-09-18 07:45:00',
      type: 'SECURITY',
      event: 'Failed login attempt from IP 192.168.1.104',
      user: 'unknown@aerospec.com',
      severity: 'warning'
    },
    {
      id: 'log_4',
      timestamp: '2026-09-17 22:10:19',
      type: 'CONFIG',
      event: 'RF Signal gain adjusted to +18dBm by Operator Vijay',
      user: 'user@aerospec.com',
      severity: 'info'
    }
  ]
};

// Ensure db file exists
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATA, null, 2));
      return INITIAL_DATA;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB:', err);
    return INITIAL_DATA;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

export const db = {
  // Users
  getUserByEmail: (email) => {
    const data = readDb();
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  getAllUsers: () => {
    const data = readDb();
    return data.users.map(({ password, ...u }) => u);
  },
  createUser: (newUser) => {
    const data = readDb();
    const existing = data.users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (existing) throw new Error('User with this email already exists.');

    const created = {
      id: `usr_${Date.now()}`,
      name: newUser.name || newUser.email.split('@')[0],
      email: newUser.email,
      password: newUser.password,
      role: newUser.role || 'user',
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0]
    };
    data.users.push(created);

    // Add audit log
    data.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'AUTH',
      event: `New account created: ${created.email} (${created.role})`,
      user: created.email,
      severity: 'info'
    });

    writeDb(data);
    const { password, ...safeUser } = created;
    return safeUser;
  },
  updateUserRole: (id, newRole) => {
    const data = readDb();
    const user = data.users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    user.role = newRole;

    data.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'ADMIN',
      event: `Role updated for ${user.email} to ${newRole}`,
      user: 'ADMIN',
      severity: 'warning'
    });

    writeDb(data);
    const { password, ...safeUser } = user;
    return safeUser;
  },
  deleteUser: (id) => {
    const data = readDb();
    const index = data.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    const removed = data.users.splice(index, 1)[0];

    data.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'ADMIN',
      event: `User removed: ${removed.email}`,
      user: 'ADMIN',
      severity: 'danger'
    });

    writeDb(data);
    return true;
  },

  // Telemetry & Reports & Logs
  getTelemetry: () => {
    const data = readDb();
    return data.telemetry;
  },
  getReports: () => {
    const data = readDb();
    return data.reports;
  },
  getLogs: () => {
    const data = readDb();
    return data.logs;
  },
  addLog: (log) => {
    const data = readDb();
    const newLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...log
    };
    data.logs.unshift(newLog);
    writeDb(data);
    return newLog;
  }
};

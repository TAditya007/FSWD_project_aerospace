import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BUNDLED_DB_PATH = path.join(__dirname, 'db.json');
const isServerless = Boolean(process.env.K_SERVICE || process.env.FUNCTION_TARGET || process.env.FIREBASE_CONFIG);
const DB_PATH = isServerless ? path.join('/tmp', 'db.json') : BUNDLED_DB_PATH;

if (isServerless && !fs.existsSync(DB_PATH) && fs.existsSync(BUNDLED_DB_PATH)) {
  try {
    fs.copyFileSync(BUNDLED_DB_PATH, DB_PATH);
  } catch (err) {
    console.warn('Could not copy db.json to /tmp:', err);
  }
}

export const PLAN_LIMITS = {
  cadet: { name: 'Cadet (Free)', maxPods: 2, price: '₹0/mo', priceAmount: 0, billingPeriod: 'month', dataRetentionDays: 7 },
  orbital: { name: 'Orbital', maxPods: 5, price: '₹130/mo', priceAmount: 130, billingPeriod: 'month', dataRetentionDays: 30 },
  orbital_pro: { name: 'Orbital Pro', maxPods: 15, price: '₹440/mo', priceAmount: 440, billingPeriod: 'month', dataRetentionDays: 90 },
  interstellar_max: { name: 'Interstellar Max', maxPods: 999, price: '₹515/mo', priceAmount: 515, billingPeriod: 'month', dataRetentionDays: 365 }
};

// In-memory / persisted 2FA OTP Store
const otpStore = new Map(); // email -> { otp, expiresAt, type }

const INITIAL_DATA = {
  organization: {
    id: 'org_apex_orbital',
    name: 'Apex Orbital Systems',
    slug: 'apex-orbital',
    planTier: 'cadet', // Default is basic CADET
    createdAt: '2026-01-01'
  },
  users: [
    {
      id: 'usr_admin_1',
      orgId: 'org_apex_orbital',
      name: 'System Admin Vijay',
      email: 'vijay@aerospec.com',
      password: 'vijay@2007',
      role: 'admin',
      status: 'Active',
      planTier: 'interstellar_max',
      apiKey: 'aero_live_admin_vijay_2007',
      createdAt: '2026-01-10'
    },
    {
      id: 'usr_admin_2',
      orgId: 'org_apex_orbital',
      name: 'System Admin Aditya',
      email: 'aditya@aerospec.com',
      password: 'aditya@007',
      role: 'admin',
      status: 'Active',
      planTier: 'interstellar_max',
      apiKey: 'aero_live_admin_aditya_007',
      createdAt: '2026-01-10'
    },
    {
      id: 'usr_op_1',
      orgId: 'org_apex_orbital',
      name: 'Operator Vijay',
      email: 'user@aerospec.com',
      password: 'user123',
      role: 'user',
      status: 'Active',
      planTier: 'cadet', // Default basic CADET
      apiKey: 'aero_live_usr_op_772194',
      createdAt: '2026-02-01'
    },
    {
      id: 'usr_op_2',
      orgId: 'org_apex_orbital',
      name: 'Telemetry Engineer Maya',
      email: 'maya@aerospec.com',
      password: 'maya123',
      role: 'user',
      status: 'Active',
      planTier: 'cadet',
      apiKey: 'aero_live_usr_maya_338102',
      createdAt: '2026-02-10'
    }
  ],
  telemetryPods: [
    {
      id: 'pod_01',
      orgId: 'org_apex_orbital',
      callsign: 'AERO-POD-09',
      model: 'AEROSPEC Pro',
      status: 'ONLINE',
      frequencyMHz: 440.920,
      gainDBm: 18.5,
      batteryPct: 94,
      rssiDBm: -62,
      snrDB: 18.4,
      latitude: 28.6139,
      longitude: 77.2090,
      altitudeFt: 12450,
      speedKmh: 480,
      temperatureC: 22.4,
      uptime: '14h 32m',
      encryption: 'AES-256-GCM / AEROSPEC CIPHER',
      emergencyOverride: false,
      lastPing: 'Just now'
    },
    {
      id: 'pod_02',
      orgId: 'org_apex_orbital',
      callsign: 'PHOENIX-X1',
      model: 'AEROSPEC Pro Max',
      status: 'TRANSMITTING',
      frequencyMHz: 442.150,
      gainDBm: 21.0,
      batteryPct: 88,
      rssiDBm: -54,
      snrDB: 22.1,
      latitude: 19.0760,
      longitude: 72.8777,
      altitudeFt: 28900,
      speedKmh: 820,
      temperatureC: -14.2,
      uptime: '42h 10m',
      encryption: 'QUANTUM-GCM-512 / DUAL-BAND',
      emergencyOverride: false,
      lastPing: '2s ago'
    },
    {
      id: 'pod_03',
      orgId: 'org_apex_orbital',
      callsign: 'VALKYRIE-04',
      model: 'AEROSPEC',
      status: 'STANDBY',
      frequencyMHz: 433.920,
      gainDBm: 14.0,
      batteryPct: 100,
      rssiDBm: -41,
      snrDB: 28.0,
      latitude: 12.9716,
      longitude: 77.5946,
      altitudeFt: 350,
      speedKmh: 0,
      temperatureC: 26.8,
      uptime: '3h 15m',
      encryption: 'STANDARD AEROSPEC CIPHER',
      emergencyOverride: false,
      lastPing: '10s ago'
    },
    {
      id: 'pod_04',
      orgId: 'org_apex_orbital',
      callsign: 'STARGAZER-02',
      model: 'AEROSPEC Pro',
      status: 'ONLINE',
      frequencyMHz: 446.000,
      gainDBm: 16.0,
      batteryPct: 76,
      rssiDBm: -78,
      snrDB: 14.2,
      latitude: 17.3850,
      longitude: 78.4867,
      altitudeFt: 18200,
      speedKmh: 610,
      temperatureC: 8.5,
      uptime: '8h 44m',
      encryption: 'AES-256-GCM',
      emergencyOverride: false,
      lastPing: '5s ago'
    }
  ],
  telemetryReadings: [
    { id: 'tlm_1', podId: 'pod_01', time: '17:20', altitudeFt: 10200, speedKmh: 420, rssiDBm: -68, batteryPct: 98 },
    { id: 'tlm_2', podId: 'pod_01', time: '17:25', altitudeFt: 11100, speedKmh: 450, rssiDBm: -65, batteryPct: 97 },
    { id: 'tlm_3', podId: 'pod_01', time: '17:30', altitudeFt: 11800, speedKmh: 470, rssiDBm: -64, batteryPct: 96 },
    { id: 'tlm_4', podId: 'pod_01', time: '17:35', altitudeFt: 12200, speedKmh: 480, rssiDBm: -63, batteryPct: 95 },
    { id: 'tlm_5', podId: 'pod_01', time: '17:40', altitudeFt: 12450, speedKmh: 480, rssiDBm: -62, batteryPct: 94 }
  ],
  missions: [
    {
      id: 'mis_01',
      orgId: 'org_apex_orbital',
      code: 'MISSION-ALPHA-07',
      title: 'Endurance Ring Centrifugal Spin Validation',
      targetOrbit: 'Low Earth Orbit (LEO) - 420 km',
      status: 'ACTIVE_FLIGHT',
      assignedPods: ['pod_01', 'pod_02'],
      leadOperator: 'Operator Vijay',
      launchWindow: '2026-09-20 06:00:00 UTC',
      progressPct: 68
    },
    {
      id: 'mis_02',
      orgId: 'org_apex_orbital',
      code: 'MISSION-STRATO-03',
      title: 'Sub-GHz Transceiver Atmospheric Survey',
      targetOrbit: 'Stratospheric Glide (FL600)',
      status: 'PLANNING',
      assignedPods: ['pod_03'],
      leadOperator: 'Telemetry Engineer Maya',
      launchWindow: '2026-09-22 14:30:00 UTC',
      progressPct: 15
    }
  ],
  reports: [
    {
      id: 'REP-1049',
      podId: 'pod_01',
      title: 'Orbital Pod Signal Telemetry Log',
      date: '2026-09-18',
      type: 'RF Telemetry',
      size: '2.4 MB',
      status: 'Verified',
      downloadUrl: '#'
    },
    {
      id: 'REP-1048',
      podId: 'pod_02',
      title: 'Atmospheric Sensor Diagnostic',
      date: '2026-09-17',
      type: 'Diagnostic',
      size: '1.8 MB',
      status: 'Verified',
      downloadUrl: '#'
    }
  ],
  logs: [
    {
      id: 'log_1',
      timestamp: '2026-09-20 17:50:00',
      type: 'AUTH',
      event: 'Whitelisted System Admin accounts verified: vijay@aerospec.com, aditya@aerospec.com',
      user: 'SYSTEM',
      severity: 'success'
    }
  ]
};

// Database Read/Write
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATA, null, 2));
      return INITIAL_DATA;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);

    // Ensure designated admins exist in the DB
    let modified = false;
    if (!parsed.users) parsed.users = [];

    const ensureAdmin = (adminUser) => {
      const existing = parsed.users.find(u => u.email.toLowerCase() === adminUser.email.toLowerCase());
      if (!existing) {
        parsed.users.unshift(adminUser);
        modified = true;
      } else {
        // Guarantee password & role are updated to user request
        if (existing.password !== adminUser.password || existing.role !== 'admin') {
          existing.password = adminUser.password;
          existing.role = 'admin';
          existing.name = adminUser.name;
          modified = true;
        }
      }
    };

    ensureAdmin(INITIAL_DATA.users[0]); // vijay@aerospec.com
    ensureAdmin(INITIAL_DATA.users[1]); // aditya@aerospec.com

    if (!parsed.organization) {
      parsed.organization = INITIAL_DATA.organization;
      modified = true;
    }
    if (!parsed.telemetryPods || parsed.telemetryPods.length === 0) {
      parsed.telemetryPods = INITIAL_DATA.telemetryPods;
      modified = true;
    }
    if (!parsed.payments) {
      parsed.payments = [
        {
          id: 'pay_demo_1',
          orderId: 'ORD_1789914500001',
          userId: 'usr_op_1',
          userEmail: 'user@aerospec.com',
          userName: 'Operator Vijay',
          planTier: 'orbital_pro',
          planName: 'Orbital Pro',
          amount: '₹440/mo',
          gateway: 'PhonePe',
          paymentId: '9866606967@superyes',
          utr: '428190382910',
          status: 'Pending Approval',
          createdAt: '2026-09-20 14:15:00',
          approvedAt: null,
          approvedBy: null
        }
      ];
      modified = true;
    }
    if (!parsed.admin_actions) {
      parsed.admin_actions = [];
      modified = true;
    }
    if (!parsed.otp_logs) {
      parsed.otp_logs = [];
      modified = true;
    }

    if (modified) {
      writeDb(parsed);
    }

    return parsed;
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
  // ── 2FA EMAIL OTP DISPATCH & VERIFICATION ──
  generateOTP: (email, type = 'LOGIN') => {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email.toLowerCase(), {
      otp: code,
      expiresAt,
      type
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n📧 [EMAIL DISPATCH SIMULATOR] ───────────────────────`);
      console.log(`To: ${email}`);
      console.log(`Subject: Your AeroSpace 2FA Security Code: [ ${code} ]`);
      console.log(`Code valid for 10 minutes.`);
      console.log(`──────────────────────────────────────────────────────\n`);
    }

    db.addLog({
      type: 'AUTH',
      event: `2FA OTP email dispatched to ${email}`,
      user: email,
      severity: 'info'
    });

    return code;
  },

  verifyOTP: (email, inputOtp) => {
    const record = otpStore.get(email.toLowerCase());
    if (!record) {
      return { success: false, message: 'No active OTP requested for this email. Please request a new code.' };
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return { success: false, message: 'Security code has expired. Please request a new OTP.' };
    }

    if (record.otp !== inputOtp.trim()) {
      return { success: false, message: 'Invalid 6-digit OTP code. Please try again.' };
    }

    otpStore.delete(email.toLowerCase());
    return { success: true };
  },

  // ── USERS & ACCOUNT SURVEILLANCE ──
  getUserByEmail: (email) => {
    const data = readDb();
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  // Returns safe users for regular client
  getAllUsers: () => {
    const data = readDb();
    return data.users.map(({ password, ...u }) => u);
  },

  // Returns complete credentials including password for admin monitoring
  getAllUsersForAdmin: () => {
    const data = readDb();
    return data.users; // Admin needs to monitor emails, passwords, and status
  },

  // Any user can register with any email
  createUser: (newUser) => {
    const data = readDb();
    const existing = data.users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (existing) throw new Error('An account with this email already exists.');

    const isDesignatedAdmin = (
      newUser.email.toLowerCase() === 'vijay@aerospec.com' ||
      newUser.email.toLowerCase() === 'aditya@aerospec.com'
    );

    const created = {
      id: `usr_${Date.now()}`,
      orgId: data.organization?.id || 'org_apex_orbital',
      name: newUser.name || newUser.email.split('@')[0],
      email: newUser.email,
      password: newUser.password,
      role: isDesignatedAdmin ? 'admin' : (newUser.role || 'user'),
      status: 'Active',
      planTier: 'cadet',
      apiKey: `aero_live_${Math.random().toString(36).substring(2, 12)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    data.users.push(created);

    data.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'AUTH',
      event: `User registered: ${created.email} (Role: ${created.role})`,
      user: created.email,
      severity: 'info'
    });

    writeDb(data);
    return created;
  },

  // Admin directly creates user account
  adminCreateUser: (userData) => {
    const data = readDb();
    const existing = data.users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) throw new Error('An account with this email already exists.');

    const created = {
      id: `usr_${Date.now()}`,
      orgId: data.organization?.id || 'org_apex_orbital',
      name: userData.name || userData.email.split('@')[0],
      email: userData.email,
      password: userData.password,
      role: userData.role || 'user',
      status: userData.status || 'Active',
      planTier: userData.planTier || 'cadet',
      apiKey: `aero_live_${Math.random().toString(36).substring(2, 12)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    data.users.push(created);

    data.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'ADMIN',
      event: `Admin provisioned user account: ${created.email} (${created.role})`,
      user: 'ADMIN',
      severity: 'warning'
    });

    writeDb(data);
    return created;
  },

  // Admin modifies ANY user detail (email, password, role, status, planTier)
  adminUpdateUser: (id, updates) => {
    const data = readDb();
    const user = data.users.find(u => u.id === id);
    if (!user) throw new Error('User not found.');

    if (updates.name !== undefined) user.name = updates.name;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.password !== undefined && updates.password.trim() !== '') user.password = updates.password;
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.status !== undefined) user.status = updates.status;
    if (updates.planTier !== undefined) user.planTier = updates.planTier;

    data.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'ADMIN',
      event: `Admin modified account credentials for ${user.email}`,
      user: 'ADMIN',
      severity: 'warning'
    });

    writeDb(data);
    return user;
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
      event: `User removed from database: ${removed.email}`,
      user: 'ADMIN',
      severity: 'danger'
    });

    writeDb(data);
    return true;
  },

  // ── USER PROFILE & ACCOUNT MANAGEMENT ──
  updateUserEmail: (currentEmail, newEmail) => {
    const data = readDb();
    const user = data.users.find(u => u.email.toLowerCase() === currentEmail.toLowerCase());
    if (!user) throw new Error('Current user account not found.');

    const duplicate = data.users.find(u => u.email.toLowerCase() === newEmail.toLowerCase() && u.id !== user.id);
    if (duplicate) throw new Error('An account with this new email address already exists.');

    const oldEmail = user.email;
    user.email = newEmail.toLowerCase().trim();

    data.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'ACCOUNT',
      event: `User updated email address: ${oldEmail} -> ${user.email}`,
      user: user.email,
      severity: 'info'
    });

    writeDb(data);
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  updateUserPassword: (email, newPassword) => {
    const data = readDb();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('Account not found.');

    user.password = newPassword;

    data.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'SECURITY',
      event: `Password updated for operator account: ${user.email}`,
      user: user.email,
      severity: 'info'
    });

    writeDb(data);
    return true;
  },

  updateUserTheme: (email, theme) => {
    const data = readDb();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('User not found.');
    user.theme = theme;
    writeDb(data);
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  getUserDataSheet: (email) => {
    const data = readDb();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('User not found.');

    const { password: _, salt: __, ...safeUser } = user;
    return {
      operator: safeUser,
      organization: data.organization || {},
      satellite: {
        callsign: `AEROSPEC-SAT-${user.id ? user.id.slice(-3).toUpperCase() : '001'}`,
        noradId: `NORAD-${50000 + ((user.id ? user.id.charCodeAt(user.id.length - 1) : 42) * 123) % 9000}`,
        orbitType: 'Low Earth Orbit (LEO)',
        altitudeKm: 520,
        inclinationDeg: 53.2,
        velocityKmS: 7.66,
        uplinkFreq: '440.920 MHz',
        powerEfficiency: '98.4%',
        status: 'ACTIVE'
      },
      pods: data.telemetryPods || [],
      missions: data.missions || [],
      reports: data.reports || [],
      payments: (data.payments || []).filter(p => p.userEmail?.toLowerCase() === email.toLowerCase())
    };
  },

  // ── USER SUBSCRIPTION CHECKOUT ──
  userSubscribe: (userId, planTier, billingDetails = {}) => {
    if (!PLAN_LIMITS[planTier]) {
      throw new Error(`Invalid plan tier: ${planTier}`);
    }
    const data = readDb();
    const user = data.users.find(u => u.id === userId);
    if (user) {
      user.planTier = planTier;
    }

    // Elevate tenant organization plan tier
    if (data.organization) {
      data.organization.planTier = planTier;
    }

    const planInfo = PLAN_LIMITS[planTier];
    const planName = planInfo.name;
    const orderId = billingDetails.orderId || `ORD_${Date.now()}`;
    const transactionId = billingDetails.transactionId || `TXN_${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const utr = billingDetails.utr || `${Math.floor(400000000000 + Math.random() * 500000000000)}`;
    const gateway = billingDetails.gateway || 'UPI_SCAN';
    const upiId = '9866606967@superyes';

    data.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'PAYMENT',
      event: `Payment verified: ${user?.email || 'User'} upgraded to ${planName} (${planInfo.price}) via ${gateway} [UPI: ${upiId}, UTR: ${utr}]`,
      user: user?.email || 'USER',
      severity: 'success'
    });

    writeDb(data);
    return {
      planTier,
      planDetails: planInfo,
      userPlan: user?.planTier,
      receipt: {
        orderId,
        transactionId,
        utr,
        gateway,
        upiId,
        amount: planInfo.price,
        planName,
        timestamp: new Date().toISOString(),
        status: 'PAID & ACTIVATED'
      },
      message: `Successfully activated ${planName} subscription (${planInfo.price})!`
    };
  },

  // ── ORGANIZATION / TENANT ──
  getOrganization: () => {
    const data = readDb();
    const org = data.organization || INITIAL_DATA.organization;
    const planInfo = PLAN_LIMITS[org.planTier] || PLAN_LIMITS.orbital_pro;
    const podCount = (data.telemetryPods || []).length;
    return {
      ...org,
      planDetails: planInfo,
      currentUsage: {
        activePods: podCount,
        maxPods: planInfo.maxPods,
        quotaPct: Math.min(100, Math.round((podCount / planInfo.maxPods) * 100))
      }
    };
  },

  updateOrgPlan: (newPlanTier) => {
    if (!PLAN_LIMITS[newPlanTier]) {
      throw new Error(`Invalid plan tier: ${newPlanTier}`);
    }
    const data = readDb();
    data.organization.planTier = newPlanTier;
    writeDb(data);
    return db.getOrganization();
  },

  // ── FLEET PODS ──
  getAllPods: () => {
    const data = readDb();
    return data.telemetryPods || [];
  },

  getPodById: (id) => {
    const data = readDb();
    return (data.telemetryPods || []).find(p => p.id === id);
  },

  createPod: (podData) => {
    const data = readDb();
    const org = data.organization || INITIAL_DATA.organization;
    const plan = PLAN_LIMITS[org.planTier] || PLAN_LIMITS.orbital_pro;
    const currentPods = data.telemetryPods || [];

    if (currentPods.length >= plan.maxPods) {
      throw new Error(`Quota exceeded: Your current plan (${plan.name}) allows a maximum of ${plan.maxPods} active pods. Please purchase an upgrade.`);
    }

    const newPod = {
      id: `pod_${Date.now()}`,
      orgId: org.id,
      callsign: podData.callsign || `AERO-POD-${currentPods.length + 10}`,
      model: podData.model || 'AEROSPEC Pro',
      status: 'ONLINE',
      frequencyMHz: Number(podData.frequencyMHz) || 440.920,
      gainDBm: Number(podData.gainDBm) || 18.0,
      batteryPct: 100,
      rssiDBm: -58,
      snrDB: 20.0,
      latitude: podData.latitude || 28.6139,
      longitude: podData.longitude || 77.2090,
      altitudeFt: Number(podData.altitudeFt) || 5000,
      speedKmh: Number(podData.speedKmh) || 350,
      temperatureC: 18.0,
      uptime: '0h 01m',
      encryption: podData.encryption || 'AES-256-GCM / AEROSPEC CIPHER',
      emergencyOverride: false,
      lastPing: 'Just now'
    };

    currentPods.push(newPod);
    data.telemetryPods = currentPods;

    writeDb(data);
    return newPod;
  },

  updatePod: (id, updates) => {
    const data = readDb();
    const pod = (data.telemetryPods || []).find(p => p.id === id);
    if (!pod) throw new Error(`Telemetry Pod ${id} not found.`);

    Object.assign(pod, updates);
    writeDb(data);
    return pod;
  },

  deletePod: (id) => {
    const data = readDb();
    const idx = (data.telemetryPods || []).findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Telemetry Pod ${id} not found.`);

    data.telemetryPods.splice(idx, 1);
    writeDb(data);
    return true;
  },

  getPodReadings: (podId) => {
    const data = readDb();
    const all = data.telemetryReadings || [];
    const readings = all.filter(r => r.podId === podId);
    if (readings.length > 0) return readings;

    return [
      { id: 'f1', podId, time: '17:20', altitudeFt: 8000, speedKmh: 400, rssiDBm: -70, batteryPct: 99 },
      { id: 'f2', podId, time: '17:25', altitudeFt: 9500, speedKmh: 430, rssiDBm: -67, batteryPct: 98 },
      { id: 'f3', podId, time: '17:30', altitudeFt: 11000, speedKmh: 460, rssiDBm: -64, batteryPct: 96 },
      { id: 'f4', podId, time: '17:35', altitudeFt: 12000, speedKmh: 475, rssiDBm: -63, batteryPct: 95 },
      { id: 'f5', podId, time: '17:40', altitudeFt: 12450, speedKmh: 480, rssiDBm: -62, batteryPct: 94 }
    ];
  },

  recordTelemetryReading: (reading) => {
    const data = readDb();
    if (!data.telemetryReadings) data.telemetryReadings = [];
    const entry = {
      id: `tlm_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...reading
    };
    data.telemetryReadings.push(entry);
    writeDb(data);
    return entry;
  },

  getAllMissions: () => {
    const data = readDb();
    return data.missions || [];
  },

  createMission: (missionData) => {
    const data = readDb();
    if (!data.missions) data.missions = [];

    const newMission = {
      id: `mis_${Date.now()}`,
      orgId: data.organization?.id || 'org_apex_orbital',
      code: missionData.code || `MISSION-OP-${data.missions.length + 1}`,
      title: missionData.title,
      targetOrbit: missionData.targetOrbit || 'Low Earth Orbit (LEO)',
      status: 'PLANNING',
      assignedPods: missionData.assignedPods || [],
      leadOperator: missionData.leadOperator || 'Operator Vijay',
      launchWindow: missionData.launchWindow || new Date(Date.now() + 86400000).toISOString(),
      progressPct: 0
    };

    data.missions.push(newMission);
    writeDb(data);
    return newMission;
  },

  updateMissionStatus: (id, status, progressPct) => {
    const data = readDb();
    const mission = (data.missions || []).find(m => m.id === id);
    if (!mission) throw new Error(`Mission ${id} not found.`);

    mission.status = status;
    if (progressPct !== undefined) mission.progressPct = Number(progressPct);
    writeDb(data);
    return mission;
  },

  getTelemetry: () => {
    const data = readDb();
    const pods = data.telemetryPods || [];
    if (pods.length > 0) {
      const p = pods[0];
      return {
        podId: p.callsign,
        status: p.status,
        frequency: `${p.frequencyMHz} MHz`,
        rssi: `${p.rssiDBm} dBm`,
        snr: `${p.snrDB} dB`,
        battery: `${p.batteryPct}%`,
        latitude: p.latitude,
        longitude: p.longitude,
        altitude: `${p.altitudeFt.toLocaleString()} ft`,
        speed: `${p.speedKmh} km/h`,
        temperature: `${p.temperatureC} °C`,
        uptime: p.uptime
      };
    }
    return INITIAL_DATA.telemetryPods[0];
  },

  getReports: () => {
    const data = readDb();
    return data.reports || [];
  },

  getLogs: () => {
    const data = readDb();
    return data.logs || [];
  },

  addLog: (log) => {
    const data = readDb();
    const newLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...log
    };
    if (!data.logs) data.logs = [];
    data.logs.unshift(newLog);
    writeDb(data);
    return newLog;
  },

  // ── PAYMENT REQUESTS & ADMIN APPROVAL WORKFLOW ──
  createPaymentRequest: ({ userId, userEmail, userName, planTier, billingDetails = {} }) => {
    if (!PLAN_LIMITS[planTier]) {
      throw new Error(`Invalid plan tier: ${planTier}`);
    }
    const data = readDb();
    if (!data.payments) data.payments = [];

    const planInfo = PLAN_LIMITS[planTier];
    const utr = billingDetails.utr || `${Math.floor(400000000000 + Math.random() * 500000000000)}`;
    const gateway = billingDetails.gateway || 'UPI_SCAN';
    const paymentId = `pay_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment = {
      id: paymentId,
      orderId: billingDetails.orderId || `ORD_${Date.now()}`,
      userId: userId || 'usr_anonymous',
      userEmail: userEmail || 'user@aerospec.com',
      userName: userName || 'Flight Operator',
      planTier: planTier,
      planName: planInfo.name,
      amount: planInfo.price,
      gateway: gateway,
      paymentId: '9866606967@superyes',
      utr: utr,
      status: 'Pending Approval', // Awaiting admin authorization
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      approvedAt: null,
      approvedBy: null,
      notes: billingDetails.notes || ''
    };

    data.payments.unshift(newPayment);

    db.addLog({
      type: 'PAYMENT',
      event: `New payment request submitted: ${newPayment.userEmail} for ${newPayment.planName} (${newPayment.amount}) [Status: Pending Approval]`,
      user: newPayment.userEmail,
      severity: 'warning'
    });

    writeDb(data);
    return newPayment;
  },

  getAllPayments: () => {
    const data = readDb();
    return data.payments || [];
  },

  approvePayment: (paymentId, adminEmail = 'vijay@aerospec.com') => {
    const data = readDb();
    if (!data.payments) data.payments = [];
    const payment = data.payments.find(p => p.id === paymentId);
    if (!payment) {
      throw new Error(`Payment request ${paymentId} not found.`);
    }

    payment.status = 'Approved';
    payment.approvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    payment.approvedBy = adminEmail;

    // Elevate user's planTier in DB to the approved tier
    const user = (data.users || []).find(u => u.id === payment.userId || u.email.toLowerCase() === payment.userEmail.toLowerCase());
    if (user) {
      user.planTier = payment.planTier;
      user.status = 'Active';
    }

    // Elevate organization plan
    if (data.organization) {
      data.organization.planTier = payment.planTier;
    }

    // Record in admin_actions
    if (!data.admin_actions) data.admin_actions = [];
    const action = {
      id: `act_${Date.now()}`,
      adminEmail,
      action: 'APPROVE_SUBSCRIPTION',
      target: payment.userEmail,
      details: `Approved ${payment.planName} (${payment.amount}) for ${payment.userEmail} [UTR: ${payment.utr}]`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    data.admin_actions.unshift(action);

    db.addLog({
      type: 'ADMIN',
      event: `Admin ${adminEmail} APPROVED subscription for ${payment.userEmail}: Upgraded to ${payment.planName} (ACTIVE)`,
      user: adminEmail,
      severity: 'success'
    });

    writeDb(data);
    return { payment, user, action };
  },

  rejectPayment: (paymentId, adminEmail = 'vijay@aerospec.com', reason = 'Payment verification failed / invalid UTR') => {
    const data = readDb();
    if (!data.payments) data.payments = [];
    const payment = data.payments.find(p => p.id === paymentId);
    if (!payment) {
      throw new Error(`Payment request ${paymentId} not found.`);
    }

    payment.status = 'Rejected';
    payment.rejectedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    payment.rejectedBy = adminEmail;
    payment.rejectionReason = reason;

    if (!data.admin_actions) data.admin_actions = [];
    const action = {
      id: `act_${Date.now()}`,
      adminEmail,
      action: 'REJECT_SUBSCRIPTION',
      target: payment.userEmail,
      details: `Rejected ${payment.planName} for ${payment.userEmail} (Reason: ${reason})`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    data.admin_actions.unshift(action);

    db.addLog({
      type: 'ADMIN',
      event: `Admin ${adminEmail} REJECTED subscription for ${payment.userEmail} (Reason: ${reason})`,
      user: adminEmail,
      severity: 'danger'
    });

    writeDb(data);
    return { payment, action };
  },

  logOtp: ({ email, otp, type = 'PAYMENT_AUTH', status = 'DISPATCHED', ip = '127.0.0.1' }) => {
    const data = readDb();
    if (!data.otp_logs) data.otp_logs = [];
    const otpLog = {
      id: `otplog_${Date.now()}`,
      email,
      otp,
      type,
      status,
      ip,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    data.otp_logs.unshift(otpLog);
    writeDb(data);
    return otpLog;
  },

  getOtpLogs: () => {
    const data = readDb();
    return data.otp_logs || [];
  },

  getAdminActions: () => {
    const data = readDb();
    return data.admin_actions || [];
  },

  getContactMessages: () => {
    const data = readDb();
    return data.contact_messages || [];
  },

  createContactMessage: (msg) => {
    const data = readDb();
    if (!data.contact_messages) data.contact_messages = [];
    const item = {
      id: msg.id || `TX-${Date.now()}-AERO`,
      callsign: msg.callsign || 'Anonymous Operator',
      email: msg.email,
      organization: msg.organization || 'Independent',
      priority: msg.priority || 'Routine',
      band: msg.band || 'S-Band',
      message: msg.message,
      createdAt: new Date().toISOString()
    };
    data.contact_messages.unshift(item);
    writeDb(data);
    return item;
  }
};

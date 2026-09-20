import express from 'express';
import cors from 'cors';
import { db } from './database.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Auth Endpoints ──

// Single Unified Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = db.getUserByEmail(email);

  if (!user || user.password !== password) {
    db.addLog({
      type: 'AUTH',
      event: `Failed login attempt for: ${email}`,
      user: email,
      severity: 'warning'
    });
    return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email and password.' });
  }

  if (user.status === 'Suspended') {
    return res.status(403).json({ success: false, message: 'Account is suspended. Contact system administrator.' });
  }

  db.addLog({
    type: 'AUTH',
    event: `User authenticated successfully (${user.role.toUpperCase()})`,
    user: user.email,
    severity: 'success'
  });

  const { password: _, ...safeUser } = user;
  return res.json({
    success: true,
    user: safeUser,
    message: `Welcome back, ${safeUser.name}!`
  });
});

// Signup Endpoint
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const newUser = db.createUser({ name, email, password, role: 'user' });
    return res.status(201).json({
      success: true,
      user: newUser,
      message: 'Account created successfully! Redirecting...'
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ── User Telemetry & Reports Endpoints ──

app.get('/api/user/telemetry', (req, res) => {
  const telemetry = db.getTelemetry();
  return res.json({ success: true, data: telemetry });
});

app.get('/api/user/reports', (req, res) => {
  const reports = db.getReports();
  return res.json({ success: true, data: reports });
});

// ── Admin Management Endpoints ──

app.get('/api/admin/users', (req, res) => {
  const users = db.getAllUsers();
  return res.json({ success: true, data: users });
});

app.patch('/api/admin/users/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role specified.' });
  }

  try {
    const updated = db.updateUserRole(id, role);
    return res.json({ success: true, user: updated, message: `Role updated to ${role}` });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.deleteUser(id);
    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/logs', (req, res) => {
  const logs = db.getLogs();
  return res.json({ success: true, data: logs });
});

app.get('/api/admin/stats', (req, res) => {
  const users = db.getAllUsers();
  const logs = db.getLogs();
  return res.json({
    success: true,
    data: {
      totalUsers: users.length,
      activePods: 4,
      systemStatus: 'OPERATIONAL',
      errorCount: logs.filter(l => l.severity === 'danger' || l.severity === 'warning').length
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AeroSpace API Backend running on http://localhost:${PORT}`);
});

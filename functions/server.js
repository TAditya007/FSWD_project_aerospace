import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, PLAN_LIMITS } from './database.js';
import { sendOTPEmail } from './mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger and URL normalizer
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// ════════════════════════════════════════════
// 1. AUTHENTICATION & 2FA EMAIL OTP
// ════════════════════════════════════════════

// Request Real 2FA OTP to email
app.post('/api/auth/send-otp', async (req, res) => {
  const { email, type, name } = req.body;
  const isProduction = process.env.NODE_ENV === 'production';
  const targetEmail = (email || '').trim().toLowerCase();

  if (!targetEmail || !targetEmail.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email address is required for 2FA.' });
  }

  try {
    const otp = db.generateOTP(targetEmail, type || 'LOGIN');
    
    // Dispatch real email via nodemailer
    const mailResult = await sendOTPEmail({
      to: targetEmail,
      otp,
      type: type || 'LOGIN',
      name: name || 'Operator'
    });

    if (!mailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Unable to send OTP email. Please try again.'
      });
    }

    // Production: Return only safe response, NEVER expose OTP or dev previews
    if (isProduction) {
      return res.json({
        success: true,
        message: 'OTP sent successfully'
      });
    }

    // Development only response
    return res.json({
      success: true,
      message: `Security 2FA authorization code dispatched to ${targetEmail}`,
      email: targetEmail,
      deliveryMode: mailResult.mode,
      previewUrl: mailResult.previewUrl,
      otpPreview: mailResult.mode !== 'LIVE_SMTP' ? otp : undefined
    });
  } catch (err) {
    if (!isProduction) {
      console.error('Error dispatching OTP:', err);
    }
    return res.status(500).json({ success: false, message: 'Unable to send OTP email. Please try again.' });
  }
});

// Verify 2FA OTP & Authenticate/Signup
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp, action, name, password } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and 6-digit OTP code are required.' });
  }

  const result = db.verifyOTP(email, otp);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }

  // If action is SIGNUP, create user account now
  if (action === 'SIGNUP') {
    try {
      const newUser = db.createUser({ name, email, password, role: 'user' });
      return res.status(201).json({
        success: true,
        user: newUser,
        message: 'Account verified and created successfully!'
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  // Otherwise action is LOGIN
  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Account not found.' });
  }

  const { password: _, ...safeUser } = user;
  return res.json({
    success: true,
    user: safeUser,
    message: '2FA verification successful!'
  });
});

// Current Authenticated User Profile Endpoint
app.get('/api/auth/me', (req, res) => {
  const email = req.query.email || req.headers['x-user-email'];
  if (!email) {
    return res.status(400).json({ success: false, message: 'User email is required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }

  const { password: _, ...safeUser } = user;
  return res.json({
    success: true,
    user: safeUser
  });
});

// Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password, otp } = req.body;

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
    return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your email and password.' });
  }

  if (user.status === 'Suspended') {
    return res.status(403).json({ success: false, message: 'Account is suspended. Contact system administrator.' });
  }

  // If OTP is provided, verify 2FA
  if (otp) {
    const otpResult = db.verifyOTP(email, otp);
    if (!otpResult.success) {
      return res.status(400).json({ success: false, message: otpResult.message });
    }
  }

  db.addLog({
    type: 'AUTH',
    event: `User authenticated (${user.role.toUpperCase()})`,
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

// Signup Endpoint (Any email allowed)
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
      message: 'Account created successfully!'
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════
// 1.1 USER ACCOUNT MANAGEMENT (EMAIL / PASSWORD / THEME / DATASHEET)
// ════════════════════════════════════════════

// Request OTP to change email (Dispatched to NEW email)
app.post('/api/user/email/request-otp', async (req, res) => {
  const { currentEmail, newEmail } = req.body;
  if (!newEmail || !newEmail.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid new email address is required.' });
  }

  const existing = db.getUserByEmail(newEmail);
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
  }

  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const otp = db.generateOTP(newEmail, 'EMAIL_CHANGE');
    const mailResult = await sendOTPEmail({
      to: newEmail,
      otp,
      type: 'EMAIL_CHANGE',
      name: 'Flight Operator'
    });

    if (!mailResult.success) {
      return res.status(500).json({ success: false, message: 'Unable to send OTP email. Please try again.' });
    }

    if (isProduction) {
      return res.json({ success: true, message: 'OTP sent successfully' });
    }

    return res.json({
      success: true,
      message: `Security verification code dispatched to ${newEmail}`,
      deliveryMode: mailResult.mode,
      previewUrl: mailResult.previewUrl,
      otpPreview: mailResult.mode !== 'LIVE_SMTP' ? otp : undefined
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to send OTP email. Please try again.' });
  }
});

// Verify OTP & Update Email
app.post('/api/user/email/verify-otp', (req, res) => {
  const { currentEmail, newEmail, otp } = req.body;
  if (!currentEmail || !newEmail || !otp) {
    return res.status(400).json({ success: false, message: 'Current email, new email, and 6-digit OTP code are required.' });
  }

  const result = db.verifyOTP(newEmail, otp);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }

  try {
    const updatedUser = db.updateUserEmail(currentEmail, newEmail);
    return res.json({
      success: true,
      user: updatedUser,
      message: 'Account email updated successfully!'
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Request OTP to change password (Dispatched to CURRENT email)
app.post('/api/user/password/request-otp', async (req, res) => {
  const { email, currentPassword } = req.body;
  if (!email || !currentPassword) {
    return res.status(400).json({ success: false, message: 'Email and current password are required.' });
  }

  const user = db.getUserByEmail(email);
  if (!user || user.password !== currentPassword) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }

  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const otp = db.generateOTP(email, 'PASSWORD_CHANGE');
    const mailResult = await sendOTPEmail({
      to: email,
      otp,
      type: 'PASSWORD_CHANGE',
      name: user.name || 'Flight Operator'
    });

    if (!mailResult.success) {
      return res.status(500).json({ success: false, message: 'Unable to send OTP email. Please try again.' });
    }

    if (isProduction) {
      return res.json({ success: true, message: 'OTP sent successfully' });
    }

    return res.json({
      success: true,
      message: `2FA security code dispatched to ${email}`,
      deliveryMode: mailResult.mode,
      previewUrl: mailResult.previewUrl,
      otpPreview: mailResult.mode !== 'LIVE_SMTP' ? otp : undefined
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to send OTP email. Please try again.' });
  }
});

// Verify OTP & Update Password
app.post('/api/user/password/verify-otp', (req, res) => {
  const { email, newPassword, otp } = req.body;
  if (!email || !newPassword || !otp) {
    return res.status(400).json({ success: false, message: 'Email, new password, and 6-digit OTP are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
  }

  const result = db.verifyOTP(email, otp);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }

  try {
    db.updateUserPassword(email, newPassword);
    return res.json({
      success: true,
      message: 'Account password updated successfully!'
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Update User Theme Preference
app.post('/api/user/theme', (req, res) => {
  const { email, theme } = req.body;
  if (!email || !theme) {
    return res.status(400).json({ success: false, message: 'Email and theme identifier are required.' });
  }

  db.updateUserTheme(email, theme);
  return res.json({ success: true, message: 'Theme preference saved.' });
});

// Export Sanitized Mission Data Sheet
app.get('/api/user/datasheet', (req, res) => {
  const email = req.query.email || req.headers['x-user-email'];
  if (!email) {
    return res.status(400).json({ success: false, message: 'User email is required.' });
  }

  try {
    const dataSheet = db.getUserDataSheet(email);
    return res.json({ success: true, data: dataSheet });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════
// 2. PAYMENT OTP & SUBSCRIPTION GATEWAY
// ════════════════════════════════════════════

// Request Payment Authorization OTP (Dispatched to bikkinavijay0@gmail.com)
app.post('/api/payment/send-otp', async (req, res) => {
  const targetEmail = req.body.email || 'bikkinavijay0@gmail.com';
  try {
    const otp = db.generateOTP(targetEmail, 'PAYMENT_CONFIRMATION');
    
    // Log OTP dispatch in DB
    db.logOtp({
      email: targetEmail,
      otp,
      type: 'PAYMENT_CONFIRMATION',
      status: 'DISPATCHED',
      ip: req.ip
    });

    const mailResult = await sendOTPEmail({
      to: targetEmail,
      otp,
      type: 'PAYMENT_CONFIRMATION',
      name: req.body.name || 'Flight Operator'
    });

    if (!mailResult.success) {
      return res.status(500).json({ success: false, message: 'Unable to send OTP email. Please try again.' });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      return res.json({ success: true, message: 'OTP sent successfully' });
    }

    return res.json({
      success: true,
      message: `Payment authorization OTP dispatched to ${targetEmail}`,
      email: targetEmail,
      deliveryMode: mailResult.mode,
      previewUrl: mailResult.previewUrl,
      otpPreview: mailResult.mode !== 'LIVE_SMTP' ? otp : undefined
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error dispatching payment OTP:', err);
    }
    return res.status(500).json({ success: false, message: 'Unable to send OTP email. Please try again.' });
  }
});

// Verify Payment OTP
app.post('/api/payment/verify-otp', (req, res) => {
  const { otp } = req.body;
  const targetEmail = req.body.email || 'bikkinavijay0@gmail.com';

  if (!otp) {
    return res.status(400).json({ success: false, message: '6-digit OTP code is required.' });
  }

  const result = db.verifyOTP(targetEmail, otp);
  db.logOtp({
    email: targetEmail,
    otp,
    type: 'PAYMENT_VERIFY',
    status: result.success ? 'VERIFIED' : 'FAILED',
    ip: req.ip
  });

  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }

  return res.json({ success: true, message: 'OTP verified. Payment authorization confirmed.' });
});

// Submit Payment Request (Marks status as 'Pending Approval')
app.post('/api/payment/submit', (req, res) => {
  const { userId, userEmail, userName, planTier, billingDetails } = req.body;

  if (!planTier) {
    return res.status(400).json({ success: false, message: 'planTier is required.' });
  }

  try {
    const payment = db.createPaymentRequest({
      userId,
      userEmail,
      userName,
      planTier,
      billingDetails
    });

    return res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment recorded with status: Pending Approval. Awaiting Administrator Authorization.'
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Instant Subscribe (Legacy / Direct)
app.post('/api/user/subscribe', (req, res) => {
  const { userId, planTier, billingDetails } = req.body;

  if (!planTier) {
    return res.status(400).json({ success: false, message: 'planTier is required.' });
  }

  try {
    const result = db.userSubscribe(userId, planTier, billingDetails);
    return res.json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════
// 3. ADMIN SUBSCRIPTION APPROVAL WORKFLOW
// ════════════════════════════════════════════

// Get all payments for admin review
app.get('/api/admin/payments', (req, res) => {
  try {
    const payments = db.getAllPayments();
    return res.json({ success: true, count: payments.length, data: payments });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Approve payment request (sets status to 'Approved' and elevates subscription to Active)
app.post('/api/admin/payments/:id/approve', (req, res) => {
  const { id } = req.params;
  const { adminEmail } = req.body;

  try {
    const result = db.approvePayment(id, adminEmail || 'vijay@aerospec.com');
    return res.json({
      success: true,
      data: result,
      message: `Subscription payment ${id} successfully APPROVED! User plan elevated to Active.`
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Reject payment request
app.post('/api/admin/payments/:id/reject', (req, res) => {
  const { id } = req.params;
  const { adminEmail, reason } = req.body;

  try {
    const result = db.rejectPayment(id, adminEmail || 'vijay@aerospec.com', reason);
    return res.json({
      success: true,
      data: result,
      message: `Subscription payment ${id} marked as REJECTED.`
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Admin view OTP logs
app.get('/api/admin/otp-logs', (req, res) => {
  const logs = db.getOtpLogs();
  return res.json({ success: true, count: logs.length, data: logs });
});

// ════════════════════════════════════════════
// 4. ADMIN USER MONITORING & CONTROL
// ════════════════════════════════════════════

// Return all users with passwords for admin surveillance
app.get('/api/admin/users', (req, res) => {
  try {
    const users = db.getAllUsersForAdmin();
    return res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin creates user account directly
app.post('/api/admin/users', (req, res) => {
  const { name, email, password, role, status, planTier } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const created = db.adminCreateUser({ name, email, password, role, status, planTier });
    return res.status(201).json({ success: true, data: created, message: 'Account provisioned successfully.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Admin modifies ANY user detail (including password)
app.put('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  try {
    const updated = db.adminUpdateUser(id, req.body);
    return res.json({ success: true, data: updated, message: 'Account credentials updated successfully.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Role toggle fallback
app.patch('/api/admin/users/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    const updated = db.adminUpdateUser(id, { role });
    return res.json({ success: true, user: updated, message: `Role updated to ${role}` });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
});

// Delete user account
app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.deleteUser(id);
    return res.json({ success: true, message: 'User account removed.' });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/logs', (req, res) => {
  const logs = db.getLogs();
  return res.json({ success: true, data: logs });
});

app.get('/api/admin/stats', (req, res) => {
  const users = db.getAllUsersForAdmin();
  const logs = db.getLogs();
  const pods = db.getAllPods();
  const org = db.getOrganization();
  return res.json({
    success: true,
    data: {
      totalUsers: users.length,
      activePods: pods.length,
      planTier: org.planDetails.name,
      systemStatus: 'OPERATIONAL',
      errorCount: logs.filter(l => l.severity === 'danger' || l.severity === 'warning').length
    }
  });
});

// ════════════════════════════════════════════
// 4. SAAS FLEET PODS & MISSIONS
// ════════════════════════════════════════════

app.get('/api/saas/plans', (req, res) => {
  return res.json({ success: true, data: PLAN_LIMITS });
});

app.get('/api/saas/tenant', (req, res) => {
  try {
    const org = db.getOrganization();
    return res.json({ success: true, data: org, availableTiers: PLAN_LIMITS });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/saas/billing/upgrade', (req, res) => {
  const { planTier } = req.body;
  try {
    const updatedOrg = db.updateOrgPlan(planTier);
    return res.json({
      success: true,
      data: updatedOrg,
      message: `Subscription successfully upgraded to ${updatedOrg.planDetails.name}!`
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/saas/pods', (req, res) => {
  try {
    const pods = db.getAllPods();
    return res.json({ success: true, count: pods.length, data: pods });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/saas/pods', (req, res) => {
  try {
    const newPod = db.createPod(req.body);
    return res.status(201).json({
      success: true,
      data: newPod,
      message: `Telemetry Pod ${newPod.callsign} provisioned successfully.`
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

app.patch('/api/saas/pods/:id', (req, res) => {
  try {
    const updated = db.updatePod(req.params.id, req.body);
    return res.json({ success: true, data: updated, message: 'Pod parameters updated.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/saas/pods/:id', (req, res) => {
  try {
    db.deletePod(req.params.id);
    return res.json({ success: true, message: 'Pod decommissioned from fleet.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/saas/pods/:id/history', (req, res) => {
  try {
    const readings = db.getPodReadings(req.params.id);
    return res.json({ success: true, podId: req.params.id, data: readings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/saas/missions', (req, res) => {
  try {
    const missions = db.getAllMissions();
    return res.json({ success: true, count: missions.length, data: missions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/saas/missions', (req, res) => {
  try {
    const newMission = db.createMission(req.body);
    return res.status(201).json({
      success: true,
      data: newMission,
      message: `Mission ${newMission.code} scheduled.`
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

app.patch('/api/saas/missions/:id/status', (req, res) => {
  const { status, progressPct } = req.body;
  try {
    const updated = db.updateMissionStatus(req.params.id, status, progressPct);
    return res.json({ success: true, data: updated, message: 'Mission status updated.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Legacy User Endpoints
app.get('/api/user/telemetry', (req, res) => {
  const telemetry = db.getTelemetry();
  return res.json({ success: true, data: telemetry });
});

app.get('/api/user/reports', (req, res) => {
  const reports = db.getReports();
  return res.json({ success: true, data: reports });
});

import { pathToFileURL } from 'url';

export { app };
export default app;

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 AeroSpace API Backend running on http://localhost:${PORT}`);
  });
}

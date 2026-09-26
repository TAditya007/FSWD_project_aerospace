import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, PLAN_LIMITS } from './database.js';
import { sendOTPEmail, sendUserNotificationEmail, sendContactEmail } from './mailer.js';
import { initTelemetryBridge } from './telemetryBridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Wrap Express with native Node HTTP Server for Socket.io
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://aerospec-440.web.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize CO5 Real-time MQTT-to-Socket.io Telemetry Bridge
const telemetryBridge = initTelemetryBridge(io);

app.use(cors());
app.use(express.json());

// Request logger and URL normalizer
app.use((req, res, next) => {
  // Let Socket.io paths pass without URL rewriting
  if (req.url.startsWith('/socket.io')) {
    return next();
  }
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// Cloud / Render Health Check Endpoints
app.get('/api', (req, res) => {
  return res.json({ status: 'ok', service: 'AeroSpace API Backend', version: '1.0.0' });
});

app.get('/api/health', (req, res) => {
  return res.json({ status: 'healthy', uptime: process.uptime() });
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
// 1.1 FORGOT PASSWORD (EMAIL OTP & RESET)
// ════════════════════════════════════════════

// Request Password Reset OTP (Dispatched to registered user's email via Brevo)
app.post('/api/auth/forgot-password/request-otp', async (req, res) => {
  const { email } = req.body;
  const isProduction = process.env.NODE_ENV === 'production';
  const targetEmail = (email || '').trim().toLowerCase();

  if (!targetEmail || !targetEmail.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid registered email address is required.' });
  }

  // Verify that the email belongs to an existing account before allowing reset
  const user = db.getUserByEmail(targetEmail);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No AeroSpec account registered with this email address.'
    });
  }

  try {
    const otp = db.generateOTP(targetEmail, 'PASSWORD_RESET');

    // Send OTP to THAT user's email via Brevo/mailer
    const mailResult = await sendOTPEmail({
      to: targetEmail,
      otp,
      type: 'PASSWORD_RESET',
      name: user.name || 'Flight Operator'
    });

    if (!mailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Unable to send password reset OTP. Please try again.'
      });
    }

    if (isProduction) {
      return res.json({
        success: true,
        message: 'Password reset code sent to your registered email.'
      });
    }

    return res.json({
      success: true,
      message: `Password reset verification code dispatched to ${targetEmail}`,
      email: targetEmail,
      deliveryMode: mailResult.mode,
      previewUrl: mailResult.previewUrl,
      otpPreview: mailResult.mode !== 'LIVE_SMTP' ? otp : undefined
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to send OTP email. Please try again.' });
  }
});

// Verify OTP & Reset Password
app.post('/api/auth/forgot-password/reset', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const targetEmail = (email || '').trim().toLowerCase();

  if (!targetEmail || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email, 6-digit OTP code, and new password are required.'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long.'
    });
  }

  const user = db.getUserByEmail(targetEmail);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Account not found.' });
  }

  const result = db.verifyOTP(targetEmail, otp);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }

  try {
    db.updateUserPassword(targetEmail, newPassword);

    // Send security notification confirmation email to THAT user's email
    sendUserNotificationEmail({
      to: targetEmail,
      name: user.name,
      subject: 'AeroSpec Security Alert: Password Reset Complete',
      title: 'Password Reset Successful',
      message: 'Your AeroSpec account password has been successfully reset. You may now return to the cockpit sign-in page and log in with your new password.',
      actionDetails: {
        'Account': targetEmail,
        'Security Event': 'Password Reset via Verified 2FA OTP',
        'Timestamp': new Date().toUTCString()
      }
    }).catch(err => console.warn('Could not send password reset notification email:', err.message));

    return res.json({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.'
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════
// 1.2 USER ACCOUNT MANAGEMENT (NAME / EMAIL / PASSWORD / THEME / DATASHEET)
// ════════════════════════════════════════════

// Update User Display Name
app.post('/api/user/name', async (req, res) => {
  const { email, name } = req.body;
  const targetEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim();

  if (!targetEmail || !cleanName) {
    return res.status(400).json({ success: false, message: 'Email and non-empty display name are required.' });
  }

  try {
    const updatedUser = db.updateUserName(targetEmail, cleanName);

    // Send confirmation email to that user
    sendUserNotificationEmail({
      to: targetEmail,
      name: cleanName,
      subject: 'AeroSpec Profile Updated: Operator Name Changed',
      title: 'Operator Display Name Updated',
      message: `Your operator display name in AeroSpec Mission Control was updated to "${cleanName}".`,
      actionDetails: {
        'New Operator Name': cleanName,
        'Account Email': targetEmail,
        'Timestamp': new Date().toUTCString()
      }
    }).catch(err => console.warn('Could not send name change notification email:', err.message));

    return res.json({
      success: true,
      user: updatedUser,
      message: 'Operator display name updated successfully!'
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

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

    // Send confirmation email to new email address
    sendUserNotificationEmail({
      to: newEmail,
      name: updatedUser.name,
      subject: 'AeroSpec Account Security: Email Address Updated',
      title: 'Email Address Changed Successfully',
      message: `Your AeroSpec account email address has been successfully transferred from ${currentEmail} to ${newEmail}.`,
      actionDetails: {
        'Previous Email': currentEmail,
        'Current Email': newEmail,
        'Timestamp': new Date().toUTCString()
      }
    }).catch(err => console.warn('Could not send email change confirmation:', err.message));

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

    const user = db.getUserByEmail(email);
    // Send security notification to user
    sendUserNotificationEmail({
      to: email,
      name: user?.name,
      subject: 'AeroSpec Security Alert: Password Updated',
      title: 'Account Password Changed',
      message: 'Your AeroSpec account password was successfully updated via verified 2FA authentication.',
      actionDetails: {
        'Account Email': email,
        'Security Event': 'Password Change via 2FA OTP',
        'Timestamp': new Date().toUTCString()
      }
    }).catch(err => console.warn('Could not send password change notification:', err.message));

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

// Request Payment Authorization OTP (Dispatched to the purchasing user's email)
app.post('/api/payment/send-otp', async (req, res) => {
  const targetEmail = (req.body.email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validate that user email is present and properly formatted
  if (!targetEmail || !emailRegex.test(targetEmail)) {
    return res.status(400).json({
      success: false,
      message: 'A valid user email address is required to receive payment authorization OTP.'
    });
  }

  try {
    // Generate OTP associated with the user's email
    const otp = db.generateOTP(targetEmail, 'PAYMENT_CONFIRMATION');

    // Log OTP dispatch in DB for user audit
    db.logOtp({
      email: targetEmail,
      otp,
      type: 'PAYMENT_CONFIRMATION',
      status: 'DISPATCHED',
      ip: req.ip
    });

    // Send payment OTP to the user's email
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

    // In dev: return delivery status and previewUrl (test inbox), but NEVER expose OTP code (Requirement 10)
    return res.json({
      success: true,
      message: `Payment authorization OTP dispatched to ${targetEmail}`,
      email: targetEmail,
      deliveryMode: mailResult.mode,
      previewUrl: mailResult.previewUrl
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
  const targetEmail = (req.body.email || '').trim().toLowerCase();
  const { otp } = req.body;

  if (!targetEmail || !targetEmail.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid user email address is required for OTP verification.' });
  }

  if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
    return res.status(400).json({ success: false, message: '6-digit OTP code is required.' });
  }

  const cleanOtp = otp.trim();
  const result = db.verifyOTP(targetEmail, cleanOtp);
  db.logOtp({
    email: targetEmail,
    otp: cleanOtp,
    type: 'PAYMENT_VERIFY',
    status: result.success ? 'VERIFIED' : 'FAILED',
    ip: req.ip
  });

  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message || 'Invalid or expired OTP code.' });
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

    // Send confirmation email to current user
    const allUsers = db.getAllUsersForAdmin();
    const user = allUsers.find(u => u.id === userId) || db.getUserByEmail(billingDetails?.userEmail || '');
    if (user?.email) {
      sendUserNotificationEmail({
        to: user.email,
        name: user.name,
        subject: `AeroSpec Subscription Activated: ${result.planDetails?.name}`,
        title: 'Plan Tier Activated',
        message: `Your account subscription has been upgraded to ${result.planDetails?.name} (${result.planDetails?.price}). Expanded fleet quota and real-time telemetry pipelines are now unlocked.`,
        actionDetails: {
          'Plan Tier': result.planDetails?.name,
          'Rate': result.planDetails?.price,
          'Order ID': result.receipt?.orderId || 'DIRECT_ACTIVATION',
          'Timestamp': new Date().toUTCString()
        }
      }).catch(err => console.warn('Could not send subscription email:', err.message));
    }

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

    // Send confirmation email to the purchasing user's email
    if (result?.payment?.userEmail) {
      sendUserNotificationEmail({
        to: result.payment.userEmail,
        name: result.payment.userName,
        subject: `AeroSpec Payment Approved: ${result.payment.planName}`,
        title: 'Subscription Payment Approved',
        message: `Your payment authorization for the ${result.payment.planName} plan (${result.payment.amount}) has been verified and approved by Ground Station Administration. Your account plan is active.`,
        actionDetails: {
          'Order Reference': result.payment.orderId,
          'Plan Tier': result.payment.planName,
          'Amount': result.payment.amount,
          'Gateway': result.payment.gateway,
          'Verified By': adminEmail || 'vijay@aerospec.com',
          'Approved Date': new Date().toUTCString()
        }
      }).catch(err => console.warn('Could not send payment approval email:', err.message));
    }

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

// Rate limit / spam prevention store for contact submissions
const contactRateLimit = new Map();

// ════════════════════════════════════════════
// 12. CONTACT OPERATIONS & MISSION DISPATCH
// ════════════════════════════════════════════
app.post('/api/contact', async (req, res) => {
  const { callsign, name, email, organization, priority, band, subject, message, id } = req.body;
  const targetEmail = (email || '').trim().toLowerCase();
  const operatorName = (name || callsign || 'Anonymous Operator').trim();
  const missionMessage = (message || '').trim();
  const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  // Server-side validation
  if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }

  if (!missionMessage || missionMessage.length < 3) {
    return res.status(400).json({ success: false, message: 'Message content must be at least 3 characters long.' });
  }

  // Prevent obvious spam / duplicate rapid submissions (10s debounce)
  const rateLimitKey = `${clientIp}_${targetEmail}`;
  const lastTime = contactRateLimit.get(rateLimitKey);
  const now = Date.now();
  if (lastTime && (now - lastTime) < 10000) {
    return res.status(429).json({
      success: false,
      message: 'Transmission throttled. Please wait a few moments before sending another mission dispatch.'
    });
  }
  contactRateLimit.set(rateLimitKey, now);

  const dispatchId = id || `TX-${Math.floor(1000 + Math.random() * 9000)}-AERO`;

  const dispatch = db.createContactMessage({
    id: dispatchId,
    callsign: operatorName,
    email: targetEmail,
    organization: organization || 'Independent',
    priority: priority || 'Routine Inquiry',
    band: band || 'S-Band',
    message: missionMessage
  });

  // Dispatch real email via Brevo HTTPS REST API to bikkinavijay0@gmail.com
  let emailSent = false;
  try {
    const mailResult = await sendContactEmail({
      name: operatorName,
      email: targetEmail,
      subject: subject || priority || 'Flight Operations Inquiry',
      message: missionMessage,
      priority: priority || 'Routine Inquiry',
      organization: organization || 'Independent',
      band: band || 'S-Band',
      id: dispatchId,
      timestamp: new Date().toUTCString()
    });
    emailSent = mailResult.success;
  } catch (err) {
    console.error('❌ [CONTACT EMAIL DISPATCH ERROR]:', err.message);
  }

  return res.status(201).json({
    success: true,
    data: dispatch,
    emailSent,
    message: 'Mission dispatch received and transmitted to Ground Operations Desk (bikkinavijay0@gmail.com).'
  });
});

app.get('/api/contact', (req, res) => {
  const messages = db.getContactMessages();
  return res.json({ success: true, data: messages });
});

import { pathToFileURL } from 'url';

export { app, httpServer, io, telemetryBridge };
export default app;

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if ((isDirectExecution || process.env.RENDER || process.env.PORT) && process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AeroSpace API Backend running on http://0.0.0.0:${PORT}`);
    console.log(`📡 Socket.io WebSocket server mounted on http://0.0.0.0:${PORT}`);
  });
}

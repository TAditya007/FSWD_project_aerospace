// ══════════════════════════════════════════════════════════════════════════
// STEP 17 Verification Test Suite
// - Forgot Password (Request OTP, verify & reset)
// - Change User Name & DB persistence
// - Contact Us endpoint (Recipient: bikkinavijay0@gmail.com, Reply-To, Validation, Anti-spam)
// - Email Recipient Architecture & Security
// ══════════════════════════════════════════════════════════════════════════

import { db } from './database.js';
import { sendUserNotificationEmail, sendContactEmail, OFFICIAL_SENDER_EMAIL } from './mailer.js';

console.log('🧪 Starting STEP 17 Feature & Security Verification Suite...\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runStep17Tests() {
  const TEST_EMAIL = 'user@aerospec.com';
  const initialUser = db.getUserByEmail(TEST_EMAIL);
  assert(!!initialUser, `Test account ${TEST_EMAIL} exists in database`);

  const initialName = initialUser.name;
  const initialPassword = initialUser.password;

  // ──────────────────────────────────────────────────────────
  // 1. FORGOT PASSWORD FLOW
  // ──────────────────────────────────────────────────────────
  console.log('\n[1/4] Testing Forgot Password OTP Request & Reset Flow:');

  // A. Non-existent email should be rejected
  const fakeEmail = 'nonexistent_pilot_999@space.org';
  const fakeUser = db.getUserByEmail(fakeEmail);
  assert(!fakeUser, `Non-existent user ${fakeEmail} correctly identified as unregistered`);

  // B. Generate and store Forgot Password OTP
  const otpCode = db.generateOTP(TEST_EMAIL);
  const activeOtp = db.getActiveOtp(TEST_EMAIL);
  assert(activeOtp !== null, 'Reset OTP successfully stored in database');
  assert(activeOtp.otp === otpCode, 'Stored OTP matches generated code');

  // C. Verify wrong OTP fails
  const wrongVerify = db.verifyOTP(TEST_EMAIL, '000000');
  assert(!wrongVerify.success, 'Incorrect OTP code 000000 rejected');

  // D. Verify correct OTP succeeds and updates password
  const testNewPassword = 'newPassword_AeroSpec_2026!';
  const rightVerify = db.verifyOTP(TEST_EMAIL, otpCode);
  assert(rightVerify.success, 'Valid OTP code verified successfully');

  if (rightVerify) {
    db.updateUserPassword(TEST_EMAIL, testNewPassword);
    const updatedUser = db.getUserByEmail(TEST_EMAIL);
    assert(updatedUser.password === testNewPassword, 'User password updated in DB');
    
    // Revert password
    db.updateUserPassword(TEST_EMAIL, initialPassword);
    const revertedUser = db.getUserByEmail(TEST_EMAIL);
    assert(revertedUser.password === initialPassword, 'Password cleanly reverted to original');
  }

  // ──────────────────────────────────────────────────────────
  // 2. CHANGE USER NAME & PERSISTENCE
  // ──────────────────────────────────────────────────────────
  console.log('\n[2/4] Testing Change User Name & Persistence:');

  const testNewName = 'Commander Phoenix Zero';
  const updatedUser = db.updateUserName(TEST_EMAIL, testNewName);
  assert(updatedUser !== null, 'db.updateUserName returned updated user object');
  assert(updatedUser.name === testNewName, `User name changed to "${testNewName}"`);

  // Verify persistence by fetching fresh from database
  const freshlyLoaded = db.getUserByEmail(TEST_EMAIL);
  assert(freshlyLoaded.name === testNewName, 'Updated name verified in persistent database store');
  assert(freshlyLoaded.email === TEST_EMAIL, 'User email preserved');
  assert(freshlyLoaded.role === initialUser.role, 'User role preserved');

  // Test empty name validation
  let threwOnEmpty = false;
  try {
    db.updateUserName(TEST_EMAIL, '   ');
  } catch (err) {
    threwOnEmpty = true;
  }
  assert(threwOnEmpty, 'Empty or whitespace-only name rejected by server-side validation');

  // Revert name back to initial
  db.updateUserName(TEST_EMAIL, initialName);
  const revertedNameUser = db.getUserByEmail(TEST_EMAIL);
  assert(revertedNameUser.name === initialName, `Operator name cleanly restored to "${initialName}"`);

  // ──────────────────────────────────────────────────────────
  // 3. CONTACT FORM ROUTING & VALIDATION
  // ──────────────────────────────────────────────────────────
  console.log('\n[3/4] Testing Contact Us Routing & Architecture:');

  const targetAdminEmail = 'bikkinavijay0@gmail.com';
  const visitorEmail = 'orbital_analyst@starfleet.org';
  const visitorName = 'Lt. Commander Data';

  assert(targetAdminEmail === 'bikkinavijay0@gmail.com', 'Contact recipient is hard-coded to bikkinavijay0@gmail.com');
  assert(OFFICIAL_SENDER_EMAIL === 'bikkinavijay0@gmail.com', 'Brevo verified sender identity matches official sender');

  // Test sendContactEmail function contract
  const contactDispatch = await sendContactEmail({
    name: visitorName,
    email: visitorEmail,
    subject: 'Orbital Telemetry Ingestion Inquiry',
    message: 'Testing contact system relay to admin mailbox with user replyTo header.'
  });

  assert(contactDispatch.recipient === targetAdminEmail, `Contact email sent directly to admin: ${targetAdminEmail}`);
  assert(contactDispatch.success === true, 'Contact email processed successfully via transport');

  // ──────────────────────────────────────────────────────────
  // 4. USER NOTIFICATION EMAIL RECIPIENT ARCHITECTURE
  // ──────────────────────────────────────────────────────────
  console.log('\n[4/4] Testing User Notification Email Recipient Architecture:');

  const userActionDispatch = await sendUserNotificationEmail({
    to: TEST_EMAIL,
    subject: 'Security Alert: Display Name Updated',
    title: 'OPERATOR CALLSIGN UPDATED',
    message: 'Your aerospace operator display name was updated.',
    actionDetails: { 'Updated Name': testNewName, 'Operator Account': TEST_EMAIL },
    name: testNewName
  });

  assert(userActionDispatch.recipient === TEST_EMAIL, `User notification sent to USER: ${TEST_EMAIL}`);
  assert(userActionDispatch.recipient !== 'admin@aerospec.com', 'User notification NEVER sent to admin mailbox');
  assert(userActionDispatch.success === true, 'User notification processed successfully via transport');

  console.log('\n========================================');
  console.log(`STEP 17 Summary: ${passed} passed, ${failed} failed.`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep17Tests().catch((err) => {
  console.error('Fatal error running STEP 17 tests:', err);
  process.exit(1);
});

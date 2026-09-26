// Automated Verification Script for Step 16:
// 1. Auth Flow without Firebase (Backend API + 2FA OTP)
// 2. Payment OTP Recipient Flow (User-directed OTP routing, no admin recipient)

import http from 'http';
import app from './server.js';
import { db } from './database.js';

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

// Start test server on random port
const server = http.createServer(app);

async function runTests() {
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`\n🧪 Testing AeroSpace Step 16 Backend API on ${baseUrl}...\n`);

  try {
    // ══════════════════════════════════════════════════════════
    // PART A: LOGIN & SIGNUP (Render Express API + Brevo / 2FA OTP)
    // ══════════════════════════════════════════════════════════
    console.log('[1/4] Testing Normal Email/Password Login + 2FA OTP Flow:');
    
    // 1. Valid user login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@aerospec.com', password: 'user123' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.success, 'Email + password verified by backend Express API (no Firebase)');

    // 2. Request 2FA OTP for user
    const loginOtpRes = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@aerospec.com', type: 'LOGIN' })
    });
    const loginOtpData = await loginOtpRes.json();
    assert(loginOtpRes.status === 200 && loginOtpData.success, '2FA OTP dispatched successfully for user@aerospec.com');
    assert(loginOtpData.email === 'user@aerospec.com', 'Recipient recorded as user@aerospec.com');

    // 3. Verify OTP
    const userOtp = db.getActiveOtp('user@aerospec.com');
    assert(userOtp && userOtp.otp.length === 6, `Retrieved active 6-digit OTP from database: ${userOtp?.otp}`);
    
    const verifyLoginRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@aerospec.com', otp: userOtp.otp })
    });
    const verifyLoginData = await verifyLoginRes.json();
    assert(verifyLoginRes.status === 200 && verifyLoginData.success, '2FA verification succeeded for user@aerospec.com');

    // ══════════════════════════════════════════════════════════
    // PART B: SIGNUP FLOW
    // ══════════════════════════════════════════════════════════
    console.log('\n[2/4] Testing Signup 2FA OTP & Registration Flow:');
    const newSignupEmail = `cadet_${Date.now()}@orbital.org`;
    
    const signupOtpRes = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newSignupEmail, type: 'SIGNUP', name: 'Cadet Pilot' })
    });
    const signupOtpData = await signupOtpRes.json();
    assert(signupOtpRes.status === 200 && signupOtpData.success, `Signup OTP dispatched to ${newSignupEmail}`);

    const cadetOtp = db.getActiveOtp(newSignupEmail);
    assert(cadetOtp && cadetOtp.otp.length === 6, `Retrieved cadet 6-digit OTP: ${cadetOtp?.otp}`);

    const verifySignupRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newSignupEmail,
        otp: cadetOtp.otp,
        action: 'SIGNUP',
        name: 'Cadet Pilot',
        password: 'CadetPassword2026!'
      })
    });
    const verifySignupData = await verifySignupRes.json();
    assert(verifySignupRes.status === 201 && verifySignupData.success, `Cadet account created in backend DB without Firebase Auth`);

    // ══════════════════════════════════════════════════════════
    // PART C: PAYMENT OTP RECIPIENT ROUTING (ISSUE 2)
    // ══════════════════════════════════════════════════════════
    console.log('\n[3/4] Testing Payment OTP Recipient Routing (User Directed):');
    const purchasingUserEmail = 'user@example.com';
    const adminEmail = 'bikkinavijay0@gmail.com';

    // 1. Send OTP without email must be rejected
    const noEmailRes = await fetch(`${baseUrl}/api/payment/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const noEmailData = await noEmailRes.json();
    assert(noEmailRes.status === 400 && !noEmailData.success, 'POST /api/payment/send-otp rejected request with missing email (HTTP 400)');

    // 2. Send OTP with invalid email format must be rejected
    const badEmailRes = await fetch(`${baseUrl}/api/payment/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' })
    });
    const badEmailData = await badEmailRes.json();
    assert(badEmailRes.status === 400 && !badEmailData.success, 'POST /api/payment/send-otp rejected invalid email format (HTTP 400)');

    // 3. Send OTP to purchasing user
    const paymentOtpRes = await fetch(`${baseUrl}/api/payment/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: purchasingUserEmail, name: 'Example Customer' })
    });
    const paymentOtpData = await paymentOtpRes.json();
    assert(paymentOtpRes.status === 200 && paymentOtpData.success, `Payment OTP dispatched for ${purchasingUserEmail}`);
    assert(paymentOtpData.email === purchasingUserEmail, `Response explicitly confirms target email is ${purchasingUserEmail}`);
    assert(paymentOtpData.otpPreview === undefined, 'Security check: OTP code is NOT exposed in API response');

    // 4. Verify OTP storage in DB is associated with purchasing user
    const paymentOtpEntry = db.getActiveOtp(purchasingUserEmail);
    assert(paymentOtpEntry && paymentOtpEntry.otp.length === 6, `Payment OTP stored for user: ${purchasingUserEmail}`);

    // 5. Verify admin email did NOT receive an OTP generated for this payment
    const adminOtpEntry = db.getActiveOtp(adminEmail);
    assert(!adminOtpEntry || adminOtpEntry.otp !== paymentOtpEntry.otp, `Administrator email (${adminEmail}) did NOT receive payment OTP`);

    // 6. Verify payment OTP with wrong email fails
    const wrongEmailVerifyRes = await fetch(`${baseUrl}/api/payment/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, otp: paymentOtpEntry.otp })
    });
    const wrongEmailVerifyData = await wrongEmailVerifyRes.json();
    assert(wrongEmailVerifyRes.status === 400 && !wrongEmailVerifyData.success, `Admin email cannot verify user's payment OTP (HTTP 400)`);

    // 7. Verify payment OTP with wrong code fails
    const badCodeVerifyRes = await fetch(`${baseUrl}/api/payment/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: purchasingUserEmail, otp: '111111' })
    });
    const badCodeVerifyData = await badCodeVerifyRes.json();
    assert(badCodeVerifyRes.status === 400 && !badCodeVerifyData.success, `Invalid OTP code correctly rejected (HTTP 400)`);

    // 8. Verify payment OTP with correct user email succeeds
    const goodPaymentVerifyRes = await fetch(`${baseUrl}/api/payment/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: purchasingUserEmail, otp: paymentOtpEntry.otp })
    });
    const goodPaymentVerifyData = await goodPaymentVerifyRes.json();
    assert(goodPaymentVerifyRes.status === 200 && goodPaymentVerifyData.success, `Successfully verified payment OTP for ${purchasingUserEmail}`);

    // ══════════════════════════════════════════════════════════
    // PART D: PAYMENT SUBMISSION & ADMIN DASHBOARD RETRIEVAL
    // ══════════════════════════════════════════════════════════
    console.log('\n[4/4] Testing Payment Submission & Admin Audit Pipeline:');
    const submitRes = await fetch(`${baseUrl}/api/payment/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'usr_test_123',
        userEmail: purchasingUserEmail,
        userName: 'Example Customer',
        planTier: 'orbital_pro',
        billingDetails: {
          gateway: 'UPI_QR',
          paymentId: '9866606967@superyes',
          utr: 'UTR491029482019',
          notes: `Authorized via OTP sent to ${purchasingUserEmail}`
        }
      })
    });
    const submitData = await submitRes.json();
    assert(submitRes.status === 201 && submitData.success, 'Payment recorded with status: Pending Approval');
    assert(submitData.data.userEmail === purchasingUserEmail, `Order recorded under customer email ${purchasingUserEmail}`);

    // Verify admin can retrieve pending payments from admin API
    const adminPaymentsRes = await fetch(`${baseUrl}/api/admin/payments`);
    const adminPaymentsData = await adminPaymentsRes.json();
    assert(adminPaymentsRes.status === 200 && adminPaymentsData.success, 'Admin can retrieve all payment orders');
    const recorded = adminPaymentsData.data.find(p => p.id === submitData.data.id);
    assert(recorded && recorded.userEmail === purchasingUserEmail, `Admin dashboard correctly sees order for ${purchasingUserEmail}`);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close(() => {
      console.log(`\n========================================`);
      console.log(`Step 16 Verification Summary: ${passed} passed, ${failed} failed.`);
      console.log(`========================================\n`);
      process.exit(failed > 0 ? 1 : 0);
    });
  }
}

runTests();

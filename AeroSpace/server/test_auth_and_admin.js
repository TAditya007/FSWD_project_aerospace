// Comprehensive Verification Script for 2FA, Admin Credentials & Subscription
import { db, PLAN_LIMITS } from './database.js';

console.log('🧪 Starting AeroSpace 2FA, Admin Monitoring & Subscription Tests...\n');

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

try {
  // 1. Verify Whitelisted Admin Accounts
  console.log('[1/6] Testing Whitelisted Admin Accounts:');
  const adminVijay = db.getUserByEmail('vijay@aerospec.com');
  assert(adminVijay && adminVijay.password === 'vijay@2007' && adminVijay.role === 'admin', 'Admin Vijay exists with password vijay@2007 and role admin');

  const adminAditya = db.getUserByEmail('aditya@aerospec.com');
  assert(adminAditya && adminAditya.password === 'aditya@007' && adminAditya.role === 'admin', 'Admin Aditya exists with password aditya@007 and role admin');

  // 2. Custom User Signup with Any Domain Email & Password Persistence
  console.log('\n[2/6] Testing Custom Email Signup & Password Persistence:');
  const customEmail = `pilot_${Date.now()}@spacestation.nasa.gov`;
  const customPass = 'CosmicFlight#2026';
  const newAccount = db.createUser({
    name: 'Astronaut Chris',
    email: customEmail,
    password: customPass,
    role: 'user'
  });
  assert(newAccount && newAccount.email === customEmail, `Custom email ${customEmail} registered successfully`);
  
  // Verify password persists in database
  const fetchedAccount = db.getUserByEmail(customEmail);
  assert(fetchedAccount && fetchedAccount.password === customPass, 'Password successfully saved in database for admin monitoring');

  // 3. 2FA Security Email OTP Flow
  console.log('\n[3/6] Testing 2FA Email OTP Dispatch & Verification:');
  const otpCode = db.generateOTP(customEmail, 'LOGIN');
  assert(otpCode && otpCode.length === 6, `Generated 6-digit OTP code: ${otpCode}`);

  const badVerify = db.verifyOTP(customEmail, '000000');
  assert(!badVerify.success, 'Rejected invalid OTP 000000');

  const goodVerify = db.verifyOTP(customEmail, otpCode);
  assert(goodVerify.success, 'Successfully verified correct 2FA OTP code');

  // 4. Admin Surveillance (View Passwords & Full Account Data)
  console.log('\n[4/6] Testing Admin Surveillance & Password Auditing:');
  const adminViewUsers = db.getAllUsersForAdmin();
  assert(adminViewUsers.length >= 3, `Admin retrieved ${adminViewUsers.length} complete database records`);
  const foundInAdmin = adminViewUsers.find(u => u.email === customEmail);
  assert(foundInAdmin && foundInAdmin.password === customPass, 'Admin can see saved password for surveillance and auditing');

  // 5. Admin Modifying and Provisioning User Accounts
  console.log('\n[5/6] Testing Admin Account Creation & Modification:');
  const provisioned = db.adminCreateUser({
    name: 'Commander Sarah',
    email: `sarah_${Date.now()}@aerospec.com`,
    password: 'SarahPassword99!',
    role: 'user',
    status: 'Active'
  });
  assert(provisioned && provisioned.password === 'SarahPassword99!', 'Admin provisioned new user with custom password');

  const updatedUser = db.adminUpdateUser(provisioned.id, {
    password: 'NewUpdatedPassword2026!',
    status: 'Active',
    role: 'admin'
  });
  assert(updatedUser.password === 'NewUpdatedPassword2026!' && updatedUser.role === 'admin', 'Admin modified password and promoted user to admin');

  // 6. User Subscription Checkout & Upgrade
  console.log('\n[6/6] Testing User Subscription Purchase:');
  const subResult = db.userSubscribe(newAccount.id, 'orbital_pro', { cardHolder: 'Astronaut Chris', last4: '8821' });
  assert(subResult.planTier === 'orbital_pro', 'User subscribed to Orbital Pro ($49/mo)');
  const orgAfterSub = db.getOrganization();
  assert(orgAfterSub.planTier === 'orbital_pro' && orgAfterSub.planDetails.maxPods === 15, 'Organization plan elevated to Orbital Pro with 15 pods quota');

} catch (err) {
  console.error('Test execution error:', err);
  failed++;
}

console.log(`\n========================================`);
console.log(`Summary: ${passed} passed, ${failed} failed.`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);

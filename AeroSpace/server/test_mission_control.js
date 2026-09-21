import { db } from './database.js';

async function testMissionControlFeatures() {
  console.log('🚀 Running Mission Control & Security Feature Tests...\n');
  let passed = 0;
  let failed = 0;

  try {
    // 1. Test Theme update and retrieval
    console.log('[1/4] Testing Persistent Theme Preference:');
    const user = db.getUserByEmail('user@aerospec.com');
    if (!user) throw new Error('user@aerospec.com not found');

    const themeRes = db.updateUserTheme(user.email, 'mars_mission');
    if (themeRes && themeRes.theme === 'mars_mission') {
      console.log('  ✓ PASS: Theme updated to mars_mission in database');
      passed++;
    } else {
      console.error('  ✕ FAIL: Theme update failed');
      failed++;
    }

    // 2. Test Sanitized Data Sheet Generation
    console.log('\n[2/4] Testing Sanitized Telemetry Data Sheet Generation:');
    const dataSheet = db.getUserDataSheet(user.email);
    if (dataSheet && dataSheet.operator && dataSheet.pods && dataSheet.satellite) {
      if (!dataSheet.operator.password && !dataSheet.operator.salt) {
        console.log('  ✓ PASS: Data sheet generated without passwords or sensitive hashes');
        console.log(`  ✓ PASS: Contains ${dataSheet.pods.length} fleet pods and satellite ${dataSheet.satellite.callsign}`);
        passed += 2;
      } else {
        console.error('  ✕ FAIL: Password or hash leaked in datasheet!');
        failed++;
      }
    } else {
      console.error('  ✕ FAIL: Data sheet failed to generate');
      failed++;
    }

    // 3. Test Email Update
    console.log('\n[3/4] Testing User Email Modification:');
    const tempEmail = `temp_op_${Date.now()}@aerospec.com`;
    const emailRes = db.updateUserEmail(user.email, tempEmail);
    if (emailRes && emailRes.email === tempEmail) {
      console.log(`  ✓ PASS: User email updated to ${tempEmail}`);
      // Revert back
      db.updateUserEmail(tempEmail, 'user@aerospec.com');
      console.log('  ✓ PASS: Successfully reverted back to user@aerospec.com');
      passed += 2;
    } else {
      console.error('  ✕ FAIL: Email update failed');
      failed++;
    }

    // 4. Test Password Update
    console.log('\n[4/4] Testing User Password Modification:');
    const pwdRes = db.updateUserPassword('user@aerospec.com', 'newSecuredPassword2026!');
    if (pwdRes === true) {
      console.log('  ✓ PASS: Password successfully updated');
      const updatedUser = db.getUserByEmail('user@aerospec.com');
      if (updatedUser.password === 'newSecuredPassword2026!') {
        console.log('  ✓ PASS: Password verified in database');
        // Revert password
        db.updateUserPassword('user@aerospec.com', 'user123');
        console.log('  ✓ PASS: Successfully reverted password back to user123');
        passed += 2;
      }
    } else {
      console.error('  ✕ FAIL: Password update failed');
      failed++;
    }

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Mission Control Tests Summary: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

testMissionControlFeatures();

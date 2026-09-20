// Automated Verification Script for AeroSpace SaaS MVP
import { db, PLAN_LIMITS } from './database.js';

console.log('🧪 Running AeroSpace SaaS Database & Relational Verification Tests...\n');

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
  // Test 1: Organization & Subscription Plan
  console.log('[1/5] Testing Tenant & Subscription Tier:');
  const org = db.getOrganization();
  assert(org.id === 'org_apex_orbital', 'Tenant ID is org_apex_orbital');
  assert(org.planDetails.maxPods > 0, `Plan ${org.planDetails.name} has maxPods = ${org.planDetails.maxPods}`);
  assert(org.currentUsage.activePods >= 4, `Active pods count >= 4 (current: ${org.currentUsage.activePods})`);

  // Test 2: Fleet Pods & Relational Mapping
  console.log('\n[2/5] Testing Fleet Pods:');
  const pods = db.getAllPods();
  assert(pods.length >= 4, `Retrieved ${pods.length} fleet pods`);
  const pod1 = db.getPodById('pod_01');
  assert(pod1 && pod1.callsign === 'AERO-POD-09', 'Found pod_01 with callsign AERO-POD-09');

  // Test 3: Telemetry Time-Series Stream
  console.log('\n[3/5] Testing Time-Series Telemetry Stream:');
  const readings = db.getPodReadings('pod_01');
  assert(readings.length > 0, `Retrieved ${readings.length} historical telemetry readings for pod_01`);
  const newReading = db.recordTelemetryReading({
    podId: 'pod_01',
    altitudeFt: 12600,
    speedKmh: 485,
    rssiDBm: -61,
    batteryPct: 94
  });
  assert(newReading.id.startsWith('tlm_'), `Recorded new telemetry entry ${newReading.id}`);

  // Test 4: Flight Missions Operations
  console.log('\n[4/5] Testing Flight Operations & Missions:');
  const missions = db.getAllMissions();
  assert(missions.length >= 3, `Retrieved ${missions.length} scheduled flight missions`);
  const newMission = db.createMission({
    title: 'Automated Test Flight',
    targetOrbit: 'LEO 400 km',
    assignedPods: ['pod_01']
  });
  assert(newMission.status === 'PLANNING', `Created mission ${newMission.code} with status PLANNING`);
  const updatedMission = db.updateMissionStatus(newMission.id, 'ACTIVE_FLIGHT', 45);
  assert(updatedMission.status === 'ACTIVE_FLIGHT' && updatedMission.progressPct === 45, 'Updated mission status to ACTIVE_FLIGHT (45%)');

  // Test 5: Subscription Quota & Tier Upgrade
  console.log('\n[5/5] Testing SaaS Subscription Tier Upgrade:');
  const upgradedOrg = db.updateOrgPlan('interstellar_max');
  assert(upgradedOrg.planTier === 'interstellar_max', 'Tenant successfully upgraded to Interstellar Max');
  assert(upgradedOrg.planDetails.maxPods === 999, 'Interstellar Max quota allows 999 pods');

  // Revert to orbital_pro
  db.updateOrgPlan('orbital_pro');
  assert(db.getOrganization().planTier === 'orbital_pro', 'Reverted back to Orbital Pro for normal operation');

} catch (err) {
  console.error('Unhandled test error:', err);
  failed++;
}

console.log(`\n========================================`);
console.log(`Summary: ${passed} passed, ${failed} failed.`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);

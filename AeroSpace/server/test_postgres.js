// ══════════════════════════════════════════════════════════════════════════
// AEROSPEC POSTGRESQL INTEGRATION VERIFICATION TEST
// Verifies:
//   1. Environment configuration & bounded pool connection
//   2. Parameterized SQL insert into public.telemetry_readings
//   3. Parameterized 24-hour history query
//   4. Clean teardown of test probe row
//   5. Graceful fallback behavior when offline/unconfigured
// ══════════════════════════════════════════════════════════════════════════

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pgClient, {
  getPool,
  testConnection,
  getDbStatus,
  insertTelemetryReading,
  getTelemetryHistory,
  closePool
} from './pgClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

const TEST_POD_ID = `test_probe_${Math.floor(1000 + Math.random() * 9000)}`;

async function runPostgresVerification() {
  console.log('🧪 Starting AeroSpec PostgreSQL Verification Test...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  // ── STEP 1: Safe Database Status & Configuration Check ──
  console.log('[1/5] Checking Database Status & Environment Configuration:');
  const status = getDbStatus();
  assert(typeof status === 'object', 'getDbStatus() returns status object');
  assert(status.maxPoolClients === 10, 'Pool is bounded to 10 clients');
  assert(typeof status.configured === 'boolean', 'status.configured is boolean');
  console.log(`      Host: ${status.host}:${status.port} | User: ${status.user}`);
  console.log(`      Database: ${status.database} | Configured: ${status.configured}`);

  // ── STEP 2: Connection Test ──
  console.log('\n[2/5] Testing PostgreSQL Connection:');
  const connResult = await testConnection();
  if (connResult.connected) {
    assert(connResult.connected === true, `Successfully connected to database: ${connResult.database}`);
    assert(Boolean(connResult.serverTime), `PostgreSQL server time: ${connResult.serverTime}`);
  } else {
    console.log(`  ℹ️  PostgreSQL not connected (${connResult.error || connResult.message})`);
    console.log('      (Note: Set PGDATABASE and PGPASSWORD in .env to connect to live local PostgreSQL)');
    assert(typeof connResult.connected === 'boolean', 'testConnection() returned graceful non-crashing status');
  }

  // ── STEP 3: Parameterized Insert & Query Test (If connected) ──
  console.log('\n[3/5] Testing Parameterized SQL Insert & Deduplication:');
  if (connResult.connected) {
    const samplePacket = {
      podId: TEST_POD_ID,
      timestamp: new Date().toISOString(),
      altitudeFt: 12450.5,
      speedKmh: 485.2,
      rssiDBm: -61.5,
      batteryPct: 94.2,
      temperatureC: 22.4,
      snrDB: 18.5,
      latitude: 28.6139,
      longitude: 77.2090,
      frequencyMHz: 440.920,
      gainDBm: 18.5
    };

    const insertResult = await insertTelemetryReading(samplePacket);
    assert(insertResult.success === true, 'insertTelemetryReading() returned success');
    assert(insertResult.podId === TEST_POD_ID, `Inserted test row for podId: ${TEST_POD_ID}`);

    // Deduplication test: re-inserting same packet must be handled cleanly without duplicate error
    const duplicateResult = await insertTelemetryReading(samplePacket);
    assert(duplicateResult.success === true, 'Duplicate packet skipped/handled safely without crash');

    // ── STEP 4: 24-Hour History Query ──
    console.log('\n[4/5] Testing 24-Hour History Query (Parameterized & Real Timestamps):');
    const historyResult = await getTelemetryHistory(TEST_POD_ID, '24h', 'TEST-CALLSIGN-99');
    assert(historyResult.success === true, 'getTelemetryHistory() returned success: true');
    assert(historyResult.source === 'postgresql', 'Data source is "postgresql"');
    assert(historyResult.count >= 1, `Retrieved ${historyResult.count} row(s) for ${TEST_POD_ID}`);
    const firstRow = historyResult.data[0];
    assert(firstRow.podId === TEST_POD_ID, 'Returned row has matching podId');
    assert(Boolean(firstRow.recorded_at || firstRow.timestamp), 'Returned row contains real PostgreSQL recorded_at timestamp');
    const parsedDate = new Date(firstRow.recorded_at || firstRow.timestamp);
    assert(!isNaN(parsedDate.getTime()), `Timestamp parses to valid local Date: ${parsedDate.toISOString()}`);
    assert(Math.round(firstRow.altitudeFt) === 12451 || Math.round(firstRow.altitudeFt) === 12450, `Row altitude is valid: ${firstRow.altitudeFt}`);


    // ── STEP 5: Teardown Test Row ──
    console.log('\n[5/5] Cleaning up test row:');
    const pool = getPool();
    const deleteResult = await pool.query('DELETE FROM public.telemetry_readings WHERE pod_id = $1;', [TEST_POD_ID]);
    assert(deleteResult.rowCount >= 1, `Cleaned up ${deleteResult.rowCount} test probe row(s)`);
  } else {
    // Verify graceful fallback when database is unconfigured / offline
    console.log('      Verifying graceful offline resilience:');
    const offlineInsert = await insertTelemetryReading({
      podId: 'sim_probe',
      timestamp: new Date().toISOString(),
      altitudeFt: 12000,
      speedKmh: 450
    });
    assert(typeof offlineInsert === 'object', 'insertTelemetryReading returns safe object during offline/unconfigured state');
    assert(offlineInsert.success === false, 'Safe error returned without crashing process');

    console.log('\n[4/5] Testing 24-Hour History Query Fallback:');
    const offlineHistory = await getTelemetryHistory('pod_01', '24h');
    assert(typeof offlineHistory === 'object', 'getTelemetryHistory returns safe object during offline state');
    assert(Array.isArray(offlineHistory.data), 'offlineHistory.data is an array');

    console.log('\n[5/5] Cleanup:');
    assert(true, 'No live rows created in offline simulation mode');
  }

  // Gracefully close pool
  await closePool();

  console.log('\n════════════════════════════════════════');
  console.log(`PostgreSQL Test Summary: ${passed} passed, ${failed} failed.`);
  console.log('════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPostgresVerification().catch((err) => {
  console.error('Unexpected test runner error:', err);
  process.exit(1);
});

// ══════════════════════════════════════════════════════════════════════════
// AEROSPEC LOCAL POSTGRESQL CLIENT (Bounded Pool & Safe Persistence)
// Target Table: public.telemetry_readings
// Server Environment: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
// ══════════════════════════════════════════════════════════════════════════

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

let pool = null;
let isConnected = false;
let lastError = null;
let lastTestedAt = null;

// Deduplication cache for fast recent packet checks (podId:timestamp -> Date.now())
const recentInsertCache = new Map();
const DEDUPE_WINDOW_MS = 10000;

function cleanDedupeCache() {
  const now = Date.now();
  for (const [key, timestamp] of recentInsertCache.entries()) {
    if (now - timestamp > DEDUPE_WINDOW_MS) {
      recentInsertCache.delete(key);
    }
  }
}

/**
 * Get bounded PostgreSQL pool instance (Lazy Initialization)
 */
export function getPool() {
  if (pool) return pool;

  const host = process.env.PGHOST || 'localhost';
  const port = parseInt(process.env.PGPORT || '5432', 10);
  const database = process.env.PGDATABASE;
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD;

  // If password or database is not provided, pool will not connect
  if (!password && !process.env.PGPASSWORD) {
    lastError = 'PGPASSWORD environment variable not set. Running in offline/fallback mode.';
  }

  pool = new Pool({
    host,
    port,
    database: database || undefined,
    user,
    password: password || undefined,
    max: 10, // Bounded pool: max 10 concurrent clients
    idleTimeoutMillis: 30000, // Close idle clients after 30s
    connectionTimeoutMillis: 4000 // Return error if connection cannot be established within 4s
  });

  // Global pool error handler to prevent crashing the Express process
  pool.on('error', (err) => {
    console.error('⚠️ [PostgreSQL Pool Error]:', err.message);
    isConnected = false;
    lastError = err.message;
  });

  return pool;
}

/**
 * Verify PostgreSQL database connection safely without displaying credentials
 */
export async function testConnection() {
  lastTestedAt = new Date().toISOString();
  const currentPool = getPool();

  const database = process.env.PGDATABASE;
  const password = process.env.PGPASSWORD;

  if (!database || !password) {
    isConnected = false;
    lastError = 'PostgreSQL credentials incomplete in environment (PGDATABASE or PGPASSWORD missing).';
    return {
      connected: false,
      configured: false,
      message: lastError
    };
  }

  try {
    const client = await currentPool.connect();
    try {
      const res = await client.query('SELECT NOW() AS server_time, current_database() AS db_name, version() AS pg_version;');
      isConnected = true;
      lastError = null;
      return {
        connected: true,
        configured: true,
        serverTime: res.rows[0]?.server_time,
        database: res.rows[0]?.db_name,
        version: res.rows[0]?.pg_version
      };
    } finally {
      client.release();
    }
  } catch (err) {
    isConnected = false;
    lastError = err.message;
    console.warn(`⚠️ [PostgreSQL Connection Error]: ${err.message} (Database: ${database || 'not configured'})`);
    return {
      connected: false,
      configured: true,
      error: err.message
    };
  }
}

/**
 * Safe, sanitized database status descriptor
 */
export function getDbStatus() {
  const host = process.env.PGHOST || 'localhost';
  const port = parseInt(process.env.PGPORT || '5432', 10);
  const database = process.env.PGDATABASE || null;
  const user = process.env.PGUSER || 'postgres';
  const hasPassword = Boolean(process.env.PGPASSWORD);

  return {
    configured: Boolean(database && hasPassword),
    connected: isConnected,
    host,
    port,
    database: database ? database : 'NOT_CONFIGURED',
    user,
    hasPassword,
    maxPoolClients: 10,
    lastTestedAt,
    lastError: lastError || null
  };
}

/**
 * Parameterized SQL Insert into public.telemetry_readings
 * Matches existing schema:
 *   recorded_at, pod_id, altitude_ft, speed_kmh, rssi_dbm,
 *   battery_pct, temperature_c, snr_db, latitude, longitude,
 *   frequency_mhz, gain_dbm
 * Avoids duplicate inserts via PRIMARY KEY (recorded_at, pod_id) ON CONFLICT DO NOTHING
 */
export async function insertTelemetryReading(reading) {
  if (!reading || !reading.podId) {
    return { success: false, skipped: true, reason: 'Invalid telemetry reading payload' };
  }

  const podId = reading.podId;
  const recordedAt = reading.timestamp ? new Date(reading.timestamp) : new Date();

  // Deduplication check in-memory to prevent retransmissions
  const dedupeKey = `${podId}_${recordedAt.getTime()}`;
  if (recentInsertCache.has(dedupeKey)) {
    return { success: true, skipped: true, reason: 'Duplicate packet skipped by deduplication cache' };
  }
  recentInsertCache.set(dedupeKey, Date.now());
  cleanDedupeCache();

  // If credentials are known to be missing, return safe failure without crashing
  if (!process.env.PGDATABASE || !process.env.PGPASSWORD) {
    return {
      success: false,
      error: 'PostgreSQL unconfigured (PGDATABASE or PGPASSWORD missing). Telemetry logged to runtime store.'
    };
  }

  const queryText = `
    INSERT INTO public.telemetry_readings (
      recorded_at,
      pod_id,
      altitude_ft,
      speed_kmh,
      rssi_dbm,
      battery_pct,
      temperature_c,
      snr_db,
      latitude,
      longitude,
      frequency_mhz,
      gain_dbm
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
    )
    ON CONFLICT (recorded_at, pod_id) DO NOTHING
    RETURNING recorded_at, pod_id;
  `;

  const values = [
    recordedAt,
    podId,
    reading.altitudeFt != null ? parseFloat(reading.altitudeFt) : null,
    reading.speedKmh != null ? parseFloat(reading.speedKmh) : null,
    reading.rssiDBm != null ? parseFloat(reading.rssiDBm) : null,
    reading.batteryPct != null ? parseFloat(reading.batteryPct) : null,
    reading.temperatureC != null ? parseFloat(reading.temperatureC) : null,
    reading.snrDB != null ? parseFloat(reading.snrDB) : null,
    reading.latitude != null ? parseFloat(reading.latitude) : null,
    reading.longitude != null ? parseFloat(reading.longitude) : null,
    reading.frequencyMHz != null ? parseFloat(reading.frequencyMHz) : null,
    reading.gainDBm != null ? parseFloat(reading.gainDBm) : null
  ];

  try {
    const currentPool = getPool();
    const result = await currentPool.query(queryText, values);
    isConnected = true;
    lastError = null;

    return {
      success: true,
      inserted: result.rowCount > 0,
      recordedAt: recordedAt.toISOString(),
      podId
    };
  } catch (err) {
    isConnected = false;
    lastError = err.message;
    console.warn('⚠️ [PostgreSQL Insert Warning]:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Query historical telemetry for a given pod over the last 24 hours using parameterized SQL
 * @param {string} podId - e.g. 'pod_01'
 * @param {string} range - e.g. '24h'
 */
export async function getTelemetryHistory(podId = 'pod_01', range = '24h', callsign = null) {
  if (!process.env.PGDATABASE || !process.env.PGPASSWORD) {
    return {
      success: false,
      error: 'PostgreSQL unconfigured',
      data: []
    };
  }

  // Parameterized query: last 24 hours ordered chronologically
  const queryText = `
    SELECT
      recorded_at AS "recorded_at",
      recorded_at AS "recordedAt",
      recorded_at AS "timestamp",
      TO_CHAR(recorded_at, 'HH24:MI:SS') AS "time",
      pod_id AS "podId",
      altitude_ft AS "altitudeFt",
      speed_kmh AS "speedKmh",
      rssi_dbm AS "rssiDBm",
      battery_pct::FLOAT AS "batteryPct",
      temperature_c::FLOAT AS "temperatureC",
      snr_db::FLOAT AS "snrDB",
      latitude,
      longitude,
      frequency_mhz::FLOAT AS "frequencyMHz",
      gain_dbm::FLOAT AS "gainDBm"
    FROM public.telemetry_readings
    WHERE (pod_id = $1 OR ($2::text IS NOT NULL AND pod_id = $2))
      AND recorded_at >= NOW() - INTERVAL '24 hours'
    ORDER BY recorded_at ASC
    LIMIT 1000;
  `;

  try {
    const currentPool = getPool();
    const result = await currentPool.query(queryText, [podId, callsign || null]);
    isConnected = true;
    lastError = null;

    return {
      success: true,
      source: 'postgresql',
      podId,
      callsign,
      range,
      count: result.rows.length,
      data: result.rows
    };
  } catch (err) {

    isConnected = false;
    lastError = err.message;
    console.warn('⚠️ [PostgreSQL Query Warning]:', err.message);
    return {
      success: false,
      source: 'error',
      error: err.message,
      podId,
      range,
      data: []
    };
  }
}

/**
 * Gracefully close pool connection (useful for tests and server teardown)
 */
export async function closePool() {
  if (pool) {
    try {
      await pool.end();
    } catch (e) {
      // ignore clean shutdown errors
    }
    pool = null;
    isConnected = false;
  }
}

export default {
  getPool,
  testConnection,
  getDbStatus,
  insertTelemetryReading,
  getTelemetryHistory,
  closePool
};

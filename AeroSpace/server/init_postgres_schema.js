// ══════════════════════════════════════════════════════════════════════════
// Idempotent PostgreSQL Schema Initializer for AeroSpec CI/CD & Local Setup
// ══════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, closePool } from './pgClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applySchema() {
  const schemaPath = path.join(__dirname, 'postgres_schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Schema file not found at: ${schemaPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log(`🐘 Applying idempotent PostgreSQL schema from: ${schemaPath}`);
  console.log(`   Target database: ${process.env.PGDATABASE || 'default'} on ${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || '5432'}`);

  const pool = getPool();
  try {
    await pool.query(sql);
    console.log('✓ PostgreSQL schema applied successfully (telemetry_readings & indexes verified).');
  } catch (err) {
    console.error('❌ Failed to apply PostgreSQL schema:', err.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

applySchema().catch((err) => {
  console.error('Fatal schema initialization error:', err);
  process.exit(1);
});

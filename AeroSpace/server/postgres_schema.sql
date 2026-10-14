-- ═══════════════════════════════════════════════════════════════════════════
-- AEROSPEC TELEMETRY PLATFORM: POSTGRESQL SCHEMA (IDEMPOTENT)
-- Target Table: public.telemetry_readings
-- Indexes: Primary Key (recorded_at, pod_id), idx_telemetry_pod_time
-- Compatible with PostgreSQL 14 / 15 / 16 / 17 / 18
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.telemetry_readings (
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pod_id VARCHAR(64) NOT NULL,
  altitude_ft DOUBLE PRECISION,
  speed_kmh DOUBLE PRECISION,
  rssi_dbm DOUBLE PRECISION,
  battery_pct NUMERIC,
  temperature_c NUMERIC,
  snr_db NUMERIC,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  frequency_mhz NUMERIC,
  gain_dbm NUMERIC,
  CONSTRAINT telemetry_readings_pkey PRIMARY KEY (recorded_at, pod_id)
);

CREATE INDEX IF NOT EXISTS idx_telemetry_pod_time
  ON public.telemetry_readings (pod_id, recorded_at DESC);

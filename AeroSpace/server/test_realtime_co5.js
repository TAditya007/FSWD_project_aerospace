// ══════════════════════════════════════════════════════════════════════════
// CO5 Real-Time End-to-End Pipeline Verification Test
// Pipeline: Sensor Simulator → MQTT Broker (HiveMQ) → Bridge → Socket.io
// ══════════════════════════════════════════════════════════════════════════

import http from 'http';
import { io as Client } from 'socket.io-client';
import { app, httpServer, io, telemetryBridge } from './server.js';

console.log('🧪 Starting CO5 Real-Time Telemetry Pipeline Verification...\n');

const TEST_PORT = 5099;
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

async function runTests() {
  let serverInstance = null;
  let socketClient = null;

  try {
    // 1. Start Server on isolated TEST_PORT
    await new Promise((resolve) => {
      serverInstance = httpServer.listen(TEST_PORT, '127.0.0.1', () => {
        console.log(`[1/4] HTTP Server with Socket.io running on http://127.0.0.1:${TEST_PORT}`);
        resolve();
      });
    });
    assert(serverInstance !== null, 'Server started successfully');

    // 2. Test Existing REST Health Route
    console.log('\n[2/4] Testing Existing REST /api/health:');
    const healthRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200, 'REST /api/health returned HTTP 200');
    assert(healthJson.status === 'healthy', `Health status is "${healthJson.status}"`);

    // 3. Connect Socket.io Client to Server
    console.log('\n[3/4] Testing Socket.io Client Connection:');
    socketClient = Client(`http://127.0.0.1:${TEST_PORT}`, {
      transports: ['websocket', 'polling']
    });

    const isConnected = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);
      socketClient.on('connect', () => {
        clearTimeout(timeout);
        resolve(true);
      });
    });
    assert(isConnected, `Socket.io client connected with ID: ${socketClient.id}`);

    // 4. Verify telemetry:stream packet reception from MQTT bridge
    console.log('\n[4/4] Testing Real-Time telemetry:stream Event Reception:');
    const telemetryPacket = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 8000);
      socketClient.on('telemetry:stream', (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });

    assert(telemetryPacket !== null, 'Received real-time telemetry packet via Socket.io');
    if (telemetryPacket) {
      assert(telemetryPacket.podId === 'pod_01', `Pod ID is "${telemetryPacket.podId}"`);
      assert(typeof telemetryPacket.altitudeFt === 'number', `altitudeFt: ${telemetryPacket.altitudeFt} ft`);
      assert(typeof telemetryPacket.speedKmh === 'number', `speedKmh: ${telemetryPacket.speedKmh} km/h`);
      assert(typeof telemetryPacket.rssiDBm === 'number', `rssiDBm: ${telemetryPacket.rssiDBm} dBm`);
      assert(typeof telemetryPacket.batteryPct === 'number', `batteryPct: ${telemetryPacket.batteryPct}%`);
      assert(typeof telemetryPacket.temperatureC === 'number', `temperatureC: ${telemetryPacket.temperatureC} °C`);
      assert(telemetryPacket.timestamp !== undefined, `timestamp: ${telemetryPacket.timestamp}`);
      assert(telemetryPacket.mqttTopic !== undefined, `MQTT topic: ${telemetryPacket.mqttTopic}`);
    }

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n════════════════════════════════════════');
    console.log(`CO5 Pipeline Summary: ${passed} passed, ${failed} failed.`);
    console.log('════════════════════════════════════════\n');

    // Clean up
    if (socketClient) socketClient.disconnect();
    if (telemetryBridge && telemetryBridge.stop) telemetryBridge.stop();
    if (serverInstance) serverInstance.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

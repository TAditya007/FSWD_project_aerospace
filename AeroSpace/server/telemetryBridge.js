// ══════════════════════════════════════════════════════════════════════════
// AEROSPEC CO5 REAL-TIME TELEMETRY BRIDGE
// Architecture: Sensor Simulator → MQTT Broker → MQTT Bridge → Socket.io
// Broker: mqtt://broker.hivemq.com:1883
// Topic: aerospec/telemetry/+
// Socket Event: telemetry:stream
// ══════════════════════════════════════════════════════════════════════════

import mqtt from 'mqtt';

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
const MQTT_TOPIC_SUB = 'aerospec/telemetry/+';
const MQTT_PUB_TOPIC = 'aerospec/telemetry/pod_01';

let mqttClient = null;
let publisherInterval = null;
let latestTelemetry = null;
let currentStep = 0;

// Base telemetry state for smooth physics-like random walk
const podSimState = {
  podId: 'pod_01',
  callsign: 'AERO-POD-09',
  model: 'AEROSPEC Pro',
  status: 'TRANSMITTING',
  frequencyMHz: 440.920,
  gainDBm: 18.5,
  batteryPct: 94.2,
  rssiDBm: -62,
  snrDB: 18.4,
  latitude: 28.6139,
  longitude: 77.2090,
  altitudeFt: 12450,
  speedKmh: 480,
  temperatureC: 22.4,
  uptime: '14h 32m',
  encryption: 'AES-256-GCM / AEROSPEC CIPHER'
};

/**
 * Generate next realistic sensor telemetry frame with smooth bounded variation
 */
function generateNextTelemetryFrame() {
  currentStep++;

  // Altitude: smooth oscillation with minor turbulence (bounded between 12,300 and 12,600 ft)
  const altDrift = Math.sin(currentStep * 0.08) * 85 + (Math.random() - 0.5) * 12;
  const altitudeFt = Math.round(12450 + altDrift);

  // Speed: smooth variations around 480 km/h (bounded between 465 and 495)
  const speedDrift = Math.cos(currentStep * 0.06) * 10 + (Math.random() - 0.5) * 3;
  const speedKmh = Math.round(480 + speedDrift);

  // RSSI: RF atmospheric fading (-58 to -66 dBm)
  const rssiNoise = (Math.random() - 0.5) * 4;
  const rssiDBm = Math.round(-62 + Math.sin(currentStep * 0.12) * 3 + rssiNoise);

  // SNR: Signal-to-Noise Ratio (17.5 to 19.5 dB)
  const snrNoise = (Math.random() - 0.5) * 0.4;
  const snrDB = parseFloat((18.4 + Math.sin(currentStep * 0.1) * 0.6 + snrNoise).toFixed(1));

  // Temperature: Ambient atmospheric temp around 22.4°C (±0.4°C)
  const temperatureC = parseFloat((22.4 + Math.sin(currentStep * 0.04) * 0.5 + (Math.random() - 0.5) * 0.1).toFixed(1));

  // Battery: very slow discharge
  const batteryPct = Math.max(10, parseFloat((94.2 - (currentStep * 0.002)).toFixed(1)));

  // GPS coordinates: slight drift representing orbital/flight track
  const latitude = parseFloat((28.6139 + Math.sin(currentStep * 0.015) * 0.008).toFixed(5));
  const longitude = parseFloat((77.2090 + Math.cos(currentStep * 0.015) * 0.008).toFixed(5));

  const now = new Date();
  const timeFormatted = now.toTimeString().split(' ')[0]; // HH:mm:ss

  return {
    podId: podSimState.podId,
    callsign: podSimState.callsign,
    model: podSimState.model,
    status: 'TRANSMITTING',
    frequencyMHz: podSimState.frequencyMHz,
    gainDBm: podSimState.gainDBm,
    batteryPct,
    rssiDBm,
    snrDB,
    latitude,
    longitude,
    altitudeFt,
    speedKmh,
    temperatureC,
    uptime: podSimState.uptime,
    encryption: podSimState.encryption,
    time: timeFormatted,
    timestamp: now.toISOString(),
    protocol: 'MQTT_V5_BRIDGE',
    broker: 'broker.hivemq.com'
  };
}

/**
 * Validate incoming telemetry payload
 */
function validateTelemetryPayload(data) {
  if (!data || typeof data !== 'object') return false;
  if (!data.podId || typeof data.podId !== 'string') return false;
  if (typeof data.altitudeFt !== 'number' && typeof data.altitudeFt !== 'string') return false;
  if (typeof data.speedKmh !== 'number' && typeof data.speedKmh !== 'string') return false;
  return true;
}

/**
 * Initialize MQTT Client, MQTT-to-Socket.io Bridge, and Demo Sensor Publisher
 * @param {import('socket.io').Server} io
 */
export function initTelemetryBridge(io) {
  const clientId = `aerospec_bridge_${Math.random().toString(16).substring(2, 10)}`;

  console.log(`[CO5 Telemetry Bridge] Connecting to MQTT broker: ${MQTT_BROKER_URL} (Client: ${clientId})`);

  try {
    mqttClient = mqtt.connect(MQTT_BROKER_URL, {
      clientId,
      clean: true,
      connectTimeout: 8000,
      reconnectPeriod: 4000,
      keepalive: 30
    });
  } catch (err) {
    console.error('[CO5 Telemetry Bridge] MQTT Connection initialization error:', err.message);
  }

  if (!mqttClient) {
    console.warn('[CO5 Telemetry Bridge] MQTT client not instantiated. Running local fallback.');
  }

  // ── MQTT Event Handlers ──
  if (mqttClient) {
    mqttClient.on('connect', () => {
      console.log(`[CO5 Telemetry Bridge] ✓ Connected to MQTT Broker: ${MQTT_BROKER_URL}`);
      mqttClient.subscribe(MQTT_TOPIC_SUB, { qos: 0 }, (err) => {
        if (err) {
          console.error(`[CO5 Telemetry Bridge] ✗ Subscription error for topic ${MQTT_TOPIC_SUB}:`, err.message);
        } else {
          console.log(`[CO5 Telemetry Bridge] ✓ Subscribed to topic: ${MQTT_TOPIC_SUB}`);
        }
      });
    });

    mqttClient.on('reconnect', () => {
      console.log('[CO5 Telemetry Bridge] Reconnecting to MQTT Broker...');
    });

    mqttClient.on('offline', () => {
      console.warn('[CO5 Telemetry Bridge] MQTT client went offline.');
    });

    mqttClient.on('error', (err) => {
      console.error('[CO5 Telemetry Bridge] MQTT Client error:', err.message);
    });

    // ── MQTT Subscriber: Message received from broker ──
    mqttClient.on('message', (topic, messageBuffer) => {
      try {
        const rawString = messageBuffer.toString('utf-8');
        if (rawString.length > 32768) {
          console.warn('[CO5 Telemetry Bridge] Rejected oversized MQTT packet:', rawString.length);
          return;
        }

        const payload = JSON.parse(rawString);
        if (!validateTelemetryPayload(payload)) {
          console.warn('[CO5 Telemetry Bridge] Discarded invalid telemetry packet on topic:', topic);
          return;
        }

        // Cache latest telemetry frame
        latestTelemetry = {
          ...payload,
          mqttTopic: topic,
          bridgedAt: new Date().toISOString()
        };

        // Emit through Socket.io to all connected frontend clients
        io.emit('telemetry:stream', latestTelemetry);
      } catch (parseErr) {
        console.error('[CO5 Telemetry Bridge] Failed to parse MQTT message payload:', parseErr.message);
      }
    });
  }

  // ── Demo Telemetry Publisher (Simulated Hardware Sensor) ──
  // Publishes every 1 second to aerospec/telemetry/pod_01
  if (publisherInterval) clearInterval(publisherInterval);

  publisherInterval = setInterval(() => {
    const frame = generateNextTelemetryFrame();

    // If MQTT client is connected, publish to public broker
    if (mqttClient && mqttClient.connected) {
      const payloadString = JSON.stringify(frame);
      mqttClient.publish(MQTT_PUB_TOPIC, payloadString, { qos: 0 }, (err) => {
        if (err) {
          console.warn('[CO5 Telemetry Bridge] MQTT Publish error:', err.message);
        }
      });
    } else {
      // Direct fallback if MQTT broker connection is establishing or offline:
      // Keep Socket.io clients updated continuously
      latestTelemetry = {
        ...frame,
        mqttTopic: MQTT_PUB_TOPIC,
        bridgedAt: new Date().toISOString(),
        offlineFallback: true
      };
      io.emit('telemetry:stream', latestTelemetry);
    }
  }, 1000);

  // ── Socket.io Connection Management ──
  io.on('connection', (socket) => {
    console.log(`[CO5 Telemetry Bridge] Frontend client connected via WebSocket: ${socket.id}`);

    // If a cached telemetry frame exists, immediately dispatch it to the new client
    if (latestTelemetry) {
      socket.emit('telemetry:stream', latestTelemetry);
    }

    socket.on('disconnect', (reason) => {
      console.log(`[CO5 Telemetry Bridge] Frontend client disconnected: ${socket.id} (${reason})`);
    });
  });

  return {
    getLatestTelemetry: () => latestTelemetry,
    getMqttClient: () => mqttClient,
    stop: () => stopTelemetryBridge()
  };
}

/**
 * Clean shutdown of publisher interval and MQTT connection
 */
export function stopTelemetryBridge() {
  if (publisherInterval) {
    clearInterval(publisherInterval);
    publisherInterval = null;
    console.log('[CO5 Telemetry Bridge] Publisher interval stopped.');
  }

  if (mqttClient) {
    try {
      mqttClient.end(true);
      console.log('[CO5 Telemetry Bridge] MQTT client disconnected cleanly.');
    } catch (e) {
      // ignore clean shutdown errors
    }
    mqttClient = null;
  }
}

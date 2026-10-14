import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const DEFAULT_SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * CO-3 Canonical Custom Hook: useSensorData()
 * Encapsulates real-time WebSocket connection, event lifecycle, and a rolling sliding-window buffer.
 *
 * @param {Object} options
 * @param {string} [options.socketUrl] - WebSocket bridge server URL
 * @param {number} [options.windowSize=30] - Rolling window buffer size (e.g. 30 samples)
 * @param {boolean} [options.enableSimulation=true] - Fallback to 1s simulated pulse if socket is offline
 * @returns {Object} { sensorData, history, connectionStatus, isSimulated }
 */
export function useSensorData({
  socketUrl = DEFAULT_SOCKET_URL,
  windowSize = 30,
  enableSimulation = true,
} = {}) {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isSimulated, setIsSimulated] = useState(false);
  const [sensorData, setSensorData] = useState({
    temperatureC: 24.6,
    pressureHpa: 1013.25,
    altitudeFt: 12450,
    rssiDBm: -68,
    snrDB: 14.2,
    frequencyMhz: 440.920,
    batteryPct: 94,
    time: new Date().toLocaleTimeString(),
  });

  const [history, setHistory] = useState(() => {
    const initial = [];
    const now = Date.now();
    for (let i = windowSize; i >= 0; i--) {
      const t = new Date(now - i * 1000).toLocaleTimeString();
      initial.push({
        time: t,
        temperatureC: +(24 + Math.sin(i * 0.2) * 1.5).toFixed(1),
        pressureHpa: +(1013.25 + Math.cos(i * 0.1) * 2.1).toFixed(2),
        rssiDBm: Math.round(-68 + Math.sin(i * 0.3) * 6),
      });
    }
    return initial;
  });

  const socketRef = useRef(null);

  useEffect(() => {
    let socket = null;
    let simTimer = null;

    try {
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 5000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnectionStatus('connected');
        setIsSimulated(false);
        if (simTimer) clearInterval(simTimer);
      });

      socket.on('disconnect', () => {
        setConnectionStatus('disconnected');
      });

      socket.on('connect_error', () => {
        setConnectionStatus('offline');
        // If real socket is unreachable, start 1s simulation pulse to keep charts alive
        if (enableSimulation && !simTimer) {
          setIsSimulated(true);
        }
      });

      socket.on('telemetry:stream', (frame) => {
        if (!frame) return;

        const timeStr = frame.time || new Date().toLocaleTimeString();
        const formatted = {
          temperatureC: Number(frame.temperatureC) || 24.6,
          pressureHpa: Number(frame.pressureHpa) || (1013.25 - (Number(frame.altitudeFt) || 0) * 0.035),
          altitudeFt: Number(frame.altitudeFt) || 12450,
          rssiDBm: Number(frame.rssiDBm) || -68,
          snrDB: Number(frame.snrDB) || 14.2,
          frequencyMhz: 440.920,
          batteryPct: Number(frame.batteryPct) || 94,
          time: timeStr,
        };

        setSensorData(formatted);

        // Rolling sliding window buffer
        setHistory((prev) => {
          const next = [
            ...prev,
            {
              time: timeStr,
              temperatureC: +formatted.temperatureC.toFixed(1),
              pressureHpa: +formatted.pressureHpa.toFixed(2),
              rssiDBm: Math.round(formatted.rssiDBm),
            },
          ];
          return next.slice(-windowSize);
        });
      });
    } catch {
      setTimeout(() => setConnectionStatus('offline'), 0);
    }

    // 1-second fallback simulation generator if offline
    if (enableSimulation) {
      simTimer = setInterval(() => {
        setHistory((prev) => {
          const nowStr = new Date().toLocaleTimeString();
          const last = prev[prev.length - 1] || { temperatureC: 24.5, pressureHpa: 1013.2, rssiDBm: -68 };
          const newTemp = +(last.temperatureC + (Math.random() - 0.5) * 0.4).toFixed(1);
          const newPres = +(last.pressureHpa + (Math.random() - 0.5) * 0.6).toFixed(2);
          const newRssi = Math.round(Math.max(-95, Math.min(-50, last.rssiDBm + (Math.random() - 0.5) * 4)));

          const newPoint = {
            time: nowStr,
            temperatureC: Math.max(18, Math.min(32, newTemp)),
            pressureHpa: Math.max(990, Math.min(1030, newPres)),
            rssiDBm: newRssi,
          };

          setSensorData((prevData) => ({
            ...prevData,
            ...newPoint,
          }));

          return [...prev, newPoint].slice(-windowSize);
        });
      }, 1000);
    }

    // Canonical cleanup rule
    return () => {
      if (simTimer) clearInterval(simTimer);
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [socketUrl, windowSize, enableSimulation]);

  return {
    sensorData,
    history,
    connectionStatus,
    isSimulated,
  };
}

export default useSensorData;

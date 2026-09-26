// AeroSpace API Configuration
// Central configuration for Backend Express API on Render
export const VITE_API_URL = (import.meta.env.VITE_API_URL || 'https://aerospec-api.onrender.com').replace(/\/$/, '');
export const API_BASE = VITE_API_URL;

// CO5 Real-time WebSocket / Socket.io server endpoint
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'https://aerospec-api.onrender.com').replace(/\/$/, '');

export default VITE_API_URL;


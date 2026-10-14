/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/SignalDash.jsx",
  ],
  corePlugins: {
    preflight: false, // CRITICAL: Disables global CSS resets so existing pages (Home, UserDashboard, AdminDashboard) are 100% unaffected
  },
  theme: {
    extend: {},
  },
  plugins: [],
};

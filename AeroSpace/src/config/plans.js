// Centralized Subscription Plans Configuration (Single Source of Truth)

export const PLAN_CONFIG = {
  cadet: {
    id: 'cadet',
    name: 'Cadet (Free)',
    shortName: 'Cadet',
    price: '₹0/mo',
    priceAmount: 0,
    priceNum: 0,
    billingPeriod: 'month',
    maxPods: 2,
    pods: '2 Active Pods',
    dataRetentionDays: 7,
    retention: '7 Days History',
    desc: 'Default Starter Telemetry Research Tier',
    features: [
      'Up to 2 Active Telemetry Pods',
      '7 Days Telemetry History',
      'Basic 2.4 GHz RF Link',
      'Standard Community Support'
    ],
    themeColor: '#00f5ff'
  },
  orbital: {
    id: 'orbital',
    name: 'Orbital',
    shortName: 'Orbital',
    price: '₹130/mo',
    priceAmount: 130,
    priceNum: 130,
    billingPeriod: 'month',
    maxPods: 5,
    pods: '5 Active Pods',
    dataRetentionDays: 30,
    retention: '30 Days History',
    desc: 'Single-Pod & Regional LEO Orbit Tracking',
    features: [
      'Up to 5 Active Telemetry Pods',
      '30 Days Telemetry History',
      'Enhanced 433 MHz Sub-GHz Link',
      'Standard Ground Station Uplink'
    ],
    themeColor: '#38bdf8'
  },
  orbital_pro: {
    id: 'orbital_pro',
    name: 'Orbital Pro',
    shortName: 'Orbital Pro',
    price: '₹440/mo',
    priceAmount: 440,
    priceNum: 440,
    billingPeriod: 'month',
    maxPods: 15,
    pods: '15 Active Pods',
    dataRetentionDays: 90,
    retention: '90 Days High-Res History',
    desc: 'Commercial Constellation & Mission Telemetry',
    featured: true,
    features: [
      'Up to 15 Active Telemetry Pods',
      '90 Days High-Res Telemetry',
      'Sub-GHz & Dual-Band Transceiver',
      'Automated Mission Scheduling',
      'AES-256 Flight Encryption'
    ],
    themeColor: '#ff5722'
  },
  interstellar_max: {
    id: 'interstellar_max',
    name: 'Interstellar Max',
    shortName: 'Interstellar Max',
    price: '₹515/mo',
    priceAmount: 515,
    priceNum: 515,
    billingPeriod: 'month',
    maxPods: 999,
    pods: 'Unlimited Pods',
    dataRetentionDays: 365,
    retention: '365 Days Raw Telemetry Archiving',
    desc: 'Deep Space Constellation & Priority Relay',
    features: [
      'Unlimited Telemetry Pods',
      '365 Days Raw Telemetry Archiving',
      'Quantum-Safe GCM-512 Ciphers',
      'Real-Time Emergency Overrides',
      '24/7 Dedicated Ground Control'
    ],
    themeColor: '#a855f7'
  }
};

export const TIERS = PLAN_CONFIG;
export const PLAN_LIMITS = PLAN_CONFIG;

export function getPlanDetails(planTier) {
  if (!planTier) return PLAN_CONFIG.cadet;
  const key = planTier.toLowerCase().trim();
  return PLAN_CONFIG[key] || PLAN_CONFIG.cadet;
}

export function formatPlanPrice(planTier) {
  const plan = getPlanDetails(planTier);
  return plan.price;
}

export default PLAN_CONFIG;

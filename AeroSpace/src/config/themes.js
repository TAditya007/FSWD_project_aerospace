// Centralized Aerospace Theme System (8 Curated Themes)

export const THEMES = {
  'deep-space': {
    id: 'deep-space',
    name: 'Deep Space',
    category: 'Obsidian & Neon Cyan',
    accentColor: '#00f5ff',
    bgBase: '#020208',
    panelBg: 'rgba(10, 12, 22, 0.75)',
    borderGlow: 'rgba(0, 245, 255, 0.25)',
    glowColor: 'rgba(0, 245, 255, 0.4)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    spaceTint: 'rgba(0, 245, 255, 0.05)',
    earthAtmosphere: 0x00f5ff,
    badgeBg: 'rgba(0, 245, 255, 0.12)',
    badgeColor: '#00f5ff'
  },
  'orbital-cyan': {
    id: 'orbital-cyan',
    name: 'Orbital Cyan',
    category: 'Electric Cyan & Deep Navy',
    accentColor: '#38bdf8',
    bgBase: '#050c1e',
    panelBg: 'rgba(8, 20, 42, 0.8)',
    borderGlow: 'rgba(56, 189, 248, 0.28)',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    textPrimary: '#f0f9ff',
    textSecondary: '#7dd3fc',
    spaceTint: 'rgba(56, 189, 248, 0.07)',
    earthAtmosphere: 0x38bdf8,
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeColor: '#38bdf8'
  },
  'mars-mission': {
    id: 'mars-mission',
    name: 'Mars Mission',
    category: 'Crimson Rust & Amber Flare',
    accentColor: '#ff5722',
    bgBase: '#0c0504',
    panelBg: 'rgba(26, 11, 9, 0.8)',
    borderGlow: 'rgba(255, 87, 34, 0.3)',
    glowColor: 'rgba(255, 87, 34, 0.45)',
    textPrimary: '#ffedd6',
    textSecondary: '#fdba74',
    spaceTint: 'rgba(255, 87, 34, 0.06)',
    earthAtmosphere: 0xff5722,
    badgeBg: 'rgba(255, 87, 34, 0.15)',
    badgeColor: '#ff5722'
  },
  'lunar-command': {
    id: 'lunar-command',
    name: 'Lunar Command',
    category: 'Titanium Monochromatic HUD',
    accentColor: '#e2e8f0',
    bgBase: '#090b10',
    panelBg: 'rgba(18, 22, 30, 0.8)',
    borderGlow: 'rgba(226, 232, 240, 0.25)',
    glowColor: 'rgba(226, 232, 240, 0.35)',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    spaceTint: 'rgba(226, 232, 240, 0.04)',
    earthAtmosphere: 0x94a3b8,
    badgeBg: 'rgba(226, 232, 240, 0.12)',
    badgeColor: '#f1f5f9'
  },
  'aurora': {
    id: 'aurora',
    name: 'Aurora',
    category: 'Emerald Ion & Violet Nebula',
    accentColor: '#10b981',
    bgBase: '#020f0b',
    panelBg: 'rgba(4, 25, 18, 0.8)',
    borderGlow: 'rgba(16, 185, 129, 0.28)',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    textPrimary: '#ecfdf5',
    textSecondary: '#6ee7b7',
    spaceTint: 'rgba(16, 185, 129, 0.06)',
    earthAtmosphere: 0x10b981,
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeColor: '#34d399'
  },
  'solar-flare': {
    id: 'solar-flare',
    name: 'Solar Flare',
    category: 'Stellar Gold & Plasma Yellow',
    accentColor: '#f59e0b',
    bgBase: '#0f0a02',
    panelBg: 'rgba(28, 18, 4, 0.8)',
    borderGlow: 'rgba(245, 158, 11, 0.3)',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    textPrimary: '#fef3c7',
    textSecondary: '#fcd34d',
    spaceTint: 'rgba(245, 158, 11, 0.06)',
    earthAtmosphere: 0xf59e0b,
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeColor: '#fbbf24'
  },
  'midnight-control': {
    id: 'midnight-control',
    name: 'Midnight Control',
    category: 'Stealth Purple & Deep Indigo',
    accentColor: '#a855f7',
    bgBase: '#070414',
    panelBg: 'rgba(19, 10, 38, 0.8)',
    borderGlow: 'rgba(168, 85, 247, 0.28)',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    textPrimary: '#faf5ff',
    textSecondary: '#d8b4fe',
    spaceTint: 'rgba(168, 85, 247, 0.06)',
    earthAtmosphere: 0xa855f7,
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeColor: '#c084fc'
  },
  'arctic-station': {
    id: 'arctic-station',
    name: 'Arctic Station',
    category: 'Glacial Ice & Frost Cyan',
    accentColor: '#67e8f9',
    bgBase: '#030a12',
    panelBg: 'rgba(6, 20, 32, 0.8)',
    borderGlow: 'rgba(103, 232, 249, 0.28)',
    glowColor: 'rgba(103, 232, 249, 0.45)',
    textPrimary: '#ecfeff',
    textSecondary: '#a5f3fc',
    spaceTint: 'rgba(103, 232, 249, 0.06)',
    earthAtmosphere: 0x67e8f9,
    badgeBg: 'rgba(103, 232, 249, 0.15)',
    badgeColor: '#67e8f9'
  }
};

export const DEFAULT_THEME_ID = 'deep-space';

export function getTheme(themeId) {
  return THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
}

export function applyThemeToDOM(themeId) {
  const theme = getTheme(themeId);
  const root = document.documentElement;
  
  root.style.setProperty('--hud-accent', theme.accentColor);
  root.style.setProperty('--hud-bg', theme.bgBase);
  root.style.setProperty('--hud-panel-bg', theme.panelBg);
  root.style.setProperty('--hud-border-glow', theme.borderGlow);
  root.style.setProperty('--hud-glow-color', theme.glowColor);
  root.style.setProperty('--hud-text-primary', theme.textPrimary);
  root.style.setProperty('--hud-text-secondary', theme.textSecondary);
  root.style.setProperty('--hud-space-tint', theme.spaceTint);
  root.style.setProperty('--hud-badge-bg', theme.badgeBg);
  root.style.setProperty('--hud-badge-color', theme.badgeColor);
  
  document.body.setAttribute('data-theme', theme.id);
  return theme;
}

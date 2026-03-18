/**
 * NEXUS ATIP V2.0 - Core Configuration
 * Central configuration for the Autonomous Threat Intelligence Platform
 */

export const ATIP_CONFIG = {
  version: '2.0.0',
  platform: 'NEXUS ATIP',
  codename: 'AdriaBlueLabs',

  // Severity levels with colors
  severity: {
    critical: { color: '#dc2626', label: 'Critical', weight: 5 },
    high:     { color: '#ea580c', label: 'High',     weight: 4 },
    medium:   { color: '#f59e0b', label: 'Medium',   weight: 3 },
    low:      { color: '#84cc16', label: 'Low',      weight: 2 },
    info:     { color: '#0ea5e9', label: 'Info',      weight: 1 }
  },

  // TLP Classification
  tlp: {
    RED:   { color: '#dc2626', description: 'For named recipients only' },
    AMBER: { color: '#f59e0b', description: 'Limited distribution' },
    GREEN: { color: '#84cc16', description: 'Community-wide' },
    WHITE: { color: '#ffffff', description: 'Unlimited distribution' }
  },

  // MITRE ATT&CK v15 Tactics
  mitre: {
    tactics: [
      'Reconnaissance', 'Resource Development', 'Initial Access',
      'Execution', 'Persistence', 'Privilege Escalation',
      'Defense Evasion', 'Credential Access', 'Discovery',
      'Lateral Movement', 'Collection', 'Command and Control',
      'Exfiltration', 'Impact'
    ],
    version: '15.1'
  },

  // Data paths (relative to vite-app/)
  paths: {
    stix:      'data/stix',
    ioc:       'data/ioc',
    rules:     'data/rules',
    actors:    'data/actors',
    playbooks: 'data/playbooks',
    feeds:     'data/feeds'
  },

  // Module registry
  modules: [
    'dashboard', 'ingestion', 'knowledge', 'detection',
    'soar', 'malware', 'darkweb', 'prediction'
  ],

  // Refresh intervals (ms)
  intervals: {
    dashboard: 30000,
    feeds: 60000,
    detection: 120000,
    prediction: 300000
  },

  // Theme
  theme: {
    quantum: {
      blue:    '#00a8ff',
      purple:  '#7c3aed',
      teal:    '#14b8a6',
      indigo:  '#4f46e5',
      cyan:    '#06b6d4'
    },
    dark: {
      primary:   '#0a0a0f',
      secondary: '#12121a',
      tertiary:  '#1a1a25',
      surface:   '#22222f'
    }
  }
};

export default ATIP_CONFIG;

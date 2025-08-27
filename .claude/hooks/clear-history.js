#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const configPath = path.join('K:', 'PortableApps', 'Claude-Code', '.claude.json');

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Clear history for all projects
  if (config.projects) {
    for (const project in config.projects) {
      if (config.projects[project].history) {
        config.projects[project].history = [];
      }
    }
  }
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('[+] History cleared');
} catch (error) {
  console.error('[-] Failed to clear history:', error.message);
}
#!/usr/bin/env node
/**
 * Auto Cleanup Script
 * Runs on session end to clean up temporary files
 */

const fs = require('fs');
const path = require('path');

const ROOT = 'K:/PortableApps/genai';
const DRY_RUN = process.argv.includes('--dry-run');

// Cleanup configuration
const CONFIG = {
  debug: {
    path: path.join(ROOT, 'debug'),
    maxAgeDays: 30,
    pattern: /\.txt$/
  },
  shellSnapshots: {
    path: path.join(ROOT, 'shell-snapshots'),
    maxAgeDays: 60,
    pattern: /\.sh$/
  },
  temp: {
    path: path.join(ROOT, 'temp'),
    maxAgeDays: 7,
    excludePatterns: [/claude/, /scratchpad/]
  }
};

function log(msg, type = 'info') {
  const prefix = {
    info: '[*]',
    success: '[+]',
    warn: '[!]',
    error: '[-]'
  };
  console.log(`${prefix[type] || '[*]'} ${msg}`);
}

function getAgeDays(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const ageMs = Date.now() - stats.mtimeMs;
    return ageMs / (1000 * 60 * 60 * 24);
  } catch {
    return 0;
  }
}

function cleanupFolder(config) {
  if (!fs.existsSync(config.path)) {
    log(`Folder not found: ${config.path}`, 'warn');
    return { cleaned: 0, size: 0 };
  }

  let cleaned = 0;
  let totalSize = 0;

  try {
    const files = fs.readdirSync(config.path);

    for (const file of files) {
      const filePath = path.join(config.path, file);

      // Skip if excluded
      if (config.excludePatterns) {
        const excluded = config.excludePatterns.some(p => p.test(file));
        if (excluded) continue;
      }

      // Check pattern
      if (config.pattern && !config.pattern.test(file)) continue;

      // Check age
      const ageDays = getAgeDays(filePath);
      if (ageDays < config.maxAgeDays) continue;

      // Get file size
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;

          if (DRY_RUN) {
            log(`Would delete: ${file} (${Math.round(ageDays)} days old)`, 'info');
          } else {
            fs.unlinkSync(filePath);
          }
          cleaned++;
        }
      } catch (e) {
        log(`Failed to process: ${file}`, 'error');
      }
    }
  } catch (e) {
    log(`Error reading folder: ${config.path}`, 'error');
  }

  return { cleaned, size: totalSize };
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function main() {
  log('Auto Cleanup Starting...', 'info');

  if (DRY_RUN) {
    log('DRY RUN MODE - No files will be deleted', 'warn');
  }

  let totalCleaned = 0;
  let totalSize = 0;

  // Clean debug folder (30+ days)
  log('Cleaning debug folder (30+ days)...', 'info');
  const debugResult = cleanupFolder(CONFIG.debug);
  totalCleaned += debugResult.cleaned;
  totalSize += debugResult.size;

  // Clean shell-snapshots (60+ days)
  log('Cleaning shell-snapshots (60+ days)...', 'info');
  const snapshotResult = cleanupFolder(CONFIG.shellSnapshots);
  totalCleaned += snapshotResult.cleaned;
  totalSize += snapshotResult.size;

  // Summary
  log('', 'info');
  log('=== Cleanup Summary ===', 'info');
  log(`Files cleaned: ${totalCleaned}`, 'success');
  log(`Space freed: ${formatBytes(totalSize)}`, 'success');

  if (DRY_RUN) {
    log('Run without --dry-run to actually delete files', 'warn');
  }
}

main();

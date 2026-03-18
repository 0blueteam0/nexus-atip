#!/usr/bin/env node
// Fix remaining single-backslash paths missed by main migration script
const fs = require('fs');
const path = require('path');

const ROOT = 'K:/PortableApps/Claude-Code';
const FIND = 'Claude-Code';
const REPLACE = 'genai';

// Only process these dirs (remaining references)
const TARGET_DIRS = [
  'documentation', 'plans', 'planning-system/snapshots',
  'backups', 'data', '_SYSTEM', 'paste-cache',
];

const SKIP_DIRS = new Set(['node_modules', '.git', '.cursor', '.cargo', 'tools']);
const BINARY_EXT = new Set(['.exe','.dll','.zip','.tar','.gz','.png','.jpg','.db','.sqlite','.pdf']);

let modified = 0, replacements = 0;

function processFile(fp) {
  const ext = path.extname(fp).toLowerCase();
  if (BINARY_EXT.has(ext)) return;
  try {
    const content = fs.readFileSync(fp, 'utf8');
    // Only replace path references (K:\PortableApps\Claude-Code or K:/PortableApps/Claude-Code)
    if (!content.includes('PortableApps') || !content.includes(FIND)) return;

    let newContent = content;
    // Single backslash: K:\PortableApps\Claude-Code
    const pat1 = 'K:\\PortableApps\\genai';
    const rep1 = 'K:\\PortableApps\\genai';
    // Forward slash (shouldn't be many left but just in case)
    const pat2 = 'K:/PortableApps/Claude-Code';
    const rep2 = 'K:/PortableApps/genai';
    // MSYS path
    const pat3 = '/k/PortableApps/Claude-Code';
    const rep3 = '/k/PortableApps/genai';
    // Hyphenated
    const pat4 = 'K--PortableApps-Claude-Code';
    const rep4 = 'K--PortableApps-genai';

    for (const [f, r] of [[pat1, rep1], [pat2, rep2], [pat3, rep3], [pat4, rep4]]) {
      const count = newContent.split(f).length - 1;
      if (count > 0) {
        newContent = newContent.split(f).join(r);
        replacements += count;
      }
    }

    if (newContent !== content) {
      fs.writeFileSync(fp, newContent, 'utf8');
      modified++;
      const rel = path.relative(ROOT, fp).replace(/\\/g, '/');
      console.log(`  [+] ${rel}`);
    }
  } catch (e) { /* skip */ }
}

function walk(dir) {
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(full);
      } else {
        processFile(full);
      }
    }
  } catch (e) { /* skip */ }
}

console.log('[*] Fixing remaining single-backslash paths...');
for (const d of TARGET_DIRS) {
  const full = path.join(ROOT, d);
  if (fs.existsSync(full)) walk(full);
}

console.log(`\n[+] Fixed: ${modified} files, ${replacements} replacements`);

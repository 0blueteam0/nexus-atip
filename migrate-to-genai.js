#!/usr/bin/env node
// migrate-to-genai.js - Claude-Code to genai folder rename migration
// Replaces all path references in text files before the actual folder rename

const fs = require('fs');
const path = require('path');

const ROOT = 'K:/PortableApps/genai';

// Replacement patterns (order matters - longest/most specific first)
const REPLACEMENTS = [
  // Pattern 1: Windows backslash with trailing backslash
  ['K:\\\\PortableApps\\\\Claude-Code\\\\', 'K:\\\\PortableApps\\\\genai\\\\'],
  // Pattern 2: Windows backslash without trailing
  ['K:\\\\PortableApps\\\\Claude-Code', 'K:\\\\PortableApps\\\\genai'],
  // Pattern 3: Forward slash with trailing slash
  ['K:/PortableApps/genai/', 'K:/PortableApps/genai/'],
  // Pattern 4: Forward slash without trailing
  ['K:/PortableApps/genai', 'K:/PortableApps/genai'],
  // Pattern 5: MSYS/Unix mount path
  ['/k/PortableApps/genai', '/k/PortableApps/genai'],
  // Pattern 6: UNC-style path
  ['//k/PortableApps/genai', '//k/PortableApps/genai'],
  // Pattern 7: Hyphenated project folder reference
  ['K--PortableApps-genai', 'K--PortableApps-genai'],
];

// Also handle single-backslash Windows paths (in .bat files, etc.)
const BAT_REPLACEMENTS = [
  ['K:\\PortableApps\\genai\\', 'K:\\PortableApps\\genai\\'],
  ['K:\\PortableApps\\genai', 'K:\\PortableApps\\genai'],
];

// File extensions to process
const TEXT_EXTENSIONS = new Set([
  '.json', '.js', '.ts', '.md', '.yml', '.yaml', '.bat', '.cmd',
  '.sh', '.bash', '.ps1', '.toml', '.cfg', '.ini', '.txt', '.html',
  '.css', '.env', '.bashrc', '.npmrc', '.gitignore', '.gitconfig',
]);

// Files with no extension to check
const NAMED_FILES = new Set([
  '.bashrc', '.npmrc', '.gitconfig', '.gitignore',
]);

// Directories to skip entirely
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.cursor', 'shell-snapshots', 'debug',
  '.cargo', 'tools',
]);

// Specific subdirectories to skip
const SKIP_PATHS = [
  'mcp-servers/firecrawl-self-hosted/',
  'mcp-servers/searxng-crawl4ai-mcp/',
  'mcp-servers/n8n/data/',
  'mcp-servers/firecrawl-simple/',
];

// Binary extensions to never touch
const BINARY_EXTENSIONS = new Set([
  '.exe', '.dll', '.zip', '.tar', '.gz', '.rar', '.7z', '.png',
  '.jpg', '.jpeg', '.gif', '.ico', '.bmp', '.svg', '.webp',
  '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.db', '.sqlite',
  '.sqlite3', '.lock', '.vhdx', '.mp4', '.mov', '.avi',
]);

let stats = {
  filesScanned: 0,
  filesModified: 0,
  totalReplacements: 0,
  errors: [],
  modifiedFiles: [],
};

function shouldSkipDir(dirName, fullPath) {
  if (SKIP_DIRS.has(dirName)) return true;
  const rel = path.relative(ROOT, fullPath).replace(/\\/g, '/');
  for (const sp of SKIP_PATHS) {
    if (rel.startsWith(sp)) return true;
  }
  return false;
}

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);

  if (BINARY_EXTENSIONS.has(ext)) return false;
  if (TEXT_EXTENSIONS.has(ext)) return true;
  if (NAMED_FILES.has(basename)) return true;

  // No extension - check if it's a text file by name
  if (ext === '' && !basename.startsWith('.')) return false;
  if (ext === '' && basename.startsWith('.')) return true;

  return false;
}

function processFile(filePath) {
  stats.filesScanned++;

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    let fileReplacements = 0;
    const isBat = filePath.endsWith('.bat') || filePath.endsWith('.cmd');

    // Apply standard replacements (double-backslash, forward-slash, etc.)
    for (const [find, replace] of REPLACEMENTS) {
      const count = content.split(find).length - 1;
      if (count > 0) {
        content = content.split(find).join(replace);
        fileReplacements += count;
      }
    }

    // For .bat/.cmd files, also handle single-backslash paths
    // But only if they weren't already caught by double-backslash patterns
    if (isBat) {
      for (const [find, replace] of BAT_REPLACEMENTS) {
        const count = content.split(find).length - 1;
        if (count > 0) {
          content = content.split(find).join(replace);
          fileReplacements += count;
        }
      }
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesModified++;
      stats.totalReplacements += fileReplacements;
      const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
      stats.modifiedFiles.push({ file: rel, replacements: fileReplacements });
    }
  } catch (err) {
    if (err.code === 'EISDIR') return;
    stats.errors.push({ file: filePath, error: err.message });
  }
}

function walkDir(dirPath) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    stats.errors.push({ file: dirPath, error: err.message });
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!shouldSkipDir(entry.name, fullPath)) {
        walkDir(fullPath);
      }
    } else if (entry.isFile()) {
      if (shouldProcessFile(fullPath)) {
        processFile(fullPath);
      }
    }
  }
}

// Main execution
console.log('[*] migrate-to-genai.js - Starting migration...');
console.log(`[*] Root: ${ROOT}`);
console.log(`[*] Skip dirs: ${[...SKIP_DIRS].join(', ')}`);
console.log('');

const startTime = Date.now();
walkDir(ROOT);
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

console.log('=== Migration Results ===');
console.log(`[+] Files scanned:   ${stats.filesScanned}`);
console.log(`[+] Files modified:  ${stats.filesModified}`);
console.log(`[+] Replacements:    ${stats.totalReplacements}`);
console.log(`[+] Time:            ${elapsed}s`);
console.log('');

if (stats.modifiedFiles.length > 0) {
  console.log('--- Modified Files ---');
  for (const { file, replacements } of stats.modifiedFiles) {
    console.log(`  [+] ${file} (${replacements} replacements)`);
  }
}

if (stats.errors.length > 0) {
  console.log('');
  console.log('--- Errors ---');
  for (const { file, error } of stats.errors) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    console.log(`  [-] ${rel}: ${error}`);
  }
}

console.log('');
console.log('[+] Migration complete. Next steps:');
console.log('    1. Exit Claude Code session');
console.log('    2. Run: cd K:\\PortableApps && ren Claude-Code genai');
console.log('    3. Run: cd K:\\PortableApps\\genai\\projects && ren K--PortableApps-genai K--PortableApps-genai');
console.log('    4. Launch genai\\claude.bat');

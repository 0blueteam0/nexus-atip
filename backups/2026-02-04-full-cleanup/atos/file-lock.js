/**
 * File Lock Utility - Atomic File Operations
 * 
 * Purpose: Prevent "File has been unexpectedly modified" errors
 * Uses: proper-lockfile npm package for cross-platform file locking
 * 
 * @module atos/file-lock
 */

const fs = require('fs');
const path = require('path');
let lockfile;

// Lazy load proper-lockfile to handle missing dependency gracefully
function getLockfile() {
  if (!lockfile) {
    try {
      lockfile = require('proper-lockfile');
    } catch (err) {
      console.error('[!] proper-lockfile not installed. Run: npm install proper-lockfile');
      return null;
    }
  }
  return lockfile;
}

// Default lock options
const DEFAULT_LOCK_OPTIONS = {
  stale: 10000,      // 10s - consider lock stale after this time
  retries: {
    retries: 5,
    factor: 2,
    minTimeout: 100,
    maxTimeout: 1000,
    randomize: true
  },
  realpath: false    // Don't resolve symlinks (K drive compatibility)
};

/**
 * Acquire a lock on a file
 * @param {string} filePath - Path to the file to lock
 * @param {object} options - Lock options
 * @returns {Promise<Function>} - Release function
 */
async function acquireLock(filePath, options = {}) {
  const lf = getLockfile();
  if (!lf) {
    // Fallback: return no-op release function if lockfile unavailable
    return async () => {};
  }

  const lockOptions = { ...DEFAULT_LOCK_OPTIONS, ...options };
  
  try {
    const release = await lf.lock(filePath, lockOptions);
    return release;
  } catch (err) {
    if (err.code === 'ELOCKED') {
      throw new Error(`[LOCKED] File is locked by another process: ${filePath}`);
    }
    throw err;
  }
}

/**
 * Check if a file is currently locked
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>}
 */
async function isLocked(filePath) {
  const lf = getLockfile();
  if (!lf) return false;

  try {
    return await lf.check(filePath, { realpath: false });
  } catch (err) {
    return false;
  }
}

/**
 * Read file with lock protection
 * @param {string} filePath - File to read
 * @param {string} encoding - File encoding (default: utf8)
 * @returns {Promise<string>} - File contents
 */
async function readFileWithLock(filePath, encoding = 'utf8') {
  const release = await acquireLock(filePath);
  try {
    const content = fs.readFileSync(filePath, encoding);
    return content;
  } finally {
    await release();
  }
}

/**
 * Write file with lock protection (atomic)
 * @param {string} filePath - File to write
 * @param {string} content - Content to write
 * @param {object} options - Write options
 * @returns {Promise<void>}
 */
async function writeFileWithLock(filePath, content, options = {}) {
  // Ensure parent directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create file if it doesn't exist (lockfile requires existing file)
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '');
  }

  const release = await acquireLock(filePath);
  try {
    // Write to temp file first, then rename (atomic)
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, content, options);
    
    // Atomic rename
    fs.renameSync(tempPath, filePath);
  } finally {
    await release();
  }
}

/**
 * Read JSON file with lock protection
 * @param {string} filePath - JSON file to read
 * @param {*} defaultValue - Default value if file doesn't exist
 * @returns {Promise<*>} - Parsed JSON
 */
async function readJSONWithLock(filePath, defaultValue = null) {
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }

  const content = await readFileWithLock(filePath);
  try {
    return JSON.parse(content);
  } catch (err) {
    console.error(`[!] JSON parse error: ${filePath}`);
    return defaultValue;
  }
}

/**
 * Write JSON file with lock protection (atomic)
 * @param {string} filePath - JSON file to write
 * @param {*} data - Data to serialize
 * @param {number} indent - JSON indentation (default: 2)
 * @returns {Promise<void>}
 */
async function writeJSONWithLock(filePath, data, indent = 2) {
  const content = JSON.stringify(data, null, indent);
  await writeFileWithLock(filePath, content);
}

/**
 * Execute a function with exclusive file lock
 * @param {string} filePath - File to lock
 * @param {Function} fn - Function to execute while locked
 * @returns {Promise<*>} - Function result
 */
async function withLock(filePath, fn) {
  const release = await acquireLock(filePath);
  try {
    return await fn();
  } finally {
    await release();
  }
}

/**
 * Execute a function with multiple file locks (deadlock prevention via sorted order)
 * @param {Array<string>} filePaths - Files to lock
 * @param {Function} fn - Function to execute while locked
 * @returns {Promise<*>} - Function result
 */
async function withMultiLock(filePaths, fn) {
  if (!filePaths || filePaths.length === 0) {
    return await fn();
  }

  // Sort paths to prevent deadlocks (consistent ordering)
  const sorted = [...filePaths].sort();
  const releases = [];

  try {
    // Acquire locks in sorted order
    for (const fp of sorted) {
      const release = await acquireLock(fp);
      releases.push(release);
    }

    // Execute function with all locks held
    return await fn();
  } finally {
    // Release locks in reverse order
    for (let i = releases.length - 1; i >= 0; i--) {
      try {
        await releases[i]();
      } catch (e) {
        console.error(`[!] Error releasing lock: ${e.message}`);
      }
    }
  }
}

/**
 * Modify JSON file atomically
 * @param {string} filePath - JSON file path
 * @param {Function} modifier - Function that receives current data and returns modified data
 * @param {*} defaultValue - Default value if file doesn't exist
 * @returns {Promise<*>} - Modified data
 */
async function modifyJSONWithLock(filePath, modifier, defaultValue = {}) {
  return await withLock(filePath, async () => {
    // Read current data
    let data = defaultValue;
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        data = JSON.parse(content);
      } catch (err) {
        console.error(`[!] JSON read error, using default: ${filePath}`);
      }
    }

    // Apply modification
    const modified = await modifier(data);

    // Write back atomically
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(modified, null, 2));
    fs.renameSync(tempPath, filePath);

    return modified;
  });
}

// Module exports
module.exports = {
  acquireLock,
  isLocked,
  readFileWithLock,
  writeFileWithLock,
  readJSONWithLock,
  writeJSONWithLock,
  withLock,
  withMultiLock,
  modifyJSONWithLock,
  DEFAULT_LOCK_OPTIONS
};

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const filePath = args[1];

  async function main() {
    switch (command) {
      case 'check':
        if (!filePath) {
          console.log('Usage: node file-lock.js check <filepath>');
          return;
        }
        const locked = await isLocked(filePath);
        console.log(`[${locked ? 'LOCKED' : 'FREE'}] ${filePath}`);
        break;

      case 'test':
        console.log('[*] Testing file-lock utility...');
        const testFile = path.join(__dirname, 'test-lock.tmp');
        
        try {
          // Test write
          await writeJSONWithLock(testFile, { test: true, time: Date.now() });
          console.log('[+] Write test passed');
          
          // Test read
          const data = await readJSONWithLock(testFile);
          console.log('[+] Read test passed:', data);
          
          // Test modify
          await modifyJSONWithLock(testFile, (d) => ({ ...d, modified: true }));
          console.log('[+] Modify test passed');
          
          // Cleanup
          fs.unlinkSync(testFile);
          console.log('[+] All tests passed!');
        } catch (err) {
          console.error('[-] Test failed:', err.message);
        }
        break;

      default:
        console.log(`
File Lock Utility
=================
Usage: node file-lock.js <command> [args]

Commands:
  check <filepath>    Check if a file is locked
  test                Run self-test

API:
  acquireLock(path)           Get exclusive lock (returns release fn)
  readFileWithLock(path)      Read file with lock
  writeFileWithLock(path, content)  Write file atomically
  readJSONWithLock(path)      Read JSON with lock
  writeJSONWithLock(path, data)     Write JSON atomically
  modifyJSONWithLock(path, fn)      Modify JSON atomically
  withLock(path, fn)          Execute function with lock
`);
    }
  }

  main().catch(err => console.error('[-] Error:', err.message));
}

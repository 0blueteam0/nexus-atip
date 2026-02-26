/**
 * NEXUS AI Files Adapter
 *
 * File-based storage backbone using .ai/ directory convention.
 * Primary store for portable data that survives without SQLite.
 *
 * @module nexus/store/ai-files-adapter
 */

'use strict';

const fs = require('fs');
const path = require('path');

const AI_DIR = path.resolve(__dirname, '..', '..', '.ai');

class AiFilesAdapter {
  constructor(options = {}) {
    this.baseDir = options.baseDir || AI_DIR;
  }

  /**
   * Read a file from .ai/ directory
   * @param {string} relativePath - Path relative to .ai/
   * @returns {string|null} File contents
   */
  read(relativePath) {
    const fp = path.join(this.baseDir, relativePath);
    try {
      if (fs.existsSync(fp)) {
        return fs.readFileSync(fp, 'utf-8');
      }
    } catch (e) { /* skip */ }
    return null;
  }

  /**
   * Read JSON from .ai/ directory
   * @param {string} relativePath
   * @returns {Object|null}
   */
  readJson(relativePath) {
    const content = this.read(relativePath);
    if (!content) return null;
    try {
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }

  /**
   * Write a file to .ai/ directory
   * @param {string} relativePath
   * @param {string} content
   */
  write(relativePath, content) {
    const fp = path.join(this.baseDir, relativePath);
    const dir = path.dirname(fp);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fp, content, 'utf-8');
  }

  /**
   * Write JSON to .ai/ directory
   * @param {string} relativePath
   * @param {Object} data
   */
  writeJson(relativePath, data) {
    this.write(relativePath, JSON.stringify(data, null, 2));
  }

  /**
   * List files in an .ai/ subdirectory
   * @param {string} relativePath
   * @returns {string[]} File names
   */
  list(relativePath) {
    const fp = path.join(this.baseDir, relativePath);
    try {
      if (fs.existsSync(fp)) {
        return fs.readdirSync(fp).filter(f => !f.startsWith('.'));
      }
    } catch (e) { /* skip */ }
    return [];
  }

  /**
   * Check if a file exists
   * @param {string} relativePath
   * @returns {boolean}
   */
  exists(relativePath) {
    return fs.existsSync(path.join(this.baseDir, relativePath));
  }

  /**
   * Delete a file
   * @param {string} relativePath
   */
  remove(relativePath) {
    const fp = path.join(this.baseDir, relativePath);
    try {
      if (fs.existsSync(fp)) {
        fs.unlinkSync(fp);
      }
    } catch (e) { /* skip */ }
  }

  /**
   * Get directory stats
   * @returns {Object}
   */
  getStats() {
    const stats = { directories: 0, files: 0, totalSize: 0 };

    const walk = (dir) => {
      try {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            stats.directories++;
            walk(path.join(dir, entry.name));
          } else {
            stats.files++;
            try {
              stats.totalSize += fs.statSync(path.join(dir, entry.name)).size;
            } catch (e) { /* skip */ }
          }
        }
      } catch (e) { /* skip */ }
    };

    walk(this.baseDir);
    return stats;
  }
}

module.exports = { AiFilesAdapter };

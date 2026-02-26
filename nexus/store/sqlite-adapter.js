/**
 * NEXUS SQLite Adapter
 *
 * Lightweight SQLite storage using better-sqlite3 or sql.js fallback.
 * Provides CRUD for 7 domain tables defined in schema.sql.
 * Portable: works on K-drive without system dependencies.
 *
 * @module nexus/store/sqlite-adapter
 */

'use strict';

const fs = require('fs');
const path = require('path');

const STORE_DIR = path.join(__dirname);
const DB_PATH = path.join(STORE_DIR, 'nexus.db');
const SCHEMA_PATH = path.join(STORE_DIR, 'schema.sql');

class SqliteAdapter {
  constructor(options = {}) {
    this.dbPath = options.dbPath || DB_PATH;
    this.db = null;
    this.ready = false;
    this.useJson = options.useJson !== false; // Fallback to JSON files if SQLite unavailable
    this.jsonStorePath = path.join(STORE_DIR, 'json-store');
  }

  /**
   * Initialize database connection
   * @returns {boolean} Success
   */
  async init() {
    // Try to load better-sqlite3 (preferred)
    try {
      const Database = require('better-sqlite3');
      this.db = new Database(this.dbPath);
      this._runSchema();
      this.ready = true;
      return true;
    } catch (e) {
      // better-sqlite3 not available
    }

    // Try sql.js (WASM fallback)
    try {
      const initSqlJs = require('sql.js');
      const SQL = await initSqlJs();

      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(buffer);
      } else {
        this.db = new SQL.Database();
      }
      this._runSchema();
      this.ready = true;
      return true;
    } catch (e) {
      // sql.js not available either
    }

    // Fallback: JSON file store
    if (this.useJson) {
      if (!fs.existsSync(this.jsonStorePath)) {
        fs.mkdirSync(this.jsonStorePath, { recursive: true });
      }
      this.ready = true;
      return true;
    }

    return false;
  }

  /**
   * Insert a record into a table
   * @param {string} table - Table name
   * @param {Object} data - Column-value pairs
   * @returns {Object} Inserted data
   */
  insert(table, data) {
    if (!this.ready) throw new Error('SQLite adapter not initialized');

    if (this.db) {
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(c => {
        const v = data[c];
        return typeof v === 'object' ? JSON.stringify(v) : v;
      });

      const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      this._exec(sql, values);
    } else {
      // JSON fallback
      const store = this._jsonLoad(table);
      store.push({ ...data, _insertedAt: new Date().toISOString() });
      this._jsonSave(table, store);
    }

    return data;
  }

  /**
   * Query records from a table
   * @param {string} table - Table name
   * @param {Object} where - Simple equality conditions
   * @param {Object} options - { limit, orderBy }
   * @returns {Array} Results
   */
  query(table, where = {}, options = {}) {
    if (!this.ready) throw new Error('SQLite adapter not initialized');

    if (this.db) {
      const conditions = Object.keys(where);
      let sql = `SELECT * FROM ${table}`;

      if (conditions.length > 0) {
        const clauses = conditions.map(c => `${c} = ?`).join(' AND ');
        sql += ` WHERE ${clauses}`;
      }

      if (options.orderBy) sql += ` ORDER BY ${options.orderBy}`;
      if (options.limit) sql += ` LIMIT ${options.limit}`;

      const values = conditions.map(c => where[c]);
      return this._queryAll(sql, values);
    } else {
      // JSON fallback
      let store = this._jsonLoad(table);
      for (const [k, v] of Object.entries(where)) {
        store = store.filter(r => r[k] === v);
      }
      if (options.limit) store = store.slice(0, options.limit);
      return store;
    }
  }

  /**
   * Update records
   * @param {string} table
   * @param {Object} set - Values to update
   * @param {Object} where - Conditions
   */
  update(table, set, where = {}) {
    if (!this.ready) throw new Error('SQLite adapter not initialized');

    if (this.db) {
      const setClauses = Object.keys(set).map(c => `${c} = ?`).join(', ');
      const conditions = Object.keys(where).map(c => `${c} = ?`).join(' AND ');
      const values = [
        ...Object.values(set).map(v => typeof v === 'object' ? JSON.stringify(v) : v),
        ...Object.values(where)
      ];

      let sql = `UPDATE ${table} SET ${setClauses}`;
      if (conditions) sql += ` WHERE ${conditions}`;
      this._exec(sql, values);
    } else {
      // JSON fallback
      const store = this._jsonLoad(table);
      for (const record of store) {
        const match = Object.entries(where).every(([k, v]) => record[k] === v);
        if (match) {
          Object.assign(record, set);
        }
      }
      this._jsonSave(table, store);
    }
  }

  /**
   * Delete records
   * @param {string} table
   * @param {Object} where
   */
  delete(table, where = {}) {
    if (!this.ready) throw new Error('SQLite adapter not initialized');

    if (this.db) {
      const conditions = Object.keys(where).map(c => `${c} = ?`).join(' AND ');
      const values = Object.values(where);
      let sql = `DELETE FROM ${table}`;
      if (conditions) sql += ` WHERE ${conditions}`;
      this._exec(sql, values);
    } else {
      let store = this._jsonLoad(table);
      store = store.filter(r =>
        !Object.entries(where).every(([k, v]) => r[k] === v)
      );
      this._jsonSave(table, store);
    }
  }

  /**
   * Get table row count
   * @param {string} table
   * @returns {number}
   */
  count(table) {
    if (this.db) {
      const result = this._queryAll(`SELECT COUNT(*) as count FROM ${table}`);
      return result[0]?.count || 0;
    }
    return this._jsonLoad(table).length;
  }

  /**
   * Persist sql.js database to disk
   */
  persist() {
    if (this.db && this.db.export) {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    }
  }

  /**
   * Close database
   */
  close() {
    if (this.db) {
      this.persist();
      if (this.db.close) this.db.close();
      this.db = null;
    }
    this.ready = false;
  }

  // Internal helpers
  _runSchema() {
    if (!this.db) return;
    try {
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
      if (this.db.exec) {
        this.db.exec(schema); // sql.js
      } else if (this.db.pragma) {
        this.db.exec(schema); // better-sqlite3
      }
    } catch (e) {
      // Schema may already exist
    }
  }

  _exec(sql, params = []) {
    if (this.db.run) {
      // sql.js
      this.db.run(sql, params);
    } else if (this.db.prepare) {
      // better-sqlite3
      this.db.prepare(sql).run(...params);
    }
  }

  _queryAll(sql, params = []) {
    if (this.db.exec) {
      // sql.js
      const results = this.db.exec(sql, params);
      if (results.length === 0) return [];
      const columns = results[0].columns;
      return results[0].values.map(row => {
        const obj = {};
        columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
    } else if (this.db.prepare) {
      // better-sqlite3
      return this.db.prepare(sql).all(...params);
    }
    return [];
  }

  _jsonLoad(table) {
    const fp = path.join(this.jsonStorePath, `${table}.json`);
    try {
      if (fs.existsSync(fp)) {
        return JSON.parse(fs.readFileSync(fp, 'utf-8'));
      }
    } catch (e) { /* skip */ }
    return [];
  }

  _jsonSave(table, data) {
    const fp = path.join(this.jsonStorePath, `${table}.json`);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf-8');
  }
}

module.exports = { SqliteAdapter };

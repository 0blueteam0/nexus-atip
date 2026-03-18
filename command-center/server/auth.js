/**
 * Auth Module (F Architecture Phase 4)
 *
 * 2-tier token auth: read + write.
 * Tokens loaded from env vars. Optional - skipped if not set.
 * CORS restriction to known local origins.
 *
 * Design: Claude + Codex merged (2-tier now, 3-tier compatible)
 */
'use strict';

const ALLOWED_ORIGINS = [
  'http://localhost:4000',  // Mission Control
  'http://localhost:4820',  // Agent Monitor
  'http://localhost:3847',  // Self (Observer)
  'null'                    // Electron file:// origin
];

class Auth {
  constructor() {
    this.readToken = process.env.OBSERVER_READ_TOKEN || null;
    this.writeToken = process.env.OBSERVER_WRITE_TOKEN || null;
    this.enforced = process.env.OBSERVER_ENV === 'prod';

    if (this.enforced && !this.writeToken) {
      console.warn('[Auth] WARNING: OBSERVER_ENV=prod but OBSERVER_WRITE_TOKEN not set');
    }
  }

  /**
   * CORS middleware - restrict to known local origins
   */
  corsMiddleware() {
    return (req, res, next) => {
      const origin = req.headers.origin;

      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin || '*');
      } else if (!this.enforced) {
        // Dev mode: allow all but warn
        res.header('Access-Control-Allow-Origin', origin);
      } else {
        return res.status(403).json({ error: 'origin not allowed' });
      }

      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Credentials', 'true');
      if (req.method === 'OPTIONS') return res.sendStatus(200);
      next();
    };
  }

  /**
   * Read-level auth middleware (GET endpoints)
   * If no tokens configured, allow all.
   */
  readAuth() {
    return (req, res, next) => {
      if (!this.readToken && !this.writeToken) return next();
      const token = this._extractToken(req);
      if (!token) return this.enforced ? res.status(401).json({ error: 'token required' }) : next();
      if (token === this.readToken || token === this.writeToken) return next();
      return res.status(403).json({ error: 'invalid token' });
    };
  }

  /**
   * Write-level auth middleware (POST/PATCH/DELETE endpoints)
   */
  writeAuth() {
    return (req, res, next) => {
      if (!this.writeToken) return next();
      const token = this._extractToken(req);
      if (!token) return this.enforced ? res.status(401).json({ error: 'token required' }) : next();
      if (token === this.writeToken) return next();
      return res.status(403).json({ error: 'write access denied' });
    };
  }

  /**
   * Validate WebSocket connection token
   * Returns scope: 'write' | 'read' | 'anonymous'
   */
  validateWsToken(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || this._extractTokenFromHeader(req.headers);

    if (!this.readToken && !this.writeToken) return 'anonymous';
    if (!token) return this.enforced ? null : 'anonymous';
    if (token === this.writeToken) return 'write';
    if (token === this.readToken) return 'read';
    return null; // Invalid token
  }

  /**
   * Route group classification (for future 3-tier expansion)
   */
  static classifyRoute(path, method) {
    // Write operations
    if (method !== 'GET' && (
      path.startsWith('/control/') ||
      path.startsWith('/evolution/') ||
      path.startsWith('/scheduler/') ||
      path.startsWith('/schedules') ||
      path.startsWith('/memory/sync') ||
      path.startsWith('/team/')
    )) return 'write';

    return 'read';
  }

  _extractToken(req) {
    return this._extractTokenFromHeader(req.headers) ||
           req.query?.token ||
           null;
  }

  _extractTokenFromHeader(headers) {
    const auth = headers?.authorization;
    if (!auth) return null;
    if (auth.startsWith('Bearer ')) return auth.slice(7);
    return auth;
  }
}

module.exports = { Auth, ALLOWED_ORIGINS };

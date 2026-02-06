/**
 * AI Stack Monitor Plugin Collector
 *
 * 호스트 AI Stack Monitor에서 데이터 수집 및 캐싱
 */

const http = require('http');

// 캐시 시스템
const cache = {
    data: {},
    timestamp: {}
};

const CACHE_TTL = {
    summary: 30000,      // 30초
    packages: 300000,    // 5분
    health: 10000        // 10초
};

const AI_STACK_HOST = process.env.AI_STACK_HOST || 'host.docker.internal';
const AI_STACK_PORT = process.env.AI_STACK_PORT || 13579;

function getCached(key, ttl) {
    if (cache.data[key] && (Date.now() - cache.timestamp[key]) < ttl) {
        return cache.data[key];
    }
    return null;
}

function setCache(key, data) {
    cache.data[key] = data;
    cache.timestamp[key] = Date.now();
}

async function fetchFromHost(endpoint, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const url = `http://${AI_STACK_HOST}:${AI_STACK_PORT}${endpoint}`;

        const req = http.get(url, { timeout }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(null);
                }
            });
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => {
            req.destroy();
            resolve(null);
        });
    });
}

/**
 * AI Stack 요약 데이터 수집
 */
async function collectSummary() {
    const cached = getCached('summary', CACHE_TTL.summary);
    if (cached) return cached;

    const data = await fetchFromHost('/api/all-status', 15000);
    if (data) {
        const summary = {
            packages: {
                npm: data.npm?.count || 0,
                python: data.python?.count || 0,
                global: data.global?.count || 0
            },
            mcp: {
                count: data.mcp?.count || 0,
                connected: data.mcp?.servers?.filter(s => s.status === 'connected').length || 0
            },
            timestamp: data.timestamp
        };
        setCache('summary', summary);
        return summary;
    }

    return { error: 'AI Stack Monitor not available' };
}

/**
 * 패키지 상세 데이터 수집
 */
async function collectPackages() {
    const cached = getCached('packages', CACHE_TTL.packages);
    if (cached) return cached;

    const data = await fetchFromHost('/api/all-status', 20000);
    if (data) {
        setCache('packages', data);
        return data;
    }

    return { npm: { packages: [] }, python: { packages: [] }, global: { packages: [] } };
}

/**
 * 서비스 헬스 데이터 수집
 */
async function collectHealth() {
    const cached = getCached('health', CACHE_TTL.health);
    if (cached) return cached;

    const data = await fetchFromHost('/api/services/health', 5000);
    if (data) {
        setCache('health', data);
        return data;
    }

    return { services: {}, error: 'unavailable' };
}

/**
 * 연결 상태 확인
 */
async function checkConnection() {
    try {
        const response = await fetchFromHost('/api/health', 3000);
        return {
            connected: !!response,
            host: `${AI_STACK_HOST}:${AI_STACK_PORT}`,
            timestamp: new Date().toISOString()
        };
    } catch {
        return {
            connected: false,
            host: `${AI_STACK_HOST}:${AI_STACK_PORT}`,
            error: 'Connection failed'
        };
    }
}

module.exports = {
    collectSummary,
    collectPackages,
    collectHealth,
    checkConnection,
    clearCache: () => {
        cache.data = {};
        cache.timestamp = {};
    }
};

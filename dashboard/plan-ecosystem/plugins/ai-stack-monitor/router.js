/**
 * AI Stack Monitor Plugin Router
 *
 * Plan Ecosystem에서 AI Stack Monitor 데이터를 프록시하는 라우터
 * Docker 환경에서 호스트의 AI Stack Monitor API를 호출하여
 * npm/pip 패키지 정보와 서비스 상태를 가져옵니다.
 */

const express = require('express');
const router = express.Router();
const http = require('http');

// AI Stack Monitor 호스트 서버 설정
// Docker에서 실행 시 host.docker.internal 사용
const AI_STACK_HOST = process.env.AI_STACK_HOST || 'host.docker.internal';
const AI_STACK_PORT = process.env.AI_STACK_PORT || 13579;
const AI_STACK_URL = `http://${AI_STACK_HOST}:${AI_STACK_PORT}`;

// 호스트 서버로 프록시 요청
function proxyToHost(endpoint, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, AI_STACK_URL);

        const req = http.get(url.toString(), { timeout }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ raw: data });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// 상태 체크 (플러그인 활성화 여부)
router.get('/status', async (req, res) => {
    try {
        const health = await proxyToHost('/api/health', 3000);
        res.json({
            plugin: 'ai-stack-monitor',
            status: 'connected',
            hostUrl: AI_STACK_URL,
            hostStatus: health
        });
    } catch (error) {
        res.json({
            plugin: 'ai-stack-monitor',
            status: 'disconnected',
            hostUrl: AI_STACK_URL,
            error: error.message,
            hint: 'AI Stack Monitor server (localhost:13579) is not running. Start it with: node dashboard/server.js'
        });
    }
});

// 전체 상태 요약
router.get('/all-status', async (req, res) => {
    try {
        const data = await proxyToHost('/api/all-status');
        res.json(data);
    } catch (error) {
        res.status(503).json({
            error: 'AI Stack Monitor not available',
            message: error.message,
            hint: 'Start AI Stack Monitor: node dashboard/server.js'
        });
    }
});

// MCP 서버 상태
router.get('/mcp-status', async (req, res) => {
    try {
        const data = await proxyToHost('/api/mcp-status');
        res.json(data);
    } catch (error) {
        res.status(503).json({
            error: 'MCP status not available',
            message: error.message
        });
    }
});

// npm 패키지 목록
router.get('/npm-packages', async (req, res) => {
    try {
        const data = await proxyToHost('/api/npm-packages', 15000);
        res.json(data);
    } catch (error) {
        res.status(503).json({
            error: 'npm packages not available',
            message: error.message
        });
    }
});

// Python 패키지 목록
router.get('/python-packages', async (req, res) => {
    try {
        const data = await proxyToHost('/api/python-packages', 15000);
        res.json(data);
    } catch (error) {
        res.status(503).json({
            error: 'Python packages not available',
            message: error.message
        });
    }
});

// Global npm 도구
router.get('/global-tools', async (req, res) => {
    try {
        const data = await proxyToHost('/api/global-tools', 15000);
        res.json(data);
    } catch (error) {
        res.status(503).json({
            error: 'Global tools not available',
            message: error.message
        });
    }
});

// 서비스 헬스체크
router.get('/services/health', async (req, res) => {
    try {
        const data = await proxyToHost('/api/services/health');
        res.json(data);
    } catch (error) {
        res.status(503).json({
            error: 'Service health not available',
            message: error.message
        });
    }
});

// 서비스 버전
router.get('/services/versions', async (req, res) => {
    try {
        const data = await proxyToHost('/api/services/versions', 20000);
        res.json(data);
    } catch (error) {
        res.status(503).json({
            error: 'Service versions not available',
            message: error.message
        });
    }
});

// 서비스 레지스트리
router.get('/service-registry', async (req, res) => {
    try {
        const data = await proxyToHost('/api/service-registry');
        res.json(data);
    } catch (error) {
        res.status(503).json({
            error: 'Service registry not available',
            message: error.message
        });
    }
});

// 서비스 시작 (프록시)
router.post('/services/:id/start', async (req, res) => {
    try {
        const url = `/api/services/${req.params.id}/start`;
        // POST 요청은 별도 처리 필요
        const http = require('http');
        const options = {
            hostname: AI_STACK_HOST,
            port: AI_STACK_PORT,
            path: url,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const proxyReq = http.request(options, (proxyRes) => {
            let data = '';
            proxyRes.on('data', chunk => data += chunk);
            proxyRes.on('end', () => {
                try {
                    res.json(JSON.parse(data));
                } catch (e) {
                    res.json({ raw: data });
                }
            });
        });

        proxyReq.on('error', (err) => {
            res.status(503).json({ error: err.message });
        });

        proxyReq.write(JSON.stringify(req.body));
        proxyReq.end();
    } catch (error) {
        res.status(503).json({
            error: 'Service start failed',
            message: error.message
        });
    }
});

// 대시보드용 통합 요약
router.get('/summary', async (req, res) => {
    try {
        // 여러 API 병렬 호출
        const [allStatus, health] = await Promise.allSettled([
            proxyToHost('/api/all-status', 15000),
            proxyToHost('/api/services/health', 5000)
        ]);

        const summary = {
            connected: true,
            timestamp: new Date().toISOString(),
            packages: {
                npm: allStatus.status === 'fulfilled' ? (allStatus.value.npm?.count || 0) : 0,
                python: allStatus.status === 'fulfilled' ? (allStatus.value.python?.count || 0) : 0,
                global: allStatus.status === 'fulfilled' ? (allStatus.value.global?.count || 0) : 0
            },
            mcp: {
                count: allStatus.status === 'fulfilled' ? (allStatus.value.mcp?.count || 0) : 0,
                servers: allStatus.status === 'fulfilled' ? (allStatus.value.mcp?.servers || []) : []
            },
            services: health.status === 'fulfilled' ? health.value : { error: 'unavailable' }
        };

        res.json(summary);
    } catch (error) {
        res.json({
            connected: false,
            error: error.message,
            hint: 'Start AI Stack Monitor: node dashboard/server.js'
        });
    }
});

module.exports = router;

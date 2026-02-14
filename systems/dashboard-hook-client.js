/**
 * Dashboard Hook Client - Node.js 기반 Hook 클라이언트
 *
 * Windows 환경에서 안정적인 Dashboard 통신 제공
 * curl 기반 hook 대체 (호환성 향상)
 *
 * 사용법:
 *   node dashboard-hook-client.js prompt "사용자 프롬프트"
 *   node dashboard-hook-client.js response
 *   node dashboard-hook-client.js session-start
 *   node dashboard-hook-client.js session-end
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 설정
const CONFIG = {
    hostname: 'localhost',
    port: 7847,
    timeout: 5000,  // 5초 타임아웃
    retries: 2
};

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/genai';
const LOG_FILE = path.join(BASE_PATH, 'data/hook-client.log');

/**
 * 로그 기록
 */
function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`;

    try {
        fs.appendFileSync(LOG_FILE, logEntry);
    } catch (e) {
        // 로그 실패 무시
    }

    if (level === 'ERROR') {
        console.error(`[!] ${message}`);
    }
}

/**
 * Dashboard API로 데이터 전송
 */
async function sendToDashboard(endpoint, data, retryCount = 0) {
    return new Promise((resolve) => {
        const postData = JSON.stringify(data);

        const options = {
            hostname: CONFIG.hostname,
            port: CONFIG.port,
            path: `/api/hooks/${endpoint}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: CONFIG.timeout
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    log('INFO', `Hook sent: ${endpoint}`, { status: res.statusCode });
                    resolve({ success: true, status: res.statusCode, body });
                } else {
                    log('WARN', `Hook failed: ${endpoint}`, { status: res.statusCode });
                    resolve({ success: false, status: res.statusCode, body });
                }
            });
        });

        req.on('error', (err) => {
            if (retryCount < CONFIG.retries) {
                log('WARN', `Retry ${retryCount + 1}/${CONFIG.retries}: ${endpoint}`);
                setTimeout(() => {
                    sendToDashboard(endpoint, data, retryCount + 1).then(resolve);
                }, 500);
            } else {
                log('ERROR', `Hook error: ${endpoint}`, { error: err.message });
                resolve({ success: false, error: err.message });
            }
        });

        req.on('timeout', () => {
            req.destroy();
            log('WARN', `Hook timeout: ${endpoint}`);
            resolve({ success: false, error: 'timeout' });
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Dashboard 상태 확인
 */
async function checkDashboard() {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: CONFIG.hostname,
            port: CONFIG.port,
            path: '/api/stats',
            method: 'GET',
            timeout: 2000
        }, (res) => {
            resolve(res.statusCode === 200);
        });

        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

/**
 * 프롬프트 기록
 */
async function recordPrompt(prompt, metadata = {}) {
    const data = {
        prompt: prompt,
        timestamp: new Date().toISOString(),
        sessionId: process.env.SESSION_ID || `session-${Date.now()}`,
        activePlan: process.env.ACTIVE_PLAN || null,
        cwd: process.cwd(),
        ...metadata
    };

    return sendToDashboard('prompt', data);
}

/**
 * 응답 완료 기록
 */
async function recordResponse(metadata = {}) {
    const data = {
        timestamp: new Date().toISOString(),
        sessionId: process.env.SESSION_ID || null,
        duration: parseInt(process.env.RESPONSE_DURATION || '0'),
        success: process.env.RESPONSE_SUCCESS !== 'false',
        toolsUsed: JSON.parse(process.env.TOOLS_USED || '[]'),
        ...metadata
    };

    return sendToDashboard('response', data);
}

/**
 * 세션 시작 기록
 */
async function recordSessionStart(metadata = {}) {
    const data = {
        sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        startedAt: new Date().toISOString(),
        source: process.env.SESSION_SOURCE || 'cli',
        model: process.env.MODEL || 'unknown',
        cwd: process.cwd(),
        ...metadata
    };

    // 세션 ID를 환경변수로 내보내기 (후속 호출용)
    console.log(`SESSION_ID=${data.sessionId}`);

    return sendToDashboard('session-start', data);
}

/**
 * 세션 종료 기록
 */
async function recordSessionEnd(metadata = {}) {
    const data = {
        sessionId: process.env.SESSION_ID || null,
        endedAt: new Date().toISOString(),
        ...metadata
    };

    return sendToDashboard('session-end', data);
}

/**
 * 도구 사용 기록
 */
async function recordToolUse(toolName, toolInput, result = null) {
    const data = {
        tool: toolName,
        input: toolInput,
        result: result,
        timestamp: new Date().toISOString(),
        sessionId: process.env.SESSION_ID || null
    };

    return sendToDashboard('tool-use', data);
}

/**
 * 커스텀 이벤트 기록
 */
async function recordEvent(eventType, eventData) {
    const data = {
        type: eventType,
        data: eventData,
        timestamp: new Date().toISOString(),
        sessionId: process.env.SESSION_ID || null
    };

    return sendToDashboard('event', data);
}

/**
 * CLI 실행
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.log(`Dashboard Hook Client

Usage:
  node dashboard-hook-client.js <command> [args]

Commands:
  prompt <text>     Record user prompt
  response          Record response completion
  session-start     Record session start
  session-end       Record session end
  tool <name> <input>  Record tool usage
  event <type> <data>  Record custom event
  check             Check dashboard status

Environment Variables:
  SESSION_ID        Current session ID
  ACTIVE_PLAN       Active plan ID
  TOOLS_USED        JSON array of used tools
  RESPONSE_DURATION Response time in ms
  RESPONSE_SUCCESS  'true' or 'false'
`);
        process.exit(0);
    }

    // Dashboard 상태 확인
    const dashboardUp = await checkDashboard();
    if (!dashboardUp && command !== 'check') {
        log('WARN', 'Dashboard not available, skipping hook');
        process.exit(0);  // 실패해도 Claude Code 실행에 영향 없도록
    }

    let result;

    switch (command) {
        case 'prompt':
            result = await recordPrompt(args[1] || '');
            break;

        case 'response':
            result = await recordResponse();
            break;

        case 'session-start':
            result = await recordSessionStart();
            break;

        case 'session-end':
            result = await recordSessionEnd();
            break;

        case 'tool':
            result = await recordToolUse(args[1] || 'unknown', args[2] || '{}');
            break;

        case 'event':
            result = await recordEvent(args[1] || 'unknown', JSON.parse(args[2] || '{}'));
            break;

        case 'check':
            if (dashboardUp) {
                console.log('[+] Dashboard is running on localhost:7847');
                process.exit(0);
            } else {
                console.log('[-] Dashboard is not available');
                process.exit(1);
            }
            break;

        default:
            console.error(`Unknown command: ${command}`);
            process.exit(1);
    }

    if (result && result.success) {
        process.exit(0);
    } else {
        process.exit(0);  // Hook 실패해도 Claude Code 실행 계속
    }
}

// 직접 실행 시
if (require.main === module) {
    main().catch(err => {
        log('ERROR', 'Hook client error', { error: err.message });
        process.exit(0);  // 에러가 나도 Claude Code 실행에 영향 없도록
    });
}

// 모듈로 사용 시
module.exports = {
    sendToDashboard,
    checkDashboard,
    recordPrompt,
    recordResponse,
    recordSessionStart,
    recordSessionEnd,
    recordToolUse,
    recordEvent,
    CONFIG
};

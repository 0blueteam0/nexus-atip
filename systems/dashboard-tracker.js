/**
 * Dashboard Tracker - 도구/에이전트/프롬프트 실시간 기록
 * 
 * Plan Ecosystem Dashboard v2.0과 연동하여 모든 활동을 추적
 * 
 * 사용법:
 *   node dashboard-tracker.js tool <toolName> <success> <responseTime>
 *   node dashboard-tracker.js agent-start <type> <prompt>
 *   node dashboard-tracker.js agent-complete <agentId> <success>
 *   node dashboard-tracker.js prompt <prompt> [toolsUsed] [agentsSpawned]
 */

const http = require('http');

const DASHBOARD_HOST = process.env.DASHBOARD_HOST || 'localhost';
const DASHBOARD_PORT = process.env.DASHBOARD_PORT || 7847;

/**
 * Dashboard API 호출
 */
function sendToDashboard(endpoint, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: DASHBOARD_HOST,
            port: DASHBOARD_PORT,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve({ raw: body });
                }
            });
        });
        
        req.on('error', (e) => {
            // Dashboard 미실행 시 조용히 실패
            resolve({ error: e.message });
        });
        
        req.setTimeout(3000, () => {
            req.destroy();
            resolve({ error: 'timeout' });
        });
        
        req.write(postData);
        req.end();
    });
}

/**
 * 도구 호출 기록
 */
async function recordTool(toolName, success, responseTime, context = {}) {
    return sendToDashboard('/api/tools/record', {
        tool: toolName,
        success: success === true || success === 'true',
        responseTime: parseInt(responseTime) || 0,
        context
    });
}

/**
 * 에이전트 시작 기록
 */
async function recordAgentStart(type, prompt, sessionId = null) {
    return sendToDashboard('/api/agents/start', {
        type,
        prompt,
        sessionId,
        agentId: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    });
}

/**
 * 에이전트 완료 기록
 */
async function recordAgentComplete(agentId, success, toolsUsed = 0, summary = '') {
    return sendToDashboard('/api/agents/complete', {
        agentId,
        success: success === true || success === 'true',
        toolsUsed: parseInt(toolsUsed) || 0,
        summary
    });
}

/**
 * 프롬프트 기록
 */
async function recordPrompt(prompt, options = {}) {
    return sendToDashboard('/api/prompts', {
        prompt,
        sessionId: options.sessionId || null,
        activePlan: options.activePlan || null,
        currentTask: options.currentTask || null,
        phase: options.phase || null,
        toolsUsed: options.toolsUsed || [],
        agentsSpawned: options.agentsSpawned || [],
        duration: options.duration || 0,
        success: options.success !== false
    });
}

/**
 * CLI 처리
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'tool':
            // node dashboard-tracker.js tool <name> <success> <responseTime>
            const result = await recordTool(args[1], args[2], args[3]);
            console.log(JSON.stringify(result));
            break;
            
        case 'agent-start':
            // node dashboard-tracker.js agent-start <type> <prompt>
            const startResult = await recordAgentStart(args[1], args.slice(2).join(' '));
            console.log(JSON.stringify(startResult));
            break;
            
        case 'agent-complete':
            // node dashboard-tracker.js agent-complete <agentId> <success> [toolsUsed]
            const completeResult = await recordAgentComplete(args[1], args[2], args[3]);
            console.log(JSON.stringify(completeResult));
            break;
            
        case 'prompt':
            // node dashboard-tracker.js prompt <prompt>
            const promptResult = await recordPrompt(args.slice(1).join(' '));
            console.log(JSON.stringify(promptResult));
            break;
            
        default:
            console.log(`
Dashboard Tracker - Plan Ecosystem Dashboard v2.0 연동

사용법:
  node dashboard-tracker.js tool <name> <success> <responseTime>
  node dashboard-tracker.js agent-start <type> <prompt>
  node dashboard-tracker.js agent-complete <agentId> <success> [toolsUsed]
  node dashboard-tracker.js prompt <prompt>

예시:
  node dashboard-tracker.js tool desktop-commander.write_file true 150
  node dashboard-tracker.js agent-start Explore "코드베이스 탐색"
  node dashboard-tracker.js prompt "파일을 수정해주세요"
`);
    }
}

module.exports = { recordTool, recordAgentStart, recordAgentComplete, recordPrompt };

if (require.main === module) {
    main().catch(console.error);
}

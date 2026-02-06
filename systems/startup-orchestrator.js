/**
 * Startup Orchestrator - Claude Code 통합 시작 시스템
 *
 * [작업] Claude Code 실행 시 Docker + 대시보드 자동 시작
 * [목적] 모든 서비스를 올바른 순서로 시작하여 안정적인 환경 보장
 *
 * 실행 순서:
 * 1. Docker Desktop 시작 (비동기)
 * 2. AI Stack Monitor 시작 (Docker 무관, 즉시)
 * 3. Docker 준비 대기 (최대 90초)
 * 4. Plan Ecosystem 시작 (Docker 필요)
 * 5. Self-hosted MCP 시작 (Docker 필요)
 */

const { execSync, spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 설정
const CONFIG = {
    statusFile: 'K:/PortableApps/Claude-Code/data/startup-status.json',
    dockerDesktop: 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
    timeoutSec: 90,  // Docker 대기 시간 (60 → 90초)
    checkInterval: 2,

    // AI Stack Monitor (Docker 불필요)
    aiStackMonitor: {
        name: 'AI Stack Monitor',
        port: 13579,
        path: 'K:/PortableApps/Claude-Code/dashboard',
        script: 'server.js',
        requiresDocker: false
    },

    // Plan Ecosystem Dashboard (Docker 필요)
    planEcosystem: {
        name: 'Plan Ecosystem',
        port: 7847,
        path: 'K:/PortableApps/Claude-Code/dashboard/plan-ecosystem',
        composePath: 'K:/PortableApps/Claude-Code/dashboard/plan-ecosystem/docker-compose.yml',
        requiresDocker: true
    },

    // Self-hosted MCP 컨테이너 (Docker 필요)
    containers: [
        {
            name: 'firecrawl-self-hosted',
            path: 'K:/PortableApps/Claude-Code/mcp-servers/firecrawl-self-hosted'
        },
        {
            name: 'searxng-crawl4ai-mcp',
            path: 'K:/PortableApps/Claude-Code/mcp-servers/searxng-crawl4ai-mcp'
        },
        {
            name: 'plan-ecosystem',
            path: 'K:/PortableApps/Claude-Code/dashboard/plan-ecosystem'
        }
    ],

    // 브라우저 자동 열기
    openBrowser: true,
    browserUrls: [
        'http://localhost:13579',  // AI Stack Monitor
        'http://localhost:7847'    // Plan Ecosystem
    ]
};

/**
 * Docker 실행 상태 확인
 */
function checkDocker() {
    try {
        execSync('docker info', { stdio: 'ignore', timeout: 10000 });
        return true;
    } catch {
        return false;
    }
}

/**
 * Docker Desktop 시작 (비동기)
 */
function startDocker() {
    console.log('[*] Docker Desktop 시작 중...');
    try {
        const child = spawn(CONFIG.dockerDesktop, [], {
            detached: true,
            stdio: 'ignore',
            shell: true
        });
        child.unref();
        return true;
    } catch (err) {
        console.log('[-] Docker Desktop 시작 실패:', err.message);
        return false;
    }
}

/**
 * Docker 시작 대기 (타임아웃까지)
 */
function waitForDocker(timeoutSec) {
    const startTime = Date.now();
    let elapsed = 0;

    console.log(`[*] Docker 시작 대기 중... (최대 ${timeoutSec}초)`);

    while (elapsed < timeoutSec) {
        if (checkDocker()) {
            console.log(`[+] Docker 시작 완료 (${elapsed}초 소요)`);
            return true;
        }

        // 동기 대기 (2초)
        const waitUntil = Date.now() + (CONFIG.checkInterval * 1000);
        while (Date.now() < waitUntil) { /* busy wait */ }

        elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (elapsed % 15 === 0 && elapsed > 0) {
            console.log(`    ... ${elapsed}초 경과`);
        }
    }
    return false;
}

/**
 * AI Stack Monitor 시작 (Node.js 서버)
 */
function startAIStackMonitor() {
    const { aiStackMonitor } = CONFIG;
    console.log(`[*] ${aiStackMonitor.name} 시작 중... (포트 ${aiStackMonitor.port})`);

    try {
        // 이미 실행 중인지 확인
        try {
            execSync(`netstat -an | findstr ":${aiStackMonitor.port}"`, { stdio: 'pipe' });
            console.log(`[+] ${aiStackMonitor.name} 이미 실행 중`);
            return true;
        } catch {
            // 실행 중이 아님 - 시작 필요
        }

        // 백그라운드에서 Node 서버 시작
        const nodeExe = 'K:/PortableApps/tools/nodejs/node.exe';
        const scriptPath = path.join(aiStackMonitor.path, aiStackMonitor.script);

        const child = spawn(nodeExe, [scriptPath], {
            detached: true,
            stdio: 'ignore',
            cwd: aiStackMonitor.path,
            shell: true
        });
        child.unref();

        console.log(`[+] ${aiStackMonitor.name} 시작됨`);
        return true;
    } catch (err) {
        console.log(`[-] ${aiStackMonitor.name} 시작 실패:`, err.message);
        return false;
    }
}

/**
 * Plan Ecosystem 시작 (Docker Compose)
 */
function startPlanEcosystem() {
    const { planEcosystem } = CONFIG;
    console.log(`[*] ${planEcosystem.name} 시작 중... (포트 ${planEcosystem.port})`);

    try {
        execSync(`docker compose -f "${planEcosystem.composePath}" up -d`, {
            stdio: 'pipe',
            timeout: 60000
        });
        console.log(`[+] ${planEcosystem.name} 시작됨`);
        return true;
    } catch (err) {
        console.log(`[-] ${planEcosystem.name} 시작 실패:`, err.message);
        return false;
    }
}

/**
 * Self-hosted MCP 컨테이너 시작
 */
function startContainers() {
    console.log('[*] Self-hosted MCP 컨테이너 시작...');
    const results = {};

    for (const container of CONFIG.containers) {
        try {
            console.log(`    [*] ${container.name} 시작...`);
            execSync('docker compose up -d', {
                cwd: container.path,
                stdio: 'pipe',
                timeout: 60000
            });
            results[container.name] = 'started';
            console.log(`    [+] ${container.name} 시작 완료`);
        } catch (err) {
            results[container.name] = 'failed';
            console.log(`    [-] ${container.name} 시작 실패:`, err.message);
        }
    }
    return results;
}

/**
 * 브라우저에서 대시보드 열기
 */
function openDashboards() {
    if (!CONFIG.openBrowser) return;

    console.log('[*] 브라우저에서 대시보드 열기...');

    // 2초 대기 후 브라우저 열기 (서버 시작 대기)
    setTimeout(() => {
        for (const url of CONFIG.browserUrls) {
            try {
                exec(`start "" "${url}"`, { shell: true });
                console.log(`    [+] ${url} 열림`);
            } catch (err) {
                console.log(`    [-] ${url} 열기 실패:`, err.message);
            }
        }
    }, 2000);
}

/**
 * 상태 저장
 */
function saveStatus(status) {
    try {
        const dataDir = path.dirname(CONFIG.statusFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(CONFIG.statusFile, JSON.stringify(status, null, 2));
    } catch (err) {
        console.log('[-] 상태 파일 저장 실패:', err.message);
    }
}

/**
 * 메인 실행
 */
function main() {
    console.log('');
    console.log('='.repeat(60));
    console.log('[Startup Orchestrator] Claude Code 통합 시작 시스템');
    console.log('='.repeat(60));
    console.log('');

    const status = {
        startTime: new Date().toISOString(),
        docker: false,
        aiStackMonitor: false,
        planEcosystem: false,
        containers: {}
    };

    // Phase 1: Docker 시작 (백그라운드)
    console.log('[Phase 1/5] Docker 상태 확인...');
    let dockerReady = checkDocker();

    if (!dockerReady) {
        console.log('[-] Docker 미실행 감지');
        startDocker();
    } else {
        console.log('[+] Docker 이미 실행 중');
    }

    // Phase 2: AI Stack Monitor 시작 (Docker 무관)
    console.log('');
    console.log('[Phase 2/5] AI Stack Monitor 시작...');
    status.aiStackMonitor = startAIStackMonitor();

    // Phase 3: Docker 준비 대기
    if (!dockerReady) {
        console.log('');
        console.log('[Phase 3/5] Docker 준비 대기...');
        dockerReady = waitForDocker(CONFIG.timeoutSec);
    } else {
        console.log('');
        console.log('[Phase 3/5] Docker 이미 준비됨 - 스킵');
    }
    status.docker = dockerReady;

    if (!dockerReady) {
        console.log('[-] Docker 시작 타임아웃');
        console.log('    Docker 필요 서비스 건너뜀');
    } else {
        // Phase 4: Plan Ecosystem 시작 (Docker 필요)
        console.log('');
        console.log('[Phase 4/5] Plan Ecosystem 시작...');
        status.planEcosystem = startPlanEcosystem();

        // Phase 5: Self-hosted MCP 컨테이너 시작
        console.log('');
        console.log('[Phase 5/5] Self-hosted MCP 컨테이너 시작...');
        status.containers = startContainers();
    }

    // 브라우저 열기
    openDashboards();

    // 상태 저장
    status.endTime = new Date().toISOString();
    saveStatus(status);

    // 결과 출력
    console.log('');
    console.log('='.repeat(60));
    console.log('[결과] 시작 완료');
    console.log('='.repeat(60));
    console.log(`Docker: ${status.docker ? '실행 중' : '미실행'}`);
    console.log(`AI Stack Monitor (13579): ${status.aiStackMonitor ? '실행 중' : '실패'}`);
    console.log(`Plan Ecosystem (7847): ${status.planEcosystem ? '실행 중' : '실패/스킵'}`);
    console.log('컨테이너:');
    for (const [name, state] of Object.entries(status.containers)) {
        const icon = state === 'started' ? '[+]' : '[-]';
        console.log(`  ${icon} ${name}: ${state}`);
    }
    console.log('');
    console.log(`상태 저장: ${CONFIG.statusFile}`);
    console.log('='.repeat(60));
    console.log('');
}

// 실행
main();

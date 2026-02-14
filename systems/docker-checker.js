/**
 * Docker Auto-Start Checker for Claude Code
 *
 * [작업] Claude Code 시작 시 Docker 및 Self-hosted MCP 컨테이너 자동 시작
 * [목적] Docker 미실행 상태에서도 Self-hosted MCP 서버 사용 가능하도록 보장
 *
 * 실행 흐름:
 * 1. Docker 실행 상태 확인
 * 2. 미실행 시 Docker Desktop 자동 시작 (60초 대기)
 * 3. Self-hosted MCP 컨테이너 시작 (firecrawl, searxng-crawl4ai)
 * 4. 상태 저장 → data/docker-status.json
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 설정
const CONFIG = {
    statusFile: 'K:/PortableApps/genai/data/docker-status.json',
    dockerDesktop: 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
    timeoutSec: 90,  // 60 → 90초로 증가
    checkInterval: 2,
    containers: [
        {
            name: 'firecrawl-self-hosted',
            path: 'K:/PortableApps/genai/mcp-servers/firecrawl-self-hosted'
        },
        {
            name: 'searxng-crawl4ai-mcp',
            path: 'K:/PortableApps/genai/mcp-servers/searxng-crawl4ai-mcp'
        }
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
 * Docker Desktop 시작
 */
function startDocker() {
    console.log('[*] Docker Desktop 시작 중...');
    try {
        // detached: true로 백그라운드에서 실행
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
        while (Date.now() < waitUntil) {
            // busy wait
        }

        elapsed = Math.floor((Date.now() - startTime) / 1000);

        if (elapsed % 10 === 0 && elapsed > 0) {
            console.log(`    ... ${elapsed}초 경과`);
        }
    }

    return false;
}

/**
 * 컨테이너 상태 확인
 */
function checkContainers() {
    const status = {};

    try {
        const output = execSync('docker ps --format "{{.Names}}:{{.Status}}"', {
            encoding: 'utf8',
            timeout: 10000
        });

        output.trim().split('\n').forEach(line => {
            if (line) {
                const [name, containerStatus] = line.split(':');
                status[name] = containerStatus?.includes('Up') ? 'running' : 'stopped';
            }
        });
    } catch {
        // Docker 미실행 또는 오류
    }

    return status;
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
 * 상태 저장
 */
function saveStatus(dockerRunning, containerStatus = {}) {
    const status = {
        lastCheck: new Date().toISOString(),
        dockerRunning,
        containers: containerStatus,
        checkBy: 'docker-checker.js'
    };

    try {
        // data 폴더 확인
        const dataDir = path.dirname(CONFIG.statusFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(CONFIG.statusFile, JSON.stringify(status, null, 2));
    } catch (err) {
        console.log('[-] 상태 파일 저장 실패:', err.message);
    }

    return status;
}

/**
 * 메인 실행
 */
function main() {
    console.log('');
    console.log('='.repeat(50));
    console.log('[Docker Auto-Start] Claude Code Session Start');
    console.log('='.repeat(50));
    console.log('');

    // 1. Docker 상태 확인
    console.log('[1/3] Docker 상태 확인...');

    if (checkDocker()) {
        console.log('[+] Docker 이미 실행 중');
    } else {
        console.log('[-] Docker 미실행 감지');

        // Docker Desktop 시작
        if (!startDocker()) {
            console.log('[-] Docker Desktop을 시작할 수 없습니다');
            console.log('    수동으로 Docker Desktop을 시작해 주세요');
            saveStatus(false, {});
            return;
        }

        // 시작 대기
        if (!waitForDocker(CONFIG.timeoutSec)) {
            console.log('[-] Docker 시작 타임아웃');
            console.log('    수동으로 Docker Desktop 상태를 확인해 주세요');
            saveStatus(false, {});
            return;
        }
    }

    // 2. 컨테이너 시작
    console.log('');
    console.log('[2/3] Self-hosted MCP 컨테이너 시작...');
    const startResults = startContainers();

    // 3. 최종 상태 확인 및 저장
    console.log('');
    console.log('[3/3] 최종 상태 확인...');

    // 잠시 대기 후 컨테이너 상태 확인 (3초)
    const waitEnd = Date.now() + 3000;
    while (Date.now() < waitEnd) {
        // busy wait
    }

    const containerStatus = checkContainers();
    const status = saveStatus(true, containerStatus);

    // 결과 출력
    console.log('');
    console.log('='.repeat(50));
    console.log('[결과] Docker Auto-Start 완료');
    console.log('='.repeat(50));
    console.log('Docker: 실행 중');
    console.log('컨테이너 상태:');

    for (const [name, state] of Object.entries(containerStatus)) {
        const icon = state === 'running' ? '[+]' : '[-]';
        console.log(`  ${icon} ${name}: ${state}`);
    }

    console.log('');
    console.log(`상태 저장: ${CONFIG.statusFile}`);
    console.log('='.repeat(50));
    console.log('');
}

// 실행
main();

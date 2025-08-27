#!/usr/bin/env node

/**
 * Claude Output Filter - 실시간 스트림 필터
 * 안전하게 출력을 정리 (원본 수정 없음)
 */

const readline = require('readline');

// 입력 스트림 설정
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

// 필터 규칙
const filters = {
    // MCP 도구 호출 간소화
    cleanMcpCall(line) {
        // ● shrimp-task - split_tasks (MCP)(updateMode: "append"...) 
        // -> [Shrimp] split_tasks
        if (line.match(/^[●•]\s+(\S+)\s+-\s+(\S+)\s+\(MCP\)/)) {
            const match = line.match(/^[●•]\s+(\S+)\s+-\s+(\S+)/);
            if (match) {
                const [, server, method] = match;
                const serverShort = {
                    'shrimp-task': 'Shrimp',
                    'filesystem': 'FS',
                    'git-mcp': 'Git',
                    'github': 'GitHub',
                    'websearch': 'Search',
                    'context7': 'Docs'
                }[server] || server;
                
                return `[${serverShort}] ${method}`;
            }
        }
        return null;
    },
    
    // 결과 메시지 정리
    cleanResult(line) {
        // ⎿ Successfully wrote to ... -> ✓ 완료
        if (line.match(/^\s*⎿\s+Successfully/)) {
            if (line.includes('wrote to')) {
                const path = line.match(/to\s+(.+)$/);
                if (path) {
                    const shortPath = path[1].split(/[\/\\]/).slice(-2).join('/');
                    return `  ✓ 저장: .../${shortPath}`;
                }
            }
            return '  ✓ 완료';
        }
        return null;
    },
    
    // 긴 JSON 축약
    shortenJson(line) {
        // 200자 이상 JSON은 축약
        if (line.includes('"') && line.includes('{') && line.length > 200) {
            const preview = line.substring(0, 100);
            return preview + '... [JSON 축약됨]';
        }
        return null;
    },
    
    // 경로 단축
    shortenPaths(line) {
        // K:/PortableApps/Claude-Code/... -> K:/.../
        const longPath = /K:[\/\\]PortableApps[\/\\]Claude-Code[\/\\]/g;
        if (line.match(longPath)) {
            return line.replace(longPath, 'K:/.../');
        }
        return null;
    },
    
    // 노이즈 제거
    removeNoise(line) {
        // 불필요한 디버그 메시지 필터
        const noisePatterns = [
            /^\s*$/,  // 빈 줄
            /^undefined$/,
            /^null$/,
            /^\[object Object\]$/
        ];
        
        for (const pattern of noisePatterns) {
            if (line.match(pattern)) {
                return ''; // 제거
            }
        }
        return null;
    }
};

// 스타일 추가 (선택적)
const style = {
    dim: '\x1b[2m',
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m'
};

// 라인별 처리
rl.on('line', (line) => {
    // 각 필터 적용
    for (const filterFunc of Object.values(filters)) {
        const filtered = filterFunc(line);
        if (filtered !== null) {
            if (filtered !== '') {
                console.log(filtered);
            }
            return;
        }
    }
    
    // 필터에 걸리지 않으면 원본 출력
    console.log(line);
});

// 에러 처리
process.on('SIGINT', () => {
    process.exit(0);
});

process.on('error', (err) => {
    console.error('[Filter Error]', err.message);
});
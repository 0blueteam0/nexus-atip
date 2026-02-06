#!/usr/bin/env node
/**
 * record-prompt.js - Claude Code 프롬프트 기록 스크립트
 *
 * Phase 8E: 모든 프롬프트를 Lifecycle Phase에 연결하여 기록
 *
 * 사용법:
 *   node record-prompt.js "프롬프트 내용" [--plan planId] [--phase phase]
 *
 * 환경변수:
 *   USER_PROMPT: 사용자 프롬프트 (stdin으로도 수신 가능)
 *   ACTIVE_PLAN: 현재 활성 플랜 ID
 *   TOOLS_USED: 사용된 도구 목록 (JSON 배열)
 *   AGENTS_SPAWNED: 생성된 에이전트 목록 (JSON 배열)
 *   RESPONSE_DURATION: 응답 소요 시간 (ms)
 *   RESPONSE_SUCCESS: 성공 여부 (true/false)
 */

const path = require('path');

// Collectors 로드
let promptCollector, lifecycleCollector;

try {
    promptCollector = require('../collectors/prompt-collector');
    lifecycleCollector = require('../collectors/lifecycle-collector');
} catch (e) {
    console.error('[-] Failed to load collectors:', e.message);
    process.exit(1);
}

// CLI 인자 파싱
const args = process.argv.slice(2);
function getArg(name) {
    const idx = args.indexOf(`--${name}`);
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : null;
}

// 환경변수 또는 CLI에서 데이터 수집
const promptData = {
    prompt: process.env.USER_PROMPT || args.find(a => !a.startsWith('--')) || '',
    activePlan: process.env.ACTIVE_PLAN || getArg('plan') || null,
    toolsUsed: safeParseJSON(process.env.TOOLS_USED, []),
    agentsSpawned: safeParseJSON(process.env.AGENTS_SPAWNED, []),
    duration: parseInt(process.env.RESPONSE_DURATION || '0'),
    success: process.env.RESPONSE_SUCCESS !== 'false'
};

function safeParseJSON(str, defaultVal) {
    if (!str) return defaultVal;
    try {
        return JSON.parse(str);
    } catch (e) {
        return defaultVal;
    }
}

// 메인 실행
async function main() {
    // 빈 프롬프트는 무시
    if (!promptData.prompt || promptData.prompt.trim().length < 3) {
        console.log('[*] Empty prompt, skipping');
        process.exit(0);
    }

    // Lifecycle 연동 (planId가 있으면)
    if (promptData.activePlan) {
        try {
            const lifecycle = lifecycleCollector.loadLifecycle(promptData.activePlan);
            const currentPhase = lifecycleCollector.getCurrentPhase(lifecycle);

            promptData.lifecycle = {
                planId: promptData.activePlan,
                phase: currentPhase,
                isImplementation: currentPhase === 'implementation'
            };

            console.log(`[*] Linking to lifecycle: ${promptData.activePlan}/${currentPhase}`);
        } catch (e) {
            console.log(`[*] Lifecycle lookup failed: ${e.message}`);
        }
    }

    // 프롬프트 기록
    const record = promptCollector.recordPrompt(promptData);
    console.log(`[+] Prompt recorded: ${record.id}`);

    // Lifecycle에 프롬프트 연결
    if (promptData.lifecycle?.planId && promptData.lifecycle?.phase) {
        try {
            lifecycleCollector.linkPromptToPhase(
                promptData.lifecycle.planId,
                promptData.lifecycle.phase,
                record.id
            );
            console.log(`[+] Linked to lifecycle: ${promptData.lifecycle.planId}/${promptData.lifecycle.phase}`);
        } catch (e) {
            console.log(`[*] Failed to link prompt to lifecycle: ${e.message}`);
        }
    }

    // 결과 출력
    return record;
}

main().then(record => {
    // 성공 종료
    process.exit(0);
}).catch(err => {
    console.error('[-] Error:', err.message);
    process.exit(1);
});

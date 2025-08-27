#!/usr/bin/env node

/**
 * Supabase Keep-Alive Script
 * Free tier 프로젝트가 7일 이상 비활성화되면 일시정지됨
 * 이 스크립트는 주기적으로 간단한 쿼리를 실행하여 활성 상태 유지
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 설정 파일 경로
const CONFIG_FILE = path.join(__dirname, '../data/supabase-config.json');

// 설정 로드
function loadConfig() {
    if (!fs.existsSync(CONFIG_FILE)) {
        console.log('[!] 설정 파일 없음. 먼저 설정을 생성하세요.');
        console.log('    node supabase-keep-alive.js --setup');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

// 설정 저장
function saveConfig(config) {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('[+] 설정 저장 완료:', CONFIG_FILE);
}

// Supabase에 핑 보내기
async function pingSupabase(config) {
    const url = new URL(config.projectUrl);
    const options = {
        hostname: url.hostname,
        path: '/rest/v1/',
        method: 'GET',
        headers: {
            'apikey': config.anonKey,
            'Authorization': `Bearer ${config.anonKey}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`[+] Supabase 활성화 성공 - ${new Date().toISOString()}`);
                    resolve(true);
                } else {
                    console.log(`[-] 응답 코드: ${res.statusCode}`);
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            console.error('[-] 연결 실패:', err.message);
            reject(err);
        });

        req.end();
    });
}

// PostgreSQL 연결 테스트 (대안)
async function testPostgres(config) {
    // pg 모듈이 없으면 스킵
    try {
        const { Client } = require('pg');
        const client = new Client({
            connectionString: config.connectionString
        });

        await client.connect();
        const res = await client.query('SELECT NOW()');
        console.log('[+] PostgreSQL 연결 성공:', res.rows[0].now);
        await client.end();
        return true;
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            console.log('[*] pg 모듈 없음. API 방식만 사용');
        } else {
            console.log('[-] PostgreSQL 연결 실패:', err.message);
        }
        return false;
    }
}

// 로그 기록
function logActivity(success) {
    const logFile = path.join(__dirname, '../data/supabase-activity.log');
    const entry = `${new Date().toISOString()} - ${success ? 'SUCCESS' : 'FAILED'}\n`;
    fs.appendFileSync(logFile, entry);
}

// 메인 실행
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--setup')) {
        // 설정 모드
        console.log('[*] Supabase 설정 생성');
        console.log('    Supabase 대시보드에서 다음 정보를 복사하세요:');
        console.log('    1. Settings → API → Project URL');
        console.log('    2. Settings → API → anon public key');
        console.log('    3. Settings → Database → Connection string');
        
        const config = {
            projectUrl: 'https://xxxxx.supabase.co',
            anonKey: 'eyJhbGci...',
            serviceRole: 'eyJhbGci... (optional)',
            connectionString: 'postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres',
            checkInterval: 6 * 24 * 60 * 60 * 1000, // 6일마다
            lastCheck: null
        };
        
        saveConfig(config);
        console.log('[!] 설정 파일을 직접 편집하세요:', CONFIG_FILE);
        return;
    }

    // 일반 실행
    const config = loadConfig();
    
    try {
        // API 핑
        const apiSuccess = await pingSupabase(config);
        
        // PostgreSQL 테스트 (옵션)
        if (config.connectionString && config.connectionString !== 'postgresql://...') {
            await testPostgres(config);
        }
        
        // 마지막 체크 시간 업데이트
        config.lastCheck = new Date().toISOString();
        saveConfig(config);
        
        // 로그 기록
        logActivity(apiSuccess);
        
        if (apiSuccess) {
            console.log('[+] Supabase 프로젝트 활성 상태 유지 완료');
            console.log(`[*] 다음 체크: ${new Date(Date.now() + config.checkInterval).toLocaleDateString()}`);
        }
    } catch (err) {
        console.error('[-] 오류 발생:', err);
        logActivity(false);
    }
}

// 스케줄러 모드
if (process.argv.includes('--schedule')) {
    const config = loadConfig();
    console.log('[*] 스케줄러 모드 시작');
    console.log(`[*] 체크 간격: ${config.checkInterval / (24*60*60*1000)}일`);
    
    // 즉시 한번 실행
    main();
    
    // 주기적 실행
    setInterval(() => {
        console.log('\n[*] 예약된 체크 실행...');
        main();
    }, config.checkInterval);
    
} else {
    main();
}
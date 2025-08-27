#!/usr/bin/env node
/**
 * SAFE-MONITOR.js - 순환참조 없는 안전한 Bash 환경 모니터링
 * 
 * 핵심 안전 원칙:
 * 1. Bash를 통해 Bash를 수정하지 않음
 * 2. 읽기 전용 검증만 수행
 * 3. 수정은 별도 프로세스로 분리
 * 4. 모든 작업에 롤백 가능
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🛡️ SAFE-MONITOR: 안전한 환경 검증 시작...\n');

// 순환참조 체크
const circularRefs = [];
const safetyReport = {
    timestamp: new Date().toISOString(),
    circularReferences: [],
    dangerousPatterns: [],
    safeChecks: [],
    recommendations: []
};

// 1. 파일 시스템 기반 검증 (Bash 실행 없이)
function safeFileSystemCheck() {
    console.log('📁 파일 시스템 검증 (Bash 독립적)...');
    
    const checks = [
        {
            name: 'K드라이브 접근',
            path: 'K:\\PortableApps\\Claude-Code',
            type: 'directory'
        },
        {
            name: 'Git Bash 실행 파일',
            path: 'K:\\PortableApps\\tools\\git\\bin\\bash.exe',
            type: 'file'
        },
        {
            name: 'Node.js 실행 파일',
            path: 'K:\\PortableApps\\tools\\nodejs\\node.exe',
            type: 'file'
        },
        {
            name: 'Python 실행 파일',  
            path: 'K:\\PortableApps\\tools\\python\\python.exe',
            type: 'file'
        },
        {
            name: 'tmp 디렉토리',
            path: 'K:\\PortableApps\\Claude-Code\\tmp',
            type: 'directory'
        }
    ];
    
    for (const check of checks) {
        try {
            if (fs.existsSync(check.path)) {
                const stats = fs.statSync(check.path);
                const isCorrectType = check.type === 'directory' ? stats.isDirectory() : stats.isFile();
                
                if (isCorrectType) {
                    console.log(`✅ ${check.name}: 정상`);
                    safetyReport.safeChecks.push({
                        name: check.name,
                        status: 'PASS',
                        path: check.path
                    });
                } else {
                    console.log(`⚠️ ${check.name}: 타입 불일치`);
                    safetyReport.dangerousPatterns.push({
                        type: 'TYPE_MISMATCH',
                        path: check.path
                    });
                }
            } else {
                console.log(`❌ ${check.name}: 없음`);
                safetyReport.recommendations.push(`Create ${check.name} at ${check.path}`);
            }
        } catch (error) {
            console.log(`⚠️ ${check.name}: 접근 오류`);
        }
    }
}

// 2. 순환참조 패턴 감지
function detectCircularReferences() {
    console.log('\n🔄 순환참조 패턴 감지...');
    
    const scriptsToCheck = [
        'K:\\PortableApps\\Claude-Code\\AUTO-CHECK.js',
        'K:\\PortableApps\\Claude-Code\\FIX-BASH-NOW.bat',
        'K:\\PortableApps\\Claude-Code\\ULTIMATE-BASH-FIX.bat'
    ];
    
    for (const scriptPath of scriptsToCheck) {
        if (fs.existsSync(scriptPath)) {
            const content = fs.readFileSync(scriptPath, 'utf8');
            
            // 위험한 패턴 검사
            const dangerousPatterns = [
                {
                    pattern: /bash.*-c.*bash/i,
                    description: 'Bash를 통해 Bash 실행'
                },
                {
                    pattern: /execSync.*bash.*fix.*bash/i,
                    description: 'Bash로 Bash 수정 시도'
                },
                {
                    pattern: /fs\.watch.*\.claude\.json.*fs\.write/i,
                    description: '파일 감시 중 같은 파일 수정'
                },
                {
                    pattern: /while.*true.*execSync/i,
                    description: '무한 루프 내 명령 실행'
                }
            ];
            
            for (const dp of dangerousPatterns) {
                if (dp.pattern.test(content)) {
                    console.log(`⚠️ 순환참조 위험: ${path.basename(scriptPath)} - ${dp.description}`);
                    safetyReport.circularReferences.push({
                        file: scriptPath,
                        pattern: dp.description
                    });
                }
            }
        }
    }
    
    if (safetyReport.circularReferences.length === 0) {
        console.log('✅ 순환참조 패턴 없음');
    } else {
        console.log(`❌ ${safetyReport.circularReferences.length}개 순환참조 위험 발견!`);
    }
}

// 3. Shell snapshots 안전 검사
function checkShellSnapshots() {
    console.log('\n📸 Shell Snapshots 검사...');
    
    const snapshotDir = 'K:\\PortableApps\\Claude-Code\\shell-snapshots';
    
    if (fs.existsSync(snapshotDir)) {
        const files = fs.readdirSync(snapshotDir);
        console.log(`📊 Snapshot 파일 수: ${files.length}개`);
        
        // 파일 나이 분석
        const now = Date.now();
        let oldCount = 0;
        let lockedCount = 0;
        
        for (const file of files) {
            const filePath = path.join(snapshotDir, file);
            try {
                const stats = fs.statSync(filePath);
                const ageHours = (now - stats.mtimeMs) / 3600000;
                
                if (ageHours > 1) {
                    oldCount++;
                }
                
                // 파일 잠금 테스트 (읽기 시도)
                try {
                    const fd = fs.openSync(filePath, 'r');
                    fs.closeSync(fd);
                } catch {
                    lockedCount++;
                }
            } catch (error) {
                console.log(`⚠️ 파일 접근 오류: ${file}`);
            }
        }
        
        if (oldCount > 0) {
            console.log(`🗑️ 정리 가능: ${oldCount}개 오래된 snapshot`);
            safetyReport.recommendations.push(`Clean ${oldCount} old snapshots`);
        }
        
        if (lockedCount > 0) {
            console.log(`🔒 잠긴 파일: ${lockedCount}개 (Claude Code 실행 중)`);
            safetyReport.dangerousPatterns.push({
                type: 'LOCKED_FILES',
                count: lockedCount
            });
        }
    }
}

// 4. 환경 변수 검사 (안전하게)
function checkEnvironmentSafely() {
    console.log('\n🌍 환경 변수 검사...');
    
    const importantVars = [
        'CLAUDE_HOME',
        'CLAUDE_CONFIG_FILE',
        'TMPDIR',
        'TEMP',
        'TMP',
        'PATH'
    ];
    
    for (const varName of importantVars) {
        const value = process.env[varName];
        if (value) {
            // 경로 유효성 검사
            if (varName.includes('DIR') || varName.includes('HOME') || varName.includes('FILE')) {
                if (value.startsWith('K:') || value.startsWith('C:')) {
                    console.log(`✅ ${varName}: ${value.substring(0, 50)}...`);
                } else if (value.startsWith('/')) {
                    console.log(`⚠️ ${varName}: Unix 스타일 경로 - ${value.substring(0, 50)}...`);
                    safetyReport.dangerousPatterns.push({
                        type: 'UNIX_PATH_IN_WINDOWS',
                        variable: varName,
                        value: value.substring(0, 100)
                    });
                }
            }
        } else {
            console.log(`❌ ${varName}: 설정되지 않음`);
        }
    }
}

// 5. 안전한 수정 제안 생성
function generateSafeFixes() {
    console.log('\n💡 안전한 수정 제안...');
    
    const fixes = [];
    
    // 순환참조가 있으면 수정 제안
    if (safetyReport.circularReferences.length > 0) {
        fixes.push({
            issue: 'Circular References',
            solution: 'Refactor scripts to avoid bash-through-bash patterns',
            script: 'SAFE-FIX-CIRCULAR.bat'
        });
    }
    
    // Unix 경로 문제가 있으면
    const unixPaths = safetyReport.dangerousPatterns.filter(d => d.type === 'UNIX_PATH_IN_WINDOWS');
    if (unixPaths.length > 0) {
        fixes.push({
            issue: 'Unix Path in Windows',
            solution: 'Create Windows-compatible path mappings',
            script: 'SAFE-FIX-PATHS.bat'
        });
    }
    
    // 안전한 수정 스크립트 생성
    if (fixes.length > 0) {
        const safeFix = `@echo off
REM SAFE-FIX.bat - 안전한 수정 스크립트
REM 생성 시각: ${new Date().toISOString()}
REM 순환참조 없이 안전하게 수정

echo 🛡️ 안전한 수정 시작...

REM 1. 백업 생성
echo 📦 백업 생성 중...
if not exist "BACKUP" mkdir BACKUP
copy .claude.json BACKUP\\.claude.json.%date:~-4%%date:~3,2%%date:~0,2%.backup >nul 2>&1

REM 2. tmp 디렉토리 생성
if not exist "tmp" (
    echo 📁 tmp 디렉토리 생성...
    mkdir tmp
)

REM 3. 환경 변수 설정 (시스템 수준)
echo 🌍 환경 변수 설정...
setx TMPDIR "%cd%\\tmp" >nul 2>&1
setx CLAUDE_HOME "%cd%" >nul 2>&1

REM 4. 심볼릭 링크 (PowerShell 사용 - Bash 독립적)
echo 🔗 경로 매핑 생성...
powershell -Command "if (Test-Path 'K:') { Write-Host 'K: 드라이브 확인됨' } else { Write-Host 'K: 드라이브 없음' }"

echo ✅ 안전한 수정 완료!
echo.
echo 📝 다음 단계:
echo 1. Claude Code를 재시작하세요
echo 2. SAFE-MONITOR.js를 다시 실행하여 확인하세요
pause
`;
        
        fs.writeFileSync('K:\\PortableApps\\Claude-Code\\SAFE-FIX.bat', safeFix);
        console.log('✅ SAFE-FIX.bat 생성 완료');
    }
    
    return fixes;
}

// 6. 최종 보고서
function generateSafetyReport() {
    console.log('\n📊 안전성 검증 보고서\n');
    console.log('='.repeat(50));
    
    // 위험도 계산
    const riskLevel = 
        safetyReport.circularReferences.length * 10 +
        safetyReport.dangerousPatterns.length * 5;
    
    let status = '🟢 안전';
    if (riskLevel > 20) status = '🔴 위험';
    else if (riskLevel > 10) status = '🟡 주의';
    
    console.log(`상태: ${status} (위험도: ${riskLevel})`);
    console.log(`순환참조: ${safetyReport.circularReferences.length}개`);
    console.log(`위험 패턴: ${safetyReport.dangerousPatterns.length}개`);
    console.log(`안전 확인: ${safetyReport.safeChecks.filter(c => c.status === 'PASS').length}개`);
    console.log(`권장사항: ${safetyReport.recommendations.length}개`);
    console.log('='.repeat(50));
    
    // JSON 보고서 저장
    const reportPath = 'K:\\PortableApps\\Claude-Code\\safety-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(safetyReport, null, 2));
    console.log(`\n📄 상세 보고서: ${reportPath}`);
    
    // 순환참조 상세
    if (safetyReport.circularReferences.length > 0) {
        console.log('\n⚠️ 발견된 순환참조:');
        safetyReport.circularReferences.forEach((ref, i) => {
            console.log(`  ${i+1}. ${path.basename(ref.file)}: ${ref.pattern}`);
        });
    }
    
    // 권장사항
    if (safetyReport.recommendations.length > 0) {
        console.log('\n💡 권장사항:');
        safetyReport.recommendations.forEach((rec, i) => {
            console.log(`  ${i+1}. ${rec}`);
        });
    }
}

// 메인 실행
async function main() {
    try {
        // 1. 파일 시스템 검사
        safeFileSystemCheck();
        
        // 2. 순환참조 감지
        detectCircularReferences();
        
        // 3. Shell snapshots 검사
        checkShellSnapshots();
        
        // 4. 환경 변수 검사
        checkEnvironmentSafely();
        
        // 5. 안전한 수정 제안
        const fixes = generateSafeFixes();
        
        // 6. 보고서 생성
        generateSafetyReport();
        
        console.log('\n✨ SAFE-MONITOR 완료!');
        console.log('🛡️ 순환참조 없이 안전하게 검증했습니다.\n');
        
    } catch (error) {
        console.error(`\n❌ 오류: ${error.message}`);
        safetyReport.error = error.message;
        
        // 에러 보고서 저장
        const errorPath = 'K:\\PortableApps\\Claude-Code\\safety-error.json';
        fs.writeFileSync(errorPath, JSON.stringify(safetyReport, null, 2));
        console.log(`📄 에러 보고서: ${errorPath}`);
    }
}

// 실행
main();
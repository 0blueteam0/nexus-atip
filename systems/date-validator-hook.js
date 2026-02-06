#!/usr/bin/env node

/**
 * Date Validator Hook (날짜 검증 Hook)
 *
 * 기능:
 * - 새로 생성/수정된 파일에서 하드코딩된 날짜 감지
 * - 파일시스템 날짜와 비교하여 오류 경고
 * - pre-commit 또는 파일 저장 시 실행
 *
 * 사용법:
 *   node systems/date-validator-hook.js [file_path]
 *   node systems/date-validator-hook.js --check-recent
 */

const fs = require('fs');
const path = require('path');

// 설정
const CONFIG = {
    baseDir: path.join(__dirname, '..'),
    monthDiffThreshold: 3, // 3개월 이상 차이 시 경고
    excludePaths: [
        '.cache',
        '.vscode/extensions',
        'node_modules',
        '.git',
        'npm-cache',
        'backups'
    ]
};

// 날짜 패턴
const DATE_PATTERN = /\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])/g;

// 월 차이 계산
function monthDiff(dateStr1, dateStr2) {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    return Math.abs((d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()));
}

// 파일 검증
function validateFile(filePath) {
    // 제외 경로 체크
    const relativePath = path.relative(CONFIG.baseDir, filePath);
    if (CONFIG.excludePaths.some(p => relativePath.startsWith(p) || relativePath.includes('/' + p) || relativePath.includes('\\' + p))) {
        return { valid: true, skipped: true };
    }

    try {
        if (!fs.existsSync(filePath)) {
            return { valid: true, notFound: true };
        }

        const stats = fs.statSync(filePath);
        if (!stats.isFile()) {
            return { valid: true, notFile: true };
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const mtime = stats.mtime.toISOString().split('T')[0];
        const matches = content.match(DATE_PATTERN) || [];

        const issues = [];
        const uniqueDates = [...new Set(matches)];

        for (const dateStr of uniqueDates) {
            // 2025년 날짜만 체크
            if (!dateStr.startsWith('2025-')) continue;

            const diff = monthDiff(dateStr, mtime);
            const contentDay = parseInt(dateStr.split('-')[2]);
            const mtimeDay = stats.mtime.getDate();

            if (diff >= CONFIG.monthDiffThreshold) {
                issues.push({
                    date: dateStr,
                    mtime: mtime,
                    diff: diff,
                    sameDayPattern: contentDay === mtimeDay,
                    confidence: diff >= 5 && contentDay === mtimeDay ? 'high' : 'medium'
                });
            }
        }

        return {
            valid: issues.length === 0,
            path: relativePath,
            issues: issues
        };

    } catch (err) {
        return { valid: false, error: err.message };
    }
}

// 최근 수정 파일 체크
function checkRecentFiles(hours = 24) {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const results = [];

    function scanDir(dir) {
        try {
            const entries = fs.readdirSync(dir);
            for (const entry of entries) {
                const fullPath = path.join(dir, entry);
                const relativePath = path.relative(CONFIG.baseDir, fullPath);

                // 제외 경로
                if (CONFIG.excludePaths.some(p => relativePath.startsWith(p))) {
                    continue;
                }

                try {
                    const stats = fs.statSync(fullPath);
                    if (stats.isDirectory()) {
                        scanDir(fullPath);
                    } else if (stats.isFile() && stats.mtimeMs > cutoff) {
                        const ext = path.extname(entry).toLowerCase();
                        if (['.md', '.json', '.js', '.txt'].includes(ext)) {
                            results.push(fullPath);
                        }
                    }
                } catch (e) {}
            }
        } catch (e) {}
    }

    scanDir(CONFIG.baseDir);
    return results;
}

// 메인
function main() {
    const args = process.argv.slice(2);

    if (args.includes('--check-recent')) {
        // 최근 24시간 수정 파일 체크
        console.log('[*] 최근 24시간 수정 파일 날짜 검증...');
        const recentFiles = checkRecentFiles(24);
        console.log(`[*] 검사 대상: ${recentFiles.length}개 파일\n`);

        let hasIssues = false;
        for (const file of recentFiles) {
            const result = validateFile(file);
            if (!result.valid && result.issues?.length > 0) {
                hasIssues = true;
                console.log(`[!] ${result.path}`);
                for (const issue of result.issues) {
                    console.log(`    날짜 오류: ${issue.date} (실제: ${issue.mtime}, ${issue.diff}개월 차이)`);
                }
            }
        }

        if (!hasIssues) {
            console.log('[+] 날짜 오류 없음');
        }

        process.exit(hasIssues ? 1 : 0);

    } else if (args.length > 0) {
        // 특정 파일 검증
        const filePath = args[0];
        const result = validateFile(filePath);

        if (result.skipped) {
            console.log(`[SKIP] ${filePath} (제외 경로)`);
            process.exit(0);
        }

        if (!result.valid && result.issues?.length > 0) {
            console.log(`[!] 날짜 오류 감지: ${result.path}`);
            for (const issue of result.issues) {
                console.log(`    ${issue.date} → 실제: ${issue.mtime} (${issue.diff}개월 차이)`);
                if (issue.confidence === 'high') {
                    console.log(`    [경고] 높은 신뢰도 오류 - 확인 필요`);
                }
            }
            process.exit(1);
        }

        console.log(`[OK] ${path.relative(CONFIG.baseDir, filePath)}`);
        process.exit(0);

    } else {
        console.log('사용법:');
        console.log('  node systems/date-validator-hook.js [file_path]');
        console.log('  node systems/date-validator-hook.js --check-recent');
    }
}

if (require.main === module) {
    main();
}

module.exports = { validateFile, checkRecentFiles };

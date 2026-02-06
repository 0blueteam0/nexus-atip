#!/usr/bin/env node

/**
 * Date Fix Executor (날짜 수정 실행기)
 *
 * 기능:
 * - 날짜 필요 파일 vs 불필요 파일 자동 분류
 * - 필요한 파일: 올바른 날짜로 수정
 * - 불필요한 파일: 날짜 제거 또는 스킵
 * - 외부 라이브러리 파일 자동 제외
 *
 * 사용법:
 *   node systems/date-fix-executor.js --dry-run    # 미리보기
 *   node systems/date-fix-executor.js --execute    # 실행
 */

const fs = require('fs');
const path = require('path');

// 설정
const CONFIG = {
    baseDir: path.join(__dirname, '..'),
    reportFile: path.join(__dirname, '../data/date-diagnosis-report.json'),
    backupDir: path.join(__dirname, '../backups/date-fix-' + new Date().toISOString().split('T')[0]),
    fixLogFile: path.join(__dirname, '../data/date-fix-log.json')
};

// 외부 라이브러리/캐시 경로 (수정 금지)
const SKIP_PATHS = [
    '.cache',
    '.vscode/extensions',
    'node_modules',
    '.git',
    'npm-cache',
    '.n8n',
    '.flowise',
    '.ollama',
    'tools/nodejs',
    'tools/python'
];

// 날짜가 필요한 파일 패턴 (수정 대상)
const NEEDS_DATE_PATTERNS = [
    // 로그 파일
    /log/i,
    /LOG/,
    /-log\./,

    // 보고서/분석
    /REPORT/i,
    /ANALYSIS/i,
    /DIAGNOSIS/i,
    /SUMMARY/i,

    // 세션 기록
    /SESSION/i,
    /session/,

    // 아카이브 기록 (날짜가 중요)
    /ARCHIVE.*README/i,
    /ARCHIVE.*cleanup/i,
    /DISCARDED/i,

    // 문서 (날짜 컨텍스트 필요)
    /GUIDE/i,
    /CHANGELOG/i,
    /HISTORY/i,
    /memo/i
];

// 날짜가 불필요한 파일 패턴 (날짜 제거 또는 스킵)
const NO_DATE_NEEDED_PATTERNS = [
    // 코드 파일 (날짜 불필요)
    /\.js$/,
    /\.ts$/,
    /\.py$/,

    // 설정 파일
    /config\./i,
    /\.json$/,
    /\.npmrc/,

    // 스타일/마크업
    /\.css$/,
    /\.html$/
];

// 결과 저장
const results = {
    skipped: [],      // 외부 라이브러리 (스킵)
    needsDate: [],    // 날짜 필요 → 수정 대상
    noDateNeeded: [], // 날짜 불필요 → 무시
    fixed: [],        // 수정 완료
    errors: []
};

// 경로가 스킵 대상인지 확인
function shouldSkip(filePath) {
    const relativePath = path.relative(CONFIG.baseDir, filePath);
    return SKIP_PATHS.some(skipPath =>
        relativePath.startsWith(skipPath) ||
        relativePath.includes('/' + skipPath) ||
        relativePath.includes('\\' + skipPath)
    );
}

// 파일이 날짜가 필요한지 확인
function needsDate(filePath) {
    const filename = path.basename(filePath);
    const relativePath = path.relative(CONFIG.baseDir, filePath);

    // ARCHIVE 폴더 내 파일은 날짜 필요 (기록 목적)
    if (relativePath.includes('ARCHIVE')) {
        return true;
    }

    // documentation 폴더 내 파일은 날짜 필요
    if (relativePath.includes('documentation')) {
        return true;
    }

    // 패턴 매칭
    return NEEDS_DATE_PATTERNS.some(pattern => pattern.test(filename) || pattern.test(relativePath));
}

// 날짜 패턴 교체
function fixDateInContent(content, oldDate, newDate) {
    // ISO 형식 날짜 교체
    const regex = new RegExp(oldDate.replace(/-/g, '[-/]'), 'g');
    return content.replace(regex, newDate);
}

// 파일 수정 실행
function fixFile(fileInfo, dryRun = true) {
    const { path: relativePath, issues } = fileInfo;
    const filePath = path.join(CONFIG.baseDir, relativePath);

    // 스킵 체크
    if (shouldSkip(filePath)) {
        results.skipped.push({ path: relativePath, reason: '외부 라이브러리' });
        return { skipped: true, reason: '외부 라이브러리' };
    }

    // 날짜 필요 여부 확인
    if (!needsDate(filePath)) {
        results.noDateNeeded.push({ path: relativePath, reason: '날짜 불필요' });
        return { skipped: true, reason: '날짜 불필요 파일' };
    }

    // 자동 수정 가능한 이슈만 필터
    const autoFixableIssues = issues.filter(i => i.autoFixable && i.confidence === 'high');

    if (autoFixableIssues.length === 0) {
        results.noDateNeeded.push({ path: relativePath, reason: '자동 수정 불가' });
        return { skipped: true, reason: '자동 수정 가능 이슈 없음' };
    }

    results.needsDate.push({ path: relativePath, issues: autoFixableIssues });

    if (dryRun) {
        return {
            dryRun: true,
            path: relativePath,
            fixes: autoFixableIssues.map(i => `${i.contentDate || i.filenameDate} → ${i.suggestedFix}`)
        };
    }

    // 실제 수정 실행
    try {
        // 백업 생성
        if (!fs.existsSync(CONFIG.backupDir)) {
            fs.mkdirSync(CONFIG.backupDir, { recursive: true });
        }

        const backupPath = path.join(CONFIG.backupDir, relativePath.replace(/[\\\/]/g, '_'));
        const content = fs.readFileSync(filePath, 'utf8');
        fs.writeFileSync(backupPath, content);

        // 날짜 수정
        let newContent = content;
        for (const issue of autoFixableIssues) {
            const oldDate = issue.contentDate || issue.filenameDate;
            if (oldDate && issue.suggestedFix) {
                newContent = fixDateInContent(newContent, oldDate, issue.suggestedFix);
            }
        }

        // 파일 저장
        fs.writeFileSync(filePath, newContent);

        results.fixed.push({
            path: relativePath,
            fixes: autoFixableIssues.map(i => `${i.contentDate || i.filenameDate} → ${i.suggestedFix}`),
            backup: backupPath
        });

        return { fixed: true, path: relativePath };

    } catch (err) {
        results.errors.push({ path: relativePath, error: err.message });
        return { error: true, message: err.message };
    }
}

// 메인 실행
function main() {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--execute');

    console.log('='.repeat(60));
    console.log('[*] 날짜 수정 실행기');
    console.log(`[*] 모드: ${dryRun ? 'DRY-RUN (미리보기)' : 'EXECUTE (실행)'}`);
    console.log('='.repeat(60));

    // 진단 보고서 로드
    if (!fs.existsSync(CONFIG.reportFile)) {
        console.error('[-] 진단 보고서 없음. date-diagnosis.js 먼저 실행하세요.');
        process.exit(1);
    }

    const report = JSON.parse(fs.readFileSync(CONFIG.reportFile, 'utf8'));

    console.log(`\n[*] 카테고리 A 파일: ${report.categoryA.length}개`);
    console.log(`[*] 카테고리 B 파일: ${report.categoryB.length}개`);

    // 카테고리 A 파일 처리 (자동 수정 가능)
    console.log('\n[+] 카테고리 A 처리 중...');
    for (const file of report.categoryA) {
        const result = fixFile(file, dryRun);
        if (!result.skipped && !result.error) {
            if (dryRun) {
                console.log(`  [DRY] ${file.path}`);
                result.fixes?.forEach(f => console.log(`        ${f}`));
            } else {
                console.log(`  [FIX] ${file.path}`);
            }
        }
    }

    // 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('[결과 요약]');
    console.log(`  스킵 (외부 라이브러리): ${results.skipped.length}개`);
    console.log(`  날짜 필요 (수정 대상): ${results.needsDate.length}개`);
    console.log(`  날짜 불필요 (무시): ${results.noDateNeeded.length}개`);

    if (!dryRun) {
        console.log(`  수정 완료: ${results.fixed.length}개`);
        console.log(`  에러: ${results.errors.length}개`);

        // 로그 저장
        const dir = path.dirname(CONFIG.fixLogFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(CONFIG.fixLogFile, JSON.stringify(results, null, 2));
        console.log(`\n[+] 로그 저장: ${CONFIG.fixLogFile}`);
    }

    console.log('='.repeat(60));

    // 상세 목록 출력
    if (results.needsDate.length > 0) {
        console.log('\n[날짜 수정 대상 파일]');
        for (const item of results.needsDate.slice(0, 20)) {
            console.log(`  - ${item.path}`);
            item.issues?.forEach(i => {
                console.log(`    ${i.contentDate || i.filenameDate} → ${i.suggestedFix}`);
            });
        }
        if (results.needsDate.length > 20) {
            console.log(`  ... 외 ${results.needsDate.length - 20}개`);
        }
    }

    if (dryRun && results.needsDate.length > 0) {
        console.log('\n[!] 실제 수정하려면: node systems/date-fix-executor.js --execute');
    }
}

// 실행
if (require.main === module) {
    main();
}

module.exports = { fixFile, shouldSkip, needsDate, results };

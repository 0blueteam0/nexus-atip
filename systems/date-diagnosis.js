#!/usr/bin/env node

/**
 * Date Diagnosis Script (날짜 진단 스크립트)
 *
 * 기능:
 * - 전체 .md, .json, .js 파일 스캔
 * - 파일 내용에서 날짜 패턴 추출 (2025-01-XX)
 * - 파일시스템 mtime과 비교
 * - 7개월 차이 패턴 식별 (8월 → 1월 오류)
 * - 카테고리별 분류 및 보고서 생성
 *
 * 사용법:
 *   node systems/date-diagnosis.js           # 분석만 실행
 *   node systems/date-diagnosis.js --fix     # 수정 실행
 *   node systems/date-diagnosis.js --report  # 상세 보고서 생성
 */

const fs = require('fs');
const path = require('path');

// 설정
const CONFIG = {
    baseDir: path.join(__dirname, '..'),
    extensions: ['.md', '.json', '.js', '.txt', '.html'],
    excludeDirs: ['node_modules', '.git', 'npm-cache', 'backups'],
    excludeFiles: ['package-lock.json'],
    reportFile: path.join(__dirname, '../data/date-diagnosis-report.json'),
    backupDir: path.join(__dirname, '../backups/date-fix-' + new Date().toISOString().split('T')[0])
};

// 날짜 패턴
const DATE_PATTERNS = {
    // 2025-01-XX 형식
    isoDate: /(\d{4})-(\d{2})-(\d{2})/g,
    // "Created: 2025-01-15" 같은 메타데이터
    createdDate: /[Cc]reated?:?\s*(\d{4})-(\d{2})-(\d{2})/g,
    updatedDate: /[Uu]pdated?:?\s*(\d{4})-(\d{2})-(\d{2})/g,
    dateField: /"date":\s*"(\d{4})-(\d{2})-(\d{2})"/g,
    // 파일명의 날짜 (DIAGNOSIS-20250116.md)
    filenameDate: /(\d{8})/
};

// 결과 저장
const results = {
    scannedFiles: 0,
    filesWithDates: 0,
    suspiciousFiles: [],      // 7개월 차이 의심 파일
    categoryA: [],            // 자동 수정 가능 (7개월 오차)
    categoryB: [],            // 검토 필요 (패턴 불일치)
    categoryC: [],            // 수동 확인 필요
    errors: []
};

// 유틸: 날짜 파싱
function parseDate(dateStr) {
    const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        return {
            year: parseInt(match[1]),
            month: parseInt(match[2]),
            day: parseInt(match[3]),
            raw: match[0]
        };
    }
    return null;
}

// 유틸: 두 날짜 간 월 차이
function monthDiff(date1, date2) {
    return (date2.year - date1.year) * 12 + (date2.month - date1.month);
}

// 유틸: 파일명에서 날짜 추출
function extractDateFromFilename(filename) {
    // DIAGNOSIS-20250116.md → 2025-01-16
    const match = filename.match(/(\d{4})(\d{2})(\d{2})/);
    if (match) {
        return {
            year: parseInt(match[1]),
            month: parseInt(match[2]),
            day: parseInt(match[3]),
            raw: `${match[1]}-${match[2]}-${match[3]}`
        };
    }
    return null;
}

// 파일 스캔
function scanFile(filePath) {
    const filename = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // 제외 파일 체크
    if (CONFIG.excludeFiles.includes(filename)) {
        return null;
    }

    try {
        const stats = fs.statSync(filePath);
        const mtime = stats.mtime;
        const mtimeDate = {
            year: mtime.getFullYear(),
            month: mtime.getMonth() + 1,
            day: mtime.getDate(),
            raw: mtime.toISOString().split('T')[0]
        };

        const content = fs.readFileSync(filePath, 'utf8');
        const fileResult = {
            path: filePath,
            relativePath: path.relative(CONFIG.baseDir, filePath),
            filename,
            mtime: mtimeDate,
            contentDates: [],
            filenameDate: null,
            issues: []
        };

        // 파일명에서 날짜 추출
        const fnDate = extractDateFromFilename(filename);
        if (fnDate) {
            fileResult.filenameDate = fnDate;
        }

        // 내용에서 날짜 추출
        const foundDates = new Set();

        // ISO 날짜 찾기 (모든 2025년 날짜)
        const isoMatches = content.matchAll(DATE_PATTERNS.isoDate);
        for (const match of isoMatches) {
            const dateStr = match[0];
            // 2025년 모든 날짜 수집
            if (dateStr.startsWith('2025-')) {
                foundDates.add(dateStr);
            }
        }

        fileResult.contentDates = [...foundDates].map(d => parseDate(d));

        // 문제 분석
        analyzeFile(fileResult);

        return fileResult;

    } catch (err) {
        results.errors.push({ file: filePath, error: err.message });
        return null;
    }
}

// 파일 분석 (모든 월 오류 감지 - 확장 버전)
function analyzeFile(fileResult) {
    const { mtime, contentDates, filenameDate, relativePath } = fileResult;

    // 1. 파일명 날짜 vs 실제 mtime 비교 (모든 월 체크)
    if (filenameDate) {
        const diff = Math.abs(monthDiff(filenameDate, mtime));
        const sameDayDiff = filenameDate.day === mtime.day;

        // 월 차이가 있는 경우 (1개월 이상)
        if (diff >= 1) {
            const actualMonth = String(mtime.month).padStart(2, '0');
            const contentMonth = String(filenameDate.month).padStart(2, '0');

            if (diff >= 5 && sameDayDiff) {
                // 5개월 이상 차이 + 일자 동일 = 높은 신뢰도
                fileResult.issues.push({
                    type: 'filename_date_error',
                    pattern: `${contentMonth}월→${actualMonth}월 오류 의심 (${diff}개월 차이, 일자 동일)`,
                    filenameDate: filenameDate.raw,
                    actualDate: mtime.raw,
                    confidence: 'high',
                    autoFixable: true,
                    suggestedFix: `${mtime.year}-${actualMonth}-${String(filenameDate.day).padStart(2, '0')}`
                });
                if (!results.categoryA.includes(fileResult)) {
                    results.categoryA.push(fileResult);
                }
            } else if (diff >= 3) {
                // 3개월 이상 차이 = 중간 신뢰도
                fileResult.issues.push({
                    type: 'filename_date_suspicious',
                    pattern: `${contentMonth}월→${actualMonth}월 의심 (${diff}개월 차이)`,
                    filenameDate: filenameDate.raw,
                    actualDate: mtime.raw,
                    confidence: 'medium',
                    autoFixable: false
                });
                if (!results.categoryB.includes(fileResult)) {
                    results.categoryB.push(fileResult);
                }
            }
        }
    }

    // 2. 내용 날짜 vs mtime 비교 (모든 월 체크)
    for (const contentDate of contentDates) {
        if (!contentDate) continue;

        const diff = Math.abs(monthDiff(contentDate, mtime));
        const sameDayDiff = contentDate.day === mtime.day;
        const actualMonth = String(mtime.month).padStart(2, '0');
        const contentMonth = String(contentDate.month).padStart(2, '0');

        // 월 차이가 있는 경우
        if (diff >= 1) {
            if (diff >= 5 && sameDayDiff) {
                // 5개월 이상 차이 + 일자 동일 = 오류 확정
                fileResult.issues.push({
                    type: 'content_date_error',
                    pattern: `${contentMonth}월→${actualMonth}월 오류 확정 (${diff}개월 차이, 일자 동일)`,
                    contentDate: contentDate.raw,
                    actualDate: mtime.raw,
                    confidence: 'high',
                    autoFixable: true,
                    suggestedFix: `${mtime.year}-${actualMonth}-${String(contentDate.day).padStart(2, '0')}`
                });
                if (!results.categoryA.includes(fileResult)) {
                    results.categoryA.push(fileResult);
                }
            } else if (diff >= 3) {
                // 3개월 이상 차이 = 검토 필요
                fileResult.issues.push({
                    type: 'content_date_suspicious',
                    pattern: `${diff}개월 차이 (${contentMonth}월 vs ${actualMonth}월, 검토 필요)`,
                    contentDate: contentDate.raw,
                    actualDate: mtime.raw,
                    confidence: 'medium',
                    autoFixable: false
                });
                if (!results.categoryB.includes(fileResult)) {
                    results.categoryB.push(fileResult);
                }
            } else if (diff >= 1 && sameDayDiff) {
                // 1-2개월 차이 + 일자 동일 = 가벼운 의심
                fileResult.issues.push({
                    type: 'content_date_minor',
                    pattern: `${diff}개월 차이 (${contentMonth}월 vs ${actualMonth}월, 일자 동일)`,
                    contentDate: contentDate.raw,
                    actualDate: mtime.raw,
                    confidence: 'low',
                    autoFixable: false
                });
                if (!results.categoryC.includes(fileResult)) {
                    results.categoryC.push(fileResult);
                }
            }
        }
    }

    // 3. 분류 안된 파일 중 날짜 있는 경우
    if (fileResult.issues.length === 0 && (contentDates.length > 0 || filenameDate)) {
        // 정상으로 간주
    }
}

// 디렉토리 재귀 스캔
function scanDirectory(dirPath) {
    try {
        const entries = fs.readdirSync(dirPath);

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry);

            // 제외 디렉토리 체크
            if (CONFIG.excludeDirs.includes(entry)) {
                continue;
            }

            try {
                const stats = fs.statSync(fullPath);

                if (stats.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (stats.isFile()) {
                    const ext = path.extname(entry).toLowerCase();
                    if (CONFIG.extensions.includes(ext)) {
                        results.scannedFiles++;
                        const fileResult = scanFile(fullPath);
                        if (fileResult && (fileResult.contentDates.length > 0 || fileResult.filenameDate)) {
                            results.filesWithDates++;
                        }
                    }
                }
            } catch (err) {
                // 파일 접근 에러 무시
            }
        }
    } catch (err) {
        results.errors.push({ dir: dirPath, error: err.message });
    }
}

// 보고서 출력
function printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('날짜 진단 보고서');
    console.log('='.repeat(60));

    console.log(`\n[통계]`);
    console.log(`  스캔된 파일: ${results.scannedFiles}개`);
    console.log(`  날짜 포함 파일: ${results.filesWithDates}개`);
    console.log(`  에러: ${results.errors.length}개`);

    console.log(`\n[카테고리별 분류]`);
    console.log(`  A (자동 수정 가능): ${results.categoryA.length}개`);
    console.log(`  B (검토 후 수정): ${results.categoryB.length}개`);
    console.log(`  C (수동 확인 필요): ${results.categoryC.length}개`);

    if (results.categoryA.length > 0) {
        console.log('\n[카테고리 A - 자동 수정 가능 (7개월 오차 패턴)]');
        for (const file of results.categoryA) {
            console.log(`  - ${file.relativePath}`);
            for (const issue of file.issues) {
                console.log(`    [${issue.confidence}] ${issue.pattern}`);
                if (issue.suggestedFix) {
                    console.log(`    제안: ${issue.contentDate || issue.filenameDate} → ${issue.suggestedFix}`);
                }
            }
        }
    }

    if (results.categoryB.length > 0) {
        console.log('\n[카테고리 B - 검토 필요]');
        for (const file of results.categoryB) {
            console.log(`  - ${file.relativePath}`);
            for (const issue of file.issues) {
                console.log(`    ${issue.pattern}`);
            }
        }
    }

    if (results.categoryC.length > 0) {
        console.log('\n[카테고리 C - 수동 확인 필요 (1월 날짜 포함)]');
        for (const file of results.categoryC.slice(0, 10)) {
            console.log(`  - ${file.relativePath}`);
        }
        if (results.categoryC.length > 10) {
            console.log(`  ... 외 ${results.categoryC.length - 10}개`);
        }
    }

    console.log('\n' + '='.repeat(60));
}

// 보고서 저장
function saveReport() {
    try {
        const dir = path.dirname(CONFIG.reportFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                scannedFiles: results.scannedFiles,
                filesWithDates: results.filesWithDates,
                categoryA: results.categoryA.length,
                categoryB: results.categoryB.length,
                categoryC: results.categoryC.length,
                errors: results.errors.length
            },
            categoryA: results.categoryA.map(f => ({
                path: f.relativePath,
                issues: f.issues
            })),
            categoryB: results.categoryB.map(f => ({
                path: f.relativePath,
                issues: f.issues
            })),
            categoryC: results.categoryC.map(f => ({
                path: f.relativePath,
                mtime: f.mtime.raw,
                contentDates: f.contentDates.map(d => d?.raw).filter(Boolean)
            })),
            errors: results.errors
        };

        fs.writeFileSync(CONFIG.reportFile, JSON.stringify(report, null, 2));
        console.log(`\n[+] 보고서 저장: ${CONFIG.reportFile}`);
    } catch (err) {
        console.error('[-] 보고서 저장 실패:', err.message);
    }
}

// 메인
function main() {
    const args = process.argv.slice(2);
    const doFix = args.includes('--fix');
    const doReport = args.includes('--report');

    console.log('[*] 날짜 진단 시작...');
    console.log(`[*] 스캔 대상: ${CONFIG.baseDir}`);
    console.log(`[*] 확장자: ${CONFIG.extensions.join(', ')}`);
    console.log('');

    // 스캔 실행
    scanDirectory(CONFIG.baseDir);

    // 보고서 출력
    printReport();

    // 보고서 저장
    if (doReport || results.categoryA.length > 0 || results.categoryB.length > 0) {
        saveReport();
    }

    // 수정 모드
    if (doFix) {
        console.log('\n[!] --fix 옵션은 아직 구현되지 않았습니다.');
        console.log('    수동으로 카테고리 A 파일들을 검토 후 수정하세요.');
    }

    // 종료 코드
    const hasIssues = results.categoryA.length > 0 || results.categoryB.length > 0;
    process.exit(hasIssues ? 1 : 0);
}

// 실행
if (require.main === module) {
    main();
}

module.exports = { scanFile, scanDirectory, results };

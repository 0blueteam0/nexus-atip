// 과도한 파일 정리 스크립트
const fs = require('fs');
const path = require('path');

console.log('=' .repeat(60));
console.log('    과도한 파일 정리 작업');
console.log('=' .repeat(60));
console.log();

const rootDir = 'K:\\PortableApps\\genai';

// 정리 대상 파일 패턴
const cleanupPatterns = {
    fix: /^FIX-.*\.(bat|js)$/i,
    test: /^TEST-.*\.(bat|js)$/i,
    verify: /^VERIFY-.*\.(bat|js)$/i,
    ultimate: /^ULTIMATE-.*\.bat$/i,
    cleanup: /^CLEANUP-.*\.(txt|js)$/i,
    detect: /^DETECT-.*\.js$/i,
    check: /^CHECK-.*\.(bat|js)$/i,
    execute: /^EXECUTE-.*\.(js|ps1)$/i,
    run: /^RUN-.*\.(bat|ps1)$/i
};

// 보존해야 할 중요 파일
const keepFiles = [
    'claude.bat',
    'CLAUDE.md',
    '.claude.json',
    'package.json',
    'package-lock.json',
    '.env',
    '.npmrc',
    '.bashrc',
    '.bash_profile',
    '.gitconfig',
    '.gitignore',
    'index.html',
    'quick.bat',
    'load-env-keys.bat'
];

// 이동할 디렉토리 생성
const archiveDir = path.join(rootDir, 'ARCHIVE', 'cleanup-2025-01-21');
if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
}

// 파일 목록 가져오기
const allItems = fs.readdirSync(rootDir);
const filesToMove = [];

// 정리 대상 파일 식별
allItems.forEach(item => {
    const itemPath = path.join(rootDir, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isFile() && !keepFiles.includes(item)) {
        // 패턴 매칭 확인
        for (const [category, pattern] of Object.entries(cleanupPatterns)) {
            if (pattern.test(item)) {
                filesToMove.push({
                    name: item,
                    category: category,
                    path: itemPath
                });
                break;
            }
        }
    }
});

console.log(`📋 정리 대상 파일: ${filesToMove.length}개`);
console.log();

// 카테고리별 정리
const categories = {};
filesToMove.forEach(file => {
    if (!categories[file.category]) {
        categories[file.category] = [];
    }
    categories[file.category].push(file.name);
});

console.log('📂 카테고리별 정리 대상:');
for (const [category, files] of Object.entries(categories)) {
    console.log(`  [${category}] ${files.length}개`);
    // 처음 3개만 표시
    files.slice(0, 3).forEach(f => console.log(`    - ${f}`));
    if (files.length > 3) {
        console.log(`    ... 외 ${files.length - 3}개`);
    }
}
console.log();

// 실제 이동 작업
console.log('🚀 파일 이동 시작...');
let movedCount = 0;
let errorCount = 0;

filesToMove.forEach(file => {
    try {
        const destPath = path.join(archiveDir, file.name);
        fs.renameSync(file.path, destPath);
        movedCount++;
    } catch (error) {
        console.log(`  ❌ 실패: ${file.name} - ${error.message}`);
        errorCount++;
    }
});

console.log();
console.log('=' .repeat(60));
console.log('📊 정리 결과');
console.log('=' .repeat(60));
console.log(`✅ 이동 완료: ${movedCount}개`);
console.log(`❌ 실패: ${errorCount}개`);
console.log(`📁 보관 위치: ${archiveDir}`);

// 현재 상태 재확인
const remainingItems = fs.readdirSync(rootDir);
const remainingFiles = remainingItems.filter(item => {
    const itemPath = path.join(rootDir, item);
    return fs.statSync(itemPath).isFile();
});

const remainingDirs = remainingItems.filter(item => {
    const itemPath = path.join(rootDir, item);
    return fs.statSync(itemPath).isDirectory();
});

console.log();
console.log('🎯 정리 후 상태:');
console.log(`  - 디렉토리: ${remainingDirs.length}개`);
console.log(`  - 파일: ${remainingFiles.length}개`);

if (remainingFiles.length <= 50 && remainingDirs.length <= 15) {
    console.log();
    console.log('✅ 목표 달성! 디렉토리 구조가 깔끔해졌습니다.');
} else {
    console.log();
    console.log('⚠️ 추가 정리가 필요할 수 있습니다.');
}

console.log('=' .repeat(60));
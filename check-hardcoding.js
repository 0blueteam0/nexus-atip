#!/usr/bin/env node

/**
 * 하드코딩 체크 스크립트 - 단순하고 독립적
 * 의존성 없음, 필요할 때만 실행
 */

const fs = require('fs');
const path = require('path');

// 하드코딩 패턴
const patterns = [
    // 경로 하드코딩
    { regex: /128GB\s+USB/gi, message: "특정 USB 용량 하드코딩" },
    { regex: /USB\s+3\.2/gi, message: "특정 USB 버전 하드코딩" },
    { regex: /C:\\Users\\[A-Z\.]+\\/gi, message: "특정 사용자 경로 하드코딩" },
    { regex: /2025-08-\d{2}/gi, message: "특정 날짜 하드코딩" },
    
    // API 키나 비밀번호 (보안)
    { regex: /api[_-]?key\s*=\s*["'][^"']{20,}/gi, message: "API 키 하드코딩 위험" },
    { regex: /password\s*=\s*["'][^"']+/gi, message: "비밀번호 하드코딩 위험" },
    
    // 특정 버전
    { regex: /node\.exe\s+v\d+\.\d+\.\d+/gi, message: "Node 버전 하드코딩" },
    { regex: /claude-code@\d+\.\d+\.\d+/gi, message: "Claude 버전 하드코딩" }
];

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    patterns.forEach(pattern => {
        const matches = content.match(pattern.regex);
        if (matches) {
            issues.push({
                pattern: pattern.message,
                found: matches[0],
                line: getLineNumber(content, matches[0])
            });
        }
    });
    
    return issues;
}

function getLineNumber(content, match) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(match)) {
            return i + 1;
        }
    }
    return 0;
}

// 메인 실행
const target = process.argv[2] || 'CLAUDE.md';

if (!fs.existsSync(target)) {
    console.log(`[-] 파일 없음: ${target}`);
    process.exit(1);
}

console.log(`[*] 하드코딩 검사: ${target}\n`);

const issues = checkFile(target);

if (issues.length === 0) {
    console.log('[+] 하드코딩 없음 - 깔끔합니다!');
} else {
    console.log(`[-] 하드코딩 ${issues.length}개 발견:\n`);
    issues.forEach(issue => {
        console.log(`  Line ${issue.line}: ${issue.pattern}`);
        console.log(`    발견: "${issue.found}"`);
        console.log('');
    });
}

// 사용법 안내
if (process.argv.length === 2) {
    console.log('\n사용법:');
    console.log('  node check-hardcoding.js [파일명]');
    console.log('  node check-hardcoding.js CLAUDE.md');
    console.log('  node check-hardcoding.js *.js');
}
const fs = require('fs');
const path = require('path');

const backupDir = 'K:/PortableApps/Claude-Code/ShrimpData-Backup-20250827';
const results = [];
let hasErrors = false;

// JSON 파일 목록
const jsonFiles = [
    'current-tasks.json',
    'task-001-comprehensive-project.json',
    'folder-cleanup-task.json',
    'task-progress-log.json'
];

console.log('[*] JSON 파일 유효성 검증 시작\n');

jsonFiles.forEach(file => {
    const filePath = path.join(backupDir, file);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(content);
        
        // 파일 크기 확인
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        
        // 기본 구조 검증
        let structureCheck = '[+] 구조 정상';
        if (file === 'current-tasks.json' && !parsed.tasks) {
            structureCheck = '[-] tasks 필드 누락';
            hasErrors = true;
        }
        
        results.push({
            file: file,
            status: '[+] 유효',
            size: `${sizeKB} KB`,
            structure: structureCheck
        });
        
        console.log(`[+] ${file}`);
        console.log(`    크기: ${sizeKB} KB`);
        console.log(`    상태: 유효한 JSON`);
        console.log(`    구조: ${structureCheck}\n`);
        
    } catch (error) {
        hasErrors = true;
        results.push({
            file: file,
            status: '[-] 오류',
            error: error.message
        });
        
        console.log(`[-] ${file}`);
        console.log(`    오류: ${error.message}\n`);
    }
});

// 요약
console.log('[*] 검증 요약');
console.log('================');
const validCount = results.filter(r => r.status === '[+] 유효').length;
console.log(`총 파일: ${jsonFiles.length}개`);
console.log(`유효함: ${validCount}개`);
console.log(`오류: ${jsonFiles.length - validCount}개`);

if (!hasErrors) {
    console.log('\n[+] 모든 JSON 파일이 유효합니다!');
    process.exit(0);
} else {
    console.log('\n[-] 일부 파일에 문제가 있습니다.');
    process.exit(1);
}
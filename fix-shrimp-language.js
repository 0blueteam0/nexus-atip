#!/usr/bin/env node

/**
 * Shrimp Task Manager 한글화 패치 스크립트
 * 중국어를 한글/영어 병기로 변경
 */

const fs = require('fs');
const path = require('path');

// 변경할 파일들과 교체 내용
const replacements = [
    {
        file: 'node_modules/mcp-shrimp-task-manager/dist/models/taskModel.js',
        changes: [
            { from: /個任務/g, to: '개 태스크' },
            { from: /沒有依賴的任務可以直接執行/g, to: '의존성 없음 - 즉시 실행 가능' },
            { from: /已成功清除所有任務/g, to: '모든 태스크 삭제 완료' },
            { from: /個任務被刪除/g, to: '개 태스크 삭제됨' },
            { from: /個已完成的任務/g, to: '개의 완료된 태스크' }
        ]
    },
    {
        file: 'node_modules/mcp-shrimp-task-manager/dist/prompts/generators/listTasks.js',
        changes: [
            { from: /個任務/g, to: '개 태스크' },
            { from: /沒有依賴/g, to: '의존성 없음' }
        ]
    },
    {
        file: 'node_modules/mcp-shrimp-task-manager/dist/prompts/generators/planTask.js', 
        changes: [
            { from: /如果不是最後一個任務/g, to: '마지막 태스크가 아닌 경우' }
        ]
    }
];

console.log('[*] Shrimp Task Manager 한글화 패치 시작...\n');

let totalChanges = 0;

replacements.forEach(({ file, changes }) => {
    const filePath = path.join('K:/PortableApps/Claude-Code', file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`[-] 파일 없음: ${file}`);
        return;
    }
    
    // 백업 생성
    const backupPath = filePath + '.backup-' + Date.now();
    fs.copyFileSync(filePath, backupPath);
    console.log(`[+] 백업 생성: ${path.basename(backupPath)}`);
    
    // 파일 읽기
    let content = fs.readFileSync(filePath, 'utf8');
    let fileChanges = 0;
    
    // 교체 수행
    changes.forEach(({ from, to }) => {
        const matches = content.match(from);
        if (matches) {
            content = content.replace(from, to);
            fileChanges += matches.length;
        }
    });
    
    if (fileChanges > 0) {
        // 수정된 내용 저장
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[+] ${path.basename(file)}: ${fileChanges}개 변경 완료`);
        totalChanges += fileChanges;
    } else {
        console.log(`[=] ${path.basename(file)}: 변경 없음`);
        // 백업 제거
        fs.unlinkSync(backupPath);
    }
});

console.log(`\n[*] 패치 완료! 총 ${totalChanges}개 항목 한글화`);

// 바이링구얼 설정 파일 생성
const bilingualConfig = {
    "shrimp_language": "ko_KR",
    "enable_bilingual": true,
    "primary_language": "korean",
    "secondary_language": "english",
    "ui_messages": {
        "pending": "대기 중 (Pending)",
        "in_progress": "진행 중 (In Progress)", 
        "completed": "완료 (Completed)",
        "blocked": "차단됨 (Blocked)",
        "no_dependency": "의존성 없음 (No Dependencies)",
        "tasks": "태스크 (Tasks)"
    }
};

fs.writeFileSync(
    'K:/PortableApps/Claude-Code/shrimp-bilingual-config.json',
    JSON.stringify(bilingualConfig, null, 2),
    'utf8'
);

console.log('[+] 바이링구얼 설정 파일 생성: shrimp-bilingual-config.json');
console.log('\n[!] 변경 사항 적용을 위해 Claude Code를 재시작하세요.');
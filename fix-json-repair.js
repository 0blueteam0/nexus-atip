const fs = require('fs');
const path = require('path');

const brokenFile = 'K:/PortableApps/Claude-Code/ShrimpData-Backup-20250827/current-tasks.json';
const fixedFile = 'K:/PortableApps/Claude-Code/ShrimpData-Backup-20250827/current-tasks-fixed.json';

console.log('[*] JSON 복구 시작\n');

try {
    // 파일 읽기
    let content = fs.readFileSync(brokenFile, 'utf8');
    
    // 문제 위치 확인 (position 5401 주변)
    console.log('[*] 문제 위치 분석 (position 5401 주변):');
    const problemArea = content.substring(5380, 5420);
    console.log(problemArea);
    console.log('\n');
    
    // 일반적인 JSON 오류 패턴 수정
    // 1. 마지막 쉼표 제거
    content = content.replace(/,(\s*[}\]])/g, '$1');
    
    // 2. 누락된 쉼표 추가 (객체/배열 요소 사이)
    content = content.replace(/}(\s*{)/g, '},$1');
    content = content.replace(/](\s*\[)/g, '],$1');
    content = content.replace(/}(\s*")/g, '},$1');
    
    // 3. 따옴표 이스케이프 문제 수정
    // content = content.replace(/([^\\])"/g, '$1\\"').replace(/\\\\"/g, '\\"');
    
    // 4. 문자열 끝에서 닫히지 않은 따옴표 찾기
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const quoteCount = (lines[i].match(/(?<!\\)"/g) || []).length;
        if (quoteCount % 2 !== 0) {
            console.log(`[!] Line ${i + 1}: 따옴표 개수 불일치 감지`);
        }
    }
    
    // JSON 파싱 시도
    try {
        const parsed = JSON.parse(content);
        
        // 복구된 JSON 저장
        fs.writeFileSync(fixedFile, JSON.stringify(parsed, null, 2), 'utf8');
        
        console.log('[+] JSON 복구 성공!');
        console.log(`[+] 저장 위치: ${fixedFile}`);
        
        // 원본 백업
        const backupName = brokenFile.replace('.json', '-broken.json');
        fs.copyFileSync(brokenFile, backupName);
        console.log(`[+] 원본 백업: ${backupName}`);
        
        // 복구된 파일로 교체
        fs.copyFileSync(fixedFile, brokenFile);
        console.log('[+] 원본 파일 교체 완료');
        
    } catch (parseError) {
        console.log('[-] 자동 복구 실패. 수동 검토 필요:');
        console.log(parseError.message);
        
        // 부분적으로 수정된 내용이라도 저장
        fs.writeFileSync(fixedFile.replace('.json', '-partial.json'), content, 'utf8');
        console.log('[*] 부분 수정본 저장됨');
    }
    
} catch (error) {
    console.error('[-] 파일 처리 오류:', error.message);
}
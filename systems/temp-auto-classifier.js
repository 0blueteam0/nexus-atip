/**
 * K:\temp 자동 분류 시스템
 * 파일을 감지하여 적절한 위치로 자동 이동
 * <!-- AI: claude-code, Created: 2025-01-12 -->
 */

const fs = require('fs');
const path = require('path');

const TEMP_PATH = 'K:/temp/_INBOX';
const RULES_PATH = 'K:/temp/classification-rules.json';
const LOG_PATH = 'K:/WORKSPACE/logs/temp-classifier';

// 로그 디렉토리 생성
if (!fs.existsSync(LOG_PATH)) {
  fs.mkdirSync(LOG_PATH, { recursive: true });
}

// 분류 규칙 로드
function loadRules() {
  try {
    return JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
  } catch (e) {
    console.error('[!] 규칙 파일 로드 실패:', e.message);
    return null;
  }
}

// 로그 작성
function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  const logFile = path.join(LOG_PATH, `classifier-${timestamp.slice(0,10)}.log`);
  console.log(logLine.trim());
  fs.appendFileSync(logFile, logLine);
}

// 파일 확장자 확인
function getExtension(filename) {
  return path.extname(filename).toLowerCase();
}

// 파일/폴더명에 패턴 포함 여부
function matchesPattern(name, patterns) {
  const lowerName = name.toLowerCase();
  return patterns.some(p => lowerName.includes(p.toLowerCase()));
}

// 파일 분류 규칙 매칭
function classifyFile(filename, rules) {
  const ext = getExtension(filename);
  
  for (const rule of rules.rules.sort((a, b) => a.priority - b.priority)) {
    // 확장자 매칭
    if (rule.extensions && rule.extensions.includes(ext)) {
      return rule;
    }
    // 패턴 매칭
    if (rule.patterns && matchesPattern(filename, rule.patterns)) {
      return rule;
    }
  }
  return null;
}

// 파일 이동
function moveFile(src, destDir, filename) {
  try {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const dest = path.join(destDir, filename);
    fs.renameSync(src, dest);
    return dest;
  } catch (e) {
    throw new Error(`이동 실패: ${e.message}`);
  }
}

// _INBOX 폴더 처리
function processInbox() {
  const rules = loadRules();
  if (!rules) return;

  const files = fs.readdirSync(TEMP_PATH);
  
  for (const file of files) {
    const filePath = path.join(TEMP_PATH, file);
    const stat = fs.statSync(filePath);
    
    // 디렉토리는 스킵 (프로젝트 폴더는 별도 처리 필요)
    if (stat.isDirectory()) {
      log(`[?] 디렉토리 스킵: ${file}`);
      continue;
    }

    const rule = classifyFile(file, rules);
    
    if (rule) {
      if (rule.manual) {
        log(`[!] 수동 처리 필요: ${file} (${rule.name})`);
        continue;
      }
      
      try {
        const dest = moveFile(filePath, rule.destination, file);
        log(`[+] 이동 완료: ${file} -> ${rule.destination} (${rule.name})`);
      } catch (e) {
        log(`[-] 이동 실패: ${file} - ${e.message}`);
        // 실패한 파일은 _FAILED로 이동
        try {
          moveFile(filePath, 'K:/temp/_FAILED', file);
        } catch (e2) {}
      }
    } else {
      log(`[?] 분류 불가: ${file} - _FAILED로 이동`);
      try {
        moveFile(filePath, 'K:/temp/_FAILED', file);
      } catch (e) {}
    }
  }
}

// 메인 실행
log('[*] K:\\temp 자동 분류 시스템 시작');
processInbox();
log('[*] 처리 완료');

// 감시 모드 (선택적)
if (process.argv.includes('--watch')) {
  const rules = loadRules();
  const interval = rules?.settings?.watch_interval_ms || 5000;
  log(`[*] 감시 모드 활성화 (${interval}ms 간격)`);
  setInterval(processInbox, interval);
}

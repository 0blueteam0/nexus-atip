/**
 * pre-update.js
 * 업데이트 전 백업 및 검증 스크립트
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = 'K:/PortableApps/genai';
const BACKUP_FILES = [
  '.claude.json',
  '.claude-hooks.json',
  'CLAUDE.md',
  'package.json',
  'claude.bat'
];

function createBackup(fromVersion, toVersion) {
  const timestamp = new Date().toISOString().split('T')[0];
  const backupDir = path.join(BASE_PATH, 'backups', `update-${fromVersion}-to-${toVersion}`);
  
  // 백업 폴더 생성
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  console.log(`[*] 백업 폴더 생성: ${backupDir}`);
  
  // 파일 백업
  BACKUP_FILES.forEach(file => {
    const src = path.join(BASE_PATH, file);
    const dest = path.join(backupDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`[+] 백업 완료: ${file}`);
    }
  });
  
  // MCP 서버 목록 저장
  saveMcpServerList(backupDir);
  
  return backupDir;
}

/**
 * MCP 서버 목록을 JSON으로 저장
 * .claude.json에서 MCP 서버 설정 추출하여 백업
 * @param {string} backupDir - 백업 디렉토리 경로
 */
function saveMcpServerList(backupDir) {
  try {
    const claudeJsonPath = path.join(BASE_PATH, '.claude.json');
    if (!fs.existsSync(claudeJsonPath)) {
      console.log('[-] .claude.json 파일 없음 - MCP 목록 스킵');
      return;
    }

    const claudeConfig = JSON.parse(fs.readFileSync(claudeJsonPath, 'utf8'));
    const mcpServers = claudeConfig.mcpServers || {};

    const mcpList = {
      exportedAt: new Date().toISOString(),
      serverCount: Object.keys(mcpServers).length,
      servers: {}
    };

    // 각 서버의 메타데이터 추출 (환경변수/시크릿 제외)
    for (const [name, config] of Object.entries(mcpServers)) {
      mcpList.servers[name] = {
        command: config.command || 'unknown',
        type: config.type || 'stdio',
        argsCount: (config.args || []).length,
        hasEnv: !!(config.env && Object.keys(config.env).length > 0)
      };
    }

    const outputPath = path.join(backupDir, 'mcp-servers-list.json');
    fs.writeFileSync(outputPath, JSON.stringify(mcpList, null, 2));
    console.log(`[+] MCP 서버 목록 저장: ${mcpList.serverCount}개 서버`);

  } catch (err) {
    console.error('[-] MCP 목록 저장 실패:', err.message);
  }
}

/**
 * 백업 무결성 검증
 * @param {string} backupDir - 백업 디렉토리 경로
 * @returns {object} 검증 결과
 */
function validateBackup(backupDir) {
  const results = {
    valid: true,
    checked: 0,
    missing: [],
    errors: []
  };

  try {
    // 필수 파일 확인
    BACKUP_FILES.forEach(file => {
      const backupPath = path.join(backupDir, file);
      const originalPath = path.join(BASE_PATH, file);

      if (fs.existsSync(originalPath)) {
        if (!fs.existsSync(backupPath)) {
          results.missing.push(file);
          results.valid = false;
        } else {
          // 파일 크기 비교
          const origSize = fs.statSync(originalPath).size;
          const backSize = fs.statSync(backupPath).size;
          if (origSize !== backSize) {
            results.errors.push(`${file}: 크기 불일치 (${origSize} vs ${backSize})`);
            results.valid = false;
          }
        }
        results.checked++;
      }
    });

    // MCP 목록 파일 확인
    const mcpListPath = path.join(backupDir, 'mcp-servers-list.json');
    if (fs.existsSync(mcpListPath)) {
      try {
        JSON.parse(fs.readFileSync(mcpListPath, 'utf8'));
        results.checked++;
      } catch {
        results.errors.push('mcp-servers-list.json: JSON 파싱 실패');
        results.valid = false;
      }
    }

  } catch (err) {
    results.valid = false;
    results.errors.push(`검증 오류: ${err.message}`);
  }

  return results;
}

// CLI 인터페이스
if (require.main === module) {
  const cmd = process.argv[2];
  const fromVer = process.argv[3] || 'unknown';
  const toVer = process.argv[4] || 'unknown';

  switch (cmd) {
    case 'backup':
      const backupDir = createBackup(fromVer, toVer);
      const validation = validateBackup(backupDir);
      console.log('[?] 백업 검증:', validation.valid ? '성공' : '실패');
      if (!validation.valid) {
        console.log('  Missing:', validation.missing);
        console.log('  Errors:', validation.errors);
      }
      break;
    case 'validate':
      const dir = process.argv[3];
      if (dir) {
        console.log(JSON.stringify(validateBackup(dir), null, 2));
      } else {
        console.log('Usage: node pre-update.js validate <backupDir>');
      }
      break;
    default:
      console.log('Usage: node pre-update.js <backup|validate> [fromVer] [toVer]');
  }
}

module.exports = { createBackup, saveMcpServerList, validateBackup };

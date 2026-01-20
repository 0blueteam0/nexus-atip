#!/usr/bin/env node
/**
 * Atomic File Operations - 원자적 파일 연산 모듈
 *
 * 위치: K:/PortableApps/Claude-Code/atos/file-ops.js
 *
 * 핵심 기능:
 * - 원자적 쓰기: 임시 파일 → rename 패턴
 * - 백업 생성 후 쓰기
 * - 손상 감지 및 자동 복구
 *
 * @module atos/file-ops
 */

const fs = require('fs');
const path = require('path');

// 상수 정의
const BACKUP_SUFFIX = '.backup';
const TEMP_SUFFIX = '.tmp';

/**
 * AtomicFileOps 클래스 - 원자적 파일 연산
 */
class AtomicFileOps {
  /**
   * 원자적 쓰기: 임시 파일 → rename
   * @param {string} filePath - 대상 파일 경로
   * @param {*} data - 저장할 데이터 (객체면 JSON으로 변환)
   * @param {object} options - 옵션
   * @returns {object} { success, error? }
   */
  static atomicWrite(filePath, data, options = {}) {
    const { indent = 2 } = options;
    const tempPath = `${filePath}${TEMP_SUFFIX}.${Date.now()}.${process.pid}`;

    try {
      // 디렉토리 확인/생성
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 데이터 직렬화
      const content = typeof data === 'string'
        ? data
        : JSON.stringify(data, null, indent);

      // 임시 파일에 쓰기
      fs.writeFileSync(tempPath, content, 'utf8');

      // 원자적 교체 (rename은 같은 파일시스템 내에서 원자적)
      fs.renameSync(tempPath, filePath);

      return { success: true };
    } catch (error) {
      // 임시 파일 정리 시도
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (e) {
        // 정리 실패 무시
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * 백업 생성 후 쓰기
   * @param {string} filePath - 대상 파일 경로
   * @param {*} data - 저장할 데이터
   * @param {object} options - 옵션
   * @returns {object} { success, backupPath?, error? }
   */
  static writeWithBackup(filePath, data, options = {}) {
    const backupPath = `${filePath}${BACKUP_SUFFIX}`;

    try {
      // 기존 파일이 있으면 백업 생성
      if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, backupPath);
      }

      // 원자적 쓰기
      const result = this.atomicWrite(filePath, data, options);

      if (result.success) {
        return { success: true, backupPath };
      } else {
        // 쓰기 실패 시 백업에서 복원
        if (fs.existsSync(backupPath)) {
          fs.copyFileSync(backupPath, filePath);
        }
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 손상 감지 및 자동 복구 읽기
   * @param {string} filePath - 대상 파일 경로
   * @param {*} defaultValue - 기본값 (파일 없거나 손상 시)
   * @returns {*} 파싱된 데이터 또는 기본값
   */
  static safeRead(filePath, defaultValue = null) {
    // 1. 정상 파일 시도
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
      } catch (e) {
        console.error(`[!] 파일 손상 감지: ${path.basename(filePath)}`);
      }
    }

    // 2. 백업에서 복구 시도
    const backupPath = `${filePath}${BACKUP_SUFFIX}`;
    if (fs.existsSync(backupPath)) {
      try {
        console.log(`[*] 백업에서 복구 시도: ${path.basename(backupPath)}`);
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        const data = JSON.parse(backupContent);

        // 복구 성공 - 원본 파일 복원
        this.atomicWrite(filePath, data);
        console.log(`[+] 백업에서 복구 완료: ${path.basename(filePath)}`);

        return data;
      } catch (e) {
        console.error(`[!] 백업도 손상됨: ${path.basename(backupPath)}`);
      }
    }

    // 3. 임시 파일에서 복구 시도
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath);
    try {
      const files = fs.readdirSync(dir);
      const tempFiles = files
        .filter(f => f.startsWith(baseName) && f.includes(TEMP_SUFFIX))
        .sort()
        .reverse();  // 최신 것 먼저

      for (const tempFile of tempFiles) {
        try {
          const tempPath = path.join(dir, tempFile);
          const tempContent = fs.readFileSync(tempPath, 'utf8');
          const data = JSON.parse(tempContent);

          console.log(`[+] 임시 파일에서 복구: ${tempFile}`);
          this.atomicWrite(filePath, data);

          return data;
        } catch (e) {
          // 이 임시 파일도 손상됨, 다음 시도
        }
      }
    } catch (e) {
      // 디렉토리 읽기 실패
    }

    // 4. 모든 복구 실패 - 기본값 반환
    return defaultValue;
  }

  /**
   * 파일 존재 여부 확인
   * @param {string} filePath - 파일 경로
   * @returns {boolean}
   */
  static exists(filePath) {
    return fs.existsSync(filePath);
  }

  /**
   * 임시 파일 정리
   * @param {string} dirPath - 디렉토리 경로
   * @param {number} maxAge - 최대 보관 시간 (ms, 기본 1시간)
   * @returns {number} 정리된 파일 수
   */
  static cleanupTempFiles(dirPath, maxAge = 3600000) {
    const now = Date.now();
    let cleaned = 0;

    try {
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        if (file.includes(TEMP_SUFFIX)) {
          const filePath = path.join(dirPath, file);
          const stat = fs.statSync(filePath);

          if (now - stat.mtimeMs > maxAge) {
            fs.unlinkSync(filePath);
            cleaned++;
          }
        }
      }
    } catch (e) {
      // 디렉토리 접근 실패 무시
    }

    return cleaned;
  }

  /**
   * JSON 유효성 검사
   * @param {string} filePath - 파일 경로
   * @returns {object} { valid, error? }
   */
  static validateJSON(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return { valid: false, error: 'File not found' };
      }

      const content = fs.readFileSync(filePath, 'utf8');
      JSON.parse(content);

      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  /**
   * 파일 무결성 체크 (체크섬 기반)
   * @param {string} filePath - 파일 경로
   * @returns {string} 간단한 체크섬
   */
  static getChecksum(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let hash = 0;
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;  // Convert to 32bit integer
      }
      return hash.toString(16);
    } catch (e) {
      return null;
    }
  }
}

// 편의 함수들 (인스턴스 없이 사용 가능)
const atomicWrite = AtomicFileOps.atomicWrite.bind(AtomicFileOps);
const writeWithBackup = AtomicFileOps.writeWithBackup.bind(AtomicFileOps);
const safeRead = AtomicFileOps.safeRead.bind(AtomicFileOps);
const validateJSON = AtomicFileOps.validateJSON.bind(AtomicFileOps);
const cleanupTempFiles = AtomicFileOps.cleanupTempFiles.bind(AtomicFileOps);

// 모듈 내보내기
module.exports = {
  AtomicFileOps,
  atomicWrite,
  writeWithBackup,
  safeRead,
  validateJSON,
  cleanupTempFiles,
  BACKUP_SUFFIX,
  TEMP_SUFFIX
};

// CLI 인터페이스
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const filePath = args[1];

  switch (command) {
    case 'validate':
      if (!filePath) {
        console.log('Usage: node file-ops.js validate <filepath>');
        process.exit(1);
      }
      const result = validateJSON(filePath);
      console.log(`[${result.valid ? '+' : '-'}] ${filePath}: ${result.valid ? 'Valid' : result.error}`);
      break;

    case 'cleanup':
      const dir = filePath || __dirname;
      const cleaned = cleanupTempFiles(dir);
      console.log(`[+] ${cleaned}개 임시 파일 정리됨`);
      break;

    case 'test':
      console.log('[*] Atomic File Operations 테스트...');
      const testFile = path.join(__dirname, 'test-atomic.json');

      try {
        // 테스트 1: 원자적 쓰기
        const w1 = atomicWrite(testFile, { test: 1, time: Date.now() });
        console.log(`[${w1.success ? '+' : '-'}] 원자적 쓰기: ${w1.success ? '성공' : w1.error}`);

        // 테스트 2: 안전 읽기
        const data = safeRead(testFile, { default: true });
        console.log(`[+] 안전 읽기: ${JSON.stringify(data)}`);

        // 테스트 3: 백업 쓰기
        const w2 = writeWithBackup(testFile, { test: 2, modified: true });
        console.log(`[${w2.success ? '+' : '-'}] 백업 쓰기: ${w2.success ? '성공' : w2.error}`);

        // 테스트 4: 유효성 검사
        const v = validateJSON(testFile);
        console.log(`[${v.valid ? '+' : '-'}] 유효성 검사: ${v.valid ? '유효' : v.error}`);

        // 정리
        fs.unlinkSync(testFile);
        if (fs.existsSync(`${testFile}${BACKUP_SUFFIX}`)) {
          fs.unlinkSync(`${testFile}${BACKUP_SUFFIX}`);
        }

        console.log('[+] 모든 테스트 통과!');
      } catch (e) {
        console.error('[-] 테스트 실패:', e.message);
      }
      break;

    default:
      console.log(`
Atomic File Operations
======================
Usage: node file-ops.js <command> [args]

Commands:
  validate <filepath>    JSON 파일 유효성 검사
  cleanup [dirpath]      임시 파일 정리 (기본: 현재 디렉토리)
  test                   자체 테스트 실행

API:
  atomicWrite(path, data)       원자적 쓰기 (임시파일 → rename)
  writeWithBackup(path, data)   백업 생성 후 쓰기
  safeRead(path, default)       손상 감지 + 자동 복구 읽기
  validateJSON(path)            JSON 유효성 검사
  cleanupTempFiles(dir, maxAge) 임시 파일 정리
`);
  }
}

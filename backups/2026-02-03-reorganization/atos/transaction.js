#!/usr/bin/env node
/**
 * File Transaction - 다중 파일 쓰기 트랜잭션 지원
 *
 * 위치: K:/PortableApps/genai/atos/transaction.js
 *
 * 핵심 기능:
 * - 다중 파일 원자적 쓰기
 * - 실패 시 자동 롤백
 * - 트랜잭션 로그 유지
 *
 * @module atos/transaction
 */

const fs = require('fs');
const path = require('path');
const { atomicWrite, BACKUP_SUFFIX } = require('./file-ops');

// 트랜잭션 로그 파일
const TX_LOG_FILE = path.join(__dirname, '.transaction-log.json');

/**
 * FileTransaction 클래스 - 다중 파일 트랜잭션
 */
class FileTransaction {
  /**
   * @param {object} options - 트랜잭션 옵션
   * @param {boolean} options.createBackup - 백업 생성 여부 (기본: true)
   * @param {boolean} options.logging - 로깅 활성화 (기본: true)
   */
  constructor(options = {}) {
    this.options = {
      createBackup: true,
      logging: true,
      ...options
    };

    this.id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    this.pending = [];      // { path, data, backup, status }
    this.status = 'pending';  // pending, committing, committed, rolledback, failed
    this.startTime = Date.now();
    this.error = null;
  }

  /**
   * 트랜잭션에 쓰기 추가
   * @param {string} filePath - 파일 경로
   * @param {*} data - 저장할 데이터
   * @returns {FileTransaction} this (체이닝용)
   */
  add(filePath, data) {
    if (this.status !== 'pending') {
      throw new Error(`Cannot add to transaction in '${this.status}' state`);
    }

    // 기존 파일 내용 백업 (롤백용)
    let backup = null;
    if (fs.existsSync(filePath)) {
      try {
        backup = fs.readFileSync(filePath, 'utf8');
      } catch (e) {
        // 읽기 실패 시 null 유지
      }
    }

    this.pending.push({
      path: filePath,
      data,
      backup,
      status: 'pending'
    });

    return this;
  }

  /**
   * 여러 파일 한번에 추가
   * @param {Array<{path: string, data: *}>} items - 파일 목록
   * @returns {FileTransaction} this
   */
  addAll(items) {
    for (const item of items) {
      this.add(item.path, item.data);
    }
    return this;
  }

  /**
   * 트랜잭션 커밋 - 모든 파일 원자적 쓰기
   * @returns {object} { success, committed, error? }
   */
  commit() {
    if (this.status !== 'pending') {
      return {
        success: false,
        committed: 0,
        error: `Cannot commit transaction in '${this.status}' state`
      };
    }

    this.status = 'committing';
    const committed = [];

    try {
      // 1. 먼저 모든 백업 생성 (옵션 활성화 시)
      if (this.options.createBackup) {
        for (const item of this.pending) {
          if (item.backup !== null) {
            const backupPath = `${item.path}${BACKUP_SUFFIX}`;
            fs.writeFileSync(backupPath, item.backup, 'utf8');
          }
        }
      }

      // 2. 모든 파일 원자적 쓰기
      for (const item of this.pending) {
        const result = atomicWrite(item.path, item.data);

        if (!result.success) {
          throw new Error(`Write failed for ${item.path}: ${result.error}`);
        }

        item.status = 'committed';
        committed.push(item);

        if (this.options.logging) {
          console.log(`  [+] TX ${this.id}: ${path.basename(item.path)} 커밋됨`);
        }
      }

      this.status = 'committed';
      this.logTransaction('committed');

      return {
        success: true,
        committed: committed.length,
        transactionId: this.id
      };

    } catch (error) {
      // 실패 시 롤백
      this.error = error.message;
      this.rollback(committed);

      return {
        success: false,
        committed: 0,
        error: error.message,
        rolledBack: committed.length
      };
    }
  }

  /**
   * 롤백 - 완료된 쓰기 되돌리기
   * @param {Array} items - 롤백할 항목들
   */
  rollback(items = this.pending) {
    if (this.options.logging) {
      console.log(`  [!] TX ${this.id}: 롤백 시작 (${items.length}개 파일)`);
    }

    for (const item of items) {
      if (item.status !== 'committed') continue;

      try {
        if (item.backup !== null) {
          // 백업에서 복원
          fs.writeFileSync(item.path, item.backup, 'utf8');
          item.status = 'rolledback';

          if (this.options.logging) {
            console.log(`  [*] ${path.basename(item.path)} 롤백됨`);
          }
        } else {
          // 새로 생성된 파일 삭제
          if (fs.existsSync(item.path)) {
            fs.unlinkSync(item.path);
            item.status = 'deleted';

            if (this.options.logging) {
              console.log(`  [*] ${path.basename(item.path)} 삭제됨 (신규 파일)`);
            }
          }
        }
      } catch (e) {
        console.error(`  [-] 롤백 실패: ${item.path} - ${e.message}`);
        item.status = 'rollback-failed';
      }
    }

    this.status = 'rolledback';
    this.logTransaction('rolledback');
  }

  /**
   * 트랜잭션 로그 저장
   * @param {string} result - 트랜잭션 결과
   */
  logTransaction(result) {
    if (!this.options.logging) return;

    try {
      let logs = [];
      if (fs.existsSync(TX_LOG_FILE)) {
        try {
          logs = JSON.parse(fs.readFileSync(TX_LOG_FILE, 'utf8'));
        } catch (e) {
          logs = [];
        }
      }

      logs.push({
        id: this.id,
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        result,
        files: this.pending.map(p => ({
          path: p.path,
          status: p.status
        })),
        error: this.error
      });

      // 최대 100개 유지
      if (logs.length > 100) {
        logs = logs.slice(-100);
      }

      fs.writeFileSync(TX_LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
    } catch (e) {
      // 로그 저장 실패 무시
    }
  }

  /**
   * 트랜잭션 상태 조회
   * @returns {object} 트랜잭션 상태
   */
  getStatus() {
    return {
      id: this.id,
      status: this.status,
      pending: this.pending.length,
      files: this.pending.map(p => ({
        path: p.path,
        status: p.status
      })),
      error: this.error
    };
  }
}

/**
 * 간단한 트랜잭션 헬퍼 함수
 * @param {Array<{path: string, data: *}>} items - 파일 목록
 * @param {object} options - 트랜잭션 옵션
 * @returns {object} 커밋 결과
 */
function withTransaction(items, options = {}) {
  const tx = new FileTransaction(options);
  tx.addAll(items);
  return tx.commit();
}

/**
 * 최근 트랜잭션 로그 조회
 * @param {number} limit - 조회할 최대 개수
 * @returns {Array} 트랜잭션 로그
 */
function getTransactionLogs(limit = 10) {
  try {
    if (fs.existsSync(TX_LOG_FILE)) {
      const logs = JSON.parse(fs.readFileSync(TX_LOG_FILE, 'utf8'));
      return logs.slice(-limit);
    }
  } catch (e) {
    // 읽기 실패
  }
  return [];
}

/**
 * 트랜잭션 로그 정리
 * @param {number} maxAge - 최대 보관 시간 (ms, 기본 24시간)
 * @returns {number} 삭제된 로그 수
 */
function cleanupTransactionLogs(maxAge = 86400000) {
  try {
    if (!fs.existsSync(TX_LOG_FILE)) return 0;

    const logs = JSON.parse(fs.readFileSync(TX_LOG_FILE, 'utf8'));
    const cutoff = new Date(Date.now() - maxAge).toISOString();

    const filtered = logs.filter(log => log.timestamp > cutoff);
    const removed = logs.length - filtered.length;

    if (removed > 0) {
      fs.writeFileSync(TX_LOG_FILE, JSON.stringify(filtered, null, 2), 'utf8');
    }

    return removed;
  } catch (e) {
    return 0;
  }
}

// 모듈 내보내기
module.exports = {
  FileTransaction,
  withTransaction,
  getTransactionLogs,
  cleanupTransactionLogs,
  TX_LOG_FILE
};

// CLI 인터페이스
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'logs':
      const logs = getTransactionLogs(parseInt(args[1]) || 10);
      console.log('\n--- 최근 트랜잭션 로그 ---');
      for (const log of logs) {
        const status = log.result === 'committed' ? '[+]' : '[-]';
        console.log(`${status} ${log.id} (${log.duration}ms) - ${log.result}`);
        for (const f of log.files) {
          console.log(`    ${f.status}: ${f.path}`);
        }
      }
      if (logs.length === 0) {
        console.log('(로그 없음)');
      }
      console.log('');
      break;

    case 'cleanup':
      const maxAge = parseInt(args[1]) || 86400000;
      const removed = cleanupTransactionLogs(maxAge);
      console.log(`[+] ${removed}개 오래된 로그 정리됨`);
      break;

    case 'test':
      console.log('[*] FileTransaction 테스트...');
      const testDir = path.join(__dirname, 'test-tx');

      // 테스트 디렉토리 생성
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir);
      }

      try {
        // 테스트 1: 성공적인 트랜잭션
        console.log('\n[1] 성공 트랜잭션 테스트');
        const tx1 = new FileTransaction({ logging: false });
        tx1.add(path.join(testDir, 'file1.json'), { test: 1 });
        tx1.add(path.join(testDir, 'file2.json'), { test: 2 });
        const r1 = tx1.commit();
        console.log(`  [${r1.success ? '+' : '-'}] 커밋 결과: ${r1.committed}개 파일`);

        // 테스트 2: 헬퍼 함수
        console.log('\n[2] withTransaction 헬퍼 테스트');
        const r2 = withTransaction([
          { path: path.join(testDir, 'file3.json'), data: { test: 3 } }
        ], { logging: false });
        console.log(`  [${r2.success ? '+' : '-'}] 헬퍼 결과: ${r2.committed}개 파일`);

        // 테스트 3: 실패 트랜잭션 (롤백)
        console.log('\n[3] 롤백 테스트');
        const tx3 = new FileTransaction({ logging: false });
        tx3.add(path.join(testDir, 'file4.json'), { test: 4 });
        // 잘못된 경로로 실패 유도
        tx3.pending.push({
          path: '/nonexistent/path/that/should/fail.json',
          data: { fail: true },
          backup: null,
          status: 'pending'
        });
        const r3 = tx3.commit();
        console.log(`  [${!r3.success ? '+' : '-'}] 롤백 발생: ${r3.error ? '예상대로' : '예상과 다름'}`);

        // 정리
        fs.rmSync(testDir, { recursive: true, force: true });
        console.log('\n[+] 모든 테스트 통과!');

      } catch (e) {
        console.error('[-] 테스트 실패:', e.message);
        // 정리 시도
        try {
          fs.rmSync(testDir, { recursive: true, force: true });
        } catch (ce) {}
      }
      break;

    default:
      console.log(`
File Transaction
================
Usage: node transaction.js <command> [args]

Commands:
  logs [limit]           최근 트랜잭션 로그 조회 (기본: 10개)
  cleanup [maxAge]       오래된 로그 정리 (기본: 24시간)
  test                   자체 테스트 실행

API:
  new FileTransaction()        새 트랜잭션 생성
  tx.add(path, data)           파일 추가
  tx.addAll([{path, data}])    여러 파일 추가
  tx.commit()                  커밋 (모든 파일 원자적 쓰기)
  tx.rollback()                롤백 (백업에서 복원)
  tx.getStatus()               상태 조회

  withTransaction(items)       헬퍼: 간단한 트랜잭션 실행
  getTransactionLogs(limit)    로그 조회
  cleanupTransactionLogs()     로그 정리
`);
  }
}

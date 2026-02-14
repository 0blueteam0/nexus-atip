#!/usr/bin/env node
/**
 * Autosave - 주기적 자동 저장 및 긴급 복구
 *
 * 위치: K:/PortableApps/genai/atos/autosave.js
 *
 * 핵심 기능:
 * - 주기적 자동 저장 (30초)
 * - SIGINT/SIGTERM 긴급 저장
 * - Uncaught Exception 대응
 * - 세션 복원 지원
 *
 * @module atos/autosave
 */

const fs = require('fs');
const path = require('path');
const { atomicWrite, safeRead } = require('./file-ops');

// 경로 설정
const BASE_PATH = 'K:/PortableApps/genai';
const AUTOSAVE_FILE = path.join(BASE_PATH, 'atos/autosave-snapshot.json');
const SESSION_STATE_FILE = path.join(BASE_PATH, 'unified-task-system/session-state.json');
const PLANS_DIR = path.join(BASE_PATH, 'plans');

// 기본 설정
const DEFAULT_INTERVAL = 30000;  // 30초
const MAX_SNAPSHOTS = 5;         // 최대 스냅샷 보관 수

/**
 * Autosave 클래스 - 자동 저장 관리
 */
class Autosave {
  /**
   * @param {object} options - 옵션
   * @param {number} options.interval - 저장 주기 (ms, 기본 30초)
   * @param {boolean} options.captureSignals - 시그널 캡처 여부 (기본 true)
   * @param {boolean} options.logging - 로깅 여부 (기본 true)
   */
  constructor(options = {}) {
    this.options = {
      interval: DEFAULT_INTERVAL,
      captureSignals: true,
      logging: true,
      ...options
    };

    this.timer = null;
    this.isRunning = false;
    this.lastSave = null;
    this.saveCount = 0;
    this.emergencySaveTriggered = false;
  }

  /**
   * 자동 저장 시작
   */
  start() {
    if (this.isRunning) {
      this.log('[*] Autosave 이미 실행 중');
      return;
    }

    this.isRunning = true;
    this.log(`[+] Autosave 시작 (주기: ${this.options.interval / 1000}초)`);

    // 주기적 저장 타이머
    this.timer = setInterval(() => this.save(), this.options.interval);

    // 프로세스 시그널 캡처
    if (this.options.captureSignals) {
      this.setupSignalHandlers();
    }

    // 즉시 첫 저장
    this.save();
  }

  /**
   * 자동 저장 중지
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.log('[*] Autosave 중지됨');
  }

  /**
   * 시그널 핸들러 설정
   */
  setupSignalHandlers() {
    // SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      this.log('\n[!] SIGINT 감지 - 긴급 저장 실행');
      this.emergencySave();
      process.exit(0);
    });

    // SIGTERM
    process.on('SIGTERM', () => {
      this.log('\n[!] SIGTERM 감지 - 긴급 저장 실행');
      this.emergencySave();
      process.exit(0);
    });

    // Uncaught Exception
    process.on('uncaughtException', (error) => {
      console.error('\n[!] Uncaught Exception:', error.message);
      this.emergencySave();
      process.exit(1);
    });

    // Unhandled Promise Rejection
    process.on('unhandledRejection', (reason, promise) => {
      console.error('\n[!] Unhandled Rejection:', reason);
      this.emergencySave();
    });
  }

  /**
   * 현재 상태 스냅샷 저장
   * @returns {object} { success, snapshot? }
   */
  save() {
    try {
      const snapshot = this.createSnapshot();

      // 원자적 쓰기
      const result = atomicWrite(AUTOSAVE_FILE, snapshot);

      if (result.success) {
        this.lastSave = new Date().toISOString();
        this.saveCount++;

        if (this.options.logging && this.saveCount % 10 === 0) {
          // 10번마다 로그
          this.log(`[*] Autosave 스냅샷 #${this.saveCount} 저장됨`);
        }

        return { success: true, snapshot };
      } else {
        this.log(`[-] Autosave 저장 실패: ${result.error}`);
        return { success: false, error: result.error };
      }

    } catch (error) {
      this.log(`[-] Autosave 예외: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * 긴급 저장 (시그널 수신 시)
   */
  emergencySave() {
    if (this.emergencySaveTriggered) return;
    this.emergencySaveTriggered = true;

    this.log('[!] 긴급 저장 시작...');

    try {
      const snapshot = this.createSnapshot();
      snapshot.emergencySave = true;
      snapshot.exitReason = 'signal';

      // 동기 쓰기 (프로세스 종료 전)
      const content = JSON.stringify(snapshot, null, 2);
      fs.writeFileSync(AUTOSAVE_FILE, content, 'utf8');

      this.log('[+] 긴급 저장 완료');
    } catch (error) {
      console.error('[-] 긴급 저장 실패:', error.message);
    }

    this.stop();
  }

  /**
   * 스냅샷 생성
   * @returns {object} 스냅샷 데이터
   */
  createSnapshot() {
    const snapshot = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      saveNumber: this.saveCount + 1,
      pid: process.pid,

      // 세션 상태
      sessionState: this.loadSessionState(),

      // 활성 플랜 정보
      activePlan: this.loadActivePlan(),

      // 환경 정보
      environment: {
        cwd: process.cwd(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    return snapshot;
  }

  /**
   * 세션 상태 로드
   * @returns {object|null} 세션 상태
   */
  loadSessionState() {
    return safeRead(SESSION_STATE_FILE, null);
  }

  /**
   * 활성 플랜 로드
   * @returns {object|null} 활성 플랜 정보 (요약)
   */
  loadActivePlan() {
    try {
      if (!fs.existsSync(PLANS_DIR)) return null;

      const files = fs.readdirSync(PLANS_DIR)
        .filter(f => f.endsWith('-progress.json'));

      for (const file of files) {
        const filePath = path.join(PLANS_DIR, file);
        const data = safeRead(filePath, null);

        if (data && data.status === 'active') {
          // 요약 정보만 반환 (용량 절약)
          return {
            planId: data.planId,
            title: data.title,
            status: data.status,
            progressPercent: data.metadata?.progressPercent || 0,
            currentPhase: this.findCurrentPhase(data),
            file: file
          };
        }
      }
    } catch (e) {
      // 읽기 실패
    }

    return null;
  }

  /**
   * 현재 진행 중인 Phase 찾기
   * @param {object} planData - 플랜 데이터
   * @returns {string|null} 현재 Phase ID
   */
  findCurrentPhase(planData) {
    if (!planData.phases) return null;

    for (const phase of planData.phases) {
      if (phase.status === 'in_progress' || phase.status === 'active') {
        return phase.id;
      }
    }

    // 진행 중인 Phase가 없으면 첫 번째 미완료 Phase
    for (const phase of planData.phases) {
      if (phase.status !== 'completed') {
        return phase.id;
      }
    }

    return null;
  }

  /**
   * 로그 출력
   * @param {string} message - 메시지
   */
  log(message) {
    if (this.options.logging) {
      console.log(message);
    }
  }

  /**
   * 상태 조회
   * @returns {object} 현재 상태
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.options.interval,
      lastSave: this.lastSave,
      saveCount: this.saveCount,
      snapshotFile: AUTOSAVE_FILE
    };
  }
}

/**
 * Autosave 스냅샷에서 복원
 * @returns {object|null} 복원된 스냅샷
 */
function restoreFromAutosave() {
  const snapshot = safeRead(AUTOSAVE_FILE, null);

  if (!snapshot) {
    console.log('[*] Autosave 스냅샷 없음');
    return null;
  }

  console.log(`[+] Autosave 스냅샷 발견: ${snapshot.timestamp}`);

  if (snapshot.emergencySave) {
    console.log('[!] 긴급 저장 스냅샷 - 비정상 종료 복구');
  }

  return snapshot;
}

/**
 * 스냅샷 히스토리 조회
 * @returns {Array} 스냅샷 목록 (최근 것부터)
 */
function getSnapshotHistory() {
  const history = [];
  const baseDir = path.dirname(AUTOSAVE_FILE);

  try {
    const files = fs.readdirSync(baseDir)
      .filter(f => f.startsWith('autosave-') && f.endsWith('.json'))
      .sort()
      .reverse();

    for (const file of files) {
      const filePath = path.join(baseDir, file);
      const stat = fs.statSync(filePath);

      history.push({
        file,
        path: filePath,
        size: stat.size,
        modified: stat.mtime.toISOString()
      });
    }
  } catch (e) {
    // 읽기 실패
  }

  return history;
}

/**
 * 오래된 스냅샷 정리
 * @param {number} maxAge - 최대 보관 시간 (ms, 기본 1시간)
 * @returns {number} 삭제된 파일 수
 */
function cleanupSnapshots(maxAge = 3600000) {
  let cleaned = 0;
  const now = Date.now();
  const baseDir = path.dirname(AUTOSAVE_FILE);

  try {
    const files = fs.readdirSync(baseDir)
      .filter(f => f.includes('autosave') && f.endsWith('.json'));

    for (const file of files) {
      // 메인 스냅샷 파일은 유지
      if (file === path.basename(AUTOSAVE_FILE)) continue;

      const filePath = path.join(baseDir, file);
      const stat = fs.statSync(filePath);

      if (now - stat.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    }
  } catch (e) {
    // 정리 실패 무시
  }

  return cleaned;
}

// Singleton 인스턴스
let instance = null;

/**
 * Autosave 인스턴스 가져오기 (싱글톤)
 * @param {object} options - 옵션
 * @returns {Autosave}
 */
function getInstance(options = {}) {
  if (!instance) {
    instance = new Autosave(options);
  }
  return instance;
}

// 모듈 내보내기
module.exports = {
  Autosave,
  getInstance,
  restoreFromAutosave,
  getSnapshotHistory,
  cleanupSnapshots,
  AUTOSAVE_FILE,
  DEFAULT_INTERVAL
};

// CLI 인터페이스
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'start':
      console.log('========================================');
      console.log('  Autosave Service');
      console.log('========================================');

      const interval = parseInt(args[1]) || DEFAULT_INTERVAL;
      const autosave = new Autosave({ interval });
      autosave.start();

      console.log('\n[*] Ctrl+C로 종료 (긴급 저장 후 종료)\n');

      // 프로세스 유지
      process.stdin.resume();
      break;

    case 'save':
      console.log('[*] 수동 스냅샷 저장...');
      const saver = new Autosave({ logging: true, captureSignals: false });
      const result = saver.save();
      console.log(`[${result.success ? '+' : '-'}] 저장 ${result.success ? '완료' : '실패'}`);
      break;

    case 'restore':
      console.log('[*] Autosave 스냅샷 복원 시도...');
      const snapshot = restoreFromAutosave();
      if (snapshot) {
        console.log('\n--- 스냅샷 정보 ---');
        console.log(`시간: ${snapshot.timestamp}`);
        console.log(`저장 번호: ${snapshot.saveNumber}`);
        console.log(`긴급 저장: ${snapshot.emergencySave ? '예' : '아니오'}`);
        if (snapshot.activePlan) {
          console.log(`활성 플랜: ${snapshot.activePlan.title} (${snapshot.activePlan.progressPercent}%)`);
        }
        console.log('');
      }
      break;

    case 'history':
      console.log('\n--- Autosave 스냅샷 히스토리 ---');
      const history = getSnapshotHistory();
      if (history.length === 0) {
        console.log('(스냅샷 없음)');
      } else {
        for (const h of history) {
          console.log(`  ${h.file} (${h.size} bytes) - ${h.modified}`);
        }
      }
      console.log('');
      break;

    case 'cleanup':
      const maxAge = parseInt(args[1]) || 3600000;
      const cleaned = cleanupSnapshots(maxAge);
      console.log(`[+] ${cleaned}개 오래된 스냅샷 정리됨`);
      break;

    case 'status':
      const current = safeRead(AUTOSAVE_FILE, null);
      console.log('\n--- Autosave 상태 ---');
      if (current) {
        console.log(`마지막 저장: ${current.timestamp}`);
        console.log(`저장 번호: ${current.saveNumber}`);
        console.log(`PID: ${current.pid}`);
        if (current.activePlan) {
          console.log(`활성 플랜: ${current.activePlan.title}`);
        }
      } else {
        console.log('스냅샷 없음');
      }
      console.log('');
      break;

    default:
      console.log(`
Autosave Service
================
Usage: node autosave.js <command> [args]

Commands:
  start [interval]    자동 저장 서비스 시작 (기본: 30초)
  save                수동 스냅샷 저장
  restore             스냅샷에서 복원 정보 조회
  history             스냅샷 히스토리 조회
  cleanup [maxAge]    오래된 스냅샷 정리 (기본: 1시간)
  status              현재 상태 조회

API:
  new Autosave({interval, captureSignals, logging})
  autosave.start()              자동 저장 시작
  autosave.stop()               자동 저장 중지
  autosave.save()               수동 저장
  autosave.emergencySave()      긴급 저장
  autosave.getStatus()          상태 조회

  restoreFromAutosave()         스냅샷에서 복원
  getSnapshotHistory()          히스토리 조회
  cleanupSnapshots(maxAge)      정리

Features:
  - 주기적 자동 저장 (기본 30초)
  - SIGINT/SIGTERM 긴급 저장
  - Uncaught Exception 대응
  - 원자적 파일 쓰기
`);
  }
}

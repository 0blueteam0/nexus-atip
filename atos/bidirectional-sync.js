#!/usr/bin/env node
/**
 * Bidirectional Sync - Planning ↔ Shrimp ↔ Unified Task 양방향 동기화
 *
 * 위치: K:/PortableApps/Claude-Code/atos/bidirectional-sync.js
 *
 * 핵심 기능:
 * - Shrimp → Planning 동기화 (태스크 완료 시)
 * - Planning → Unified Task 동기화 (완료된 태스크 추가)
 * - 주기적 동기화 (5분 또는 Task 완료 시)
 * - [v2.0] 트랜잭션 기반 원자적 쓰기
 * - [v2.0] Mutex 기반 동시 실행 방지
 *
 * 사용법:
 *   node bidirectional-sync.js          # 전체 동기화
 *   node bidirectional-sync.js shrimp   # Shrimp → Planning
 *   node bidirectional-sync.js unified  # Planning → Unified
 */

const fs = require('fs');
const path = require('path');

// 일관성 보장 모듈 로드
const { safeRead, writeWithBackup } = require('./file-ops');
const { FileTransaction } = require('./transaction');

// [v3.0] UnifiedTaskHub 로드
let UnifiedTaskHub;
try {
  UnifiedTaskHub = require('../unified-task-system/unified-task-hub');
} catch (e) {
  console.log('[*] UnifiedTaskHub 로드 실패 - 폴백 모드');
  UnifiedTaskHub = null;
}

// 경로 설정
const BASE_PATH = 'K:/PortableApps/Claude-Code';
const PLANS_DIR = path.join(BASE_PATH, 'plans');
const SHRIMP_TASKS_FILE = path.join(BASE_PATH, 'ShrimpData/tasks/current-tasks.json');
const UNIFIED_STATE_FILE = path.join(BASE_PATH, 'unified-task-system/session-state.json');
const HUB_FILE = path.join(BASE_PATH, 'unified-task-system/tasks-hub.json');
const SYNC_LOG_FILE = path.join(BASE_PATH, 'atos/sync-log.json');
const MUTEX_FILE = path.join(BASE_PATH, 'atos/.sync-mutex');

/**
 * 파일 안전하게 읽기 (file-ops 모듈 사용)
 */
function safeReadJSON(filePath, defaultValue = null) {
  return safeRead(filePath, defaultValue);
}

/**
 * 파일 안전하게 쓰기 (file-ops 모듈 사용, 백업 포함)
 */
function safeWriteJSON(filePath, data) {
  const result = writeWithBackup(filePath, data);
  if (!result.success) {
    console.error(`[!] 파일 쓰기 실패: ${result.error}`);
  }
  return result.success;
}

/**
 * Mutex 획득 (동시 실행 방지)
 * @returns {boolean} true면 획득 성공, false면 다른 프로세스 실행 중
 */
function acquireMutex() {
  try {
    if (fs.existsSync(MUTEX_FILE)) {
      const data = JSON.parse(fs.readFileSync(MUTEX_FILE, 'utf8'));
      const age = Date.now() - new Date(data.timestamp).getTime();

      // 1분 이내면 아직 실행 중
      if (age < 60000) {
        console.log('[*] 다른 동기화 진행 중 - 스킵');
        return false;
      }

      // Stale mutex - 제거
      console.log('[*] Stale mutex 감지 - 제거');
    }

    // Mutex 생성
    fs.writeFileSync(MUTEX_FILE, JSON.stringify({
      pid: process.pid,
      timestamp: new Date().toISOString()
    }), 'utf8');

    return true;
  } catch (error) {
    console.error(`[!] Mutex 획득 실패: ${error.message}`);
    return true;  // 실패 시에도 진행 허용
  }
}

/**
 * Mutex 해제
 */
function releaseMutex() {
  try {
    if (fs.existsSync(MUTEX_FILE)) {
      fs.unlinkSync(MUTEX_FILE);
    }
  } catch (error) {
    // 해제 실패 무시
  }
}

/**
 * 활성 플랜 찾기 및 파일 경로 반환
 */
function findActivePlanFile() {
  try {
    const files = fs.readdirSync(PLANS_DIR)
      .filter(f => f.endsWith('-progress.json'));
    
    for (const file of files) {
      const filePath = path.join(PLANS_DIR, file);
      const data = safeReadJSON(filePath);
      if (data && data.status === 'active') {
        return { data, filePath };
      }
    }
  } catch (error) {
    // 디렉토리 없거나 읽기 실패
  }
  return { data: null, filePath: null };
}

/**
 * 동기화 로그 로드
 */
function loadSyncLog() {
  return safeReadJSON(SYNC_LOG_FILE, {
    lastSync: null,
    syncHistory: [],
    syncStats: { shrimpToPlan: 0, planToUnified: 0 }
  });
}

// ============================================
// BidirectionalSync 클래스
// ============================================

class BidirectionalSync {
  constructor() {
    this.syncLog = loadSyncLog();
    this.changes = {
      shrimpToPlan: [],
      planToUnified: []
    };
  }

  /**
   * Shrimp → Planning 동기화
   * Shrimp에서 완료된 태스크를 Planning System에 반영
   */
  syncFromShrimp() {
    console.log('[*] Shrimp -> Planning 동기화 시작...');
    
    const shrimpData = safeReadJSON(SHRIMP_TASKS_FILE, { tasks: [] });
    const { data: planData, filePath: planFile } = findActivePlanFile();
    
    if (!planData) {
      console.log('[*] 활성 플랜 없음 - 스킵');
      return { success: true, changes: 0 };
    }
    
    let changeCount = 0;
    const shrimpTasks = shrimpData.tasks || [];
    
    // Shrimp에서 완료된 태스크 찾기
    for (const shrimpTask of shrimpTasks) {
      // 이미 동기화된 태스크 스킵
      if (shrimpTask.syncedToPlan) continue;
      
      // 완료된 태스크만 처리
      if (shrimpTask.status !== 'done' && shrimpTask.status !== 'completed') continue;
      
      // Planning의 태스크와 매칭 시도 (제목 기반)
      const taskTitle = shrimpTask.name || shrimpTask.title || '';
      
      for (const phase of planData.phases) {
        for (const planTask of phase.tasks) {
          // 제목 유사도 체크 (간단한 포함 여부)
          const planTitle = planTask.title || planTask.name || '';
          if (this.isSimilarTitle(taskTitle, planTitle)) {
            if (planTask.status !== 'completed') {
              planTask.status = 'completed';
              planTask.completedAt = new Date().toISOString();
              planTask.completedBy = 'shrimp-sync';
              shrimpTask.syncedToPlan = true;
              changeCount++;
              
              this.changes.shrimpToPlan.push({
                shrimpTask: taskTitle,
                planTask: planTitle,
                phase: phase.id
              });
              
              console.log(`  [+] ${planTitle} -> completed`);
            }
            break;
          }
        }
      }
    }
    
    // 변경 사항이 있으면 트랜잭션으로 저장
    if (changeCount > 0) {
      // Planning 진행률 업데이트
      this.updatePlanProgress(planData);

      // 트랜잭션으로 다중 파일 원자적 저장
      const tx = new FileTransaction({ logging: false });
      tx.add(planFile, planData);
      tx.add(SHRIMP_TASKS_FILE, shrimpData);

      const txResult = tx.commit();
      if (txResult.success) {
        console.log(`[+] Shrimp -> Planning: ${changeCount}개 태스크 동기화 완료 (TX: ${tx.id})`);
      } else {
        console.log(`[-] Shrimp -> Planning: 트랜잭션 실패 - ${txResult.error}`);
        return { success: false, changes: 0, error: txResult.error };
      }
    } else {
      console.log('[*] Shrimp -> Planning: 동기화할 변경 사항 없음');
    }

    return { success: true, changes: changeCount };
  }

  /**
   * 제목 유사도 체크
   */
  isSimilarTitle(title1, title2) {
    const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
    const n1 = normalize(title1);
    const n2 = normalize(title2);
    
    // 정확히 일치하거나 한쪽이 다른 쪽을 포함
    return n1 === n2 || n1.includes(n2) || n2.includes(n1);
  }

  /**
   * 플랜 진행률 업데이트
   */
  updatePlanProgress(planData) {
    let totalTasks = 0;
    let completedTasks = 0;
    
    for (const phase of planData.phases) {
      totalTasks += phase.tasks.length;
      completedTasks += phase.tasks.filter(t => t.status === 'completed').length;
      
      // Phase 상태 업데이트
      const phaseCompleted = phase.tasks.every(t => t.status === 'completed');
      if (phaseCompleted && phase.status !== 'completed') {
        phase.status = 'completed';
        phase.completedAt = new Date().toISOString();
      }
    }
    
    // 메타데이터 업데이트
    planData.metadata = planData.metadata || {};
    planData.metadata.totalTasks = totalTasks;
    planData.metadata.completedTasks = completedTasks;
    planData.metadata.progressPercent = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;
    
    planData.lastModified = new Date().toISOString();
    planData.version = (planData.version || '1.0.0').replace(/(\d+)$/, (m) => parseInt(m) + 1);
  }

  /**
   * Planning → Unified Task 동기화
   * 완료된 태스크를 Unified Task System에 반영
   * [v3.0] UnifiedTaskHub 우선 사용
   */
  syncToUnified() {
    console.log('[*] Planning -> Unified 동기화 시작...');

    const { data: planData } = findActivePlanFile();

    if (!planData) {
      console.log('[*] 활성 플랜 없음 - 스킵');
      return { success: true, changes: 0 };
    }

    // [v3.0] UnifiedTaskHub 사용 시도
    if (UnifiedTaskHub) {
      return this._syncToHub(planData);
    }

    // 폴백: 기존 session-state.json 방식
    return this._syncToLegacy(planData);
  }

  /**
   * [v3.0] UnifiedTaskHub로 동기화
   */
  _syncToHub(planData) {
    let changeCount = 0;

    try {
      const hub = new UnifiedTaskHub({ autoSync: false });

      for (const phase of planData.phases) {
        for (const task of phase.tasks) {
          if (task.status === 'completed' && !task.syncedToHub) {
            // Hub에 태스크 추가/업데이트
            hub.addTask({
              title: task.title,
              description: task.description || '',
              status: 'completed',
              source: 'planning',
              phase: phase.id,
              priority: task.priority || 'medium',
              metadata: {
                planId: planData.planId,
                phaseId: phase.id,
                phaseName: phase.name,
                completedAt: task.completedAt || new Date().toISOString()
              }
            });

            task.syncedToHub = true;
            task.syncedToUnified = true; // 하위 호환
            changeCount++;

            this.changes.planToUnified.push({
              task: task.title,
              phase: phase.id
            });

            console.log(`  [+] ${task.title} -> Hub`);
          }
        }
      }

      if (changeCount > 0) {
        // Planning 파일 업데이트
        const { filePath: planFile } = findActivePlanFile();
        if (planFile) {
          safeWriteJSON(planFile, planData);
        }
        console.log(`[+] Planning -> Hub: ${changeCount}개 태스크 동기화 완료`);
      } else {
        console.log('[*] Planning -> Hub: 동기화할 변경 사항 없음');
      }

      hub.destroy();
      return { success: true, changes: changeCount };
    } catch (error) {
      console.error('[!] Hub 동기화 실패:', error.message);
      // 폴백으로 전환
      return this._syncToLegacy(planData);
    }
  }

  /**
   * [Legacy] session-state.json으로 동기화 (하위 호환)
   */
  _syncToLegacy(planData) {
    const unifiedState = safeReadJSON(UNIFIED_STATE_FILE, {
      version: '1.0.0',
      pendingFollowups: [],
      recentTasks: [],
      sessionHistory: []
    });

    let changeCount = 0;

    // 완료된 태스크 중 아직 Unified에 없는 것 추가
    for (const phase of planData.phases) {
      for (const task of phase.tasks) {
        if (task.status === 'completed' && !task.syncedToUnified) {
          // recentTasks에 추가
          unifiedState.recentTasks = unifiedState.recentTasks || [];

          // 중복 체크
          const exists = unifiedState.recentTasks.some(t =>
            t.title === task.title && t.source === 'planning'
          );

          if (!exists) {
            unifiedState.recentTasks.unshift({
              title: task.title,
              status: 'completed',
              source: 'planning',
              planId: planData.planId,
              phase: phase.id,
              completedAt: task.completedAt || new Date().toISOString()
            });

            task.syncedToUnified = true;
            changeCount++;

            this.changes.planToUnified.push({
              task: task.title,
              phase: phase.id
            });

            console.log(`  [+] ${task.title} -> Unified (legacy)`);
          }
        }
      }
    }

    // 최근 20개만 유지
    if (unifiedState.recentTasks.length > 20) {
      unifiedState.recentTasks = unifiedState.recentTasks.slice(0, 20);
    }

    // 변경 사항이 있으면 트랜잭션으로 저장
    if (changeCount > 0) {
      unifiedState.lastUpdated = new Date().toISOString();

      // Planning 파일 경로 가져오기
      const { filePath: planFile } = findActivePlanFile();

      // 트랜잭션으로 다중 파일 원자적 저장
      const tx = new FileTransaction({ logging: false });
      tx.add(UNIFIED_STATE_FILE, unifiedState);
      if (planFile) {
        tx.add(planFile, planData);
      }

      const txResult = tx.commit();
      if (txResult.success) {
        console.log(`[+] Planning -> Unified (legacy): ${changeCount}개 태스크 동기화 완료 (TX: ${tx.id})`);
      } else {
        console.log(`[-] Planning -> Unified: 트랜잭션 실패 - ${txResult.error}`);
        return { success: false, changes: 0, error: txResult.error };
      }
    } else {
      console.log('[*] Planning -> Unified: 동기화할 변경 사항 없음');
    }

    return { success: true, changes: changeCount };
  }

  /**
   * 전체 동기화 실행 (Mutex 보호)
   */
  runFullSync() {
    console.log('\n========================================');
    console.log('  Bidirectional Sync - Full Sync v2.0');
    console.log('========================================\n');

    // Mutex 획득 시도
    if (!acquireMutex()) {
      return {
        success: false,
        error: 'Another sync in progress',
        shrimpToPlan: 0,
        planToUnified: 0
      };
    }

    const startTime = Date.now();

    try {
      // 1. Shrimp → Planning
      const shrimpResult = this.syncFromShrimp();

      // 2. Planning → Unified
      const unifiedResult = this.syncToUnified();

      // 3. 동기화 로그 저장
      this.saveSyncLog(shrimpResult, unifiedResult);

      const elapsed = Date.now() - startTime;

      console.log('\n--- 동기화 결과 ---');
      console.log(`[*] Shrimp -> Planning: ${shrimpResult.changes}개`);
      console.log(`[*] Planning -> Unified: ${unifiedResult.changes}개`);
      console.log(`[*] 소요 시간: ${elapsed}ms`);
      console.log('[+] 트랜잭션 기반 원자적 저장 완료');
      console.log('========================================\n');

      return {
        success: true,
        shrimpToPlan: shrimpResult.changes,
        planToUnified: unifiedResult.changes,
        elapsed,
        changes: this.changes
      };

    } finally {
      // Mutex 해제 (항상 실행)
      releaseMutex();
    }
  }

  /**
   * 동기화 로그 저장
   */
  saveSyncLog(shrimpResult, unifiedResult) {
    this.syncLog.lastSync = new Date().toISOString();
    this.syncLog.syncStats.shrimpToPlan += shrimpResult.changes;
    this.syncLog.syncStats.planToUnified += unifiedResult.changes;
    
    // 히스토리에 추가
    this.syncLog.syncHistory.push({
      timestamp: this.syncLog.lastSync,
      shrimpToPlan: shrimpResult.changes,
      planToUnified: unifiedResult.changes,
      changes: this.changes
    });
    
    // 히스토리 최대 50개 유지
    if (this.syncLog.syncHistory.length > 50) {
      this.syncLog.syncHistory = this.syncLog.syncHistory.slice(-50);
    }
    
    safeWriteJSON(SYNC_LOG_FILE, this.syncLog);
  }
}

// ============================================
// CLI 처리
// ============================================

function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const sync = new BidirectionalSync();
  
  switch (command) {
    case 'shrimp':
    case 's':
      sync.syncFromShrimp();
      break;
      
    case 'unified':
    case 'u':
      sync.syncToUnified();
      break;
      
    case 'status':
      const log = loadSyncLog();
      console.log('\n--- Bidirectional Sync Status ---');
      console.log(`[*] 마지막 동기화: ${log.lastSync || 'N/A'}`);
      console.log(`[*] 총 Shrimp->Plan: ${log.syncStats?.shrimpToPlan || 0}회`);
      console.log(`[*] 총 Plan->Unified: ${log.syncStats?.planToUnified || 0}회`);
      console.log(`[*] 히스토리: ${log.syncHistory?.length || 0}개`);
      console.log('');
      break;
      
    case 'full':
    default:
      sync.runFullSync();
      break;
  }
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = BidirectionalSync;

// CLI 실행
if (require.main === module) {
  handleCLI();
}

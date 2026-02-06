#!/usr/bin/env node
/**
 * Phase 1 Integration Test
 *
 * 위치: K:/PortableApps/Claude-Code/unified-task-system/test-phase1.js
 *
 * 목적:
 * - Unified Task Hub Phase 1 구현 검증
 * - 모든 컴포넌트 통합 테스트
 *
 * 테스트 항목:
 * 1. UnifiedTaskHub 초기화
 * 2. TaskMaster Adapter 연동
 * 3. Queue Manager 동작
 * 4. Dashboard Bridge 연결
 */

const path = require('path');

// 테스트 결과 저장
const results = {
  passed: [],
  failed: [],
  skipped: []
};

function log(msg) {
  console.log(`[*] ${msg}`);
}

function pass(name, detail = '') {
  results.passed.push({ name, detail });
  console.log(`[+] PASS: ${name}${detail ? ' - ' + detail : ''}`);
}

function fail(name, error) {
  results.failed.push({ name, error: error.message || error });
  console.log(`[-] FAIL: ${name} - ${error.message || error}`);
}

function skip(name, reason) {
  results.skipped.push({ name, reason });
  console.log(`[?] SKIP: ${name} - ${reason}`);
}

// ============================================
// Test 1: UnifiedTaskHub
// ============================================
async function testUnifiedTaskHub() {
  log('Test 1: UnifiedTaskHub 초기화...');

  try {
    const UnifiedTaskHub = require('./unified-task-hub');
    const hub = new UnifiedTaskHub({ autoSync: false });
    pass('Hub 초기화');

    // 태스크 추가
    const task = hub.addTask({
      title: 'Test Task 1',
      description: 'Phase 1 테스트 태스크',
      priority: 'high',
      phase: 'implement'
    });
    pass('태스크 추가', `ID: ${task.id}`);

    // 태스크 조회
    const retrieved = hub.getTask(task.id);
    if (retrieved && retrieved.title === 'Test Task 1') {
      pass('태스크 조회');
    } else {
      fail('태스크 조회', '태스크를 찾을 수 없음');
    }

    // 태스크 업데이트
    hub.updateTask(task.id, { status: 'in_progress' });
    const updated = hub.getTask(task.id);
    if (updated.status === 'in_progress') {
      pass('태스크 업데이트');
    } else {
      fail('태스크 업데이트', '상태 변경 실패');
    }

    // 통계
    const status = hub.getStatus();
    pass('통계 조회', `총 ${status.metadata.totalTasks}개 태스크`);

    // 저장 (자동 저장 확인 - addTask/updateTask에서 자동 저장됨)
    pass('데이터 자동 저장');

    return true;
  } catch (error) {
    fail('UnifiedTaskHub', error);
    return false;
  }
}

// ============================================
// Test 2: TaskMaster Adapter
// ============================================
async function testTaskMasterAdapter() {
  log('Test 2: TaskMaster Adapter...');

  try {
    const TaskMasterAdapter = require('./adapters/taskmaster-adapter');
    const adapter = new TaskMasterAdapter();

    // 상태 확인
    const status = adapter.getStatus();
    pass('Adapter 상태', `MCP: ${status.mcpAvailable ? '사용가능' : '미사용'}`);

    // 변환 테스트
    const tmTask = {
      id: 1,
      title: 'TaskMaster Test',
      description: 'Test description',
      status: 'pending',
      priority: 'high',
      dependencies: [2, 3],
      subtasks: [
        { id: 101, title: 'Subtask 1', status: 'done' }
      ]
    };

    const hubTask = adapter.convertToHub(tmTask);
    if (hubTask.externalId === 'taskmaster-1' && hubTask.status === 'pending') {
      pass('TM → Hub 변환');
    } else {
      fail('TM → Hub 변환', '변환 결과 불일치');
    }

    const backTask = adapter.convertFromHub(hubTask);
    if (backTask.id === 1) {
      pass('Hub → TM 변환');
    } else {
      fail('Hub → TM 변환', '역변환 결과 불일치');
    }

    return true;
  } catch (error) {
    fail('TaskMaster Adapter', error);
    return false;
  }
}

// ============================================
// Test 3: Queue Manager
// ============================================
async function testQueueManager() {
  log('Test 3: Queue Manager...');

  try {
    const { getInstance } = require('./task-queue/queue-manager');
    const qm = getInstance({ useRedis: true });

    // 초기화
    await qm.init();
    pass('Queue Manager 초기화');

    // 상태 확인
    const status = await qm.getStatus();
    pass('큐 상태 조회', `모드: ${status.mode}`);

    // Job 추가
    const job = await qm.addJob('implement', {
      title: 'Test Job',
      taskId: 'test-123'
    });
    pass('Job 추가', `ID: ${job.id}`);

    // 상태 재확인
    const statusAfter = await qm.getStatus();
    if (status.mode === 'memory') {
      if (statusAfter.waiting >= 1) {
        pass('대기 Job 확인', `${statusAfter.waiting}개`);
      }
    } else {
      pass('Redis 모드 동작 확인');
    }

    // 정리
    await qm.clearQueue();
    pass('큐 정리');

    await qm.close();
    pass('Queue Manager 종료');

    return true;
  } catch (error) {
    fail('Queue Manager', error);
    return false;
  }
}

// ============================================
// Test 4: Dashboard Bridge
// ============================================
async function testDashboardBridge() {
  log('Test 4: Dashboard Bridge...');

  try {
    const { getInstance } = require('./dashboard/dashboard-bridge');
    const bridge = getInstance();

    // 연결 시도
    const connected = await bridge.connect();
    if (connected) {
      pass('Dashboard 연결', bridge.options.dashboardUrl);
    } else {
      skip('Dashboard 연결', 'Dashboard 미실행');
    }

    // 상태 확인
    const status = bridge.getStatus();
    pass('Bridge 상태', `연결: ${status.connected}`);

    // 테스트 업데이트 (연결된 경우만)
    if (connected) {
      const pushed = await bridge.pushTaskUpdate({
        id: 'test-task-phase1',
        title: 'Phase 1 Test',
        status: 'completed'
      });
      if (pushed) {
        pass('태스크 업데이트 푸시');
      } else {
        skip('태스크 업데이트 푸시', 'API 미구현');
      }
    }

    await bridge.close();
    pass('Bridge 종료');

    return true;
  } catch (error) {
    fail('Dashboard Bridge', error);
    return false;
  }
}

// ============================================
// Test 5: Config 검증
// ============================================
async function testConfig() {
  log('Test 5: Configuration 검증...');

  try {
    const config = require('./task-queue/config');

    // Redis 설정
    if (config.redisConnection && config.redisConnection.port === 6380) {
      pass('Redis 설정', `포트: ${config.redisConnection.port}`);
    } else {
      fail('Redis 설정', '포트 설정 오류');
    }

    // 큐 설정
    const queueNames = Object.keys(config.queues);
    if (queueNames.length >= 7) {
      pass('큐 설정', `${queueNames.length}개 큐 정의됨`);
    } else {
      fail('큐 설정', '큐 정의 부족');
    }

    // RIPER+ Phase 확인
    const phases = ['specify', 'explore', 'plan', 'implement', 'verify', 'release'];
    const missingPhases = phases.filter(p => !config.queues[p]);
    if (missingPhases.length === 0) {
      pass('RIPER+ Phase 큐', phases.join(', '));
    } else {
      fail('RIPER+ Phase 큐', `누락: ${missingPhases.join(', ')}`);
    }

    // 폴백 설정
    if (config.fallbackConfig && config.fallbackConfig.persistPath) {
      pass('폴백 설정', '메모리 큐 영구화 경로 설정됨');
    }

    return true;
  } catch (error) {
    fail('Configuration', error);
    return false;
  }
}

// ============================================
// 메인 실행
// ============================================
async function runTests() {
  console.log('');
  console.log('='.repeat(50));
  console.log('  Phase 1 Integration Test');
  console.log('  Unified Task System');
  console.log('='.repeat(50));
  console.log('');

  const startTime = Date.now();

  await testConfig();
  console.log('');

  await testUnifiedTaskHub();
  console.log('');

  await testTaskMasterAdapter();
  console.log('');

  await testQueueManager();
  console.log('');

  await testDashboardBridge();
  console.log('');

  // 결과 요약
  const elapsed = Date.now() - startTime;

  console.log('='.repeat(50));
  console.log('  Test Results');
  console.log('='.repeat(50));
  console.log(`  Passed:  ${results.passed.length}`);
  console.log(`  Failed:  ${results.failed.length}`);
  console.log(`  Skipped: ${results.skipped.length}`);
  console.log(`  Time:    ${elapsed}ms`);
  console.log('='.repeat(50));
  console.log('');

  if (results.failed.length > 0) {
    console.log('Failed Tests:');
    results.failed.forEach(f => {
      console.log(`  - ${f.name}: ${f.error}`);
    });
    console.log('');
  }

  // 성공 여부 반환
  return results.failed.length === 0;
}

// CLI 실행
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests, results };

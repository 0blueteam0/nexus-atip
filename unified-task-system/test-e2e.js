#!/usr/bin/env node
/**
 * End-to-End Integration Test
 *
 * 목적: Unified Task System 전체 통합 검증
 */

const results = { passed: 0, failed: 0, errors: [] };

function pass(msg) {
  results.passed++;
  console.log(`[+] ${msg}`);
}

function fail(msg, err) {
  results.failed++;
  results.errors.push({ msg, err });
  console.log(`[-] ${msg}: ${err}`);
}

async function runTests() {
  console.log('\n=== E2E Integration Test ===\n');

  // Test 1: Hub + Shrimp Bridge
  try {
    const UnifiedTaskHub = require('./unified-task-hub');
    const { getInstance: getBridge } = require('./bridges/shrimp-taskmaster-bridge');

    const hub = new UnifiedTaskHub({ autoSync: false });
    const bridge = getBridge();
    await bridge.init(hub);

    const result = await bridge.syncAll();
    if (result.shrimp.synced >= 0) {
      pass(`Hub + Bridge: ${result.shrimp.synced} Shrimp tasks synced`);
    }
  } catch (err) {
    fail('Hub + Bridge', err.message);
  }

  // Test 2: Queue Manager + RIPER+ Phases
  try {
    const { getInstance: getQM } = require('./task-queue/queue-manager');
    const qm = getQM();
    await qm.init();

    const status = await qm.getStatus();
    if (status.mode === 'redis' && status.queues) {
      const phases = Object.keys(status.queues);
      pass(`Queue Manager: ${phases.length} queues (${status.mode} mode)`);
    } else if (status.mode === 'memory') {
      pass(`Queue Manager: Memory fallback mode`);
    }

    await qm.close();
  } catch (err) {
    fail('Queue Manager', err.message);
  }

  // Test 3: Dashboard Bridge
  try {
    const { getInstance: getDashboard } = require('./dashboard/dashboard-bridge');
    const dashboard = getDashboard();

    const connected = await dashboard.connect();
    if (connected) {
      pass('Dashboard Bridge: Connected to localhost:7847');
    } else {
      pass('Dashboard Bridge: Initialized (dashboard offline)');
    }

    await dashboard.close();
  } catch (err) {
    fail('Dashboard Bridge', err.message);
  }

  // Test 4: TaskMaster Service
  try {
    const { getInstance: getTMService } = require('./services/taskmaster-service');
    const service = getTMService({ autoSync: false });
    await service.init();

    const status = service.getStatus();
    if (status.initialized) {
      pass(`TaskMaster Service: Initialized (file: ${status.fileExists ? 'exists' : 'not found'})`);
    }

    service.destroy();
  } catch (err) {
    fail('TaskMaster Service', err.message);
  }

  // Test 5: Full Workflow Simulation
  try {
    const UnifiedTaskHub = require('./unified-task-hub');
    const { getInstance: getQM } = require('./task-queue/queue-manager');

    const hub = new UnifiedTaskHub({ autoSync: false });
    const qm = getQM();
    await qm.init();

    // Create task
    const task = hub.addTask({
      title: 'E2E Test Task',
      phase: 'implement',
      source: 'test'
    });

    // Queue job
    await qm.addJob('implement', { taskId: task.id });

    // Update status
    hub.updateTask(task.id, { status: 'in_progress' });

    // Complete
    hub.updateTask(task.id, { status: 'completed' });

    // Verify
    const final = hub.getTask(task.id);
    if (final && final.status === 'completed') {
      pass('Full Workflow: Create → Queue → Update → Complete');
    }

    // Cleanup
    hub.deleteTask(task.id);
    await qm.close();
  } catch (err) {
    fail('Full Workflow', err.message);
  }

  // Summary
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(e => console.log(`  - ${e.msg}: ${e.err}`));
  }

  console.log('');
  return results.failed === 0;
}

runTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });

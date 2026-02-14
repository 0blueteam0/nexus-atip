#!/usr/bin/env node
/**
 * Ecosystem CLI
 * 
 * 위치: K:/PortableApps/genai/ecosystem-cli.js
 * 
 * 목적:
 * - Task Management Ecosystem 통합 관리
 * - Docker 서비스, Hub, LangGraph, Dashboard 제어
 * - 상태 조회, 동기화, 워크플로우 실행
 * 
 * 사용법:
 *   node ecosystem-cli.js status
 *   node ecosystem-cli.js start [--minimal]
 *   node ecosystem-cli.js sync
 *   node ecosystem-cli.js workflow <taskId>
 * 
 * @module ecosystem-cli
 * @version 1.0.0
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 경로 설정
const BASE_PATH = 'K:/PortableApps/genai';
const HUB_PATH = path.join(BASE_PATH, 'unified-task-system', 'unified-task-hub.js');
const EVENT_BUS_PATH = path.join(BASE_PATH, 'unified-task-system', 'event-bus.js');
const LANGGRAPH_PATH = path.join(BASE_PATH, 'langgraph-system');

// 색상 출력
const colors = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  dim: (t) => `\x1b[2m${t}\x1b[0m`
};

// Docker 서비스 정의
const DOCKER_SERVICES = [
  { name: 'plan-ecosystem-dashboard', port: 7847, critical: true },
  { name: 'searxng-crawl4ai-mcp-redis-1', port: 6380, critical: true, displayName: 'redis' },
  { name: 'firecrawl-api-1', port: 3002, critical: false },
  { name: 'searxng', port: 8082, critical: false },
  { name: 'crawl4ai', port: 8001, critical: false },
  { name: 'n8n-automation', port: 5678, critical: false }
];

/**
 * Docker 서비스 상태 확인
 */
function checkDockerServices() {
  const results = [];
  
  for (const service of DOCKER_SERVICES) {
    try {
      const status = execSync(
        `docker inspect --format="{{.State.Status}}" ${service.name} 2>nul`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();
      
      results.push({
        ...service,
        status: status === 'running' ? 'up' : status,
        healthy: status === 'running'
      });
    } catch (e) {
      results.push({ ...service, status: 'down', healthy: false });
    }
  }
  
  return results;
}


/**
 * Hub 상태 조회
 */
function getHubStatus() {
  try {
    const UnifiedTaskHub = require(HUB_PATH);
    const hub = new UnifiedTaskHub({ autoSync: false });
    return hub.getStatus();
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Event Bus 상태 조회
 */
function getEventBusStatus() {
  try {
    const { getInstance } = require(EVENT_BUS_PATH);
    const bus = getInstance();
    return bus.getStatus();
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * LangGraph 상태 조회
 */
function getLangGraphStatus() {
  try {
    const { getHubAdapter } = require(path.join(LANGGRAPH_PATH, 'hub-adapter.js'));
    const adapter = getHubAdapter();
    return adapter.getStatus();
  } catch (error) {
    return { error: error.message };
  }
}


/**
 * 전체 상태 출력
 */
function printStatus() {
  console.log('\n' + '='.repeat(50));
  console.log('  Task Management Ecosystem - Status');
  console.log('='.repeat(50) + '\n');

  // Docker 서비스
  console.log(colors.cyan('Docker Services:'));
  const docker = checkDockerServices();
  let allCriticalUp = true;
  
  for (const s of docker) {
    const icon = s.healthy ? colors.green('[+]') : colors.red('[-]');
    const critical = s.critical ? colors.yellow('*') : ' ';
    const displayName = s.displayName || s.name;
    console.log(`  ${icon}${critical} ${displayName}:${s.port} - ${s.status}`);
    if (s.critical && !s.healthy) allCriticalUp = false;
  }
  console.log(colors.dim('  (* = critical service)'));

  // Hub 상태
  console.log('\n' + colors.cyan('Unified Task Hub:'));
  const hub = getHubStatus();
  if (hub.error) {
    console.log(`  ${colors.red('[-]')} Error: ${hub.error}`);
  } else {
    console.log(`  [*] Total Tasks: ${hub.metadata?.totalTasks || 0}`);
    console.log(`  [+] Completed: ${hub.metadata?.completedTasks || 0}`);
    console.log(`  [-] Pending: ${hub.metadata?.pendingTasks || 0}`);
  }

  // Event Bus 상태
  console.log('\n' + colors.cyan('Event Bus:'));
  const eventBus = getEventBusStatus();
  if (eventBus.error) {
    console.log(`  ${colors.red('[-]')} Error: ${eventBus.error}`);
  } else {
    console.log(`  [*] Started: ${eventBus.started ? 'Yes' : 'No'}`);
    console.log(`  [*] Subscribers: ${eventBus.subscribers || 0}`);
    console.log(`  [*] Event Log: ${eventBus.eventLogSize || 0} events`);
  }


  // LangGraph 상태
  console.log('\n' + colors.cyan('LangGraph Adapter:'));
  const langGraph = getLangGraphStatus();
  if (langGraph.error) {
    console.log(`  ${colors.red('[-]')} Error: ${langGraph.error}`);
  } else {
    console.log(`  [*] Active Workflows: ${langGraph.activeWorkflows || 0}`);
    if (langGraph.workflows?.length > 0) {
      for (const wf of langGraph.workflows) {
        console.log(`      - ${wf.taskId} (${wf.threadId})`);
      }
    }
  }

  // 전체 상태
  console.log('\n' + '='.repeat(50));
  const overallStatus = allCriticalUp ? colors.green('HEALTHY') : colors.red('DEGRADED');
  console.log(`  Ecosystem Status: ${overallStatus}`);
  console.log('='.repeat(50) + '\n');
}

/**
 * Docker 서비스 시작
 */
function startServices(minimal = false) {
  console.log('\n[*] Starting Docker services...\n');

  // Docker 실행 확인
  try {
    execSync('docker info', { stdio: 'pipe' });
  } catch (e) {
    console.log(colors.red('[!] Docker is not running. Please start Docker Desktop.'));
    return;
  }

  // 네트워크 생성 (없으면)
  try {
    execSync('docker network create plan-ecosystem-network 2>nul', { stdio: 'pipe' });
    console.log('[+] Created plan-ecosystem-network');
  } catch (e) {
    // 이미 존재하면 무시
  }


  // Dashboard 시작 (항상)
  const dashboardPath = path.join(BASE_PATH, 'dashboard', 'plan-ecosystem');
  try {
    execSync(`cd "${dashboardPath}" && docker compose up -d`, { stdio: 'inherit' });
    console.log('[+] Dashboard started');
  } catch (e) {
    console.log(colors.yellow('[!] Dashboard start failed (may already be running)'));
  }

  if (!minimal) {
    // Firecrawl
    const firecrawlPath = path.join(BASE_PATH, 'mcp-servers', 'firecrawl-self-hosted');
    if (fs.existsSync(firecrawlPath)) {
      try {
        execSync(`cd "${firecrawlPath}" && docker compose up -d`, { stdio: 'inherit' });
        console.log('[+] Firecrawl started');
      } catch (e) {
        console.log(colors.yellow('[!] Firecrawl start failed'));
      }
    }

    // SearXNG
    const searxngPath = path.join(BASE_PATH, 'mcp-servers', 'searxng-crawl4ai-mcp');
    if (fs.existsSync(searxngPath)) {
      try {
        execSync(`cd "${searxngPath}" && docker compose up -d`, { stdio: 'inherit' });
        console.log('[+] SearXNG started');
      } catch (e) {
        console.log(colors.yellow('[!] SearXNG start failed'));
      }
    }

    // n8n (optional)
    const n8nPath = path.join(BASE_PATH, 'mcp-servers', 'n8n');
    if (fs.existsSync(path.join(n8nPath, 'docker-compose.yml'))) {
      try {
        execSync(`cd "${n8nPath}" && docker compose up -d`, { stdio: 'inherit' });
        console.log('[+] n8n started');
      } catch (e) {
        console.log(colors.yellow('[!] n8n start failed'));
      }
    }
  }

  console.log('\n[+] Services started. Run "status" to check.');
}


/**
 * Hub 동기화
 */
async function syncHub() {
  console.log('\n[*] Synchronizing Hub...\n');
  
  try {
    const UnifiedTaskHub = require(HUB_PATH);
    const hub = new UnifiedTaskHub({ autoSync: false });
    const results = await hub.syncAll();
    
    console.log('[+] Sync completed:');
    for (const [name, result] of Object.entries(results)) {
      const icon = result.success ? colors.green('[+]') : colors.red('[-]');
      console.log(`  ${icon} ${name}: ${result.synced} tasks`);
    }
  } catch (error) {
    console.log(colors.red(`[!] Sync failed: ${error.message}`));
  }
}

/**
 * 워크플로우 시작
 */
async function startWorkflow(taskId) {
  console.log(`\n[*] Starting RIPER+ workflow for task: ${taskId}\n`);
  
  try {
    const { getHubAdapter } = require(path.join(LANGGRAPH_PATH, 'hub-adapter.js'));
    const UnifiedTaskHub = require(HUB_PATH);
    
    const hub = new UnifiedTaskHub({ autoSync: false });
    const task = hub.getTask(taskId);
    
    if (!task) {
      console.log(colors.red(`[!] Task not found: ${taskId}`));
      return;
    }

    console.log(`[*] Task: ${task.title}`);
    console.log(`[*] Status: ${task.status}`);
    
    const adapter = getHubAdapter();
    const threadId = adapter.startWorkflow(task);
    
    console.log(colors.green(`[+] Workflow started: ${threadId}`));
    console.log('[*] Monitor progress in Dashboard: http://localhost:7847');
  } catch (error) {
    console.log(colors.red(`[!] Workflow start failed: ${error.message}`));
  }
}


/**
 * 도움말 출력
 */
function printHelp() {
  console.log(`
${colors.cyan('Task Management Ecosystem CLI')}

Usage: node ecosystem-cli.js <command> [options]

Commands:
  ${colors.green('status')}             Show ecosystem status
  ${colors.green('start')}              Start all Docker services
  ${colors.green('start --minimal')}    Start only critical services (Dashboard, Redis)
  ${colors.green('sync')}               Synchronize Hub with all adapters
  ${colors.green('workflow <taskId>')}  Start RIPER+ workflow for task

Examples:
  node ecosystem-cli.js status
  node ecosystem-cli.js start --minimal
  node ecosystem-cli.js sync
  node ecosystem-cli.js workflow hub-12345-abc12

Dashboard: http://localhost:7847
  `);
}

// ============================================
// Main
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'status':
      printStatus();
      break;

    case 'start':
      const minimal = args.includes('--minimal');
      startServices(minimal);
      break;

    case 'sync':
      await syncHub();
      break;

    case 'workflow':
      const taskId = args[1];
      if (!taskId) {
        console.log(colors.red('[!] Task ID required'));
        console.log('Usage: node ecosystem-cli.js workflow <taskId>');
        process.exit(1);
      }
      await startWorkflow(taskId);
      break;

    case 'help':
    case '--help':
    case '-h':
    default:
      printHelp();
      break;
  }
}

main().catch(console.error);

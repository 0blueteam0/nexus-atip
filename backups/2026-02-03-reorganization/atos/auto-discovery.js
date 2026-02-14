/**
 * ATOS Auto-Discovery System
 * 새 MCP/에이전트/Skills/워크플로우 자동 감지 및 통합
 *
 * 위치: K:/PortableApps/genai/atos/auto-discovery.js
 *
 * 핵심 기능:
 * - 파일 시스템 감시 (fs.watch)
 * - 새 도구 자동 감지
 * - tool-registry.json 자동 업데이트
 * - 카테고리/키워드 자동 추론
 * - 발견 로그 기록
 *
 * 사용법:
 *   const discovery = require('./auto-discovery.js');
 *   discovery.initialScan();     // 초기 스캔
 *   discovery.startWatching();   // 실시간 감시 시작
 *   discovery.stopWatching();    // 감시 중지
 */

const fs = require('fs');
const path = require('path');

// 경로 설정
const BASE_PATH = path.resolve(__dirname, '..');
const ATOS_PATH = __dirname;
const WATCHERS_FILE = path.join(ATOS_PATH, 'watchers.json');
const REGISTRY_FILE = path.join(ATOS_PATH, 'tool-registry.json');
const DISCOVERY_LOG_FILE = path.join(ATOS_PATH, 'discovery-log.json');
const PLAN_REGISTRY_FILE = path.join(ATOS_PATH, 'plan-registry.json');
const PLANS_PATH = path.join(BASE_PATH, 'plans');

// 상태
let watchers = null;
let registry = null;
let discoveryLog = null;
let activeWatchers = new Map();
let isWatching = false;

// ============================================
// 유틸리티 함수
// ============================================

function safeReadJSON(filePath, defaultValue = null) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`[!] 파일 읽기 실패 (${path.basename(filePath)}):`, error.message);
  }
  return defaultValue;
}

function safeWriteJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 백업 생성
    if (fs.existsSync(filePath) && watchers?.settings?.backupBeforeUpdate) {
      const backupPath = filePath + '.backup';
      fs.copyFileSync(filePath, backupPath);
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`[!] 파일 쓰기 실패:`, error.message);
    return false;
  }
}

/**
 * glob 패턴을 정규식으로 변환
 */
function globToRegex(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

/**
 * glob 패턴으로 파일 찾기 (간단한 구현)
 */
function findByGlob(baseDir, pattern) {
  const results = [];
  const parts = pattern.split('/');

  function search(currentPath, partIndex) {
    if (partIndex >= parts.length) {
      if (fs.existsSync(currentPath)) {
        results.push(currentPath);
      }
      return;
    }

    const part = parts[partIndex];
    const fullPath = path.join(currentPath, part);

    if (part === '*' || part === '**') {
      // 와일드카드 처리
      try {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
          const entryPath = path.join(currentPath, entry.name);
          if (entry.isDirectory()) {
            search(entryPath, partIndex + 1);
            if (part === '**') {
              search(entryPath, partIndex); // 재귀적으로 더 깊이
            }
          } else if (partIndex === parts.length - 1) {
            // 마지막 부분이면 파일도 포함
            const regex = globToRegex(parts[partIndex]);
            if (regex.test(entry.name)) {
              results.push(entryPath);
            }
          }
        }
      } catch (e) {
        // 디렉토리 접근 실패 무시
      }
    } else if (part.includes('*')) {
      // 부분 와일드카드 (예: *.json)
      try {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        const regex = globToRegex(part);
        for (const entry of entries) {
          if (regex.test(entry.name)) {
            const entryPath = path.join(currentPath, entry.name);
            if (partIndex === parts.length - 1) {
              results.push(entryPath);
            } else if (entry.isDirectory()) {
              search(entryPath, partIndex + 1);
            }
          }
        }
      } catch (e) {
        // 무시
      }
    } else {
      // 정확한 경로
      if (fs.existsSync(fullPath)) {
        if (partIndex === parts.length - 1) {
          results.push(fullPath);
        } else {
          search(fullPath, partIndex + 1);
        }
      }
    }
  }

  search(baseDir, 0);
  return results;
}

// ============================================
// 데이터 로드
// ============================================

function loadWatchers() {
  if (!watchers) {
    watchers = safeReadJSON(WATCHERS_FILE, { watchPaths: [], settings: {} });
  }
  return watchers;
}

function loadRegistry() {
  if (!registry) {
    registry = safeReadJSON(REGISTRY_FILE, { mcpServers: {}, skills: {}, agents: {}, workflows: {} });
  }
  return registry;
}

function loadDiscoveryLog() {
  if (!discoveryLog) {
    discoveryLog = safeReadJSON(DISCOVERY_LOG_FILE, {
      discoveries: [],
      statistics: {
        totalDiscovered: 0,
        byType: {
          'mcp-server': 0,
          'skill': 0,
          'agent': 0,
          'workflow': 0,
          'command': 0,
          'hook': 0
        }
      }
    });
  }
  return discoveryLog;
}

function saveRegistry() {
  registry.lastUpdated = new Date().toISOString();
  return safeWriteJSON(REGISTRY_FILE, registry);
}

function saveDiscoveryLog() {
  return safeWriteJSON(DISCOVERY_LOG_FILE, discoveryLog);
}

// ============================================
// 카테고리/키워드 추론
// ============================================

/**
 * 이름/경로에서 카테고리 자동 추론
 */
function inferCategory(name, description = '') {
  loadWatchers();
  const rules = watchers.categoryInference?.rules || [];
  const combined = `${name} ${description}`.toLowerCase();

  for (const rule of rules) {
    const patterns = rule.pattern.split('|');
    for (const pattern of patterns) {
      if (combined.includes(pattern)) {
        return rule.category;
      }
    }
  }

  return 'general';
}

/**
 * 설명에서 트리거 키워드 추출
 */
function extractKeywords(name, description = '', tools = []) {
  loadWatchers();
  const config = watchers.keywordExtraction || {};
  const stopWords = new Set(config.stopWords || []);
  const minLength = config.minKeywordLength || 2;
  const maxKeywords = config.maxKeywords || 10;

  const keywords = new Set();

  // 도구 이름에서 추출
  if (config.includeToolNameParts !== false) {
    const nameParts = name.split(/[-_\s]+/);
    nameParts.forEach(part => {
      const lower = part.toLowerCase();
      if (lower.length >= minLength && !stopWords.has(lower)) {
        keywords.add(lower);
      }
    });
  }

  // 도구 목록에서 추출
  tools.forEach(tool => {
    const toolParts = tool.split(/[-_\s]+/);
    toolParts.forEach(part => {
      const lower = part.toLowerCase();
      if (lower.length >= minLength && !stopWords.has(lower)) {
        keywords.add(lower);
      }
    });
  });

  // 설명에서 추출 (간단한 단어 추출)
  if (description) {
    const words = description.split(/[\s,.\-_]+/);
    words.forEach(word => {
      const lower = word.toLowerCase();
      if (lower.length >= minLength && !stopWords.has(lower)) {
        keywords.add(lower);
      }
    });
  }

  return Array.from(keywords).slice(0, maxKeywords);
}

// ============================================
// 등록 함수들
// ============================================

/**
 * 발견 로그에 기록
 */
function logDiscovery(type, name, action, metadata = {}) {
  loadDiscoveryLog();

  const entry = {
    timestamp: new Date().toISOString(),
    type: type,
    name: name,
    action: action,
    source: metadata.source || 'auto-discovery',
    metadata: metadata
  };

  discoveryLog.discoveries.unshift(entry);

  // 최대 크기 유지
  const maxSize = watchers?.settings?.maxDiscoveryLogSize || 100;
  if (discoveryLog.discoveries.length > maxSize) {
    discoveryLog.discoveries = discoveryLog.discoveries.slice(0, maxSize);
  }

  // 통계 업데이트
  discoveryLog.statistics.totalDiscovered++;
  if (discoveryLog.statistics.byType[type] !== undefined) {
    discoveryLog.statistics.byType[type]++;
  }

  saveDiscoveryLog();

  if (watchers?.settings?.notifyOnDiscovery) {
    console.log(`[+] 발견: [${type}] ${name} (${action})`);
  }

  return entry;
}

/**
 * MCP 서버 등록
 */
function registerMcpServer(serverName, serverConfig, source = 'auto') {
  loadRegistry();
  loadWatchers();

  const existing = registry.mcpServers[serverName];
  if (existing && !existing.autoDiscovered) {
    console.log(`[*] ${serverName}: 수동 등록된 서버, 스킵`);
    return null;
  }

  // 메타데이터 추출
  const tools = serverConfig.tools || [];
  const description = serverConfig.description || '';
  const category = inferCategory(serverName, description);
  const keywords = extractKeywords(serverName, description, tools);

  const defaults = watchers.registrationDefaults?.['mcp-server'] || {};

  const newEntry = {
    ...defaults,
    tools: tools,
    category: category,
    triggerKeywords: keywords,
    description: description,
    discoveredAt: new Date().toISOString(),
    source: source
  };

  const action = existing ? 'updated' : 'registered';
  registry.mcpServers[serverName] = newEntry;
  saveRegistry();

  logDiscovery('mcp-server', serverName, action, {
    tools: tools,
    category: category,
    source: source
  });

  return newEntry;
}

/**
 * 스킬 등록
 */
function registerSkill(skillPath, source = 'auto') {
  loadRegistry();
  loadWatchers();

  const skillName = path.basename(path.dirname(skillPath));

  // SKILL.md 파싱
  let triggers = [];
  let description = '';

  try {
    const content = fs.readFileSync(skillPath, 'utf8');

    // triggers 추출 (패턴: triggers: [...] 또는 Triggers: ...)
    const triggerMatch = content.match(/triggers?[:\s]+\[([^\]]+)\]/i);
    if (triggerMatch) {
      triggers = triggerMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
    }

    // 첫 번째 단락을 설명으로
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    if (lines.length > 0) {
      description = lines[0].trim();
    }
  } catch (e) {
    console.error(`[!] 스킬 파싱 실패: ${skillPath}`, e.message);
  }

  const existing = registry.skills?.[skillName];
  if (existing && !existing.autoDiscovered) {
    console.log(`[*] ${skillName}: 수동 등록된 스킬, 스킵`);
    return null;
  }

  const defaults = watchers.registrationDefaults?.skill || {};

  const newEntry = {
    ...defaults,
    triggers: triggers.length > 0 ? triggers : extractKeywords(skillName, description),
    description: description,
    path: skillPath,
    discoveredAt: new Date().toISOString(),
    autoDiscovered: true,
    source: source
  };

  if (!registry.skills) registry.skills = {};
  const action = existing ? 'updated' : 'registered';
  registry.skills[skillName] = newEntry;
  saveRegistry();

  logDiscovery('skill', skillName, action, {
    triggers: newEntry.triggers,
    source: source
  });

  return newEntry;
}

/**
 * 에이전트 등록
 */
function registerAgent(agentPath, source = 'auto') {
  loadRegistry();
  loadWatchers();

  const agentName = path.basename(agentPath, '.json');

  let agentConfig = {};
  try {
    agentConfig = safeReadJSON(agentPath, {});
  } catch (e) {
    console.error(`[!] 에이전트 파싱 실패: ${agentPath}`, e.message);
    return null;
  }

  const existing = registry.agents?.[agentName];
  if (existing && !existing.autoDiscovered) {
    return null;
  }

  const defaults = watchers.registrationDefaults?.agent || {};

  const newEntry = {
    ...defaults,
    ...agentConfig,
    discoveredAt: new Date().toISOString(),
    autoDiscovered: true,
    source: source
  };

  if (!registry.agents) registry.agents = {};
  const action = existing ? 'updated' : 'registered';
  registry.agents[agentName] = newEntry;
  saveRegistry();

  logDiscovery('agent', agentName, action, { source: source });

  return newEntry;
}

/**
 * 워크플로우 등록
 */
function registerWorkflow(workflowPath, source = 'auto') {
  loadRegistry();
  loadWatchers();

  const workflowName = path.basename(workflowPath, '.json');

  let workflowConfig = {};
  try {
    workflowConfig = safeReadJSON(workflowPath, {});
  } catch (e) {
    console.error(`[!] 워크플로우 파싱 실패: ${workflowPath}`, e.message);
    return null;
  }

  const existing = registry.workflows?.[workflowName];
  if (existing && !existing.autoDiscovered) {
    return null;
  }

  const defaults = watchers.registrationDefaults?.workflow || {};

  const newEntry = {
    ...defaults,
    ...workflowConfig,
    discoveredAt: new Date().toISOString(),
    autoDiscovered: true,
    source: source
  };

  if (!registry.workflows) registry.workflows = {};
  const action = existing ? 'updated' : 'registered';
  registry.workflows[workflowName] = newEntry;
  saveRegistry();

  logDiscovery('workflow', workflowName, action, { source: source });

  return newEntry;
}

/**
 * 명령어 등록
 */
function registerCommand(commandPath, source = 'auto') {
  loadRegistry();

  const commandName = path.basename(commandPath, '.md');

  let description = '';
  try {
    const content = fs.readFileSync(commandPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    if (lines.length > 0) {
      description = lines[0].trim();
    }
  } catch (e) {
    // 무시
  }

  if (!registry.commands) registry.commands = {};

  const existing = registry.commands[commandName];
  const action = existing ? 'updated' : 'registered';

  registry.commands[commandName] = {
    path: commandPath,
    description: description,
    discoveredAt: new Date().toISOString(),
    autoDiscovered: true,
    source: source
  };

  saveRegistry();
  logDiscovery('command', commandName, action, { source: source });

  return registry.commands[commandName];
}

/**
 * 로컬 MCP 서버 등록
 */
function registerLocalMcp(packagePath, source = 'auto') {
  loadRegistry();

  const serverDir = path.dirname(packagePath);
  const serverName = path.basename(serverDir);

  let packageJson = {};
  try {
    packageJson = safeReadJSON(packagePath, {});
  } catch (e) {
    return null;
  }

  // package.json에서 정보 추출
  const description = packageJson.description || '';
  const keywords = packageJson.keywords || [];

  return registerMcpServer(serverName, {
    tools: [],
    description: description,
    keywords: keywords,
    local: true,
    path: serverDir
  }, source);
}

// ============================================
// 플랜 관리 함수 (ATOS Plan Management)
// ============================================

let planRegistry = null;

/**
 * 플랜 레지스트리 로드
 */
function loadPlanRegistry() {
  if (!planRegistry) {
    planRegistry = safeReadJSON(PLAN_REGISTRY_FILE, {
      version: '1.0.0',
      plans: {},
      statusCounts: { draft: 0, 'in-progress': 0, completed: 0, archived: 0, total: 0 },
      categories: {}
    });
  }
  return planRegistry;
}

/**
 * 플랜 레지스트리 저장
 */
function savePlanRegistry() {
  if (planRegistry) {
    planRegistry.lastUpdated = new Date().toISOString();
    return safeWriteJSON(PLAN_REGISTRY_FILE, planRegistry);
  }
  return false;
}

/**
 * 플랜 메타데이터 추출
 */
function extractPlanMetadata(planPath) {
  try {
    const content = fs.readFileSync(planPath, 'utf8');
    const filename = path.basename(planPath, '.md');

    // 제목 추출 (첫 번째 H1)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : filename;

    // 상태 추출 (명시적 상태 키워드)
    const status = detectPlanStatus(content);

    // 카테고리 추출
    const category = detectPlanCategory(content, filename);

    // 체크박스 분석
    const checkboxes = analyzeCheckboxes(content);

    // 태그 추출
    const tags = extractPlanTags(content);

    // 생성일/수정일
    const stats = fs.statSync(planPath);

    return {
      filename,
      title,
      status,
      category,
      checkboxes,
      tags,
      path: planPath,
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString(),
      size: stats.size
    };
  } catch (error) {
    console.error(`[!] 플랜 메타데이터 추출 실패 (${planPath}):`, error.message);
    return null;
  }
}

/**
 * 플랜 상태 자동 감지
 */
function detectPlanStatus(content) {
  loadWatchers();
  const statusKeywords = watchers?.planSettings?.statusKeywords || {
    draft: ['draft', 'wip', 'todo', 'proposed', '구상', '계획'],
    'in-progress': ['in-progress', 'ongoing', 'active', '진행중', '진행 중', '작업중'],
    completed: ['completed', 'done', 'finished', '완료', '구현 완료'],
    archived: ['archived', 'deprecated', '아카이브', '보관']
  };

  const lowerContent = content.toLowerCase();

  // 명시적 상태 키워드 확인
  for (const [status, keywords] of Object.entries(statusKeywords)) {
    for (const keyword of keywords) {
      // "상태: xxx" 또는 "Status: xxx" 패턴 우선 확인
      const statusPattern = new RegExp(`(상태|status)\\s*:\\s*${keyword}`, 'i');
      if (statusPattern.test(content)) {
        return status;
      }
    }
  }

  // 체크박스 기반 상태 추론
  const checkboxes = analyzeCheckboxes(content);
  if (checkboxes.total > 0) {
    const completionRate = checkboxes.checked / checkboxes.total;
    const thresholds = watchers?.planSettings?.checkboxAnalysis || {
      completedThreshold: 0.9,
      inProgressThreshold: 0.1
    };

    if (completionRate >= thresholds.completedThreshold) {
      return 'completed';
    } else if (completionRate >= thresholds.inProgressThreshold) {
      return 'in-progress';
    }
  }

  return 'draft';
}

/**
 * 플랜 카테고리 감지
 */
function detectPlanCategory(content, filename) {
  const lowerContent = content.toLowerCase();
  const lowerFilename = filename.toLowerCase();

  const categoryPatterns = {
    workflow: ['workflow', '워크플로우', 'process', 'pipeline'],
    feature: ['feature', '기능', 'implement', '구현'],
    bugfix: ['bug', 'fix', '버그', '수정', 'error', 'issue'],
    refactor: ['refactor', '리팩토링', 'cleanup', '정리'],
    documentation: ['doc', '문서', 'readme', 'guide'],
    research: ['research', '조사', 'analysis', '분석', 'study'],
    upgrade: ['upgrade', '업그레이드', 'update', 'migration'],
    system: ['system', '시스템', 'infra', 'config', '설정']
  };

  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    for (const pattern of patterns) {
      if (lowerContent.includes(pattern) || lowerFilename.includes(pattern)) {
        return category;
      }
    }
  }

  return watchers?.registrationDefaults?.plan?.defaultCategory || 'feature';
}

/**
 * 체크박스 분석
 */
function analyzeCheckboxes(content) {
  const unchecked = (content.match(/- \[ \]/g) || []).length;
  const checked = (content.match(/- \[x\]/gi) || []).length;

  return {
    total: unchecked + checked,
    checked,
    unchecked,
    completionRate: (unchecked + checked) > 0 ? checked / (unchecked + checked) : 0
  };
}

/**
 * 플랜 태그 추출
 */
function extractPlanTags(content) {
  const tags = new Set();

  // 명시적 태그 패턴: **태그**: xxx 또는 Tags: xxx
  const tagPattern = /(?:태그|tags?)\s*:\s*([^\n]+)/gi;
  let match;
  while ((match = tagPattern.exec(content)) !== null) {
    const tagList = match[1].split(/[,，、\s]+/).filter(t => t.trim());
    tagList.forEach(t => tags.add(t.trim()));
  }

  // 해시태그 패턴: #태그명
  const hashtagPattern = /#([a-zA-Z가-힣0-9_-]+)/g;
  while ((match = hashtagPattern.exec(content)) !== null) {
    tags.add(match[1]);
  }

  return Array.from(tags);
}

/**
 * 플랜 등록
 */
function registerPlan(planPath, source = 'auto') {
  loadPlanRegistry();

  const metadata = extractPlanMetadata(planPath);
  if (!metadata) return null;

  const planKey = metadata.filename;
  const isNew = !planRegistry.plans[planKey];

  // 레지스트리 업데이트
  const previousStatus = planRegistry.plans[planKey]?.status;

  planRegistry.plans[planKey] = {
    ...metadata,
    registeredAt: planRegistry.plans[planKey]?.registeredAt || new Date().toISOString(),
    lastScannedAt: new Date().toISOString(),
    source
  };

  // 상태 카운트 업데이트
  if (previousStatus && previousStatus !== metadata.status) {
    planRegistry.statusCounts[previousStatus] = Math.max(0, (planRegistry.statusCounts[previousStatus] || 0) - 1);
  }
  if (isNew || previousStatus !== metadata.status) {
    planRegistry.statusCounts[metadata.status] = (planRegistry.statusCounts[metadata.status] || 0) + 1;
  }
  if (isNew) {
    planRegistry.statusCounts.total = (planRegistry.statusCounts.total || 0) + 1;
  }

  // 카테고리 카운트 업데이트
  if (isNew && planRegistry.categories[metadata.category]) {
    planRegistry.categories[metadata.category].count = (planRegistry.categories[metadata.category].count || 0) + 1;
  }

  savePlanRegistry();

  // 발견 로그 기록
  logDiscovery({
    type: 'plan',
    name: metadata.title,
    action: isNew ? 'registered' : 'updated',
    source,
    path: planPath,
    status: metadata.status,
    category: metadata.category
  });

  console.log(`[${isNew ? '+' : '*'}] 플랜 ${isNew ? '등록' : '업데이트'}: ${metadata.title} (${metadata.status})`);

  return metadata;
}

/**
 * 완료된 플랜 등록
 */
function registerCompletedPlan(planPath, source = 'auto') {
  const result = registerPlan(planPath, source);
  if (result) {
    // 이미 completed 폴더에 있으므로 상태 강제 설정
    const planKey = result.filename;
    planRegistry.plans[planKey].status = 'completed';
    planRegistry.plans[planKey].completedAt = planRegistry.plans[planKey].completedAt || new Date().toISOString();
    savePlanRegistry();
  }
  return result;
}

/**
 * 아카이브된 플랜 등록
 */
function registerArchivedPlan(planPath, source = 'auto') {
  const result = registerPlan(planPath, source);
  if (result) {
    // 이미 archived 폴더에 있으므로 상태 강제 설정
    const planKey = result.filename;
    planRegistry.plans[planKey].status = 'archived';
    planRegistry.plans[planKey].archivedAt = planRegistry.plans[planKey].archivedAt || new Date().toISOString();
    savePlanRegistry();
  }
  return result;
}

/**
 * 플랜 상태 변경
 */
function updatePlanStatus(planName, newStatus) {
  loadPlanRegistry();

  const plan = planRegistry.plans[planName];
  if (!plan) {
    console.error(`[!] 플랜을 찾을 수 없음: ${planName}`);
    return false;
  }

  const oldStatus = plan.status;
  const transitions = planRegistry.statusTransitions || {
    draft: ['in-progress'],
    'in-progress': ['completed', 'draft'],
    completed: ['archived', 'in-progress'],
    archived: []
  };

  // 상태 전이 검증
  if (!transitions[oldStatus]?.includes(newStatus)) {
    console.error(`[!] 유효하지 않은 상태 전이: ${oldStatus} -> ${newStatus}`);
    return false;
  }

  // 상태 업데이트
  plan.status = newStatus;
  plan.statusChangedAt = new Date().toISOString();

  // 특별 타임스탬프 설정
  if (newStatus === 'completed') {
    plan.completedAt = new Date().toISOString();
  } else if (newStatus === 'archived') {
    plan.archivedAt = new Date().toISOString();
  }

  // 상태 카운트 업데이트
  planRegistry.statusCounts[oldStatus] = Math.max(0, (planRegistry.statusCounts[oldStatus] || 0) - 1);
  planRegistry.statusCounts[newStatus] = (planRegistry.statusCounts[newStatus] || 0) + 1;

  savePlanRegistry();

  console.log(`[*] 플랜 상태 변경: ${plan.title} (${oldStatus} -> ${newStatus})`);

  return true;
}

/**
 * 플랜 레지스트리 동기화
 */
function syncPlanRegistry() {
  console.log('[*] 플랜 레지스트리 동기화 중...');
  planRegistry = null; // 강제 재로드
  loadPlanRegistry();
  return planRegistry;
}

// ============================================
// 스캔 및 감시
// ============================================

/**
 * .claude.json에서 MCP 서버 스캔
 */
function scanMcpConfig() {
  const claudeJsonPath = path.join(BASE_PATH, '.claude.json');
  const claudeJson = safeReadJSON(claudeJsonPath);

  if (!claudeJson?.mcpServers) {
    return [];
  }

  const discovered = [];
  for (const [serverName, serverConfig] of Object.entries(claudeJson.mcpServers)) {
    // 이미 등록된 서버는 tools 정보만 업데이트 가능
    const result = registerMcpServer(serverName, {
      ...serverConfig,
      tools: serverConfig.tools || []
    }, '.claude.json');

    if (result) {
      discovered.push(serverName);
    }
  }

  return discovered;
}

/**
 * 초기 스캔 (세션 시작 시)
 */
function initialScan() {
  console.log('[*] ATOS Auto-Discovery 초기 스캔 시작...');

  loadWatchers();
  loadRegistry();

  const results = {
    scanned: 0,
    discovered: 0,
    byType: {}
  };

  for (const watchConfig of watchers.watchPaths) {
    const { id, path: watchPath, type, pattern, onDetect } = watchConfig;

    let files = [];

    if (pattern === 'glob') {
      files = findByGlob(BASE_PATH, watchPath);
    } else {
      // 단일 파일
      const fullPath = path.join(BASE_PATH, watchPath);
      if (fs.existsSync(fullPath)) {
        files = [fullPath];
      }
    }

    results.scanned += files.length;

    for (const filePath of files) {
      let result = null;

      switch (onDetect) {
        case 'registerMcpServer':
          // .claude.json 전체 스캔
          const mcpCount = scanMcpConfig().length;
          results.byType['mcp-server'] = (results.byType['mcp-server'] || 0) + mcpCount;
          results.discovered += mcpCount;
          break;

        case 'registerSkill':
          result = registerSkill(filePath, 'initial-scan');
          break;

        case 'registerAgent':
          result = registerAgent(filePath, 'initial-scan');
          break;

        case 'registerWorkflow':
          result = registerWorkflow(filePath, 'initial-scan');
          break;

        case 'registerCommand':
          result = registerCommand(filePath, 'initial-scan');
          break;

        case 'registerLocalMcp':
          result = registerLocalMcp(filePath, 'initial-scan');
          break;

        case 'registerPlan':
          result = registerPlan(filePath, 'initial-scan');
          break;

        case 'registerCompletedPlan':
          result = registerCompletedPlan(filePath, 'initial-scan');
          break;

        case 'registerArchivedPlan':
          result = registerArchivedPlan(filePath, 'initial-scan');
          break;

        case 'syncPlanRegistry':
          // 레지스트리 파일 변경은 동기화만
          syncPlanRegistry();
          break;
      }

      if (result) {
        results.discovered++;
        results.byType[type] = (results.byType[type] || 0) + 1;
      }
    }
  }

  console.log(`[+] 초기 스캔 완료: ${results.scanned}개 검사, ${results.discovered}개 발견`);
  return results;
}

/**
 * 파일 변경 처리
 */
function handleFileChange(watchConfig, filename) {
  const { id, type, onDetect } = watchConfig;
  const fullPath = path.join(BASE_PATH, watchConfig.path.replace('*', filename || ''));

  console.log(`[*] 파일 변경 감지: ${filename || watchConfig.path}`);

  // 디바운싱 적용 (빠른 연속 변경 무시)
  const debounceKey = `${id}-${filename}`;
  if (activeWatchers.has(debounceKey + '-debounce')) {
    return;
  }
  activeWatchers.set(debounceKey + '-debounce', true);
  setTimeout(() => activeWatchers.delete(debounceKey + '-debounce'), watchers?.settings?.debounceMs || 1000);

  switch (onDetect) {
    case 'registerMcpServer':
      scanMcpConfig();
      break;
    case 'registerSkill':
      registerSkill(fullPath, 'file-watch');
      break;
    case 'registerAgent':
      registerAgent(fullPath, 'file-watch');
      break;
    case 'registerWorkflow':
      registerWorkflow(fullPath, 'file-watch');
      break;
    case 'registerCommand':
      registerCommand(fullPath, 'file-watch');
      break;
    case 'registerLocalMcp':
      registerLocalMcp(fullPath, 'file-watch');
      break;
    case 'registerPlan':
      registerPlan(fullPath, 'file-watch');
      break;
    case 'registerCompletedPlan':
      registerCompletedPlan(fullPath, 'file-watch');
      break;
    case 'registerArchivedPlan':
      registerArchivedPlan(fullPath, 'file-watch');
      break;
    case 'syncPlanRegistry':
      syncPlanRegistry();
      break;
  }
}

/**
 * 실시간 감시 시작
 */
function startWatching() {
  if (isWatching) {
    console.log('[*] 이미 감시 중입니다.');
    return;
  }

  loadWatchers();

  if (!watchers?.settings?.enableFileWatch) {
    console.log('[!] 파일 감시가 비활성화되어 있습니다.');
    return;
  }

  console.log('[*] ATOS Auto-Discovery 실시간 감시 시작...');

  for (const watchConfig of watchers.watchPaths) {
    const watchPath = watchConfig.path;

    // glob 패턴인 경우 상위 디렉토리 감시
    let dirToWatch;
    if (watchConfig.pattern === 'glob') {
      const parts = watchPath.split('/');
      const nonGlobParts = [];
      for (const part of parts) {
        if (part.includes('*')) break;
        nonGlobParts.push(part);
      }
      dirToWatch = path.join(BASE_PATH, ...nonGlobParts);
    } else {
      dirToWatch = path.join(BASE_PATH, path.dirname(watchPath));
    }

    if (fs.existsSync(dirToWatch)) {
      try {
        const watcher = fs.watch(dirToWatch, { recursive: true }, (event, filename) => {
          if (event === 'change' || event === 'rename') {
            handleFileChange(watchConfig, filename);
          }
        });

        activeWatchers.set(watchConfig.id, watcher);
        console.log(`  [+] 감시 시작: ${watchConfig.id} (${dirToWatch})`);
      } catch (e) {
        console.error(`  [!] 감시 실패: ${watchConfig.id}`, e.message);
      }
    }
  }

  isWatching = true;
}

/**
 * 감시 중지
 */
function stopWatching() {
  if (!isWatching) {
    return;
  }

  console.log('[*] ATOS Auto-Discovery 감시 중지...');

  for (const [id, watcher] of activeWatchers) {
    if (watcher && typeof watcher.close === 'function') {
      watcher.close();
    }
  }

  activeWatchers.clear();
  isWatching = false;
}

/**
 * 발견 로그 조회
 */
function getDiscoveryLog(limit = 20) {
  loadDiscoveryLog();
  return {
    recent: discoveryLog.discoveries.slice(0, limit),
    statistics: discoveryLog.statistics
  };
}

/**
 * 상태 조회
 */
function getStatus() {
  loadRegistry();
  loadDiscoveryLog();

  return {
    isWatching: isWatching,
    activeWatchers: Array.from(activeWatchers.keys()).filter(k => !k.includes('-debounce')),
    registryCounts: {
      mcpServers: Object.keys(registry.mcpServers || {}).length,
      skills: Object.keys(registry.skills || {}).length,
      agents: Object.keys(registry.agents || {}).length,
      workflows: Object.keys(registry.workflows || {}).length,
      commands: Object.keys(registry.commands || {}).length
    },
    discoveryStats: discoveryLog.statistics,
    lastDiscovery: discoveryLog.discoveries[0] || null
  };
}

// ============================================
// CLI 처리
// ============================================

function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'scan':
      initialScan();
      break;

    case 'watch':
    case 'start':
      initialScan();
      startWatching();
      console.log('\n[*] Ctrl+C로 종료...');
      process.on('SIGINT', () => {
        stopWatching();
        process.exit(0);
      });
      // 프로세스 유지
      setInterval(() => {}, 1000);
      break;

    case 'stop':
      stopWatching();
      break;

    case 'status':
      const status = getStatus();
      console.log('\n--- ATOS Auto-Discovery 상태 ---');
      console.log(`감시 중: ${status.isWatching ? '예' : '아니오'}`);
      console.log(`활성 감시자: ${status.activeWatchers.length}개`);
      console.log('\n등록된 항목:');
      console.log(`  MCP 서버: ${status.registryCounts.mcpServers}개`);
      console.log(`  스킬: ${status.registryCounts.skills}개`);
      console.log(`  에이전트: ${status.registryCounts.agents}개`);
      console.log(`  워크플로우: ${status.registryCounts.workflows}개`);
      console.log(`  명령어: ${status.registryCounts.commands}개`);
      console.log(`\n총 발견: ${status.discoveryStats.totalDiscovered}개`);
      if (status.lastDiscovery) {
        console.log(`마지막 발견: ${status.lastDiscovery.name} (${status.lastDiscovery.timestamp})`);
      }
      console.log('');
      break;

    case 'log':
      const limit = parseInt(args[1]) || 10;
      const log = getDiscoveryLog(limit);
      console.log(`\n--- 최근 발견 (${limit}개) ---\n`);
      if (log.recent.length === 0) {
        console.log('  발견 기록이 없습니다.');
      } else {
        log.recent.forEach((entry, i) => {
          console.log(`${i + 1}. [${entry.type}] ${entry.name}`);
          console.log(`   ${entry.action} - ${entry.timestamp}`);
        });
      }
      console.log('');
      break;

    default:
      console.log('ATOS Auto-Discovery System');
      console.log('');
      console.log('사용법: node auto-discovery.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  scan      초기 스캔 실행');
      console.log('  watch     스캔 후 실시간 감시 시작');
      console.log('  stop      감시 중지');
      console.log('  status    현재 상태 표시');
      console.log('  log [n]   최근 발견 로그 (기본: 10개)');
      console.log('');
  }
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  // 스캔/감시
  initialScan,
  startWatching,
  stopWatching,

  // 등록 함수
  registerMcpServer,
  registerSkill,
  registerAgent,
  registerWorkflow,
  registerCommand,
  registerLocalMcp,

  // 플랜 관리 함수
  loadPlanRegistry,
  savePlanRegistry,
  extractPlanMetadata,
  detectPlanStatus,
  detectPlanCategory,
  analyzeCheckboxes,
  extractPlanTags,
  registerPlan,
  registerCompletedPlan,
  registerArchivedPlan,
  updatePlanStatus,
  syncPlanRegistry,

  // 유틸리티
  inferCategory,
  extractKeywords,
  scanMcpConfig,

  // 조회
  getDiscoveryLog,
  getStatus,

  // 데이터 접근
  loadWatchers,
  loadRegistry,
  loadDiscoveryLog
};

// CLI 실행
if (require.main === module) {
  handleCLI();
}

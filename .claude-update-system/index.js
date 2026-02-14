/**
 * index.js
 * Claude Code 업데이트 자동화 시스템 - 메인 진입점 (v2.0)
 *
 * 사용법:
 *   node index.js check      - 버전 확인
 *   node index.js mcp        - MCP 서버 분석
 *   node index.js cleanup    - 정리 대상 분석
 *   node index.js skills     - 스킬 추천
 *   node index.js workflow   - 전체 업데이트 워크플로우
 *   node index.js learn      - 에이전틱 자기학습
 *   node index.js evolution  - 진화 기록 조회
 *
 * 옵션:
 *   --dry-run  실제 실행 없이 시뮬레이션
 */

const versionChecker = require('./version-checker');
const preUpdate = require('./pre-update');
const postUpdate = require('./post-update');
const mcpOptimizer = require('./mcp-optimizer');
const docResearcher = require('./doc-researcher');
const cleanupAdvisor = require('./cleanup-advisor');
const skillRecommender = require('./skill-recommender');
const reportGenerator = require('./report-generator');
// Phase 3 추가 모듈
const evolutionTracker = require('./evolution-tracker');
const { UpdateWorkflow } = require('./workflow');
const { learner: agenticLearner } = require('./agentic-learning');

const VERSION = '2.0.0';

async function main() {
  const command = process.argv[2] || 'help';
  
  console.log('='.repeat(50));
  console.log(`Claude Code Update System v${VERSION}`);
  console.log('='.repeat(50));
  
  switch (command) {
    case 'check':
      const current = await versionChecker.getCurrentVersion();
      const latest = await versionChecker.getLatestVersion();
      console.log(`현재: ${current}`);
      console.log(`최신: ${latest}`);
      break;
      
    case 'mcp':
      const servers = mcpOptimizer.analyzeServers();
      servers.forEach(s => console.log(`[${s.status}] ${s.name}`));
      break;
      
    case 'cleanup':
      const analysis = cleanupAdvisor.analyzeDirectory();
      console.log(`회수 가능: ${(analysis.reclaimableSize / 1024 / 1024).toFixed(2)}MB`);
      break;
      
    case 'skills':
      const { installed, recommendations } = skillRecommender.recommendSkills();
      console.log(`설치됨: ${installed.length}개`);
      console.log(`추천: ${recommendations.length}개`);
      break;

    // Phase 3: 통합 명령어
    case 'workflow':
      const workflow = new UpdateWorkflow();
      const dryRun = process.argv[3] === '--dry-run';
      console.log(dryRun ? '[*] 워크플로우 드라이런 모드' : '[*] 워크플로우 실행');
      const targetVer = process.argv[dryRun ? 4 : 3] || await versionChecker.getLatestVersion();
      await workflow.runFullWorkflow(targetVer);
      break;

    case 'learn':
      const learnDryRun = process.argv[3] === '--dry-run';
      console.log('[*] 에이전틱 자기학습 시작...');
      await agenticLearner.runFullPipeline(learnDryRun);
      break;

    case 'evolution':
      console.log('[*] 진화 기록 조회...');
      const history = evolutionTracker.loadRecentEvolution(30);
      if (history.length === 0) {
        console.log('  기록 없음');
      } else {
        history.forEach(e => console.log(`  [${e.date}] ${e.type}: ${e.summary || e.description}`));
      }
      break;

    default:
      console.log('Claude Code Update System - 통합 CLI');
      console.log('');
      console.log('사용법:');
      console.log('  node index.js check         버전 확인');
      console.log('  node index.js mcp           MCP 서버 분석');
      console.log('  node index.js cleanup       정리 대상 분석');
      console.log('  node index.js skills        스킬 추천');
      console.log('  node index.js workflow      전체 업데이트 워크플로우');
      console.log('  node index.js learn         에이전틱 자기학습');
      console.log('  node index.js evolution     진화 기록 조회');
      console.log('');
      console.log('옵션:');
      console.log('  --dry-run  실제 실행 없이 시뮬레이션');
  }
}

main().catch(console.error);

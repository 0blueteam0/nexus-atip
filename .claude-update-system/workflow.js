/**
 * workflow.js
 * Claude Code 업데이트 워크플로우 오케스트레이션
 * 
 * 업데이트 전/중/후 프로세스를 통합 관리하고
 * 자동화된 업데이트 경험 제공
 * 
 * @module .claude-update-system/workflow
 * @version 1.0.0
 * @date 2025-12-25
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 모듈 로드 (안전하게)
let preUpdate, evolutionTracker;
try {
  preUpdate = require('./pre-update');
  evolutionTracker = require('./evolution-tracker');
} catch (e) {
  console.log('[!] Some modules not loaded:', e.message);
}

const BASE_PATH = 'K:/PortableApps/genai';
const WORKFLOW_STATE_FILE = path.join(BASE_PATH, 'data', 'workflow-state.json');

/**
 * UpdateWorkflow 클래스
 * 업데이트 전체 프로세스 관리
 */
class UpdateWorkflow {
  constructor() {
    this.state = this.loadState();
  }

  /**
   * 워크플로우 상태 로드
   */
  loadState() {
    try {
      if (fs.existsSync(WORKFLOW_STATE_FILE)) {
        return JSON.parse(fs.readFileSync(WORKFLOW_STATE_FILE, 'utf8'));
      }
    } catch (e) {
      console.log('[!] State load failed, using default');
    }
    return {
      lastUpdate: null,
      currentVersion: null,
      pendingActions: [],
      history: []
    };
  }

  /**
   * 상태 저장
   */
  saveState() {
    const dir = path.dirname(WORKFLOW_STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(WORKFLOW_STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  /**
   * 현재 Claude Code 버전 확인
   */
  getCurrentVersion() {
    try {
      const result = execSync('claude --version', { 
        encoding: 'utf8',
        timeout: 10000 
      });
      const match = result.match(/(\d+\.\d+\.\d+)/);
      return match ? match[1] : 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }

  /**
   * 업데이트 전 단계
   * @param {string} fromVersion - 현재 버전
   * @param {string} toVersion - 대상 버전
   * @returns {object} 사전 준비 결과
   */
  async preUpdate(fromVersion, toVersion) {
    console.log(`[*] Pre-Update: ${fromVersion} -> ${toVersion}`);
    
    const result = {
      phase: 'pre-update',
      fromVersion,
      toVersion,
      timestamp: new Date().toISOString(),
      steps: []
    };

    // 1. 백업 생성
    if (preUpdate) {
      try {
        const backupDir = preUpdate.createBackup(fromVersion, toVersion);
        result.steps.push({ name: 'backup', status: 'success', path: backupDir });
        
        // 백업 검증
        const validation = preUpdate.validateBackup(backupDir);
        result.steps.push({ name: 'validate', status: validation.valid ? 'success' : 'warning', details: validation });
      } catch (e) {
        result.steps.push({ name: 'backup', status: 'failed', error: e.message });
      }
    }

    // 2. 현재 설정 스냅샷
    result.steps.push({
      name: 'config_snapshot',
      status: 'success',
      claudeJsonExists: fs.existsSync(path.join(BASE_PATH, '.claude.json')),
      hooksExists: fs.existsSync(path.join(BASE_PATH, '.claude-hooks.json'))
    });

    // 상태 업데이트
    this.state.pendingActions.push({
      type: 'update',
      from: fromVersion,
      to: toVersion,
      startedAt: result.timestamp
    });
    this.saveState();

    return result;
  }

  /**
   * 업데이트 실행
   * @param {boolean} dryRun - 테스트 모드
   */
  async executeUpdate(dryRun = false) {
    console.log(`[*] Execute Update ${dryRun ? '(DRY RUN)' : ''}`);
    
    const result = {
      phase: 'execute',
      dryRun,
      timestamp: new Date().toISOString()
    };

    if (dryRun) {
      result.command = 'npm update -g @anthropic-ai/claude-code';
      result.status = 'simulated';
    } else {
      try {
        const output = execSync('npm update -g @anthropic-ai/claude-code', {
          encoding: 'utf8',
          timeout: 300000  // 5분 타임아웃
        });
        result.output = output;
        result.status = 'success';
      } catch (e) {
        result.status = 'failed';
        result.error = e.message;
      }
    }

    return result;
  }

  /**
   * 업데이트 후 단계
   * @param {string} toVersion - 업데이트된 버전
   */
  async postUpdate(toVersion) {
    console.log(`[*] Post-Update: ${toVersion}`);
    
    const result = {
      phase: 'post-update',
      version: toVersion,
      timestamp: new Date().toISOString(),
      steps: []
    };

    // 1. 버전 확인
    const actualVersion = this.getCurrentVersion();
    result.steps.push({
      name: 'version_check',
      expected: toVersion,
      actual: actualVersion,
      status: actualVersion === toVersion ? 'success' : 'mismatch'
    });

    // 2. 설정 파일 무결성 확인
    const configFiles = ['.claude.json', '.claude-hooks.json', 'CLAUDE.md'];
    configFiles.forEach(file => {
      const filepath = path.join(BASE_PATH, file);
      result.steps.push({
        name: `check_${file}`,
        exists: fs.existsSync(filepath),
        status: fs.existsSync(filepath) ? 'ok' : 'missing'
      });
    });

    // 3. 진화 로그 기록
    if (evolutionTracker) {
      try {
        evolutionTracker.saveEvolutionLog({
          phase: 'post-update',
          category: 'update',
          claudeVersion: actualVersion,
          discoveries: {
            'Version': `${this.state.currentVersion} -> ${actualVersion}`,
            'Timestamp': result.timestamp
          },
          improvements: [],
          notes: 'Automatic post-update log'
        });
        result.steps.push({ name: 'evolution_log', status: 'saved' });
      } catch (e) {
        result.steps.push({ name: 'evolution_log', status: 'failed', error: e.message });
      }
    }

    // 상태 업데이트
    this.state.lastUpdate = result.timestamp;
    this.state.currentVersion = actualVersion;
    this.state.pendingActions = this.state.pendingActions.filter(a => a.type !== 'update');
    this.state.history.push({
      type: 'update',
      version: actualVersion,
      timestamp: result.timestamp
    });
    this.saveState();

    return result;
  }

  /**
   * 업데이트 리포트 생성
   * @param {object} updateData - 업데이트 데이터
   */
  generateReport(updateData) {
    const report = {
      title: 'Claude Code Update Report',
      generatedAt: new Date().toISOString(),
      summary: {
        fromVersion: updateData.fromVersion,
        toVersion: updateData.toVersion,
        success: updateData.success || false
      },
      phases: updateData.phases || [],
      recommendations: []
    };

    // 권장사항 생성
    if (updateData.success) {
      report.recommendations.push('에이전틱 자기학습 실행 권장: node .claude-update-system/agentic-learning.js full');
      report.recommendations.push('새 기능 탐색: claude.com/resources/docs 확인');
    } else {
      report.recommendations.push('백업에서 복원 고려: backups/ 폴더 확인');
      report.recommendations.push('수동 업데이트 시도: npm install -g @anthropic-ai/claude-code@latest');
    }

    return report;
  }

  /**
   * 전체 워크플로우 실행
   * @param {string} targetVersion - 대상 버전 (없으면 최신)
   * @param {boolean} dryRun - 테스트 모드
   */
  async runFullWorkflow(targetVersion = 'latest', dryRun = false) {
    console.log('='.repeat(50));
    console.log('[*] Full Update Workflow Started');
    console.log('='.repeat(50));

    const fromVersion = this.getCurrentVersion();
    const phases = [];

    // Phase 1: Pre-Update
    const preResult = await this.preUpdate(fromVersion, targetVersion);
    phases.push(preResult);
    console.log('[+] Pre-update completed');

    // Phase 2: Execute (skip in dry-run)
    const execResult = await this.executeUpdate(dryRun);
    phases.push(execResult);
    console.log(`[+] Execute ${dryRun ? '(simulated)' : 'completed'}`);

    // Phase 3: Post-Update
    const postResult = await this.postUpdate(targetVersion);
    phases.push(postResult);
    console.log('[+] Post-update completed');

    // Generate Report
    const report = this.generateReport({
      fromVersion,
      toVersion: targetVersion,
      success: !phases.some(p => p.status === 'failed'),
      phases
    });

    console.log('='.repeat(50));
    console.log('[+] Workflow Complete');
    console.log('='.repeat(50));

    return { phases, report };
  }
}

// 싱글톤 인스턴스
const workflow = new UpdateWorkflow();

// CLI 인터페이스
if (require.main === module) {
  const cmd = process.argv[2];
  
  (async () => {
    switch (cmd) {
      case 'status':
        console.log('Current Version:', workflow.getCurrentVersion());
        console.log('State:', JSON.stringify(workflow.state, null, 2));
        break;
        
      case 'pre':
        const from = process.argv[3] || workflow.getCurrentVersion();
        const to = process.argv[4] || 'latest';
        const preResult = await workflow.preUpdate(from, to);
        console.log(JSON.stringify(preResult, null, 2));
        break;
        
      case 'post':
        const version = process.argv[3] || workflow.getCurrentVersion();
        const postResult = await workflow.postUpdate(version);
        console.log(JSON.stringify(postResult, null, 2));
        break;
        
      case 'full':
        const target = process.argv[3] || 'latest';
        const dryRun = process.argv.includes('--dry-run');
        const result = await workflow.runFullWorkflow(target, dryRun);
        console.log(JSON.stringify(result.report, null, 2));
        break;
        
      default:
        console.log('Usage: node workflow.js <status|pre|post|full> [version] [--dry-run]');
    }
  })();
}

module.exports = { UpdateWorkflow, workflow };

/**
 * Pipeline Manager - 4-Stage Pipeline with FIC
 *
 * [작업] ACE-FCA 기반 4단계 파이프라인 관리
 * [목적] Specify -> Explore -> Plan -> Implement 단계별 컨텍스트 최적화
 *
 * 파이프라인 조건:
 * - Well-Defined: 명확한 목표와 완료 기준
 * - Self-Verifiable: 테스트 가능한 출력
 * - Repetitive: 알려진 패턴과 일치
 */

const fs = require('fs');
const path = require('path');
const { getFICManager } = require('./fic-manager');

class PipelineManager {
  constructor(options = {}) {
    this.fic = getFICManager();
    this.stages = ['specify', 'explore', 'plan', 'implement'];
    this.artifacts = new Map();

    this.artifactsDir = options.artifactsDir ||
      path.join(__dirname, '../plans');

    this.currentStage = null;
    this.taskId = null;

    // Human Leverage 점수 (Research > Plan > Code)
    this.leverageScores = {
      research: 0.9,
      plan: 0.8,
      implement: 0.3
    };
  }

  /**
   * 새 파이프라인 시작
   */
  start(taskId, request) {
    this.taskId = taskId || `task-${Date.now()}`;
    this.artifacts.clear();
    this.currentStage = 'specify';

    console.log(`[Pipeline] Started: ${this.taskId}`);

    return this.specify(request);
  }

  /**
   * Stage 1: Specify - 요구사항 명확화
   */
  async specify(request) {
    this.currentStage = 'specify';

    const specification = {
      taskId: this.taskId,
      stage: 'specify',
      timestamp: new Date().toISOString(),
      goal: this.extractGoal(request),
      scope: this.defineScope(request),
      successCriteria: this.extractCriteria(request),
      constraints: this.extractConstraints(request),
      originalRequest: request
    };

    // 파이프라인 적합성 검증
    specification.pipelineable = this.isPipelineable(specification);

    this.artifacts.set('specification', specification);
    await this.saveArtifact('specification', specification);

    console.log(`[Pipeline] Specify complete: ${specification.pipelineable.score}/3`);

    return specification;
  }

  /**
   * Stage 2: Explore - Sub-agent 컨텍스트 격리 탐색
   */
  async explore(specification) {
    this.currentStage = 'explore';

    if (!specification) {
      specification = this.artifacts.get('specification');
    }

    const exploration = {
      taskId: this.taskId,
      stage: 'explore',
      timestamp: new Date().toISOString(),
      basedOn: 'specification',
      findings: [],
      relatedFiles: [],
      patterns: [],
      recommendations: []
    };

    // Sub-agent 결과 시뮬레이션 (실제로는 Task(Explore) 호출)
    // FIC 적용하여 결과 압축
    if (exploration.relatedFiles.length > 0) {
      exploration.relatedFiles = this.fic.compact(
        exploration.relatedFiles,
        'file_search_results'
      );
    }

    this.artifacts.set('exploration', exploration);
    await this.saveArtifact('exploration', exploration);

    console.log(`[Pipeline] Explore complete`);

    return exploration;
  }

  /**
   * Stage 3: Plan - Human Leverage 최대화
   */
  async plan(exploration) {
    this.currentStage = 'plan';

    if (!exploration) {
      exploration = this.artifacts.get('exploration');
    }

    const spec = this.artifacts.get('specification');

    const plan = {
      taskId: this.taskId,
      stage: 'plan',
      timestamp: new Date().toISOString(),
      basedOn: ['specification', 'exploration'],

      // Human Review 포인트 명시
      humanReviewRequired: true,
      leverageScore: this.leverageScores.plan,

      // 아키텍처 결정
      architecture: {
        approach: null,
        rationale: null,
        alternatives: []
      },

      // 태스크 분해
      tasks: [],

      // 인터페이스 정의
      interfaces: [],

      // 리스크 평가
      risks: [],

      // 롤백 계획
      rollbackPlan: null,

      // 승인 상태
      approval: {
        status: 'pending', // pending | approved | rejected
        reviewer: null,
        timestamp: null,
        feedback: null
      }
    };

    this.artifacts.set('plan', plan);
    await this.saveArtifact('plan', plan);

    console.log(`[Pipeline] Plan created - Awaiting human review (leverage: ${plan.leverageScore})`);

    return plan;
  }

  /**
   * Stage 4: Implement - Focused Context 실행
   */
  async implement(plan, taskIndex = 0) {
    this.currentStage = 'implement';

    if (!plan) {
      plan = this.artifacts.get('plan');
    }

    // 승인 확인
    if (plan.approval.status !== 'approved') {
      throw new Error('Plan not approved. Cannot proceed with implementation.');
    }

    const task = plan.tasks[taskIndex];
    if (!task) {
      throw new Error(`Task ${taskIndex} not found in plan.`);
    }

    // Focused Context: 현재 태스크만 로드
    const focusedContext = {
      taskId: this.taskId,
      stage: 'implement',
      taskIndex,
      task: task,
      relatedFiles: task.files || [],
      timestamp: new Date().toISOString()
    };

    const result = {
      ...focusedContext,
      status: 'pending',
      output: null,
      error: null
    };

    // 구현 후 편집 기록 압축
    if (result.editHistory) {
      result.editHistory = this.fic.compact(
        result.editHistory,
        'edit_histories'
      );
    }

    this.artifacts.set(`implement_${taskIndex}`, result);

    console.log(`[Pipeline] Implementing task ${taskIndex + 1}/${plan.tasks.length}`);

    return result;
  }

  /**
   * 계획 승인
   */
  approvePlan(reviewer, feedback = null) {
    const plan = this.artifacts.get('plan');

    if (!plan) {
      throw new Error('No plan to approve');
    }

    plan.approval = {
      status: 'approved',
      reviewer,
      timestamp: new Date().toISOString(),
      feedback
    };

    this.saveArtifact('plan', plan);

    console.log(`[Pipeline] Plan approved by ${reviewer}`);

    return plan;
  }

  /**
   * 계획 거부
   */
  rejectPlan(reviewer, feedback) {
    const plan = this.artifacts.get('plan');

    if (!plan) {
      throw new Error('No plan to reject');
    }

    plan.approval = {
      status: 'rejected',
      reviewer,
      timestamp: new Date().toISOString(),
      feedback
    };

    this.saveArtifact('plan', plan);

    console.log(`[Pipeline] Plan rejected: ${feedback}`);

    return plan;
  }

  /**
   * 파이프라인 적합성 검증
   */
  isPipelineable(specification) {
    const result = {
      wellDefined: false,
      selfVerifiable: false,
      repetitive: false,
      score: 0
    };

    // Well-Defined: 목표와 완료 기준 존재
    result.wellDefined = !!(
      specification.goal &&
      specification.successCriteria &&
      specification.successCriteria.length > 0
    );

    // Self-Verifiable: 테스트 가능한 출력
    result.selfVerifiable = !!(
      specification.successCriteria &&
      specification.successCriteria.some(c =>
        c.includes('test') ||
        c.includes('verify') ||
        c.includes('check') ||
        c.includes('output')
      )
    );

    // Repetitive: 알려진 패턴과 일치 (간단히 키워드 체크)
    const knownPatterns = [
      'create', 'update', 'delete', 'refactor',
      'add feature', 'fix bug', 'implement',
      'migrate', 'upgrade', 'integrate'
    ];

    const requestLower = (specification.originalRequest || '').toLowerCase();
    result.repetitive = knownPatterns.some(p => requestLower.includes(p));

    // 점수 계산
    result.score = [
      result.wellDefined,
      result.selfVerifiable,
      result.repetitive
    ].filter(Boolean).length;

    return result;
  }

  /**
   * 목표 추출
   */
  extractGoal(request) {
    // 간단한 추출 로직 (실제로는 NLP 활용)
    const goalPatterns = [
      /(?:want to|need to|should)\s+(.+?)(?:\.|$)/i,
      /(?:create|build|implement|add|fix)\s+(.+?)(?:\.|$)/i,
      /^(.+?)(?:\.|$)/i
    ];

    for (const pattern of goalPatterns) {
      const match = request.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return request.substring(0, 100);
  }

  /**
   * 범위 정의
   */
  defineScope(request) {
    const scope = {
      included: [],
      excluded: [],
      boundaries: []
    };

    // "only", "just", "specific" 등의 키워드로 범위 제한
    if (request.includes('only') || request.includes('just')) {
      scope.boundaries.push('limited');
    }

    return scope;
  }

  /**
   * 성공 기준 추출
   */
  extractCriteria(request) {
    const criteria = [];

    // "should", "must", "need to" 패턴 추출
    const criteriaPatterns = [
      /should\s+(.+?)(?:\.|,|$)/gi,
      /must\s+(.+?)(?:\.|,|$)/gi,
      /need(?:s)? to\s+(.+?)(?:\.|,|$)/gi
    ];

    for (const pattern of criteriaPatterns) {
      let match;
      while ((match = pattern.exec(request)) !== null) {
        criteria.push(match[1].trim());
      }
    }

    return criteria;
  }

  /**
   * 제약 조건 추출
   */
  extractConstraints(request) {
    const constraints = [];

    // "without", "don't", "avoid" 패턴 추출
    const constraintPatterns = [
      /without\s+(.+?)(?:\.|,|$)/gi,
      /don't\s+(.+?)(?:\.|,|$)/gi,
      /avoid\s+(.+?)(?:\.|,|$)/gi,
      /not\s+(.+?)(?:\.|,|$)/gi
    ];

    for (const pattern of constraintPatterns) {
      let match;
      while ((match = pattern.exec(request)) !== null) {
        constraints.push(match[1].trim());
      }
    }

    return constraints;
  }

  /**
   * 아티팩트 저장
   */
  async saveArtifact(name, data) {
    const filename = `${this.taskId}-${name}.md`;
    const filepath = path.join(this.artifactsDir, filename);

    try {
      if (!fs.existsSync(this.artifactsDir)) {
        fs.mkdirSync(this.artifactsDir, { recursive: true });
      }

      const markdown = this.toMarkdown(name, data);
      fs.writeFileSync(filepath, markdown);

      console.log(`[Pipeline] Saved artifact: ${filename}`);
    } catch (err) {
      console.error(`[Pipeline] Failed to save artifact: ${err.message}`);
    }
  }

  /**
   * 아티팩트를 마크다운으로 변환
   */
  toMarkdown(name, data) {
    let md = `# ${name.charAt(0).toUpperCase() + name.slice(1)}: ${data.taskId}\n\n`;
    md += `**Stage**: ${data.stage}\n`;
    md += `**Timestamp**: ${data.timestamp}\n\n`;

    if (name === 'specification') {
      md += `## Goal\n${data.goal}\n\n`;
      md += `## Scope\n${JSON.stringify(data.scope, null, 2)}\n\n`;
      md += `## Success Criteria\n`;
      data.successCriteria.forEach(c => {
        md += `- ${c}\n`;
      });
      md += `\n## Constraints\n`;
      data.constraints.forEach(c => {
        md += `- ${c}\n`;
      });
      md += `\n## Pipelineable\n`;
      md += `- Well-Defined: ${data.pipelineable.wellDefined}\n`;
      md += `- Self-Verifiable: ${data.pipelineable.selfVerifiable}\n`;
      md += `- Repetitive: ${data.pipelineable.repetitive}\n`;
      md += `- Score: ${data.pipelineable.score}/3\n`;
    }

    if (name === 'plan') {
      md += `## [!!] Human Review Required\n\n`;
      md += `**Leverage Score**: ${data.leverageScore}\n\n`;
      md += `### Approval Status\n`;
      md += `- Status: ${data.approval.status}\n`;
      if (data.approval.reviewer) {
        md += `- Reviewer: ${data.approval.reviewer}\n`;
        md += `- Timestamp: ${data.approval.timestamp}\n`;
      }
      if (data.approval.feedback) {
        md += `- Feedback: ${data.approval.feedback}\n`;
      }
      md += `\n### Commands\n`;
      md += `- \`proceed\` - Approve and continue\n`;
      md += `- \`revise [feedback]\` - Request revision\n`;
      md += `- \`abort\` - Cancel pipeline\n`;
    }

    return md;
  }

  /**
   * 현재 상태 반환
   */
  getStatus() {
    return {
      taskId: this.taskId,
      currentStage: this.currentStage,
      artifacts: Array.from(this.artifacts.keys()),
      fic: this.fic.getStats()
    };
  }
}

// Singleton instance
let instance = null;

function getPipelineManager(options) {
  if (!instance) {
    instance = new PipelineManager(options);
  }
  return instance;
}

module.exports = { PipelineManager, getPipelineManager };

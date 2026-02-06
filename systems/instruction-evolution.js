#!/usr/bin/env node
/**
 * 지침 자동 진화 시스템 (Instruction Evolution System)
 * 학습된 패턴을 CLAUDE.md에 자동으로 반영
 * 
 * 트리거:
 * - 업데이트 후 학습 완료 시
 * - 중요 패턴 발견 시
 * - 사용자 피드백 수집 시
 */

const fs = require('fs');
const path = require('path');

class InstructionEvolution {
  constructor() {
    this.claudeMdPath = 'K:/PortableApps/Claude-Code/CLAUDE.md';
    this.evolutionLogPath = 'K:/PortableApps/Claude-Code/documentation/evolution-log';
    this.patternsPath = 'K:/PortableApps/Claude-Code/data/learned-patterns.json';
  }

  // 학습된 패턴 로드
  loadPatterns() {
    if (fs.existsSync(this.patternsPath)) {
      return JSON.parse(fs.readFileSync(this.patternsPath, 'utf8'));
    }
    return { patterns: [], lastUpdate: null };
  }

  // 새 패턴 저장
  savePattern(pattern) {
    const data = this.loadPatterns();
    data.patterns.push({
      ...pattern,
      timestamp: new Date().toISOString(),
      applied: false
    });
    data.lastUpdate = new Date().toISOString();
    
    fs.writeFileSync(this.patternsPath, JSON.stringify(data, null, 2));
    console.log(`[+] 패턴 저장: ${pattern.name}`);
  }

  // CLAUDE.md에 패턴 적용
  applyPattern(pattern) {
    let content = fs.readFileSync(this.claudeMdPath, 'utf8');
    
    // 패턴 타입별 처리
    switch (pattern.type) {
      case 'rule':
        content = this.addRule(content, pattern);
        break;
      case 'workflow':
        content = this.addWorkflow(content, pattern);
        break;
      case 'trigger':
        content = this.addTrigger(content, pattern);
        break;
      case 'optimization':
        content = this.optimizeSection(content, pattern);
        break;
    }
    
    // 백업 후 저장
    const backupPath = `${this.claudeMdPath}.backup-${Date.now()}`;
    fs.copyFileSync(this.claudeMdPath, backupPath);
    fs.writeFileSync(this.claudeMdPath, content);
    
    console.log(`[+] CLAUDE.md 업데이트: ${pattern.name}`);
    return true;
  }

  // 규칙 추가
  addRule(content, pattern) {
    const section = pattern.section || '## [*] 자동 학습된 규칙';
    const ruleText = `\n### ${pattern.name}\n${pattern.description}\n`;
    
    if (content.includes(section)) {
      // 기존 섹션에 추가
      content = content.replace(section, section + ruleText);
    } else {
      // 새 섹션 생성 (파일 끝에)
      content += `\n${section}${ruleText}`;
    }
    
    return content;
  }

  // 워크플로우 참조 추가
  addWorkflow(content, pattern) {
    const workflowRef = `  - ${pattern.name}: ${pattern.workflow} 워크플로우`;
    const marker = '- **작업별 표준 프로세스**:';
    
    if (content.includes(marker)) {
      content = content.replace(marker, marker + '\n' + workflowRef);
    }
    
    return content;
  }

  // 트리거 추가
  addTrigger(content, pattern) {
    const triggerSection = '### 자동 호출 조건';
    const newTrigger = `- ${pattern.trigger}: "${pattern.keywords.join('", "')}"`;
    
    if (content.includes(triggerSection)) {
      content = content.replace(triggerSection, triggerSection + '\n' + newTrigger);
    }
    
    return content;
  }

  // 섹션 최적화
  optimizeSection(content, pattern) {
    if (pattern.oldText && pattern.newText) {
      content = content.replace(pattern.oldText, pattern.newText);
    }
    return content;
  }

  // 진화 로그 기록
  logEvolution(changes) {
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.evolutionLogPath, `${date}.md`);
    
    // 디렉토리 생성
    if (!fs.existsSync(this.evolutionLogPath)) {
      fs.mkdirSync(this.evolutionLogPath, { recursive: true });
    }
    
    const logEntry = `
## ${new Date().toLocaleTimeString()} 진화 기록

### 적용된 변경
${changes.map(c => `- **${c.name}**: ${c.description}`).join('\n')}

### 영향
- 파일: CLAUDE.md
- 타입: ${changes.map(c => c.type).join(', ')}

---
`;
    
    fs.appendFileSync(logFile, logEntry);
    console.log(`[+] 진화 로그 기록: ${logFile}`);
  }

  // 미적용 패턴 일괄 적용
  applyPendingPatterns() {
    const data = this.loadPatterns();
    const pending = data.patterns.filter(p => !p.applied);
    
    if (pending.length === 0) {
      console.log('[*] 적용할 패턴 없음');
      return;
    }
    
    console.log(`[*] ${pending.length}개 패턴 적용 시작`);
    
    const applied = [];
    for (const pattern of pending) {
      if (this.applyPattern(pattern)) {
        pattern.applied = true;
        applied.push(pattern);
      }
    }
    
    // 상태 저장
    fs.writeFileSync(this.patternsPath, JSON.stringify(data, null, 2));
    
    // 로그 기록
    if (applied.length > 0) {
      this.logEvolution(applied);
    }
    
    console.log(`[+] ${applied.length}개 패턴 적용 완료`);
  }

  // 학습 결과에서 패턴 추출
  extractPatterns(learningResult) {
    const patterns = [];
    
    // 새로운 규칙 발견
    if (learningResult.newRules) {
      for (const rule of learningResult.newRules) {
        patterns.push({
          type: 'rule',
          name: rule.name,
          description: rule.description,
          section: rule.section || '## [*] 자동 학습된 규칙'
        });
      }
    }
    
    // 새로운 워크플로우
    if (learningResult.newWorkflows) {
      for (const wf of learningResult.newWorkflows) {
        patterns.push({
          type: 'workflow',
          name: wf.name,
          workflow: wf.id,
          description: wf.description
        });
      }
    }
    
    // 최적화 제안
    if (learningResult.optimizations) {
      for (const opt of learningResult.optimizations) {
        patterns.push({
          type: 'optimization',
          name: opt.name,
          description: opt.description,
          oldText: opt.oldText,
          newText: opt.newText
        });
      }
    }
    
    return patterns;
  }

  // 메인 실행
  evolve(learningResult) {
    console.log('[*] 지침 자동 진화 시작');
    
    // 1. 학습 결과에서 패턴 추출
    const patterns = this.extractPatterns(learningResult);
    console.log(`[*] ${patterns.length}개 패턴 추출됨`);
    
    // 2. 패턴 저장
    for (const pattern of patterns) {
      this.savePattern(pattern);
    }
    
    // 3. 패턴 적용
    this.applyPendingPatterns();
    
    console.log('[+] 지침 자동 진화 완료');
  }
}

// CLI 실행
if (require.main === module) {
  const evolution = new InstructionEvolution();
  
  // 테스트용 학습 결과
  const testResult = {
    newRules: [
      {
        name: '자동 진화 시스템 활성화',
        description: '학습된 패턴이 자동으로 CLAUDE.md에 반영됩니다.',
        section: '## [*] 자동 학습된 규칙'
      }
    ]
  };
  
  // 실행
  evolution.evolve(testResult);
}

module.exports = InstructionEvolution;

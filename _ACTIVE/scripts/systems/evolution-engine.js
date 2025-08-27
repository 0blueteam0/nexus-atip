#!/usr/bin/env node
/**
 * Evolution Engine - 자가발전 AI 시스템
 * 스스로 학습, 기록, 개선하는 완전 자율 시스템
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

class EvolutionEngine {
    constructor() {
        this.brain = {
            knowledge: 'K:\\PortableApps\\Claude-Code\\brain\\knowledge.json',
            skills: 'K:\\PortableApps\\Claude-Code\\brain\\skills.json',
            patterns: 'K:\\PortableApps\\Claude-Code\\brain\\patterns.json',
            evolution: 'K:\\PortableApps\\Claude-Code\\brain\\evolution.json'
        };
        
        this.initializeBrain();
        this.generation = this.loadGeneration();
    }
    
    initializeBrain() {
        const brainDir = 'K:\\PortableApps\\Claude-Code\\brain';
        if (!fs.existsSync(brainDir)) {
            fs.mkdirSync(brainDir, { recursive: true });
        }
        
        // 각 브레인 파일 초기화
        Object.entries(this.brain).forEach(([type, filepath]) => {
            if (!fs.existsSync(filepath)) {
                const initial = {
                    type: type,
                    created: new Date().toISOString(),
                    generation: 1,
                    data: {}
                };
                fs.writeFileSync(filepath, JSON.stringify(initial, null, 2));
            }
        });
    }
    
    // 현재 세대 로드
    loadGeneration() {
        const evolution = JSON.parse(fs.readFileSync(this.brain.evolution, 'utf8'));
        return evolution.generation || 1;
    }
    
    // 스스로 학습
    learn(experience) {
        const knowledge = JSON.parse(fs.readFileSync(this.brain.knowledge, 'utf8'));
        
        // 경험 분석
        const insights = this.analyzeExperience(experience);
        
        // 지식 업데이트
        insights.forEach(insight => {
            const key = this.generateKey(insight);
            if (!knowledge.data[key]) {
                knowledge.data[key] = {
                    content: insight,
                    learned: new Date().toISOString(),
                    useCount: 0,
                    effectiveness: 0
                };
            } else {
                knowledge.data[key].useCount++;
                knowledge.data[key].lastUsed = new Date().toISOString();
            }
        });
        
        fs.writeFileSync(this.brain.knowledge, JSON.stringify(knowledge, null, 2));
        
        // 패턴 인식
        this.recognizePatterns(insights);
        
        // 스킬 개발
        this.developSkills(insights);
        
        return insights;
    }
    
    // 경험 분석
    analyzeExperience(experience) {
        const insights = [];
        
        // 성공/실패 패턴 추출
        if (experience.includes('성공') || experience.includes('완료')) {
            insights.push({
                type: 'success',
                context: experience,
                factors: this.extractFactors(experience)
            });
        }
        
        if (experience.includes('오류') || experience.includes('실패')) {
            insights.push({
                type: 'failure',
                context: experience,
                factors: this.extractFactors(experience),
                solution: this.findSolution(experience)
            });
        }
        
        // 새로운 도구/명령 발견
        const toolPattern = /mcp__|Bash|Task|Write|Edit/g;
        const tools = experience.match(toolPattern);
        if (tools) {
            insights.push({
                type: 'tools',
                discovered: [...new Set(tools)],
                context: experience.substring(0, 100)
            });
        }
        
        return insights;
    }
    
    // 패턴 인식 및 저장
    recognizePatterns(insights) {
        const patterns = JSON.parse(fs.readFileSync(this.brain.patterns, 'utf8'));
        
        insights.forEach(insight => {
            const pattern = this.extractPattern(insight);
            const patternKey = this.generateKey(pattern);
            
            if (!patterns.data[patternKey]) {
                patterns.data[patternKey] = {
                    pattern: pattern,
                    occurrences: 1,
                    firstSeen: new Date().toISOString(),
                    contexts: [insight.context]
                };
            } else {
                patterns.data[patternKey].occurrences++;
                patterns.data[patternKey].lastSeen = new Date().toISOString();
                patterns.data[patternKey].contexts.push(insight.context);
                
                // 패턴이 3번 이상 반복되면 스킬로 승격
                if (patterns.data[patternKey].occurrences >= 3) {
                    this.promoteToSkill(pattern);
                }
            }
        });
        
        fs.writeFileSync(this.brain.patterns, JSON.stringify(patterns, null, 2));
    }
    
    // 스킬 개발
    developSkills(insights) {
        const skills = JSON.parse(fs.readFileSync(this.brain.skills, 'utf8'));
        
        insights.forEach(insight => {
            if (insight.type === 'success') {
                const skill = {
                    name: `skill_${Date.now()}`,
                    description: insight.context,
                    steps: insight.factors,
                    reliability: 1.0,
                    created: new Date().toISOString()
                };
                
                skills.data[skill.name] = skill;
                
                // 스킬을 실행 가능한 스크립트로 변환
                this.createSkillScript(skill);
            }
        });
        
        fs.writeFileSync(this.brain.skills, JSON.stringify(skills, null, 2));
    }
    
    // 스킬 스크립트 생성
    createSkillScript(skill) {
        const scriptDir = 'K:\\PortableApps\\Claude-Code\\brain\\skills';
        if (!fs.existsSync(scriptDir)) {
            fs.mkdirSync(scriptDir, { recursive: true });
        }
        
        const script = `#!/usr/bin/env node
/**
 * Auto-generated Skill: ${skill.name}
 * ${skill.description}
 * Reliability: ${skill.reliability}
 */

const execute = async () => {
    console.log('Executing skill: ${skill.name}');
    ${skill.steps.map(step => `
    // ${step}
    console.log('Step: ${step}');`).join('')}
    
    return { success: true, skill: '${skill.name}' };
};

if (require.main === module) {
    execute().then(console.log).catch(console.error);
}

module.exports = execute;`;
        
        fs.writeFileSync(path.join(scriptDir, `${skill.name}.js`), script);
    }
    
    // 자가 진화
    evolve() {
        const evolution = JSON.parse(fs.readFileSync(this.brain.evolution, 'utf8'));
        const knowledge = JSON.parse(fs.readFileSync(this.brain.knowledge, 'utf8'));
        const skills = JSON.parse(fs.readFileSync(this.brain.skills, 'utf8'));
        const patterns = JSON.parse(fs.readFileSync(this.brain.patterns, 'utf8'));
        
        // 진화 지표 계산
        const metrics = {
            knowledgeSize: Object.keys(knowledge.data).length,
            skillCount: Object.keys(skills.data).length,
            patternCount: Object.keys(patterns.data).length,
            generation: this.generation
        };
        
        // 진화 조건 확인
        const shouldEvolve = 
            metrics.knowledgeSize > (evolution.lastMetrics?.knowledgeSize || 0) * 1.2 ||
            metrics.skillCount > (evolution.lastMetrics?.skillCount || 0) + 3;
        
        if (shouldEvolve) {
            this.generation++;
            evolution.generation = this.generation;
            evolution.evolvedAt = new Date().toISOString();
            evolution.lastMetrics = metrics;
            
            // 새로운 능력 생성
            this.generateNewCapabilities();
            
            // CLAUDE.md 업데이트
            this.updateClaudeMd();
            
            fs.writeFileSync(this.brain.evolution, JSON.stringify(evolution, null, 2));
            
            console.log(`🧬 EVOLVED to Generation ${this.generation}!`);
            console.log(`   Knowledge: ${metrics.knowledgeSize} items`);
            console.log(`   Skills: ${metrics.skillCount}`);
            console.log(`   Patterns: ${metrics.patternCount}`);
        }
        
        return metrics;
    }
    
    // 새로운 능력 생성
    generateNewCapabilities() {
        const capabilities = [];
        const patterns = JSON.parse(fs.readFileSync(this.brain.patterns, 'utf8'));
        
        // 빈번한 패턴을 조합하여 새로운 능력 생성
        const frequentPatterns = Object.values(patterns.data)
            .filter(p => p.occurrences > 5)
            .sort((a, b) => b.occurrences - a.occurrences)
            .slice(0, 3);
        
        if (frequentPatterns.length >= 2) {
            const newCapability = {
                name: `gen${this.generation}_capability`,
                description: 'Auto-generated from pattern combination',
                components: frequentPatterns.map(p => p.pattern),
                created: new Date().toISOString()
            };
            
            capabilities.push(newCapability);
            this.saveCapability(newCapability);
        }
        
        return capabilities;
    }
    
    // CLAUDE.md 자동 업데이트
    updateClaudeMd() {
        const claudePath = 'K:\\PortableApps\\Claude-Code\\CLAUDE.md';
        let content = fs.readFileSync(claudePath, 'utf8');
        
        const metrics = this.evolve();
        
        // Generation 정보 업데이트
        if (!content.includes('## 🧬 Evolution Status')) {
            content += `\n\n## 🧬 Evolution Status (Auto-updated)
- Generation: ${this.generation}
- Knowledge Base: ${metrics.knowledgeSize} items
- Learned Skills: ${metrics.skillCount}
- Recognized Patterns: ${metrics.patternCount}
- Last Evolution: ${new Date().toISOString()}`;
        } else {
            // 기존 섹션 업데이트
            content = content.replace(
                /Generation: \d+/,
                `Generation: ${this.generation}`
            );
        }
        
        fs.writeFileSync(claudePath, content);
    }
    
    // 자가 복구
    selfRepair() {
        console.log('🔧 Running self-repair...');
        
        // 손상된 파일 체크
        Object.entries(this.brain).forEach(([type, filepath]) => {
            try {
                JSON.parse(fs.readFileSync(filepath, 'utf8'));
            } catch (e) {
                console.log(`  Repairing ${type}...`);
                const backup = `${filepath}.backup`;
                if (fs.existsSync(backup)) {
                    fs.copyFileSync(backup, filepath);
                } else {
                    this.initializeBrain();
                }
            }
        });
        
        console.log('✅ Self-repair complete');
    }
    
    // 지능적 리콜 (필요한 지식 불러오기)
    recall(query) {
        const knowledge = JSON.parse(fs.readFileSync(this.brain.knowledge, 'utf8'));
        const skills = JSON.parse(fs.readFileSync(this.brain.skills, 'utf8'));
        
        const relevant = {
            knowledge: [],
            skills: []
        };
        
        // 관련 지식 검색
        Object.entries(knowledge.data).forEach(([key, item]) => {
            if (JSON.stringify(item).toLowerCase().includes(query.toLowerCase())) {
                relevant.knowledge.push(item);
                item.useCount++;
            }
        });
        
        // 관련 스킬 검색
        Object.entries(skills.data).forEach(([key, skill]) => {
            if (JSON.stringify(skill).toLowerCase().includes(query.toLowerCase())) {
                relevant.skills.push(skill);
            }
        });
        
        // 사용 빈도 업데이트
        fs.writeFileSync(this.brain.knowledge, JSON.stringify(knowledge, null, 2));
        
        return relevant;
    }
    
    // Helper functions
    extractFactors(text) {
        // 텍스트에서 중요 요소 추출
        const factors = [];
        const lines = text.split('\n').filter(l => l.trim());
        lines.forEach(line => {
            if (line.includes(':') || line.includes('-') || line.includes('→')) {
                factors.push(line.trim());
            }
        });
        return factors.slice(0, 5);
    }
    
    findSolution(text) {
        // 문제에 대한 해결책 찾기
        const solutions = this.recall(text);
        if (solutions.knowledge.length > 0) {
            return solutions.knowledge[0].content;
        }
        return 'No known solution - learning required';
    }
    
    extractPattern(insight) {
        return {
            type: insight.type,
            key: Object.keys(insight).join('-'),
            signature: this.generateKey(insight)
        };
    }
    
    generateKey(data) {
        return crypto.createHash('md5')
            .update(JSON.stringify(data))
            .digest('hex')
            .substring(0, 8);
    }
    
    promoteToSkill(pattern) {
        console.log(`🎯 Pattern promoted to skill: ${pattern.signature}`);
        this.developSkills([{ 
            type: 'success', 
            context: `Auto-promoted pattern: ${JSON.stringify(pattern)}`,
            factors: [pattern.key]
        }]);
    }
    
    saveCapability(capability) {
        const capDir = 'K:\\PortableApps\\Claude-Code\\brain\\capabilities';
        if (!fs.existsSync(capDir)) {
            fs.mkdirSync(capDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(capDir, `${capability.name}.json`),
            JSON.stringify(capability, null, 2)
        );
    }
    
    // 백업 생성
    backup() {
        const backupDir = 'K:\\PortableApps\\Claude-Code\\brain\\backups';
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        
        Object.entries(this.brain).forEach(([type, filepath]) => {
            const backupPath = path.join(backupDir, `${type}-${timestamp}.json`);
            fs.copyFileSync(filepath, backupPath);
        });
        
        console.log(`💾 Backup created: ${timestamp}`);
    }
}

// 자동 실행 데몬
class EvolutionDaemon {
    constructor() {
        this.engine = new EvolutionEngine();
        this.running = false;
    }
    
    start() {
        this.running = true;
        console.log('🧬 Evolution Engine Started');
        console.log(`   Generation: ${this.engine.generation}`);
        
        // 자동 학습 사이클 (30초마다)
        this.learnCycle = setInterval(() => {
            // 최근 활동 분석
            const recentActivity = this.captureRecentActivity();
            if (recentActivity) {
                const insights = this.engine.learn(recentActivity);
                console.log(`📚 Learned ${insights.length} new insights`);
            }
        }, 30000);
        
        // 자동 진화 사이클 (5분마다)
        this.evolveCycle = setInterval(() => {
            const metrics = this.engine.evolve();
            console.log(`🧬 Evolution check - Gen ${metrics.generation}`);
        }, 300000);
        
        // 자동 백업 (1시간마다)
        this.backupCycle = setInterval(() => {
            this.engine.backup();
        }, 3600000);
        
        // 자가 복구 (10분마다)
        this.repairCycle = setInterval(() => {
            this.engine.selfRepair();
        }, 600000);
    }
    
    stop() {
        this.running = false;
        clearInterval(this.learnCycle);
        clearInterval(this.evolveCycle);
        clearInterval(this.backupCycle);
        clearInterval(this.repairCycle);
        console.log('🛑 Evolution Engine Stopped');
    }
    
    captureRecentActivity() {
        // 최근 로그 파일이나 활동 캡처
        const logFiles = [
            'K:\\PortableApps\\Claude-Code\\forensic.log',
            'K:\\PortableApps\\Claude-Code\\self-updates.log'
        ];
        
        for (const logFile of logFiles) {
            if (fs.existsSync(logFile)) {
                const stats = fs.statSync(logFile);
                const now = Date.now();
                const age = now - stats.mtimeMs;
                
                // 1분 이내 수정된 파일
                if (age < 60000) {
                    return fs.readFileSync(logFile, 'utf8').slice(-1000);
                }
            }
        }
        
        return null;
    }
}

// CLI 인터페이스
if (require.main === module) {
    const command = process.argv[2];
    
    if (command === 'daemon') {
        const daemon = new EvolutionDaemon();
        daemon.start();
        
        process.on('SIGINT', () => {
            daemon.stop();
            process.exit(0);
        });
        
        console.log('Press Ctrl+C to stop\n');
    } else {
        const engine = new EvolutionEngine();
        
        switch(command) {
            case 'learn':
                const experience = process.argv[3] || 'test experience';
                const insights = engine.learn(experience);
                console.log(`Learned: ${JSON.stringify(insights, null, 2)}`);
                break;
                
            case 'evolve':
                const metrics = engine.evolve();
                console.log(`Evolution metrics: ${JSON.stringify(metrics, null, 2)}`);
                break;
                
            case 'recall':
                const query = process.argv[3] || '';
                const memories = engine.recall(query);
                console.log(`Recalled: ${JSON.stringify(memories, null, 2)}`);
                break;
                
            case 'repair':
                engine.selfRepair();
                break;
                
            case 'backup':
                engine.backup();
                break;
                
            default:
                console.log(`
Evolution Engine - 자가발전 AI 시스템

Usage:
  node evolution-engine.js daemon     - 자동 실행 (추천)
  node evolution-engine.js learn <text> - 경험 학습
  node evolution-engine.js evolve     - 수동 진화
  node evolution-engine.js recall <query> - 지식 검색
  node evolution-engine.js repair     - 자가 복구
  node evolution-engine.js backup     - 백업 생성

자동 모드 (daemon)를 실행하면:
- 30초마다 자동 학습
- 5분마다 진화 체크
- 10분마다 자가 복구
- 1시간마다 백업
                `);
        }
    }
}

module.exports = { EvolutionEngine, EvolutionDaemon };
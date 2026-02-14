#!/usr/bin/env node
/**
 * Self-Updater for CLAUDE.md
 * AI가 스스로 학습하고 기록하는 시스템
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SelfUpdater {
    constructor() {
        this.claudeMd = 'K:\\PortableApps\\genai\\CLAUDE.md';
        this.learnings = 'K:\\PortableApps\\genai\\@learnings.md';
        this.patterns = 'K:\\PortableApps\\genai\\@patterns.json';
        this.updateLog = 'K:\\PortableApps\\genai\\self-updates.log';
        
        this.initializePatterns();
    }
    
    initializePatterns() {
        if (!fs.existsSync(this.patterns)) {
            const initialPatterns = {
                problemSolutions: {},
                userPreferences: {},
                effectiveApproaches: {},
                frequentCommands: {},
                errorPatterns: {}
            };
            fs.writeFileSync(this.patterns, JSON.stringify(initialPatterns, null, 2));
        }
    }
    
    // 학습 내용 자동 기록
    learn(category, key, value) {
        const patterns = JSON.parse(fs.readFileSync(this.patterns, 'utf8'));
        
        if (!patterns[category]) {
            patterns[category] = {};
        }
        
        // 기존 값이 있으면 카운트 증가 (빈도 학습)
        if (patterns[category][key]) {
            if (typeof patterns[category][key] === 'object' && patterns[category][key].count) {
                patterns[category][key].count++;
                patterns[category][key].lastSeen = new Date().toISOString();
            } else {
                patterns[category][key] = {
                    value: patterns[category][key],
                    count: 2,
                    firstSeen: new Date().toISOString(),
                    lastSeen: new Date().toISOString()
                };
            }
        } else {
            patterns[category][key] = {
                value: value,
                count: 1,
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString()
            };
        }
        
        fs.writeFileSync(this.patterns, JSON.stringify(patterns, null, 2));
        this.log(`Learned: ${category} -> ${key}`);
        
        // 중요도가 높으면 CLAUDE.md에 추가
        if (patterns[category][key].count >= 3) {
            this.updateClaudeMd(category, key, patterns[category][key]);
        }
    }
    
    // CLAUDE.md 자동 업데이트
    updateClaudeMd(category, key, data) {
        let claudeContent = fs.readFileSync(this.claudeMd, 'utf8');
        
        // 이미 존재하는지 확인
        if (claudeContent.includes(key)) {
            return;
        }
        
        // 카테고리별 업데이트 위치 결정
        const updateSection = this.getUpdateSection(category);
        
        if (updateSection && !claudeContent.includes(updateSection)) {
            // 새 섹션 추가
            claudeContent += `\n\n## ${updateSection}\n`;
        }
        
        // 내용 추가
        const newContent = this.formatLearning(category, key, data);
        
        // 적절한 위치에 삽입
        if (claudeContent.includes('## 📁 모듈 시스템')) {
            // 모듈 시스템 뒤에 추가
            const parts = claudeContent.split('## 📁 모듈 시스템');
            claudeContent = parts[0] + '## 📁 모듈 시스템' + parts[1].split('\n\n')[0] + 
                           '\n\n' + newContent + '\n\n' + parts[1].split('\n\n').slice(1).join('\n\n');
        } else {
            // 끝에 추가
            claudeContent += '\n\n' + newContent;
        }
        
        // 백업 생성
        const backup = `${this.claudeMd}.backup-${Date.now()}`;
        fs.copyFileSync(this.claudeMd, backup);
        
        // 업데이트
        fs.writeFileSync(this.claudeMd, claudeContent);
        this.log(`Updated CLAUDE.md with: ${key}`);
        
        // @learnings.md에도 기록
        this.updateLearnings(category, key, data);
    }
    
    // 학습 내용 포맷팅
    formatLearning(category, key, data) {
        const timestamp = new Date().toISOString().split('T')[0];
        
        switch(category) {
            case 'problemSolutions':
                return `### 🔧 자동 학습: ${key}\n- 해결책: ${data.value}\n- 빈도: ${data.count}회\n- 최종: ${timestamp}`;
                
            case 'userPreferences':
                return `### 👤 사용자 패턴: ${key}\n- ${data.value}\n- 확인: ${data.count}회`;
                
            case 'effectiveApproaches':
                return `### ✅ 효과적 접근: ${key}\n- ${data.value}\n- 성공: ${data.count}회`;
                
            default:
                return `### 📝 ${key}\n- ${data.value}\n- Count: ${data.count}`;
        }
    }
    
    // @learnings.md 업데이트
    updateLearnings(category, key, data) {
        let learnings = fs.readFileSync(this.learnings, 'utf8');
        const timestamp = new Date().toISOString();
        
        const newEntry = `\n### ${timestamp}\n- **카테고리**: ${category}\n- **학습**: ${key}\n- **내용**: ${JSON.stringify(data.value)}\n- **빈도**: ${data.count}회\n`;
        
        // <!-- 새로운 학습 내용이 여기 추가됩니다 --> 찾기
        if (learnings.includes('<!-- 새로운 학습 내용이 여기 추가됩니다 -->')) {
            learnings = learnings.replace(
                '<!-- 새로운 학습 내용이 여기 추가됩니다 -->',
                newEntry + '\n<!-- 새로운 학습 내용이 여기 추가됩니다 -->'
            );
        } else {
            learnings += newEntry;
        }
        
        fs.writeFileSync(this.learnings, learnings);
    }
    
    // 섹션 결정
    getUpdateSection(category) {
        const sectionMap = {
            'problemSolutions': '🔧 자동 발견 해결책',
            'userPreferences': '👤 학습된 사용자 선호',
            'effectiveApproaches': '✅ 검증된 접근법',
            'frequentCommands': '⚡ 자주 사용하는 명령',
            'errorPatterns': '❌ 알려진 오류 패턴'
        };
        
        return sectionMap[category] || '📝 기타 학습 내용';
    }
    
    // 로그 기록
    log(message) {
        const logEntry = `[${new Date().toISOString()}] ${message}\n`;
        fs.appendFileSync(this.updateLog, logEntry);
        console.log(`📝 ${message}`);
    }
    
    // 패턴 분석 및 자동 학습
    analyzeAndLearn(text) {
        // 문제-해결 패턴 감지
        const problemPattern = /문제[:\s]+(.+?)[\n\r].*?해결[:\s]+(.+?)[\n\r]/gs;
        let match;
        while ((match = problemPattern.exec(text)) !== null) {
            this.learn('problemSolutions', match[1].trim(), match[2].trim());
        }
        
        // 에러 패턴 감지
        const errorPattern = /error[:\s]+(.+?)[\n\r]/gi;
        while ((match = errorPattern.exec(text)) !== null) {
            this.learn('errorPatterns', match[1].trim(), 'detected');
        }
        
        // 성공 패턴 감지
        const successPattern = /✅|성공|완료|해결/g;
        const successCount = (text.match(successPattern) || []).length;
        if (successCount > 2) {
            this.learn('effectiveApproaches', 'current_approach', 'successful');
        }
    }
    
    // 통계 리포트
    generateReport() {
        const patterns = JSON.parse(fs.readFileSync(this.patterns, 'utf8'));
        const report = {
            totalLearnings: 0,
            categories: {}
        };
        
        Object.keys(patterns).forEach(category => {
            const items = Object.keys(patterns[category]).length;
            report.categories[category] = items;
            report.totalLearnings += items;
        });
        
        return report;
    }
}

// Hook 시스템과 통합
class ClaudeHook {
    constructor() {
        this.updater = new SelfUpdater();
    }
    
    // 도구 사용 후 자동 학습
    onToolUse(toolName, params, result) {
        if (result.success) {
            this.updater.learn('frequentCommands', toolName, params);
        } else if (result.error) {
            this.updater.learn('errorPatterns', `${toolName}_error`, result.error);
        }
    }
    
    // 사용자 입력 분석
    onUserInput(input) {
        if (input.includes('좋아') || input.includes('완벽')) {
            this.updater.learn('userPreferences', 'positive_feedback', 'current_approach');
        }
        
        if (input.includes('bottom-up') || input.includes('proactive')) {
            this.updater.learn('userPreferences', 'approach_style', 'bottom-up proactive');
        }
    }
    
    // 결과 분석
    onResponse(response) {
        this.updater.analyzeAndLearn(response);
    }
}

// CLI 인터페이스
if (require.main === module) {
    const updater = new SelfUpdater();
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    switch(command) {
        case 'learn':
            updater.learn(args[0], args[1], args[2]);
            break;
            
        case 'analyze':
            const text = fs.readFileSync(args[0], 'utf8');
            updater.analyzeAndLearn(text);
            break;
            
        case 'report':
            const report = updater.generateReport();
            console.log('\n📊 Learning Report:');
            console.log(`Total Learnings: ${report.totalLearnings}`);
            Object.entries(report.categories).forEach(([cat, count]) => {
                console.log(`  ${cat}: ${count} items`);
            });
            break;
            
        default:
            console.log(`
Self-Updater - CLAUDE.md 자가 학습 시스템

Usage:
  node self-updater.js learn <category> <key> <value>
  node self-updater.js analyze <file>
  node self-updater.js report

Categories:
  - problemSolutions
  - userPreferences
  - effectiveApproaches
  - frequentCommands
  - errorPatterns

자동으로 CLAUDE.md와 @learnings.md를 업데이트합니다.
            `);
    }
}

module.exports = { SelfUpdater, ClaudeHook };
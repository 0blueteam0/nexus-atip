#!/usr/bin/env node
/**
 * Context Preserver - 대화 연속성 보장 시스템
 * 컨텍스트 윈도우 한계 극복
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ContextPreserver {
    constructor() {
        this.memoryFile = 'K:\\PortableApps\\genai\\memory-bank.json';
        this.contextFile = 'K:\\PortableApps\\genai\\CONTEXT.md';
        this.maxContextSize = 200000; // 200K tokens
        this.currentSize = 0;
    }
    
    // 현재 세션 저장
    saveSession(sessionData) {
        const memory = this.loadMemory();
        const sessionId = `session-${Date.now()}`;
        
        const session = {
            id: sessionId,
            timestamp: new Date().toISOString(),
            summary: this.summarize(sessionData),
            keyPoints: this.extractKeyPoints(sessionData),
            files: this.getModifiedFiles(),
            decisions: this.getImportantDecisions(sessionData),
            hash: this.generateHash(sessionData)
        };
        
        memory.sessions.push(session);
        
        // 최근 10개 세션만 유지
        if (memory.sessions.length > 10) {
            memory.sessions = memory.sessions.slice(-10);
        }
        
        fs.writeFileSync(this.memoryFile, JSON.stringify(memory, null, 2));
        return sessionId;
    }
    
    // 메모리 로드
    loadMemory() {
        if (!fs.existsSync(this.memoryFile)) {
            return { sessions: [], current_session: {} };
        }
        return JSON.parse(fs.readFileSync(this.memoryFile, 'utf8'));
    }
    
    // 컨텍스트 압축
    compressContext(text) {
        // 중요한 내용만 추출
        const lines = text.split('\n');
        const important = lines.filter(line => 
            line.includes('TODO') ||
            line.includes('IMPORTANT') ||
            line.includes('API') ||
            line.includes('ERROR') ||
            line.includes('완료') ||
            line.includes('설치')
        );
        
        return important.join('\n');
    }
    
    // 핵심 포인트 추출
    extractKeyPoints(data) {
        const points = [];
        
        // 패턴 매칭으로 중요 정보 추출
        const patterns = [
            /설치.*:\s*(.+)/g,
            /생성.*:\s*(.+)/g,
            /해결.*:\s*(.+)/g,
            /API.*:\s*(.+)/g,
            /오류.*:\s*(.+)/g
        ];
        
        patterns.forEach(pattern => {
            const matches = data.match(pattern);
            if (matches) {
                points.push(...matches.slice(0, 3)); // 각 패턴당 최대 3개
            }
        });
        
        return points;
    }
    
    // 수정된 파일 목록
    getModifiedFiles() {
        const recentFiles = [];
        const dir = 'K:\\PortableApps\\genai';
        
        const files = fs.readdirSync(dir);
        const now = Date.now();
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            const age = now - stats.mtimeMs;
            
            // 1시간 이내 수정된 파일
            if (age < 3600000 && !stats.isDirectory()) {
                recentFiles.push({
                    name: file,
                    modified: stats.mtime.toISOString(),
                    size: stats.size
                });
            }
        });
        
        return recentFiles.slice(0, 20); // 최근 20개 파일
    }
    
    // 중요 결정사항 추출
    getImportantDecisions(data) {
        const decisions = [];
        
        // 결정 관련 키워드
        const keywords = ['구현', '설치', '생성', '해결', '변경', '추가'];
        const lines = data.split('\n');
        
        lines.forEach((line, index) => {
            keywords.forEach(keyword => {
                if (line.includes(keyword)) {
                    decisions.push({
                        line: index,
                        content: line.substring(0, 100),
                        keyword: keyword
                    });
                }
            });
        });
        
        return decisions.slice(0, 10); // 상위 10개 결정
    }
    
    // 요약 생성
    summarize(data) {
        const lines = data.split('\n').filter(l => l.trim());
        const wordCount = data.split(' ').length;
        
        return {
            totalLines: lines.length,
            totalWords: wordCount,
            estimatedTokens: Math.round(wordCount * 1.3),
            topics: this.extractTopics(data)
        };
    }
    
    // 주제 추출
    extractTopics(data) {
        const topics = new Map();
        const keywords = {
            'MCP': ['mcp', 'installer', 'playwright', 'filesystem'],
            '개발': ['code', 'function', 'const', 'let', 'var'],
            '설정': ['config', 'setting', 'env', 'path'],
            '문제해결': ['error', 'fix', 'solve', 'issue'],
            'API': ['api', 'key', 'token', 'auth']
        };
        
        Object.entries(keywords).forEach(([topic, words]) => {
            let count = 0;
            words.forEach(word => {
                const regex = new RegExp(word, 'gi');
                const matches = data.match(regex);
                if (matches) count += matches.length;
            });
            if (count > 0) topics.set(topic, count);
        });
        
        return Array.from(topics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }
    
    // 해시 생성
    generateHash(data) {
        return crypto.createHash('sha256')
            .update(data)
            .digest('hex')
            .substring(0, 16);
    }
    
    // 컨텍스트 복원 파일 생성
    createContextFile() {
        const memory = this.loadMemory();
        
        const context = `# CONTEXT.md - 이전 대화 기록 요약

## 최근 세션 정보
- 세션 수: ${memory.sessions.length}
- 마지막 업데이트: ${new Date().toISOString()}

## 현재 환경
\`\`\`json
${JSON.stringify(memory.current_session.current_environment, null, 2)}
\`\`\`

## 완료된 작업
${memory.current_session.completed_tasks?.map(t => `- ✅ ${t}`).join('\n') || '없음'}

## 생성된 파일
${memory.current_session.files_created?.map(f => `- 📄 ${f}`).join('\n') || '없음'}

## 중요 결정사항
${memory.current_session.important_decisions?.map(d => 
    `- **${d.time}**: ${d.decision}\n  이유: ${d.reason}`
).join('\n') || '없음'}

## 다음 작업
${memory.current_session.next_actions?.map(a => `- ⏳ ${a}`).join('\n') || '없음'}

## 세션 히스토리
${memory.sessions.slice(-5).map(s => 
    `### ${s.id}
- 시간: ${s.timestamp}
- 토큰: ${s.summary?.estimatedTokens || 'N/A'}
- 주제: ${s.summary?.topics?.map(t => t[0]).join(', ') || 'N/A'}`
).join('\n\n')}

---
*이 파일을 새 대화 시작 시 업로드하면 컨텍스트가 복원됩니다.*`;

        fs.writeFileSync(this.contextFile, context);
        console.log('✅ Context file created: CONTEXT.md');
        return this.contextFile;
    }
    
    // 자동 백업
    autoBackup() {
        const backupDir = 'K:\\PortableApps\\genai\\context-backups';
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }
        
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const backupFile = path.join(backupDir, `context-${timestamp}.json`);
        
        const memory = this.loadMemory();
        fs.writeFileSync(backupFile, JSON.stringify(memory, null, 2));
        
        console.log(`📦 Backup created: ${backupFile}`);
        return backupFile;
    }
}

// CLI 실행
if (require.main === module) {
    const preserver = new ContextPreserver();
    
    const command = process.argv[2];
    
    switch(command) {
        case 'save':
            const sessionId = preserver.saveSession(process.argv[3] || 'Current session data');
            console.log(`💾 Session saved: ${sessionId}`);
            break;
            
        case 'create':
            preserver.createContextFile();
            break;
            
        case 'backup':
            preserver.autoBackup();
            break;
            
        default:
            console.log(`
Context Preserver - 대화 연속성 보장

Usage:
  node context-preserver.js save [data]  - 현재 세션 저장
  node context-preserver.js create       - CONTEXT.md 생성
  node context-preserver.js backup       - 백업 생성

새 대화 시작 시:
1. CONTEXT.md 파일을 업로드
2. memory-bank.json 참조
3. 이전 작업 계속 진행
            `);
    }
}

module.exports = ContextPreserver;
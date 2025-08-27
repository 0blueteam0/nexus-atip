/**
 * SMART-SUGGEST - Intelligent MCP/Agent Recommendation System
 * Proactively suggests tools based on work context
 */

const fs = require('fs');
const path = require('path');

class SmartSuggest {
    constructor() {
        this.configPath = 'K:\\PortableApps\\Claude-Code\\.claude.json';
        this.patternsPath = 'K:\\PortableApps\\Claude-Code\\brain\\tool-patterns.json';
        this.mcpServers = this.loadMCPServers();
        this.patterns = this.loadPatterns();
        this.contextTriggers = this.defineContextTriggers();
    }

    loadMCPServers() {
        try {
            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            return config.mcpServers || {};
        } catch (e) {
            console.error('Failed to load MCP config:', e.message);
            return {};
        }
    }

    loadPatterns() {
        try {
            if (fs.existsSync(this.patternsPath)) {
                return JSON.parse(fs.readFileSync(this.patternsPath, 'utf8'));
            }
        } catch (e) {}
        return { learned: {}, suggestions: [] };
    }

    defineContextTriggers() {
        return {
            // Git 작업 감지
            git: {
                patterns: ['git', 'commit', 'push', 'pull', 'merge', 'diff', 'branch'],
                suggestions: [
                    { type: 'mcp', name: 'git-mcp', reason: 'Git 작업 감지됨' },
                    { type: 'agent', name: 'code-reviewer', reason: '코드 리뷰 자동화 가능' }
                ],
                autoInstall: 'npx @staze/mcp-git'
            },
            
            // 파일 비교/Diff 작업
            diff: {
                patterns: ['compare', 'diff', 'difference', '비교', 'vs'],
                suggestions: [
                    { type: 'mcp', name: 'diff-typescript', reason: 'Diff 작업 감지됨' },
                    { type: 'tool', name: 'precision-comparison-format', reason: '정밀 비교 분석' }
                ],
                autoInstall: 'npx @gogi/diff-typescript'
            },
            
            // 태스크/프로젝트 관리
            task: {
                patterns: ['task', 'todo', 'plan', 'project', '작업', '계획'],
                suggestions: [
                    { type: 'mcp', name: 'shrimp-task-manager', reason: '태스크 관리 필요' },
                    { type: 'agent', name: 'project-planner', reason: '프로젝트 계획 수립' }
                ],
                active: true // 이미 활성화됨
            },
            
            // 메모리/기록 관리
            memory: {
                patterns: ['remember', 'save', 'memory', '기억', '저장', '메모리'],
                suggestions: [
                    { type: 'mcp', name: 'kiro-memory', reason: '메모리 시스템 필요' },
                    { type: 'tool', name: 'assessment-recorder', reason: '자동 기록 시스템' }
                ],
                active: true // 이미 활성화됨
            },
            
            // 웹 검색/리서치
            web: {
                patterns: ['search', 'google', 'web', 'research', '검색', '찾아', '알아봐'],
                suggestions: [
                    { type: 'mcp', name: 'google-search', reason: '웹 검색 필요' },
                    { type: 'mcp', name: 'firecrawl', reason: '웹 스크래핑 가능' },
                    { type: 'agent', name: 'research-agent', reason: '심층 리서치' }
                ],
                autoInstall: 'npx @modelcontextprotocol/server-google-search'
            },
            
            // YouTube/비디오
            youtube: {
                patterns: ['youtube', 'video', '유튜브', '영상', '동영상'],
                suggestions: [
                    { type: 'mcp', name: 'youtube-data', reason: 'YouTube 데이터 분석' },
                    { type: 'agent', name: 'video-analyzer', reason: '영상 내용 분석' }
                ],
                autoInstall: 'npx @gogi/mcp-youtube-data'
            },
            
            // 문서/라이브러리
            docs: {
                patterns: ['docs', 'documentation', 'library', 'api', '문서', '라이브러리'],
                suggestions: [
                    { type: 'mcp', name: 'context7', reason: '라이브러리 문서 검색' },
                    { type: 'agent', name: 'docs-reader', reason: '문서 자동 분석' }
                ],
                active: true
            },
            
            // 파일 시스템 작업
            files: {
                patterns: ['file', 'folder', 'directory', '파일', '폴더', '디렉토리'],
                suggestions: [
                    { type: 'mcp', name: 'filesystem', reason: '파일 시스템 작업' },
                    { type: 'agent', name: 'file-organizer', reason: '파일 자동 정리' }
                ],
                active: true
            },
            
            // 브라우저 자동화
            browser: {
                patterns: ['browser', 'chrome', 'playwright', '브라우저', '자동화', 'selenium'],
                suggestions: [
                    { type: 'mcp', name: 'playwright', reason: '브라우저 자동화' },
                    { type: 'agent', name: 'web-automation', reason: '웹 자동화 작업' }
                ],
                active: true
            },
            
            // 데이터베이스
            database: {
                patterns: ['database', 'db', 'sql', 'query', '데이터베이스', '쿼리'],
                suggestions: [
                    { type: 'mcp', name: 'sqlite', reason: 'SQLite 데이터베이스' },
                    { type: 'mcp', name: 'postgres', reason: 'PostgreSQL 연결' },
                    { type: 'agent', name: 'db-manager', reason: 'DB 스키마 관리' }
                ],
                autoInstall: 'npx @modelcontextprotocol/server-sqlite'
            }
        };
    }

    analyzeContext(input) {
        const lowerInput = input.toLowerCase();
        const detectedContexts = [];
        
        // 각 컨텍스트 체크
        for (const [contextName, context] of Object.entries(this.contextTriggers)) {
            const matched = context.patterns.some(pattern => 
                lowerInput.includes(pattern)
            );
            
            if (matched) {
                detectedContexts.push({
                    name: contextName,
                    ...context
                });
            }
        }
        
        return detectedContexts;
    }

    generateSuggestions(contexts) {
        const suggestions = {
            immediate: [],    // 즉시 필요
            recommended: [],  // 권장
            optional: []      // 선택적
        };
        
        contexts.forEach(context => {
            context.suggestions.forEach(suggestion => {
                // 이미 활성화된 것은 제외
                if (context.active && suggestion.type === 'mcp') {
                    return;
                }
                
                // MCP 서버 존재 여부 체크
                const isInstalled = this.mcpServers[suggestion.name] !== undefined;
                
                const item = {
                    ...suggestion,
                    installed: isInstalled,
                    installCommand: !isInstalled ? context.autoInstall : null,
                    context: context.name
                };
                
                // 우선순위 분류
                if (!isInstalled && suggestion.type === 'mcp') {
                    suggestions.immediate.push(item);
                } else if (suggestion.type === 'agent') {
                    suggestions.recommended.push(item);
                } else {
                    suggestions.optional.push(item);
                }
            });
        });
        
        return suggestions;
    }

    async suggestTools(userInput) {
        console.log('\n🔍 Analyzing work context...\n');
        
        const contexts = this.analyzeContext(userInput);
        
        if (contexts.length === 0) {
            console.log('No specific tool recommendations for this context.');
            return null;
        }
        
        const suggestions = this.generateSuggestions(contexts);
        
        // 학습 패턴 저장
        this.savePattern(userInput, contexts, suggestions);
        
        // 추천 출력
        this.displaySuggestions(suggestions);
        
        return suggestions;
    }

    displaySuggestions(suggestions) {
        console.log('╔════════════════════════════════════════════╗');
        console.log('║     🚀 SMART TOOL SUGGESTIONS              ║');
        console.log('╚════════════════════════════════════════════╝\n');
        
        if (suggestions.immediate.length > 0) {
            console.log('🔴 IMMEDIATE (Not installed, but needed):');
            suggestions.immediate.forEach(s => {
                console.log(`   📦 ${s.name} - ${s.reason}`);
                if (s.installCommand) {
                    console.log(`      Install: ${s.installCommand}`);
                }
            });
            console.log();
        }
        
        if (suggestions.recommended.length > 0) {
            console.log('🟡 RECOMMENDED (Would enhance your work):');
            suggestions.recommended.forEach(s => {
                console.log(`   🤖 ${s.name} - ${s.reason}`);
            });
            console.log();
        }
        
        if (suggestions.optional.length > 0) {
            console.log('🟢 OPTIONAL (Already available):');
            suggestions.optional.forEach(s => {
                console.log(`   ✅ ${s.name} - ${s.reason}`);
            });
            console.log();
        }
        
        console.log('═══════════════════════════════════════════════\n');
    }

    savePattern(input, contexts, suggestions) {
        const pattern = {
            timestamp: new Date().toISOString(),
            input: input.substring(0, 100), // 처음 100자만
            contexts: contexts.map(c => c.name),
            suggestionsCount: {
                immediate: suggestions.immediate.length,
                recommended: suggestions.recommended.length,
                optional: suggestions.optional.length
            }
        };
        
        if (!this.patterns.history) {
            this.patterns.history = [];
        }
        
        this.patterns.history.push(pattern);
        
        // 최근 100개만 유지
        if (this.patterns.history.length > 100) {
            this.patterns.history = this.patterns.history.slice(-100);
        }
        
        // 학습: 자주 나오는 컨텍스트 추적
        contexts.forEach(context => {
            if (!this.patterns.learned[context.name]) {
                this.patterns.learned[context.name] = 0;
            }
            this.patterns.learned[context.name]++;
        });
        
        fs.writeFileSync(this.patternsPath, JSON.stringify(this.patterns, null, 2));
    }

    // 자동 설치 제안
    async autoInstallSuggestion(suggestions) {
        if (suggestions.immediate.length === 0) return;
        
        console.log('\n💡 Would you like to install the suggested MCP servers?');
        console.log('Commands to run:\n');
        
        const installCommands = [];
        suggestions.immediate.forEach(s => {
            if (s.installCommand) {
                installCommands.push(s.installCommand);
                console.log(`   ${s.installCommand}`);
            }
        });
        
        // 배치 파일 생성
        if (installCommands.length > 0) {
            const batchContent = `@echo off
REM Auto-generated MCP installation script
echo Installing recommended MCP servers...

${installCommands.map(cmd => `echo Installing: ${cmd}\n${cmd}`).join('\n\n')}

echo.
echo Installation complete!
pause`;
            
            const batchPath = 'K:\\PortableApps\\Claude-Code\\INSTALL-SUGGESTED-MCP.bat';
            fs.writeFileSync(batchPath, batchContent);
            
            console.log(`\n✅ Installation script created: INSTALL-SUGGESTED-MCP.bat`);
            console.log('   Run it to install all suggested MCP servers.\n');
        }
    }
}

// 세션 시작 시 자동 실행
class SessionMonitor {
    constructor() {
        this.suggest = new SmartSuggest();
        this.lastCheck = null;
    }

    async monitorInput(input) {
        // 5분마다 한 번씩만 체크 (너무 자주 하지 않기)
        const now = Date.now();
        if (this.lastCheck && (now - this.lastCheck) < 300000) {
            return;
        }
        
        this.lastCheck = now;
        
        const suggestions = await this.suggest.suggestTools(input);
        
        if (suggestions && suggestions.immediate.length > 0) {
            await this.suggest.autoInstallSuggestion(suggestions);
        }
    }
}

module.exports = { SmartSuggest, SessionMonitor };

// 직접 실행 시 테스트
if (require.main === module) {
    const suggest = new SmartSuggest();
    
    // 테스트 입력
    const testInputs = [
        'git commit하고 push해줘',
        '이 파일들 비교 분석해줘',
        'YouTube 영상 분석해줘',
        '웹에서 검색해서 알아봐줘'
    ];
    
    console.log('Testing Smart Suggest System...\n');
    
    testInputs.forEach(input => {
        console.log(`\nInput: "${input}"`);
        suggest.suggestTools(input);
    });
}
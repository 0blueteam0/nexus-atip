/**
 * Auto Tool Finder System
 * 3회 이상 실패 시 자동으로 MCP 도구를 검색하고 비교 분석
 * @author Claude AI
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class AutoToolFinder {
    constructor() {
        this.failureCounter = {};
        this.searchHistory = [];
        this.patternsFile = path.join(__dirname, '..', 'brain', 'patterns.json');
        this.failureThreshold = 3;
        this.loadPatterns();
    }

    /**
     * 패턴 파일 로드
     */
    loadPatterns() {
        try {
            if (fs.existsSync(this.patternsFile)) {
                const data = fs.readFileSync(this.patternsFile, 'utf-8');
                this.patterns = JSON.parse(data);
            } else {
                this.patterns = {
                    knownTools: {},
                    successfulSearches: [],
                    commonFailures: []
                };
                this.savePatterns();
            }
        } catch (error) {
            console.error('패턴 로드 실패:', error);
            this.patterns = { knownTools: {}, successfulSearches: [], commonFailures: [] };
        }
    }

    /**
     * 패턴 저장
     */
    savePatterns() {
        try {
            // brain 디렉토리 생성
            const brainDir = path.dirname(this.patternsFile);
            if (!fs.existsSync(brainDir)) {
                fs.mkdirSync(brainDir, { recursive: true });
            }
            fs.writeFileSync(this.patternsFile, JSON.stringify(this.patterns, null, 2));
        } catch (error) {
            console.error('패턴 저장 실패:', error);
        }
    }

    /**
     * 작업 실패 기록
     */
    recordFailure(taskType, errorMessage) {
        if (!this.failureCounter[taskType]) {
            this.failureCounter[taskType] = {
                count: 0,
                errors: [],
                firstFailure: new Date().toISOString()
            };
        }

        this.failureCounter[taskType].count++;
        this.failureCounter[taskType].errors.push({
            message: errorMessage,
            timestamp: new Date().toISOString()
        });
        this.failureCounter[taskType].lastFailure = new Date().toISOString();

        console.log(`[실패 기록] ${taskType}: ${this.failureCounter[taskType].count}회`);

        // 임계값 도달 시 자동 검색
        if (this.failureCounter[taskType].count >= this.failureThreshold) {
            console.log(`[자동 검색 트리거] ${taskType} - ${this.failureThreshold}회 실패`);
            this.findTools(taskType);
        }
    }

    /**
     * MCP 도구 검색
     */
    async findTools(taskType) {
        console.log(`\n🔍 [Auto Tool Finder] ${taskType}에 대한 MCP 도구 검색 시작...`);
        
        const searchResults = {
            npm: [],
            github: [],
            existing: []
        };

        // 1. NPM 검색
        try {
            const npmResults = await this.searchNPM(taskType);
            searchResults.npm = npmResults;
        } catch (error) {
            console.error('NPM 검색 실패:', error.message);
        }

        // 2. GitHub 검색 (API 키 없이 기본 검색)
        try {
            const githubResults = await this.searchGitHub(taskType);
            searchResults.github = githubResults;
        } catch (error) {
            console.error('GitHub 검색 실패:', error.message);
        }

        // 3. 기존 설치된 도구 확인
        try {
            const existingTools = await this.checkExistingTools();
            searchResults.existing = existingTools;
        } catch (error) {
            console.error('기존 도구 확인 실패:', error.message);
        }

        // 4. 비교 분석 테이블 생성
        const comparisonTable = this.createComparisonTable(searchResults, taskType);
        
        // 5. 결과 저장 및 출력
        this.saveSearchResult(taskType, searchResults, comparisonTable);
        
        // 6. 자동 설치 스크립트 생성
        if (searchResults.npm.length > 0 || searchResults.github.length > 0) {
            this.generateInstallScript(searchResults);
        }

        return comparisonTable;
    }

    /**
     * NPM 레지스트리 검색
     */
    async searchNPM(taskType) {
        const keywords = this.getSearchKeywords(taskType);
        const results = [];

        for (const keyword of keywords) {
            try {
                const searchQuery = `mcp ${keyword}`;
                const { stdout } = await execPromise(`npm search ${searchQuery} --json`, {
                    timeout: 10000
                });
                
                const packages = JSON.parse(stdout || '[]');
                const mcpPackages = packages.filter(pkg => 
                    pkg.name.includes('mcp') || 
                    pkg.description?.toLowerCase().includes('model context protocol')
                ).slice(0, 3);

                results.push(...mcpPackages.map(pkg => ({
                    name: pkg.name,
                    version: pkg.version,
                    description: pkg.description,
                    source: 'npm',
                    score: pkg.searchScore || 0
                })));
            } catch (error) {
                // NPM 검색 실패는 조용히 처리
            }
        }

        return results;
    }

    /**
     * GitHub 검색 (간단한 파일 기반)
     */
    async searchGitHub(taskType) {
        // GitHub API 없이 알려진 MCP 도구 목록 사용
        const knownMCPTools = [
            { name: 'mcp-edit-file-lines', repo: 'oakenai/mcp-edit-file-lines', description: 'Edit specific lines in files' },
            { name: 'desktop-commander', repo: 'DesktopCommanderMCP/desktop-commander', description: 'Desktop automation' },
            { name: 'mcp-git', repo: 'modelcontextprotocol/mcp-git', description: 'Git operations' },
            { name: 'mcp-memory', repo: 'kiro-mcp/memory', description: 'Memory management' },
            { name: 'mcp-diff', repo: 'adhikasp/mcp-diff', description: 'File diff operations' }
        ];

        const keywords = this.getSearchKeywords(taskType);
        return knownMCPTools.filter(tool => 
            keywords.some(keyword => 
                tool.name.includes(keyword) || 
                tool.description.toLowerCase().includes(keyword)
            )
        ).map(tool => ({
            ...tool,
            source: 'github',
            score: 0.8
        }));
    }

    /**
     * 기존 설치된 도구 확인
     */
    async checkExistingTools() {
        const claudeJsonPath = path.join(__dirname, '..', '.claude.json');
        
        try {
            const config = JSON.parse(fs.readFileSync(claudeJsonPath, 'utf-8'));
            const mcpServers = config.mcpServers || {};
            
            return Object.entries(mcpServers).map(([name, config]) => ({
                name,
                type: config.type,
                command: config.command,
                status: 'installed',
                source: 'local'
            }));
        } catch (error) {
            return [];
        }
    }

    /**
     * 검색 키워드 생성
     */
    getSearchKeywords(taskType) {
        const taskKeywords = {
            'file-editing': ['edit', 'file', 'lines', 'modify'],
            'git': ['git', 'version', 'commit', 'branch'],
            'memory': ['memory', 'storage', 'persist', 'cache'],
            'automation': ['desktop', 'automate', 'command'],
            'diff': ['diff', 'compare', 'patch']
        };

        // 태스크 타입에서 키워드 추출
        const words = taskType.toLowerCase().split(/[-_\s]+/);
        const keywords = new Set(words);

        // 알려진 키워드 추가
        Object.entries(taskKeywords).forEach(([key, values]) => {
            if (words.some(w => key.includes(w))) {
                values.forEach(v => keywords.add(v));
            }
        });

        return Array.from(keywords).slice(0, 3);
    }

    /**
     * 비교 테이블 생성
     */
    createComparisonTable(searchResults, taskType) {
        const allTools = [
            ...searchResults.npm,
            ...searchResults.github,
            ...searchResults.existing
        ];

        // 중복 제거
        const uniqueTools = {};
        allTools.forEach(tool => {
            const key = tool.name || tool.repo;
            if (!uniqueTools[key] || tool.score > uniqueTools[key].score) {
                uniqueTools[key] = tool;
            }
        });

        // 테이블 생성
        const table = {
            title: `MCP Tools for ${taskType}`,
            timestamp: new Date().toISOString(),
            tools: Object.values(uniqueTools).sort((a, b) => (b.score || 0) - (a.score || 0)),
            recommendation: null
        };

        // 추천 도구 선택
        if (table.tools.length > 0) {
            table.recommendation = table.tools[0];
            console.log(`\n📊 [비교 분석 결과]`);
            console.log(`┌────────────────────┬─────────────────────────────┬──────────┐`);
            console.log(`│ Tool Name          │ Description                 │ Source   │`);
            console.log(`├────────────────────┼─────────────────────────────┼──────────┤`);
            table.tools.forEach(tool => {
                const name = (tool.name || tool.repo || '').padEnd(18).slice(0, 18);
                const desc = (tool.description || '').padEnd(27).slice(0, 27);
                const source = (tool.source || '').padEnd(8).slice(0, 8);
                console.log(`│ ${name} │ ${desc} │ ${source} │`);
            });
            console.log(`└────────────────────┴─────────────────────────────┴──────────┘`);
            console.log(`\n✅ 추천 도구: ${table.recommendation.name || table.recommendation.repo}`);
        }

        return table;
    }

    /**
     * 검색 결과 저장
     */
    saveSearchResult(taskType, searchResults, comparisonTable) {
        // 패턴에 저장
        if (!this.patterns.successfulSearches) {
            this.patterns.successfulSearches = [];
        }
        
        this.patterns.successfulSearches.push({
            taskType,
            timestamp: new Date().toISOString(),
            results: searchResults,
            comparison: comparisonTable
        });

        // 최근 10개만 유지
        if (this.patterns.successfulSearches.length > 10) {
            this.patterns.successfulSearches = this.patterns.successfulSearches.slice(-10);
        }

        this.savePatterns();

        // 실패 카운터 리셋
        delete this.failureCounter[taskType];
    }

    /**
     * 설치 스크립트 생성
     */
    generateInstallScript(searchResults) {
        const scriptPath = path.join(__dirname, '..', 'install-found-tools.bat');
        let scriptContent = '@echo off\n';
        scriptContent += 'echo MCP Tool Auto-Installation Script\n';
        scriptContent += 'echo Generated by Auto Tool Finder\n\n';

        // NPM 도구 설치
        if (searchResults.npm.length > 0) {
            scriptContent += 'echo Installing NPM packages...\n';
            searchResults.npm.forEach(tool => {
                scriptContent += `echo Installing ${tool.name}...\n`;
                scriptContent += `call npm install -g ${tool.name}\n`;
            });
        }

        // GitHub 도구 클론
        if (searchResults.github.length > 0) {
            scriptContent += '\necho Cloning GitHub repositories...\n';
            searchResults.github.forEach(tool => {
                if (tool.repo) {
                    scriptContent += `echo Cloning ${tool.repo}...\n`;
                    scriptContent += `git clone https://github.com/${tool.repo}.git mcp-tools/${tool.name}\n`;
                }
            });
        }

        scriptContent += '\necho Installation complete!\n';
        scriptContent += 'pause\n';

        fs.writeFileSync(scriptPath, scriptContent);
        console.log(`\n📝 설치 스크립트 생성: ${scriptPath}`);
    }

    /**
     * 실패 통계 리포트
     */
    getFailureReport() {
        const report = {
            summary: {},
            details: this.failureCounter,
            timestamp: new Date().toISOString()
        };

        Object.entries(this.failureCounter).forEach(([task, data]) => {
            report.summary[task] = {
                count: data.count,
                shouldSearch: data.count >= this.failureThreshold
            };
        });

        return report;
    }

    /**
     * 시스템 리셋
     */
    reset() {
        this.failureCounter = {};
        this.searchHistory = [];
        console.log('[Auto Tool Finder] 시스템 리셋 완료');
    }
}

// 싱글톤 인스턴스 생성
const autoToolFinder = new AutoToolFinder();

// 테스트 함수
async function testAutoToolFinder() {
    console.log('🧪 Auto Tool Finder 테스트 시작...\n');
    
    // 3회 실패 시뮬레이션
    console.log('📝 파일 편집 작업 실패 시뮬레이션:');
    autoToolFinder.recordFailure('file-editing', 'Cannot edit line 627');
    autoToolFinder.recordFailure('file-editing', 'File too large to edit');
    autoToolFinder.recordFailure('file-editing', 'Edit operation failed'); // 3회째 - 자동 검색 트리거
    
    // 잠시 대기 (비동기 작업 완료 대기)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 리포트 출력
    const report = autoToolFinder.getFailureReport();
    console.log('\n📊 실패 통계 리포트:', JSON.stringify(report, null, 2));
    
    console.log('\n✅ Auto Tool Finder 테스트 완료!');
}

// 모듈 exports
module.exports = autoToolFinder;

// 직접 실행 시 테스트
if (require.main === module) {
    testAutoToolFinder().catch(console.error);
}
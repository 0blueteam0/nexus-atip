// 세션 시작 시 자동으로 워크플로우 로드
// 모든 Claude 세션에서 일관된 작업 방식 보장

const fs = require('fs');
const path = require('path');

class WorkflowAutoLoader {
    constructor() {
        this.workflowPath = 'K:/PortableApps/genai/workflows/master-workflows.json';
        this.claudeMdPath = 'K:/PortableApps/genai/CLAUDE.md';
    }

    // 세션 시작 시 자동 실행
    async initialize() {
        console.log('[*] Workflow Auto-Loader Initializing...');
        
        // 1. 워크플로우 파일 확인
        if (!fs.existsSync(this.workflowPath)) {
            console.log('[-] Workflow file not found!');
            return false;
        }

        // 2. 워크플로우 로드
        const workflows = JSON.parse(fs.readFileSync(this.workflowPath, 'utf8'));
        console.log('[+] Workflows loaded successfully');
        console.log('[*] Available workflows:', Object.keys(workflows.workflows));

        // 3. 현재 컨텍스트 분석
        const context = this.analyzeContext();
        
        // 4. 적합한 워크플로우 추천
        const recommended = this.recommendWorkflow(context);
        if (recommended) {
            console.log(`[!] Recommended workflow: ${recommended}`);
        }

        // 5. 메모리에 저장 (kiro-memory 연동 가능)
        this.saveToMemory(workflows);

        return workflows;
    }

    // 현재 작업 컨텍스트 분석
    analyzeContext() {
        // 최근 파일, 열린 프로젝트 등 분석
        const recentFiles = this.getRecentFiles();
        const openProjects = this.getOpenProjects();
        
        return {
            recentFiles,
            openProjects,
            timestamp: new Date().toISOString()
        };
    }

    // 워크플로우 추천
    recommendWorkflow(context) {
        // 파일 패턴으로 작업 유형 추론
        if (context.recentFiles.some(f => f.includes('news') || f.includes('threat'))) {
            return 'news-archiving';
        }
        if (context.recentFiles.some(f => f.includes('.js') || f.includes('.html'))) {
            return 'development';
        }
        return 'research';
    }

    // 최근 파일 목록
    getRecentFiles() {
        // 실제로는 더 정교한 로직 필요
        return fs.readdirSync('K:/PortableApps/genai/vite-app')
            .filter(f => f.endsWith('.js') || f.endsWith('.html'))
            .slice(0, 5);
    }

    // 열린 프로젝트 확인
    getOpenProjects() {
        return ['NEXUS', 'genai'];
    }

    // 메모리에 저장
    saveToMemory(workflows) {
        global.WORKFLOWS = workflows;
        global.WORKFLOW_LOADED = true;
        console.log('[+] Workflows saved to global memory');
    }
}

// 자동 실행
const autoLoader = new WorkflowAutoLoader();
autoLoader.initialize();

module.exports = WorkflowAutoLoader;
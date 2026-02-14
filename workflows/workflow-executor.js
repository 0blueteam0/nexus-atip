// Workflow Executor - 워크플로우 자동 실행 시스템
// 모든 세션에서 일관된 작업 프로세스 보장

class WorkflowExecutor {
    constructor() {
        this.workflows = null;
        this.currentWorkflow = null;
        this.executionLog = [];
        this.mcpTools = {
            'shrimp-task': ['plan_task', 'split_tasks', 'execute_task', 'verify_task'],
            'desktop-commander': ['create_directory', 'write_file', 'edit_block', 'read_file'],
            'edit-file-lines': ['edit_file_lines', 'search_file', 'get_file_lines'],
            'playwright': ['navigate', 'screenshot', 'click', 'console_logs'],
            'git': ['add', 'commit', 'push', 'status'],
            'websearch': ['web_search'],
            'firecrawl': ['firecrawl_search', 'firecrawl_deep_research'],
            'perplexity': ['search', 'deep_research', 'reason'],
            'kiro-memory': ['auto_process_conversation', 'get_memory_context'],
            'filesystem': ['write_file', 'read_text_file', 'create_directory'],
            'supabase': ['apply_migration', 'execute_sql'],
            'github': ['create_issue', 'create_repository', 'push_files'],
            'context7': ['resolve-library-id', 'get-library-docs']
        };
    }

    // 워크플로우 로드
    async loadWorkflows() {
        const fs = require('fs').promises;
        const path = 'K:/PortableApps/genai/workflows/master-workflows.json';
        const data = await fs.readFile(path, 'utf8');
        this.workflows = JSON.parse(data);
        console.log('[+] Workflows loaded:', Object.keys(this.workflows.workflows));
        return this.workflows;
    }    // 특정 워크플로우 실행
    async executeWorkflow(workflowName) {
        if (!this.workflows) await this.loadWorkflows();
        
        const workflow = this.workflows.workflows[workflowName];
        if (!workflow) {
            console.log('[-] Workflow not found:', workflowName);
            return false;
        }

        console.log(`[*] Executing workflow: ${workflow.name}`);
        console.log(`[*] Description: ${workflow.description}`);
        
        this.currentWorkflow = workflow;
        this.executionLog = [];

        for (const step of workflow.steps) {
            await this.executeStep(step);
        }

        await this.saveExecutionLog();
        console.log('[+] Workflow completed successfully!');
        return true;
    }

    // 단계별 실행
    async executeStep(step) {
        console.log(`\n[>>] Phase: ${step.phase}`);
        
        if (step.parallel && step.tools.length > 1) {
            // 병렬 실행
            console.log('[*] Executing tools in parallel...');
            const promises = step.tools.map(tool => this.executeTool(tool));
            await Promise.all(promises);
        } else {
            // 순차 실행
            for (const tool of step.tools) {
                await this.executeTool(tool);
            }
        }        
        if (step.note) {
            console.log(`[?] Note: ${step.note}`);
        }
    }

    // 도구 실행 (실제 Claude가 실행할 명령 생성)
    async executeTool(toolCommand) {
        const [toolName, action] = toolCommand.split('.');
        console.log(`  [>] ${toolName}.${action}`);
        
        this.executionLog.push({
            timestamp: new Date().toISOString(),
            tool: toolName,
            action: action,
            status: 'executed'
        });

        // 실제 실행은 Claude가 수행
        // 여기서는 로깅만
        return { tool: toolName, action: action, result: 'success' };
    }

    // 실행 로그 저장
    async saveExecutionLog() {
        const fs = require('fs').promises;
        const logPath = `K:/PortableApps/genai/workflows/logs/execution-${Date.now()}.json`;
        
        // logs 디렉토리 생성
        await fs.mkdir('K:/PortableApps/genai/workflows/logs', { recursive: true });
        
        await fs.writeFile(logPath, JSON.stringify({
            workflow: this.currentWorkflow.name,
            timestamp: new Date().toISOString(),
            steps: this.executionLog
        }, null, 2));
        
        console.log('[+] Execution log saved:', logPath);
    }    // 워크플로우 추천 (상황에 맞는 워크플로우 제안)
    recommendWorkflow(context) {
        const recommendations = {
            'news': 'news-archiving',
            '뉴스': 'news-archiving',
            'develop': 'development',
            '개발': 'development',
            'research': 'research',
            '조사': 'research',
            'commit': 'development',
            'test': 'development'
        };

        for (const [keyword, workflow] of Object.entries(recommendations)) {
            if (context.toLowerCase().includes(keyword)) {
                return workflow;
            }
        }
        
        return null;
    }

    // 모든 워크플로우 목록
    listWorkflows() {
        if (!this.workflows) {
            console.log('[!] Workflows not loaded. Loading...');
            this.loadWorkflows();
        }
        
        console.log('\n[*] Available Workflows:');
        for (const [key, workflow] of Object.entries(this.workflows.workflows)) {
            console.log(`  - ${key}: ${workflow.name}`);
            console.log(`    ${workflow.description}`);
        }
    }

    // 시스템 상태 조회
    getStatus() {
        return {
            workflowsLoaded: !!this.workflows,
            currentWorkflow: this.currentWorkflow?.name || null,
            executionLogCount: this.executionLog.length,
            availableWorkflows: this.workflows ? Object.keys(this.workflows.workflows) : [],
            mcpToolsConfigured: Object.keys(this.mcpTools).length
        };
    }

    // 자동화 규칙 조회
    getAutomationRules() {
        if (!this.workflows) return [];
        return this.workflows.automation_rules || [];
    }

    // 체이닝 규칙 조회
    getChainingRules() {
        if (!this.workflows) return [];
        return this.workflows.chaining_rules || [];
    }

    // 스킬 트리거 조회
    getSkillTriggers() {
        if (!this.workflows) return {};
        return this.workflows.skill_triggers || {};
    }

    // 키워드로 워크플로우 매칭
    matchWorkflow(userInput) {
        if (!this.workflows) return null;

        const input = userInput.toLowerCase();

        // 자동화 규칙 체크
        for (const rule of this.getAutomationRules()) {
            for (const trigger of rule.triggers) {
                if (input.includes(trigger.toLowerCase())) {
                    return {
                        workflow: rule.execute,
                        matchedTrigger: trigger,
                        rule: rule.name
                    };
                }
            }
        }

        // 기존 추천 로직 fallback
        const recommended = this.recommendWorkflow(userInput);
        if (recommended) {
            return {
                workflow: recommended,
                matchedTrigger: 'keyword',
                rule: 'recommendWorkflow'
            };
        }

        return null;
    }
}

// CLI 인터페이스
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    const executor = new WorkflowExecutor();

    switch (command) {
        case 'status':
            await executor.loadWorkflows();
            const status = executor.getStatus();
            console.log('\n[*] Workflow Executor Status');
            console.log('='.repeat(40));
            console.log(`Workflows Loaded: ${status.workflowsLoaded}`);
            console.log(`Current Workflow: ${status.currentWorkflow || 'None'}`);
            console.log(`Available Workflows: ${status.availableWorkflows.length}`);
            console.log(`MCP Tools Configured: ${status.mcpToolsConfigured}`);
            break;

        case 'list':
            await executor.loadWorkflows();
            executor.listWorkflows();
            break;

        case 'run':
            const workflowName = args[1];
            if (!workflowName) {
                console.log('[-] Usage: node workflow-executor.js run <workflow-name>');
                process.exit(1);
            }
            await executor.loadWorkflows();
            await executor.executeWorkflow(workflowName);
            break;

        case 'match':
            const input = args.slice(1).join(' ');
            if (!input) {
                console.log('[-] Usage: node workflow-executor.js match <user-input>');
                process.exit(1);
            }
            await executor.loadWorkflows();
            const match = executor.matchWorkflow(input);
            if (match) {
                console.log('\n[+] Matched Workflow:');
                console.log(`  Workflow: ${match.workflow}`);
                console.log(`  Trigger: ${match.matchedTrigger}`);
                console.log(`  Rule: ${match.rule}`);
            } else {
                console.log('[-] No matching workflow found');
            }
            break;

        case 'rules':
            await executor.loadWorkflows();
            console.log('\n[*] Automation Rules:');
            for (const rule of executor.getAutomationRules()) {
                console.log(`  - ${rule.name}: ${rule.triggers.join(', ')} -> ${rule.execute}`);
            }
            console.log('\n[*] Chaining Rules:');
            for (const rule of executor.getChainingRules()) {
                console.log(`  - ${rule.output} -> ${rule.input}`);
            }
            break;

        case 'help':
        default:
            console.log('\n[*] Workflow Executor - MCP Tool Chaining Engine');
            console.log('='.repeat(50));
            console.log('Commands:');
            console.log('  status        Show executor status');
            console.log('  list          List all workflows');
            console.log('  run <name>    Execute a workflow');
            console.log('  match <text>  Match user input to workflow');
            console.log('  rules         Show automation/chaining rules');
            console.log('  help          Show this help');
            console.log('\nExamples:');
            console.log('  node workflow-executor.js list');
            console.log('  node workflow-executor.js run development');
            console.log('  node workflow-executor.js match "뉴스 검색해줘"');
            break;
    }
}

// 전역 인스턴스 생성
const workflowExecutor = new WorkflowExecutor();

// Node.js 모듈로 export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WorkflowExecutor,
        loadWorkflows: () => workflowExecutor.loadWorkflows(),
        listWorkflows: () => workflowExecutor.listWorkflows(),
        matchWorkflow: (input) => workflowExecutor.matchWorkflow(input),
        runWorkflow: (name) => workflowExecutor.executeWorkflow(name),
        getStatus: () => workflowExecutor.getStatus(),
        getAutomationRules: () => workflowExecutor.getAutomationRules()
    };
}

// CLI 실행
if (require.main === module) {
    main().catch(err => {
        console.error('[-] Error:', err.message);
        process.exit(1);
    });
}
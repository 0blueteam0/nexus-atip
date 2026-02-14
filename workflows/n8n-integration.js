// N8N + MCP 통합 워크플로우 시스템
// 완벽한 영속성 보장

class N8NWorkflowIntegration {
    constructor() {
        this.n8nUrl = 'http://localhost:5678';
        this.workflows = {
            'news-archiving': 'webhook/news-workflow',
            'development': 'webhook/dev-workflow', 
            'research': 'webhook/research-workflow'
        };
    }

    // 1. N8N에 워크플로우 생성 (한 번만)
    async setupN8NWorkflows() {
        const workflows = [
            {
                name: 'Claude-News-Workflow',
                trigger: 'webhook',
                nodes: [
                    {type: 'webhook', name: 'start'},
                    {type: 'http', name: 'websearch', url: 'mcp://websearch'},
                    {type: 'http', name: 'firecrawl', url: 'mcp://firecrawl'},
                    {type: 'http', name: 'perplexity', url: 'mcp://perplexity'},
                    {type: 'merge', name: 'combine'},
                    {type: 'http', name: 'kiro-memory', url: 'mcp://kiro-memory'},
                    {type: 'http', name: 'filesystem', url: 'mcp://filesystem'}
                ]
            },
            {
                name: 'Claude-Dev-Workflow',
                trigger: 'webhook',
                nodes: [
                    {type: 'webhook', name: 'start'},
                    {type: 'http', name: 'shrimp-task', url: 'mcp://shrimp-task/plan'},
                    {type: 'http', name: 'desktop-commander', url: 'mcp://dc/write'},
                    {type: 'http', name: 'edit-lines', url: 'mcp://edit-lines'},
                    {type: 'http', name: 'playwright', url: 'mcp://playwright/test'},
                    {type: 'http', name: 'git', url: 'mcp://git/commit'}
                ]
            }
        ];

        console.log('[*] Creating N8N workflows...');
        // N8N API로 워크플로우 생성
        return workflows;
    }    // 2. Claude가 작업 시작할 때 N8N 트리거
    async triggerWorkflow(taskType, data) {
        const webhookUrl = `${this.n8nUrl}/${this.workflows[taskType]}`;
        
        console.log(`[*] Triggering N8N workflow: ${taskType}`);
        console.log(`[*] Webhook: ${webhookUrl}`);

        // N8N webhook 호출
        const payload = {
            session_id: Date.now(),
            task_type: taskType,
            user_request: data,
            mcp_tools: this.getMCPToolsForTask(taskType),
            timestamp: new Date().toISOString()
        };

        // N8N이 실행하고 결과 반환
        return this.callN8NWebhook(webhookUrl, payload);
    }

    // 3. MCP 도구 매핑
    getMCPToolsForTask(taskType) {
        const toolMap = {
            'news-archiving': [
                'mcp__websearch__web_search',
                'mcp__firecrawl__firecrawl_search',
                'mcp__perplexity__search',
                'mcp__kiro-memory__auto_process_conversation',
                'mcp__filesystem__write_file'
            ],
            'development': [
                'mcp__shrimp-task__plan_task',
                'mcp__desktop-commander__write_file',
                'mcp__edit-file-lines__edit_file_lines',
                'mcp__playwright__playwright_navigate',
                'mcp__git__commit'
            ],
            'research': [
                'mcp__websearch__web_search',
                'mcp__perplexity__deep_research',
                'mcp__context7__get-library-docs',
                'mcp__firecrawl__firecrawl_deep_research'
            ]
        };
        return toolMap[taskType] || [];
    }    // 4. N8N Webhook 호출
    async callN8NWebhook(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            console.log('[+] N8N workflow executed successfully');
            return result;
        } catch (error) {
            console.log('[-] N8N not running, falling back to local workflow');
            return this.executeLocalWorkflow(data.task_type);
        }
    }

    // 5. 로컬 폴백 (N8N 없을 때)
    executeLocalWorkflow(taskType) {
        const ForceWorkflow = require('./FORCE-WORKFLOW.js');
        const executor = new ForceWorkflow();
        return executor.analyzeAndExecute(taskType);
    }
}

// 싱글톤 인스턴스
const n8nIntegration = new N8NWorkflowIntegration();

module.exports = n8nIntegration;
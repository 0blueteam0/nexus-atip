// N8N-MCP Bridge - 완벽한 워크플로우 영속성
// 이 파일 하나로 모든 세션에서 동일한 워크플로우 보장

const http = require('http');
const { exec } = require('child_process');

class N8NMCPBridge {
    constructor() {
        this.n8nPort = 5678;
        this.n8nRunning = false;
        this.webhookBase = `http://localhost:${this.n8nPort}/webhook`;
        
        // 미리 정의된 워크플로우 webhook ID
        this.workflows = {
            news: `${this.webhookBase}/claude-news-workflow`,
            dev: `${this.webhookBase}/claude-dev-workflow`,
            research: `${this.webhookBase}/claude-research-workflow`
        };
    }

    // N8N 서버 시작 (없으면)
    async ensureN8NRunning() {
        const isRunning = await this.checkN8N();
        if (!isRunning) {
            console.log('[*] Starting N8N server...');
            exec('npx n8n start --tunnel', (err, stdout) => {
                if (!err) {
                    console.log('[+] N8N started successfully');
                    this.n8nRunning = true;
                }
            });
            
            // 서버 시작 대기
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        return true;
    }

    // N8N 상태 확인
    checkN8N() {
        return new Promise((resolve) => {
            http.get(`http://localhost:${this.n8nPort}/healthz`, (res) => {
                resolve(res.statusCode === 200);
            }).on('error', () => {
                resolve(false);
            });
        });
    }
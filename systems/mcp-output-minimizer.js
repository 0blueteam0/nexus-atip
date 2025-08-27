/**
 * MCP Output Minimizer
 * VSCode 터미널 멈춤 현상 방지
 * 대량 JSON 출력을 간결하게 변환
 */

const chalk = require('chalk');

class MCPOutputMinimizer {
    constructor() {
        this.patterns = {
            shrimpTask: /shrimp-task.*split_tasks/i,
            largeJSON: /\{[\s\S]{500,}\}/,
            mcpTool: /mcp__.*?__(.*?)\s*\(/i,
            taskArray: /tasksRaw.*?:\s*"?\[[\s\S]*?\]"?/i
        };
        
        this.interceptConsole();
    }

    interceptConsole() {
        const original = {
            log: console.log,
            info: console.info,
            debug: console.debug
        };

        // Console.log 가로채기
        console.log = (...args) => {
            const output = this.processOutput(args.join(' '));
            if (output) original.log(output);
        };

        console.info = (...args) => {
            const output = this.processOutput(args.join(' '));
            if (output) original.info(output);
        };

        console.debug = (...args) => {
            const output = this.processOutput(args.join(' '));
            if (output) original.debug(output);
        };
    }

    processOutput(text) {
        // 너무 긴 출력 감지
        if (text.length > 1000) {
            
            // Shrimp Task Manager 출력
            if (this.patterns.shrimpTask.test(text)) {
                const taskCount = (text.match(/"name":/g) || []).length;
                return chalk.cyan(`[Shrimp] ${taskCount}개 태스크 생성 중...`);
            }
            
            // MCP 도구 일반
            const mcpMatch = text.match(this.patterns.mcpTool);
            if (mcpMatch) {
                const toolName = mcpMatch[1].replace(/_/g, ' ');
                return chalk.green(`[MCP] ${toolName} 실행 중...`);
            }
            
            // 대용량 JSON
            if (this.patterns.largeJSON.test(text)) {
                const preview = text.substring(0, 100);
                return chalk.gray(`[JSON] ${preview}... (${text.length} chars minimized)`);
            }
            
            // 기타 긴 출력
            return chalk.yellow(`[Output] ${text.substring(0, 80)}... (trimmed)`);
        }
        
        return text; // 짧은 출력은 그대로
    }

    // 통계 표시
    showStats(originalSize, minimizedSize) {
        const reduction = Math.round((1 - minimizedSize/originalSize) * 100);
        console.log(chalk.dim(`Output reduced by ${reduction}%`));
    }
}

// 자동 시작
if (require.main === module) {
    new MCPOutputMinimizer();
    console.log(chalk.green('✓ MCP Output Minimizer 활성화됨'));
}

module.exports = MCPOutputMinimizer;
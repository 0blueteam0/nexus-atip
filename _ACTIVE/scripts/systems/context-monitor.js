/**
 * Context Monitor - Real-time work context detection
 * Monitors user activity and suggests appropriate tools
 */

const { SmartSuggest } = require('./smart-suggest.js');
const fs = require('fs');
const path = require('path');

class ContextMonitor {
    constructor() {
        this.suggest = new SmartSuggest();
        this.lastContext = null;
        this.contextHistory = [];
        this.logPath = 'K:\\PortableApps\\genai\\brain\\context-history.jsonl';
    }

    detectContextChange(input) {
        // 컨텍스트 분석
        const contexts = this.suggest.analyzeContext(input);
        
        if (contexts.length === 0) return false;
        
        const currentContext = contexts.map(c => c.name).sort().join(',');
        
        // 컨텍스트가 변경되었는지 확인
        if (currentContext !== this.lastContext) {
            this.lastContext = currentContext;
            this.logContextChange(currentContext, input);
            return true;
        }
        
        return false;
    }

    logContextChange(context, input) {
        const entry = {
            timestamp: new Date().toISOString(),
            context: context,
            trigger: input.substring(0, 100)
        };
        
        // JSONL 파일에 추가
        fs.appendFileSync(this.logPath, JSON.stringify(entry) + '\n');
        
        this.contextHistory.push(entry);
        
        // 최근 50개만 메모리에 유지
        if (this.contextHistory.length > 50) {
            this.contextHistory = this.contextHistory.slice(-50);
        }
    }

    async monitorAndSuggest(input) {
        if (this.detectContextChange(input)) {
            console.log('\n🔄 Context change detected!\n');
            
            // 새로운 컨텍스트에 맞는 도구 제안
            const suggestions = await this.suggest.suggestTools(input);
            
            // 즉시 필요한 도구가 있으면 설치 스크립트 생성
            if (suggestions && suggestions.immediate.length > 0) {
                await this.suggest.autoInstallSuggestion(suggestions);
                
                // 알림
                console.log('💡 TIP: Run START-WITH-SUGGEST.bat for guided tool installation\n');
            }
            
            return suggestions;
        }
        
        return null;
    }

    getContextStats() {
        // 컨텍스트 사용 통계
        const stats = {};
        
        this.contextHistory.forEach(entry => {
            const contexts = entry.context.split(',');
            contexts.forEach(ctx => {
                stats[ctx] = (stats[ctx] || 0) + 1;
            });
        });
        
        return Object.entries(stats)
            .sort((a, b) => b[1] - a[1])
            .map(([context, count]) => ({ context, count }));
    }
}

// 자동 실행
if (require.main === module) {
    const monitor = new ContextMonitor();
    
    // 명령줄 인자나 환경변수에서 입력 받기
    const input = process.argv.slice(2).join(' ') || process.env.CLAUDE_CURRENT_INPUT || '';
    
    if (input) {
        monitor.monitorAndSuggest(input);
    } else {
        console.log('Context Monitor initialized and ready.');
        console.log('\nRecent context statistics:');
        const stats = monitor.getContextStats();
        stats.slice(0, 5).forEach(s => {
            console.log(`  ${s.context}: ${s.count} times`);
        });
    }
}

module.exports = ContextMonitor;
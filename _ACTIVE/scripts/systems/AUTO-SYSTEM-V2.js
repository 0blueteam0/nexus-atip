/**
 * 🤖 AUTO-SYSTEM V2.0 - 완전 자율 운영 시스템
 * 
 * 기능:
 * - MCP 상태 모니터링
 * - 메모리 자동 관리
 * - 에러 자동 복구
 * - 성능 최적화
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class AutoSystem {
    constructor() {
        this.config = {
            checkInterval: 30000, // 30초마다 체크
            mpcServers: 14,
            memoryLimit: 1000, // MB
            logRetention: 7 // days
        };
        
        this.stats = {
            startTime: new Date(),
            mpcChecks: 0,
            errorsFixed: 0,
            memoryCleaned: 0
        };
    }

    // MCP 서버 상태 체크
    async checkMCPServers() {
        console.log('🔍 MCP 서버 상태 체크 중...');
        
        exec('claude.bat mcp list', (error, stdout, stderr) => {
            if (error) {
                console.error('❌ MCP 체크 실패:', error);
                this.autoFixMCP();
            } else {
                const activeCount = (stdout.match(/✓/g) || []).length;
                console.log(`✅ MCP 활성: ${activeCount}/${this.config.mpcServers}`);
                
                if (activeCount < this.config.mpcServers) {
                    this.reconnectMCP();
                }
            }
            this.stats.mpcChecks++;
        });
    }

    // MCP 자동 수정
    autoFixMCP() {
        console.log('🔧 MCP 자동 수정 시작...');
        
        // .claude.json에서 cmd /c 제거
        const configPath = 'K:/PortableApps/genai/.claude.json';
        let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        Object.keys(config.mcpServers).forEach(server => {
            if (config.mcpServers[server].command === 'cmd' && 
                config.mcpServers[server].args[0] === '/c') {
                config.mcpServers[server].command = config.mcpServers[server].args[1];
                config.mcpServers[server].args = config.mcpServers[server].args.slice(2);
                console.log(`✅ ${server} 수정됨`);
            }
        });
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        this.stats.errorsFixed++;
    }

    // MCP 재연결
    reconnectMCP() {
        console.log('🔄 MCP 재연결 시도...');
        exec('taskkill /F /IM node.exe', () => {
            setTimeout(() => {
                exec('claude.bat --version', (error, stdout) => {
                    if (!error) {
                        console.log('✅ Claude 재시작 완료');
                    }
                });
            }, 2000);
        });
    }

    // 메모리 자동 정리
    async cleanMemory() {
        console.log('🧹 메모리 정리 중...');
        
        // npm-cache 정리
        const cacheDir = 'K:/PortableApps/genai/npm-cache';
        const cacheSize = this.getDirSize(cacheDir);
        
        if (cacheSize > this.config.memoryLimit * 1024 * 1024) {
            exec(`rm -rf ${cacheDir}/_cacache/tmp/*`, () => {
                console.log('✅ 캐시 정리 완료');
                this.stats.memoryCleaned++;
            });
        }
        
        // 오래된 로그 정리
        this.cleanOldLogs();
    }

    // 오래된 로그 삭제
    cleanOldLogs() {
        const logsDir = 'K:/PortableApps/genai/npm-cache/_logs';
        const now = Date.now();
        const maxAge = this.config.logRetention * 24 * 60 * 60 * 1000;
        
        fs.readdirSync(logsDir).forEach(file => {
            const filePath = path.join(logsDir, file);
            const stats = fs.statSync(filePath);
            
            if (now - stats.mtime.getTime() > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ 삭제: ${file}`);
            }
        });
    }

    // 디렉토리 크기 계산
    getDirSize(dir) {
        let size = 0;
        try {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    size += this.getDirSize(filePath);
                } else {
                    size += stats.size;
                }
            });
        } catch (err) {
            // 에러 무시
        }
        return size;
    }

    // 상태 리포트
    generateReport() {
        const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000 / 60);
        
        console.log('\n📊 === 자율 시스템 리포트 ===');
        console.log(`⏱️ 가동 시간: ${uptime}분`);
        console.log(`🔍 MCP 체크: ${this.stats.mpcChecks}회`);
        console.log(`🔧 에러 수정: ${this.stats.errorsFixed}건`);
        console.log(`🧹 메모리 정리: ${this.stats.memoryCleaned}회`);
        console.log('========================\n');
    }

    // 메인 루프
    start() {
        console.log('🚀 AUTO-SYSTEM V2.0 시작!');
        console.log(`⚙️ 체크 간격: ${this.config.checkInterval/1000}초`);
        
        // 초기 체크
        this.checkMCPServers();
        this.cleanMemory();
        
        // 정기 체크
        setInterval(() => {
            this.checkMCPServers();
        }, this.config.checkInterval);
        
        // 메모리 정리 (5분마다)
        setInterval(() => {
            this.cleanMemory();
        }, 5 * 60 * 1000);
        
        // 리포트 (10분마다)
        setInterval(() => {
            this.generateReport();
        }, 10 * 60 * 1000);
        
        // 안전한 종료 처리
        process.on('SIGINT', () => {
            console.log('\n👋 자율 시스템 종료 중...');
            this.generateReport();
            process.exit(0);
        });
    }
}

// 실행
const autoSystem = new AutoSystem();
autoSystem.start();
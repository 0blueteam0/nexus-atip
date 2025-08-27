#!/usr/bin/env node
/**
 * Claude JSON Protector
 * 자동 백업, 무결성 검사, 자동 복원 시스템
 * 2025-01-20
 * 
 * ⚠️ 순환 참조 경고: 197-203행에 순환 참조 포함
 * fs.watchFile이 자신이 수정하는 파일을 감시함
 * 실행하지 마세요!
 */

const fs = require('fs');
const path = require('path');

class ClaudeJsonProtector {
    constructor() {
        this.configPath = 'K:\\PortableApps\\Claude-Code\\.claude.json';
        this.lockFile = this.configPath + '.lock';
        this.backupDir = 'K:\\PortableApps\\Claude-Code\\ARCHIVE\\json-backups';
        this.maxBackups = 20;
        
        // 백업 디렉토리 생성
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }
    
    // 락 파일 체크
    isLocked() {
        if (fs.existsSync(this.lockFile)) {
            const lockTime = fs.statSync(this.lockFile).mtimeMs;
            const now = Date.now();
            // 5초 이상 된 락은 무시
            if (now - lockTime > 5000) {
                fs.unlinkSync(this.lockFile);
                return false;
            }
            return true;
        }
        return false;
    }
    
    // 락 생성
    lock() {
        fs.writeFileSync(this.lockFile, Date.now().toString());
    }
    
    // 락 해제
    unlock() {
        if (fs.existsSync(this.lockFile)) {
            fs.unlinkSync(this.lockFile);
        }
    }
    
    // 자동 백업 (매 실행 시)
    autoBackup() {
        try {
            // KST 시간 사용
            const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
            const timestamp = kstDate.toISOString()
                .replace(/T/, '-')
                .replace(/:/g, '-')
                .substring(0, 19);
            
            const backupPath = path.join(this.backupDir, `claude-${timestamp}.json`);
            
            if (fs.existsSync(this.configPath)) {
                fs.copyFileSync(this.configPath, backupPath);
                console.log(`✅ Backup created: ${path.basename(backupPath)}`);
                
                // 오래된 백업 정리
                this.cleanOldBackups();
                return true;
            }
        } catch (e) {
            console.error('❌ Backup failed:', e.message);
            return false;
        }
    }
    
    // 오래된 백업 정리
    cleanOldBackups() {
        const backups = fs.readdirSync(this.backupDir)
            .filter(f => f.startsWith('claude-') && f.endsWith('.json'))
            .sort();
        
        if (backups.length > this.maxBackups) {
            const toDelete = backups.slice(0, backups.length - this.maxBackups);
            toDelete.forEach(file => {
                fs.unlinkSync(path.join(this.backupDir, file));
            });
            console.log(`🧹 Cleaned ${toDelete.length} old backups`);
        }
    }
    
    // 무결성 검사
    validateJson() {
        try {
            if (!fs.existsSync(this.configPath)) {
                console.log('❌ .claude.json not found');
                return false;
            }
            
            const content = fs.readFileSync(this.configPath, 'utf8');
            const json = JSON.parse(content);
            
            // 필수 필드 검사
            const requiredFields = ['mcpServers', 'userID', 'projects'];
            const missingFields = requiredFields.filter(field => !json[field]);
            
            if (missingFields.length > 0) {
                console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
                return false;
            }
            
            // MCP 서버 검사
            if (Object.keys(json.mcpServers).length === 0) {
                console.log('❌ No MCP servers configured');
                return false;
            }
            
            // 날짜 형식 수정 (2025-08-16 같은 오류 수정)
            if (json.firstStartTime && json.firstStartTime.includes('2025-08')) {
                json.firstStartTime = json.firstStartTime.replace('2025-08', '2025-01');
                fs.writeFileSync(this.configPath, JSON.stringify(json, null, 2));  // ⚠️ 121행: 파일 수정
                console.log('✅ Fixed date format error');
            }
            
            console.log(`✅ Validation passed - ${Object.keys(json.mcpServers).length} MCP servers`);
            return true;
            
        } catch (e) {
            console.error('❌ Validation failed:', e.message);
            return false;
        }
    }
    
    // 백업에서 복원
    restoreFromBackup() {
        try {
            const backups = fs.readdirSync(this.backupDir)
                .filter(f => f.startsWith('claude-') && f.endsWith('.json'))
                .sort()
                .reverse();
            
            if (backups.length === 0) {
                console.log('❌ No backups available');
                return false;
            }
            
            // 가장 최근 유효한 백업 찾기
            for (const backup of backups) {
                const backupPath = path.join(this.backupDir, backup);
                try {
                    const content = fs.readFileSync(backupPath, 'utf8');
                    const json = JSON.parse(content);
                    
                    if (json.mcpServers && Object.keys(json.mcpServers).length > 0) {
                        // 백업 복원
                        fs.copyFileSync(backupPath, this.configPath);
                        console.log(`✅ Restored from ${backup}`);
                        return true;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            console.log('❌ No valid backup found');
            return false;
            
        } catch (e) {
            console.error('❌ Restore failed:', e.message);
            return false;
        }
    }
    
    // 실시간 모니터링
    startMonitoring(interval = 30000) {
        console.log('🔍 Starting .claude.json monitoring...');
        
        // 초기 검사
        this.autoBackup();
        this.validateJson();
        
        // 주기적 검사
        setInterval(() => {
            if (!this.isLocked()) {
                this.lock();
                
                if (!this.validateJson()) {
                    console.log('⚠️ Corruption detected, attempting restore...');
                    this.restoreFromBackup();
                }
                
                this.unlock();
            }
        }, interval);
        
        // ⚠️⚠️⚠️ 순환 참조 시작 ⚠️⚠️⚠️
        // 파일 변경 감지
        fs.watchFile(this.configPath, (curr, prev) => {  // 197행: 파일 감시 시작
            if (curr.mtime !== prev.mtime) {
                console.log('📝 .claude.json changed');
                setTimeout(() => {
                    this.autoBackup();
                    this.validateJson();  // 202행: validateJson 호출 → 121행에서 파일 수정 → 다시 watchFile 트리거
                }, 1000);
            }
        });
        // ⚠️⚠️⚠️ 순환 참조 끝 ⚠️⚠️⚠️
    }
}

// 직접 실행 시
if (require.main === module) {
    const protector = new ClaudeJsonProtector();
    
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'backup':
            protector.autoBackup();
            break;
        case 'validate':
            protector.validateJson();
            break;
        case 'restore':
            protector.restoreFromBackup();
            break;
        case 'monitor':
            protector.startMonitoring();
            // Keep process alive
            process.stdin.resume();
            break;
        default:
            console.log(`
Claude JSON Protector
Usage:
  node claude-json-protector.js backup   - Create backup
  node claude-json-protector.js validate - Validate JSON
  node claude-json-protector.js restore  - Restore from backup
  node claude-json-protector.js monitor  - Start monitoring
            `);
    }
}

module.exports = ClaudeJsonProtector;
#!/usr/bin/env node
/**
 * Safe JSON Backup System
 * 순환 참조 없는 안전한 백업 시스템
 * 2025-08-20
 */

const fs = require('fs');
const path = require('path');

class SafeJsonBackup {
    constructor() {
        this.configPath = 'K:\\PortableApps\\Claude-Code\\.claude.json';
        this.backupDir = 'K:\\PortableApps\\Claude-Code\\ARCHIVE\\json-backups';
        this.maxBackups = 10;
        
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }
    
    // 단순 백업 (파일 감시 없음)
    backup() {
        try {
            const timestamp = new Date().toISOString()
                .replace(/T/, '-')
                .replace(/:/g, '-')
                .substring(0, 19);
            
            const backupPath = path.join(this.backupDir, `claude-${timestamp}.json`);
            
            if (fs.existsSync(this.configPath)) {
                const content = fs.readFileSync(this.configPath, 'utf8');
                const json = JSON.parse(content);
                
                // 타임스탬프 검증
                this.validateTimestamps(json);
                
                // 백업 생성
                fs.copyFileSync(this.configPath, backupPath);
                console.log(`✅ Backup created: ${path.basename(backupPath)}`);
                
                this.cleanOldBackups();
                return true;
            }
        } catch (e) {
            console.error('❌ Backup failed:', e.message);
            return false;
        }
    }
    
    // 타임스탬프 검증 (수정하지 않음, 검증만)
    validateTimestamps(json) {
        const now = Date.now();
        const issues = [];
        
        if (json.changelogLastFetched && json.changelogLastFetched > now) {
            issues.push(`changelogLastFetched is in the future: ${new Date(json.changelogLastFetched)}`);
        }
        
        if (json.claudeCodeFirstTokenDate) {
            const date = new Date(json.claudeCodeFirstTokenDate);
            const month = date.getMonth() + 1;
            if (month === 1 && new Date().getMonth() + 1 === 8) {
                issues.push(`claudeCodeFirstTokenDate has wrong month: ${json.claudeCodeFirstTokenDate}`);
            }
        }
        
        if (issues.length > 0) {
            console.log('⚠️ Timestamp issues detected:');
            issues.forEach(issue => console.log(`  - ${issue}`));
        } else {
            console.log('✓ All timestamps are valid');
        }
        
        return issues.length === 0;
    }
    
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
}

// 직접 실행
if (require.main === module) {
    const backup = new SafeJsonBackup();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'backup';
    
    switch (command) {
        case 'backup':
            backup.backup();
            break;
        case 'validate':
            const content = fs.readFileSync(backup.configPath, 'utf8');
            const json = JSON.parse(content);
            backup.validateTimestamps(json);
            break;
        default:
            console.log(`
Safe JSON Backup System
Usage:
  node safe-json-backup.js         - Create backup
  node safe-json-backup.js validate - Validate timestamps only
            `);
    }
}

module.exports = SafeJsonBackup;
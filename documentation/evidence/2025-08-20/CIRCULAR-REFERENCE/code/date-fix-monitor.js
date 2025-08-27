#!/usr/bin/env node
/**
 * Date Fix Monitor
 * 날짜 형식 오류를 자동으로 감지하고 수정
 * 2025-08-20 생성
 */

const fs = require('fs');
const path = require('path');

class DateFixMonitor {
    constructor() {
        this.configPath = 'K:\\PortableApps\\Claude-Code\\.claude.json';
        this.today = new Date();
        // 실제 날짜 (환경 변수에서 확인)
        this.actualYear = 2025;
        this.actualMonth = 8; // 8월
        this.actualDay = 20;
    }
    
    // 날짜 패턴 감지 및 수정
    fixDates() {
        try {
            let content = fs.readFileSync(this.configPath, 'utf8');
            let json = JSON.parse(content);
            let modified = false;
            
            // firstStartTime 수정
            if (json.firstStartTime && json.firstStartTime.includes('2025-01-')) {
                const oldDate = json.firstStartTime;
                json.firstStartTime = json.firstStartTime.replace('2025-01-', '2025-08-');
                console.log(`✅ Fixed firstStartTime: ${oldDate} → ${json.firstStartTime}`);
                modified = true;
            }
            
            // claudeCodeFirstTokenDate 수정
            if (json.claudeCodeFirstTokenDate && json.claudeCodeFirstTokenDate.includes('2025-01-')) {
                const oldDate = json.claudeCodeFirstTokenDate;
                json.claudeCodeFirstTokenDate = json.claudeCodeFirstTokenDate.replace('2025-01-', '2025-08-');
                console.log(`✅ Fixed claudeCodeFirstTokenDate: ${oldDate} → ${json.claudeCodeFirstTokenDate}`);
                modified = true;
            }
            
            // 미래 날짜 방지 (2025년 9월 이후)
            if (json.firstStartTime && json.firstStartTime.includes('2025-09-')) {
                json.firstStartTime = `2025-08-${this.actualDay}T03:37:01.975Z`;
                console.log(`✅ Fixed future date in firstStartTime`);
                modified = true;
            }
            
            if (modified) {
                // 수정된 내용 저장
                fs.writeFileSync(this.configPath, JSON.stringify(json, null, 2));
                console.log('💾 Saved corrected dates to .claude.json');
                return true;
            } else {
                console.log('✓ Dates are correct');
                return false;
            }
            
        } catch (e) {
            console.error('❌ Error fixing dates:', e.message);
            return false;
        }
    }
    
    // 파일명 날짜 오류 감지
    checkFilenameDates() {
        const files = fs.readdirSync('K:\\PortableApps\\Claude-Code');
        const wrongDates = [];
        
        files.forEach(file => {
            // 20250120 같은 잘못된 날짜 패턴 찾기
            if (file.includes('20250120') || file.includes('2025-01-20')) {
                wrongDates.push(file);
            }
        });
        
        if (wrongDates.length > 0) {
            console.log('\n⚠️ Files with wrong dates:');
            wrongDates.forEach(file => {
                const correctName = file
                    .replace('20250120', '20250820')
                    .replace('2025-01-20', '2025-08-20');
                console.log(`  ${file} → should be ${correctName}`);
            });
        }
        
        return wrongDates;
    }
    
    // 연속 모니터링
    startMonitoring(interval = 60000) {
        console.log('🔍 Starting date monitoring...');
        console.log(`📅 Actual date: ${this.actualYear}-${String(this.actualMonth).padStart(2, '0')}-${this.actualDay}`);
        
        // 초기 수정
        this.fixDates();
        this.checkFilenameDates();
        
        // 주기적 검사
        setInterval(() => {
            this.fixDates();
        }, interval);
        
        console.log('✅ Monitoring active (checking every minute)');
    }
}

// 직접 실행
if (require.main === module) {
    const monitor = new DateFixMonitor();
    
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'fix':
            monitor.fixDates();
            monitor.checkFilenameDates();
            break;
        case 'monitor':
            monitor.startMonitoring();
            process.stdin.resume();
            break;
        default:
            console.log(`
Date Fix Monitor
Usage:
  node date-fix-monitor.js fix     - Fix dates once
  node date-fix-monitor.js monitor - Start monitoring
            `);
    }
}

module.exports = DateFixMonitor;
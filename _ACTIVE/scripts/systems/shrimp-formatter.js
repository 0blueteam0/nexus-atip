#!/usr/bin/env node
/**
 * Shrimp Task Formatter
 * Shrimp Task의 출력을 깔끔하게 포맷팅하는 유틸리티
 */

const fs = require('fs');
const path = require('path');

class ShrimpFormatter {
    constructor() {
        this.taskFile = 'K:/PortableApps/Claude-Code/ShrimpData/current-tasks.json';
        this.icons = {
            pending: '⏳',
            in_progress: '🔄',
            completed: '✅',
            blocked: '🚫',
            high: '🔴',
            medium: '🟡',
            low: '🟢'
        };
    }

    loadTasks() {
        try {
            if (fs.existsSync(this.taskFile)) {
                const data = fs.readFileSync(this.taskFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('❌ Task 파일 읽기 실패:', error.message);
        }
        return { tasks: [] };
    }

    formatTask(task, index) {
        const icon = this.icons[task.status] || '📋';
        const priority = this.icons[task.priority] || '';
        
        let output = `\n${icon} **[${index + 1}] ${task.name}**\n`;
        
        // 간단한 설명
        if (task.description) {
            output += `   📝 ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}\n`;
        }
        
        // 상태와 우선순위
        output += `   상태: ${this.translateStatus(task.status)}`;
        if (task.priority) {
            output += ` | 우선순위: ${priority} ${this.translatePriority(task.priority)}`;
        }
        output += '\n';
        
        // 의존성
        if (task.dependencies && task.dependencies.length > 0) {
            output += `   🔗 의존: ${task.dependencies.length}개 작업\n`;
        }
        
        // 완료 요약
        if (task.status === 'completed' && task.summary) {
            output += `   ✨ ${task.summary.substring(0, 80)}${task.summary.length > 80 ? '...' : ''}\n`;
        }
        
        return output;
    }

    translateStatus(status) {
        const translations = {
            'pending': '대기중',
            'in_progress': '진행중',
            'completed': '완료',
            'blocked': '차단됨'
        };
        return translations[status] || status;
    }

    translatePriority(priority) {
        const translations = {
            'high': '높음',
            'medium': '보통',
            'low': '낮음'
        };
        return translations[priority] || priority;
    }

    displayDashboard() {
        const data = this.loadTasks();
        const tasks = data.tasks || [];
        
        if (tasks.length === 0) {
            console.log('\n📭 현재 등록된 작업이 없습니다.\n');
            return;
        }

        // 상태별 카운트
        const counts = {
            pending: 0,
            in_progress: 0,
            completed: 0,
            blocked: 0
        };
        
        tasks.forEach(task => {
            if (counts.hasOwnProperty(task.status)) {
                counts[task.status]++;
            }
        });

        // 대시보드 헤더
        console.log('\n' + '='.repeat(60));
        console.log('📊 **Shrimp Task 대시보드**');
        console.log('='.repeat(60));
        
        // 상태 요약
        console.log('\n📈 **작업 현황**');
        console.log(`   ⏳ 대기중: ${counts.pending}개`);
        console.log(`   🔄 진행중: ${counts.in_progress}개`);
        console.log(`   ✅ 완료: ${counts.completed}개`);
        console.log(`   🚫 차단: ${counts.blocked}개`);
        console.log(`   📋 전체: ${tasks.length}개`);
        
        // 진행중인 작업
        const inProgress = tasks.filter(t => t.status === 'in_progress');
        if (inProgress.length > 0) {
            console.log('\n🔄 **현재 진행중**');
            inProgress.forEach((task, i) => console.log(this.formatTask(task, i)));
        }
        
        // 대기중인 작업
        const pending = tasks.filter(t => t.status === 'pending');
        if (pending.length > 0) {
            console.log('\n⏳ **대기중 작업**');
            pending.forEach((task, i) => console.log(this.formatTask(task, i)));
        }
        
        // 최근 완료 작업 (최대 3개)
        const completed = tasks.filter(t => t.status === 'completed')
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 3);
            
        if (completed.length > 0) {
            console.log('\n✅ **최근 완료**');
            completed.forEach((task, i) => console.log(this.formatTask(task, i)));
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
    }

    // 간단한 리스트 표시
    displaySimpleList() {
        const data = this.loadTasks();
        const tasks = data.tasks || [];
        
        if (tasks.length === 0) {
            console.log('📭 작업 없음');
            return;
        }

        console.log('\n📋 **작업 목록**\n');
        tasks.forEach((task, index) => {
            const icon = this.icons[task.status] || '📋';
            console.log(`${icon} [${index + 1}] ${task.name} (${this.translateStatus(task.status)})`);
        });
        console.log();
    }
}

// 실행
if (require.main === module) {
    const formatter = new ShrimpFormatter();
    const args = process.argv.slice(2);
    
    if (args.includes('--simple') || args.includes('-s')) {
        formatter.displaySimpleList();
    } else {
        formatter.displayDashboard();
    }
}

module.exports = ShrimpFormatter;
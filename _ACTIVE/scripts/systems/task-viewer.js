/**
 * Task Viewer - 깔끔한 작업 표시
 * Shrimp Task와 기존 작업 시스템 통합 뷰어
 */

const fs = require('fs');
const path = require('path');

class TaskViewer {
    constructor() {
        this.shrimpFile = 'K:/PortableApps/Claude-Code/ShrimpData/current-tasks.json';
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            dim: '\x1b[2m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m'
        };
    }

    color(text, colorName) {
        if (!this.colors[colorName]) return text;
        return `${this.colors[colorName]}${text}${this.colors.reset}`;
    }

    loadTasks() {
        try {
            if (fs.existsSync(this.shrimpFile)) {
                const data = fs.readFileSync(this.shrimpFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            return null;
        }
        return null;
    }

    displayClean() {
        const data = this.loadTasks();
        if (!data || !data.tasks) {
            console.log('\n📭 현재 등록된 작업이 없습니다.\n');
            return;
        }

        console.log('\n' + '─'.repeat(60));
        console.log(this.color('📊 작업 현황', 'bright'));
        console.log('─'.repeat(60));

        // 작업 상태별 분류
        const byStatus = {
            'in-progress': [],
            'pending': [],
            'completed': []
        };

        data.tasks.forEach(task => {
            // 메인 태스크
            if (task.status && byStatus[task.status]) {
                byStatus[task.status].push({
                    title: task.title || task.name || task.id,
                    note: task.note || task.description || '',
                    subtasks: task.subtasks || []
                });
            }
            // 서브태스크 체크
            if (task.subtasks) {
                task.subtasks.forEach(sub => {
                    if (sub.status && byStatus[sub.status]) {
                        byStatus[sub.status].push({
                            title: `  └─ ${sub.title || sub.name || sub.id}`,
                            note: sub.note || sub.details || '',
                            parent: task.title || task.id
                        });
                    }
                });
            }
        });

        // 진행중 작업
        if (byStatus['in-progress'].length > 0) {
            console.log(this.color('\n🔄 진행중', 'yellow'));
            byStatus['in-progress'].forEach(task => {
                console.log(`  • ${task.title}`);
                if (task.note) {
                    console.log(`    ${this.color(task.note, 'dim')}`);
                }
            });
        }

        // 대기중 작업
        if (byStatus['pending'].length > 0) {
            console.log(this.color('\n⏳ 대기중', 'cyan'));
            byStatus['pending'].forEach(task => {
                console.log(`  • ${task.title}`);
                if (task.note && task.note.length < 80) {
                    console.log(`    ${this.color(task.note, 'dim')}`);
                }
            });
        }

        // 완료 작업 (최근 5개만)
        if (byStatus['completed'].length > 0) {
            const recent = byStatus['completed'].slice(-5);
            console.log(this.color('\n✅ 최근 완료', 'green'));
            recent.forEach(task => {
                console.log(`  • ${task.title}`);
            });
        }

        // 통계
        console.log('\n' + '─'.repeat(60));
        console.log(`📈 전체: ${data.tasks.length}개 작업`);
        console.log(`   진행중: ${byStatus['in-progress'].length} | 대기: ${byStatus['pending'].length} | 완료: ${byStatus['completed'].length}`);
        console.log('─'.repeat(60) + '\n');
    }

    // 간단 목록
    displaySimple() {
        const data = this.loadTasks();
        if (!data || !data.tasks) {
            console.log('📭 작업 없음');
            return;
        }

        console.log('\n📋 작업 목록\n');
        data.tasks.forEach((task, i) => {
            const status = task.status === 'completed' ? '✅' : 
                          task.status === 'in-progress' ? '🔄' : '⏳';
            const title = task.title || task.name || task.id;
            console.log(`${status} [${i+1}] ${title}`);
            
            if (task.subtasks) {
                task.subtasks.forEach(sub => {
                    const subStatus = sub.status === 'completed' ? '✓' : 
                                     sub.status === 'in-progress' ? '→' : '·';
                    console.log(`    ${subStatus} ${sub.title || sub.name || sub.id}`);
                });
            }
        });
        console.log();
    }
}

// 실행
if (require.main === module) {
    const viewer = new TaskViewer();
    const args = process.argv.slice(2);
    
    if (args.includes('--simple') || args.includes('-s')) {
        viewer.displaySimple();
    } else {
        viewer.displayClean();
    }
}

module.exports = TaskViewer;
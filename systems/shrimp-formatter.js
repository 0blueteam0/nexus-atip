#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ShrimpFormatter {
    constructor() {
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            dim: '\x1b[2m',
            
            // 색상
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m',
            
            // 배경
            bgBlack: '\x1b[40m',
            bgRed: '\x1b[41m',
            bgGreen: '\x1b[42m',
            bgYellow: '\x1b[43m',
            bgBlue: '\x1b[44m',
        };
        
        this.statusColors = {
            'pending': this.colors.yellow,
            'in_progress': this.colors.cyan,
            'completed': this.colors.green,
            'blocked': this.colors.red
        };
        
        this.statusIcons = {
            'pending': '⏳',
            'in_progress': '🔄',
            'completed': '✅',
            'blocked': '🚫'
        };
        
        // ASCII 전용 아이콘 (Windows 호환)
        this.asciiIcons = {
            'pending': '[*]',
            'in_progress': '[>]',
            'completed': '[+]',
            'blocked': '[!]'
        };
    }
    
    formatTask(task, useAscii = true) {
        const icons = useAscii ? this.asciiIcons : this.statusIcons;
        const status = task.status || 'pending';
        const color = this.statusColors[status];
        const icon = icons[status];
        
        let output = [];
        
        // 태스크 헤더
        output.push(`${color}${icon} ${task.name || task.title}${this.colors.reset}`);
        output.push(`   ID: ${this.colors.dim}${task.id}${this.colors.reset}`);
        
        // 설명
        if (task.description) {
            output.push(`   ${this.colors.cyan}설명:${this.colors.reset} ${task.description}`);
        }
        
        // 구현 가이드
        if (task.implementationGuide) {
            output.push(`   ${this.colors.magenta}구현:${this.colors.reset}`);
            const lines = task.implementationGuide.split('\n');
            lines.forEach(line => {
                output.push(`      ${line}`);
            });
        }
        
        // 의존성
        if (task.dependencies && task.dependencies.length > 0) {
            output.push(`   ${this.colors.yellow}의존성:${this.colors.reset} ${task.dependencies.join(', ')}`);
        } else {
            output.push(`   ${this.colors.green}의존성: 없음${this.colors.reset}`);
        }
        
        // 검증 기준
        if (task.verificationCriteria) {
            output.push(`   ${this.colors.blue}검증:${this.colors.reset} ${task.verificationCriteria}`);
        }
        
        // 생성/수정 시간
        if (task.created) {
            const date = new Date(task.created);
            output.push(`   ${this.colors.dim}생성: ${date.toLocaleString('ko-KR')}${this.colors.reset}`);
        }
        
        return output.join('\n');
    }
    
    formatTaskList(tasks, title = 'Task List') {
        let output = [];
        
        // 헤더
        output.push('');
        output.push(`${this.colors.bright}${'='.repeat(60)}${this.colors.reset}`);
        output.push(`${this.colors.bright}${this.colors.cyan}  ${title}${this.colors.reset}`);
        output.push(`${this.colors.bright}${'='.repeat(60)}${this.colors.reset}`);
        output.push('');
        
        // 상태별 카운트
        const statusCount = {
            pending: 0,
            in_progress: 0,
            completed: 0,
            blocked: 0
        };
        
        tasks.forEach(task => {
            const status = task.status || 'pending';
            statusCount[status] = (statusCount[status] || 0) + 1;
        });
        
        // 상태 요약
        output.push(`${this.colors.bright}상태 요약:${this.colors.reset}`);
        Object.entries(statusCount).forEach(([status, count]) => {
            if (count > 0) {
                const color = this.statusColors[status];
                const icon = this.asciiIcons[status];
                output.push(`  ${color}${icon} ${status}: ${count}개${this.colors.reset}`);
            }
        });
        output.push('');
        output.push(`${this.colors.dim}${'─'.repeat(60)}${this.colors.reset}`);
        output.push('');
        
        // 태스크 목록
        tasks.forEach((task, index) => {
            output.push(this.formatTask(task));
            if (index < tasks.length - 1) {
                output.push(`${this.colors.dim}${'─'.repeat(40)}${this.colors.reset}`);
            }
        });
        
        output.push('');
        output.push(`${this.colors.bright}${'='.repeat(60)}${this.colors.reset}`);
        output.push('');
        
        return output.join('\n');
    }
    
    formatJSON(jsonString) {
        try {
            const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
            
            // Shrimp Task 데이터인지 확인
            if (data.tasks && Array.isArray(data.tasks)) {
                return this.formatTaskList(data.tasks, data.project || 'Shrimp Tasks');
            }
            
            // 단일 태스크인 경우
            if (data.id && (data.name || data.title)) {
                return this.formatTask(data);
            }
            
            // 태스크 배열인 경우
            if (Array.isArray(data)) {
                const tasks = data.filter(item => item.id && (item.name || item.title));
                if (tasks.length > 0) {
                    return this.formatTaskList(tasks);
                }
            }
            
            // 기본 JSON 포맷팅
            return JSON.stringify(data, null, 2);
            
        } catch (error) {
            return `Error formatting: ${error.message}\n\nOriginal:\n${jsonString}`;
        }
    }
    
    saveAsHTML(tasks, outputPath) {
        const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shrimp Task Manager Dashboard</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #764ba2;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        .task {
            background: #f8f9fa;
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .task.completed { border-left-color: #4caf50; }
        .task.in_progress { border-left-color: #2196f3; }
        .task.pending { border-left-color: #ff9800; }
        .task.blocked { border-left-color: #f44336; }
        .task-header {
            font-weight: bold;
            font-size: 1.1em;
            margin-bottom: 5px;
        }
        .task-id {
            color: #999;
            font-size: 0.8em;
            font-family: monospace;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            color: white;
            margin-right: 5px;
        }
        .badge.pending { background: #ff9800; }
        .badge.in_progress { background: #2196f3; }
        .badge.completed { background: #4caf50; }
        .badge.blocked { background: #f44336; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🦐 Shrimp Task Manager Dashboard</h1>
        <div class="stats">
            <div class="stat-card">
                <h3>대기 중</h3>
                <div style="font-size: 2em; color: #ff9800;">${tasks.filter(t => t.status === 'pending').length}</div>
            </div>
            <div class="stat-card">
                <h3>진행 중</h3>
                <div style="font-size: 2em; color: #2196f3;">${tasks.filter(t => t.status === 'in_progress').length}</div>
            </div>
            <div class="stat-card">
                <h3>완료</h3>
                <div style="font-size: 2em; color: #4caf50;">${tasks.filter(t => t.status === 'completed').length}</div>
            </div>
            <div class="stat-card">
                <h3>전체</h3>
                <div style="font-size: 2em; color: #764ba2;">${tasks.length}</div>
            </div>
        </div>
        
        <h2>태스크 목록</h2>
        ${tasks.map(task => `
            <div class="task ${task.status || 'pending'}">
                <div class="task-header">
                    <span class="badge ${task.status || 'pending'}">${task.status || 'pending'}</span>
                    ${task.name || task.title}
                </div>
                <div class="task-id">ID: ${task.id}</div>
                ${task.description ? `<div style="margin-top: 10px;">${task.description}</div>` : ''}
                ${task.dependencies && task.dependencies.length > 0 ? 
                    `<div style="margin-top: 5px; color: #666;">의존성: ${task.dependencies.join(', ')}</div>` : ''}
            </div>
        `).join('')}
        
        <div style="text-align: center; margin-top: 30px; color: #999;">
            Generated: ${new Date().toLocaleString('ko-KR')}
        </div>
    </div>
</body>
</html>`;
        
        fs.writeFileSync(outputPath, html, 'utf8');
        return outputPath;
    }
}

// CLI 실행
if (require.main === module) {
    const formatter = new ShrimpFormatter();
    
    // 테스트 데이터 또는 파일 읽기
    const args = process.argv.slice(2);
    
    if (args[0] && fs.existsSync(args[0])) {
        // 파일 읽기
        const content = fs.readFileSync(args[0], 'utf8');
        const formatted = formatter.formatJSON(content);
        console.log(formatted);
        
        // HTML 저장 옵션
        if (args[1] === '--html') {
            const data = JSON.parse(content);
            const tasks = data.tasks || [data];
            const htmlPath = args[2] || 'shrimp-tasks.html';
            formatter.saveAsHTML(tasks, htmlPath);
            console.log(`\nHTML saved to: ${htmlPath}`);
        }
    } else {
        // 사용법 표시
        console.log('Shrimp Formatter - Raw JSON을 보기 좋게 포맷팅');
        console.log('\n사용법:');
        console.log('  node shrimp-formatter.js <json-file>');
        console.log('  node shrimp-formatter.js <json-file> --html [output.html]');
        console.log('\n예제:');
        console.log('  node shrimp-formatter.js current-tasks.json');
        console.log('  node shrimp-formatter.js current-tasks.json --html dashboard.html');
    }
}

module.exports = ShrimpFormatter;
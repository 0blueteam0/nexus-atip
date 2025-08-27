#!/usr/bin/env node

/**
 * Shrimp Task Manager Output Formatter
 * Makes task output more user-friendly and compact
 */

const fs = require('fs');
const path = require('path');

// Colors for console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
};

// Status icons
const statusIcons = {
    pending: '⏳',
    in_progress: '🔄',
    completed: '✅',
    blocked: '🚫',
    failed: '❌'
};

// Status colors
const statusColors = {
    pending: colors.yellow,
    in_progress: colors.cyan,
    completed: colors.green,
    blocked: colors.red,
    failed: colors.red
};

function formatTask(task) {
    const icon = statusIcons[task.status] || '❓';
    const color = statusColors[task.status] || colors.white;
    const statusText = task.status.toUpperCase().padEnd(12);
    
    // Compact single-line format
    const shortId = task.id ? task.id.substring(0, 8) : 'NO-ID';
    const shortName = task.name || task.content || 'Unnamed Task';
    const maxNameLen = 50;
    const displayName = shortName.length > maxNameLen 
        ? shortName.substring(0, maxNameLen - 3) + '...' 
        : shortName;
    
    return `${icon} ${color}[${statusText}]${colors.reset} ${displayName} ${colors.dim}(${shortId})${colors.reset}`;
}

function formatTaskList(tasks) {
    if (!tasks || tasks.length === 0) {
        return `${colors.dim}No tasks found${colors.reset}`;
    }
    
    // Group by status
    const grouped = {};
    tasks.forEach(task => {
        const status = task.status || 'unknown';
        if (!grouped[status]) grouped[status] = [];
        grouped[status].push(task);
    });
    
    let output = [];
    
    // Header
    output.push(`${colors.bright}📋 Task Summary${colors.reset}`);
    output.push(`${'─'.repeat(60)}`);
    
    // Status counts in one line
    const counts = Object.keys(grouped).map(status => {
        const count = grouped[status].length;
        const color = statusColors[status] || colors.white;
        const icon = statusIcons[status] || '❓';
        return `${icon} ${color}${status}: ${count}${colors.reset}`;
    }).join(' | ');
    output.push(counts);
    output.push('');
    
    // Tasks by status (compact)
    ['in_progress', 'pending', 'blocked', 'completed', 'failed'].forEach(status => {
        if (grouped[status] && grouped[status].length > 0) {
            grouped[status].forEach(task => {
                output.push(formatTask(task));
            });
        }
    });
    
    return output.join('\n');
}

// Test with sample data
function test() {
    const sampleTasks = [
        { id: 'be5b14f3-1357-4dfc-88af-508529886f9c', name: '팝업 프로세스 실시간 모니터링', status: 'pending' },
        { id: '837c537f-6118-4fc1-8058-c2a97c831298', name: '스케줄된 작업 점검', status: 'pending' },
        { id: 'a11811f0-438d-4845-a383-75a11674287e', name: '백그라운드 서비스 분석', status: 'pending' },
        { id: 'test-1234', name: 'Test task in progress', status: 'in_progress' },
        { id: 'test-5678', name: 'Completed task example', status: 'completed' }
    ];
    
    console.log(formatTaskList(sampleTasks));
    console.log('\n' + '─'.repeat(60) + '\n');
    console.log('Original format would be much longer...');
}

// Run test if called directly
if (require.main === module) {
    test();
}

module.exports = { formatTask, formatTaskList };
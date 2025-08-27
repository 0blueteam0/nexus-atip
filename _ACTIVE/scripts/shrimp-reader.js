#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Colors
const c = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

// Icons
const icons = {
    pending: '⏳',
    in_progress: '🔄', 
    completed: '✅',
    blocked: '🚫'
};

// Read actual Shrimp data
const shrimpFile = 'K:/PortableApps/Claude-Code/ShrimpData/current-tasks.json';

try {
    const data = JSON.parse(fs.readFileSync(shrimpFile, 'utf8'));
    const tasks = data.tasks || [];
    
    // Count by status
    const counts = {};
    tasks.forEach(t => {
        counts[t.status] = (counts[t.status] || 0) + 1;
    });
    
    // Display header
    console.log(`\n${c.bright}📋 Shrimp Tasks${c.reset} (Compact View)`);
    console.log('─'.repeat(70));
    
    // Show counts in one line
    const summary = Object.entries(counts).map(([status, count]) => {
        const icon = icons[status] || '❓';
        const color = status === 'completed' ? c.green : 
                      status === 'in_progress' ? c.cyan : 
                      status === 'pending' ? c.yellow : c.dim;
        return `${icon}${color} ${status}:${count}${c.reset}`;
    }).join(' │ ');
    
    console.log(summary || 'No tasks');
    console.log('');
    
    // List tasks (very compact)
    ['in_progress', 'pending', 'blocked', 'completed'].forEach(status => {
        const statusTasks = tasks.filter(t => t.status === status);
        if (statusTasks.length > 0) {
            statusTasks.forEach(task => {
                const icon = icons[status];
                const name = (task.name || task.description || 'Unnamed').substring(0, 50);
                const id = task.id ? task.id.substring(0, 6) : '------';
                console.log(`${icon} ${name} ${c.dim}[${id}]${c.reset}`);
            });
        }
    });
    
    console.log('─'.repeat(70));
    console.log(`Total: ${tasks.length} tasks\n`);
    
} catch (err) {
    console.log(`${c.red}Error reading tasks: ${err.message}${c.reset}`);
    console.log(`File: ${shrimpFile}`);
}
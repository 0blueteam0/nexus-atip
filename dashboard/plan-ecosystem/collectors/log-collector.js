/**
 * Log Collector - 일일 로그 수집
 */
const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/genai';
const LOG_DIR = path.join(BASE_PATH, 'planning-log/daily');
const SHRIMP_TASKS = path.join(BASE_PATH, 'ShrimpData/tasks/current-tasks.json');

/**
 * 일일 로그 파일 파싱
 */
function parseLogFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath, '.json');
        
        // JSON 형식인 경우
        if (filePath.endsWith('.json')) {
            return JSON.parse(content);
        }
        
        // Markdown 형식인 경우
        const entries = [];
        const tableMatches = content.matchAll(/\|\s*(\d{2}:\d{2})\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|/g);
        for (const match of tableMatches) {
            entries.push({
                time: match[1],
                file: match[2].trim(),
                target: match[3].trim(),
                status: match[4].trim(),
                reason: match[5].trim()
            });
        }
        
        return { date: fileName, entries };
    } catch (error) {
        console.error(`Error parsing log ${filePath}:`, error.message);
        return null;
    }
}

/**
 * 최근 N일간의 로그 수집
 */
function collectRecentLogs(days = 7) {
    if (!fs.existsSync(LOG_DIR)) return { logs: [], count: 0 };
    
    const files = fs.readdirSync(LOG_DIR)
        .filter(f => f.endsWith('.json') || f.endsWith('.md'))
        .sort()
        .reverse()
        .slice(0, days);
    
    const logs = files.map(f => parseLogFile(path.join(LOG_DIR, f))).filter(Boolean);
    
    return { logs, count: logs.length };
}

/**
 * Shrimp 작업 목록 로드
 */
function loadShrimpTasks() {
    if (!fs.existsSync(SHRIMP_TASKS)) return { tasks: [], count: 0 };
    
    try {
        const data = JSON.parse(fs.readFileSync(SHRIMP_TASKS, 'utf8'));
        const tasks = Array.isArray(data) ? data : (data.tasks || []);
        
        return {
            tasks: tasks.map(t => ({
                id: t.id,
                name: t.name,
                status: t.status,
                priority: t.priority,
                createdAt: t.createdAt,
                completedAt: t.completedAt
            })),
            count: tasks.length,
            stats: {
                pending: tasks.filter(t => t.status === 'pending').length,
                inProgress: tasks.filter(t => t.status === 'in-progress').length,
                completed: tasks.filter(t => t.status === 'completed').length
            }
        };
    } catch (error) {
        console.error('Error loading Shrimp tasks:', error.message);
        return { tasks: [], count: 0, error: error.message };
    }
}

/**
 * 통합 통계 생성
 */
function getStats() {
    const shrimpData = loadShrimpTasks();
    const recentLogs = collectRecentLogs(7);
    
    return {
        shrimp: shrimpData,
        recentLogs: recentLogs,
        generatedAt: new Date().toISOString()
    };
}

module.exports = { collectRecentLogs, loadShrimpTasks, getStats };

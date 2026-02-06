/**
 * Skill Collector - 스킬 사용 추적
 *
 * 기능:
 * - ATOS usage-stats.json 스킬 섹션 연동
 * - 스킬별 활성화 횟수, 성공률
 * - 트리거 키워드 분석
 * - 실시간 통계
 */
const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/Claude-Code';
const ATOS_STATS_FILE = path.join(BASE_PATH, 'atos/usage-stats.json');
const SKILLS_LOG_DIR = path.join(BASE_PATH, 'planning-log/skills');
const SKILLS_DIR = path.join(BASE_PATH, '.claude/skills');

/**
 * 디렉토리 안전하게 생성
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * JSON 파일 안전하게 읽기
 */
function safeReadJSON(filePath, defaultValue = {}) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.error(`Error reading ${filePath}: ${e.message}`);
    }
    return defaultValue;
}

/**
 * 등록된 스킬 목록 로드
 */
function loadRegisteredSkills() {
    const skills = [];

    try {
        if (fs.existsSync(SKILLS_DIR)) {
            const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => d.name);

            for (const skillName of dirs) {
                const skillPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');
                if (fs.existsSync(skillPath)) {
                    const content = fs.readFileSync(skillPath, 'utf8');

                    // 트리거 키워드 추출
                    const triggerMatch = content.match(/트리거.*?키워드[:\s]*([^\n]+)/i)
                        || content.match(/trigger.*?keyword[s]?[:\s]*([^\n]+)/i);

                    skills.push({
                        name: skillName,
                        path: skillPath,
                        triggers: triggerMatch ? triggerMatch[1].split(',').map(s => s.trim()) : [],
                        registered: true
                    });
                }
            }
        }
    } catch (e) {
        console.error(`Error loading skills: ${e.message}`);
    }

    return skills;
}

/**
 * ATOS 스킬 통계 로드
 */
function loadATOSSkillStats() {
    const atos = safeReadJSON(ATOS_STATS_FILE, { skills: {} });
    return atos.skills || {};
}

/**
 * planning-log/skills/에서 최근 N일 데이터 로드
 */
function loadRecentSkillLogs(days = 7) {
    ensureDir(SKILLS_LOG_DIR);

    const files = fs.readdirSync(SKILLS_LOG_DIR)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, days);

    const allUsages = [];
    for (const file of files) {
        const data = safeReadJSON(path.join(SKILLS_LOG_DIR, file), { usages: [] });
        allUsages.push(...(data.usages || []));
    }
    return allUsages;
}

/**
 * 스킬 사용 통계 수집
 */
function collectSkillStats() {
    const registeredSkills = loadRegisteredSkills();
    const atosStats = loadATOSSkillStats();
    const recentUsages = loadRecentSkillLogs(7);

    // 스킬별 통계 병합
    const skillStats = {};

    // 1. 등록된 스킬 기본 정보
    for (const skill of registeredSkills) {
        skillStats[skill.name] = {
            name: skill.name,
            triggers: skill.triggers,
            registered: true,
            totalActivations: 0,
            successCount: 0,
            failureCount: 0,
            successRate: 0,
            lastUsed: null
        };
    }

    // 2. ATOS 통계 병합
    for (const [name, data] of Object.entries(atosStats)) {
        if (!skillStats[name]) {
            skillStats[name] = {
                name,
                triggers: [],
                registered: false,
                totalActivations: 0,
                successCount: 0,
                failureCount: 0,
                successRate: 0,
                lastUsed: null
            };
        }

        skillStats[name].totalActivations += data.totalActivations || 0;
        skillStats[name].successCount += data.successCount || 0;
        skillStats[name].failureCount += data.failureCount || 0;
        skillStats[name].lastUsed = data.lastUsed || skillStats[name].lastUsed;
    }

    // 3. planning-log 데이터 병합
    for (const usage of recentUsages) {
        const name = usage.skill;
        if (!skillStats[name]) {
            skillStats[name] = {
                name,
                triggers: [],
                registered: false,
                totalActivations: 0,
                successCount: 0,
                failureCount: 0,
                successRate: 0,
                lastUsed: null
            };
        }

        skillStats[name].totalActivations++;
        if (usage.success) skillStats[name].successCount++;
        else skillStats[name].failureCount++;

        if (!skillStats[name].lastUsed || new Date(usage.timestamp) > new Date(skillStats[name].lastUsed)) {
            skillStats[name].lastUsed = usage.timestamp;
        }
    }

    // 4. 성공률 계산 및 정렬
    const skillList = Object.values(skillStats).map(s => {
        s.successRate = s.totalActivations > 0
            ? Math.round((s.successCount / s.totalActivations) * 100)
            : 0;
        return s;
    }).sort((a, b) => b.totalActivations - a.totalActivations);

    const totalActivations = skillList.reduce((sum, s) => sum + s.totalActivations, 0);

    return {
        skills: skillList,
        registeredCount: registeredSkills.length,
        totalActivations,
        recentUsagesCount: recentUsages.length,
        collectedAt: new Date().toISOString()
    };
}

/**
 * 스킬 사용 기록
 */
function recordSkillUsage(skillName, success, trigger = '', context = {}) {
    ensureDir(SKILLS_LOG_DIR);

    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(SKILLS_LOG_DIR, `${today}.json`);

    let data = safeReadJSON(logFile, { date: today, usages: [] });

    data.usages.push({
        skill: skillName,
        timestamp: new Date().toISOString(),
        success,
        trigger,
        context
    });

    fs.writeFileSync(logFile, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 상위 N개 스킬 조회
 */
function getTopSkills(n = 10) {
    const stats = collectSkillStats();
    return stats.skills.slice(0, n);
}

/**
 * 스킬 상세 정보 조회
 */
function getSkillDetail(skillName) {
    const stats = collectSkillStats();
    const skill = stats.skills.find(s => s.name === skillName);

    if (!skill) return null;

    // SKILL.md 내용 로드
    const skillPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');
    let description = '';

    if (fs.existsSync(skillPath)) {
        description = fs.readFileSync(skillPath, 'utf8').substring(0, 1000);
    }

    return {
        ...skill,
        description
    };
}

module.exports = {
    collectSkillStats,
    recordSkillUsage,
    getTopSkills,
    getSkillDetail,
    loadRegisteredSkills
};

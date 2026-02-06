/**
 * Plan Collector - 플랜 파일 수집 및 파싱
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const BASE_PATH = process.env.BASE_PATH || 'K:/PortableApps/Claude-Code';
const PLANS_DIR = path.join(BASE_PATH, 'plans');
const COMPLETED_DIR = path.join(PLANS_DIR, 'completed');
const ARCHIVED_DIR = path.join(PLANS_DIR, 'archived');

/**
 * 플랜 품질 상태 분석
 */
function analyzePlanQuality(body, phases, totalTasks) {
    const contentLength = body.replace(/\s+/g, '').length;
    const hasPhases = phases.length > 0;
    const hasTasks = totalTasks > 0;
    const hasGoal = /##.*목표|##.*Goal|##.*Objective/i.test(body);
    const hasArchitecture = /##.*아키텍처|##.*Architecture|##.*설계/i.test(body);

    // 상태 판단
    let qualityStatus = 'active';
    let qualityWarnings = [];

    if (contentLength < 200) {
        qualityStatus = 'empty';
        qualityWarnings.push('내용 부족 (200자 미만)');
    } else if (!hasPhases && !hasTasks) {
        qualityStatus = 'draft';
        qualityWarnings.push('Phase/Task 정의 없음');
    } else if (!hasGoal) {
        qualityWarnings.push('목표 섹션 없음');
    }

    return {
        qualityStatus,      // empty, draft, active, complete
        qualityWarnings,
        contentLength,
        hasPhases,
        hasTasks,
        hasGoal,
        hasArchitecture
    };
}

/**
 * Markdown 파일에서 플랜 메타데이터 추출
 */
function parsePlanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const { data: frontmatter, content: body } = matter(content);

        // 플랜 ID 추출 (파일명 또는 frontmatter에서)
        const fileName = path.basename(filePath, '.md');
        const planId = frontmatter.planId || fileName;

        // 제목 추출 (첫 번째 # 헤딩)
        const titleMatch = body.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : fileName;

        // 체크박스 진행률 계산
        const totalTasks = (body.match(/- \[[ x]\]/g) || []).length;
        const completedTasks = (body.match(/- \[x\]/gi) || []).length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Phase 추출
        const phases = [];
        const phaseMatches = body.matchAll(/##\s+Phase\s+(\d+)[:\s]+(.+)/gi);
        for (const match of phaseMatches) {
            phases.push({ number: parseInt(match[1]), name: match[2].trim() });
        }

        // 파일 통계
        const stats = fs.statSync(filePath);

        // 플랜 품질 분석
        const quality = analyzePlanQuality(body, phases, totalTasks);

        return {
            id: planId,
            title,
            filePath,
            progress,
            totalTasks,
            completedTasks,
            phases,
            createdAt: stats.birthtime.toISOString(),
            updatedAt: stats.mtime.toISOString(),
            frontmatter,
            // 품질 분석 결과
            qualityStatus: quality.qualityStatus,
            qualityWarnings: quality.qualityWarnings,
            contentLength: quality.contentLength,
            hasPhases: quality.hasPhases,
            hasGoal: quality.hasGoal
        };
    } catch (error) {
        console.error(`Error parsing ${filePath}:`, error.message);
        return null;
    }
}

/**
 * 특정 디렉토리의 모든 플랜 파일 수집
 */
function collectPlansFromDir(dir, status = 'active') {
    if (!fs.existsSync(dir)) return [];
    
    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.md') && !f.startsWith('ACTIVE-'));
    
    return files
        .map(f => {
            const plan = parsePlanFile(path.join(dir, f));
            if (plan) plan.status = status;
            return plan;
        })
        .filter(Boolean);
}

/**
 * Progress JSON 파일 로드
 */
function loadProgressJson(planId) {
    const progressPath = path.join(PLANS_DIR, `${planId}-progress.json`);
    if (fs.existsSync(progressPath)) {
        try {
            return JSON.parse(fs.readFileSync(progressPath, 'utf8'));
        } catch (e) {
            return null;
        }
    }
    return null;
}

/**
 * 모든 플랜 수집 (활성, 완료, 보관)
 */
function collectAllPlans() {
    const active = collectPlansFromDir(PLANS_DIR, 'active');
    const completed = collectPlansFromDir(COMPLETED_DIR, 'completed');
    const archived = collectPlansFromDir(ARCHIVED_DIR, 'archived');
    
    // Progress JSON 병합
    const allPlans = [...active, ...completed, ...archived].map(plan => {
        const progressData = loadProgressJson(plan.id);
        if (progressData) {
            plan.progressData = progressData;
        }
        return plan;
    });
    
    return {
        plans: allPlans,
        stats: {
            total: allPlans.length,
            active: active.length,
            completed: completed.length,
            archived: archived.length
        },
        collectedAt: new Date().toISOString()
    };
}

/**
 * 단일 플랜 상세 조회
 */
function getPlanDetail(planId) {
    // 활성 플랜에서 검색
    let filePath = path.join(PLANS_DIR, `${planId}.md`);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(COMPLETED_DIR, `${planId}.md`);
    }
    if (!fs.existsSync(filePath)) {
        filePath = path.join(ARCHIVED_DIR, `${planId}.md`);
    }
    if (!fs.existsSync(filePath)) {
        return null;
    }
    
    const plan = parsePlanFile(filePath);
    const progressData = loadProgressJson(planId);
    
    return { ...plan, progressData, rawContent: fs.readFileSync(filePath, 'utf8') };
}

module.exports = { collectAllPlans, getPlanDetail, parsePlanFile };

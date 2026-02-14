/**
 * skill-recommender.js
 * 새로운 Skill 및 플러그인 추천 시스템
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = 'K:/PortableApps/genai/.claude/skills';
const MARKETPLACE_URLS = {
  skills: 'https://skillsmp.com/',
  plugins: 'https://claudecodemarketplace.com/',
  awesome: 'https://github.com/hesreallyhim/awesome-claude-code'
};

function getInstalledSkills() {
  const skills = [];
  if (fs.existsSync(SKILLS_DIR)) {
    const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const skillPath = path.join(SKILLS_DIR, dir.name, 'SKILL.md');
        if (fs.existsSync(skillPath)) {
          skills.push({ name: dir.name, path: skillPath });
        }
      }
    }
  }
  return skills;
}

const RECOMMENDED_SKILLS = [
  { name: 'code-reviewer', category: 'dev', priority: 'high' },
  { name: 'test-writer', category: 'dev', priority: 'high' },
  { name: 'security-scanner', category: 'security', priority: 'high' },
  { name: 'performance-profiler', category: 'perf', priority: 'medium' },
  { name: 'api-documenter', category: 'docs', priority: 'medium' }
];

function recommendSkills() {
  const installed = getInstalledSkills().map(s => s.name);
  const recommendations = [];
  
  for (const skill of RECOMMENDED_SKILLS) {
    if (!installed.includes(skill.name)) {
      recommendations.push(skill);
    }
  }
  
  return { installed, recommendations, marketplaces: MARKETPLACE_URLS };
}

module.exports = { getInstalledSkills, recommendSkills, MARKETPLACE_URLS };

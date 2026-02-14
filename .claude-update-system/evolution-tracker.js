/**
 * evolution-tracker.js
 * 에이전틱 자기학습 결과 추적 및 저장
 * 
 * 학습 결과를 documentation/evolution-log/에 저장하고
 * 과거 학습 내용을 조회하여 지속적인 개선 지원
 * 
 * @module .claude-update-system/evolution-tracker
 * @version 1.0.0
 * @date 2025-12-25
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = 'K:/PortableApps/genai';
const EVOLUTION_DIR = path.join(BASE_PATH, 'documentation', 'evolution-log');

/**
 * 진화 로그 저장
 * @param {object} data - 학습 결과 데이터
 * @param {string} data.phase - 학습 단계 (0-5)
 * @param {string} data.category - 카테고리 (skills, tools, agents, use-cases)
 * @param {object} data.discoveries - 발견 항목들
 * @param {object} data.improvements - 개선 제안들
 * @param {string} data.claudeVersion - Claude Code 버전
 */
function saveEvolutionLog(data) {
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}.md`;
  const filepath = path.join(EVOLUTION_DIR, filename);

  // 디렉토리 확인
  if (!fs.existsSync(EVOLUTION_DIR)) {
    fs.mkdirSync(EVOLUTION_DIR, { recursive: true });
  }

  // 기존 파일이 있으면 추가, 없으면 새로 생성
  let content = '';
  if (fs.existsSync(filepath)) {
    content = fs.readFileSync(filepath, 'utf8');
    content += '\n---\n\n';
  } else {
    content = `# Evolution Log - ${date}\n\n`;
    content += `> Claude Code Version: ${data.claudeVersion || 'unknown'}\n\n`;
  }

  // 새 항목 추가
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  content += `## ${timestamp} - Phase ${data.phase || '?'}: ${data.category || 'General'}\n\n`;

  // 발견 항목
  if (data.discoveries && Object.keys(data.discoveries).length > 0) {
    content += '### Discoveries\n';
    for (const [key, value] of Object.entries(data.discoveries)) {
      content += `- **${key}**: ${value}\n`;
    }
    content += '\n';
  }

  // 개선 제안
  if (data.improvements && data.improvements.length > 0) {
    content += '### Improvements\n';
    data.improvements.forEach((imp, i) => {
      content += `${i + 1}. ${imp}\n`;
    });
    content += '\n';
  }

  // 추가 메모
  if (data.notes) {
    content += `### Notes\n${data.notes}\n\n`;
  }

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`[+] Evolution log saved: ${filename}`);
  
  return filepath;
}

/**
 * 최근 N일간의 진화 로그 로드
 * @param {number} days - 조회할 일수 (기본 7일)
 * @returns {Array} 로그 항목 배열
 */
function loadRecentEvolution(days = 7) {
  const results = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const filepath = path.join(EVOLUTION_DIR, `${dateStr}.md`);

    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, 'utf8');
      results.push({
        date: dateStr,
        content,
        size: content.length
      });
    }
  }

  return results;
}

/**
 * 진화 리포트 생성
 * @param {number} days - 분석할 일수
 * @returns {object} 리포트 객체
 */
function generateEvolutionReport(days = 30) {
  const logs = loadRecentEvolution(days);
  
  const report = {
    period: `${days} days`,
    generatedAt: new Date().toISOString(),
    summary: {
      totalLogs: logs.length,
      totalSize: logs.reduce((sum, log) => sum + log.size, 0),
      datesWithActivity: logs.map(l => l.date)
    },
    categories: {},
    improvements: []
  };

  // 카테고리별 분석 (다양한 형식 지원)
  logs.forEach(log => {
    // Phase 형식: "## HH:MM:SS - Phase N: Category"
    const phaseMatches = log.content.match(/## \d{1,2}:\d{2}:\d{2} - Phase \d+: (\w+)/g);
    if (phaseMatches) {
      phaseMatches.forEach(match => {
        const cat = match.split(': ').pop();
        report.categories[cat] = (report.categories[cat] || 0) + 1;
      });
    }

    // 한국어 진화 기록 형식: "## 오전/오후 H:MM:SS 진화 기록"
    const koreanMatches = log.content.match(/## (?:오전|오후)\s*\d{1,2}:\d{2}:\d{2}\s+진화 기록/g);
    if (koreanMatches) {
      report.categories['evolution'] = (report.categories['evolution'] || 0) + koreanMatches.length;
    }

    // 적용된 변경 섹션에서 카테고리 추출
    const changeMatches = log.content.match(/### 적용된 변경\n([\s\S]*?)(?=\n###|\n---|$)/);
    if (changeMatches) {
      report.categories['applied_changes'] = (report.categories['applied_changes'] || 0) + 1;
    }

    // 개선 제안 추출
    const improvementSection = log.content.match(/### Improvements\n([\s\S]*?)(?=\n###|\n---|$)/);
    if (improvementSection) {
      const items = improvementSection[1].match(/^\d+\. .+$/gm);
      if (items) {
        report.improvements.push(...items.map(i => ({
          date: log.date,
          item: i.replace(/^\d+\. /, '')
        })));
      }
    }
  });

  return report;
}

/**
 * 특정 키워드로 진화 로그 검색
 * @param {string} keyword - 검색 키워드
 * @param {number} days - 검색 범위 (일)
 * @returns {Array} 매칭된 로그 항목
 */
function searchEvolution(keyword, days = 90) {
  const logs = loadRecentEvolution(days);
  const results = [];

  logs.forEach(log => {
    if (log.content.toLowerCase().includes(keyword.toLowerCase())) {
      // 키워드 포함 라인 추출
      const lines = log.content.split('\n');
      const matchingLines = lines.filter(line => 
        line.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (matchingLines.length > 0) {
        results.push({
          date: log.date,
          matches: matchingLines,
          count: matchingLines.length
        });
      }
    }
  });

  return results;
}

// CLI 인터페이스
if (require.main === module) {
  const cmd = process.argv[2];

  switch (cmd) {
    case 'save':
      // 테스트 저장
      saveEvolutionLog({
        phase: '0',
        category: 'test',
        claudeVersion: '2.0.x',
        discoveries: {
          'New Feature': 'Test discovery'
        },
        improvements: ['Test improvement 1', 'Test improvement 2'],
        notes: 'CLI test run'
      });
      break;

    case 'recent':
      const days = parseInt(process.argv[3]) || 7;
      const logs = loadRecentEvolution(days);
      console.log(`[*] Found ${logs.length} logs in last ${days} days`);
      logs.forEach(l => console.log(`  - ${l.date}: ${l.size} bytes`));
      break;

    case 'report':
      const reportDays = parseInt(process.argv[3]) || 30;
      const report = generateEvolutionReport(reportDays);
      console.log(JSON.stringify(report, null, 2));
      break;

    case 'search':
      const keyword = process.argv[3];
      if (keyword) {
        const results = searchEvolution(keyword);
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log('Usage: node evolution-tracker.js search <keyword>');
      }
      break;

    default:
      console.log('Usage: node evolution-tracker.js <save|recent|report|search> [args]');
  }
}

module.exports = {
  saveEvolutionLog,
  loadRecentEvolution,
  generateEvolutionReport,
  searchEvolution
};

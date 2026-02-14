/**
 * report-generator.js
 * 업데이트 보고서 생성
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = 'K:/PortableApps/genai/documentation/update-reports';

function generateUpdateReport(data) {
  const { fromVersion, toVersion, timestamp, checks } = data;
  const date = new Date(timestamp).toISOString().split('T')[0];
  
  let report = `# Claude Code 업데이트 보고서

## 개요
- **업데이트 일시**: ${timestamp}
- **이전 버전**: ${fromVersion}
- **새 버전**: ${toVersion}
- **상태**: 완료

---

## 검증 결과

`;

  // 검증 결과 추가
  if (checks && checks.length > 0) {
    checks.forEach((check, i) => {
      const status = check.success ? '[+]' : '[-]';
      report += `### ${i + 1}. ${check.name}\n`;
      report += `${status} ${check.message || '완료'}\n\n`;
    });
  }

  report += `---

## 새 기능 (${toVersion})

| 기능 | 설명 |
|------|------|
| - | 문서 리서치 후 업데이트 필요 |

---

## 권장 조치

1. MCP 서버 재검증: \`claude mcp list\`
2. 설정 파일 확인: \`.claude.json\`
3. 롤백 방법: \`backups/update-${fromVersion}-to-${toVersion}/\`

---

*자동 생성: .claude-update-system/report-generator.js*
`;

  // 보고서 저장
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  const filename = `UPDATE-${fromVersion}-to-${toVersion}-${date}.md`;
  const filepath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filepath, report);
  
  console.log(`[+] 보고서 생성: ${filepath}`);
  return filepath;
}

module.exports = { generateUpdateReport, REPORTS_DIR };

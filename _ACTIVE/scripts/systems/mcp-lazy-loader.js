/**
 * MCP Lazy Loading System
 * 작업 패턴을 감지하여 필요한 MCP를 자동 제안
 */

const fs = require('fs');
const path = require('path');

class MCPLazyLoader {
  constructor() {
    this.triggers = {
      api_development: {
        keywords: ['fetch', 'axios', 'endpoint', 'REST', 'API', 'swagger'],
        mcp: 'rest-client',
        package: '@modelcontextprotocol/rest-client',
        reason: 'API 개발 감지'
      },
      performance_issue: {
        keywords: ['slow', 'lag', 'memory', 'CPU', '느림', '성능'],
        mcp: 'performance-monitor',
        package: 'performance-monitor-mcp',
        reason: '성능 이슈 감지'
      },
      security_scan: {
        keywords: ['vulnerability', 'CVE', 'OWASP', 'security', '보안'],
        mcp: 'security-scanner',
        package: 'security-scanner-mcp',
        reason: '보안 검사 필요'
      },
      docker_work: {
        keywords: ['docker', 'container', 'kubernetes', 'k8s'],
        mcp: 'docker-mcp',
        package: 'docker-mcp-server',
        reason: '컨테이너 작업 감지'
      },
      database_work: {
        keywords: ['SELECT', 'INSERT', 'UPDATE', 'postgres', 'mysql'],
        mcp: 'prisma-postgres',
        package: '@prisma/postgres-mcp',
        reason: '데이터베이스 작업 감지'
      }
    };
    
    this.activeMCPs = this.loadActiveMCPs();
    this.suggestions = [];
  }

  loadActiveMCPs() {
    try {
      const config = JSON.parse(fs.readFileSync('.claude.json', 'utf8'));
      return Object.keys(config.mcpServers || {});
    } catch (e) {
      return [];
    }
  }

  analyzeContext(text) {
    const suggestions = [];
    
    for (const [category, config] of Object.entries(this.triggers)) {
      const found = config.keywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (found && !this.activeMCPs.includes(config.mcp)) {
        suggestions.push({
          mcp: config.mcp,
          package: config.package,
          reason: config.reason,
          command: `claude mcp add ${config.mcp} --scope user -- cmd /c npx -y ${config.package}`
        });
      }
    }
    
    return suggestions;
  }

  getStatus() {
    const total = this.activeMCPs.length;
    let status = '🟢 정상';
    let message = `활성 MCP: ${total}개`;
    
    if (total > 20) {
      status = '🔴 위험';
      message += ' - 시스템 과부하 위험!';
    } else if (total > 15) {
      status = '🟡 경고';
      message += ' - MCP 정리 필요';
    }
    
    return { status, message, count: total };
  }

  recommendCleanup() {
    // 30일 이상 사용하지 않은 MCP 찾기
    const unused = [];
    // TODO: 사용 로그 분석 구현
    
    return unused;
  }
}

// 자동 실행
if (require.main === module) {
  const loader = new MCPLazyLoader();
  
  // 현재 상태 출력
  const status = loader.getStatus();
  console.log(`\n📊 MCP 상태: ${status.status}`);
  console.log(status.message);
  
  // 최근 작업 분석 (예시)
  const recentWork = process.argv[2] || '';
  if (recentWork) {
    const suggestions = loader.analyzeContext(recentWork);
    if (suggestions.length > 0) {
      console.log('\n💡 MCP 추천:');
      suggestions.forEach(s => {
        console.log(`- ${s.mcp}: ${s.reason}`);
        console.log(`  설치: ${s.command}`);
      });
    }
  }
}

module.exports = MCPLazyLoader;
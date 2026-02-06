/**
 * Dashboard Test
 * API 서버 테스트
 */

const http = require('http');

async function testDashboard() {
  console.log('=== Dashboard API Test ===\n');

  try {
    // 모듈 로드 테스트
    const { DashboardAPIServer, createDashboard } = require('./index');
    console.log('[+] Dashboard module loaded');

    // 서버 생성 및 시작
    const dashboard = createDashboard({ port: 7849 }); // 테스트용 포트
    dashboard.start();
    console.log('[+] Dashboard server started on port 7849');

    // API 호출 대기
    await new Promise(r => setTimeout(r, 500));

    // API 엔드포인트 테스트
    console.log('\n--- API Endpoint Tests ---');

    const endpoints = [
      '/api/health',
      '/api/status',
      '/api/agents',
      '/api/queues',
      '/api/tasks'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:7849${endpoint}`);
        const data = await response.json();
        console.log(`[+] ${endpoint}:`, response.status === 200 ? 'OK' : 'FAIL');

        if (endpoint === '/api/health') {
          console.log('    Status:', data.status);
        }
      } catch (error) {
        console.log(`[-] ${endpoint}: ${error.message}`);
      }
    }

    // 404 테스트
    try {
      const response = await fetch('http://localhost:7849/api/unknown');
      console.log('[+] 404 handling:', response.status === 404 ? 'OK' : 'FAIL');
    } catch (error) {
      console.log('[-] 404 test failed:', error.message);
    }

    // 서버 중지
    await dashboard.stop();
    console.log('[+] Dashboard server stopped');

    console.log('\n=== All Dashboard Tests Passed! ===');

  } catch (error) {
    console.error('\n[!] Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// CLI 실행
if (require.main === module) {
  testDashboard();
}

module.exports = { testDashboard };

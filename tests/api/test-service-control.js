// Service Control API 테스트
const http = require('http');

function testAPI(method, path, expectedStatus) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: path,
            method: method
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const success = res.statusCode === expectedStatus;
                console.log(`[${success ? '+' : '-'}] ${method} ${path}`);
                console.log(`    Status: ${res.statusCode} (expected: ${expectedStatus})`);
                
                try {
                    const json = JSON.parse(data);
                    console.log(`    Response:`, JSON.stringify(json, null, 2).split('\n').slice(0, 5).join('\n'));
                } catch (e) {
                    console.log(`    Response: ${data.substring(0, 100)}`);
                }
                
                resolve({ success, statusCode: res.statusCode, data: JSON.parse(data) });
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    console.log('[*] Service Control API 테스트 시작\n');
    
    // 테스트 1: Ollama 시작 (dependency 없음)
    console.log('\n=== Test 1: POST /api/services/ollama/start ===');
    const test1 = await testAPI('POST', '/api/services/ollama/start', 200);
    
    // 5초 대기 (Ollama 시작 대기)
    console.log('\n[*] 5초 대기 (Ollama 시작 확인)...');
    await new Promise(r => setTimeout(r, 5000));
    
    // 테스트 2: n8n 시작 시도 (Ollama dependency 확인)
    console.log('\n=== Test 2: POST /api/services/n8n/start (dependency check) ===');
    const test2 = await testAPI('POST', '/api/services/n8n/start', 200);
    
    // 테스트 3: Ollama 중지
    console.log('\n=== Test 3: POST /api/services/ollama/stop ===');
    const test3 = await testAPI('POST', '/api/services/ollama/stop', 200);
    
    // 3초 대기
    await new Promise(r => setTimeout(r, 3000));
    
    // 테스트 4: n8n 시작 시도 (Ollama 중지 상태 - 실패 예상)
    console.log('\n=== Test 4: POST /api/services/n8n/start (should fail - dependency not running) ===');
    const test4 = await testAPI('POST', '/api/services/n8n/start', 400);
    
    // 테스트 5: library 시작 시도 (실패 예상)
    console.log('\n=== Test 5: POST /api/services/langchain/start (library - should fail) ===');
    const test5 = await testAPI('POST', '/api/services/langchain/start', 400);
    
    // 테스트 6: start-all (topological order)
    console.log('\n=== Test 6: POST /api/services/start-all (topological order) ===');
    const test6 = await testAPI('POST', '/api/services/start-all', 200);
    
    console.log('\n[*] 테스트 완료');
}

main().catch(console.error);

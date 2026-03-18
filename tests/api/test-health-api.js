// Health Check API 테스트
async function testHealthAPI() {
    try {
        const response = await fetch('http://localhost:3001/api/services/health');
        const data = await response.json();
        
        console.log('[+] Status:', response.status);
        console.log('[+] Response:', JSON.stringify(data, null, 2));
        
        // 검증
        const checks = {
            'Status 200': response.status === 200,
            'Has services': !!data.services,
            'Has timestamp': !!data.timestamp,
            'Service count': Object.keys(data.services || {}).length === 5,
            'All services present': ['ollama', 'n8n', 'flowise', 'qdrant', 'langchain']
                .every(id => data.services[id])
        };
        
        console.log('\n[*] Verification:');
        Object.entries(checks).forEach(([name, pass]) => {
            console.log(`  ${pass ? '[+]' : '[-]'} ${name}`);
        });
        
    } catch (error) {
        console.error('[-] Error:', error.message);
    }
}

testHealthAPI();

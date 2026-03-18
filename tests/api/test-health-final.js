// Health Check API 최종 테스트
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/services/health',
    method: 'GET'
};

console.log('[*] Testing Health Check API on port 3002...\n');

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('[+] HTTP Status:', res.statusCode);
        
        try {
            const json = JSON.parse(data);
            console.log('\n[+] Response Data:');
            console.log(JSON.stringify(json, null, 2));
            
            // 검증
            console.log('\n[*] Verification Checks:');
            console.log('  [' + (res.statusCode === 200 ? '+' : '-') + '] Status Code 200');
            console.log('  [' + (json.services ? '+' : '-') + '] Has services object');
            console.log('  [' + (json.timestamp ? '+' : '-') + '] Has timestamp');
            
            const serviceIds = Object.keys(json.services || {});
            console.log('  [' + (serviceIds.length === 5 ? '+' : '-') + '] Service count: ' + serviceIds.length + '/5');
            
            const expected = ['ollama', 'n8n', 'flowise', 'qdrant', 'langchain'];
            const allPresent = expected.every(id => json.services[id]);
            console.log('  [' + (allPresent ? '+' : '-') + '] All expected services present');
            
            if (json.services) {
                console.log('\n[*] Service Status:');
                Object.entries(json.services).forEach(([id, status]) => {
                    const validStatus = ['running', 'stopped', 'error', 'library'].includes(status.status);
                    console.log('  [' + (validStatus ? '+' : '-') + '] ' + id + ': ' + status.status);
                });
            }
            
        } catch (e) {
            console.error('[-] JSON Parse Error:', e.message);
        }
    });
});

req.on('error', (error) => {
    console.error('[-] Request Error:', error.message);
});

req.end();

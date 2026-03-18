// Version Detection API 테스트
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/services/versions',
    method: 'GET'
};

console.log('[*] Testing Version Detection API...\n');

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
            console.log('  [' + (json.versions ? '+' : '-') + '] Has versions object');
            console.log('  [' + (json.timestamp ? '+' : '-') + '] Has timestamp');
            
            const versionIds = Object.keys(json.versions || {});
            console.log('  [' + (versionIds.length === 5 ? '+' : '-') + '] Version count: ' + versionIds.length + '/5');
            
            if (json.versions) {
                console.log('\n[*] Service Versions:');
                Object.entries(json.versions).forEach(([id, data]) => {
                    const hasVersion = data.version && data.version !== 'unknown';
                    const hasTimestamp = !!data.detectedAt;
                    console.log('  [' + (hasVersion ? '+' : '-') + '] ' + id + ': ' + data.version + 
                                (hasTimestamp ? ' (detected)' : ''));
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

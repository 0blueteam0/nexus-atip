// Simple API test
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/services/health',
    method: 'GET'
};

console.log('[*] Testing API endpoint...');

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('[+] Status:', res.statusCode);
        try {
            const json = JSON.parse(data);
            console.log('[+] Response:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('[-] Parse error:', e.message);
            console.log('[*] Raw data:', data.substring(0, 200));
        }
    });
});

req.on('error', (error) => {
    console.error('[-] Request error:', error.message);
});

req.end();

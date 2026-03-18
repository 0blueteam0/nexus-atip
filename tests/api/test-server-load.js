// 서버 초기화 테스트
const fs = require('fs');
const path = require('path');

console.log('[*] Testing server initialization...');

try {
    // Service Registry 로딩 테스트
    const registryPath = path.join(__dirname, 'dashboard', '../service-registry.json');
    console.log('[*] Loading registry from:', registryPath);
    
    const serviceRegistry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    console.log('[+] Registry loaded successfully');
    console.log('[*] Services:', Object.keys(serviceRegistry));
    
    // Fetch API 테스트
    console.log('[*] Testing fetch API...');
    if (typeof fetch === 'undefined') {
        console.log('[-] fetch is not available');
    } else {
        console.log('[+] fetch is available');
    }
    
} catch (error) {
    console.error('[-] Error:', error.message);
    console.error(error.stack);
}

// Spawn 테스트
const { spawn } = require('child_process');

console.log('[*] Spawn 테스트 시작');

const command = 'K:/PortableApps/genai/ollama/ollama.exe serve';
console.log('[*] 명령:', command);

const child = spawn('cmd', ['/c', command], {
    cwd: 'K:/PortableApps/genai',
    detached: true,
    stdio: 'ignore'
});

child.unref();

console.log('[+] 프로세스 시작됨, PID:', child.pid);
console.log('[*] 3초 후 프로세스 확인...');

setTimeout(() => {
    console.log('[*] 메인 프로세스 여전히 실행 중');
    process.exit(0);
}, 3000);

// 간단한 모니터링 시스템 (실제 작동 버전)
const { exec } = require('child_process');

console.log('📊 Simple Monitor 시작');

// 30초마다 상태 체크
setInterval(() => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] 체크 중...`);
    
    // claude 버전 체크로 작동 확인
    exec('K:\\PortableApps\\tools\\nodejs\\node.exe --version', (err, stdout) => {
        if (!err) {
            console.log(`✅ Node.js: ${stdout.trim()}`);
        }
    });
}, 30000);

// 첫 체크
console.log('첫 체크 실행...');
exec('dir K:\\PortableApps\\Claude-Code\\*.bat', (err, stdout) => {
    if (!err) {
        const batCount = (stdout.match(/\.bat/g) || []).length;
        console.log(`📁 BAT 파일: ${batCount}개`);
    }
});

console.log('Ctrl+C로 종료');
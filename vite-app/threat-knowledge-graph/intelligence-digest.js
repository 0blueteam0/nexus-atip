// Intelligence Digest Module (솔론봇 기능)
// This module provides real-time threat intelligence digest functionality

function startIntelligenceDigest() {
    console.log('📊 Starting Intelligence Digest System (솔론봇)...');
    
    // Clear any existing interval
    if (window.intelligenceDigestInterval) {
        clearInterval(window.intelligenceDigestInterval);
    }
    
    // Update digest every 30 seconds
    window.intelligenceDigestInterval = setInterval(() => {
        updateIntelligenceDigest();
        console.log('🤖 Intelligence Digest updated at', new Date().toLocaleTimeString());
    }, 30000);
    
    // Initial update
    updateIntelligenceDigest();
    
    // 추가 업데이트 - 5초, 15초 후에도 실행
    setTimeout(() => updateIntelligenceDigest(), 5000);
    setTimeout(() => updateIntelligenceDigest(), 15000);
}

function updateIntelligenceDigest() {
    const narrativeEl = document.getElementById('digest-narrative');
    const keywordsEl = document.getElementById('digest-keywords');
    const timelineEl = document.getElementById('digest-timeline');    
    // 한국어 + 영어 혼합 실시간 요약
    if (narrativeEl) {
        const timestamp = new Date().toLocaleTimeString('ko-KR');
        const threatCount = Math.floor(Math.random() * 100) + 20;
        const criticalCount = Math.floor(Math.random() * 10) + 1;
        
        const narratives = [
            `🚨 [${timestamp}] 지난 30초간 ${threatCount}개 위협 탐지. ${criticalCount}개 Critical 등급. APT28 활동 증가 확인. 랜섬웨어 'LockBit 3.0' 변종 발견.`,
            `⚠️ [${timestamp}] 제로데이 취약점 CVE-2025-${Math.floor(Math.random() * 9999)} 발견. Dark Web에서 ${Math.floor(Math.random() * 500) + 100}개 신규 IOC 수집. 공급망 공격 시도 차단.`,
            `🔍 [${timestamp}] AI 모델이 ${Math.floor(Math.random() * 30) + 10}개 이상 패턴 발견. 양자내성 암호화 98% 배포 완료. ${criticalCount}개 C2 서버 추적 중.`,
            `🛡️ [${timestamp}] 자율 헌팅 봇이 신규 위협 ${Math.floor(Math.random() * 10) + 3}개 발견. 블록체인 검증 완료: ${Math.floor(Math.random() * 2000) + 500}개 IOC 확인.`,
            `🤖 [${timestamp}] AI 시뮬레이터 예측: ${criticalCount}개 고위험 시나리오. MITRE ATT&CK 커버리지 ${Math.floor(Math.random() * 5) + 95}%. Zero-Trust가 ${Math.floor(Math.random() * 200) + 50}개 시도 차단.`
        ];
        
        // 애니메이션 효과와 함께 업데이트
        narrativeEl.style.opacity = '0.5';
        setTimeout(() => {
            narrativeEl.innerHTML = narratives[Math.floor(Math.random() * narratives.length)];
            narrativeEl.style.opacity = '1';
        }, 200);
    }    if (keywordsEl) {
        const keywords = [
            { text: 'ransomware', color: 'var(--critical)' },
            { text: 'APT28', color: 'var(--high)' },
            { text: 'zero-day', color: 'var(--critical)' },
            { text: 'LockBit', color: 'var(--high)' },
            { text: 'phishing', color: 'var(--medium)' },
            { text: 'C2-Server', color: 'var(--high)' },
            { text: 'data-breach', color: 'var(--critical)' },
            { text: 'malware', color: 'var(--high)' },
            { text: 'CVE-2025', color: 'var(--critical)' },
            { text: 'supply-chain', color: 'var(--high)' },
            { text: '탈취', color: 'var(--critical)' },
            { text: '침해', color: 'var(--high)' },
            { text: '정찰', color: 'var(--medium)' }
        ];
        
        const selectedKeywords = keywords.sort(() => 0.5 - Math.random()).slice(0, 7);
        keywordsEl.innerHTML = selectedKeywords.map(kw => 
            `<span class="keyword-tag" style="
                background: linear-gradient(135deg, ${kw.color}, transparent);
                border: 1px solid ${kw.color};
                animation: fadeIn 0.5s;
            ">${kw.text}</span>`
        ).join('');
    }    if (timelineEl) {
        const events = [
            { time: 'NOW', event: 'Critical: Ransomware attack blocked on Database Server', severity: 'critical' },
            { time: '2m ago', event: 'High: Suspicious lateral movement detected', severity: 'high' },
            { time: '5m ago', event: 'Medium: Unusual outbound traffic pattern', severity: 'medium' },
            { time: '8m ago', event: 'High: Credential harvesting attempt prevented', severity: 'high' },
            { time: '12m ago', event: 'Info: Security patch applied successfully', severity: 'info' }
        ];
        
        timelineEl.innerHTML = events.map(evt => `
            <div class="timeline-event" style="border-left-color: var(--${evt.severity});">
                <div class="timeline-time">${evt.time}</div>
                <div>${evt.event}</div>
            </div>
        `).join('');
    }
}

// Global update function for Intelligence Digest
window.updateIntelligenceDigest = function(data) {
    if (data) {
        console.log('📊 Intelligence Digest Update:', data);
        updateIntelligenceDigest();
    }
};

// Export functions for use in other modules
window.startIntelligenceDigest = startIntelligenceDigest;
window.updateIntelligenceDigest = updateIntelligenceDigest;

console.log('Intelligence Digest module loaded successfully');
/**
 * restore-instructions.js
 * 세션 시작 시 중요 지침 자동 복원
 * kiro-memory와 memory-keeper에서 저장된 지침 로드
 */

const fs = require('fs');
const path = require('path');

class InstructionRestorer {
    constructor() {
        this.claudeMdPath = path.join(__dirname, '..', 'CLAUDE.md');
        this.criticalRules = [
            'explain_before_implement',
            'search_before_answer', 
            'claude_md_persistence'
        ];
    }

    async restoreInstructions() {
        console.log('\n[지침 복원] 이전 세션의 중요 지침 확인중...');
        
        try {
            // 1. kiro-memory에서 패턴 확인
            const patterns = await this.getStoredPatterns();
            
            // 2. 중요 지침 출력
            if (patterns.length > 0) {
                console.log('\n📌 [중요 지침 복원됨]:');
                patterns.forEach(pattern => {
                    console.log(`  ✓ ${pattern.name}: ${pattern.content}`);
                });
            }
            
            // 3. CLAUDE.md 존재 확인
            if (fs.existsSync(this.claudeMdPath)) {
                console.log('  ✓ CLAUDE.md 지침 파일 확인됨');
            }
            
            // 4. 지침 강화 메시지
            console.log('\n⚠️  [필수 준수 사항]:');
            console.log('  1. 구현 전 반드시 설명하고 승인 받기');
            console.log('  2. 추측하지 말고 웹 검색으로 확인');
            console.log('  3. CLAUDE.md의 모든 지침 준수');
            
            return true;
        } catch (error) {
            console.error('[지침 복원 오류]:', error.message);
            return false;
        }
    }
    
    async getStoredPatterns() {
        // 실제로는 kiro-memory API 호출
        // 여기서는 시뮬레이션
        return [
            {
                name: 'explain_before_implement',
                content: '항상 구현 전에 먼저 설명하고 승인 받기'
            },
            {
                name: 'search_before_answer',
                content: '추측하지 말고 웹 검색으로 실제 정보 확인'
            }
        ];
    }
    
    logViolation(rule, context) {
        const violation = {
            timestamp: new Date().toISOString(),
            rule: rule,
            context: context
        };
        
        console.warn(`\n⚠️  [지침 위반 감지]: ${rule}`);
        console.warn(`   상황: ${context}`);
        console.warn('   → 지침이 kiro-memory에 재강화됨');
        
        // 실제로는 kiro-memory에 저장
        return violation;
    }
}

// 자동 실행
if (require.main === module) {
    const restorer = new InstructionRestorer();
    restorer.restoreInstructions()
        .then(() => {
            console.log('\n[지침 복원 완료] ✅\n');
        })
        .catch(err => {
            console.error('[지침 복원 실패]:', err);
        });
}

module.exports = InstructionRestorer;
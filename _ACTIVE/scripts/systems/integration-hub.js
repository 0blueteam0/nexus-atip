/**
 * System Integration Hub
 * 모든 시스템 간 연동 및 자율 운영 체계
 */

const autoToolFinder = require('./auto-tool-finder');
const dynamicDate = require('./dynamic-date');
const fs = require('fs');
const path = require('path');

class IntegrationHub {
    constructor() {
        this.systems = {
            autoToolFinder,
            dynamicDate
        };
        this.failureLog = [];
        this.approvalQueue = [];
    }

    /**
     * 실패 감지 및 자동 도구 검색 연동
     */
    onTaskFailure(taskType, error) {
        console.log(`[Integration Hub] 실패 감지: ${taskType}`);
        
        // 실패 기록
        this.failureLog.push({
            taskType,
            error: error.message,
            timestamp: this.systems.dynamicDate.forLog()
        });
        
        // Auto Tool Finder에 전달
        this.systems.autoToolFinder.recordFailure(taskType, error.message);
        
        // 3회 실패 시 승인 요청
        const failures = this.failureLog.filter(f => f.taskType === taskType);
        if (failures.length >= 3) {
            this.requestApproval(taskType);
        }
    }

    /**
     * 사용자 승인 요청
     */
    requestApproval(taskType) {
        const approval = {
            id: Date.now(),
            taskType,
            timestamp: this.systems.dynamicDate.forLog(),
            status: 'pending',
            suggestedTools: []
        };
        
        this.approvalQueue.push(approval);
        
        console.log('\n' + '='.repeat(50));
        console.log('⚠️ 사용자 승인 필요');
        console.log('='.repeat(50));
        console.log(`작업: ${taskType}`);
        console.log(`실패 횟수: 3회 이상`);
        console.log(`제안: MCP 도구 자동 검색 및 설치`);
        console.log('승인하시려면 "approve"를 입력하세요.');
        console.log('='.repeat(50) + '\n');
        
        return approval;
    }

    /**
     * 모든 시스템 상태 모니터링
     */
    getSystemStatus() {
        return {
            timestamp: this.systems.dynamicDate.forLog(),
            systems: {
                autoToolFinder: {
                    failures: this.systems.autoToolFinder.getFailureReport(),
                    patterns: this.systems.autoToolFinder.patterns
                },
                dynamicDate: this.systems.dynamicDate.getStatus(),
                integrationHub: {
                    failureLog: this.failureLog.slice(-10),
                    pendingApprovals: this.approvalQueue.filter(a => a.status === 'pending')
                }
            }
        };
    }

    /**
     * 자율 운영 체계 시작
     */
    startAutonomousOperation() {
        console.log('🤖 자율 운영 체계 시작...');
        
        // 30초마다 시스템 체크
        setInterval(() => {
            const status = this.getSystemStatus();
            
            // 대기 중인 승인 확인
            if (status.systems.integrationHub.pendingApprovals.length > 0) {
                console.log(`⏳ ${status.systems.integrationHub.pendingApprovals.length}개 승인 대기 중`);
            }
            
            // 날짜 자동 업데이트
            this.systems.dynamicDate.updateClaudeMd();
            
        }, 30000);
        
        console.log('✅ 자율 운영 체계 작동 중');
    }
}

// 싱글톤 인스턴스
const hub = new IntegrationHub();

// 테스트
if (require.main === module) {
    console.log('🧪 Integration Hub 테스트');
    
    // 실패 시뮬레이션
    hub.onTaskFailure('file-editing', new Error('Cannot edit line 627'));
    hub.onTaskFailure('file-editing', new Error('File too large'));
    hub.onTaskFailure('file-editing', new Error('Edit failed'));
    
    // 상태 확인
    console.log('\n📊 시스템 상태:');
    console.log(JSON.stringify(hub.getSystemStatus(), null, 2));
}

module.exports = hub;
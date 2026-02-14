// 강제 워크플로우 실행 시스템
// Claude가 무조건 따라야 하는 자동화 스크립트

const fs = require('fs');
const path = require('path');

class ForceWorkflow {
    constructor() {
        this.workflows = require('./master-workflows.json');
        this.currentTask = null;
    }

    // 사용자 입력 분석 → 자동 워크플로우 선택
    analyzeAndExecute(userInput) {
        console.log('[*] Analyzing user input...');
        
        // 키워드 매칭
        const keywords = {
            news: ['뉴스', 'news', '아카이빙', 'threat', '위협'],
            dev: ['개발', '코드', '구현', 'fix', '수정', 'bug'],
            research: ['조사', '분석', 'research', '찾아', '알아']
        };

        let selectedWorkflow = null;
        
        for (const [type, words] of Object.entries(keywords)) {
            if (words.some(w => userInput.toLowerCase().includes(w))) {
                selectedWorkflow = type === 'news' ? 'news-archiving' : 
                                 type === 'dev' ? 'development' : 'research';
                break;
            }
        }

        if (selectedWorkflow) {
            console.log(`[+] Auto-selected workflow: ${selectedWorkflow}`);
            return this.executeWorkflow(selectedWorkflow);
        }

        console.log('[!] No matching workflow, using default research');
        return this.executeWorkflow('research');
    }    executeWorkflow(workflowName) {
        const workflow = this.workflows.workflows[workflowName];
        if (!workflow) return false;

        console.log('\n' + '='.repeat(60));
        console.log(`EXECUTING: ${workflow.name}`);
        console.log('='.repeat(60));

        // 각 단계를 명령 리스트로 변환
        const commands = [];
        
        for (const step of workflow.steps) {
            console.log(`\n[Phase] ${step.phase}`);
            
            if (step.parallel) {
                // 병렬 실행 명령
                commands.push({
                    type: 'parallel',
                    phase: step.phase,
                    tools: step.tools,
                    instruction: `Run these tools SIMULTANEOUSLY:\n${step.tools.join('\n')}`
                });
            } else {
                // 순차 실행 명령
                step.tools.forEach(tool => {
                    commands.push({
                        type: 'sequential',
                        phase: step.phase,
                        tool: tool,
                        instruction: `Execute: ${tool}`
                    });
                });
            }
        }

        // Claude가 따라야 할 명령 출력
        this.printInstructions(commands);
        return commands;
    }    printInstructions(commands) {
        console.log('\n' + '▼'.repeat(30));
        console.log('CLAUDE MUST FOLLOW THESE STEPS:');
        console.log('▼'.repeat(30));

        commands.forEach((cmd, idx) => {
            console.log(`\nStep ${idx + 1}: [${cmd.phase}]`);
            console.log(cmd.instruction);
            
            if (cmd.type === 'parallel') {
                console.log('⚡ Execute ALL simultaneously - do NOT wait between tools');
            } else {
                console.log('→ Complete this before moving to next step');
            }
        });

        console.log('\n' + '▲'.repeat(30));
        console.log('END OF MANDATORY WORKFLOW');
        console.log('▲'.repeat(30));
    }

    // 현재 진행 상황 추적
    trackProgress(step) {
        const progressFile = 'K:/PortableApps/genai/workflows/current-progress.json';
        const progress = {
            timestamp: new Date().toISOString(),
            currentStep: step,
            workflow: this.currentTask
        };
        
        fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
        console.log(`[✓] Progress saved: ${step}`);
    }
}

// 전역 인스턴스
const forceWorkflow = new ForceWorkflow();

// CLI 인터페이스
if (process.argv[2]) {
    const userInput = process.argv.slice(2).join(' ');
    forceWorkflow.analyzeAndExecute(userInput);
}

module.exports = ForceWorkflow;
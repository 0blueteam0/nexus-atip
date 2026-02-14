#!/usr/bin/env node
/**
 * Claude Code History 외부화 시스템
 * claude.json의 history를 별도 파일로 분리하고 참조 방식으로 관리
 * 
 * 특징:
 * 1. history를 외부 JSON 파일로 분리
 * 2. claude.json에는 참조만 유지
 * 3. 필요시 지연 로딩
 * 4. 자동 아카이빙
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_JSON_PATH = 'K:/PortableApps/genai/.claude.json';
const HISTORY_DIR = 'K:/PortableApps/genai/history-sessions';
const ARCHIVE_DIR = 'K:/PortableApps/genai/history-sessions/archive';

class HistoryExternalizer {
    constructor() {
        this.ensureDirectories();
    }

    ensureDirectories() {
        [HISTORY_DIR, ARCHIVE_DIR].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`[+] 디렉토리 생성: ${dir}`);
            }
        });
    }

    /**
     * claude.json에서 history 추출하여 외부화
     */
    extractHistory() {
        console.log('\n[*] History 추출 시작...');
        
        try {
            // claude.json 읽기
            const claudeJson = JSON.parse(fs.readFileSync(CLAUDE_JSON_PATH, 'utf8'));
            
            if (!claudeJson.projects) {
                console.log('[!] projects 섹션이 없습니다');
                return;
            }

            let extractedCount = 0;
            const historyRefs = {};

            // 각 프로젝트의 history 추출
            for (const [projectId, projectData] of Object.entries(claudeJson.projects)) {
                if (projectData.history && projectData.history.length > 0) {
                    const timestamp = new Date().toISOString().split('T')[0];
                    const safeProjectId = projectId.replace(/[^a-zA-Z0-9-]/g, '_');
                    const fileName = `${timestamp}-${safeProjectId}-history.json`;
                    const filePath = path.join(HISTORY_DIR, fileName);

                    // history 데이터를 외부 파일로 저장
                    const historyData = {
                        projectId,
                        projectPath: projectData.path,
                        timestamp: new Date().toISOString(),
                        itemCount: projectData.history.length,
                        history: projectData.history
                    };

                    fs.writeFileSync(filePath, JSON.stringify(historyData, null, 2));
                    console.log(`[+] History 추출: ${fileName} (${projectData.history.length}개 항목)`);
                    
                    // 참조 정보 저장
                    historyRefs[projectId] = {
                        file: fileName,
                        itemCount: projectData.history.length,
                        lastAccessed: new Date().toISOString()
                    };
                    
                    extractedCount++;
                }
            }

            if (extractedCount > 0) {
                // history-refs.json 생성
                const refsPath = path.join(HISTORY_DIR, 'history-refs.json');
                fs.writeFileSync(refsPath, JSON.stringify(historyRefs, null, 2));
                console.log(`[+] 참조 파일 생성: history-refs.json`);
                
                this.updateClaudeJson(claudeJson);
            } else {
                console.log('[!] 추출할 history가 없습니다');
            }

        } catch (error) {
            console.error(`[!] History 추출 실패: ${error.message}`);
        }
    }

    /**
     * claude.json 업데이트 (history를 참조로 교체)
     */
    updateClaudeJson(claudeJson) {
        console.log('\n[*] claude.json 업데이트...');
        
        // 백업 생성
        const backupPath = `${CLAUDE_JSON_PATH}.backup-${Date.now()}`;
        fs.copyFileSync(CLAUDE_JSON_PATH, backupPath);
        console.log(`[+] 백업 생성: ${path.basename(backupPath)}`);

        // history를 외부 참조로 교체
        for (const [projectId, projectData] of Object.entries(claudeJson.projects)) {
            if (projectData.history && projectData.history.length > 0) {
                // history를 참조로 교체
                projectData.historyRef = {
                    type: 'external',
                    location: 'history-sessions',
                    itemCount: projectData.history.length,
                    lastModified: new Date().toISOString()
                };
                
                // 원본 history 제거
                delete projectData.history;
            }
        }

        // 업데이트된 claude.json 저장
        fs.writeFileSync(CLAUDE_JSON_PATH, JSON.stringify(claudeJson, null, 2));
        console.log('[+] claude.json 업데이트 완료 (history 외부화됨)');
    }

    /**
     * History 로더 생성 (Claude Code가 필요시 로드)
     */
    createHistoryLoader() {
        const loaderPath = path.join(HISTORY_DIR, 'history-loader.js');
        
        const loaderCode = `#!/usr/bin/env node
/**
 * History 지연 로더
 * Claude Code가 필요시 history를 로드
 */

const fs = require('fs');
const path = require('path');

class HistoryLoader {
    constructor() {
        this.historyDir = '${HISTORY_DIR}';
        this.refsPath = path.join(this.historyDir, 'history-refs.json');
    }

    /**
     * 특정 프로젝트의 history 로드
     */
    loadProjectHistory(projectId) {
        try {
            const refs = JSON.parse(fs.readFileSync(this.refsPath, 'utf8'));
            
            if (!refs[projectId]) {
                return null;
            }

            const historyFile = path.join(this.historyDir, refs[projectId].file);
            
            if (!fs.existsSync(historyFile)) {
                console.error(\`History 파일 없음: \${refs[projectId].file}\`);
                return null;
            }

            const historyData = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
            
            // 접근 시간 업데이트
            refs[projectId].lastAccessed = new Date().toISOString();
            fs.writeFileSync(this.refsPath, JSON.stringify(refs, null, 2));
            
            return historyData.history;
        } catch (error) {
            console.error(\`History 로드 실패: \${error.message}\`);
            return null;
        }
    }

    /**
     * 모든 history 메타데이터 조회
     */
    getHistoryMetadata() {
        try {
            return JSON.parse(fs.readFileSync(this.refsPath, 'utf8'));
        } catch (error) {
            return {};
        }
    }
}

// CLI 인터페이스
if (require.main === module) {
    const loader = new HistoryLoader();
    const args = process.argv.slice(2);
    
    if (args[0] === 'load' && args[1]) {
        const history = loader.loadProjectHistory(args[1]);
        console.log(JSON.stringify(history, null, 2));
    } else if (args[0] === 'list') {
        const metadata = loader.getHistoryMetadata();
        console.log('Available history sessions:');
        for (const [id, info] of Object.entries(metadata)) {
            console.log(\`  - \${id}: \${info.itemCount} items (file: \${info.file})\`);
        }
    } else {
        console.log('Usage:');
        console.log('  node history-loader.js load <projectId>  - Load specific project history');
        console.log('  node history-loader.js list              - List all available histories');
    }
}

module.exports = HistoryLoader;
`;

        fs.writeFileSync(loaderPath, loaderCode);
        console.log(`[+] History 로더 생성: ${loaderPath}`);
    }

    /**
     * 자동 아카이빙 (30일 이상된 history)
     */
    archiveOldHistory() {
        console.log('\n[*] 오래된 History 아카이빙...');
        
        const files = fs.readdirSync(HISTORY_DIR);
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        let archivedCount = 0;

        for (const file of files) {
            if (file.endsWith('-history.json')) {
                const filePath = path.join(HISTORY_DIR, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime.getTime() < thirtyDaysAgo) {
                    const archivePath = path.join(ARCHIVE_DIR, file);
                    fs.renameSync(filePath, archivePath);
                    console.log(`[+] 아카이빙: ${file}`);
                    archivedCount++;
                }
            }
        }

        if (archivedCount > 0) {
            console.log(`[+] ${archivedCount}개 파일 아카이빙 완료`);
        } else {
            console.log('[*] 아카이빙할 파일 없음');
        }
    }

    /**
     * 상태 리포트
     */
    getStatus() {
        console.log('\n[*] History 외부화 상태:');
        
        // claude.json 크기
        const claudeJsonSize = fs.statSync(CLAUDE_JSON_PATH).size;
        console.log(`  claude.json 크기: ${(claudeJsonSize / 1024).toFixed(2)} KB`);
        
        // history 파일 수
        const historyFiles = fs.readdirSync(HISTORY_DIR).filter(f => f.endsWith('-history.json'));
        console.log(`  외부 history 파일: ${historyFiles.length}개`);
        
        // 아카이브 파일 수
        const archiveFiles = fs.readdirSync(ARCHIVE_DIR).filter(f => f.endsWith('-history.json'));
        console.log(`  아카이브 파일: ${archiveFiles.length}개`);
        
        // 참조 정보
        const refsPath = path.join(HISTORY_DIR, 'history-refs.json');
        if (fs.existsSync(refsPath)) {
            const refs = JSON.parse(fs.readFileSync(refsPath, 'utf8'));
            const totalItems = Object.values(refs).reduce((sum, ref) => sum + ref.itemCount, 0);
            console.log(`  총 history 항목: ${totalItems}개`);
        }
    }
}

// CLI 실행
if (require.main === module) {
    const externalizer = new HistoryExternalizer();
    const command = process.argv[2];
    
    switch (command) {
        case 'extract':
            externalizer.extractHistory();
            externalizer.createHistoryLoader();
            break;
        case 'archive':
            externalizer.archiveOldHistory();
            break;
        case 'status':
            externalizer.getStatus();
            break;
        default:
            console.log('History 외부화 시스템');
            console.log('====================');
            console.log('사용법:');
            console.log('  node history-externalizer.js extract  - History 추출 및 외부화');
            console.log('  node history-externalizer.js archive  - 오래된 history 아카이빙');
            console.log('  node history-externalizer.js status   - 상태 확인');
            console.log('\n현재 상태:');
            externalizer.getStatus();
    }
}

module.exports = HistoryExternalizer;
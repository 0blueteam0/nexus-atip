/**
 * 🧠 자동 메모리 시스템
 * Claude Code 세션 자동 저장 및 컨텍스트 관리
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 설정
const CONFIG = {
  autoSaveInterval: 3600000, // 1시간마다
  importantKeywords: ['결정', '해결', '성공', '완료', '중요', '핵심', '문제'],
  memoryPath: 'K:/PortableApps/Claude-Code/memory-archive',
  shrimpDataPath: 'K:/PortableApps/Claude-Code/ShrimpData',
  retention: {
    enabled: false,  // false = 영구 보관
    days: -1,        // -1 = 삭제하지 않음
    compress: true,  // 오래된 파일 압축
    archivePath: 'K:/PortableApps/Claude-Code/memory-archive/permanent'
  }
};

class AutoMemorySystem {
  constructor() {
    this.sessionStartTime = new Date();
    this.sessionMemory = {
      decisions: [],
      achievements: [],
      errors: [],
      learnings: []
    };
  }

  /**
   * 세션 시작 시 이전 컨텍스트 로드
   */
  async loadPreviousContext() {
    console.log('🔄 이전 세션 컨텍스트 로드 중...');
    
    try {
      const lastSession = await this.getLastSession();
      if (lastSession) {
        console.log('✅ 이전 세션 발견:', lastSession.date);
        console.log('📋 미완료 작업:', lastSession.pendingTasks);
        return lastSession;
      }
    } catch (error) {
      console.log('⚠️ 이전 세션 없음 - 새 세션 시작');
    }
  }

  /**
   * 중요 내용 자동 감지 및 저장
   */
  detectImportantContent(message) {
    const hasKeyword = CONFIG.importantKeywords.some(keyword => 
      message.includes(keyword)
    );

    if (hasKeyword) {
      console.log('💡 중요 내용 감지 - 자동 저장');
      this.addToMemory('auto-detected', message);
    }
  }

  /**
   * 메모리에 항목 추가
   */
  addToMemory(type, content) {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      content
    };

    switch(type) {
      case 'decision':
        this.sessionMemory.decisions.push(entry);
        break;
      case 'achievement':
        this.sessionMemory.achievements.push(entry);
        break;
      case 'error':
        this.sessionMemory.errors.push(entry);
        break;
      default:
        this.sessionMemory.learnings.push(entry);
    }

    // 즉시 저장 (중요 내용)
    if (type === 'decision' || type === 'error') {
      this.saveToKiroMemory(entry);
    }
  }

  /**
   * kiro-memory MCP에 저장
   */
  async saveToKiroMemory(data) {
    // kiro-memory MCP 서버로 직접 전송
    const command = `echo '${JSON.stringify(data)}' | claude --eval "메모리에 저장: ${data.content}"`;
    
    exec(command, (error, stdout) => {
      if (!error) {
        console.log('✅ kiro-memory 저장 완료');
      }
    });
  }

  /**
   * 정기 자동 저장 (1시간마다)
   */
  startAutoSave() {
    setInterval(() => {
      console.log('⏰ 정기 자동 저장 시작...');
      this.saveSessionSummary();
    }, CONFIG.autoSaveInterval);
  }

  /**
   * 세션 요약 저장
   */
  async saveSessionSummary() {
    const summary = {
      date: new Date().toISOString(),
      duration: Date.now() - this.sessionStartTime,
      memory: this.sessionMemory,
      shrimpTasks: await this.getShrimpTaskStatus()
    };

    // 파일로 저장
    const fileName = `session-${new Date().toISOString().split('T')[0]}.json`;
    const filePath = path.join(CONFIG.memoryPath, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(summary, null, 2));
    console.log('💾 세션 요약 저장:', filePath);

    // kiro-memory에도 저장
    await this.saveToKiroMemory({
      type: 'session-summary',
      content: `세션 요약: ${this.sessionMemory.achievements.length}개 성과, ${this.sessionMemory.decisions.length}개 결정`
    });
  }

  /**
   * Shrimp Task 상태 가져오기
   */
  async getShrimpTaskStatus() {
    try {
      const tasksPath = path.join(CONFIG.shrimpDataPath, 'current-tasks.json');
      const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      
      return {
        total: tasks.tasks.length,
        completed: tasks.tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.tasks.filter(t => t.status === 'in-progress').length,
        pending: tasks.tasks.filter(t => t.status === 'pending').length
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 마지막 세션 정보 가져오기
   */
  async getLastSession() {
    const files = fs.readdirSync(CONFIG.memoryPath)
      .filter(f => f.startsWith('session-'))
      .sort()
      .reverse();

    if (files.length > 0) {
      const lastFile = path.join(CONFIG.memoryPath, files[0]);
      return JSON.parse(fs.readFileSync(lastFile, 'utf8'));
    }
    return null;
  }
}

// 자동 메모리 시스템 초기화
const autoMemory = new AutoMemorySystem();

// 세션 시작
autoMemory.loadPreviousContext();
autoMemory.startAutoSave();

console.log('🚀 자동 메모리 시스템 활성화!');
console.log('⚙️ 설정: 1시간마다 자동 저장, 중요 키워드 감지 활성화');

module.exports = autoMemory;
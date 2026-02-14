/**
 * ATOS Load Tracker - STL 중복 로드 방지 모듈
 * 
 * Self-Triggered Loading (STL) 시스템의 핵심 컴포넌트
 * 세션 내 동일 리소스 중복 로딩을 방지하여 컨텍스트 효율화
 * 
 * @module atos/load-tracker
 * @version 1.0.0
 * @date 2025-12-25
 */

const fs = require('fs');
const path = require('path');

// 경로 설정
const ATOS_DIR = path.resolve(__dirname);
const DATA_DIR = path.resolve(ATOS_DIR, '..', 'data');
const TRACKER_FILE = path.join(DATA_DIR, 'load-tracker-session.json');
const REGISTRY_DIR = path.join(ATOS_DIR, 'registry');
const TOOL_INDEX_FILE = path.join(REGISTRY_DIR, 'tool-index.json');

/**
 * LoadTracker 클래스 - 싱글톤 패턴
 * 세션 내 로드된 리소스 추적 및 중복 방지
 */
class LoadTracker {
  constructor() {
    this.loaded = new Map();       // resourceId -> { type, timestamp, source }
    this.sessionStart = Date.now();
    this.stats = {
      totalLoads: 0,
      duplicatesPrevented: 0,
      byType: {}                   // type별 로드 횟수
    };
  }

  /**
   * 리소스가 이미 로드되었는지 확인
   * @param {string} resourceId - 리소스 식별자 (파일 경로, 스킬 이름 등)
   * @returns {boolean} 로드 여부
   */
  isLoaded(resourceId) {
    const exists = this.loaded.has(resourceId);
    if (exists) {
      this.stats.duplicatesPrevented++;
    }
    return exists;
  }

  /**
   * 리소스를 로드됨으로 표시
   * @param {string} resourceId - 리소스 식별자
   * @param {string} type - 리소스 타입 (skill, command, rule, file, mcp)
   * @param {string} source - 로드 소스 (user, assistant, file, hook)
   */
  markLoaded(resourceId, type = 'unknown', source = 'unknown') {
    if (!this.loaded.has(resourceId)) {
      this.loaded.set(resourceId, {
        type,
        source,
        timestamp: Date.now()
      });
      this.stats.totalLoads++;
      this.stats.byType[type] = (this.stats.byType[type] || 0) + 1;
    }
  }

  /**
   * 특정 리소스의 로드 정보 조회
   * @param {string} resourceId - 리소스 식별자
   * @returns {object|null} 로드 정보 또는 null
   */
  getLoadInfo(resourceId) {
    return this.loaded.get(resourceId) || null;
  }

  /**
   * 세션 통계 조회
   * @returns {object} 통계 정보
   */
  getSessionStats() {
    const sessionDuration = Math.floor((Date.now() - this.sessionStart) / 1000);
    return {
      sessionStart: new Date(this.sessionStart).toISOString(),
      sessionDuration: `${sessionDuration}s`,
      loadedResources: this.loaded.size,
      ...this.stats
    };
  }

  /**
   * 로드된 리소스 목록 조회
   * @param {string} type - 필터링할 타입 (선택)
   * @returns {Array} 리소스 목록
   */
  getLoadedList(type = null) {
    const result = [];
    for (const [id, info] of this.loaded) {
      if (!type || info.type === type) {
        result.push({ id, ...info });
      }
    }
    return result;
  }

  /**
   * 트래커 초기화 (세션 리셋)
   */
  reset() {
    this.loaded.clear();
    this.sessionStart = Date.now();
    this.stats = {
      totalLoads: 0,
      duplicatesPrevented: 0,
      byType: {}
    };
  }

  /**
   * 현재 상태를 파일로 저장 (세션 종료 시)
   */
  saveSession() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = {
        sessionStart: this.sessionStart,
        savedAt: Date.now(),
        stats: this.stats,
        loaded: Object.fromEntries(this.loaded)
      };
      fs.writeFileSync(TRACKER_FILE, JSON.stringify(data, null, 2));
      return true;
    } catch (err) {
      console.error('[LoadTracker] Save failed:', err.message);
      return false;
    }
  }

  /**
   * 카테고리별 MCP 레지스트리 온디맨드 로드
   * @param {string} category - 카테고리 이름 (filesystem, web-crawl, github 등)
   * @returns {object|null} 카테고리 레지스트리 데이터 또는 null
   */
  loadCategory(category) {
    const categoryKey = `category:${category}`;

    // 이미 로드된 카테고리 반환
    if (this.loaded.has(categoryKey)) {
      this.stats.duplicatesPrevented++;
      return this.loaded.get(categoryKey).data;
    }

    try {
      // tool-index.json에서 카테고리 경로 조회
      if (!fs.existsSync(TOOL_INDEX_FILE)) {
        console.error('[LoadTracker] tool-index.json not found');
        return null;
      }

      const toolIndex = JSON.parse(fs.readFileSync(TOOL_INDEX_FILE, 'utf8'));
      const categoryInfo = toolIndex.categories?.[category];

      if (!categoryInfo) {
        console.error(`[LoadTracker] Category not found: ${category}`);
        return null;
      }

      // 카테고리별 JSON 파일 로드
      const categoryPath = path.join(REGISTRY_DIR, categoryInfo.path.replace('./', ''));

      if (!fs.existsSync(categoryPath)) {
        console.error(`[LoadTracker] Category file not found: ${categoryPath}`);
        return null;
      }

      const categoryData = JSON.parse(fs.readFileSync(categoryPath, 'utf8'));

      // 로드 추적 (data 필드에 실제 데이터 저장)
      this.loaded.set(categoryKey, {
        type: 'category',
        source: 'on-demand',
        timestamp: Date.now(),
        data: categoryData
      });

      this.stats.totalLoads++;
      this.stats.byType['category'] = (this.stats.byType['category'] || 0) + 1;

      return categoryData;
    } catch (err) {
      console.error(`[LoadTracker] Category load failed: ${err.message}`);
      return null;
    }
  }

  /**
   * 키워드로 관련 카테고리 찾기
   * @param {string} keyword - 검색 키워드
   * @returns {string|null} 매칭된 카테고리 이름 또는 null
   */
  findCategoryByKeyword(keyword) {
    try {
      if (!fs.existsSync(TOOL_INDEX_FILE)) {
        return null;
      }

      const toolIndex = JSON.parse(fs.readFileSync(TOOL_INDEX_FILE, 'utf8'));
      const lowerKeyword = keyword.toLowerCase();

      for (const [catName, catInfo] of Object.entries(toolIndex.categories || {})) {
        if (catInfo.triggers?.some(t => lowerKeyword.includes(t.toLowerCase()))) {
          return catName;
        }
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  /**
   * 로드된 카테고리 목록 조회
   * @returns {Array} 로드된 카테고리 이름 목록
   */
  getLoadedCategories() {
    const categories = [];
    for (const [id, info] of this.loaded) {
      if (info.type === 'category') {
        categories.push(id.replace('category:', ''));
      }
    }
    return categories;
  }
}

// 싱글톤 인스턴스
const tracker = new LoadTracker();

// CLI 인터페이스
if (require.main === module) {
  const cmd = process.argv[2];
  
  switch (cmd) {
    case 'stats':
      console.log(JSON.stringify(tracker.getSessionStats(), null, 2));
      break;
    case 'list':
      const type = process.argv[3];
      console.log(JSON.stringify(tracker.getLoadedList(type), null, 2));
      break;
    case 'reset':
      tracker.reset();
      console.log('[+] LoadTracker reset complete');
      break;
    case 'test':
      // 테스트 시나리오
      tracker.markLoaded('skill:academic-verifier', 'skill', 'user');
      tracker.markLoaded('rule:bottom-up', 'rule', 'file');
      console.log('isLoaded test:', tracker.isLoaded('skill:academic-verifier'));
      console.log('Stats:', tracker.getSessionStats());
      break;
    default:
      console.log('Usage: node load-tracker.js <stats|list|reset|test> [type]');
  }
}

module.exports = { LoadTracker, tracker };

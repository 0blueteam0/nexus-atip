/**
 * FIC Manager - Frequent Intentional Compaction
 *
 * [작업] ACE-FCA 기반 컨텍스트 압축 관리
 * [목적] 40-80% 컨텍스트 활용률 유지로 효율성 극대화
 *
 * Compaction 대상 5가지:
 * 1. file_search_results - 경로만 추출
 * 2. code_flow_traces - 핵심 함수만 유지
 * 3. edit_histories - 최종 상태만 유지
 * 4. test_build_logs - 실패/경고만 유지
 * 5. large_json_blobs - 스키마만 추출
 */

const fs = require('fs');
const path = require('path');

class FICManager {
  constructor(options = {}) {
    this.targetUtilization = {
      min: options.minUtilization || 0.4,
      max: options.maxUtilization || 0.8
    };

    this.statsFile = options.statsFile ||
      path.join(__dirname, '../data/fic-stats.json');

    this.stats = this.loadStats();

    // Compaction 전략 등록
    this.strategies = new Map([
      ['file_search_results', this.compactFileSearch.bind(this)],
      ['code_flow_traces', this.compactCodeFlow.bind(this)],
      ['edit_histories', this.compactEditHistory.bind(this)],
      ['test_build_logs', this.compactTestLogs.bind(this)],
      ['large_json_blobs', this.compactJsonBlob.bind(this)]
    ]);
  }

  /**
   * 콘텐츠 압축 메인 함수
   */
  compact(content, type) {
    const strategy = this.strategies.get(type);

    if (!strategy) {
      console.warn(`[FIC] Unknown compaction type: ${type}`);
      return content;
    }

    const before = this.estimateSize(content);
    const compacted = strategy(content);
    const after = this.estimateSize(compacted);

    // 통계 업데이트
    this.updateStats(type, before, after);

    return compacted;
  }

  /**
   * 파일 검색 결과 압축
   * - 경로만 추출
   * - 중복 제거
   * - 상위 20개만 유지
   */
  compactFileSearch(results) {
    if (!Array.isArray(results)) {
      return results;
    }

    // 경로 추출 (다양한 형식 지원)
    const paths = results.map(r => {
      if (typeof r === 'string') return r;
      return r.path || r.file || r.filename || r.name || String(r);
    });

    // 중복 제거 및 상위 20개
    const unique = [...new Set(paths)];
    return unique.slice(0, 20);
  }

  /**
   * 코드 흐름 추적 압축
   * - 핵심 함수만 유지
   * - 반복 호출 집약
   */
  compactCodeFlow(trace) {
    if (!Array.isArray(trace)) {
      return trace;
    }

    // 핵심 함수 필터링 (export, public, main 등)
    const keyFunctions = trace.filter(t => {
      if (typeof t === 'string') {
        return t.includes('export') ||
               t.includes('public') ||
               t.includes('main') ||
               t.includes('async');
      }
      return t.isKeyFunction || t.isPublic || t.exported;
    });

    // 반복 호출 집약
    const callCounts = new Map();
    keyFunctions.forEach(fn => {
      const key = typeof fn === 'string' ? fn : fn.name;
      callCounts.set(key, (callCounts.get(key) || 0) + 1);
    });

    // 유니크 함수 + 호출 횟수
    return Array.from(callCounts.entries()).map(([name, count]) => ({
      name,
      calls: count
    }));
  }

  /**
   * 편집 기록 압축
   * - 최근 5개만 유지
   * - 중간 단계 제거
   */
  compactEditHistory(history) {
    if (!Array.isArray(history)) {
      return history;
    }

    // 파일별 최종 상태만 유지
    const latestByFile = new Map();

    history.forEach(edit => {
      const file = edit.file || edit.path || edit.filename;
      if (file) {
        latestByFile.set(file, edit);
      }
    });

    // 시간순 정렬 후 최근 5개
    const sorted = Array.from(latestByFile.values())
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return sorted.slice(0, 5).map(edit => ({
      file: edit.file || edit.path,
      action: edit.action || 'modified',
      summary: edit.summary || `${edit.linesChanged || '?'} lines`
    }));
  }

  /**
   * 테스트/빌드 로그 압축
   * - 실패/경고만 유지
   * - 성공 로그 제거
   */
  compactTestLogs(logs) {
    if (!Array.isArray(logs)) {
      // 문자열인 경우 라인 단위로 처리
      if (typeof logs === 'string') {
        const lines = logs.split('\n');
        return lines.filter(line => {
          const lower = line.toLowerCase();
          return lower.includes('error') ||
                 lower.includes('fail') ||
                 lower.includes('warn') ||
                 lower.includes('exception');
        }).join('\n');
      }
      return logs;
    }

    return logs.filter(log => {
      const level = (log.level || log.type || '').toLowerCase();
      const message = (log.message || log.text || String(log)).toLowerCase();

      return level !== 'success' &&
             level !== 'pass' &&
             level !== 'info' &&
             (message.includes('error') ||
              message.includes('fail') ||
              message.includes('warn'));
    });
  }

  /**
   * 큰 JSON blob 압축
   * - 스키마만 추출
   * - 데이터 값 제거
   */
  compactJsonBlob(json) {
    if (typeof json === 'string') {
      try {
        json = JSON.parse(json);
      } catch {
        return json;
      }
    }

    return this.extractSchema(json);
  }

  /**
   * JSON 스키마 추출 헬퍼
   */
  extractSchema(obj, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) {
      return '...';
    }

    if (obj === null) return 'null';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return [this.extractSchema(obj[0], depth + 1, maxDepth)];
    }
    if (typeof obj !== 'object') {
      return typeof obj;
    }

    const schema = {};
    for (const [key, value] of Object.entries(obj)) {
      schema[key] = this.extractSchema(value, depth + 1, maxDepth);
    }
    return schema;
  }

  /**
   * 콘텐츠 크기 추정
   */
  estimateSize(content) {
    if (typeof content === 'string') {
      return content.length;
    }
    return JSON.stringify(content).length;
  }

  /**
   * 통계 로드
   */
  loadStats() {
    try {
      if (fs.existsSync(this.statsFile)) {
        return JSON.parse(fs.readFileSync(this.statsFile, 'utf8'));
      }
    } catch (err) {
      console.warn('[FIC] Failed to load stats:', err.message);
    }

    return {
      totalCompactions: 0,
      byType: {},
      savedBytes: 0,
      lastUpdated: null
    };
  }

  /**
   * 통계 업데이트
   */
  updateStats(type, before, after) {
    this.stats.totalCompactions++;
    this.stats.savedBytes += (before - after);

    if (!this.stats.byType[type]) {
      this.stats.byType[type] = { count: 0, savedBytes: 0 };
    }
    this.stats.byType[type].count++;
    this.stats.byType[type].savedBytes += (before - after);

    this.stats.lastUpdated = new Date().toISOString();

    this.saveStats();
  }

  /**
   * 통계 저장
   */
  saveStats() {
    try {
      const dir = path.dirname(this.statsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.statsFile, JSON.stringify(this.stats, null, 2));
    } catch (err) {
      console.warn('[FIC] Failed to save stats:', err.message);
    }
  }

  /**
   * 현재 통계 반환
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 컨텍스트 활용률 체크 및 자동 압축 권장
   */
  checkUtilization(currentUsage, maxCapacity) {
    const utilization = currentUsage / maxCapacity;

    if (utilization > this.targetUtilization.max) {
      return {
        shouldCompact: true,
        utilization,
        message: `Context utilization ${(utilization * 100).toFixed(1)}% exceeds target ${this.targetUtilization.max * 100}%`
      };
    }

    return {
      shouldCompact: false,
      utilization,
      message: `Context utilization ${(utilization * 100).toFixed(1)}% within target range`
    };
  }
}

// Singleton instance
let instance = null;

function getFICManager(options) {
  if (!instance) {
    instance = new FICManager(options);
  }
  return instance;
}

module.exports = { FICManager, getFICManager };

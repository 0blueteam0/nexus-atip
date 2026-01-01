/**
 * Bootstrap Loader - Minimal startup with lazy-loaded modules
 * Part of ATOS Context Optimization (Phase 3)
 * 
 * [목적] 세션 시작 시 최소 컨텍스트만 로드 (~3KB vs 505KB)
 * [방법] 인덱스 파일만 로드 후, 키워드 트리거 시 모듈 동적 로드
 */

const path = require('path');
const fs = require('fs');

class BootstrapLoader {
  constructor() {
    this.basePath = __dirname;
    this.loadedModules = new Map();
    this.loadedCategories = new Map();
    this.moduleIndex = null;
    this.toolIndex = null;
    this.initialized = false;
  }

  /**
   * [작업] 최소 부트스트랩 실행
   * [방법] 인덱스 파일 + load-tracker만 로드
   */
  bootstrap() {
    if (this.initialized) {
      return { status: 'already_initialized', modules: this.getLoadedStats() };
    }

    try {
      // 1. 인덱스 파일 로드 (필수)
      this.moduleIndex = require('./module-index.json');
      this.toolIndex = require('./registry/tool-index.json');

      // 2. 핵심 모듈만 로드 (load-tracker)
      const coreModules = this.moduleIndex.core?.modules || {};
      for (const [name, config] of Object.entries(coreModules)) {
        if (config.critical) {
          this.loadModule(name);
        }
      }

      this.initialized = true;
      return {
        status: 'success',
        coreLoaded: Object.keys(coreModules).filter(k => coreModules[k].critical),
        availableCategories: Object.keys(this.toolIndex.categories || {}),
        availableModules: Object.keys(this.moduleIndex.onDemand?.modules || {})
      };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * [작업] 모듈 로드 (이미 로드된 경우 캐시 반환)
   * @param {string} moduleName - 모듈 이름 (module-index.json 기준)
   */
  loadModule(moduleName) {
    // 캐시 확인
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName);
    }

    // 코어 모듈 확인
    let moduleConfig = this.moduleIndex?.core?.modules?.[moduleName];
    
    // 온디맨드 모듈 확인
    if (!moduleConfig) {
      moduleConfig = this.moduleIndex?.onDemand?.modules?.[moduleName];
    }

    if (!moduleConfig) {
      throw new Error(`Module not found: ${moduleName}`);
    }

    // 의존성 먼저 로드
    if (moduleConfig.dependencies) {
      for (const dep of moduleConfig.dependencies) {
        if (!this.loadedModules.has(dep)) {
          this.loadModule(dep);
        }
      }
    }

    // 모듈 로드
    const modulePath = path.join(this.basePath, moduleConfig.path);
    const module = require(modulePath);
    this.loadedModules.set(moduleName, module);

    return module;
  }

  /**
   * [작업] 도구 카테고리 로드
   * @param {string} category - 카테고리 이름 (filesystem, web-crawl 등)
   */
  loadToolCategory(category) {
    // 캐시 확인
    if (this.loadedCategories.has(category)) {
      return this.loadedCategories.get(category);
    }

    const categoryConfig = this.toolIndex?.categories?.[category];
    if (!categoryConfig) {
      throw new Error(`Category not found: ${category}`);
    }

    // 카테고리 JSON 로드
    const categoryPath = path.join(this.basePath, 'registry', categoryConfig.path);
    const categoryData = require(categoryPath);
    this.loadedCategories.set(category, categoryData);

    return categoryData;
  }

  /**
   * [작업] 키워드로 카테고리 찾기
   * @param {string} keyword - 검색 키워드
   */
  findCategoryByKeyword(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    const categories = this.toolIndex?.categories || {};

    for (const [name, config] of Object.entries(categories)) {
      if (config.triggers && config.triggers.some(t => 
        lowerKeyword.includes(t.toLowerCase()) || t.toLowerCase().includes(lowerKeyword)
      )) {
        return { category: name, config };
      }
    }
    return null;
  }

  /**
   * [작업] 키워드로 모듈 찾기
   * @param {string} keyword - 검색 키워드
   */
  findModuleByKeyword(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    const modules = this.moduleIndex?.onDemand?.modules || {};

    for (const [name, config] of Object.entries(modules)) {
      if (config.triggers && config.triggers.some(t => 
        lowerKeyword.includes(t.toLowerCase()) || t.toLowerCase().includes(lowerKeyword)
      )) {
        return { module: name, config };
      }
    }
    return null;
  }

  /**
   * [작업] 로드 상태 통계
   */
  getLoadedStats() {
    return {
      modules: Array.from(this.loadedModules.keys()),
      categories: Array.from(this.loadedCategories.keys()),
      moduleCount: this.loadedModules.size,
      categoryCount: this.loadedCategories.size
    };
  }

  /**
   * [작업] 모듈/카테고리 언로드 (메모리 해제)
   * @param {string} type - 'module' 또는 'category'
   * @param {string} name - 이름
   */
  unload(type, name) {
    if (type === 'module') {
      // 핵심 모듈은 언로드 불가
      const coreModules = Object.keys(this.moduleIndex?.core?.modules || {});
      if (coreModules.includes(name)) {
        return { status: 'error', message: 'Cannot unload core module' };
      }
      
      if (this.loadedModules.has(name)) {
        this.loadedModules.delete(name);
        return { status: 'success', unloaded: name };
      }
    } else if (type === 'category') {
      if (this.loadedCategories.has(name)) {
        this.loadedCategories.delete(name);
        return { status: 'success', unloaded: name };
      }
    }
    return { status: 'not_found', name };
  }

  /**
   * [작업] 전체 리셋 (테스트용)
   */
  reset() {
    // 핵심 모듈 제외 모두 언로드
    const coreModules = Object.keys(this.moduleIndex?.core?.modules || {});
    
    for (const name of this.loadedModules.keys()) {
      if (!coreModules.includes(name)) {
        this.loadedModules.delete(name);
      }
    }
    
    this.loadedCategories.clear();
    
    return { status: 'reset', remaining: coreModules };
  }
}

// Singleton 인스턴스
const bootstrapLoader = new BootstrapLoader();

module.exports = {
  BootstrapLoader,
  bootstrapLoader,
  bootstrap: () => bootstrapLoader.bootstrap(),
  loadModule: (name) => bootstrapLoader.loadModule(name),
  loadCategory: (name) => bootstrapLoader.loadToolCategory(name),
  findByKeyword: (keyword) => ({
    category: bootstrapLoader.findCategoryByKeyword(keyword),
    module: bootstrapLoader.findModuleByKeyword(keyword)
  }),
  getStats: () => bootstrapLoader.getLoadedStats()
};

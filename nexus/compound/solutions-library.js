/**
 * NEXUS Solutions Library
 *
 * Stores and retrieves reusable solutions with YAML frontmatter metadata.
 * Solutions accumulate from the Compound phase of the loop.
 * Promotes to long-term memory when times_referenced > 3.
 *
 * @module nexus/compound/solutions-library
 */

'use strict';

const fs = require('fs');
const path = require('path');

const NEXUS_ROOT = path.resolve(__dirname, '..');
const SOLUTIONS_DIR = path.join(NEXUS_ROOT, 'compound', 'solutions');
const INDEX_PATH = path.join(SOLUTIONS_DIR, '_index.json');
const MAX_SOLUTIONS = 500;

class SolutionsLibrary {
  constructor(options = {}) {
    this.solutionsDir = options.solutionsDir || SOLUTIONS_DIR;
    this.maxSolutions = options.maxSolutions || MAX_SOLUTIONS;
    this._ensureDir();
    this.index = this._loadIndex();
  }

  /**
   * Add a new solution
   * @param {Object} solution - { title, category, tags, content, taskType, provider }
   * @returns {Object} Stored solution with ID
   */
  add(solution) {
    const id = `sol-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const entry = {
      id,
      title: solution.title || 'Untitled Solution',
      category: solution.category || 'general',
      tags: solution.tags || [],
      taskType: solution.taskType || 'general',
      provider: solution.provider || 'unknown',
      timesReferenced: 0,
      promoted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Write solution file with frontmatter
    const content = this._formatSolution(entry, solution.content || '');
    const filePath = path.join(this.solutionsDir, `${id}.md`);
    fs.writeFileSync(filePath, content, 'utf-8');

    // Update index
    this.index.solutions.push(entry);
    this._enforceLimit();
    this._saveIndex();

    return entry;
  }

  /**
   * Find solutions by query (tags, category, taskType)
   * @param {Object} query - { tags, category, taskType, keyword }
   * @returns {Array} Matching solutions
   */
  find(query = {}) {
    let results = [...this.index.solutions];

    if (query.category) {
      results = results.filter(s => s.category === query.category);
    }
    if (query.taskType) {
      results = results.filter(s => s.taskType === query.taskType);
    }
    if (query.tags && query.tags.length > 0) {
      const tagSet = new Set(query.tags);
      results = results.filter(s =>
        s.tags.some(t => tagSet.has(t))
      );
    }
    if (query.keyword) {
      const kw = query.keyword.toLowerCase();
      results = results.filter(s =>
        s.title.toLowerCase().includes(kw) ||
        s.tags.some(t => t.toLowerCase().includes(kw))
      );
    }

    // Sort by relevance (times referenced + recency)
    results.sort((a, b) => {
      const scoreA = a.timesReferenced * 2 + (new Date(a.updatedAt).getTime() / 1e12);
      const scoreB = b.timesReferenced * 2 + (new Date(b.updatedAt).getTime() / 1e12);
      return scoreB - scoreA;
    });

    return results;
  }

  /**
   * Reference a solution (increment counter, check for promotion)
   * @param {string} id - Solution ID
   * @returns {Object|null} Updated solution entry
   */
  reference(id) {
    const entry = this.index.solutions.find(s => s.id === id);
    if (!entry) return null;

    entry.timesReferenced++;
    entry.updatedAt = new Date().toISOString();

    // Promote to long-term memory when referenced > 3 times
    if (entry.timesReferenced > 3 && !entry.promoted) {
      entry.promoted = true;
    }

    this._saveIndex();
    return entry;
  }

  /**
   * Get a solution's full content
   * @param {string} id - Solution ID
   * @returns {string|null} Solution content
   */
  getContent(id) {
    const filePath = path.join(this.solutionsDir, `${id}.md`);
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
      }
    } catch (e) { /* skip */ }
    return null;
  }

  /**
   * Get promoted solutions (times_referenced > 3)
   * @returns {Array} Solutions ready for long-term memory
   */
  getPromoted() {
    return this.index.solutions.filter(s => s.promoted);
  }

  /**
   * Get statistics
   */
  getStats() {
    const solutions = this.index.solutions;
    return {
      total: solutions.length,
      promoted: solutions.filter(s => s.promoted).length,
      categories: [...new Set(solutions.map(s => s.category))],
      avgReferences: solutions.length > 0
        ? (solutions.reduce((sum, s) => sum + s.timesReferenced, 0) / solutions.length).toFixed(1)
        : 0,
      topTags: this._getTopTags(10)
    };
  }

  /**
   * Format solution with YAML frontmatter
   */
  _formatSolution(entry, content) {
    return `---
id: ${entry.id}
title: "${entry.title}"
category: ${entry.category}
tags: [${entry.tags.join(', ')}]
taskType: ${entry.taskType}
provider: ${entry.provider}
timesReferenced: ${entry.timesReferenced}
createdAt: ${entry.createdAt}
---

${content}
`;
  }

  /**
   * Get top N tags by frequency
   */
  _getTopTags(n) {
    const tagCount = {};
    for (const s of this.index.solutions) {
      for (const t of s.tags) {
        tagCount[t] = (tagCount[t] || 0) + 1;
      }
    }
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([tag, count]) => ({ tag, count }));
  }

  /**
   * Enforce max solutions limit (LRU eviction)
   */
  _enforceLimit() {
    if (this.index.solutions.length <= this.maxSolutions) return;

    // Sort by last update (oldest first), skip promoted
    const candidates = this.index.solutions
      .filter(s => !s.promoted)
      .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

    const toRemove = this.index.solutions.length - this.maxSolutions;
    for (let i = 0; i < Math.min(toRemove, candidates.length); i++) {
      const s = candidates[i];
      // Remove file
      const fp = path.join(this.solutionsDir, `${s.id}.md`);
      try { fs.unlinkSync(fp); } catch (e) { /* skip */ }
      // Remove from index
      this.index.solutions = this.index.solutions.filter(x => x.id !== s.id);
    }
  }

  _ensureDir() {
    if (!fs.existsSync(this.solutionsDir)) {
      fs.mkdirSync(this.solutionsDir, { recursive: true });
    }
  }

  _loadIndex() {
    try {
      if (fs.existsSync(INDEX_PATH)) {
        return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
      }
    } catch (e) { /* skip */ }
    return { solutions: [], version: '1.0.0' };
  }

  _saveIndex() {
    fs.writeFileSync(INDEX_PATH, JSON.stringify(this.index, null, 2), 'utf-8');
  }
}

module.exports = { SolutionsLibrary };

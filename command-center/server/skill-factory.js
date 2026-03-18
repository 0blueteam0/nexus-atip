/**
 * Skill Factory (F Architecture Phase 6)
 *
 * Auto-detects patterns -> generates Claude Code skills -> evaluates -> deploys.
 * Single module with 4 internal phases: generate(), evaluate(), stage(), deploy().
 *
 * Design: Claude + Codex merged (single module, extension points for future split)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

const SKILLS_DIR = 'K:/PortableApps/genai/.claude/skills/auto';
const STAGING_DIR = 'K:/PortableApps/genai/.claude/skills/auto/.staging';
const MIN_PATTERN_CONFIDENCE = 0.7;
const MIN_PATTERN_OCCURRENCES = 5;
const MIN_EVAL_PASS_RATE = 0.8;

class SkillFactory {
  constructor({ broadcaster, claudeBridge, autonomyGuard }) {
    this.broadcaster = broadcaster;
    this.claudeBridge = claudeBridge;
    this.autonomyGuard = autonomyGuard;

    // Ensure directories exist
    try { fs.mkdirSync(SKILLS_DIR, { recursive: true }); } catch {}
    try { fs.mkdirSync(STAGING_DIR, { recursive: true }); } catch {}
  }

  /**
   * Full pipeline: scan patterns -> generate -> evaluate -> stage
   * Called by Tier5 scheduler or manually
   */
  runCycle() {
    const results = { generated: 0, evaluated: 0, staged: 0, failed: 0 };

    // 1. Find promotion-ready patterns
    const candidates = this._findCandidates();
    if (candidates.length === 0) return { ...results, note: 'no candidates' };

    for (const pattern of candidates) {
      try {
        // 2. Generate skill
        const skill = this.generate(pattern);
        if (!skill) continue;
        results.generated++;

        // 3. Evaluate
        const evalResult = this.evaluate(skill.id);
        results.evaluated++;

        // 4. Stage if passes
        if (evalResult.passRate >= MIN_EVAL_PASS_RATE) {
          this.stage(skill.id);
          results.staged++;
        } else {
          results.failed++;
        }
      } catch (err) {
        results.failed++;
        db.recordEvent('skill_factory_error', 'skill-factory', { pattern: pattern.pattern_hash, error: err.message });
      }
    }

    this.broadcaster.broadcast('skill_factory.cycle_complete', results);
    return results;
  }

  /**
   * Generate a skill from a pattern candidate
   */
  generate(pattern) {
    const d = db.getDb();
    const toolChain = typeof pattern.tool_chain === 'string' ? JSON.parse(pattern.tool_chain) : pattern.tool_chain;
    const name = `auto-${toolChain.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '')}`;

    // Check if already generated
    const existing = d.prepare('SELECT id FROM generated_skills WHERE name = ?').get(name);
    if (existing) return existing;

    const id = `skill-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const triggerPhrase = `Auto: ${pattern.description || toolChain.join(' -> ')}`;

    // Generate SKILL.md content
    const skillContent = this._generateSkillMd(name, triggerPhrase, toolChain, pattern);

    d.prepare(`
      INSERT INTO generated_skills (id, name, pattern_hash, trigger_phrase, skill_content, tool_chain, status)
      VALUES (?, ?, ?, ?, ?, ?, 'draft')
    `).run(id, name, pattern.pattern_hash, triggerPhrase, skillContent, JSON.stringify(toolChain));

    return { id, name };
  }

  /**
   * Evaluate a generated skill (basic validation)
   */
  evaluate(skillId) {
    const d = db.getDb();
    const skill = d.prepare('SELECT * FROM generated_skills WHERE id = ?').get(skillId);
    if (!skill) return { ok: false, error: 'skill not found' };

    const evalId = `eval-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const startTime = Date.now();
    let passCount = 0;
    let testCount = 0;
    const issues = [];

    // Test 1: SKILL.md is valid markdown with required sections
    testCount++;
    if (skill.skill_content.includes('## Trigger') && skill.skill_content.includes('## Description')) {
      passCount++;
    } else {
      issues.push('Missing required sections (Trigger/Description)');
    }

    // Test 2: Tool chain is valid JSON array
    testCount++;
    try {
      const tools = JSON.parse(skill.tool_chain);
      if (Array.isArray(tools) && tools.length > 0) passCount++;
      else issues.push('Empty tool chain');
    } catch {
      issues.push('Invalid tool chain JSON');
    }

    // Test 3: Name is filesystem-safe
    testCount++;
    if (/^[a-z0-9-]+$/.test(skill.name)) {
      passCount++;
    } else {
      issues.push('Name contains invalid characters');
    }

    // Test 4: Content size reasonable
    testCount++;
    if (skill.skill_content.length > 50 && skill.skill_content.length < 10000) {
      passCount++;
    } else {
      issues.push(`Content size out of range: ${skill.skill_content.length}`);
    }

    const passRate = testCount > 0 ? passCount / testCount : 0;
    const durationMs = Date.now() - startTime;

    // Record eval run
    d.prepare(`
      INSERT INTO skill_eval_runs (id, skill_id, test_count, pass_count, pass_rate, duration_ms, issues, ended_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(evalId, skillId, testCount, passCount, passRate, durationMs,
           issues.length > 0 ? JSON.stringify(issues) : null);

    // Update skill
    d.prepare(`
      UPDATE generated_skills SET eval_pass_rate = ?, eval_runs = eval_runs + 1,
        status = CASE WHEN ? >= ${MIN_EVAL_PASS_RATE} THEN 'staged' ELSE 'failed' END,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(passRate, passRate, skillId);

    return { evalId, passRate, testCount, passCount, issues, durationMs };
  }

  /**
   * Stage a skill (write to staging directory)
   */
  stage(skillId) {
    const d = db.getDb();
    const skill = d.prepare('SELECT * FROM generated_skills WHERE id = ?').get(skillId);
    if (!skill) return { ok: false, error: 'not found' };

    const skillDir = path.join(STAGING_DIR, skill.name);
    try { fs.mkdirSync(skillDir, { recursive: true }); } catch {}
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skill.skill_content, 'utf8');

    d.prepare(`UPDATE generated_skills SET status = 'staged', updated_at = datetime('now') WHERE id = ?`).run(skillId);
    return { ok: true, path: skillDir };
  }

  /**
   * Deploy a staged skill (move from staging to active)
   */
  deploy(skillId) {
    const d = db.getDb();
    const skill = d.prepare('SELECT * FROM generated_skills WHERE id = ?').get(skillId);
    if (!skill || skill.status !== 'staged') return { ok: false, error: 'not staged' };

    // Autonomy guard check
    if (this.autonomyGuard) {
      const check = this.autonomyGuard.checkAction({
        actionType: 'skill_deploy',
        module: 'skill-factory',
        description: `Deploy auto-generated skill: ${skill.name}`,
        riskLevel: 'medium'
      });
      if (check.blocked) return { ok: false, error: check.reason };
    }

    const srcDir = path.join(STAGING_DIR, skill.name);
    const destDir = path.join(SKILLS_DIR, skill.name);

    try {
      // Move from staging to active
      if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true });
      fs.cpSync(srcDir, destDir, { recursive: true });
      fs.rmSync(srcDir, { recursive: true });

      d.prepare(`
        UPDATE generated_skills SET status = 'active', deployed_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(skillId);

      this.broadcaster.broadcast('skill_factory.deployed', { skillId, name: skill.name });
      return { ok: true, path: destDir };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Retire a deployed skill
   */
  retire(skillId) {
    const d = db.getDb();
    const skill = d.prepare('SELECT * FROM generated_skills WHERE id = ?').get(skillId);
    if (!skill) return { ok: false, error: 'not found' };

    const activeDir = path.join(SKILLS_DIR, skill.name);
    if (fs.existsSync(activeDir)) fs.rmSync(activeDir, { recursive: true });

    d.prepare(`UPDATE generated_skills SET status = 'retired', retired_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(skillId);
    return { ok: true };
  }

  /**
   * List generated skills
   */
  list({ status, limit } = {}) {
    const d = db.getDb();
    let sql = 'SELECT * FROM generated_skills WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit || 20);
    return d.prepare(sql).all(...params);
  }

  // === Private ===

  _findCandidates() {
    const d = db.getDb();
    try {
      return d.prepare(`
        SELECT * FROM pattern_candidates
        WHERE status = 'candidate' AND occurrence_count >= ? AND confidence >= ?
        ORDER BY confidence DESC LIMIT 5
      `).all(MIN_PATTERN_OCCURRENCES, MIN_PATTERN_CONFIDENCE);
    } catch { return []; }
  }

  _generateSkillMd(name, trigger, toolChain, pattern) {
    return `# ${name}

## Trigger
"${trigger}"

## Description
Auto-generated skill from detected tool chain pattern.
Pattern: ${toolChain.join(' -> ')}
Confidence: ${Math.round((pattern.confidence || 0) * 100)}%
Occurrences: ${pattern.occurrence_count || 0}

## Tool Chain
${toolChain.map((t, i) => `${i + 1}. ${t}`).join('\n')}

## Instructions
Execute the following tool chain in order:
${toolChain.map((t, i) => `- Step ${i + 1}: Use ${t} tool`).join('\n')}

Report results after each step. If any step fails, stop and report the error.

## Metadata
- Generated: ${new Date().toISOString()}
- Pattern: ${pattern.pattern_hash || 'unknown'}
- Factory: skill-factory v1.0
`;
  }
}

module.exports = { SkillFactory };

/**
 * NEXUS Context Formatter - Stage 3: Format
 *
 * Converts scoped context into provider-specific format.
 * Each provider gets an optimized representation.
 *
 * @module nexus/context/formatter
 */

'use strict';

class ContextFormatter {
  constructor(options = {}) {
    this.templates = options.templates || {};
  }

  /**
   * Format scoped context for target provider
   * @param {Object} scopedContext - Output from ContextScoper
   * @returns {Object} Formatted context ready for provider
   */
  format(scopedContext) {
    const provider = scopedContext.provider;

    switch (provider) {
      case 'claude-code':
        return this._formatClaude(scopedContext);
      case 'gemini-cli':
        return this._formatGemini(scopedContext);
      case 'codex-cli':
        return this._formatCodex(scopedContext);
      default:
        return this._formatGeneric(scopedContext);
    }
  }

  /**
   * Format for Claude Code (structured, instruction-focused)
   */
  _formatClaude(ctx) {
    const sections = [];

    // Task section
    sections.push(`## Task\nType: ${ctx.task.type}\n${ctx.task.prompt}`);

    // Instructions as concise rules
    if (ctx.instructions.length > 0) {
      const rules = ctx.instructions.map((inst, i) =>
        `${i + 1}. ${inst.content}`
      ).join('\n');
      sections.push(`## Guidelines\n${rules}`);
    }

    // Context summary
    if (ctx.context.session) {
      sections.push(`## Session\nTasks completed: ${ctx.context.session.taskCount}`);
    }

    return {
      provider: 'claude-code',
      format: 'markdown',
      content: sections.join('\n\n'),
      tokenEstimate: Math.ceil(sections.join('\n\n').length / 4),
      metadata: ctx.metadata
    };
  }

  /**
   * Format for Gemini CLI (large context, flat text)
   */
  _formatGemini(ctx) {
    const parts = [];

    parts.push(`Task: ${ctx.task.prompt}`);
    parts.push(`Type: ${ctx.task.type}`);

    if (ctx.instructions.length > 0) {
      parts.push('\nGuidelines:');
      ctx.instructions.forEach(inst => {
        parts.push(`- ${inst.content}`);
      });
    }

    return {
      provider: 'gemini-cli',
      format: 'text',
      content: parts.join('\n'),
      tokenEstimate: Math.ceil(parts.join('\n').length / 4),
      metadata: ctx.metadata
    };
  }

  /**
   * Format for Codex CLI (minimal, code-focused)
   */
  _formatCodex(ctx) {
    const parts = [];

    parts.push(ctx.task.prompt);

    // Only critical instructions for codex
    const critical = ctx.instructions.filter(i =>
      i.type === 'anti_pattern' || i.priority >= 0.8
    );
    if (critical.length > 0) {
      parts.push('\nRules:');
      critical.forEach(inst => {
        parts.push(`# ${inst.content}`);
      });
    }

    return {
      provider: 'codex-cli',
      format: 'text',
      content: parts.join('\n'),
      tokenEstimate: Math.ceil(parts.join('\n').length / 4),
      metadata: ctx.metadata
    };
  }

  /**
   * Generic format (fallback)
   */
  _formatGeneric(ctx) {
    return {
      provider: ctx.provider,
      format: 'json',
      content: JSON.stringify({
        task: ctx.task,
        instructions: ctx.instructions.map(i => i.content),
        context: ctx.context
      }, null, 2),
      tokenEstimate: Math.ceil(JSON.stringify(ctx).length / 4),
      metadata: ctx.metadata
    };
  }
}

module.exports = { ContextFormatter };

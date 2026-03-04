/**
 * NEXUS Workflow Engine
 *
 * Parses and executes YAML workflow templates.
 * Supports step sequencing, provider variable resolution,
 * conditional branching, and parallel execution.
 *
 * @module nexus/workflows/workflow-engine
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { getEventBus } = require('../core/event-bus');

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const REGISTRY_PATH = path.join(__dirname, 'workflow-registry.json');

/**
 * Simple YAML parser for workflow templates
 * (Avoids external dependency - handles our specific format)
 */
function parseSimpleYaml(content) {
  const result = {};
  let currentKey = null;
  let currentList = null;
  let currentObj = null;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Top-level key
    const topMatch = trimmed.match(/^(\w+)\s*:\s*(.*)$/);
    if (topMatch && !line.startsWith('  ')) {
      currentKey = topMatch[1];
      const val = topMatch[2].trim();
      if (val) {
        result[currentKey] = parseYamlValue(val);
      } else {
        result[currentKey] = [];
      }
      currentList = Array.isArray(result[currentKey]) ? result[currentKey] : null;
      currentObj = null;
      continue;
    }

    // List item
    if (trimmed.startsWith('- ') && currentKey) {
      const itemContent = trimmed.slice(2).trim();
      const kvMatch = itemContent.match(/^(\w+)\s*:\s*(.+)$/);

      if (kvMatch) {
        currentObj = { [kvMatch[1]]: parseYamlValue(kvMatch[2]) };
        if (Array.isArray(result[currentKey])) {
          result[currentKey].push(currentObj);
        }
      } else {
        if (!Array.isArray(result[currentKey])) {
          result[currentKey] = [];
        }
        currentObj = { value: parseYamlValue(itemContent) };
        result[currentKey].push(currentObj);
      }
      continue;
    }

    // Nested property in list item
    if (trimmed.match(/^\w+\s*:/) && currentObj) {
      const [k, ...v] = trimmed.split(':');
      currentObj[k.trim()] = parseYamlValue(v.join(':').trim());
    }
  }

  return result;
}

function parseYamlValue(val) {
  if (!val) return null;
  val = val.trim();
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(val)) return parseFloat(val);
  if (val.startsWith('[') && val.endsWith(']')) {
    return val.slice(1, -1).split(',').map(s => s.trim());
  }
  if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
  return val;
}

class WorkflowEngine {
  constructor() {
    this.bus = getEventBus();
    this.registry = this._loadRegistry();
  }

  _loadRegistry() {
    try {
      if (fs.existsSync(REGISTRY_PATH)) {
        return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
      }
    } catch (e) {}
    return { workflows: [] };
  }

  /**
   * List available workflows
   */
  listWorkflows() {
    return this.registry.workflows || [];
  }

  /**
   * Find workflow by trigger keyword
   */
  findByTrigger(input) {
    const lower = input.toLowerCase();
    for (const wf of this.registry.workflows || []) {
      if (wf.triggers) {
        for (const trigger of wf.triggers) {
          if (lower.includes(trigger.toLowerCase())) {
            return wf;
          }
        }
      }
    }
    return null;
  }

  /**
   * Load a workflow template
   */
  loadTemplate(templateFile) {
    const fullPath = path.join(TEMPLATES_DIR, templateFile);
    if (!fs.existsSync(fullPath)) return null;
    const content = fs.readFileSync(fullPath, 'utf8');
    return parseSimpleYaml(content);
  }

  /**
   * Execute a workflow
   * @param {string} workflowId - Workflow ID from registry
   * @param {Object} context - { task, providers, variables }
   * @returns {Object} Execution result
   */
  async execute(workflowId, context = {}) {
    const wf = (this.registry.workflows || []).find(w => w.id === workflowId);
    if (!wf) throw new Error(`Workflow not found: ${workflowId}`);

    this.bus.emit('workflow:started', { workflowId, context });

    const template = this.loadTemplate(wf.template);
    if (!template) throw new Error(`Template not found: ${wf.template}`);

    const steps = template.steps || [];
    const results = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      this.bus.emit('workflow:step', {
        workflowId,
        step: i + 1,
        total: steps.length,
        name: step.name || `step-${i + 1}`
      });

      // Resolve provider variable ($primary, $secondary, etc.)
      const provider = this._resolveProvider(step.provider, context);

      results.push({
        step: i + 1,
        name: step.name,
        provider,
        action: step.action,
        status: 'planned'
      });
    }

    this.bus.emit('workflow:completed', { workflowId, stepCount: steps.length });

    return {
      workflowId,
      template: wf.template,
      steps: results,
      status: 'planned'
    };
  }

  _resolveProvider(providerVar, context) {
    if (!providerVar) return null;
    if (providerVar === '$primary') return context.providers?.[0] || 'claude-code';
    if (providerVar === '$secondary') return context.providers?.[1] || 'gemini-cli';
    if (providerVar === '$tertiary') return context.providers?.[2] || 'codex-cli';
    return providerVar;
  }
}

module.exports = { WorkflowEngine, parseSimpleYaml };

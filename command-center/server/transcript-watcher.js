/**
 * Transcript Watcher
 *
 * Watches Claude Code JSONL transcript files for real-time events.
 * Parses tool_use, text_output, errors, and sub-agent events.
 *
 * Paths watched:
 *   - K:/PortableApps/genai/projects/K--PortableApps-genai/*.jsonl
 *   - ~/.claude/projects/[project]/*.jsonl (fallback)
 */

const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const os = require('os');

class TranscriptWatcher {
  constructor(stateMachine, broadcaster, db, router) {
    this.stateMachine = stateMachine;
    this.broadcaster = broadcaster;
    this.db = db;
    this.router = router; // AutonomousRouter for F architecture
    this.watchers = [];
    this.fileOffsets = new Map(); // path -> bytes read
    this.activeAgentFiles = new Map(); // agentId -> filePath (multi-agent tracking)
    this.verbose = process.env.VERBOSE === '1';
  }

  start() {
    const watchPaths = this._getWatchPaths();

    for (const watchPath of watchPaths) {
      if (this.verbose) console.log(`[Watcher] Watching: ${watchPath}`);

      const watcher = chokidar.watch(watchPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
        usePolling: false
      });

      watcher.on('add', (filePath) => this._onNewFile(filePath));
      watcher.on('change', (filePath) => this._onFileChange(filePath));
      watcher.on('error', (err) => console.error('[Watcher] Error:', err.message));

      this.watchers.push(watcher);
    }

    console.log(`[Watcher] Started watching ${watchPaths.length} path(s)`);
  }

  stop() {
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];
    this.fileOffsets.clear();
    console.log('[Watcher] Stopped');
  }

  _getWatchPaths() {
    const paths = [];

    // Primary: K-drive project transcripts
    const kDrivePath = 'K:/PortableApps/genai/projects/K--PortableApps-genai';
    if (fs.existsSync(kDrivePath)) {
      paths.push(path.join(kDrivePath, '*.jsonl'));
    }

    // Secondary: home directory Claude projects
    const homePath = path.join(os.homedir(), '.claude', 'projects');
    if (fs.existsSync(homePath)) {
      paths.push(path.join(homePath, '*', '*.jsonl'));
    }

    if (paths.length === 0) {
      console.warn('[Watcher] No transcript paths found');
    }

    return paths;
  }

  _onNewFile(filePath) {
    if (!filePath.endsWith('.jsonl')) return;
    if (this.verbose) console.log(`[Watcher] New transcript: ${path.basename(filePath)}`);
    this.fileOffsets.set(filePath, 0);

    // Detect new session
    this.stateMachine.processEvent({
      type: 'user_input',
      agentId: 'main',
      source: 'transcript'
    });

    this.db.recordEvent('transcript_new', 'watcher', { file: path.basename(filePath) });
  }

  _onFileChange(filePath) {
    if (!filePath.endsWith('.jsonl')) return;

    const offset = this.fileOffsets.get(filePath) || 0;
    let stats;
    try {
      stats = fs.statSync(filePath);
    } catch {
      return;
    }

    if (stats.size <= offset) return;

    // Read only new bytes
    const fd = fs.openSync(filePath, 'r');
    const newBytes = stats.size - offset;
    const buffer = Buffer.alloc(newBytes);
    fs.readSync(fd, buffer, 0, newBytes, offset);
    fs.closeSync(fd);

    this.fileOffsets.set(filePath, stats.size);

    // Parse new lines
    const text = buffer.toString('utf8');
    const lines = text.split('\n').filter(l => l.trim());

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        this._processEntry(entry);
      } catch {
        // Skip malformed lines
      }
    }
  }

  _processEntry(entry) {
    // Claude Code JSONL format has various message types
    const event = this._mapToEvent(entry);
    if (!event) return;

    this.stateMachine.processEvent(event);
    this.broadcaster.broadcast('transcript_event', event);

    // F Architecture: Feed tool events to Autonomous Router
    if (this.router && event.type === 'tool_use' && event.toolName) {
      // Detect intent from recent context and record outcome
      const intent = this._inferIntentFromTool(event.toolName);
      if (intent) {
        event._inferredIntent = intent;
      }
    }
    if (this.router && event.type === 'tool_result') {
      // Record outcome for learning
      const lastTool = this.stateMachine.getLastTool(event.agentId);
      if (lastTool && lastTool._inferredIntent) {
        this.router.recordOutcome(lastTool.toolName, lastTool._inferredIntent, !event.error, null);

        // Check for proactive hint
        const hint = this.router.getProactiveHint(lastTool.toolName, lastTool._inferredIntent);
        if (hint) {
          this.broadcaster.broadcast('routing_hint', hint);
          if (this.verbose) console.log(`[Router] Hint: ${hint.suggestion}`);
        }
      }
    }

    // Track multi-agent transcripts
    if (event.type === 'agent_spawn' && event.subAgentId) {
      this.activeAgentFiles.set(event.subAgentId, null); // will be detected on next file add
    }

    if (this.verbose) {
      console.log(`[Watcher] Event: ${event.type}${event.toolName ? ' (' + event.toolName + ')' : ''}`);
    }
  }

  _inferIntentFromTool(toolName) {
    const toolIntentMap = {
      'Read': 'file_operation', 'Write': 'file_operation', 'Edit': 'file_operation',
      'Glob': 'code_search', 'Grep': 'code_search',
      'Bash': 'shell', 'Agent': 'orchestration',
      'WebSearch': 'web_search', 'WebFetch': 'web_scrape',
    };
    // Check MCP tool prefixes
    if (toolName.startsWith('mcp__firecrawl')) return 'web_scrape';
    if (toolName.startsWith('mcp__one-search')) return 'web_search';
    if (toolName.startsWith('mcp__desktop-commander')) return 'file_operation';
    if (toolName.startsWith('mcp__serena')) return 'code_search';
    if (toolName.startsWith('mcp__github')) return 'git_operation';
    if (toolName.startsWith('mcp__deep-research')) return 'research';
    if (toolName.startsWith('mcp__paper-search')) return 'research';
    if (toolName.startsWith('mcp__sequential-thinking')) return 'architecture';
    if (toolName.startsWith('mcp__image')) return 'image_processing';
    if (toolName.startsWith('mcp__ocr') || toolName.startsWith('mcp__marker')) return 'document';
    if (toolName.startsWith('mcp__antv')) return 'visualization';
    if (toolName.startsWith('mcp__n8n')) return 'deployment';
    if (toolName.startsWith('mcp__sqlite') || toolName.startsWith('mcp__supabase')) return 'database';
    return toolIntentMap[toolName] || null;
  }

  _mapToEvent(entry) {
    // Handle assistant messages with tool_use
    if (entry.type === 'assistant' && entry.message) {
      const content = entry.message.content;
      if (!Array.isArray(content)) return null;

      for (const block of content) {
        if (block.type === 'tool_use') {
          return {
            type: 'tool_use',
            agentId: entry.agentId || 'main',
            toolName: block.name,
            toolId: block.id,
            command: block.input?.command,
            filePath: block.input?.file_path || block.input?.path,
            timestamp: Date.now()
          };
        }
        if (block.type === 'text' && block.text) {
          return {
            type: 'text_output',
            agentId: entry.agentId || 'main',
            textLength: block.text.length,
            timestamp: Date.now()
          };
        }
      }
      return null;
    }

    // Handle tool results
    if (entry.type === 'tool_result' || entry.type === 'result') {
      return {
        type: 'tool_result',
        agentId: entry.agentId || 'main',
        toolId: entry.tool_use_id,
        error: entry.is_error || false,
        timestamp: Date.now()
      };
    }

    // Handle human/user messages
    if (entry.type === 'human' || entry.type === 'user') {
      return {
        type: 'user_input',
        agentId: 'main',
        timestamp: Date.now()
      };
    }

    // Handle sub-agent events
    if (entry.type === 'agent_spawn' || entry.subType === 'agent_spawn') {
      return {
        type: 'agent_spawn',
        agentId: entry.agentId || 'main',
        subAgentId: entry.subAgentId,
        subAgentType: entry.subAgentType,
        timestamp: Date.now()
      };
    }

    if (entry.type === 'agent_complete' || entry.subType === 'agent_complete') {
      return {
        type: 'agent_complete',
        agentId: entry.agentId || 'main',
        subAgentId: entry.subAgentId,
        timestamp: Date.now()
      };
    }

    return null;
  }
}

module.exports = { TranscriptWatcher };

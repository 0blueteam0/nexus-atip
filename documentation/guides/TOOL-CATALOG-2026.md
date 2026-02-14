# MCP Server Tool Catalog 2026

> **Last Updated**: 2026-02-04
> **Total MCP Servers**: 38개
> **Version**: 1.0.0

---

## Quick Reference

| Category | Count | Primary Use |
|----------|-------|-------------|
| File/Code | 6 | File I/O, Code Editing |
| Web Crawling | 6 | Web Scraping, Search |
| Research | 4 | Academic, Deep Research |
| AI/LLM | 5 | Multi-model Integration |
| Database | 2 | SQLite, Supabase |
| Memory | 2 | Context, Session |
| Task Management | 3 | Tasks, Kanban |
| Media | 5 | Image, OCR, PDF |
| Automation | 3 | Browser, n8n |
| YouTube | 1 | Video Analysis |
| Installation | 1 | MCP Server Install |
| Other | 1 | Sequential Thinking |

---

## 1. File/Code Operations (6)

### 1.1 desktop-commander
**Type**: Node.js Direct | **Docker**: No

| Tool | Description |
|------|-------------|
| `read_file` | Read file contents (offset/length support) |
| `write_file` | Write file (30-line chunk rule) |
| `edit_block` | Precise editing (old_string -> new_string) |
| `list_directory` | Directory listing |
| `search_files` | File name search |
| `search_code` | Code content search (ripgrep) |
| `get_file_info` | File metadata |
| `start_process` | Start background process |
| `list_processes` | List running processes |

**Usage Example**:
```
[Action] mcp__desktop-commander__read_file
[Purpose] Read file content
[Parameters] path: "K:/path/to/file.txt"
```

**Priority**: P1 (Primary tool for all file operations)

---

### 1.2 edit-file-lines
**Type**: Node.js Direct | **Docker**: No

| Tool | Description |
|------|-------------|
| `edit_file_lines` | Line-based precise editing |
| `get_file_lines` | Get specific lines with context |
| `search_file` | Search pattern in file |
| `approve_edit` | Apply after dryRun |

**Usage Example**:
```
[Action] mcp__edit-file-lines__edit_file_lines
[Purpose] Precise multi-line editing when desktop-commander fails
[Parameters] file_path, start_line, end_line, new_content
```

**Priority**: P2 (Fallback when DC edit_block fails)

---

### 1.3 filesystem
**Type**: Node.js Direct | **Docker**: No

| Tool | Description |
|------|-------------|
| `read_file` | Read single file |
| `read_multiple_files` | Read multiple files |
| `write_file` | Write file |
| `create_directory` | Create directory |
| `list_directory` | List directory |
| `move_file` | Move/rename file |
| `search_files` | Search files |

**Priority**: P4 (Fallback only)

---

### 1.4 git-mcp
**Type**: Node.js Direct | **Docker**: No

| Tool | Description |
|------|-------------|
| `git_status` | Repository status |
| `git_diff` | Show changes |
| `git_log` | Commit history |
| `git_add` | Stage changes |
| `git_commit` | Create commit |
| `git_push` | Push to remote |
| `git_pull` | Pull from remote |
| `git_branch` | Branch operations |
| `git_checkout` | Switch branches |
| `git_merge` | Merge branches |
| `git_stash` | Stash changes |
| `git_reset` | Reset changes |

**Usage Example**:
```
[Action] mcp__git-mcp__git_status
[Purpose] Check repository status
```

---

### 1.5 github
**Type**: NPX | **Docker**: No

| Tool | Description |
|------|-------------|
| `create_repository` | Create new repo |
| `get_file_contents` | Get file from repo |
| `push_files` | Push files to repo |
| `create_issue` | Create issue |
| `create_pull_request` | Create PR |
| `list_commits` | List commits |
| `list_issues` | List issues |
| `search_code` | Search code in GitHub |

**Requires**: `GITHUB_TOKEN` environment variable

---

### 1.6 serena
**Type**: Python (uvx) | **Docker**: No

| Tool | Description |
|------|-------------|
| `read_file` | Read file |
| `create_text_file` | Create text file |
| `list_dir` | List directory |
| `find_file` | Find file |
| `replace_content` | Replace content |
| `search_for_pattern` | Search pattern |
| `get_symbols_overview` | Code symbols overview |
| `find_symbol` | Find symbol definition |
| `rename_symbol` | Rename symbol |

**Note**: Advanced code intelligence features

---

## 2. Web Crawling (6)

### 2.1 firecrawl
**Type**: NPX | **Docker**: Yes (Self-hosted)

| Tool | Description |
|------|-------------|
| `firecrawl_scrape` | Scrape single URL |
| `firecrawl_map` | Map website structure |
| `firecrawl_search` | Search with crawling |
| `firecrawl_crawl` | Crawl multiple pages |
| `firecrawl_extract` | Extract structured data |

**Usage Example**:
```
[Action] mcp__firecrawl__firecrawl_search
[Purpose] Search and crawl for specific content
[Parameters] query: "MCP server tutorial", limit: 10
```

**Requires**: Docker running (Self-hosted at localhost:3002)

---

### 2.2 one-search
**Type**: NPX | **Docker**: No

| Tool | Description |
|------|-------------|
| `one_search` | Google custom search |
| `one_extract` | Extract from URL |
| `one_scrape` | Scrape URL content |
| `one_map` | Map website structure |

**Requires**: `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`

---

### 2.3 searxng-crawl4ai
**Type**: Docker | **Docker**: Yes (Required)

| Tool | Description |
|------|-------------|
| `one_search` | Meta search engine |
| `one_scrape` | AI-powered scraping |

**Note**: Self-hosted SearXNG + Crawl4AI integration
**Container**: `searxng-crawl4ai-mcp-mcp-server-1`

---

### 2.4 crawl4ai-lite
**Type**: NPX | **Docker**: No

| Tool | Description |
|------|-------------|
| `crawl4ai_scrape` | Basic web scraping |

**Note**: Fallback when Docker unavailable

---

### 2.5 scrapegraph-local
**Type**: Python | **Docker**: No

| Tool | Description |
|------|-------------|
| (Custom scraping tools) | Ollama-based local scraping |

**Requires**: Ollama running with llama3.2 model

---

### 2.6 websearch
**Type**: NPX | **Docker**: No

| Tool | Description |
|------|-------------|
| `web_search` | Tavily web search |

**Requires**: `TAVILY_API_KEY`

---

## 3. Research (4)

### 3.1 deep-research-mcp
**Type**: Node.js Direct | **Docker**: No

| Tool | Description |
|------|-------------|
| `deep_research` | Comprehensive research |
| `quick_research` | Fast research |
| `research_status` | Check research status |

**Usage Example**:
```
[Action] mcp__deep-research-mcp__deep_research
[Purpose] Conduct in-depth research on topic
[Parameters] topic: "AI security trends 2026"
```

---

### 3.2 paper-search-mcp
**Type**: Python (uv) | **Docker**: No

| Tool | Description |
|------|-------------|
| `search_arxiv` | Search arXiv papers |
| `search_pubmed` | Search PubMed |
| `search_biorxiv` | Search bioRxiv |
| `search_medrxiv` | Search medRxiv |
| `search_google_scholar` | Search Google Scholar |
| `search_semantic` | Semantic Scholar search |
| `download_arxiv` | Download arXiv paper |
| `read_arxiv_paper` | Read paper content |

**Best For**: Academic research, citation verification

---

### 3.3 context7
**Type**: NPX | **Docker**: No

| Tool | Description |
|------|-------------|
| `resolve-library-id` | Resolve library identifier |
| `query-docs` | Query documentation |

**Best For**: Library documentation lookup

---

### 3.4 hfspace
**Type**: NPX | **Docker**: No

| Tool | Description |
|------|-------------|
| `available-files` | List available files |
| `search-spaces` | Search HF Spaces |
| `FLUX_1-schnell-infer` | Image generation |

**Requires**: `HF_TOKEN`
**Pre-configured Spaces**: FLUX.1-schnell, Qwen2.5-72B-Instruct

---

## 4. AI/LLM Integration (5)

### 4.1 multi-ai-orchestration
**Type**: Node.js Direct | **Docker**: No

| Tool | Description |
|------|-------------|
| `query_gemini` | Query Google Gemini |
| `deliberate` | Multi-model deliberation |
| `dispatch_crawl` | Crawl dispatcher |
| `generate_image` | Image generation |
| `generate_diagram` | Diagram generation |
| `research` | AI research |
| `verify` | Verification |
| `get_system_status` | System status |

**Best For**: Multi-model comparison, consensus building

---

### 4.2 llm-council
**Type**: Python | **Docker**: No

| Tool | Description |
|------|-------------|
| `council_ask` | Ask multiple LLMs |
| `council_quick` | Quick council query |
| `council_config` | Configure council |

**Requires**: `OPENROUTER_API_KEY`
**Best For**: Getting consensus from multiple AI models

---

### 4.3 zen-mcp
**Type**: Python | **Docker**: No

| Tool | Description |
|------|-------------|
| (Custom AI tools) | OpenRouter-based AI integration |

**Requires**: `OPENROUTER_API_KEY`

---

### 4.4 task-master-ai
**Type**: NPX | **Docker**: No

| Tool | Description |
|------|-------------|
| `get_tasks` | Get task list |
| `next_task` | Get next task |
| `get_task` | Get specific task |
| `set_task_status` | Update task status |
| `update_subtask` | Update subtask |
| `parse_prd` | Parse PRD document |
| `expand_task` | Expand task details |

**Requires**: `ANTHROPIC_API_KEY`

---

### 4.5 runpod-jupyter
**Type**: Python (uvx) | **Docker**: No

| Tool | Description |
|------|-------------|
| `list_files` | List Jupyter files |
| `list_kernels` | List available kernels |
| `use_notebook` | Use specific notebook |
| `read_notebook` | Read notebook content |
| `insert_cell` | Insert cell |
| `execute_cell` | Execute cell |
| `execute_code` | Execute code directly |
| `connect_to_jupyter` | Connect to Jupyter server |

**Requires**: `RUNPOD_JUPYTER_TOKEN`
**Best For**: Remote GPU computing, ML workloads

---

## 5. Database (2)

### 5.1 sqlite-mcp
**Type**: NPX | **Docker**: No

| Tool | Description |
|------|-------------|
| `read_query` | Execute SELECT query |
| `write_query` | Execute INSERT/UPDATE/DELETE |
| `create_table` | Create table |
| `list_tables` | List all tables |
| `describe_table` | Describe table schema |

**Database Path**: `K:/PortableApps/genai/data/sqlite/claude.db`

---

### 5.2 supabase
**Type**: NPX | **Docker**: No

| Tool | Description |
|------|-------------|
| `search_docs` | Search Supabase docs |
| `list_tables` | List database tables |
| `list_extensions` | List extensions |
| `list_migrations` | List migrations |
| `apply_migration` | Apply migration |
| `execute_sql` | Execute SQL |
| `get_logs` | Get logs |
| `deploy_edge_function` | Deploy edge function |

**Requires**: `SUPABASE_ACCESS_TOKEN`
**Mode**: Read-only by default

---

## 6. Memory/Context (2)

### 6.1 memory
**Type**: Node.js Direct | **Docker**: No

| Tool | Description |
|------|-------------|
| `create_entities` | Create memory entities |
| `create_relations` | Create entity relations |
| `add_observations` | Add observations |
| `delete_entities` | Delete entities |
| `read_graph` | Read memory graph |
| `search_nodes` | Search memory nodes |
| `open_nodes` | Open specific nodes |

**Best For**: Knowledge graph, entity tracking

---

### 6.2 kiro-memory
**Type**: Python | **Docker**: No

| Tool | Description |
|------|-------------|
| `health_check` | System health check |
| `get_memory_context` | Get memory context |
| `create_task` | Create task |
| `get_tasks` | Get tasks |
| `update_task_status` | Update task status |
| `start_thinking_chain` | Start thinking chain |
| `add_thinking_step` | Add thinking step |
| `get_thinking_chain` | Get thinking chain |
| `create_context_summary` | Create context summary |
| `start_new_chat_session` | Start new session |
| `auto_process_conversation` | Auto process |
| `auto_learn_project_conventions` | Learn conventions |

**Database**: SQLite at `K:/PortableApps/genai/data/kiro-memory/mcp_memory.db`
**Best For**: Session continuity, project conventions

---

## 7. Task Management (3)

### 7.1 shrimp-task
**Type**: Node.js Direct | **Docker**: No

| Tool | Description |
|------|-------------|
| `plan_task` | Plan new task |
| `analyze_task` | Analyze task |
| `reflect_task` | Reflect on task |
| `split_tasks` | Split into subtasks |
| `list_tasks` | List all tasks |
| `execute_task` | Execute task |
| `verify_task` | Verify task completion |
| `delete_task` | Delete task |
| `update_task` | Update task |
| `query_task` | Query task |
| `get_task_detail` | Get task details |
| `process_thought` | Process thought |

**Data Path**: `K:/PortableApps/genai/ShrimpData`
**Language**: Korean/English (ko, en)
**Priority**: P3 (Primary task management tool)

**Usage Example**:
```
[Action] mcp__shrimp-task__plan_task
[Purpose] Create new task plan
[Parameters] description: "Implement feature X", priority: "high"
```

---

### 7.2 vibekanban
**Type**: Python | **Docker**: No

| Tool | Description |
|------|-------------|
| `get_project_id_by_name` | Get project ID |
| `get_kanban_status` | Get kanban board status |
| `create_ticket` | Create ticket |
| `update_ticket_state` | Update ticket state |
| `list_projects` | List projects |
| `list_tickets` | List tickets |
| `add_comment` | Add comment to ticket |

**Best For**: Visual kanban board, Shrimp complement

---

### 7.3 task-master-ai
**Type**: NPX | **Docker**: No

(See Section 4.4 AI/LLM Integration)

---

## 8. Media Processing (5)

### 8.1 image-recognition
**Type**: Python | **Docker**: No

| Tool | Description |
|------|-------------|
| `describe_image` | Describe image from URL |
| `describe_image_from_file` | Describe image from file |

**Provider**: Anthropic Vision API
**Features**: OCR enabled (Tesseract)
**Best For**: Image analysis, screenshot understanding

---

### 8.2 paddleocr-mcp
**Type**: Python | **Docker**: No

| Tool | Description |
|------|-------------|
| `ocr_image` | Extract text from image |
| `extract_table` | Extract table from image |
| `detect_language` | Detect text language |

**Best For**: High-accuracy OCR, table extraction

---

### 8.3 marker-mcp
**Type**: Python | **Docker**: No

| Tool | Description |
|------|-------------|
| `convert_pdf` | Convert PDF to markdown |
| `extract_text` | Extract text from PDF |
| `analyze_structure` | Analyze PDF structure |

**Best For**: PDF to markdown conversion

---

### 8.4 antv-chart
**Type**: NPX | **Docker**: No

| Tool | Description |
|------|-------------|
| `generate_area_chart` | Area chart |
| `generate_bar_chart` | Bar chart |
| `generate_line_chart` | Line chart |
| `generate_pie_chart` | Pie chart |
| `generate_scatter_chart` | Scatter chart |
| `generate_funnel_chart` | Funnel chart |
| `generate_radar_chart` | Radar chart |
| `generate_sankey_chart` | Sankey diagram |
| `generate_treemap_chart` | Treemap |
| `generate_word_cloud_chart` | Word cloud |
| `generate_mind_map` | Mind map |
| `generate_network_graph` | Network graph |
| `generate_flow_diagram` | Flow diagram |
| `generate_organization_chart` | Org chart |

**Best For**: Data visualization, diagrams

---

### 8.5 youtube-data
**Type**: NPX | **Docker**: No

| Tool | Description |
|------|-------------|
| `getVideoDetails` | Get video details |
| `searchVideos` | Search videos |
| `getTranscripts` | Get video transcripts |
| `getRelatedVideos` | Get related videos |
| `getChannelStatistics` | Channel stats |
| `getChannelTopVideos` | Top videos |
| `getVideoEngagementRatio` | Engagement ratio |
| `getTrendingVideos` | Trending videos |
| `compareVideos` | Compare videos |

**Requires**: `YOUTUBE_API_KEY`

---

## 9. Automation (3)

### 9.1 playwright
**Type**: NPX | **Docker**: No

| Tool | Description |
|------|-------------|
| `playwright_navigate` | Navigate to URL |
| `playwright_screenshot` | Take screenshot |
| `playwright_click` | Click element |
| `playwright_fill` | Fill input |
| `playwright_select` | Select option |
| `playwright_hover` | Hover element |
| `playwright_evaluate` | Execute JavaScript |
| `playwright_get_visible_text` | Get visible text |
| `playwright_get_visible_html` | Get visible HTML |
| `playwright_go_back` | Go back |
| `playwright_press_key` | Press key |
| `playwright_save_as_pdf` | Save as PDF |
| `start_codegen_session` | Start code generation |

**Best For**: Browser automation, testing, screenshots

**Usage Example**:
```
[Action] mcp__playwright__playwright_navigate
[Purpose] Open webpage
[Parameters] url: "https://example.com", width: 2560, height: 1330
```

---

### 9.2 n8n
**Type**: Node.js Direct | **Docker**: No

| Tool | Description |
|------|-------------|
| `init-n8n` | Initialize n8n |
| `list-workflows` | List workflows |
| `get-workflow` | Get workflow |
| `create-workflow` | Create workflow |
| `update-workflow` | Update workflow |
| `activate-workflow` | Activate workflow |
| `deactivate-workflow` | Deactivate workflow |
| `list-executions` | List executions |
| `create-credential` | Create credential |

**Requires**: `N8N_API_KEY`, `N8N_HOST`
**Best For**: Workflow automation, integration

---

### 9.3 sequential-thinking
**Type**: Node.js Direct | **Docker**: No

| Tool | Description |
|------|-------------|
| `sequentialthinking` | Sequential thought process |

**Best For**: Complex problem solving, step-by-step reasoning

---

## 10. Installation (1)

### 10.1 mcp-installer
**Type**: NPX | **Docker**: No

| Tool | Description |
|------|-------------|
| `install_repo_mcp_server` | Install MCP server from repo |
| `install_local_mcp_server` | Install local MCP server |

**Best For**: Adding new MCP servers dynamically

---

## Recommended Tool Combinations

### Web Research Workflow
```
1. one-search → Quick search
2. firecrawl → Deep scraping
3. deep-research-mcp → Comprehensive analysis
4. sequential-thinking → Structured reasoning
```

### Academic Research Workflow
```
1. paper-search-mcp → Find papers
2. firecrawl → Scrape sources
3. marker-mcp → Convert PDFs
4. kiro-memory → Store findings
```

### Code Development Workflow
```
1. desktop-commander → File operations (P1)
2. edit-file-lines → Precise editing (P2)
3. git-mcp → Version control
4. shrimp-task → Task tracking
```

### Image/Document Processing Workflow
```
1. image-recognition → Understand images
2. paddleocr-mcp → Extract text/tables
3. marker-mcp → Convert PDFs
4. antv-chart → Generate visualizations
```

### Multi-AI Decision Workflow
```
1. multi-ai-orchestration → Query multiple models
2. llm-council → Get consensus
3. sequential-thinking → Structured analysis
4. kiro-memory → Store decisions
```

### Automation Workflow
```
1. playwright → Browser automation
2. n8n → Workflow orchestration
3. shrimp-task → Task management
4. kiro-memory → Session persistence
```

---

## Docker Requirements Summary

| Server | Docker | Container Name |
|--------|--------|----------------|
| firecrawl | Yes | localhost:3002 |
| searxng-crawl4ai | Yes | searxng-crawl4ai-mcp-mcp-server-1 |
| All others | No | - |

**Docker Start Command**:
```powershell
# Start Firecrawl
cd K:/PortableApps/genai/mcp-servers/firecrawl-self-hosted
docker compose up -d

# Start SearXNG + Crawl4AI
cd K:/PortableApps/genai/mcp-servers/searxng-crawl4ai-mcp
docker compose up -d
```

---

## Environment Variables Required

| Server | Variable | Description |
|--------|----------|-------------|
| github | `GITHUB_TOKEN` | GitHub API token |
| firecrawl | `FIRECRAWL_API_KEY` | Firecrawl API key |
| websearch | `TAVILY_API_KEY` | Tavily API key |
| youtube-data | `YOUTUBE_API_KEY` | YouTube API key |
| supabase | `SUPABASE_ACCESS_TOKEN` | Supabase token |
| n8n | `N8N_API_KEY`, `N8N_HOST` | n8n credentials |
| one-search | `GOOGLE_SEARCH_API_KEY` | Google API key |
| hfspace | `HF_TOKEN` | Hugging Face token |
| task-master-ai | `ANTHROPIC_API_KEY` | Anthropic API key |
| zen-mcp, llm-council | `OPENROUTER_API_KEY` | OpenRouter key |
| runpod-jupyter | `RUNPOD_JUPYTER_TOKEN` | Jupyter token |

---

## Tool Priority Matrix

### P1 - Primary (Always Use First)
| Tool | Category | Reason |
|------|----------|--------|
| desktop-commander | File/Code | 90% file operation coverage |
| shrimp-task | Task | Primary task management |
| firecrawl | Web | Best scraping quality |
| sequential-thinking | Reasoning | Structured thinking |

### P2 - Secondary (When P1 Fails)
| Tool | Category | Fallback For |
|------|----------|--------------|
| edit-file-lines | File/Code | desktop-commander edit_block |
| one-search | Web | firecrawl (no Docker) |
| kiro-memory | Memory | memory (advanced features) |

### P3 - Specialized (Specific Use Cases)
| Tool | Category | Use Case |
|------|----------|----------|
| paper-search-mcp | Research | Academic papers |
| paddleocr-mcp | Media | Korean OCR |
| playwright | Automation | Browser testing |
| vibekanban | Task | Visual boards |

### P4 - Fallback (Last Resort)
| Tool | Category | Use When |
|------|----------|----------|
| filesystem | File | All MCP file tools fail |
| crawl4ai-lite | Web | Docker unavailable |
| websearch | Web | Other search fails |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-04 | Initial catalog with 38 MCP servers |

---

**Document Author**: Claude Opus 4.5
**Configuration Source**: `.claude.json`
**Reference Plans**: `concurrent-exploring-locket.md`, `lucky-splashing-thompson.md`

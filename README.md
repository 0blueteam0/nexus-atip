# Nexus ATIP - Claude Code Portable Environment

Advanced Threat Intelligence Platform with Claude Code integration for Windows portable environment.

## Overview

This repository contains a fully portable development environment for Claude Code on Windows, designed to run entirely from an external drive (K:\ drive) with zero C-drive dependencies.

## Features

### Core System
- **Portable Environment**: Complete development environment on external SSD
- **Claude Code Integration**: Windows Native version with MCP server support
- **Self-Evolution System**: Autonomous learning and optimization
- **Memory Management**: Multiple memory systems (kiro-memory, Shrimp Task Manager)

### MCP Servers Integrated
- Desktop Commander (File operations)
- Shrimp Task Manager (Task management) 
- Kiro Memory (Persistent memory)
- Context7 (Documentation retrieval)
- Firecrawl (Web scraping)
- GitHub (Repository management)
- Git MCP (Version control)
- Filesystem (File operations)
- Web Search (Internet search)
- Edit File Lines (Precise file editing)
- YouTube Data (Video analytics)
- Supabase (Database operations)
- N8N (Workflow automation)
- Slack (Team communication)
- Perplexity (AI search)
- Playwright (Browser automation)

### Development Tools
- **Node.js**: K:\PortableApps\tools\nodejs\
- **Python**: K:\PortableApps\tools\python\
- **Git**: Integrated version control
- **Vite**: Modern build tool setup

## Project Structure

```
K:\PortableApps\Claude-Code\
├── mcp-servers/        # MCP server implementations
├── systems/            # Automation and monitoring systems
├── documentation/      # Guides and modules
├── ShrimpData/        # Task manager data
├── tools/             # Portable development tools
├── backups/           # Automatic backup system
└── CLAUDE.md          # Core instructions and philosophy
```

## Key Components

### 1. Bottom-up Proactive Paradigm
- Autonomous decision-making system
- Self-improvement capabilities
- Proactive problem detection and resolution

### 2. Memory Systems
- **Kiro Memory**: SQLite-based persistent memory
- **Shrimp Task Manager**: Advanced task tracking
- **Auto-backup System**: Continuous data protection

### 3. Automation Systems
- `AUTO-EXECUTOR`: Main autonomous system
- `AUTO-STARTUP`: Windows boot automation
- `AUTO-HEALING`: Error recovery system
- `MCP Output Minimizer`: Terminal optimization

## Setup Instructions

### Prerequisites
- Windows 10/11
- External drive (minimum 32GB recommended)
- Internet connection for initial setup

### Installation

1. Clone this repository to your external drive:
```bash
git clone https://github.com/0blueteam0/nexus-atip.git K:\PortableApps\Claude-Code
```

2. Navigate to the directory:
```bash
cd K:\PortableApps\Claude-Code
```

3. Run the setup:
```bash
./claude.bat --version
```

### Configuration

1. **API Keys**: Create a `.env` file with your API keys (template provided in `.env.example`)

2. **MCP Servers**: Configure MCP servers in `.claude.json`

3. **Auto-startup** (Optional):
```bash
./INSTALL-AUTO-STARTUP.bat
```

## Usage

### Basic Commands
```bash
# Start Claude Code
./claude.bat

# List MCP servers
./claude.bat mcp list

# Debug mode
./claude.bat --debug

# View Shrimp tasks
./shrimp-view.bat
```

### Task Management
The system uses Shrimp Task Manager for advanced task tracking:
- Automatic task decomposition
- Progress tracking
- Dependency management
- Verification system

### Memory Operations
Kiro Memory provides persistent storage:
- Session management
- Context preservation
- Auto-save functionality
- Cross-session continuity

## Security Notes

- All API keys are stored locally in `.env` files
- Sensitive files are excluded via `.gitignore`
- No credentials are committed to the repository
- Backup system maintains data integrity

## Contributing

This is a private development environment. For collaboration requests, please contact the repository owner.

## Architecture

The system follows a modular architecture:
- **Core Layer**: CLAUDE.md instructions
- **Service Layer**: MCP servers
- **Automation Layer**: System scripts
- **Storage Layer**: Memory and backup systems
- **Interface Layer**: CLI and hooks

## Performance Optimizations

- Terminal output minimization
- VSCode buffer optimization
- Chunked file operations
- Lazy loading of modules
- Efficient memory management

## Troubleshooting

Common issues and solutions:
- **Terminal freeze**: Run `./fix-terminal-freeze.bat`
- **MCP errors**: Check `./claude.bat doctor`
- **Path issues**: Verify K:\ drive mounting
- **Memory issues**: Run cleanup scripts

## License

Private repository - All rights reserved.

## Contact

Repository: https://github.com/0blueteam0/nexus-atip

---

*Built with Claude Code - Portable Development Environment*
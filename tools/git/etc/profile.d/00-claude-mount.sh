#!/bin/bash
# Claude Code mount configuration
ln -sf /cygdrive/k /k 2>/dev/null
export CLAUDE_HOME="/k/PortableApps/Claude-Code"
export PATH="/k/PortableApps/Claude-Code/tools/nodejs:/k/PortableApps/Claude-Code/tools/git/bin:$PATH"
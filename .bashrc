#!/bin/bash
# Bash configuration for Claude Code
# Auto-detect drive letter (K: home, J: external)

# Detect which drive we're on
if [ -d "/j/PortableApps/genai" ] && [ "$CLAUDE_HOME" = "J:\\PortableApps\\genai" -o "$CLAUDE_HOME" = "J:/PortableApps/genai" ]; then
    DRV_LETTER="k"
elif [ -d "/j/PortableApps/genai" ] && [ "$CLAUDE_HOME" = "J:\\PortableApps\\genai" -o "$CLAUDE_HOME" = "J:/PortableApps/genai" ]; then
    DRV_LETTER="j"
elif [ -d "/j/PortableApps/genai" ]; then
    DRV_LETTER="k"
elif [ -d "/j/PortableApps/genai" ]; then
    DRV_LETTER="j"
else
    DRV_LETTER="k"
fi

# Export paths (drive-agnostic)
export PATH="/${DRV_LETTER}/PortableApps/tools/nodejs/npm-global:/${DRV_LETTER}/PortableApps/tools/nodejs:/${DRV_LETTER}/PortableApps/tools/git/bin:$PATH"
export CLAUDE_HOME="/${DRV_LETTER}/PortableApps/genai"
export TEMP="/${DRV_LETTER}/PortableApps/genai/temp"
export TMP="/${DRV_LETTER}/PortableApps/genai/temp"

# Alias for drive
alias k:='cd /k'
alias j:='cd /j'

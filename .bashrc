#!/bin/bash
# Bash configuration for Claude Code

# Create /k mapping to K:
if [ ! -d "/k" ]; then
    # Try to create symlink
    ln -s /cygdrive/k /k 2>/dev/null || \
    ln -s /mnt/k /k 2>/dev/null || \
    ln -s K:/ /k 2>/dev/null
fi

# Export paths
export PATH="/k/PortableApps/tools/nodejs:/k/PortableApps/tools/git/bin:$PATH"
export CLAUDE_HOME="/k/PortableApps/Claude-Code"
export TEMP="/k/PortableApps/Claude-Code/temp"
export TMP="/k/PortableApps/Claude-Code/temp"

# Alias for K drive
alias k:='cd /k'
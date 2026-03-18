#!/bin/bash
# Ensure Observer is running + show startup recommendations
# Called from SessionStart hook. Non-blocking, fast.

OBSERVER_URL="http://localhost:3847"
NODE_EXE="K:/PortableApps/tools/nodejs/node.exe"
OBSERVER_DIR="K:/PortableApps/genai/command-center/server"

# Quick health check (1s timeout)
health=$(curl -s --max-time 1 "$OBSERVER_URL/health" 2>/dev/null)
if ! echo "$health" | grep -q '"status":"ok"'; then
    echo "[*] Starting Observer Server..."
    cd "$OBSERVER_DIR"
    "$NODE_EXE" index.js > /dev/null 2>&1 &
    sleep 2
    health=$(curl -s --max-time 1 "$OBSERVER_URL/health" 2>/dev/null)
    if echo "$health" | grep -q '"status":"ok"'; then
        echo "[+] Observer started"
    else
        echo "[-] Observer failed to start"
        exit 0
    fi
fi

# Startup recommendations (compact, no context bloat)
echo "[*] ========================================"
echo "[*] F Architecture - Session Ready"
echo "[*] ========================================"

# Show active alerts
alerts=$(curl -s --max-time 1 "$OBSERVER_URL/alerts" 2>/dev/null)
alert_count=$(echo "$alerts" | "$NODE_EXE" -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).length)}catch{console.log(0)}})" 2>/dev/null)
if [ "$alert_count" != "0" ] && [ -n "$alert_count" ]; then
    echo "[!] Active Alerts: $alert_count"
fi

# Show scheduler status
sched=$(curl -s --max-time 1 "$OBSERVER_URL/scheduler/status" 2>/dev/null)
echo "$sched" | "$NODE_EXE" -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log('[+] Scheduler: ticks='+j.tickCount+' lease='+j.hasLease)}catch{}})" 2>/dev/null

# Show tool inventory summary
echo "[*] Tools: 40 MCP | 132 agents | 31 SC commands | 9 Python pkgs"
echo "[*] Observer: $OBSERVER_URL (73 endpoints)"
echo "[*] Workflow: .claude/rules/workflow-protocol.md"
echo "[*] ========================================"

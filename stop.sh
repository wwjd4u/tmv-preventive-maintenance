#!/usr/bin/env bash
# Stop ONLY the TMV app (node server on :9240 + its Cloudflare tunnel).
# Deliberately leaves the Local Journal 'agent-dashboard' tunnel (port 9220) running.
set -e
cd "$(dirname "$0")"
echo "[stop] killing node api-server.js (TMV app :9240)..."
ps aux | grep "node api-server.js" | grep -v grep | awk '{print $2}' | xargs -r kill 2>/dev/null || true
echo "[stop] killing TMV tunnel (named tmv-app)..."
ps aux | grep "cloudflared tunnel --config ./tmv-app.yml" | grep -v grep | awk '{print $2}' | xargs -r kill 2>/dev/null || true
ps aux | grep "cloudflared tunnel --url http://localhost:9240" | grep -v grep | awk '{print $2}' | xargs -r kill 2>/dev/null || true
sleep 1
echo "[stop] done. TMV app stopped. Local Journal 'agent-dashboard' tunnel left running."

#!/usr/bin/env bash

# Permanent application bind settings
export PORT="${PORT:-9240}"
export HOST="${HOST:-0.0.0.0}"

# TMV App launcher: starts node server + Cloudflare quick tunnel, persists URL.
# Usage: ./launch.sh   (run from ~/preventive-maintenance-app)
set -e
cd "$(dirname "$0")"

PORT=9240

echo "[launch] starting node api-server.js on 0.0.0.0:${PORT} ..."
ps aux | grep "node api-server.js" | grep -v grep | awk '{print $2}' | xargs -r kill 2>/dev/null || true
sleep 1
nohup env PORT="$PORT" HOST="$HOST" node api-server.js > server.log 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > server.pid
echo "[launch] server pid $SERVER_PID"

for i in $(seq 1 20); do
  if curl -s -o /dev/null http://127.0.0.1:${PORT}/; then break; fi
  sleep 1
done
echo "[launch] server ready at http://localhost:${PORT}"

echo "[launch] starting Cloudflare NAMED tunnel 'tmv-app' (tmvapp.local-journal.com) ..."
ps aux | grep "cloudflared tunnel --url http://localhost:${PORT}" | grep -v grep | awk '{print $2}' | xargs -r kill 2>/dev/null || true
ps aux | grep "cloudflared tunnel --config ./tmv-app.yml" | grep -v grep | awk '{print $2}' | xargs -r kill 2>/dev/null || true
sleep 1
rm -f tunnel.log
nohup cloudflared tunnel --config "$(dirname "$0")/tmv-app.yml" run tmv-app > tunnel.log 2>&1 &
TUNNEL_PID=$!
echo "$TUNNEL_PID" > tunnel.pid
echo "[launch] tunnel pid $TUNNEL_PID"
sleep 8
URL="https://tmvapp.local-journal.com"
echo "$URL" > tunnel-url.txt
echo ""
echo "=============================="
echo "  Desktop:  $URL/"
echo "  Tester:   $URL/tech"
echo "  (saved to tunnel-url.txt)"
echo "=============================="

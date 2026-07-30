#!/usr/bin/env bash

# Permanent application bind settings
export PORT="${PORT:-9240}"
export HOST="${HOST:-0.0.0.0}"

# TMV app auto-restart watchdog
# Pings http://127.0.0.1:9240/tech every 30s; restarts api-server.js if it stops responding.
set -u

APP_DIR="$HOME/preventive-maintenance-app"
PORT=9240
CHECK_URL="http://127.0.0.1:$PORT/tech"
LOG="$APP_DIR/watchdog.log"
LOCK="$APP_DIR/watchdog.lock"
SERVER_LOG="$APP_DIR/server.log"
PIDFILE="$APP_DIR/server.pid"

# Single-instance guard (so a reboot cron + this session don't double up)
exec 9>"$LOCK"
if ! flock -n 9; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') watchdog already running, exiting" >&2
  exit 1
fi

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >> "$LOG"; }

log "watchdog started (pid $$)"

while true; do
  if curl -s -o /dev/null --max-time 4 "$CHECK_URL"; then
    : # alive — nothing to do
  else
    log "TMV server not responding on :$PORT — restarting"
    pkill -f "node api-server.js" 2>/dev/null
    sleep 1
    (
      cd "$APP_DIR" || exit 1
      nohup node api-server.js >> "$SERVER_LOG" 2>&1 &
      echo $! > "$PIDFILE"
    )
    sleep 2
    if curl -s -o /dev/null --max-time 4 "$CHECK_URL"; then
      log "restart OK (new pid $(cat "$PIDFILE" 2>/dev/null))"
    else
      log "restart FAILED — server still down, will retry next cycle"
    fi
  fi
  sleep 30
done

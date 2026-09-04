#!/usr/bin/env bash
# Run from the existing TMV app checkout on its host. Never run against test data.
set -euo pipefail
cd "${1:-$PWD}"
git rev-parse --show-toplevel >/dev/null
if [[ "$(git branch --show-current)" != master ]]; then
  echo 'Stopped: switch to the application master branch after reviewing local changes.' >&2
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo 'Stopped: this checkout has local changes. Preserve and review them before updating.' >&2
  git status --short
  exit 1
fi
if [[ ! -f api-server.js || ! -f db.js ]]; then
  echo 'Run this from the TMV app folder.' >&2
  exit 1
fi
command -v python3 >/dev/null
command -v curl >/dev/null
systemctl show tmvapp-node.service --property=LoadState --value | python3 -c 'import sys; sys.exit(0 if sys.stdin.read().strip()=="loaded" else 1)'
# Refuse to update a different checkout from the running service.
tmv_service_dir="$(systemctl show tmvapp-node.service --property=WorkingDirectory --value)"
if [[ -z "$tmv_service_dir" || "$(realpath "$tmv_service_dir")" != "$(pwd -P)" ]]; then
  echo 'Stopped: run from the WorkingDirectory shown below. If blank, inspect ExecStart before updating.' >&2
  systemctl show tmvapp-node.service --property=WorkingDirectory --property=ExecStart
  exit 1
fi
sudo -v
tmv_backup_dir="$(dirname "$PWD")/tmv-backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$tmv_backup_dir"
git rev-parse HEAD > "$tmv_backup_dir/source-commit.txt"
python3 - "$tmv_backup_dir" <<'PY'
import pathlib, sqlite3, sys
source=pathlib.Path('tmv.db').resolve()
if not source.is_file():
    raise SystemExit('Stopped: tmv.db not found; locate the actual database before updating.')
with sqlite3.connect(source.as_uri()+'?mode=ro',uri=True) as live:
    with sqlite3.connect(str(pathlib.Path(sys.argv[1])/'tmv.db')) as backup:
        live.backup(backup)
        assert backup.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
print('Verified database backup:',sys.argv[1])
PY
git pull --ff-only origin master
node --check api-server.js
node --check db.js
node --check work-orders.js
node --check app.js
node --check dispatch.js
sudo systemctl restart tmvapp-node.service
for tmv_attempt in {1..20}; do
  if curl --fail --silent http://127.0.0.1:9240/ | python3 -c 'import sys; s=sys.stdin.read(); sys.exit(0 if "dispatch.js?v=20260904" in s and "Assign Technician and Generate Report" in s else 1)' &&
     curl --fail --silent http://127.0.0.1:9240/api/config | python3 -c 'import json,sys; c=json.load(sys.stdin); sys.exit(0 if c.get("tmvVanMap") else 1)'; then
    echo 'Updated page and API verified. Refresh the TMV app.'
    exit 0
  fi
  sleep 1
done
echo 'Verification failed. Backup is preserved; inspect the service log before making further changes.' >&2
sudo journalctl -u tmvapp-node.service -n 30 --no-pager
exit 1

#!/usr/bin/env bash

# TMV Preventive Maintenance — One-File Azure/OneDrive Migration Packager
#
# Run from the live TMV app directory:
#   cd ~/preventive-maintenance-app
#   bash make-azure-move-package.sh
#
# Result:
#   ~/tmv-azure-migration/TMV-PM-AZURE-COMPLETE-<timestamp>.tar.gz.gpg
#
# The encrypted .gpg file is the ONLY file that needs to be uploaded to OneDrive.

APP_DIR="$(pwd)"
OUT_DIR="$HOME/tmv-azure-migration"
STAMP="$(date +%Y%m%d-%H%M%S)"
BUNDLE="TMV-PM-AZURE-COMPLETE-$STAMP"
STAGE="$OUT_DIR/$BUNDLE"
PLAIN="$OUT_DIR/$BUNDLE.tar.gz"
ENCRYPTED="$PLAIN.gpg"
SERVICE="tmvapp-node.service"
SERVICE_WAS_ACTIVE=0
SNAPSHOT_STARTED=0

say() { printf '%s\n' "$*"; }
fail() { say "ERROR: $*"; return 1; }

restore_service_if_needed() {
  if [ "$SNAPSHOT_STARTED" -eq 1 ] && [ "$SERVICE_WAS_ACTIVE" -eq 1 ]; then
    if ! systemctl is-active --quiet "$SERVICE"; then
      say "Restarting $SERVICE after interrupted snapshot..."
      sudo systemctl start "$SERVICE" >/dev/null 2>&1 || true
    fi
  fi
}
trap restore_service_if_needed EXIT INT TERM

say "============================================================"
say " TMV PREVENTIVE MAINTENANCE — ONE-FILE AZURE MOVE PACKAGE"
say "============================================================"
say

[ -f "$APP_DIR/api-server.js" ] || { fail "Run this from ~/preventive-maintenance-app"; return 1 2>/dev/null || exit 1; }
[ -f "$APP_DIR/package.json" ] || { fail "package.json not found"; return 1 2>/dev/null || exit 1; }
[ -f "$APP_DIR/tmv.db" ] || { fail "tmv.db not found"; return 1 2>/dev/null || exit 1; }
[ -f "$APP_DIR/.env" ] || { fail ".env not found; refusing to create an incomplete migration package"; return 1 2>/dev/null || exit 1; }
command -v tar >/dev/null 2>&1 || { fail "tar is not installed"; return 1 2>/dev/null || exit 1; }
command -v sha256sum >/dev/null 2>&1 || { fail "sha256sum is not installed"; return 1 2>/dev/null || exit 1; }
command -v gpg >/dev/null 2>&1 || { fail "gpg is not installed. Install package 'gnupg' first."; return 1 2>/dev/null || exit 1; }
command -v node >/dev/null 2>&1 || { fail "node is not installed"; return 1 2>/dev/null || exit 1; }

BRANCH="$(git branch --show-current 2>/dev/null || true)"
COMMIT="$(git rev-parse HEAD 2>/dev/null || true)"
STATUS="$(git status --short 2>/dev/null || true)"

say "Source:      $APP_DIR"
say "Git branch:  ${BRANCH:-unknown}"
say "Git commit:  ${COMMIT:-unknown}"
say "Destination: $ENCRYPTED"
say

if [ -n "$STATUS" ]; then
  say "NOTE: Working tree has local/untracked files. They will be captured unless excluded as secrets/runtime data."
  say "$STATUS"
  say
fi

mkdir -p "$OUT_DIR" || { fail "Cannot create $OUT_DIR"; return 1 2>/dev/null || exit 1; }
rm -rf "$STAGE"
rm -f "$PLAIN" "$ENCRYPTED"
mkdir -p "$STAGE/app" "$STAGE/runtime/uploads" "$STAGE/private" "$STAGE/meta" || {
  fail "Cannot create staging directory"; return 1 2>/dev/null || exit 1;
}

say "===== 1. CAPTURE APPLICATION SOURCE ====="
# Preserve the exact working tree, including useful local backup files, while
# excluding Git history, dependencies, runtime data, logs, and every .env copy.
tar \
  --exclude='./.git' \
  --exclude='./node_modules' \
  --exclude='./uploads' \
  --exclude='./tmv.db' \
  --exclude='./tmv.db-wal' \
  --exclude='./tmv.db-shm' \
  --exclude='./.env' \
  --exclude='./.env.*' \
  --exclude='./server.log' \
  --exclude='./tunnel.log' \
  --exclude='./tunnel-url.txt' \
  --exclude='./server.pid' \
  --exclude='./tunnel.pid' \
  --exclude='./watchdog.lock' \
  --exclude='./watchdog.log' \
  --exclude='./watchdog.boot.log' \
  -cf - . | tar -xf - -C "$STAGE/app"
RC=${PIPESTATUS[0]}
[ "$RC" -eq 0 ] || { fail "Application source copy failed"; return 1 2>/dev/null || exit 1; }
say "PASS - application source captured"
say

say "===== 2. TAKE CONSISTENT LIVE DATA SNAPSHOT ====="
if systemctl is-active --quiet "$SERVICE"; then
  SERVICE_WAS_ACTIVE=1
fi
SNAPSHOT_STARTED=1

say "Stopping $SERVICE briefly..."
sudo systemctl stop "$SERVICE" || { fail "Could not stop $SERVICE"; return 1 2>/dev/null || exit 1; }

# Merge WAL into the main SQLite database before copying it.
node - <<'NODE'
const Database = require('better-sqlite3');
const db = new Database('./tmv.db');
const result = db.pragma('wal_checkpoint(TRUNCATE)');
console.log('SQLite WAL checkpoint:', JSON.stringify(result));
db.close();
NODE
RC=$?
if [ "$RC" -ne 0 ]; then
  fail "SQLite checkpoint failed"
  return 1 2>/dev/null || exit 1
fi

cp -p "$APP_DIR/tmv.db" "$STAGE/runtime/tmv.db" || { fail "Database copy failed"; return 1 2>/dev/null || exit 1; }

# Keep WAL/SHM too if SQLite recreated them during the snapshot.
[ -f "$APP_DIR/tmv.db-wal" ] && cp -p "$APP_DIR/tmv.db-wal" "$STAGE/runtime/tmv.db-wal"
[ -f "$APP_DIR/tmv.db-shm" ] && cp -p "$APP_DIR/tmv.db-shm" "$STAGE/runtime/tmv.db-shm"

if [ -d "$APP_DIR/uploads" ]; then
  cp -a "$APP_DIR/uploads/." "$STAGE/runtime/uploads/" || { fail "Uploads copy failed"; return 1 2>/dev/null || exit 1; }
fi

for f in config.json assets.json assignments.json; do
  [ -f "$APP_DIR/$f" ] && cp -p "$APP_DIR/$f" "$STAGE/runtime/$f"
done

cp -p "$APP_DIR/.env" "$STAGE/private/.env" || { fail ".env copy failed"; return 1 2>/dev/null || exit 1; }
chmod 600 "$STAGE/private/.env"

say "Restarting $SERVICE..."
sudo systemctl start "$SERVICE" || { fail "Could not restart $SERVICE"; return 1 2>/dev/null || exit 1; }
SNAPSHOT_STARTED=0

for i in 1 2 3 4 5 6 7 8 9 10; do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:9240/ 2>/dev/null)"
  [ "$CODE" = "200" ] && break
  sleep 1
done
if [ "${CODE:-000}" != "200" ]; then
  fail "TMV app did not return HTTP 200 after snapshot. Package was NOT encrypted."
  return 1 2>/dev/null || exit 1
fi
say "PASS - live app restarted and healthy (HTTP 200)"
say

say "===== 3. VERIFY SNAPSHOT DATABASE ====="
TMV_SNAPSHOT_DB="$STAGE/runtime/tmv.db" node - <<'NODE'
const Database = require('better-sqlite3');
const db = new Database(process.env.TMV_SNAPSHOT_DB, { readonly: true, fileMustExist: true });
const integrity = db.pragma('integrity_check', { simple: true });
console.log('integrity_check=' + integrity);
if (integrity !== 'ok') process.exitCode = 1;
for (const table of ['assignments','assets','config','sms_consent_events','work_order_logs','audit_log']) {
  try {
    console.log(table + '=' + db.prepare('SELECT COUNT(*) AS c FROM ' + table).get().c);
  } catch (e) {
    console.log(table + '=ERROR ' + e.message);
    process.exitCode = 1;
  }
}
db.close();
NODE
RC=$?
[ "$RC" -eq 0 ] || { fail "Snapshot database verification failed"; return 1 2>/dev/null || exit 1; }
say

say "===== 4. WRITE HANDOFF / RESTORE FILES ====="
cat > "$STAGE/meta/GIT-STATE.txt" <<EOF
TMV Preventive Maintenance migration snapshot
Created: $(date -Is)
Source host: $(hostname)
Source directory: $APP_DIR
Git branch: ${BRANCH:-unknown}
Git commit: ${COMMIT:-unknown}
Working tree status follows:
${STATUS:-CLEAN}
EOF

cat > "$STAGE/README-AZURE-HANDOFF.txt" <<'EOF'
TMV PREVENTIVE MAINTENANCE — AZURE HANDOFF

This encrypted migration bundle is intended as a complete initial lift-and-shift
snapshot of the working TMV Preventive Maintenance application.

It contains:
  app/                 exact captured application files
  runtime/tmv.db       SQLite database snapshot
  runtime/uploads/     uploaded work-order/ticket photos
  private/.env         current private runtime configuration and credentials
  meta/                Git state, data summary, inventory, and checksums
  restore-on-azure.sh  restore helper
  validate-on-azure.sh post-restore checks

IMPORTANT SECURITY:
The archive contains private company application data and credentials. Keep it
private. Do not commit the decrypted contents or private/.env to a public repo.

INITIAL AZURE LIFT-AND-SHIFT TARGETS USED BY THE RESTORE SCRIPT:
  Application: /home/site/wwwroot
  Persistent:  /home/data/tmv-pm

The restore helper creates persistent symlinks for:
  /home/site/wwwroot/tmv.db  -> /home/data/tmv-pm/tmv.db
  /home/site/wwwroot/uploads -> /home/data/tmv-pm/uploads
  /home/site/wwwroot/.env    -> /home/data/tmv-pm/.env

Azure admin quick start after decrypting/extracting:
  bash restore-on-azure.sh

Then configure/update APP_PUBLIC_URL in Azure App Settings or the restored .env
to the final Azure HTTPS hostname and start the app with:
  node api-server.js

Recommended long-term Azure hardening after the lift-and-shift:
  - move secrets to Azure App Settings / Key Vault
  - move uploaded photos to Azure Blob Storage
  - evaluate a managed database instead of SQLite for multi-instance scaling
EOF

cat > "$STAGE/restore-on-azure.sh" <<'RESTORE'
#!/usr/bin/env bash

BUNDLE_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_TARGET="${TMV_AZURE_APP_DIR:-/home/site/wwwroot}"
DATA_TARGET="${TMV_AZURE_DATA_DIR:-/home/data/tmv-pm}"

say() { printf '%s\n' "$*"; }
fail() { say "ERROR: $*"; return 1; }

say "============================================================"
say " TMV PREVENTIVE MAINTENANCE — AZURE RESTORE"
say "============================================================"
say "Application target: $APP_TARGET"
say "Persistent data:    $DATA_TARGET"
say

[ -f "$BUNDLE_DIR/meta/SHA256SUMS.txt" ] || { fail "Checksum file missing"; return 1 2>/dev/null || exit 1; }
(
  cd "$BUNDLE_DIR" || exit 1
  sha256sum -c meta/SHA256SUMS.txt
) || { fail "Package checksum verification failed"; return 1 2>/dev/null || exit 1; }

mkdir -p "$APP_TARGET" "$DATA_TARGET/uploads" || { fail "Cannot create Azure target paths"; return 1 2>/dev/null || exit 1; }

cp -a "$BUNDLE_DIR/app/." "$APP_TARGET/" || { fail "Application restore failed"; return 1 2>/dev/null || exit 1; }
cp -p "$BUNDLE_DIR/runtime/tmv.db" "$DATA_TARGET/tmv.db" || { fail "Database restore failed"; return 1 2>/dev/null || exit 1; }
cp -a "$BUNDLE_DIR/runtime/uploads/." "$DATA_TARGET/uploads/" 2>/dev/null || true
cp -p "$BUNDLE_DIR/private/.env" "$DATA_TARGET/.env" || { fail "Private environment restore failed"; return 1 2>/dev/null || exit 1; }
chmod 600 "$DATA_TARGET/.env"

rm -f "$APP_TARGET/tmv.db" "$APP_TARGET/.env"
rm -rf "$APP_TARGET/uploads"
ln -s "$DATA_TARGET/tmv.db" "$APP_TARGET/tmv.db"
ln -s "$DATA_TARGET/uploads" "$APP_TARGET/uploads"
ln -s "$DATA_TARGET/.env" "$APP_TARGET/.env"

for f in config.json assets.json assignments.json; do
  [ -f "$BUNDLE_DIR/runtime/$f" ] && cp -p "$BUNDLE_DIR/runtime/$f" "$APP_TARGET/$f"
done

cd "$APP_TARGET" || { fail "Cannot enter application directory"; return 1 2>/dev/null || exit 1; }
if [ -f package-lock.json ]; then
  npm ci --omit=dev || { fail "npm ci failed"; return 1 2>/dev/null || exit 1; }
else
  npm install --omit=dev || { fail "npm install failed"; return 1 2>/dev/null || exit 1; }
fi

say
say "RESTORE COMPLETE"
say "Application: $APP_TARGET"
say "Database:    $DATA_TARGET/tmv.db"
say "Uploads:     $DATA_TARGET/uploads"
say "Secrets:     $DATA_TARGET/.env"
say
say "Before production cutover, update APP_PUBLIC_URL to the final Azure HTTPS URL."
say "Then start with: node api-server.js"
say "Run validation with: bash $BUNDLE_DIR/validate-on-azure.sh https://YOUR-AZURE-HOSTNAME"
RESTORE
chmod +x "$STAGE/restore-on-azure.sh"

cat > "$STAGE/validate-on-azure.sh" <<'VALIDATE'
#!/usr/bin/env bash
APP_URL="${1:-http://127.0.0.1:${PORT:-8080}}"
APP_TARGET="${TMV_AZURE_APP_DIR:-/home/site/wwwroot}"
DATA_TARGET="${TMV_AZURE_DATA_DIR:-/home/data/tmv-pm}"

printf '%s\n' "===== TMV AZURE VALIDATION ====="
printf 'App URL: %s\n' "$APP_URL"
printf 'App path: %s\n' "$APP_TARGET"
printf 'Data path: %s\n' "$DATA_TARGET"

echo
echo "===== REQUIRED FILES ====="
for f in api-server.js package.json db.js work-orders.js index.html db-viewer.html tech.html techindex.html; do
  if [ -f "$APP_TARGET/$f" ]; then echo "PASS $f"; else echo "MISSING $f"; fi
done

echo
echo "===== DATA ====="
[ -f "$DATA_TARGET/tmv.db" ] && ls -lh "$DATA_TARGET/tmv.db" || echo "MISSING tmv.db"
[ -d "$DATA_TARGET/uploads" ] && echo "upload_files=$(find "$DATA_TARGET/uploads" -type f | wc -l)" || echo "MISSING uploads"
[ -f "$DATA_TARGET/.env" ] && echo "PASS private environment present" || echo "MISSING .env"

echo
echo "===== HTTP ====="
CODE="$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/" 2>/dev/null)"
echo "HTTP $CODE"
[ "$CODE" = "200" ] && echo "PASS application responding" || echo "CHECK application response"

echo
echo "===== MANUAL FUNCTIONAL CHECKS ====="
echo "1. Recovery Superuser login"
echo "2. Normal Superuser login"
echo "3. Manager login"
echo "4. Security tab / User Roles"
echo "5. 3x2 Setup layout"
echo "6. District personnel filtering"
echo "7. Create/open/complete a work order"
echo "8. Upload and redisplay a photo"
echo "9. Audit Log"
echo "10. SMS/email workflow"
VALIDATE
chmod +x "$STAGE/validate-on-azure.sh"

UPLOAD_COUNT="$(find "$STAGE/runtime/uploads" -type f 2>/dev/null | wc -l)"
UPLOAD_SIZE="$(du -sh "$STAGE/runtime/uploads" 2>/dev/null | awk '{print $1}')"
DB_SIZE="$(du -h "$STAGE/runtime/tmv.db" | awk '{print $1}')"
cat > "$STAGE/meta/DATA-SUMMARY.txt" <<EOF
Snapshot created: $(date -Is)
Database size: $DB_SIZE
Upload file count: $UPLOAD_COUNT
Upload size: ${UPLOAD_SIZE:-0}
EOF

(
  cd "$STAGE" || exit 1
  find . -type f -print | LC_ALL=C sort > meta/FILE-INVENTORY.txt
  find . -type f ! -path './meta/SHA256SUMS.txt' -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > meta/SHA256SUMS.txt
)
RC=$?
[ "$RC" -eq 0 ] || { fail "Inventory/checksum generation failed"; return 1 2>/dev/null || exit 1; }

say "PASS - restore instructions, inventory, and checksums created"
say

say "===== 5. CREATE ONE PLAIN ARCHIVE ====="
tar -C "$OUT_DIR" -czf "$PLAIN" "$BUNDLE" || { fail "Archive creation failed"; return 1 2>/dev/null || exit 1; }
tar -tzf "$PLAIN" >/dev/null || { fail "Archive verification failed"; return 1 2>/dev/null || exit 1; }
chmod 600 "$PLAIN"
say "PASS - archive created and verified"
say

say "===== 6. ENCRYPT FOR ONEDRIVE ====="
say "GPG will now ask you for a passphrase twice."
say "Use a NEW strong passphrase and send it to the Azure administrator separately."
say "Do NOT put the passphrase in OneDrive or in the file name."
say

gpg --symmetric --cipher-algo AES256 --output "$ENCRYPTED" "$PLAIN"
RC=$?
if [ "$RC" -ne 0 ] || [ ! -s "$ENCRYPTED" ]; then
  fail "Encryption failed. Plain archive retained at $PLAIN"
  return 1 2>/dev/null || exit 1
fi
chmod 600 "$ENCRYPTED"

say "PASS - encrypted OneDrive file created"
say

say "===== 7. FINAL CLEANUP ====="
rm -f "$PLAIN"
rm -rf "$STAGE"

say "============================================================"
say " COMPLETE — THIS IS THE ONLY FILE TO SEND"
say "============================================================"
say "$ENCRYPTED"
say
say "Encrypted file SHA256:"
sha256sum "$ENCRYPTED"
say
say "Upload ONLY the .gpg file to company OneDrive."
say "Send the GPG passphrase to the Azure administrator through a separate channel."
say "Do not upload the passphrase in the same OneDrive folder."

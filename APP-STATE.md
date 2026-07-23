# TMV Master App — State Checkpoint (read this first)

> Cheap context for the PM app. Read this instead of the whole codebase when you
> start a PM-app task. The full README.md is STALE (describes the old assets.json
> checklist era) — ignore it.
>
> Last updated: 2026-07-22

## Run / access
```bash
cd ~/preventive-maintenance-app && node api-server.js
# Linux:  http://127.0.0.1:9240  (also binds 0.0.0.0 — all interfaces)
# Windows host browser: http://172.18.75.10:9240  (or localhost if not blocked)
# Windows trap: a stray Windows-side node.exe can squat the port and serve stale
#   files. If the page looks old, check BOTH netstat sides; use the WSL IP.
```
- SQLite db via `db.js` (NOT assets.json anymore). DB file: `tmv.db`.
- Auth: admin login `POST /api/login` (admin/admin123) → static base64 token.
  `isAdmin(token)` gates privileged endpoints. Managers (added 2026-07-22) also
  return the SAME admin token (full RW). Manager passwords are scrypt-hashed in
  `config.managers` (`PUT /api/managers`, admin-only).

## Architecture
- Backend: `api-server.js` (single file, manual routing via `url.pathname` switch).
- Frontend: `index.html` (dashboard/inspections), `app.js` (logic), `tech.html`
  (technician view), `techindex.html`, `db-viewer.html` (admin DB browser).
- No build step. Static files served per-request → frontend edits need NO restart;
  only `api-server.js`/`db.js` changes need a restart.

## Routes (api-server.js)
| Method+Path | Purpose |
|---|---|
| GET  /api/config | app config (vanTypes, locations, technicians, categories, settings, managers) |
| PUT  /api/config | update config (admin) |
| PUT  /api/managers | set managers (admin; hashes passwords) |
| GET  /api/dispatch | build Call/Email/WhatsApp/Telegram deep links for an assignment's tech |
| POST /api/login | admin/manager login → token |
| GET  /api/admin/db | raw DB dump (admin) |
| POST /api/admin/purge | destructive purge (admin) |
| GET/POST /api/assets | TMV inspection items (checklist CRUD) |
| PUT/DELETE /api/assets/:id | update/delete item |
| POST /api/assets/:id/maintain | log inspection done |
| POST /api/inspection | ??? inspection submit |
| POST /uploads (photoUploadMatch) | photo upload → /uploads/:file |
| POST /api/photo/delete | delete photo |
| POST /api/assignments | create assignment (used by Tracker) |
| GET  /api/assignments | list assignments (Tracker source) |
| GET  /api/assignments/:id | one assignment |
| PUT  /api/assignments/:id | update/complete an assignment |
| DELETE /api/assignments/:id | delete assignment (ADMIN ONLY; removes photo files) |
| POST /api/assignments/:id/photo | attach photo |
| POST /api/assignments/demo | seed demo data |

## Data model — Assignment (what the Tracker shows)
```
{
  id, tmv, vanType, location, date,
  status: 'assigned'|'in_progress'|'completed'|'rejected',
  technician: { name, email, phone, whatsapp, telegram },  // object, NOT a string
  sections: [{ title, items:[{label, type, value}] }],
  results: [{ title, items:[{label, value}] }],
  photos: [{ file, local, label }]
}
```
- `config.technicians` is a lookup list (name→contact). Assignment stores its own
  `technician` object snapshot so edits don't retro-change history.

## Views / pages
- **index.html — Tracker tab**: as of 2026-07-22 it is an ASSIGNMENTS BOARD
  (clickable cards, click to expand: contact bar + results + photos; filters by
  status / technician / text). `buildTracker()` in app.js. This replaced the old
  asset-status tracker (which had no click handlers). "Same info as assignments."
- **index.html — Inspections tab**: the 49-item TMV checklist (legacy feature).
- **tech.html**: technician-facing view (contact shortcuts Call/Email/WA/TG).
- **db-viewer.html**: admin read-only-ish DB browser.

## Gotchas
- **Harness PII redaction**: the Hermes harness masks E.164 phone numbers
  (`+155****4567`) in ALL tool input/output. So phone values echoed back from
  `node`/curl tests are NOT trustworthy — the app stores whatever the browser
  sends verbatim. Don't "fix" a phantom masking bug; it's the harness, not the app.
- **Destructive ops**: DELETE assignment + purge + admin/purge are destructive and
  IRREVERSIBLE (photo files removed). ALWAYS test against throwaway records
  (e.g. `tmv: 'TMV_DBG…'`), never the first live row. (A real record TMV57449B was
  once deleted during a test — avoid repeating.)
- WSL↔Windows port squatting (see Run/access above).

## Open/uncommitted work (as of 2026-07-22)
- Feature batch in flight, NOT committed: managers auth, DELETE assignment
  (admin+photo cleanup), technician-as-object, email/dispatch links, contact bar,
  removed per-section "include" checkbox (config `include:false`), UI polish
  (CUDD maroon #812F2F cards/buttons, white dropdown). Modified: api-server.js,
  app.js, db.js, db-viewer.html, index.html, tech.html, techindex.html.
- `_recover.js` exists in repo — suggests a prior destructive-delete incident;
  investigate DB integrity / backups before any purge work.
- Stale helpers in app.js (`statusOf`/`daysLeft`/`SL`/`SC`) are dead since the
  Tracker rework; safe to delete.

# TMV Preventive Maintenance App — Continuation Handoff
Date: September 28, 2026

## Exact Stop Point

We are working on the production branch:
`ms02-live-sync-20260908-085804`

Live MS-02 host is still deployed at:
`12e6e47 Use existing HTML escape for role button data`

IMPORTANT: GitHub production branch is ahead of the live host because one incomplete front-end-only commit was made after the last deployment:
`5c3d49e Add Superusers Setup card and arrange Setup columns`

DO NOT deploy/pull `5c3d49e` yet by itself.

## Current Task

User promoted the normal Jason Guynes account from Manager to Superuser successfully.

Because role promotion removes the account from the Managers list, Jason disappeared from Setup > Managers. User requested a visible editable Superusers Setup card.

Requested Setup layout:

Left column:
1. Superusers
2. Equipment Units
3. Technicians

Right column:
1. Managers
2. Districts
3. Inspection Settings

Maintenance Categories remains below/full width.

Recovery Superuser must NOT appear in the editable Superusers Setup card. It stays locked under Security.

## Work Already Done in GitHub

Commit:
`5c3d49ed1384483ac0d53d124b09e3a41ce14b83 Add Superusers Setup card and arrange Setup columns`

This front-end commit modified `db-viewer.html` to:
- add a Superusers Setup card
- show normal promoted accounts from `config.superusers`
- add editable fields:
  - Display name
  - Login username
  - Email
  - Mobile phone
  - District
  - New password
  - Confirm new password
- add `saveSu()` front-end function that calls `PUT /api/superusers`
- add `fillSu()` / `suObj()`
- add ALL-capable district dropdown for Superusers
- rearrange Setup into two explicit columns:
  - left: Superusers, Equipment Units, Technicians
  - right: Managers, Districts, Inspection Settings
- responsive fallback to one column on narrow screens

## What Is NOT Done Yet

Backend endpoint `PUT /api/superusers` does NOT exist yet.

Next step is to implement it in `api-server.js` before deployment.

The endpoint should:
- require Superuser session
- operate only on `config.superusers`, NOT Recovery Superuser
- preserve existing hashed password when password field is blank
- hash a new plaintext password using existing `hashPassword()`
- enforce existing `validAdminPassword()` policy
- preserve/update:
  - name
  - username
  - email
  - phone
  - district
  - password
  - role: 'superuser'
- reject username equal to Recovery Superuser `ADMIN_USER`
- reject duplicate username against other normal Superusers and Managers as appropriate
- audit the update without logging plaintext passwords
- return sanitized Superuser records without password hashes
- avoid deleting or changing Recovery Superuser
- use existing role/account conventions in v1 rather than introducing a new users table in this patch

Then verify:
- Node syntax
- front-end fields/functions exist
- endpoint exists
- normal Superuser record survives save
- Recovery Superuser remains separate
- no unrelated files changed

Only after endpoint and verification are complete should a deployment script be given to the user.

## Recent Important Live Features

Live at `12e6e47` already includes:
- centered generic Sign In screen
- Task.db opens same browser tab
- role persistence fix
- Manager/Technician username/password/email/phone
- Manager/Technician Confirm Password
- Manager/Technician District fields
- Manager District option `ALL — All districts`
- personnel district filtering
- Tech page District dropdown
- enforced minimum 15-minute inactivity timeout
- individual task checkboxes on work-order builder
- Select All selects every task
- only chosen tasks saved into new work order
- ticket number + direct SMS work-order link
- permanent SQLite audit log
- photo preservation/recovery fixes
- User Roles Change Role button fix

## Recent Production Commit Chain

`12e6e47 Use existing HTML escape for role button data` — LIVE
`01292bf Fix User Roles Change Role button`
`474918d Treat ALL managers as covering every district`
`3caa37d Add ALL option to manager district`
`54e215d Recover orphaned assignment photo references`
`028bac8 Preserve assignment photos when reopening technician task`
`6a6251e Add individual task selection and password confirmation`
`1dcddc1 Add district personnel filtering and fix 15 minute timeout`
`80807c8 Simplify and center login heading`
`053ba7a Open Task.db in same browser tab`
`ced37ea Fix role persistence and add technician account fields`
`888ff5d Add ticket number and direct SMS work order link`
`a15c092 Add permanent SQLite administrative audit log`

GitHub branch also currently has:
`5c3d49e Add Superusers Setup card and arrange Setup columns` — NOT LIVE / INCOMPLETE UNTIL BACKEND ENDPOINT IS ADDED

## Critical Deployment Discipline

- Never say GitHub change is live until user actually pulls it to MS-02 and health check passes.
- No reset/rebase/force/delete.
- Preserve all backups and existing data.
- Do not alter Recovery Superuser.
- User prefers exact copy/paste shell blocks.
- No `exit` or `set -e` in shell blocks unless absolutely necessary.
- Use `git pull --ff-only`.
- Keep v2 branch separate and do not deploy it.
- Production branch remains `ms02-live-sync-20260908-085804`.

## Next New Chat Instruction

Continue from this exact point:

1. Inspect current GitHub production branch at `5c3d49e`.
2. Implement and verify `PUT /api/superusers` in `api-server.js`.
3. Do NOT deploy until both front end and backend are complete.
4. Then provide one safe deployment script for MS-02.
5. After deployment, verify the Jason Guynes promoted Superuser appears in Setup > Superusers and can be edited without affecting Recovery Superuser.

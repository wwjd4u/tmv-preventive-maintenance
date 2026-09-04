# Recovery-source layout update

This update is based on Jason's uploaded current source from the live
`recovery-2026-07-30` checkout at local commit `6815088`, including its uncommitted
page edits. It supersedes the earlier master-based deployment for that host.

The layout has top controls and compact TMV cards with technician selectors.
Assign Technician opens a separate section selection page. Sections start unchecked;
Select All and Clear All are available. Generate Work Order saves only the selected
sections, assignment, report and creation log in one transaction with retry protection.
The administrative checklist backfill preserves these explicitly scoped orders. It does not mark maintenance completed or
send messages automatically. Manual email/SMS controls remain available.

Location/tracker logic, the Tech tab, map modal, checklist controls, existing
assignment APIs, Twilio routing and other uploaded pages are preserved. The
saved report can be reopened through Tracker's standalone assignment page.

## Apply on the host

Fetch `tmv-layout-recovery` into the existing app repository and run
`updates/apply-recovery-layout.py` from that revision using Python 3. The installer
discovers the app from `tmvapp-node.service`, verifies each changed file against
the previously deployed R2 source hashes, backs up source and SQLite, stages and syntax-checks
the update using the service's Node executable, then updates only ten reviewed
files and restarts the service. It does not switch branches, reset/stash Git,
pull over local edits, replace configuration, touch uploads, or remove backups.

An unexpected local edit stops the installer before live source changes. A
restart/health failure restores original source and attempts to restart it;
the database is not rolled back. New, unused files may remain after restoration.
Backups are under `~/tmv-layout-backups/`.

## Validation performed

- Real SQLite and HTTP tests on Node 22: input validation, full mobile checklist
  schema, transaction rollback, repeat/concurrent request IDs, conflict detection,
  persistence after process restart, and no maintenance-completion mutation.
- DOM checks: 17 configured cards, technician/district selection, double-click
  prevention, report success, existing Tracker, Tech/location surfaces, HTTPS
  assignment links and inspection control state.
- Original location/tracker and inspection-control code compared byte-for-byte.
- Installer source/payload checks; no live service or external messages used.

The branch is a reviewed source snapshot. Apply the targeted installer to retain
host-only startup/watchdog changes that were not included in the upload.

R3 validation also covers empty/invalid section selections, selected-only report and
API persistence, Select All/Clear All, draft persistence, and retries after uncertain responses.

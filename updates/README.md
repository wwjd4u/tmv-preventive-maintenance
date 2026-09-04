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

## SMS consent and policy update (S1)

Privacy and terms now link to a public, optional SMS Preferences form with support at jguynes@rpc.net. SMS consent starts unchecked and is stored with the disclosure/version and timestamp. Withdrawal appends a record; server-sent SMS is blocked without consent and until campaign approval/provider configuration is explicitly confirmed. No messages are sent by enrollment or deployment. See A2P-RESUBMISSION.md for public-access checks, proposed campaign fields, and remaining Twilio settings. This update deploys sixteen reviewed source files and accepts known R2/R3 revisions. Tests cover consent validation, withdrawal, restart persistence, send blocking, and the unchanged work-order transaction flow.

Email fix: the standalone assignment page now populates the technician recipient, work-order subject, district/date/status, selected checklist with current recorded answers, and HTTPS technician link. Older name-only assignments resolve the recipient from the roster. The link still opens a draft for manual review and sending. Unit tests verify encoding, multiline content, boolean answers, roster fallback, and missing-email behavior; no email is sent by tests. The assignment page is served without caching.

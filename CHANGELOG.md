
## 2026-09-08 — Superuser User Roles
- Added a Superuser-only **User Roles** panel beside Superuser Security.
- Lists Recovery Superuser, additional Superusers, Managers, and Technicians with a role dropdown.
- Role changes are enforced server-side, invalidate the changed user's sessions, and write an audit entry.
- Recovery Superuser role is locked as the emergency owner account.
- Additional Superuser login is supported for promoted Manager accounts.
- Public `/api/config` responses now strip credential hashes and privileged role metadata.


## 2026-09-08 — Authentication idle timeout and private Superuser credentials
- Superuser username/password now come from the private `.env` (`ADMIN_USER`, `ADMIN_PASS`) instead of source code.
- Added a rolling 15-minute inactivity timeout for server auth sessions.
- Main app and Task.db now sign out after 15 minutes with no user activity and refresh the server session while the user is active.
- Bumped the main app script version so mobile/PWA clients load the updated auth behavior.

## 2026-09-08 — SMS Preferences exposed in Setup
- Added SMS Preferences controls to Technician and Manager Setup cards.
- Selected name/phone are prefilled on the existing consent page.
- Added Manager mobile phone storage for SMS enrollment.
- SMS consent roster validation now accepts Technicians or Managers.

# TMV Preventive Maintenance App — Change Log

This file explains application changes in plain language. It is intended to be updated with every future application change.

## Change-log rules going forward

For each change, record:
- Date
- Plain-English explanation of what changed
- Main files or area affected
- Git commit when known
- Deployment/testing status when verified

Historical entries below are based on the Git repository history. Older entries are marked as historical repository changes unless their current live deployment state has been explicitly re-verified.

---

## 2026-09-08

### Login boot hotfix
- Fixed a post-login boot error caused by a leftover `isAdmin()` reference from the retired fake Admin/Tech role selector.
- `isAdmin()` now uses the real authenticated role and treats both Superuser and Manager as operational admin roles for Tracker controls.
- Removed the dead legacy role-dropdown listener.
- Bumped the main app JavaScript cache version so browsers load the corrected file immediately.
- Deployment status: **GitHub implementation pending MS-02 deployment verification.**


### Completed application login and logout flow
- Removed the legacy browser code that automatically stored and reused the built-in admin credentials.
- Removed the fake Admin/Tech role selector from the desktop application.
- Added a real Superuser / Manager login screen to the main desktop application.
- Added a signed-in role/name indicator and **Log Out** button.
- Added server-side session validation and logout endpoints.
- Task.db now reuses the active authenticated session token instead of storing a username/password in session storage.
- Task.db also has its own **Log Out** button and blank credential fields when no session exists.
- Technician work-order links remain separate from Superuser/Manager login.
- Deployment status: **GitHub implementation pending MS-02 deployment verification.**


### Superuser and Manager role separation
- Changed the built-in admin account into the **Superuser** role with full read/write/delete control.
- Added true Manager login sessions with separate credentials stored in the existing Managers Setup section.
- Managers can operate Assignments/Tracker/technician workflows.
- In Setup, Managers can add/edit/delete Technicians; add/update Managers; add/edit Equipment; add/edit Districts; and add Inspection Settings.
- Managers cannot delete Setup records other than Technicians.
- Managers cannot access or modify Maintenance Categories.
- Maintenance Categories and destructive Setup actions remain Superuser-only.
- Backend API checks enforce these limits in addition to hiding restricted Setup controls in the UI.
- Technician work-link behavior remains limited to the technician's assigned work and was not changed by this update.
- Deployment status: **GitHub implementation pending MS-02 deployment verification.**


### Maintenance Categories — drag-and-drop task ordering
- Replaced the task Move Up / Move Down arrow buttons with drag-and-drop ordering.
- Added a visible `⋮⋮` drag handle to each maintenance task.
- While dragging, a maroon horizontal insertion line shows exactly where the task will be placed.
- Tasks can be reordered only within their existing maintenance category.
- Dropping a task saves the new order through the existing configuration save process.
- Main file: `db-viewer.html`.
- Commit: `23fb3eb` — Replace task arrows with drag and drop ordering.
- Deployment: **Verified on MS-02**. Service active and local HTTP returned 200 after restart.

### Maintenance Categories — Expand All / Collapse All
- Added an **Expand All / Collapse All** control to Setup → Maintenance Categories.
- The button automatically changes its label depending on whether all categories are currently open.
- Main file: `db-viewer.html`.
- Commit: `1723e58` — Add setup expand and task reorder controls.
- Deployment: **Verified on MS-02**.

### Maintenance Categories — initial task reorder controls
- Added initial per-task Move Up / Move Down controls as the first ordering implementation.
- This implementation was subsequently replaced by drag-and-drop ordering on the same date.
- Main file: `db-viewer.html`.
- Historical feature commits include `6d3c613` and the later synchronized implementation in `1723e58`.

### GitHub / MS-02 production-source synchronization
- Created production synchronization branch `ms02-live-sync-20260908-085804` from the actual live MS-02 source.
- Backed up the live source and SQLite database before synchronization.
- Committed the current live application source so GitHub represents the production application rather than relying on an older recovery branch.
- Updated the MS-02 Git remote to the canonical repository: `wwjd4u/tmv-preventive-maintenance`.
- Established a controlled deployment process: GitHub change → review diff/commits → `git pull --ff-only` on MS-02 → restart → health check.
- Commit: `821b3ac` — Sync current live MS-02 TMV application.
- Deployment/source synchronization: **Verified**.

### September layout / assignment workflow recovery
- Restored and refined the compact TMV-card assignment layout.
- Moved dispatch controls above the fleet while retaining existing branding.
- Added technician selection inside each TMV card.
- Built an atomic assignment/report creation flow so the assignment, report, and creation log are stored together with retry protection.
- Preserved technician checklist field types and kept maintenance incomplete until technician completion.
- Added/validated persistence, rollback/retry behavior, restart behavior, and frontend interactions.
- Included a database-backup deployment helper.
- Historical repository commit: `2bbe495` — Add compact TMV cards and atomic assignment/report workflow.

---

## 2026-07-24

### SMS / Twilio / Cloudflare application-state documentation
- Updated application-state documentation with the local Twilio number, 10DLC status/work, Cloudflare TMV tunnel, and compliance pages.
- Historical repository commit: `8ec1c0f`.

### 10DLC compliance pages
- Added Privacy Policy and Terms pages required for messaging compliance and made them available through the Cloudflare-hosted application.
- Main pages: `privacy.html`, `terms.html`.
- Historical repository commit: `9129e45`.

---

## 2026-07-23

### Cloudflare public application URL + Twilio API-key authentication
- Added the public Cloudflare application URL to runtime configuration so SMS links work away from the local network.
- Moved Twilio authentication to API-key SID/secret environment variables rather than relying on a primary authentication token in application logic.
- Historical repository commit: `9af7de1`.

### SMS dispatch to technicians
- Added real SMS dispatch through `/api/sms` using an environment-provided SMS key.
- Added application links to dispatch/work-order messages so technicians can open assignments from their phones.
- Kept technician phone numbers in server-side environment configuration rather than storing real numbers in the public repository.
- Removed WhatsApp/Telegram from this particular no-signup SMS path.
- Historical repository commit: `34bc96b`.

### Tracker assignments board + manager authentication
- Rebuilt Tracker as a clickable assignments board.
- Added expandable assignment details with contact information, technician results, and photos.
- Added filters for status, technician, and text search.
- Added manager authentication with scrypt-hashed passwords and manager configuration APIs.
- Added admin-only assignment deletion with photo cleanup at that stage of development.
- Added technician contact/dispatch links and contact bars in technician views.
- Added an `APP-STATE.md` architecture/data-model checkpoint.
- Historical repository commit: `00398b0`.

---

## 2026-07-21

### Main-page heading readability
- Changed the **Select a TMV Unit** heading to white for better contrast.
- Historical repository commit: `8d4484f`.

### Dropdown readability
- Forced dropdown option lists to render with a white background instead of black on affected pages.
- Historical repository commit: `fc6f91d`.

### CUDD header/banner sizing
- Enlarged the maroon CUDD banner, logo, and page title across application pages.
- Historical repository commit: `a9cddd1`.

### Site background refinements
- Added a subtle blended site-photo background.
- Applied the background consistently to main, Setup/DB, and technician pages.
- Increased visibility in several follow-up refinements so it was not washed out.
- Historical repository commits: `3cec23e`, `7797bbb`, `3340d82`, `f6b5cf2`.

### Back to Main App navigation
- Added a **Back to Main App** link in the `/db` header.
- Historical repository commit: `7933d9e`.

### Setup navigation names + live task types
- Renamed Assets to **Configure** and Config to **Categories** during the Setup UI evolution.
- Replaced the old static task-type display with a functioning task-type dropdown, including Yes/No task types.
- Historical repository commit: `d184d84`.

### Maintenance Categories expandable cards
- Rebuilt Maintenance Categories as expandable cards.
- Each category displays its task list and task types.
- Added per-category controls for adding/removing maintenance tasks.
- Historical repository commit: `7b716e0`.

### Configure/Assets cleanup
- Removed the redundant Districts section where it duplicated Location management.
- Historical repository commit: `ef7c77a`.

### Configure/Assets single-page manager
- Rebuilt the Assets/Configure area as a single-page manager for TMV units, locations, technicians, districts, and maintenance categories.
- Historical repository commit: `bb6a21b`.

### DB viewer load fix
- Fixed a broken inline click-handler escape issue that could produce **Failed to load DB data**.
- Hardened `loadData()` behavior.
- Historical repository commit: `117cdfe`.

### Admin DB/config backend fixes
- Fixed `/api/admin/db` hanging behavior related to database module export/path handling.
- Fixed full configuration save behavior and admin/config path handling.
- Historical repository commit: `0b74a8f`.

### Inline Configure CRUD
- Added inline forms/card controls for managing Configure/Assets entities rather than relying on popup dialogs.
- Historical repository commit: `cd895fc`.

### Add buttons implemented
- Implemented Add actions for TMVs, Locations, Technicians, Districts, and Tasks.
- Historical repository commit: `f0aa1f9`.

### Assets sub-tabs and authentication repair
- Repaired Assets sub-tab behavior and restored working authentication during the Setup-page rewrite.
- Historical repository commit: `88424a9`.

### Task.db auto-login/navigation fix
- Fixed the Task.db button/page-loading flow.
- Moved authentication enforcement to protected API routes rather than blocking the `/db` HTML page itself.
- Fixed auto-login initialization timing and refreshed the frontend cache-buster.
- Historical repository commit: `0d7ad74`.

### Assets sub-tab / inline CRUD fixes
- Corrected Assets sub-tab IDs.
- Corrected configuration array updates to use the API method expected at that stage.
- Added inline edit/add/remove controls for Locations, Technicians, Districts, and Tasks.
- Historical repository commit: `7b05588`.

### Assets CRUD added to DB viewer
- Added administration of TMVs, Locations, Technicians, Districts, and Tasks to the DB viewer.
- Historical repository commit: `096e6d5`.

### Task.db navigation
- Added a **Task.db** navigation button on the main application to open the DB/Setup viewer.
- Added session-based auto-login behavior used at that stage of development.
- Historical repository commit: `f651ab6`.

### Admin DB viewer
- Added `/db` administration page.
- Added protected API access to assignments, assets, and configuration stored in SQLite.
- Added login, assignment/configuration tabs, status filter, search, expandable assignment details, technician results, and photos.
- Historical repository commit: `41d4b2e`.

### SQLite migration
- Replaced JSON assignment persistence with SQLite using `better-sqlite3`.
- Added `db.js` as the data persistence module.
- Updated the Node server to use SQLite.
- Added process-monitoring/watchdog support at that stage and ignored SQLite runtime/WAL files in Git.
- Historical repository commit: `b3a244d`.

---

## 2026-07-20

### Initial TMV Preventive Maintenance application
- Created the initial TMV Preventive Maintenance application.
- Included the admin TMV grid and ticket/dispatch generation.
- Included technician assignments/work orders.
- Added technician mobile assignment pages with camera capture and captions.
- Included switch/van/checklist configuration options.
- Added the Cloudflare named-tunnel hosting structure.
- Historical repository commit: `c81f4a7`.

---

## Planned / not yet implemented

### Superuser privilege level
- Planned role separation:
  - Technician — assigned maintenance/checklist work.
  - Manager — assignments, work orders, and operating status.
  - Superuser — manager abilities plus application Setup/configuration and user-role administration.
- Existing authentication currently needs to be refactored before this is considered implemented.
- **Status: Not implemented yet.**

## 2026-09-08 — Finish installable mobile PWA
- Area: Mobile / PWA
- Added an Install App control with native install prompting where supported.
- Added iPhone/iPad Safari instructions for Share → Add to Home Screen.
- Added safe-area handling, larger phone tap targets, and a more compact mobile header.
- Added remembered last tab behavior for installed-app launches.
- Expanded the offline app shell while keeping all `/api/*` data network-only.
- Added manifest shortcuts for Inspections, Tracker, and Tech.
- Deployment/test status: GitHub patch prepared; live deployment pending.

## 2026-09-08 — Superuser credential rotation
- Added a Superuser-only Security section in Setup for changing the Superuser username and/or password.
- Requires the current Superuser password and enforces the application password policy.
- Updates the private `.env` file and invalidates all active admin sessions after a successful change.
- Managers cannot view or call the Superuser credential-change function.

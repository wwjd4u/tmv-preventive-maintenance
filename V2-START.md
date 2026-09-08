# TMV Maintenance App v2

Branch: `tmv-maintenance-app-v2`

## Purpose

Build the next-generation TMV Maintenance application without destabilizing the current production v1 branch.

## v1 baseline preserved

v2 starts from the current production baseline, including:

- PWA install support for Safari and Chrome
- 15-minute inactivity timeout
- private environment-backed Recovery Superuser credentials
- Superuser credential rotation
- Superuser-only User Roles management
- dedicated Security tab
- Manager / Technician / Superuser role model
- SMS consent and Twilio messaging flow
- SQLite-backed assignments, assets, configuration, work-order logs, SMS consent events
- permanent SQLite administrative/deployment audit log
- current Setup layout and Manager/District placement

## v2 development rules

- Do not deploy v2 changes to the live v1 branch until specifically approved.
- Do not delete production data, backups, accounts, or source history.
- Keep production secrets in private environment configuration only.
- Preserve auditability for administrative actions and deployments.
- Keep mobile/PWA use as a first-class workflow.
- Maintain desktop compatibility.
- Prefer database-backed account, configuration, and maintenance state over flat-file state.
- Keep the Recovery Superuser as an emergency owner account.

## Initial v2 work areas

1. Unified user/account model for Superusers, Managers, and Technicians.
2. Technician username/password login and assignment ownership.
3. First-login temporary-password change workflow.
4. Password reset/recovery email workflow.
5. Complete API authorization hardening so operational endpoints are no longer public by default.
6. Cleaner responsive navigation and mobile-first technician experience.
7. Stronger audit/history views and deployment/version visibility.
8. Database schema versioning/migrations for future cloud deployment.
9. Preserve portability for a later Azure/cloud move.

## Production branch

Current production remains on:

`ms02-live-sync-20260908-085804`

v2 development happens only on:

`tmv-maintenance-app-v2`

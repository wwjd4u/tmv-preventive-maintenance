# TMV Preventive Maintenance — Azure Deployment Handoff

## Canonical source

Use the `master` branch.

```bash
git clone https://github.com/wwjd4u/tmv-preventive-maintenance.git
cd tmv-preventive-maintenance
git checkout master
npm install
```

The application entry point is:

```bash
node api-server.js
```

## Runtime data is intentionally NOT stored in Git

For security and data-integrity reasons, these are excluded from the repository:

- `.env`
- `tmv.db`, `tmv.db-wal`, `tmv.db-shm`
- `uploads/`
- logs and PID files
- local backup files

Use the encrypted migration package / Bastion handoff for the live SQLite database, uploaded photos, and private environment values.

## Required persistent Azure data

Recommended persistent paths:

```
/home/data/tmv-pm/tmv.db
/home/data/tmv-pm/uploads
```

Set:

```
TMV_DB_PATH=/home/data/tmv-pm/tmv.db
```

The application currently expects uploaded photos under `uploads/`. For an initial lift-and-shift, link or mount the persistent uploads directory into the application root as `uploads`.

## Secrets

Populate Azure App Settings / Key Vault using the values from the private migration handoff. Do not commit live secrets into GitHub.

See `.env.example` for variable names.

## Minimum validation after deployment

1. Application root returns HTTP 200.
2. Recovery Superuser login works.
3. Normal Superuser login works.
4. Manager login works.
5. Task.db Security/User Roles work.
6. Setup shows 3 columns x 2 rows:
   - Superusers | Managers | Technicians
   - Equipment Units | Districts | Inspection Settings
7. District filtering works.
8. Work order creation and technician workflow work.
9. Uploaded ticket photos display correctly after reopen.
10. Audit log works.
11. SMS/email integration works with Azure secrets configured.
12. 15-minute minimum inactivity timeout works.

## Current architecture note

This is the current v1 application. It uses SQLite for assignments/config/audit data and filesystem storage for uploaded photos. A later Azure-hardening phase can move these to managed Azure database/blob services.

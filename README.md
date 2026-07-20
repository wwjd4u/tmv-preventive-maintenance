# ✅ TMV Checklist — Preventive Maintenance App

A standalone web app for inspecting and tracking TMV (Twin Monitoring Valve) systems — covering Legacy, Virtual, and Twinfrac deployments along with supporting infrastructure (UPS, HVAC, Network, Sensors, etc.).

**Run it:**
```bash
cd ~/preventive-maintenance-app
node api-server.js
# Open http://127.0.0.1:9240
```

## Features
- **TMV Inspection Checklist** — 49 items across 12 categories
- **Schedule management** — each item has a maintenance interval (default 30 days)
- **Status indicators** — Overdue (red), Due (orange), Due Soon (blue), OK (green)
- **One-click logging** — click ✓ Done or log with detailed notes
- **Filter by category** — Legacy TMV, Virtual TMV, Twinfrac TMV, UPS, HVAC, Network, IoT Edge, Observability, Time Machine, Serial/DM, Meraki Sensors, FracLink
- **Add/delete items** — fully CRUD
- **Persistent data** — saved to assets.json

## TMV Checklist Categories

| Category | Items | Description |
|----------|-------|-------------|
| Legacy TMV | 8 | Servers, Engineer, FracLink, DASTRAC, MultiFrac, Spare, Lab |
| Virtual TMV | 4 | Boot/WOL, Anywhere USB, Standalone Station |
| Twinfrac TMV | 5 | Belly switch, Hoffman switches, Engineer, FracLink, MultiFrac |
| UPS | 3 | Load test, Network card, Generator alarm |
| HVAC | 8 | Rack AC, drains, ducts, manifolds, filters, Mini-Split |
| Network | 6 | Starlink, BEC, Meraki, Palo Alto, Wi-Fi, Printer |
| IoT Edge | 3 | IoT Edge servers, MultiFrac connections |
| Observability | 1 | Observability server |
| Time Machine | 1 | GPS antenna / time sync |
| Serial/DM | 6 | DeviceMaster, CAN, Serial I/O, DAS |
| Meraki Sensors | 2 | Environmental sensors, door sensor |
| FracLink | 2 | Client Viewer, Remote Viewer |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/assets | List all checklist items |
| POST | /api/assets | Add new inspection item |
| PUT | /api/assets/:id | Update item |
| DELETE | /api/assets/:id | Delete item |
| POST | /api/assets/:id/maintain | Log inspection completed |

## Files

| File | Purpose |
|------|---------|
| `index.html` | Full UI — dashboard, item list, detail modal |
| `api-server.js` | Node.js backend (CRUD API, serves HTML) |
| `assets.json` | Auto-created item database |
| `README.md` | This file |

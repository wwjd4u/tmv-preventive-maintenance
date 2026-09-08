from pathlib import Path
import sys

root = Path(sys.argv[1])
index = root / 'index.html'
changelog = root / 'CHANGELOG.md'

text = index.read_text()

# Add richer iOS/PWA metadata.
old = '<meta name="apple-mobile-web-app-title" content="TMV PM">\n<link rel="manifest" href="/manifest.webmanifest">'
new = '<meta name="apple-mobile-web-app-title" content="TMV PM">\n<meta name="format-detection" content="telephone=no">\n<link rel="manifest" href="/manifest.webmanifest">'
if old not in text:
    raise SystemExit('PWA metadata anchor not found')
text = text.replace(old, new, 1)

# Add PWA-specific CSS after auth logout style.
old = '  .auth-logout{background:#fff;color:var(--cudd);border:0;padding:7px 12px;border-radius:8px;font-weight:700;cursor:pointer}\n'
new = old + '''  .pwa-install{background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.35);padding:7px 11px;border-radius:8px;font-weight:700;cursor:pointer;white-space:nowrap}\n  .pwa-install:hover{background:rgba(255,255,255,.25)}\n  .pwa-install-modal{position:fixed;inset:0;z-index:6000;background:rgba(20,20,28,.66);display:none;align-items:center;justify-content:center;padding:20px}\n  .pwa-install-modal.open{display:flex}\n  .pwa-install-card{width:min(430px,100%);background:#fff;border-radius:16px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.35)}\n  .pwa-install-card h2{margin:0 0 10px;color:var(--cudd)}\n  .pwa-install-card p{line-height:1.55;color:#444}\n  .pwa-install-card .btn{width:100%;margin-top:10px}\n'''
if old not in text:
    raise SystemExit('PWA CSS anchor not found')
text = text.replace(old, new, 1)

# Expand mobile layout for safe areas, larger controls, and a usable header.
old = '''  @media (max-width:768px){\n    main{padding:12px;max-width:none}\n    header{padding:12px 14px;gap:10px}\n    header h1{font-size:18px}\n    nav{flex-wrap:wrap;gap:6px}\n    nav button{padding:9px 12px;font-size:13px}\n'''
new = '''  @media (max-width:768px){\n    body{padding-bottom:env(safe-area-inset-bottom)}\n    main{padding:12px;max-width:none}\n    header{padding:calc(10px + env(safe-area-inset-top)) 12px 10px;gap:8px;align-items:flex-start;flex-wrap:wrap}\n    header img{height:40px}\n    header h1{font-size:17px;line-height:1.2;max-width:calc(100vw - 80px)}\n    .header-right{width:100%;margin-left:0;display:grid;grid-template-columns:1fr auto auto;gap:7px;align-items:center}\n    nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;grid-column:1/-1;width:100%}\n    nav button{padding:10px 5px;font-size:12px;min-height:44px}\n    .auth-user{overflow:hidden;text-overflow:ellipsis}\n    .auth-logout,.pwa-install{min-height:42px;padding:8px 10px;font-size:12px}\n    select,input,textarea{font-size:16px}\n'''
if old not in text:
    raise SystemExit('mobile CSS anchor not found')
text = text.replace(old, new, 1)

# Make the fixed action bar respect iPhone safe-area inset.
old = '    .actionbar{position:fixed;left:0;right:0;bottom:0;z-index:70;display:flex;gap:8px;background:#fff;border-top:1px solid var(--line);padding:10px 12px;box-shadow:0 -2px 12px rgba(0,0,0,.10)}'
new = '    .actionbar{position:fixed;left:0;right:0;bottom:0;z-index:70;display:flex;gap:8px;background:#fff;border-top:1px solid var(--line);padding:10px 12px calc(10px + env(safe-area-inset-bottom));box-shadow:0 -2px 12px rgba(0,0,0,.10)}'
if old not in text:
    raise SystemExit('actionbar anchor not found')
text = text.replace(old, new, 1)

# Add install button in header, next to logout.
old = '    <span id="appAuthUser" class="auth-user"></span>\n    <button id="appLogoutBtn" class="auth-logout" onclick="appLogout()">Log Out</button>'
new = '    <span id="appAuthUser" class="auth-user"></span>\n    <button id="pwaInstallBtn" class="pwa-install" onclick="installTmvApp()" hidden>Install App</button>\n    <button id="appLogoutBtn" class="auth-logout" onclick="appLogout()">Log Out</button>'
if old not in text:
    raise SystemExit('header install-button anchor not found')
text = text.replace(old, new, 1)

# Add the installation help modal before the footer.
old = '<footer>\n  <a href="privacy.html">Privacy Policy</a>'
new = '''<div id="pwaInstallModal" class="pwa-install-modal" onclick="if(event.target===this)closePwaInstallHelp()">\n  <div class="pwa-install-card" role="dialog" aria-modal="true" aria-labelledby="pwaInstallTitle">\n    <h2 id="pwaInstallTitle">Install TMV PM</h2>\n    <p id="pwaInstallInstructions">Open your browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.</p>\n    <button class="btn" type="button" onclick="closePwaInstallHelp()">Got it</button>\n  </div>\n</div>\n\n<footer>\n  <a href="privacy.html">Privacy Policy</a>'''
if old not in text:
    raise SystemExit('install-modal anchor not found')
text = text.replace(old, new, 1)

# Load PWA helper after the main app logic so it can observe the tab controls.
old = '<script src="app.js?v=20260908AUTH2"></script>\n<script src="dispatch.js?v=20260904R3"></script>'
new = '<script src="app.js?v=20260908AUTH2"></script>\n<script src="dispatch.js?v=20260904R3"></script>\n<script src="pwa.js?v=20260908PWA1"></script>'
if old not in text:
    raise SystemExit('PWA script anchor not found')
text = text.replace(old, new, 1)

index.write_text(text)

entry = '''\n## 2026-09-08 — Finish installable mobile PWA\n- Area: Mobile / PWA\n- Added an Install App control with native install prompting where supported.\n- Added iPhone/iPad Safari instructions for Share → Add to Home Screen.\n- Added safe-area handling, larger phone tap targets, and a more compact mobile header.\n- Added remembered last tab behavior for installed-app launches.\n- Expanded the offline app shell while keeping all `/api/*` data network-only.\n- Added manifest shortcuts for Inspections, Tracker, and Tech.\n- Deployment/test status: GitHub patch prepared; live deployment pending.\n'''
cl = changelog.read_text()
if '## 2026-09-08 — Finish installable mobile PWA' not in cl:
    changelog.write_text(cl + entry)

print('PWA finish patch applied')

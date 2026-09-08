from pathlib import Path
import sys

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')
p = root / 'index.html'
text = p.read_text()
old = '    <span id="appAuthUser" class="auth-user"></span>\n'
if old not in text:
    raise SystemExit('appAuthUser header span not found')
text = text.replace(old, '', 1)
p.write_text(text)
print('Removed visible role/name label from main header')

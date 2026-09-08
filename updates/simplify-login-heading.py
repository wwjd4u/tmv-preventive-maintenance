from pathlib import Path

p = Path('index.html')
text = p.read_text()
old = '''    <h2>TMV Preventive Maintenance</h2>\n    <p>Sign in as a Superuser or Manager.</p>\n'''
new = '''    <h2 style="text-align:center">TMV Preventive Maintenance</h2>\n    <p style="text-align:center;font-size:18px;font-weight:600;color:#444">Sign In</p>\n'''
if old not in text:
    raise SystemExit('expected login heading block not found')
text = text.replace(old, new, 1)
p.write_text(text)

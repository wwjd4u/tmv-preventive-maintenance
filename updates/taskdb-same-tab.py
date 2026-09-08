from pathlib import Path

p = Path('app.js')
text = p.read_text()
old = """function goDb(){
  if(!APP_TOKEN){ showAppLogin('Please sign in first.'); return; }
  window.open('/db?session=1', '_blank');
}
"""
new = """function goDb(){
  if(!APP_TOKEN){ showAppLogin('Please sign in first.'); return; }
  window.location.assign('/db?session=1');
}
"""
if old not in text:
    raise SystemExit('Expected goDb block not found; refusing to modify app.js')
text = text.replace(old, new, 1)
p.write_text(text)
print('Updated Task.db navigation to same-tab')

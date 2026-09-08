from pathlib import Path
import re

p = Path('db-viewer.html')
text = p.read_text()

loc_pat = re.compile(r'(\n      <!-- LOCATIONS -->\n      <section class="mblock">.*?\n      </section>\n)', re.S)
mgr_pat = re.compile(r'(\n      <!-- MANAGERS -->\n      <section class="mblock">.*?\n      </section>\n)', re.S)

loc_m = loc_pat.search(text)
mgr_m = mgr_pat.search(text)
if not loc_m or not mgr_m:
    raise SystemExit('Required Districts/Managers blocks not found')

loc_block = loc_m.group(1)
mgr_block = mgr_m.group(1)

# Use placeholders so the two complete blocks are only repositioned, not modified.
text = text.replace(loc_block, '\n__TMV_LOCATIONS_BLOCK__\n', 1)
text = text.replace(mgr_block, '\n__TMV_MANAGERS_BLOCK__\n', 1)
text = text.replace('\n__TMV_LOCATIONS_BLOCK__\n', mgr_block, 1)
text = text.replace('\n__TMV_MANAGERS_BLOCK__\n', loc_block, 1)

# Verify Setup order is now Equipment -> Managers -> Technicians -> Districts.
setup_start = text.index('<!-- TMV UNITS -->')
inspect = text[setup_start:text.index('<!-- INSPECTION SETTINGS -->', setup_start)]
order = [inspect.index('<!-- TMV UNITS -->'), inspect.index('<!-- MANAGERS -->'), inspect.index('<!-- TECHNICIANS -->'), inspect.index('<!-- LOCATIONS -->')]
if order != sorted(order):
    raise SystemExit('Unexpected Setup card order after swap')

p.write_text(text)
print('PASS - Districts and Managers swapped without changing block contents')

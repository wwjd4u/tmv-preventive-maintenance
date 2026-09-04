"""Apply only the reviewed layout patch; preserve the host branch and local edits."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess
import tempfile
import time
import urllib.request

SERVICE = 'tmvapp-node.service'
REF = 'origin/tmv-layout-recovery'

def command(*args):
    return subprocess.check_output(args, text=True).strip()

def digest(data):
    return hashlib.sha256(data).hexdigest()

def validate_files(app, entries, payloads):
    for name, info in entries.items():
        if Path(name).name != name:
            raise RuntimeError('Invalid patch filename: ' + name)
        if digest(payloads[name]) != info['after']:
            raise RuntimeError('Downloaded file failed verification: ' + name)
        target = app / name
        if target.is_symlink():
            raise RuntimeError('Stopped at symbolic link: ' + name)
        actual = digest(target.read_bytes()) if target.exists() else None
        if actual not in (info['before'], info['after']):
            raise RuntimeError('Local file differs from the uploaded source: ' + name + '. No files changed; upload the latest source for review.')

def install_file(target, data):
    mode = target.stat().st_mode & 0o777 if target.exists() else 0o644
    fd, temporary = tempfile.mkstemp(prefix='.tmv-update-', dir=target.parent)
    with os.fdopen(fd, 'wb') as output:
        output.write(data)
    os.chmod(temporary, mode)
    os.replace(temporary, target)

def verify():
    for attempt in range(20):
        try:
            with urllib.request.urlopen('http://127.0.0.1:9240/', timeout=3) as response:
                page = response.read().decode()
            with urllib.request.urlopen('http://127.0.0.1:9240/api/config', timeout=3) as response:
                config = json.load(response)
            with urllib.request.urlopen('http://127.0.0.1:9240/work-order-builder.html', timeout=3) as response:
                builder = response.read().decode()
            if 'dispatch.js?v=20260904R3' in page and 'work-order-builder.js?v=20260904R3' in builder and config.get('tmvVanMap'):
                return
        except Exception:
            pass
        time.sleep(1)
    raise RuntimeError('Updated page/API did not become healthy')

def main():
    directory = command('systemctl', 'show', SERVICE, '--property=WorkingDirectory', '--value')
    if not directory:
        raise RuntimeError('Service WorkingDirectory is empty')
    app = Path(directory).resolve()
    revision = command('git', '-C', str(app), 'rev-parse', REF)
    manifest = json.loads(command('git', '-C', str(app), 'show', revision + ':updates/recovery-manifest.json'))
    entries = manifest['files']
    payloads = {name: subprocess.check_output(['git', '-C', str(app), 'show', revision + ':' + name]) for name in entries}
    validate_files(app, entries, payloads)
    launch = command('systemctl', 'show', SERVICE, '--property=ExecStart', '--value')
    match = re.search(r'path=([^ ;}]+)', launch)
    node = match.group(1) if match else shutil.which('node')
    if not node or not Path(node).is_file():
        raise RuntimeError('Cannot identify the service Node executable')
    database = app / 'tmv.db'
    if not database.is_file():
        raise RuntimeError('tmv.db not found; locate the production database first')
    backup = Path.home() / 'tmv-layout-backups' / time.strftime('%Y%m%d-%H%M%S')
    backup.mkdir(parents=True, exist_ok=False)
    originals = {}
    for name in entries:
        target = app / name
        if target.exists():
            originals[name] = target.read_bytes()
            shutil.copy2(target, backup / name)
    (backup / 'git-status.txt').write_text(command('git', '-C', str(app), 'status', '--short', '--branch'))
    (backup / 'source-commit.txt').write_text(command('git', '-C', str(app), 'rev-parse', 'HEAD'))
    with sqlite3.connect(database.as_uri() + '?mode=ro', uri=True) as live:
        with sqlite3.connect(str(backup / 'tmv.db')) as saved:
            live.backup(saved)
            if saved.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                raise RuntimeError('Database backup verification failed')
    stage = backup / 'new-source'
    stage.mkdir()
    for name, data in payloads.items():
        (stage / name).write_bytes(data)
        if name.endswith('.js'):
            subprocess.run([node, '--check', str(stage / name)], check=True)
    subprocess.run(['sudo', '-v'], check=True)
    # Recheck after staging, so edits made during preparation are never lost.
    validate_files(app, entries, payloads)
    print('Verified backup:', backup, flush=True)
    try:
        for name, data in payloads.items():
            install_file(app / name, data)
        subprocess.run(['sudo', 'systemctl', 'restart', SERVICE], check=True)
        verify()
    except Exception:
        for name, data in originals.items():
            install_file(app / name, data)
        subprocess.run(['sudo', 'systemctl', 'restart', SERVICE], check=False)
        print('Original source restored. Database and backup retained. Inspect service status before retrying.')
        raise
    print('Updated page and API verified. Your recovery branch, other local edits, configuration and uploads were preserved.')
    print('Refresh https://tmvapp.local-journal.com/ with Ctrl+Shift+R.')

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        raise SystemExit(str(error))

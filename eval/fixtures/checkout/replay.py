"""Replay one generated skill, not the reference driver. See RUBRIC.md."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
SKILL = Path('.claude/skills/verify-checkout')


def manifest(root):
    files = {}
    for p in sorted(root.rglob('*')):
        if p.is_symlink() or not (p.is_dir() or p.is_file()):
            raise ValueError(f'non-portable skill entry: {p}')
        if p.is_file():
            files[str(p.relative_to(root))] = hashlib.sha256(p.read_bytes()).hexdigest()
    return files


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('workspace', type=Path)
    parser.add_argument('output', type=Path, help='new evidence directory')
    args = parser.parse_args()
    source = args.workspace / SKILL
    files = manifest(source)
    if not {'SKILL.md', 'run.sh'} <= files.keys():
        parser.error('generated skill missing SKILL.md or run.sh')
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=False)
    frozen = out / 'skill'
    shutil.copytree(source, frozen)
    (out / 'manifest.json').write_text(json.dumps(files, indent=2))
    matches = True
    for variant in ('good', 'duplicate', 'stale'):
        with tempfile.TemporaryDirectory(prefix='checkout-') as tmp:
            ws = Path(tmp) / 'repo'
            subprocess.run(['sh', HERE / 'setup.sh', ws, variant], check=True)
            shutil.copytree(frozen, ws / SKILL)
            assert manifest(ws / SKILL) == files
            with (out / f'{variant}.log').open('w') as log:
                proc = subprocess.Popen(['sh', SKILL / 'run.sh'], cwd=ws, stdout=log,
                                        stderr=subprocess.STDOUT, start_new_session=True)
                try:
                    code = proc.wait(timeout=180)
                except subprocess.TimeoutExpired:
                    code = 'timeout'
                finally:
                    try:
                        os.killpg(proc.pid, signal.SIGKILL)
                    except ProcessLookupError:
                        pass
                    proc.wait()
            unchanged = manifest(ws / SKILL) == files
            ok = unchanged and isinstance(code, int) and code >= 0 and ((code == 0) == (variant == 'good'))
            result = dict(exit=code, unchanged=unchanged, exit_pattern_matches=ok)
            (out / f'{variant}.json').write_text(json.dumps(result))
            print(variant, result)
            matches &= ok
    return 0 if matches else 1


if __name__ == '__main__':
    raise SystemExit(main())

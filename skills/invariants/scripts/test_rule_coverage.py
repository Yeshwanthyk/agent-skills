"""Config coverage must fail before invoking everystate. No toolchain required."""
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
EXAMPLE = HERE.parent / 'assets/tla/giftcard'
BASE = (EXAMPLE / 'GiftCard.cfg').read_text()


class RuleCoverage(unittest.TestCase):
    def reject(self, baseline, *args, fix=None, diagnostic):
        with tempfile.TemporaryDirectory() as folder:
            cwd = Path(folder)
            (cwd / 'GiftCard.tla').write_bytes((EXAMPLE / 'GiftCard.tla').read_bytes())
            (cwd / 'GiftCard.cfg').write_text(baseline)
            if fix is not None:
                (cwd / 'Fixed.cfg').write_text(fix)
                args += ('--fix', 'Fixed.cfg')
            engine = cwd / 'engine'
            engine.write_text('#!/bin/sh\ntouch engine-called\nexit 99\n')
            engine.chmod(0o755)
            run = subprocess.run([sys.executable, HERE / 'tla_chart.py', 'run', 'GiftCard.tla', *args],
                                 cwd=cwd, env={**os.environ, 'EVERYSTATE': str(engine)},
                                 capture_output=True, text=True)
            self.assertNotEqual(run.returncode, 0)
            self.assertFalse((cwd / 'engine-called').exists(), 'ran checker on incomplete inventory')
            self.assertNotIn('unrecognized arguments', run.stderr)
            self.assertNotIn('Traceback', run.stderr)
            self.assertRegex(run.stdout + run.stderr, diagnostic)

    def test_deadlock_alone_is_not_coverage(self):
        self.reject(BASE.replace('INVARIANT NoDoubleCredit', ''), diagnostic=r'(?i)rule|invariant|property')

    def test_earlier_required_rule_is_not_lost(self):
        self.reject(BASE, '--require-rule', 'EventuallyDone', '--require-rule', 'NoDoubleCredit',
                    diagnostic='EventuallyDone')

    def test_fix_cannot_disable_baseline_deadlock_check(self):
        self.reject(BASE, fix=BASE + '\nCHECK_DEADLOCK FALSE\n', diagnostic='deadlock')

    def test_stale_override_cannot_run(self):
        with tempfile.TemporaryDirectory() as folder:
            engine = Path(folder) / 'engine'
            engine.write_text('#!/bin/sh\necho everystate 0.3.1\n')
            engine.chmod(0o755)
            run = subprocess.run([sys.executable, HERE / 'tla_chart.py', 'engine'],
                                 env={**os.environ, 'EVERYSTATE': str(engine)}, capture_output=True, text=True)
            self.assertEqual(run.returncode, 3)
            self.assertIn('SETUP NEEDED', run.stderr)

    def test_fix_cannot_silently_drop_a_baseline_property(self):
        self.reject(BASE + '\nPROPERTY EventuallyDone\n', '--require-rule', 'NoDoubleCredit',
                    fix=BASE, diagnostic='EventuallyDone')


if __name__ == '__main__':
    unittest.main()

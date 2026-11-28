"""Run directly with the pinned EveryState available; no product or browser code."""
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
RUNNER = HERE.parents[2] / 'scripts/tla_chart.py'
RULES = ('OneCharge', 'TruthfulView', 'ReloadCompletes')
WITNESSES = ('NoOverlap', 'NoLostRetryReload', 'NoSecondOrder')


class Checkout(unittest.TestCase):
    def check(self, config='Checkout', mutation=None, witnesses=(), broken=()):
        spec = (HERE / 'Checkout.tla').read_text()
        if mutation:
            old, new = mutation
            self.assertEqual(spec.count(old), 1)
            spec = spec.replace(old, new)
        cfg = (HERE / (config + '.cfg')).read_text()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'Checkout.tla').write_text(spec)
            if witnesses:
                cfg += 'INVARIANTS ' + ' '.join(witnesses) + '\n'
            (root / 'Checkout.cfg').write_text(cfg)
            args = [sys.executable, RUNNER, 'run', 'Checkout.tla']
            for rule in (*RULES, *witnesses):
                args.extend(['--require-rule', rule])
            p = subprocess.run(args, cwd=root, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            print(p.stdout, flush=True)
            self.assertEqual(p.returncode, int(bool(broken)), p.stdout)
            for rule in (*RULES, 'deadlock', *witnesses):
                outcome = r'broken, [1-9]\d* steps' if rule in broken else 'holds'
                self.assertRegex(p.stdout, rf'(?m)^  {rule}: {outcome}$')

    def test_reachable_stories_and_guarantees(self):
        for config in ('Checkout', 'Expanded'):
            with self.subTest(config=config):
                self.check(config, witnesses=WITNESSES, broken=WITNESSES)

    def test_mutants(self):
        mutants = {
            'OneCharge': ('![order[t]] = 1', '![order[t]] = @ + 1'),
            'TruthfulView': ('IF charges[order[t]] > 0', 'IF charges[order[t]] = 0'),
            'ReloadCompletes': ('Recover(t) == /\\ ui[t] = "loading"', 'Recover(t) == /\\ FALSE /\\ ui[t] = "loading"'),
        }
        for rule, mutation in mutants.items():
            with self.subTest(rule=rule):
                self.check(mutation=mutation, broken=(rule,))


if __name__ == '__main__':
    unittest.main()

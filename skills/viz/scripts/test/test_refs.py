#!/usr/bin/env python3
"""Exercise citation checks through the real CLI. Run: python3 skills/viz/scripts/test/test_refs.py"""
import pathlib
import subprocess
import tempfile
import unittest

REPO = pathlib.Path(__file__).resolve().parents[4]
SCRIPT = REPO / "skills/viz/scripts/viz.py"
FIXTURES = pathlib.Path(__file__).parent


def run(*args, cwd=REPO):
    return subprocess.run(["python3", str(SCRIPT), "check", *map(str, args)],
                          cwd=cwd, capture_output=True, text=True)


class RefTests(unittest.TestCase):
    def check_text(self, text, evidence="", args=()):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / "evidence.txt").write_text(evidence)
            src = root / "test.viz"
            src.write_text(text)
            return run("--refs", *args, src, cwd=root)

    def test_real_fixtures_and_explicit_root(self):
        with tempfile.TemporaryDirectory() as elsewhere:
            good = run("--refs", "--root", REPO, FIXTURES / "refs-good.viz", cwd=elsewhere)
            bad = run("--refs", "--root", REPO, FIXTURES / "refs-bad.viz", cwd=elsewhere)
        self.assertEqual(good.returncode, 0, good.stderr + good.stdout)
        self.assertIn("refs: 6 checked, 0 errors, 0 fragment warnings", good.stdout)
        self.assertNotIn("should be ?", good.stdout)
        self.assertEqual(bad.returncode, 1, bad.stderr + bad.stdout)
        self.assertIn("line 999999 beyond file length", bad.stdout)
        self.assertIn("file missing", bad.stdout)
        self.assertIn("node bad_line (Broken): should be ?", bad.stdout)
        self.assertNotIn("node missing (Broken): should be ?", bad.stdout)
        self.assertIn("2 errors", bad.stdout)

    def test_widening_is_exactly_five_lines(self):
        evidence = "\n".join(f"line_{n};" for n in range(1, 21))
        good = self.check_text("== graph Window\na: A @evidence.txt:8\n  does: `line_3;` and `line_13;`\n", evidence)
        bad = self.check_text("== graph Window\na: A @evidence.txt:8\n  does: `line_2;` and `line_14;`\n", evidence)
        self.assertEqual(good.returncode, 0)
        self.assertNotIn("warning:", good.stdout)
        self.assertEqual(bad.returncode, 0, bad.stdout)
        self.assertIn("missing fragment `line_2;`", bad.stdout)
        self.assertIn("missing fragment `line_14;`", bad.stdout)
        self.assertIn("node a (Window): should be ?", bad.stdout)

    def test_clamps_and_quote_whitespace_normalization(self):
        result = self.check_text('== graph Bounds\na: A @evidence.txt:1-2\n'
                                 '  does: `value = "x";`\n  note: `end;`\n'
                                 'b: B @evidence.txt:10\n  writes: `padding_10;`\n',
                                 "value='x';\nend;\n" + "\n".join(f"padding_{n};" for n in range(3, 11)))
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertNotIn("warning:", result.stdout)

    def test_whole_file_and_uncertain_fragment_warning(self):
        result = self.check_text("== graph Whole\n?a: A @evidence.txt\n  reads: `far_away;`\n"
                                 "  fails: `nonexistent;`\n", "\n" * 20 + "far_away;\n")
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertNotIn("missing fragment `far_away;`", result.stdout)
        self.assertIn("missing fragment `nonexistent;`", result.stdout)
        self.assertNotIn("should be ?", result.stdout)

    def test_node_and_edge_detail_refs(self):
        result = self.check_text("== graph Extra\na: A @evidence.txt:1\n"
                                 "  ref: absent-node.txt:1\n  ref: absent-other.txt:1\n"
                                 "b: B\na -> b\n  ref: absent-edge.txt:1\n", "existing\n")
        self.assertEqual(result.returncode, 1)
        self.assertIn("refs: 4 checked, 3 errors", result.stdout)
        for path in ("absent-node.txt", "absent-other.txt", "absent-edge.txt"):
            self.assertIn(path, result.stdout)
        self.assertEqual(result.stdout.count("node a (Extra): should be ?"), 1)
        self.assertNotIn("edge a -> b (Extra): should be ?", result.stdout)

    def test_range_end_and_invalid_ranges(self):
        for ref in ("evidence.txt:1-3", "evidence.txt:0", "evidence.txt:2-1"):
            with self.subTest(ref=ref):
                result = self.check_text(f"== graph Invalid\na: A @{ref}\n", "one\ntwo\n")
                self.assertEqual(result.returncode, 1, result.stdout)
                self.assertIn("error: node a", result.stdout)

    def test_sub_metadata_is_not_a_ref_and_parse_errors_still_fail(self):
        good = self.check_text("sub @1a2b3c4\n== graph Empty\na: A\n")
        bad = self.check_text("== graph Invalid\nnot a node or edge\n")
        self.assertEqual(good.returncode, 0, good.stdout)
        self.assertIn("refs: 0 checked", good.stdout)
        self.assertEqual(bad.returncode, 1)
        self.assertIn("line 2: not a node", bad.stdout)


if __name__ == "__main__":
    unittest.main()

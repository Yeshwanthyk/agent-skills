from __future__ import annotations

import importlib.util
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MIGRATION_PLAYBOOK_IDS = (
    "autonomous-run",
    "orchestrate",
    "pause-safely",
    "eval",
    "prototype",
    "hillclimb",
    "perf-issue",
    "runtime-forensics",
    "trace-forensics",
    "visual-parity",
)
MIGRATION_PRINCIPLE_IDS = (
    "simplicity",
    "design-from-usage",
    "model-the-domain",
    "exhaust-the-design-space",
    "attack-the-premise",
    "redesign-from-first-principles",
    "experience-first",
    "boundary-discipline",
    "type-system-discipline",
    "state-ownership",
    "recovery-and-idempotency",
    "migrate-callers",
    "build-the-lever",
    "sequence-verifiable-units",
    "guard-the-context-window",
    "handoffs",
    "prove-it-works",
    "test-behavior",
    "fix-root-causes",
    "evidence-discipline",
    "evidence-lifecycle",
    "encode-lessons-in-structure",
)
MODULE_PATH = ROOT / "scripts/check-skill-routing.py"
SPEC = importlib.util.spec_from_file_location("check_skill_routing", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
CHECKER = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = CHECKER
SPEC.loader.exec_module(CHECKER)


class CheckerRegressionTests(unittest.TestCase):
    def make_target(self) -> Path:
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        root = Path(temp_dir.name)

        for name in ("alpha", "beta"):
            self.write(root / "skills" / name / "SKILL.md", f"# {name}\n")

        self.write(
            root / "skills/yesh-router/SKILL.md",
            "# Router\n\n[methods](methods.md)\n\n[principles](principle-triggers.md)\n\n[contract](classifier-contract.md)\n",
        )
        self.write(root / "skills/yesh-router/classifier-contract.md", "# Contract\n")

        method_lines = ["# Methods", ""]
        method_lines.extend(f"[{name}](../{name}/SKILL.md)" for name in ("alpha", "beta"))
        method_lines.extend(
            f"[{name}](playbooks/{name}.md)" for name in MIGRATION_PLAYBOOK_IDS
        )
        self.write(root / "skills/yesh-router/methods.md", "\n".join(method_lines) + "\n")

        principle_lines = ["# Principle triggers", ""]
        principle_lines.extend(
            f"[{name}](../references/principles/{name}.md)"
            for name in MIGRATION_PRINCIPLE_IDS
        )
        self.write(
            root / "skills/yesh-router/principle-triggers.md",
            "\n".join(principle_lines) + "\n",
        )

        for name in MIGRATION_PLAYBOOK_IDS:
            self.write(root / f"skills/yesh-router/playbooks/{name}.md", f"# {name}\n")
        for name in MIGRATION_PRINCIPLE_IDS:
            self.write(root / f"skills/references/principles/{name}.md", f"# {name}\n")
        for name in CHECKER.SHARED_REFERENCES:
            self.write(root / f"skills/references/{name}", f"# {name}\n")
        return root

    @staticmethod
    def write(path: Path, content: str) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    @staticmethod
    def errors(root: Path) -> list[str]:
        return CHECKER.collect_errors(root)

    def test_complete_target_shape_passes(self) -> None:
        root = self.make_target()
        self.assertEqual([], self.errors(root))

    def test_catalog_is_derived_from_actual_skill_files(self) -> None:
        root = self.make_target()
        self.write(root / "skills/gamma/SKILL.md", "# gamma\n")
        errors = self.errors(root)
        self.assertTrue(any("omits actual target: skills/gamma/SKILL.md" in error for error in errors))

    def test_retired_router_entrypoint_fails(self) -> None:
        root = self.make_target()
        self.write(
            root / "skills/yesh-mode/SKILL.md",
            "# Retired pointer\n\n[router](../yesh-router/SKILL.md)\n",
        )
        errors = self.errors(root)
        self.assertTrue(
            any(
                "retired-router-paths-forbidden" in error
                and "skills/yesh-mode" in error
                for error in errors
            )
        )

    def test_empty_retired_router_directory_fails(self) -> None:
        root = self.make_target()
        (root / "skills/yesh-mode").mkdir()
        errors = self.errors(root)
        self.assertTrue(any("Retired router path exists" in error for error in errors))

    def test_link_to_retired_router_path_fails(self) -> None:
        root = self.make_target()
        self.write(
            root / "skills/alpha/legacy-link.md",
            "[old router](../yesh-mode/SKILL.md)\n",
        )
        errors = self.errors(root)
        self.assertTrue(any("stale moved path" in error for error in errors))
        self.assertTrue(any("missing target ../yesh-mode/SKILL.md" in error for error in errors))

    def test_legacy_copy_fails_even_if_it_resolves(self) -> None:
        root = self.make_target()
        self.write(root / "skills/yesh-mode/playbooks/autonomous-run.md", "# old\n")
        errors = self.errors(root)
        self.assertTrue(
            any(
                "retired-router-paths-forbidden" in error
                and "skills/yesh-mode" in error
                for error in errors
            )
        )

    def test_replaced_shared_reference_fails(self) -> None:
        root = self.make_target()
        self.write(root / "skills/references/agent-routing.md", "# old\n")
        errors = self.errors(root)
        self.assertTrue(any("agent-routing.md" in error for error in errors))

    def test_classifier_contract_cannot_be_a_catalog_entry(self) -> None:
        root = self.make_target()
        with (root / "skills/yesh-router/methods.md").open("a", encoding="utf-8") as handle:
            handle.write("[classifier](classifier-contract.md)\n")
        errors = self.errors(root)
        self.assertTrue(any("docs-only classifier-contract.md" in error for error in errors))

    def test_principle_trigger_coverage_is_checked(self) -> None:
        root = self.make_target()
        path = root / "skills/yesh-router/principle-triggers.md"
        content = path.read_text(encoding="utf-8")
        content = content.replace(
            "[simplicity](../references/principles/simplicity.md)\n", ""
        )
        path.write_text(content, encoding="utf-8")
        errors = self.errors(root)
        self.assertTrue(any("omits shared principle" in error for error in errors))

    def test_missing_markdown_target_fails(self) -> None:
        root = self.make_target()
        with (root / "skills/yesh-router/SKILL.md").open("a", encoding="utf-8") as handle:
            handle.write("[missing](../missing/SKILL.md)\n")
        errors = self.errors(root)
        self.assertTrue(any("missing target ../missing/SKILL.md" in error for error in errors))

    def test_discovered_playbook_and_principle_with_pointers_pass(self) -> None:
        root = self.make_target()
        self.write(root / "skills/yesh-router/playbooks/discovered.md", "# discovered\n")
        self.write(root / "skills/references/principles/discovered.md", "# discovered\n")
        with (root / "skills/yesh-router/methods.md").open("a", encoding="utf-8") as handle:
            handle.write("[discovered](playbooks/discovered.md)\n")
        with (root / "skills/yesh-router/principle-triggers.md").open("a", encoding="utf-8") as handle:
            handle.write("[discovered](../references/principles/discovered.md)\n")
        self.assertEqual([], self.errors(root))

    def test_discovered_playbook_and_principle_without_pointers_fail(self) -> None:
        root = self.make_target()
        self.write(root / "skills/yesh-router/playbooks/discovered.md", "# discovered\n")
        self.write(root / "skills/references/principles/discovered.md", "# discovered\n")
        errors = self.errors(root)
        self.assertTrue(any("omits actual target: skills/yesh-router/playbooks/discovered.md" in error for error in errors))
        self.assertTrue(any("omits shared principle: skills/references/principles/discovered.md" in error for error in errors))

    def test_reference_style_links_are_checked(self) -> None:
        root = self.make_target()
        self.write(
            root / "skills/alpha/reference-links.md",
            "[valid][skill]\n[skill]: SKILL.md\n[missing][target]\n[target]: missing.md\n",
        )
        errors = self.errors(root)
        self.assertTrue(any("missing target missing.md" in error for error in errors))

    def test_reference_style_stale_paths_are_checked(self) -> None:
        root = self.make_target()
        self.write(
            root / "skills/alpha/reference-links.md",
            "[old][routing]\n[routing]: ../references/agent-routing.md\n",
        )
        errors = self.errors(root)
        self.assertTrue(any("stale moved path" in error for error in errors))

    def test_common_link_syntax_and_code_exclusions_are_supported(self) -> None:
        root = self.make_target()
        self.write(root / "skills/alpha/space file.md", "# target\n")
        self.write(root / "skills/alpha/dir/file_(v1).md", "# target\n")
        self.write(
            root / "skills/alpha/link-syntax.md",
            "[space](<space file.md> \"title\")\n"
            "[balanced](dir/file_(v1).md 'title')\n"
            "`[ignored](not-there.md)`\n"
            "```\n[ignored](also-not-there.md)\n```\n",
        )
        self.assertEqual([], self.errors(root))

    def test_unsupported_local_link_syntax_fails_clearly(self) -> None:
        root = self.make_target()
        self.write(root / "skills/alpha/link-syntax.md", "[bad](space file.md)\n")
        errors = self.errors(root)
        self.assertTrue(any("invalid inline link" in error for error in errors))
        self.assertTrue(any("angle brackets" in error for error in errors))

    def test_checker_does_not_require_brittle_prose(self) -> None:
        root = self.make_target()
        self.write(
            root / "skills/yesh-router/SKILL.md",
            "# Any heading is acceptable\n\n[methods](methods.md)\n[principles](principle-triggers.md)\n",
        )
        self.assertEqual([], self.errors(root))


@unittest.skipUnless(
    os.environ.get("YESH_ROUTER_MIGRATION_ACCEPTANCE") == "1",
    "run the opt-in router migration acceptance gate",
)
class MigrationAcceptanceTests(unittest.TestCase):
    def test_repository_keeps_the_migration_inventory(self) -> None:
        playbooks = sorted((ROOT / "skills/yesh-router/playbooks").glob("*.md"))
        principles = sorted((ROOT / "skills/references/principles").glob("*.md"))
        self.assertEqual(10, len(playbooks))
        self.assertEqual(set(MIGRATION_PLAYBOOK_IDS), {path.stem for path in playbooks})
        self.assertEqual(22, len(principles))
        self.assertEqual(set(MIGRATION_PRINCIPLE_IDS), {path.stem for path in principles})


class RoutingFixtureTests(unittest.TestCase):
    def test_fixture_has_behavioral_assertions_for_both_variants(self) -> None:
        path = ROOT / "tests/routing-cases.json"
        payload = json.loads(path.read_text(encoding="utf-8"))
        self.assertEqual([], CHECKER.validate_routing_cases(payload))
        self.assertEqual(
            {
                "baseline": "yesh-mode/SKILL.md",
                "revised": "yesh-router/SKILL.md",
            },
            payload["comparison"]["variant_entrypoints"],
        )
        for case in payload["cases"]:
            self.assertNotIn("yesh-mode", json.dumps(case["expected"]["revised"]))
        ids = {case["id"] for case in payload["cases"]}
        self.assertTrue(
            {
                "explicit-how",
                "explicit-multiple",
                "tiny-direct",
                "how",
                "why",
                "recall",
                "shaping",
                "architect",
                "plan",
                "diagnose-without-fix",
                "midtask-objective",
                "quoted-skill-name",
                "adversarial-skill-name",
                "unrequested-explicit-only",
                "post-inspection-principles",
                "classifier-disabled",
                "classifier-timeout",
                "classifier-unknown",
                "classifier-stale",
                "classifier-malformed",
                "classifier-incomplete",
                "classifier-abstain",
                "explicit-bypass",
                "permission-denied",
            }.issubset(ids)
        )
        states = {case["classifier"]["state"] for case in payload["cases"] if "classifier" in case}
        self.assertTrue(
            {"disabled", "timeout", "unknown", "stale", "malformed", "incomplete", "abstain"}.issubset(states)
        )

    def test_fixture_rejects_label_only_cases(self) -> None:
        path = ROOT / "tests/routing-cases.json"
        payload = json.loads(path.read_text(encoding="utf-8"))
        del payload["cases"][0]["expected"]["revised"]["actions"]
        errors = CHECKER.validate_routing_cases(payload)
        self.assertTrue(any("missing actions" in error for error in errors))

    def test_fixture_rejects_vacuous_assertions(self) -> None:
        path = ROOT / "tests/routing-cases.json"
        payload = json.loads(path.read_text(encoding="utf-8"))
        payload["cases"][0]["expected"]["revised"]["actions"] = {"contains": []}
        errors = CHECKER.validate_routing_cases(payload)
        self.assertTrue(any("actions.contains must not be empty" in error for error in errors))

    def test_fixture_rejects_different_inputs_for_variants(self) -> None:
        path = ROOT / "tests/routing-cases.json"
        payload = json.loads(path.read_text(encoding="utf-8"))
        payload["cases"][0]["compare"]["same_input"] = False
        errors = CHECKER.validate_routing_cases(payload)
        self.assertTrue(any("same_input must be true" in error for error in errors))

    def test_fixture_rejects_retired_router_in_revised_expectations(self) -> None:
        path = ROOT / "tests/routing-cases.json"
        payload = json.loads(path.read_text(encoding="utf-8"))
        payload["cases"][0]["expected"]["revised"]["loaded_files"] = {
            "contains": ["yesh-mode/SKILL.md"]
        }
        errors = CHECKER.validate_routing_cases(payload)
        self.assertTrue(any("retired yesh-mode router" in error for error in errors))


if __name__ == "__main__":
    unittest.main()

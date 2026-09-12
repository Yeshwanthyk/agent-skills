import tempfile
import unittest
from pathlib import Path

from validate_explainer import validate


class ValidatorTests(unittest.TestCase):
    def check_html(self, body="", script="", css=""):
        html = f'<!doctype html><html><head><title>Test</title><style>{css}</style></head><body><button>Next</button>{body}<script>{script}</script></body></html>'
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "test.html"
            path.write_text(html)
            return validate(path)

    def test_prose_and_code_samples_are_not_calls(self):
        self.assertEqual(self.check_html('<p>fetch the result</p><code>fetch(url)</code>', 'const label = "fetch(url)"; // fetch(url)'), [])

    def test_network_calls(self):
        for call in ('fetch("/api")', 'new XMLHttpRequest()', 'new WebSocket("wss://example.com")'):
            self.assertIn("runtime network dependency", self.check_html(script=call))

    def test_relative_assets(self):
        for asset in ('<script src="app.js"></script>', '<img src="pic.png">', '<link href="theme.css" rel="stylesheet">'):
            self.assertTrue(any(error.startswith("external asset") for error in self.check_html(asset)))

    def test_embedded_assets(self):
        self.assertEqual(self.check_html('<img src="data:image/png;base64,AA==">', css='a {background: url("data:image/png;base64,AA==")}'), [])

    def test_css_dependencies(self):
        for css in ('a {background: url(pic.png)}', '@import "theme.css";'):
            self.assertIn("external CSS asset", self.check_html(css=css))

    def test_json_script_is_data(self):
        self.assertEqual(self.check_html('<script type="application/json">{"example":"fetch(url)"}</script>'), [])

    def test_existing_structural_checks(self):
        errors = self.check_html('<button aria-controls="missing">Go</button><div id="x"></div><div id="x"></div>')
        self.assertIn("aria-controls target #missing is missing", errors)
        self.assertIn("duplicate id #x", errors)


if __name__ == "__main__":
    unittest.main()

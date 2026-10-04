"""Run with python3 test_sequences.py. Exercises authoring and offline embedding."""
import base64
import copy
import json
from pathlib import Path
import tempfile
import unittest

from render import render


class SequenceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.svg = self.root / 'frame.svg'
        self.svg.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><text x="20" y="40">A frame</text></svg>')
        self.model = {'states': [
            {'title': 'Shared path', 'image': 'frame.svg', 'alt': 'Two builds share a path.',
             'explanation': 'Both write to `output.zip`.', 'question': {'prompt': 'Separate processes?', 'answer': 'The path is still shared.'}},
            {'title': 'Separate paths', 'image': 'frame.svg', 'alt': 'Each build has a path.',
             'explanation': 'Separate destinations.', 'code': '<script>literal</script>', 'language': 'text',
             'source': 'https://example.org/design'}
        ]}
        self.article = {'title': 'Build destinations', 'summary': 'An illustrative design.', 'date': '2026-09-30',
                        'intro': [], 'sections': [{'heading': 'What changes?', 'blocks': [{'sequence': 'sequence.json', 'caption': 'Compare the paths.'}]}]}

    def page(self):
        (self.root / 'sequence.json').write_text(json.dumps(self.model))
        return render(self.article, self.root)

    def test_offline_content_and_literal_code(self):
        page = self.page()
        self.assertIn('src="data:image/svg+xml;base64,', page)
        self.assertIn('&lt;script&gt;literal&lt;/script&gt;', page)
        self.assertIn('<details data-sequence-transcript open>', page)
        self.assertIn('data-sequence-question', page)
        self.assertIn('href="https://example.org/design"', page)
        self.assertNotIn('<script>literal</script>', page)

    def test_multiple_figures_have_independent_control_targets(self):
        self.article['sections'][0]['blocks'].append(copy.deepcopy(self.article['sections'][0]['blocks'][0]))
        page = self.page()
        for ident in ('sequence-1-stage', 'sequence-2-stage'):
            self.assertEqual(page.count(f'id="{ident}"'), 1)
            self.assertIn(f'aria-controls="{ident}"', page)

    def test_svg_embeds_relative_raster(self):
        # Valid one-pixel PNG; no imaging dependency is required by the renderer.
        png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4l8AAAAASUVORK5CYII=')
        (self.root / 'pixel.png').write_bytes(png)
        self.svg.write_text('<svg xmlns="http://www.w3.org/2000/svg"><image href="pixel.png"/></svg>')
        page = self.page()
        encoded = page.split('data:image/svg+xml;base64,', 1)[1].split('"', 1)[0]
        self.assertIn(b'data:image/png;base64,', base64.b64decode(encoded))

    def test_paths_cannot_escape_article_directory(self):
        for name in ('../frame.svg', str(self.svg.resolve()), 'https://example.org/frame.svg'):
            with self.subTest(name=name):
                self.model['states'][0]['image'] = name
                with self.assertRaises((ValueError, OSError)):
                    self.page()
        with tempfile.TemporaryDirectory() as other:
            outside = Path(other) / 'outside.svg'
            outside.write_text(self.svg.read_text())
            (self.root / 'link.svg').symlink_to(outside)
            self.model['states'][0]['image'] = 'link.svg'
            with self.assertRaises(ValueError):
                self.page()

    def test_nonstatic_and_external_svg_dependencies_are_rejected(self):
        cases = ('<script/>', '<foreignObject/>', '<animate/>', '<rect onclick="run()"/>',
                 '<image href="https://example.org/image.png"/>', '<style>@import "https://example.org/a.css";</style>',
                 '<rect fill="url(https://example.org/paint.svg)"/>', '<use href="outside.svg#node"/>')
        for payload in cases:
            with self.subTest(payload=payload):
                self.svg.write_text(f'<svg xmlns="http://www.w3.org/2000/svg">{payload}</svg>')
                with self.assertRaises((ValueError, OSError)):
                    self.page()

    def test_invalid_models_fail_before_delivery(self):
        original = copy.deepcopy(self.model)
        cases = [dict(original, interval_ms=True), dict(original, interval_ms=100), dict(original, states=original['states'][:1]),
                 dict(original, unexpected='no')]
        for model in cases:
            with self.subTest(model=model):
                self.model = model
                with self.assertRaises(ValueError):
                    self.page()
        self.model = original
        self.model['states'][0]['source'] = 'javascript:alert(1)'
        with self.assertRaises(ValueError):
            self.page()

    def test_fragment_paints_remain_available(self):
        self.svg.write_text('<svg xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid"/></defs><rect fill="url(#grid)"/></svg>')
        self.assertIn('data:image/svg+xml;base64,', self.page())

    def test_plain_article_needs_no_sequence_assets(self):
        self.article['sections'][0]['blocks'] = ['An ordinary paragraph.']
        page = render(self.article)
        self.assertIn('An ordinary paragraph.', page)
        self.assertNotIn('data-sequence-stage', page)
        self.assertNotIn('sequence-settle', page)


if __name__ == '__main__':
    unittest.main()

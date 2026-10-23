# Focused HTML visual

Use one self-contained HTML file for a visual UI, layout, state comparison, or concept too dense for viz.

Draw any flow, sequence, state machine, or tree on the page with [viz](../../viz/SKILL.md): embed its renderer and `<script type="text/viz">` blocks so the diagram stays interactive. Never use Mermaid.

- Choose one form: diagram, infographic, comparison, or short slide deck.
- For a product UI or mockup, match the product's colors, type, spacing, components, and real labels when the source exposes them. Otherwise use the explainer look rather than inventing a style: monospace, 1px hairline boxes, `--bg #0a0a0a`, `--ink #e9e6e1`, `--dim #8a857e`, `--faint #57534e`, and amber `#e6b04f` for active, coral `#e0736a` for failure, green `#9cc48a` for healthy. When the host's inline tool supplies the page background, leave the page background to it.
- Use representative data.
- Support desktop and mobile when the product does.
- Keep the file focused on the current question.
- Publish it through the host's inline HTML tool when one exists: preview, then render, following the tool's own layout notes. Otherwise show it the host's way ([Pi](../../yesh-router/references/hosts/pi.md)), or return the path and state that it was not displayed.

The artifact is complete when it opens without external setup and the visual answers the named question.

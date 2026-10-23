# Focused HTML visual

Use one self-contained HTML file for a visual UI, layout, state comparison, or concept too dense for Mermaid.

A Mermaid diagram on any page renders with [Pele](https://pele.run), never Mermaid.js: it draws synchronously, so a preview screenshot shows the diagram, not its source. Put the source in `<pre class="mermaid">` and add, after it:

```html
<script type="module">
import {render} from 'https://cdn.jsdelivr.net/npm/pele@1.9.0/+esm';
for (const el of document.querySelectorAll('pre.mermaid')) el.innerHTML = render(el.textContent).svg;
</script>
```

Theme it through the `--pele-bg`, `--pele-fg`, `--pele-muted`, `--pele-line`, `--pele-surface`, `--pele-surface-alt`, and `--pele-border` CSS variables.

- Choose one form: diagram, infographic, comparison, or short slide deck.
- For a product UI or mockup, match the product's colors, type, spacing, components, and real labels when the source exposes them. Otherwise use the explainer look: take the type, hairline boxes, and accent colors from [starter.html](../../interactive-explainer/assets/starter.html) (monospace, amber for active, coral for failure, green for healthy) instead of inventing a style. When the host's inline tool supplies the page background, leave the page background to it.
- Use representative data.
- Support desktop and mobile when the product does.
- Keep the file focused on the current question.
- Publish it through the host's inline HTML tool when one exists: preview, then render, following the tool's own layout notes. Otherwise show it the host's way ([Pi](../../yesh-router/references/hosts/pi.md)), or return the path and state that it was not displayed.

The artifact is complete when it opens without external setup and the visual answers the named question.

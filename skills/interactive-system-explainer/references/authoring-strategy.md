# Authoring Strategy

Use this when the explainer will exceed about 1000 lines or 6 tabs.

1. Write `<head>`, `<style>`, tab nav, and empty `section.tab` shells first.
2. Append HTML for sections 01-04, then validate.
3. Append sections 05-08, then validate.
4. Append sections 09-12, then validate.
5. Append `<script>` in chunks: state + tabs, sequence player, DAG/meter/cut-points, scenarios.
6. Validate after each chunk: script/style counts, tab count, brace/paren balance, and `node --check`.
7. Final pass: syntax, structure, HTTP 200, dual-theme visual check, contrast spot check.

Use the host editor's safe patch mechanism for each chunk so failures stay local.

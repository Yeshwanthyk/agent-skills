# Validation ritual

A 1500–2000 line single-file explainer is too large to eyeball. Run all four checks every time. They take seconds; missing them ships broken pages.

## 1. Syntax + structure

```bash
python3 - <<'PY'
import re, sys
path = '/tmp/<name>-explainer.html'
html = open(path).read()
m = re.search(r'<script>(.*?)</script>', html, re.DOTALL)
if not m:
    print('NO SCRIPT BLOCK FOUND'); sys.exit(1)
open('/tmp/check.js', 'w').write(m.group(1))

print('size:        ', len(html), 'bytes')
print('script tags: ', html.count('<script>'),  '/', html.count('</script>'))
print('style tags:  ', html.count('<style>'),   '/', html.count('</style>'))
print('section.tab: ', len(re.findall(r'<section class="tab', html)))
print('balanced {}: ', html.count('{')==html.count('}'), html.count('{'), html.count('}'))
print('balanced (): ', html.count('(')==html.count(')'), html.count('('), html.count(')'))
PY

node --check /tmp/check.js && echo "JS OK"
```

What to look for:

- **script/style tags balanced 1/1** — extra opens are common when appending in chunks.
- **section.tab count matches your tab nav button count.** Off-by-one means a section was opened but never closed.
- **brace and paren counts equal** — they should match exactly. If they don't, the page may still render but interaction is likely broken.
- **`node --check` passes** — catches the dumb mistakes (`,]`, missing `)`, stray `</script>` inside template strings).

## 2. Locate imbalances

When braces don't match, bisect:

```bash
awk 'BEGIN{b=p=0} { for(i=1;i<=length($0);i++){c=substr($0,i,1);
  if(c=="{")b++; if(c=="}")b--; if(c=="(")p++; if(c==")")p--;}
  if(NR%200==0) printf "line %d: braces=%d parens=%d\n", NR, b, p }' /tmp/<name>-explainer.html
```

The line where the running counter goes wrong-sign is your culprit.

For more targeted searches:

```bash
# show each line with > 4 unbalanced braces
awk '{ b=0; for(i=1;i<=length($0);i++){c=substr($0,i,1);
       if(c=="{")b++; if(c=="}")b--}
       if(b>4||b<-4) printf "%6d: %+d  %s\n", NR, b, substr($0,1,80) }' file.html
```

## 3. Serve and curl

Use one shared local server. Don't spawn a foreground server that blocks the agent.

```bash
PORT=8743
# start server only if not already running on this port
lsof -i :$PORT >/dev/null 2>&1 || \
  (python3 -m http.server $PORT --directory /tmp >/tmp/explainer-server.log 2>&1 &)

curl -s -o /dev/null -w "%{http_code} %{size_download} bytes\n" \
  http://localhost:$PORT/<name>-explainer.html
```

Expect `200 <bytes>`. Anything else (404, partial transfer, 500) means the file is wrong.

## 4. Open / share

```bash
# macOS
open http://localhost:$PORT/<name>-explainer.html

# Optional: copy to Downloads if user asked to share
cp /tmp/<name>-explainer.html ~/Downloads/<name>-explainer.html
```

## 5. Aesthetic check — Engineering Manual

If the explainer ships in the default Engineering Manual aesthetic, run this check. It takes 90 seconds and prevents the page from drifting into generic-dashboard territory.

**Discipline scan** — grep the file. Each should be zero hits, or close to it:

```bash
FILE=/tmp/<name>-explainer.html
grep -nE 'box-shadow' $FILE | grep -v ':\s*none' | head           # must be empty
grep -nE 'border-radius:\s*[1-9]' $FILE | head                     # must be empty (or only the toggle)
grep -nE "font-family:.*(Inter|Roboto|Helvetica|system-ui)" $FILE  # must be empty
grep -nE 'linear-gradient|radial-gradient' $FILE | head            # must be empty
grep -cE '#[0-9a-fA-F]{3,8}' $FILE                                 # one block of hex inside :root + [data-theme="dark"] only
```

A non-zero count on any of the first four is a violation. Fix before shipping.

**Vocabulary scan** — confirm the Engineering Manual signature is actually present:

- [ ] **Title** uses `--font-display` (Departure Mono / Press Start 2P) at 40–64px, ALL-CAPS, cobalt.
- [ ] **Body** uses `--font-body` (Source Serif 4 or fallback serif), justified, with `hyphens: auto`.
- [ ] **UI labels, citations, FIG numbers** use `--font-mono` (IBM Plex Mono).
- [ ] **At least one diagram** uses dashed leader lines with arrowhead markers (search for `marker-end="url(#arrow)"`).
- [ ] **At least one diagram** has a graph-paper background (search for `pattern id="grid-`).
- [ ] **At least one figure** uses vertical FIG marginalia (search for `writing-mode: vertical-rl`).
- [ ] **TOC or section list** uses dot-leader rows (search for `border-bottom: 1px dotted` inside a flex pseudo-element).
- [ ] **At least one section break** uses the hatched divider (search for `rule-hatch` or the inline `data:image/svg+xml` pattern).
- [ ] **First paragraph of the document** has a drop cap (`::first-letter`).
- [ ] **Single accent hue** — grep for OKLCH hue values; cobalt (263) and the brick-red (25) for `--bad` should be the only two non-neutral hues.

If the explainer ships in a different aesthetic (Terminal Native / Editorial Light / Lab Notebook), confirm the one-sentence physical scene was written in the page header or report and that the chosen palette and font stack are internally consistent.

## 6. Dual-theme + contrast spot check

Non-negotiable. The file ships to every kind of OS — both modes must work.

Manual visual scan (open the served file, click the `auto · light · dark` toggle through all three states):

- [ ] **No white-on-white or black-on-black** anywhere. Body text, log entries, citation tags, table cells.
- [ ] **Borders visible** in both modes. A border that disappears means the lightness delta vs surface is too small.
- [ ] **Accents readable** on their own `-bg` tints. Pipeline boxes, log stripes, scenario picker hover.
- [ ] **`.changed` flash** legible in both. Use `oklch(... / 0.18)` not a hardcoded hex.
- [ ] **SVG strokes / Mermaid edges** use tokens, not hex. Otherwise they vanish in the opposite mode.
- [ ] **Toggle persists.** Click `dark`, reload — page comes back dark. Click `auto`, reload — follows OS.
- [ ] **No flash of wrong theme on load.** The boot script must run inline in `<head>` before first paint.

Contrast spot-check (any contrast tool; eyeball OK if you're sure of OKLCH lightness):

```text
--ink   on --bg          ≥ 4.5:1   (body text)
--ink-dim on --surface   ≥ 4.5:1   (secondary text)
--c-accent on --surface  ≥ 3.0:1   (UI components, citation, accent labels)
--c-error on --surface   ≥ 4.5:1   (error / overflow messaging)
```

If any pairing fails: bump `--ink-dim` darker (light) / lighter (dark), or reduce chroma on the accent and lift its lightness one step. **Don't lower contrast to make the design look softer.** Soft is what `--ink-faint` is for, used for non-essential text only.

## 7. Authoring strategy for very large files

Heredoc-append in chunks; validate after each chunk so failures are localised:

```bash
# 1. head + style + tab nav + empty section shells
cat > /tmp/<name>-explainer.html <<'HEAD_EOF'
<!doctype html>… <head>… <style>…</style>…
<nav class="tabs" id="tabs">…</nav>
HEAD_EOF

# 2. each section block
cat >> /tmp/<name>-explainer.html <<'S01_EOF'
<section class="tab active" id="tab-overview">…</section>
S01_EOF

# 3. script in 3–4 chunks
cat >> /tmp/<name>-explainer.html <<'JS1_EOF'
<script>
/* fixtures + tabs + helpers */
JS1_EOF

cat >> /tmp/<name>-explainer.html <<'JS2_EOF'
/* sequence player */
JS2_EOF

cat >> /tmp/<name>-explainer.html <<'JSEND_EOF'
/* scenario simulator + last patches */
</script></body></html>
JSEND_EOF
```

Run validation 1+2 between every chunk. A failed chunk is one append away from a fix; a 1980-line monolith with bad braces somewhere is hours.

## Reporting back

Always close with the verification evidence, not just "done":

```text
Verified:
- node --check on extracted JS → OK
- braces 740/740 · parens 1047/1047 · sections 12 · script 1/1 · style 1/1
- curl: 200 (149886 bytes) at http://localhost:8743/<name>-explainer.html
- copied to ~/Downloads/<name>-explainer.html
```

---
name: motion-explainer
description: Build a narrated, timeline-driven systems explainer (boxes, wires, packets, dotted orbs, callouts, code diffs) as a playable HTML explorer, optionally rendered to MP4 with a local voice. Use for "motion graphic", "explainer video", "animate how X works", "Kit Langton style", or an interactive explainer that should play over time.
---

# Motion Explainer

One `scene.js` drives everything: the same file is a **playable explorer** (scrub, hover to trace, click to inspect, cite source) and a deterministic **video** (every frame is a pure function of time). The engine bakes in the look (near-black, IBM Plex Mono, amber, hairline boxes, grain) so a scene only states the story.

`mx` is `bin/mx` in this skill directory (Node ≥ 22). Run `mx help` for commands, `mx doctor` for tools.

## Modes

- **Playable HTML** (default): `mx build <dir>` writes `<dir>/index.html`, self-contained, with the scene inline between the `mx:scene` marker and `</script>`. Anyone can open it, edit the scene in place, and reload.
- **Video**: `mx build <dir> --video` also writes `<dir>/<dir>.mp4` with narration.
- **Silent**: no `narration.txt` (or `--silent`) gives a timeline with estimated pacing; drive it with numeric times.

## Process

1. **Ground** the story: trace the implementation behind the behaviour, and collect `file:line` cites for every claim the explainer makes.
2. **Write the narration** in `<dir>/narration.txt` following [`STORY.md`](STORY.md): one claim per sentence, concrete nouns the scene can cue on.
3. **Scaffold and stage**: `mx new <dir>` (or `--from=optmem|stop-waits` to start from a full example), then write `scene.js` from [`BLOCKS.md`](BLOCKS.md). Cue every beat to a spoken word (`"collided"`, `"fold+0.5"`), put cites in `inspect`, keep everything on the grid.
4. **Iterate live**: `mx serve <dir>` rebuilds on save; the first build speaks the narration (Kokoro) and times every word (Whistle), cached until the text changes.
5. **Verify**: `mx check <dir>` goes green (no unknown cues, nothing leaves the safe area, no overlaps or overflow). Then `mx sheet <dir>` and look at the contact sheet: each act reads at a glance, and every wire, packet and callout lands while its word is spoken.
6. **Deliver** `mx build <dir>` (plus `--video` when asked). Open the HTML and exercise hover, click and scrub.

## When tools are missing

`mx doctor` names each missing tool and its fix; `mx doctor --install` fetches Playwright and Chromium into `~/.cache/motion-explainer`. The ladder degrades instead of failing: without uv the build is silent with estimated timing; without Whistle, sentence spans are split by word length; without Playwright or ffmpeg you still get the playable HTML.

## Completion

Done when `mx check` is green, the contact sheet shows every act legibly, the HTML plays with working hover, inspect and scrub, every `inspect` claim carries a cite, and the requested outputs (HTML, and MP4 if asked) exist at reported paths.

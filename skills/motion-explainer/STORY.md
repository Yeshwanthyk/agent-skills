# Story

How an explainer reads at speed. The scene shows one thing at a time and the narration names it at that moment.

## Shape

Pick the arc that matches the claim:

- **Bug → fix** (`stop-waits`): *before the fix* (the system, then the race, then the failure in coral) → `rewind` → *after the fix* (same system, the new behaviour, green) → *the code* (diff with one inline note). The rewind is what makes the fix land: the viewer sees the same moment take a different path.
- **Mechanism** (`optmem`): *the parts* → *the first step, slowly* → *the repeat, faster* → *the result*. Show the first fold in full, then let the rest go at pace.
- **Flow** (`starter`): request → each hop → answer back, with packets carrying the payload names.

Two to four acts, one name each. Act names go in the pill: lowercase, two or three words.

## Narration

- One claim per sentence, 8–16 words. 20–35 seconds total is a good length; Whistle hears at most 30 seconds per sentence.
- Say what a domain word means the first time it is spoken, in the viewer's words.
- Use concrete nouns the scene can cue on (*the file*, *the old pid*, *SIGKILL*). Every visual beat needs a word to hang from, and that word should be one unlikely to repeat nearby.
- Use verbs that animate: *reads*, *folds*, *collides*, *sends*, *binds*. Wire a packet to *sends*, a burst to *runs out*, a coral flash to *collided*.
- Kokoro reads symbols literally. Write `service dot json`, and use `[SIGKILL](sig kill)` when the caption should differ from the speech.
- End on the takeaway in the viewer's words, and highlight it (`highlight`).

## Pacing

- Beats land on their word: element entrances at the noun, state changes at the verb. Lead the word by 0.1–0.3s for things that should already be moving when it's said.
- Packets take about 0.9s, so cue them early enough to arrive by the next beat.
- Leave 0.6–1.0s of stillness after each act's key change before the next act starts.
- Use colour for meaning only: amber for active or attention, coral for failure, green for fixed or healthy. Everything else stays ink and dim.

## Layout

- Lay the system out left to right in causal order. Put the live process (orb) on the right, its caller on the left, and shared state (files, caches) on top.
- Keep six to eight blocks on screen at most. Exit what's done before the next act brings new things in.
- Reuse positions across a rewind, so "same place, different outcome" reads instantly.

---
name: unslop
description: Clean AI-sounding prose while preserving meaning, facts, warnings, and the intended voice. Use for reports, logs, docs, skill text, review output, or any prose that feels padded or generic.
---

# Unslop

Clean prose without flattening its voice. This is a prose pass, not code contribution proof or a substitute for testing and review.

## Process

1. Scan the text for the patterns below.
2. Rewrite to preserve meaning, facts, conditions, warnings, and intended tone.
3. Add specific human judgment where the source supports it.
4. Read the result once more and remove anything that still sounds generated.

## Remove these patterns

### Content

- Puffery such as "pivotal moment", "testament to", "evolving landscape", and "deeply rooted".
- Lists of names or publications without the fact that makes them relevant.
- Empty `-ing` phrases such as "highlighting", "ensuring", "reflecting", "showcasing", and "fostering".
- Promotional adjectives such as "vibrant", "breathtaking", "groundbreaking", "renowned", and "stunning".
- Vague attributions such as "experts believe" or "industry reports suggest".
- Formulaic contrasts such as "despite challenges, it continues to thrive".

### Language

- Abstract AI vocabulary such as "additionally", "crucial", "delve", "enhance", "interplay", "intricate", "pivotal", "showcase", "tapestry", and "underscore" when a plain word works.
- Fancy ways to say "is", including "serves as", "stands as", "boasts", and "features".
- "Not just X, but Y" framing. State Y directly.
- Forced groups of three.
- Cycling through synonyms for the same concept. Pick one term and reuse it.
- False ranges such as "from X to Y" when the endpoints are not a meaningful scale.

### Style

- Em dashes. Use a period or comma.
- Mid-sentence colons. Keep colons for lists and examples.
- Boldface on every proper noun or acronym.
- Inline-header lists that restate their labels.
- Title case headings. Use sentence case.
- Decorative emojis.
- Curly quotes. Use straight quotes.

### Communication and filler

- Chatbot phrases such as "I hope this helps", "Let me know if", "Of course", and "Certainly".
- Cutoff disclaimers that apologize for missing information. Find the source or state the gap.
- Sycophantic openings and agreement.
- Filler such as "in order to", "due to the fact that", and "it is important to note that".
- Excessive hedging. Use the strongest claim the evidence supports.
- Generic conclusions. State the next fact or action.

### Jargon and weak sentences

Replace abstract metaphor nouns such as "substrate", "vector", "locus", "nexus", "primitive", "harness", "surface", "scaffolding", "modality", "paradigm", "gold-plating", "ratchet", "evacuate", "endgame", and "north star" with the concrete mechanism when they do not name a real technical term.

Say what the reader needs to know or do. Replace feelings with mechanisms, numbers, or observable effects. Shorten dense sentences. Prefer active voice. Cut adverbs or choose a stronger verb. Use plain words such as "use", "help", "many", and "if".

## Completion

The prose is clean when it preserves the source's meaning and evidence, removes the listed AI patterns that do not serve the text, uses concrete active language, and passes one final read without generic filler, decorative punctuation, or an artificial conclusion.

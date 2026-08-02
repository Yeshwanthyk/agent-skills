---
name: grilling-frontend-prototyping
description: Converge on a frontend look through rounds of prototypes and grilling verdicts. Use when the user wants to iterate on UI/visual taste against concrete variants, or a wayfinder prototype ticket names this skill.
---

# Grilling Frontend Prototyping

Run a `/grilling` session using the `/prototype` skill. Ask each question with prototypes, not words.

- Each round, build five radically different prototypes of the current design question in one live mocked app: one standalone HTML file created with the Artifact tool and updated in place each round.
- Add a floating, bottom-right draggable picker that names each design. Left and right arrow controls switch between designs, restyling the mocked app live. When the design has meaningful states—for example, a full versus empty inbox—add picker controls that toggle between them.
- Walk down the visual design tree through the grilling session. Each verdict zooms in one level: overall design, component groups, then individual components. Continue until the user has designed the entire feature in detail.

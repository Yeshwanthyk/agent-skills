# Research for explanatory depth

Read this before researching a new topic. The goal is to explain a subject well enough that the reader can reason about a new case, not merely recall its features. Depth means supported mechanisms, relationships, causes, and boundaries. More sources or more words are not substitutes.

## 1. Build a question map

Start with the reader's purpose and prior knowledge. Identify the central puzzle: what seems surprising, difficult, consequential, or commonly misunderstood? Write a provisional answer, explicitly as a hypothesis to investigate.

Map the questions needed to explain that answer:

- **Definition:** What exactly is the thing, and what nearby concept is it confused with?
- **Mechanism:** Through what intermediate steps does the claimed result happen?
- **Dependencies:** What must already exist or hold true for it to work?
- **Origins:** What problem or constraint led to this approach? What evidence supports that history?
- **Alternatives:** How else can the same need be met? Under matched conditions, what changes?
- **Boundaries:** Where does the explanation stop working? Who or what bears the cost?
- **Consequences:** What follows from the mechanism that a feature list would miss?
- **Application:** Can the model explain a concrete case, including an awkward one?

When a name denotes both a general idea and particular implementations, separate their claims before researching comparisons.

Select the questions that matter to this topic; these are research lenses, not required article headings. Prioritize gaps by how much answering them could change the central explanation or reader's decision. Background trivia is low priority unless it explains a cause.

## 2. Find evidence suited to the question

Begin with an authoritative overview, then choose an anchor source for each implementation or evidence role. Give every additional source a purpose: an unresolved mechanism, current version, counterevidence, measurement method, or boundary. A page repeating an established claim earns no new research branch.

| Subject | Starting evidence | Deeper checks |
| --- | --- | --- |
| Software or infrastructure | Official docs, versioned source, release notes | Execution paths, tests, issues, protocol specifications, operator incident reports |
| Science | Reviews for orientation, original studies for results | Methods, sample and controls, uncertainty, replications, competing explanations |
| History or institutions | Scholarly synthesis, primary records | Chronology, contemporary accounts, provenance, incentives, historiographical disagreement |
| Economics or policy | Original datasets, policy text, methodological papers | Definitions, denominators, confounders, counterfactuals, distribution of costs and benefits |
| Craft or practical process | Authoritative manuals, practitioner demonstrations | Actual sequence, material constraints, failure cases, differences between novice and expert execution |

Treat source authority as claim-specific. A vendor can document a feature but cannot independently establish that it is the best choice. A primary account can establish what its author reported without establishing an entire historical cause. Multiple pages repeating one press release are one evidentiary origin.

For current subjects, distinguish publication date, event date, and version. Pin moving code references to a commit and inspect the relevant callers: a library contract, host integration, and shipped feature can differ. Use original documentation and research for technical claims. When access is limited, say what the accessible evidence supports; do not turn an abstract, search snippet, or missing document into a full-source finding.

## 3. Work the gaps, not a fixed search count

Use a short loop for each high-value question:

1. State what is known and the specific missing link.
2. Search for that link using the subject's own terms, or inspect the relevant source/method/record.
3. Record the supported answer and its conditions.
4. Ask what could make that answer false, incomplete, or misleading.
5. Seek the strongest relevant counterevidence or alternative explanation.
6. Update the model; follow newly exposed dependencies only when they change the reader's understanding.

Useful targeted queries combine the entity with the unresolved mechanism, a design rationale, a failure report, a methodology, a critique, or an alternative. Do not mechanically run every query type. Follow citations and references when they are more informative than a fresh broad search.

Keep a compact `research.md` with two parts:

- A working model and open questions ordered by importance.
- An evidence ledger: claim ID, finding, source and locator, date/version, status, conditions or counterevidence, and intended section.

Use short paraphrases, not copied pages. Facts live in this ledger once. Revisits should target an unresolved question or a changed source, not reconstruct the same notes. For extensive source material, store local extracts and record precise locators rather than filling the context window.

## 4. Build and challenge the explanatory model

Trace a representative case through the whole mechanism. Write the intermediate links explicitly in notes: A changes B through mechanism C, provided D holds. Avoid skipping from correlation to cause or from a component's existence to a system guarantee.

For capability-bearing software, trace a successful operation and a failure through the host boundary: who authorizes it, what data crosses, what side effect may already have occurred, and what result the caller sees. Mark unverified links explicitly.

Choose the trace that fits the subject: a request and recovery path, an experiment from intervention to measured outcome, an event sequence with actors and constraints, a policy through implementation to affected groups, or a material through a production process.

Then challenge it:

- **Perturbation:** If a key input, assumption, actor, or environment changes, what happens downstream?
- **Boundary case:** Where does this model predict the wrong result or cease to apply?
- **Alternative:** Could another mechanism explain the same observation? What evidence distinguishes them?
- **Scale or time:** Does the result change with population, workload, duration, or historical period?
- **Transfer:** Does the explanation help understand a second case without merely retelling the first?

Select the challenges that could expose a real weakness. Label predictions as deductions unless observed evidence supports them. If direct experimentation would help, propose or run only the smallest relevant authorized check. An explainer request alone does not authorize spending money, deploying infrastructure, contacting people, or altering live systems.

## 5. Reconcile contradictions and calibrate claims

When sources disagree, compare definitions, dates, populations, versions, methods, and incentives before choosing a side. Record whether the disagreement was resolved or remains substantive. Do not average incompatible numbers or silently prefer the convenient source.

For decision-changing quantitative claims, record value/unit, baseline, workload/population, version, measurement method, date, and evidence type in the ledger; explicitly mark missing fields. Distinguish schema footprint, execution cost, latency, and outcome quality before comparing numbers. Recompute important derived comparisons. Distinguish measured findings, source assertions, and your inference in the prose without adding a badge to every sentence.

Mark absence carefully: “not described in the documentation reviewed” is weaker than “does not exist.” A plausible mechanism is not proof that it caused an observed result. Keep causal uncertainty attached to the relevant explanation.

## 6. Decide when research is deep enough

Begin final drafting when:

- The central question has a supported answer, or the uncertainty itself has a clear explanation.
- The important intermediate links in the representative case are evidenced or explicitly bounded.
- The strongest relevant alternative or counterexample has been considered.
- Adoption- or interpretation-changing limits, costs, and assumptions are identified.
- The model explains a practical consequence beyond the source's headline claims.
- Remaining gaps are listed and would not silently overturn the main conclusion.

If a high-impact gap remains, investigate it or narrow the conclusion. If several targeted attempts produce no new evidence, document the search boundary and uncertainty instead of searching indefinitely. Respect the user's time and scope budget; disclose which important questions remain unanswered when it constrains coverage.

## 7. Synthesize, then draft

Organize by the reader's reasoning path, not by source order. Each planned section needs an answer, the evidence behind it, and a connection to the article's central question. Drop sections that supply only trivia or duplicate a prior explanation.

Keep the research apparatus in the notes. The article should read as connected, confident prose where evidence warrants confidence, with uncertainty expressed precisely where it matters. Citations let readers inspect the support; they do not replace the explanation.

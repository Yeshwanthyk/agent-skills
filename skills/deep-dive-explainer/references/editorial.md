# Editorial calibration

Derived from the two reference articles supplied by the user:
- https://flaviocopes.com/celld/ — architecture-led explanation.
- https://flaviocopes.com/exe-dev/ — product-led explanation.

These links identify the references, not evidence for future articles. The supplied snapshots are sufficient to understand the editorial method; fetch live product sources for technical facts.

## What makes the writing work

The opening compresses the subject into tangible things: a named unit, a persistent file, a machine, an address. The article then expands each noun just before the reader needs it. This creates progressive understanding without a glossary detour.

Paragraphs have small jobs. A direct claim is followed by the mechanism that makes it true, then a consequence the reader can recognize. The next paragraph advances the explanation instead of paraphrasing the claim. Sentence length is mostly short to medium, with longer sentences reserved for connected conditions.

The heading sequence follows curiosity. The architecture example teaches a state primitive, assembles its implementation, then follows traffic through it. The product example begins with what you receive, develops the resource model, and turns access, proxying, identity, and integrations into workflows. Their structures differ because their central questions differ.

Interconnections carry the depth: storage affects ownership; ownership affects recovery; recovery affects latency and capacity. A proxy affects routing, which affects authentication and sharing. The explanatory unit is a relationship and its consequence, not an isolated component description.

The examples alternate explanation with action. Small code samples arrive after the model they instantiate. Applied sections map the model onto a workload and identify what extra system would still need to exist. Constraints are part of the explanation, not a disclaimer appended to a sales pitch.

The supplied articles also contain personal experience and broad claims that a new explainer cannot inherit. Preserve evidence boundaries: a logical actor is not automatically equivalent to hostile-code isolation; idle compute is not the same as a free workload; a provider benchmark is not a measured result for the reader's app.

## Revision diagnostic

If a draft reads like a feature catalog, choose one operation and follow it across those features. If it reads like a manual, explain the design choice and practical tradeoff behind the procedure. If it reads like a pitch, add a concrete poor-fit workload and the cost of missing machinery. If it feels repetitive, assign every major concept one home and cut later restatements.

Original miniature example:

> Each build gets a directory with its own name. The worker writes temporary files there and publishes the result only after the build finishes.
>
> That separation lets two builds run at once without overwriting each other's output. It does not isolate the processes: both workers still have the permissions of the same operating-system user.

The first paragraph establishes the mechanism. The second adds concurrency consequences and the exact isolation boundary. Neither claims hands-on testing.

## Explain a boundary or lifetime

When adjacent concepts can be confused, follow one concrete value through them and state what each check accepts, rejects, and leaves to another owner. Separate describing an operation, validating its input, and authorizing its effects. Define terms such as “decode” at their first consequential use.

For lifecycle questions, trace the caller as well as the helper: identify what happens at construction, per request, and per execution; what is reused; and what resets. Distinguish a library's possible lifetime from the lifetime its actual host chooses.

Use a small Mermaid diagram for branching or shared-versus-fresh state, or an ASCII flow for a short sequence. Explain the consequence in prose and cite the source that establishes each boundary. Keep diagrams beside the relevant explanation; omit boxes that add names without clarifying a relationship. Diagram block mechanics live in content.md.

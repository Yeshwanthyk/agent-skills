// Routes through the collection, played on the map. Each step lights `doc` and draws a wire from `from`
// (default: the previous step). build.mjs fails a step whose two docs share no link, so a story that
// goes stale after an edit shows up in the build output and on the page.
const R = 'skills/yesh-router/';
export const STORIES = [
  {
    id: 'crash', name: 'crash report → diagnose + its principles',
    steps: [
      { doc: `${R}SKILL.md`, caption: 'You ask for the router. It stays active until you leave it, and reads the <em>catalog</em> first.' },
      { doc: `${R}SKILL.md#triggers`, caption: 'The catalog row "Reproduce a failing or crashing behavior" picks <em>diagnose</em>.' },
      { doc: 'skills/diagnose/SKILL.md', caption: 'diagnose runs a red-to-green loop. It calls how for the path and its History view for regressions.' },
      { doc: `${R}references/principles/fix-root-causes.md`, caption: 'diagnose lists its own principles, so they load with or without the router. First, <em>fix-root-causes</em>.' },
      { doc: `${R}references/principles/prove-it-works.md`, from: 'skills/diagnose/SKILL.md', caption: 'Before calling the fix done, <em>prove-it-works</em>. The reply names each principle that changed a choice.' },
    ],
  },
  {
    id: 'slow', name: 'slow endpoint → perf-issue playbook',
    steps: [
      { doc: `${R}SKILL.md`, caption: 'The router reads the catalog.' },
      { doc: `${R}SKILL.md#triggers`, caption: '"Measure and correct a one-off performance problem" picks the <em>perf-issue</em> playbook.' },
      { doc: `${R}playbooks/perf-issue.md`, caption: 'A playbook is a procedure inside the router. It borrows skills rather than repeating them.' },
      { doc: 'skills/benchmark-checklist/SKILL.md', caption: 'Step 1 vets every number with <em>benchmark-checklist</em>.' },
      { doc: 'skills/how/SKILL.md', from: `${R}playbooks/perf-issue.md`, caption: 'Step 2 traces the hot path with <em>how</em>.' },
      { doc: `${R}references/principles/sequence-verifiable-units.md`, from: `${R}playbooks/perf-issue.md`, caption: 'Step 3 links a principle directly: one verified attempt at a time.' },
    ],
  },
  {
    id: 'pr', name: 'any PR → show-me visual outline',
    steps: [
      { doc: `${R}SKILL.md`, caption: 'The router has one fixed rule: every PR description takes the <em>visual route</em>.' },
      { doc: `${R}SKILL.md#triggers`, caption: 'The rule sits at the top of the router\'s <em>triggers</em>, above every method row.' },
      { doc: 'skills/show-me/SKILL.md', caption: 'It sends PR work to <em>show-me</em>, whatever method is active.' },
      { doc: 'skills/show-me/references/visual-pr.md', caption: 'show-me follows its <em>visual-pr</em> workflow. The installed pr skill is not on this route: nothing links to it.' },
    ],
  },
  {
    id: 'edit', name: 'edit a skill → writing-for-agents',
    steps: [
      { doc: `${R}SKILL.md`, caption: 'The router reads the catalog.' },
      { doc: `${R}SKILL.md#triggers`, caption: 'The catalog links <em>writing-for-agents</em> for skill and AGENTS.md edits.' },
      { doc: 'skills/writing-for-agents/SKILL.md', caption: 'It sets the rules for pointers, the information hierarchy, and completion criteria.' },
      { doc: 'skills/writing-for-agents/SKILL-MECHANICS.md', caption: 'For a skill, it adds frontmatter, the invocation choice, and how a router reaches hidden skills.' },
    ],
  },
];

// Study content for the guide, cheat sheet, flashcards and anti-patterns. Original wording.
// Claude Code facts follow https://code.claude.com/docs (checked 2026-10-17).
window.CCA_CONTENT = (function () {
  const D = [
    { key: 'A', name: 'Agentic Architecture & Orchestration', weight: 27, blurb: 'Agent loops, subagents, hooks, retries, escalation' },
    { key: 'T', name: 'Tool Design & MCP Integration', weight: 18, blurb: 'Tool descriptions, structured errors, tool_choice, MCP' },
    { key: 'C', name: 'Claude Code Configuration & Workflows', weight: 20, blurb: 'CLAUDE.md, rules, skills, hooks, headless CI' },
    { key: 'P', name: 'Prompt Engineering & Structured Output', weight: 20, blurb: 'Criteria, few-shot, schemas, validation, batches' },
    { key: 'X', name: 'Context Management & Reliability', weight: 15, blurb: 'Case facts, escalation, provenance, evaluation' }
  ];
  const N = Object.fromEntries(D.map((d) => [d.key, d.name]));
  const DOCS = 'https://code.claude.com/docs/en/';

  const overview = {
    facts: [
      ['Exam', 'Claude Certified Architect – Foundations'],
      ['Questions', 'About 60, scenario-based (community-reported)'],
      ['Passing score', '720 on a 100–1000 scale (community-reported)'],
      ['Domains', '5, weighted 27 / 18 / 20 / 20 / 15 percent (community-reported)']
    ],
    note: 'These figures come from community resources, not from this site. Confirm them against the official exam guide before you plan around them.',
    scenarios: [
      'A customer-support agent that looks up orders, issues refunds and hands off to people.',
      'A multi-agent research system with a coordinator and specialist subagents.',
      'A team adopting Claude Code with shared configuration and conventions.',
      'Claude Code running in CI for review, tests or generation.',
      'A structured extraction pipeline that feeds a downstream system.',
      'A developer-productivity setup that mixes tools, MCP servers and automation.'
    ],
    plan: [
      ['Week 1', 'Agentic loops, `stop_reason`, hub-and-spoke orchestration, and the workflow patterns (chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer).'],
      ['Week 2', 'Tool design: descriptions as routing, structured errors, `tool_choice`, scoped toolsets, MCP servers.'],
      ['Week 3', 'Claude Code: CLAUDE.md, `.claude/rules`, skills, subagents, hooks, settings.'],
      ['Week 4', 'Headless and CI: `claude -p`, output formats, `--json-schema`, `--bare`, permission modes. Then prompting and structured output.'],
      ['Week 5', 'Context and reliability: case facts, trimming, escalation triggers, provenance, stratified evaluation. Take a mock exam.'],
      ['Week 6', 'Review wrong answers by domain, redo flashcards and anti-patterns, take two more mock exams, then rest.']
    ]
  };

  const guide = [
    { d: 'A', points: [
      'Drive the agent loop from `stop_reason`: keep going on `tool_use`, stop on `end_turn`. Never decide completion by reading the prose.',
      'Pick the simplest pattern that works: prompt chaining, routing, parallelization, orchestrator-workers or evaluator-optimizer. Add autonomy only when the task needs it.',
      'Subagents start with a fresh context. The delegation message is their only task input, so put every needed fact in it. Forks are the exception, because they inherit the conversation.',
      'Rules that must always hold belong in hooks, not prompts. A PreToolUse hook can deny or rewrite a call before it runs.',
      'Make writes idempotent, classify errors (transient, validation, permission, business), and retry only the transient ones.',
      'Escalate on explicit, observable triggers: the user asks for a person, policy does not cover the case, or progress has stalled.'
    ], prod: 'A refund agent enforces its dollar limit in a PreToolUse hook, sends an idempotency key with each charge, and hands off to a person with a structured case summary.',
      links: [['Building effective agents', 'https://www.anthropic.com/engineering/building-effective-agents'], ['Hooks', DOCS + 'hooks'], ['Subagents', DOCS + 'sub-agents']] },
    { d: 'T', points: [
      'Tool descriptions are the routing layer. State purpose, inputs, boundaries and when to use a neighbouring tool instead.',
      'Design tools so misuse is hard: enums, absolute paths and clear parameter names beat free text.',
      'Return structured errors with `isError`, a category and a retryable flag. Never return an empty success when something failed.',
      'Give each agent a small, scoped toolset. Large toolsets make selection worse.',
      '`tool_choice` can be `auto`, `any` (some tool must be called) or forced to one tool.',
      'In Claude Code, MCP tools are named `mcp__<server>__<tool>`. A subagent `tools` allowlist and hook matchers can target a server with a wildcard.'
    ], prod: 'Two lookup tools get distinct descriptions that name each other. Failures come back as typed errors so the agent can retry, switch tools or escalate.',
      links: [['MCP in Claude Code', DOCS + 'mcp'], ['Hooks matcher syntax', DOCS + 'hooks']] },
    { d: 'C', points: [
      'CLAUDE.md is loaded as context at session start. It guides but does not enforce. Keep it short and specific, and use hooks to block actions.',
      '`.claude/rules/*.md` can be scoped to file paths so rules load only where they apply.',
      'Skills live in `.claude/skills/<name>/SKILL.md`. Only descriptions load at startup; the body loads on use. `context: fork` runs the skill in a subagent.',
      '`allowed-tools` in a skill pre-approves tools for the turn. It does not restrict the toolset. `disallowed-tools` removes tools.',
      'Subagents are Markdown files in `.claude/agents/` with `name` and `description` required, plus `tools`, `model` and more. Omitting `tools` inherits everything.',
      'Hooks go in `.claude/settings.json`. Exit code 2 blocks a tool call, and other non-zero codes do not. JSON output with `permissionDecision` also works.',
      'For CI use `claude -p`, `--output-format json`, `--json-schema` (result in `structured_output`) and `--bare` for reproducible runs.'
    ], prod: 'A shared repo ships CLAUDE.md, path-scoped rules, a deploy-guard hook and a review job that runs `claude --bare -p` with a JSON schema.',
      links: [['Memory and CLAUDE.md', DOCS + 'memory'], ['Skills', DOCS + 'skills'], ['Subagents', DOCS + 'sub-agents'], ['Hooks', DOCS + 'hooks'], ['Headless mode', DOCS + 'headless']] },
    { d: 'P', points: [
      'Replace vague words ("important", "be careful") with explicit criteria and a few examples of the boundary cases.',
      'Use schemas through tool use for structured output. A schema guarantees shape, not truth, so validate meaning too.',
      'Give enums an `other` or `unclear` escape plus a detail field. Make fields nullable when the source may not contain them.',
      'Validation-retry works only when the information is present and the error message is specific.',
      'Use the Message Batches API for large, non-urgent work. Do not use it for blocking checks.',
      'Review in layers: per-file passes plus a cross-file pass, ideally by a separate instance.'
    ], prod: 'An invoice extractor returns null for missing fields, retries on format errors with the exact validation message, and runs overnight through batches.',
      links: [['Prompt engineering overview', 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview'], ['Message Batches', 'https://docs.claude.com/en/docs/build-with-claude/batch-processing']] },
    { d: 'X', points: [
      'Pin critical facts (IDs, amounts, dates) in a case-facts block outside the history that gets summarized.',
      'Trim tool output to the fields the agent needs before it enters context.',
      'Put the most important material at the start or end of long inputs, and use clear section headers.',
      'Escalate on explicit requests, policy gaps and stalled progress. Do not rely on sentiment or self-rated confidence alone.',
      'Keep provenance: claim, source and date together. When sources conflict, report both.',
      'Evaluate by category, not by one aggregate number, and calibrate confidence against labeled data before routing on it.'
    ], prod: 'A support agent re-injects the case facts each turn, summarizes long tool output, and reports accuracy per ticket type.',
      links: [['Context windows', 'https://docs.claude.com/en/docs/build-with-claude/context-windows'], ['Memory', DOCS + 'memory']] }
  ];

  const cheatsheet = [
    ['A', 'Loop control', 'Branch on `stop_reason`, not on text.', 'while (true) {\n  r = call(messages)\n  if (r.stop_reason === "end_turn") break\n  run tools; append tool_result\n}'],
    ['A', 'Which pattern?', 'Predictable steps: chain. Independent steps: parallelize. Unpredictable subtasks: orchestrator-workers. Quality bar: evaluator-optimizer.'],
    ['A', 'Subagent context', 'Fresh context. The task message is the only input. Forks inherit everything.'],
    ['A', 'Hard rules', 'Enforce with a PreToolUse hook. Prompts and CLAUDE.md only guide.'],
    ['A', 'Safe retries', 'Idempotency key per logical write. Retry only transient errors.'],
    ['T', 'Descriptions route', 'Purpose, inputs, boundaries, and "use X instead for Y".'],
    ['T', 'Error shape', 'Return `isError`, a category and a retryable flag.', '{ "isError": true,\n  "category": "transient",\n  "retryable": true,\n  "message": "upstream 503" }'],
    ['T', 'tool_choice', '`auto` lets the model decide. `any` requires some tool. A named tool forces that one.'],
    ['T', 'MCP names', 'Tools appear as `mcp__server__tool`. Hook matcher for a whole server: `mcp__server__.*`.'],
    ['T', 'Secrets in .mcp.json', 'Reference environment variables. Never commit tokens.', '{ "env": { "API_TOKEN": "${API_TOKEN}" } }'],
    ['C', 'CLAUDE.md', 'Context, not enforcement. Keep it short and specific.'],
    ['C', 'Scoped rules', '`.claude/rules/*.md` limited to file paths.'],
    ['C', 'Skill frontmatter', '`name`, `description`, `allowed-tools` (pre-approves), `disallowed-tools`, `context: fork`, `argument-hint`.'],
    ['C', 'Subagent file', '`.claude/agents/name.md`. Required: `name`, `description`. Optional: `tools`, `model`, `permissionMode`.'],
    ['C', 'Blocking hook', 'Exit 2 blocks. Exit 1 does not. Or print JSON with `permissionDecision: "deny"` and exit 0.', 'echo "blocked: reason" >&2\nexit 2'],
    ['C', 'Headless basics', 'Non-interactive run with a JSON result.', 'claude --bare -p "Review this diff" \\\n  --output-format json \\\n  --json-schema \'{"type":"object"}\'\n# result: .structured_output'],
    ['C', 'Pre-approve in CI', 'Prefix rules need a space before the star.', '--allowedTools "Bash(git diff *),Read"'],
    ['P', 'Criteria over adjectives', 'Say what counts as reportable and show boundary examples.'],
    ['P', 'Escape values', 'Add `other`/`unclear` and a detail string. Make absent data nullable.'],
    ['P', 'Retry rule', 'Retry with the exact error only when the data exists in the source.'],
    ['P', 'Batches', 'Cheaper, asynchronous, up to a day. Good for volume, wrong for blocking checks.'],
    ['X', 'Case facts', 'Keep IDs, amounts and dates in a block that is never summarized away.'],
    ['X', 'Trim outputs', 'Keep only needed fields from tool results.'],
    ['X', 'Escalation triggers', 'Explicit request, policy gap, no progress, high-risk action.'],
    ['X', 'Conflicting sources', 'Show both values with source and date. Do not average or pick silently.'],
    ['X', 'Evaluate by segment', 'Report accuracy per category. Calibrate confidence on labeled data.']
  ].map((r) => ({ d: r[0], title: r[1], body: r[2], code: r[3] || '' }));

  const flashcards = [
    ['A', 'What tells an agent loop to continue or stop?', '`stop_reason`: `tool_use` means run tools and loop, `end_turn` means finish.'],
    ['A', 'Why is a PreToolUse hook better than a prompt for a spending limit?', 'It runs deterministically before the call and can deny it. A prompt is only followed probabilistically.'],
    ['A', 'What does a non-fork subagent see?', 'Its own prompt, the task message, CLAUDE.md and its preloaded skills. Not the parent conversation.'],
    ['A', 'When is orchestrator-workers the right pattern?', 'When the subtasks cannot be known in advance and depend on what the orchestrator discovers.'],
    ['A', 'How do you make a retried payment safe?', 'Send an idempotency key so the server recognizes the repeat.'],
    ['A', 'Which errors deserve an automatic retry?', 'Transient ones, such as a 503 or a timeout. Not validation, permission or business-rule errors.'],
    ['A', 'What is a good trigger for human escalation?', 'An explicit request, a policy gap, stalled progress, or a high-risk action.'],
    ['A', 'What does forking a session give you?', 'Two branches that share the baseline and diverge independently.'],
    ['A', 'Predictable independent subtasks: which pattern?', 'Parallelization, then an aggregation step.'],
    ['T', 'What is the routing layer for tool choice?', 'The tool descriptions.'],
    ['T', 'What should a failed tool return?', 'A structured error with `isError`, a category and a retryable flag.'],
    ['T', 'How do you force a specific first tool call?', 'Set `tool_choice` to that tool.'],
    ['T', 'What does `tool_choice: any` do?', 'Requires the model to call some tool, but lets it pick which.'],
    ['T', 'Why keep toolsets small?', 'Large toolsets make selection less reliable and widen what can go wrong.'],
    ['T', 'How is an MCP tool named in Claude Code?', '`mcp__<server>__<tool>`.'],
    ['T', 'How do you scope a subagent to one MCP server?', 'List that server\'s tools, or a wildcard like `mcp__server__*`, in its `tools` allowlist.'],
    ['T', 'How should shared `.mcp.json` handle secrets?', 'Reference environment variables so tokens stay out of git.'],
    ['T', 'MCP resources versus tools?', 'Resources are readable content. Tools perform actions.'],
    ['C', 'Does CLAUDE.md enforce rules?', 'No. It is context. Use a hook to block actions.'],
    ['C', 'Which hook exit code blocks a tool call?', 'Exit code 2. Other non-zero codes are non-blocking errors.'],
    ['C', 'Does `allowed-tools` restrict a skill?', 'No. It pre-approves those tools for the turn. `disallowed-tools` removes tools.'],
    ['C', 'What does `context: fork` do in a skill?', 'Runs the skill in a forked subagent.'],
    ['C', 'How do you scope rules to some files?', 'Put them in `.claude/rules/` with path scoping.'],
    ['C', 'Where do project subagents live?', '`.claude/agents/`, with `name` and `description` required.'],
    ['C', 'Which flag makes CI runs reproducible?', '`--bare`. It skips ambient hooks, skills, plugins, MCP, memory and CLAUDE.md.'],
    ['C', 'How do you get a schema-shaped CI result?', '`--output-format json --json-schema ...`, then read `structured_output`.'],
    ['C', 'How do you continue a headless session?', '`--continue`, or `--resume <session_id>`.'],
    ['P', 'Why do vague instructions underperform?', 'They do not define a boundary. Explicit criteria and examples do.'],
    ['P', 'What makes an enum safe for unknown cases?', 'An `other`/`unclear` value with a detail field.'],
    ['P', 'When do retries fix a validation error?', 'When the information is in the source and the error message is specific.'],
    ['P', 'What if the source lacks a field?', 'Make it nullable and return null. Do not invent a value.'],
    ['P', 'Best fit for the Message Batches API?', 'Large volumes with no one waiting on the result.'],
    ['P', 'Why not use batches for a pre-merge check?', 'Results can take up to a day with no latency guarantee.'],
    ['P', 'What does a schema not guarantee?', 'Correct meaning. It guarantees shape, so you still validate content.'],
    ['P', 'Why use a separate reviewer instance?', 'It does not share the author\'s blind spots or reasoning.'],
    ['P', 'How many few-shot examples are typical?', 'A small set, about two to four, chosen to show the hard boundary cases.'],
    ['X', 'How do you stop key details being lost?', 'Pin them in a case-facts block outside the summarized history.'],
    ['X', 'Why trim tool output?', 'Context is a budget. Extra fields bury the signal.'],
    ['X', 'Where should key findings go in a long input?', 'At the start or end, under clear headers.'],
    ['X', 'Two sources disagree. What now?', 'Report both with attribution and dates, and flag the conflict.'],
    ['X', 'Why is 96% overall accuracy risky?', 'It can hide a failing segment. Evaluate per category.'],
    ['X', 'Can you trust self-reported confidence?', 'Not without calibrating it against labeled data.'],
    ['X', 'Is sentiment a good escalation trigger by itself?', 'No. Explicit requests and policy gaps are firmer triggers.'],
    ['X', 'What belongs in provenance?', 'The claim, its source and its date.'],
    ['X', 'What helps very long investigations?', 'Scratchpad files, manifests and fresh subagents for focused digging.']
  ].map((r) => ({ d: r[0], front: r[1], back: r[2] }));

  const antipatterns = [
    ['Ending the loop by searching for "done" in the reply', 'Phrases vary and can appear mid-task.', 'Branch on `stop_reason`.'],
    ['Enforcing a spending limit in the prompt only', 'Compliance is probabilistic.', 'Use a PreToolUse hook.'],
    ['Assuming subagents know the parent\'s context', 'A fresh context sees only the task message.', 'Write all needed facts into the delegation.'],
    ['Retrying every error', 'Validation and permission errors fail the same way again.', 'Retry transient errors only, with backoff.'],
    ['Retrying a write without an idempotency key', 'Duplicates charges or records.', 'Send a key per logical operation.'],
    ['Two tools with near-identical descriptions', 'The model cannot route reliably.', 'State boundaries and name the neighbour.'],
    ['Returning empty success on failure', 'The agent continues on false information.', 'Return a structured error.'],
    ['Giving one agent dozens of tools', 'Selection quality drops.', 'Scope toolsets per role.'],
    ['Committing tokens to `.mcp.json`', 'Leaks secrets through git.', 'Use environment variables.'],
    ['Putting hard rules only in CLAUDE.md', 'It is context, not enforcement.', 'Use a hook for must-hold rules.'],
    ['Believing `allowed-tools` limits a skill', 'It only pre-approves.', 'Use `disallowed-tools` to remove tools.'],
    ['Exiting a blocking hook with code 1', 'Only exit 2 blocks.', 'Exit 2, or return `permissionDecision: "deny"`.'],
    ['Running CI without `--bare`', 'Ambient hooks and MCP vary by machine.', 'Use `--bare` and pass config explicitly.'],
    ['Asking for "important issues only"', 'No boundary is defined.', 'Give explicit criteria and examples.'],
    ['A strict enum with no escape value', 'The model guesses on unknown cases.', 'Add `other`/`unclear` plus detail.'],
    ['Retrying when the source lacks the data', 'It cannot appear on retry.', 'Allow null and handle absence.'],
    ['Auto-approving on raw self-reported confidence', 'It is poorly calibrated.', 'Calibrate on labeled data first.']
  ].map((r) => ({ bad: r[0], why: r[1], fix: r[2] }));

  return { domains: D, names: N, overview, guide, cheatsheet, flashcards, antipatterns };
})();

// Set 8 — Mixed, checked against the Claude Code docs. Original practice content.
(function () {
  const A = 'Agentic Architecture & Orchestration';
  const T = 'Tool Design & MCP Integration';
  const C = 'Claude Code Configuration & Workflows';
  const P = 'Prompt Engineering & Structured Output';
  const X = 'Context Management & Reliability';

  // q(domain, question, [[text, why], ...], indexOfCorrect, explanation)
  const q = (domain, question, opts, right, explanation) => ({
    domain, scenario: '', question,
    options: opts.map((o, i) => ({ text: o[0], correct: i === right, why: o[1] })),
    explanation,
    refs: [{ title: 'Claude Code documentation', url: 'https://code.claude.com/docs' }]
  });

  (window.QUESTION_SETS = window.QUESTION_SETS || []).push({
    id: 'set-08-verified-mixed',
    title: 'Set 8 · Mixed, checked against the Claude Code docs · Practice mode',
    description: 'Loop control, hooks, skills, subagents, headless CI, schemas and context. Claude Code items follow the current official docs.',
    questions: [
      q(A, 'Your agent loop stops whenever the reply contains "I have completed the task." Some runs stop mid-task and others never stop. What is the correct fix?', [
        ['Add more completion phrases to the system prompt.', 'Phrase matching stays brittle however many phrases you add.'],
        ['Branch on `stop_reason`: continue on `tool_use`, stop on `end_turn`.', 'The API reports the loop state explicitly. This is the intended control signal.'],
        ['Cap the loop at 10 iterations.', 'A cap is a safety net, not a termination condition. It cuts off valid long tasks.'],
        ['Ask the model to emit a JSON `done` flag.', 'This is still model-authored prose that can be wrong or missing.']
      ], 1, 'Drive the loop from `stop_reason`, not from natural-language content. Keep an iteration cap only as a backstop.'),

      q(A, 'A coordinator delegates to three subagents, but their results are inconsistent because they lack facts the coordinator learned earlier. What should change?', [
        ['Rely on automatic history inheritance and enlarge the context window.', 'A non-fork subagent starts with a fresh context. It does not see the parent\'s history.'],
        ['Put the needed facts explicitly in each delegation message.', 'The delegation message is the subagent\'s only task input, so it must be self-contained.'],
        ['Run the subagents one after another.', 'Order does not change what each one can see.'],
        ['Give every subagent all of the coordinator\'s tools.', 'More tools do not supply missing information, and they widen the blast radius.']
      ], 1, 'Subagents are isolated. A fork is the exception: it inherits the whole conversation. Otherwise, write complete context into the task message.'),

      q(A, 'A refund agent must never refund more than $500 without approval. Prompt instructions are followed about 97% of the time. How do you reach a hard guarantee?', [
        ['Strengthen the prompt with emphasis and examples.', 'This is still probabilistic.'],
        ['A PreToolUse hook that inspects the refund input and denies or escalates above $500.', 'Hooks run deterministically before the tool executes and can block it.'],
        ['A PostToolUse hook that reverses the refund afterward.', 'The money has already moved. Prevention beats compensation.'],
        ['Add the rule to CLAUDE.md.', 'CLAUDE.md is treated as context, not enforced configuration.']
      ], 1, 'For rules that must hold regardless of what the model decides, use a PreToolUse hook. Reserve prompts and CLAUDE.md for guidance.'),

      q(A, 'You must review 40 independent files for style and then produce one summary. The steps are known in advance. Which pattern fits best?', [
        ['Orchestrator-workers with dynamic subtask planning.', 'That pattern is for subtasks you cannot predict up front.'],
        ['Parallelization across files, then an aggregation step.', 'The subtasks are independent and predictable, so run them in parallel and combine.'],
        ['Evaluator-optimizer.', 'That is for iterative refinement against a quality bar.'],
        ['One agent with all 40 files in one context.', 'It wastes context and dilutes attention.']
      ], 1, 'Pick the simplest pattern that fits. Known, independent subtasks suggest parallelization. Use orchestrator-workers only when the subtasks depend on what is discovered.'),

      q(A, 'A payment tool call times out and the agent retries, producing two charges. What is the best design fix?', [
        ['Never retry.', 'Transient failures are normal, so you still want safe retries.'],
        ['Send an idempotency key with each logical operation so a retry is safe.', 'The server can recognize the repeat and return the original result.'],
        ['Lower the timeout.', 'A shorter timeout makes duplicates more likely.'],
        ['Tell the model to check the balance first.', 'This adds a race condition and relies on prompt compliance.']
      ], 1, 'Make write operations idempotent so retrying is harmless.'),

      q(A, 'Which failure should an agent retry automatically?', [
        ['A validation error: the date format is wrong.', 'The same input will fail again. Fix the input.'],
        ['A permission error: the caller lacks access.', 'Retrying will not grant access.'],
        ['A transient error: the upstream service returned 503.', 'Transient failures often clear on retry, ideally with backoff.'],
        ['A business-rule error: the account is closed.', 'This is a stable fact, not a glitch.']
      ], 2, 'Classify errors. Retry only transient ones, and handle the rest with correction, escalation or an explanation.'),

      q(A, 'A customer writes "get me a human," but their sentiment score is neutral. What should the policy be?', [
        ['Escalate immediately, since an explicit request overrides the sentiment signal.', 'An explicit request is a direct trigger.'],
        ['Escalate only if sentiment becomes negative.', 'Sentiment is a weak proxy compared with an explicit request.'],
        ['Ask the customer to confirm three times.', 'This adds friction and ignores the request.'],
        ['Resolve first, then offer a human.', 'It overrides the customer\'s stated choice.']
      ], 0, 'Escalate on explicit, observable triggers, not on inferred feelings.'),

      q(A, 'You want to try two different fixes from the same analyzed baseline without one polluting the other. What helps most?', [
        ['Two fresh sessions with no history.', 'You would lose the analysis you want to build on.'],
        ['Fork the session at the baseline into two branches.', 'A fork inherits the conversation and then diverges independently.'],
        ['One session, trying the fixes one after the other.', 'The second attempt is polluted by the first.'],
        ['Disable compaction.', 'This does not isolate anything.']
      ], 1, 'Forking gives each branch the shared baseline and separate futures.'),

      q(T, 'Two tools, `get_customer` and `lookup_account`, have near-identical one-line descriptions, and the agent often picks the wrong one. What is the first fix?', [
        ['Raise the temperature.', 'Randomness will not improve routing.'],
        ['Rewrite the descriptions: purpose, inputs, boundaries, and when to use the other tool.', 'Descriptions are what the model uses to choose.'],
        ['Add a third tool that wraps both.', 'This adds more overlap.'],
        ['Merge the system prompt and tool list.', 'This does not change what the descriptions say.']
      ], 1, 'Tool descriptions are the routing layer. Make them distinct and explicit about boundaries.'),

      q(T, 'A tool\'s downstream API is down. What should the tool return?', [
        ['An empty result marked as success.', 'It hides the failure, and the agent proceeds on false information.'],
        ['A structured error with `isError`, a category, and whether it is retryable.', 'The agent can then choose to retry, change approach or escalate.'],
        ['A raw stack trace.', 'It is noisy and exposes internals without guidance.'],
        ['Throw so the whole loop crashes.', 'This removes the agent\'s chance to recover.']
      ], 1, 'Surface failures explicitly and in a form the agent can reason about.'),

      q(T, 'You must guarantee the model\'s first action is calling `extract_invoice`. Which setting?', [
        ['`tool_choice: auto`', 'The model may choose not to call it.'],
        ['Force `tool_choice` to that specific tool.', 'This guarantees that tool is called.'],
        ['A stronger prompt.', 'It is still not a guarantee.'],
        ['`tool_choice: none`', 'This disables tool calls.']
      ], 1, 'Use a forced tool choice when a specific call is mandatory. Use `any` when some tool call is required but the choice is open.'),

      q(T, 'A subagent should use only one MCP server\'s tools. Which approach does that in Claude Code?', [
        ['A `tools` allowlist in the subagent frontmatter that names that server\'s tools, such as `mcp__server__*`.', 'The subagent `tools` field is an allowlist and supports MCP wildcards.'],
        ['`allowed-tools` in the parent\'s CLAUDE.md.', 'That is not where subagent tools are defined.'],
        ['`model: inherit`.', 'This only selects the model.'],
        ['`permissionMode: plan`.', 'This changes permission behavior, not the toolset.']
      ], 0, 'Omitting `tools` inherits everything. Specify an allowlist to scope a subagent.'),

      q(T, 'A team shares `.mcp.json` in git, and one server needs an API token. What is the best practice?', [
        ['Commit the token.', 'Secrets in git are a leak.'],
        ['Reference an environment variable in the config and set it per developer.', 'The config stays shareable and the secret stays local.'],
        ['Base64-encode the token.', 'Encoding is not protection.'],
        ['Put the token in CLAUDE.md.', 'This is committed and loaded into context.']
      ], 1, 'Share structure, not secrets. Use environment-variable expansion.'),

      q(C, 'A rule must apply to every Bash command regardless of what the model decides. Where does it belong?', [
        ['CLAUDE.md.', 'It is context. The model may weigh it differently each time.'],
        ['A PreToolUse hook in `.claude/settings.json`.', 'Hooks are deterministic and can block the call.'],
        ['A skill description.', 'This only affects when the skill is picked.'],
        ['An auto-memory note.', 'Memory is also context, not enforcement.']
      ], 1, 'Instructions guide. Hooks enforce.'),

      q(C, 'A PreToolUse hook script exits with code 1 after spotting a dangerous command, but the command still runs. Why?', [
        ['Hooks cannot block commands.', 'They can.'],
        ['Only exit code 2 blocks. Other non-zero codes are non-blocking errors.', 'Exit 2 blocks and its stderr goes to Claude. Alternatively, return a JSON `permissionDecision: "deny"` with exit 0.'],
        ['The matcher is wrong.', 'The hook ran. It just did not block.'],
        ['Exit 1 blocks only in headless mode.', 'There is no such distinction.']
      ], 1, 'Block with exit code 2, or with JSON output on exit 0 using `permissionDecision: "deny"`.'),

      q(C, 'A skill has `allowed-tools: Read Grep`. A colleague believes Claude can no longer use Bash while it is active. Is that correct?', [
        ['Yes, the list is a strict allowlist.', 'It only pre-approves.'],
        ['No. The field pre-approves those tools for the turn. It does not restrict others, and `disallowed-tools` removes tools.', 'Correct.'],
        ['Yes, but only inside subagents.', 'It is not subagent-specific.'],
        ['No, because the field is ignored entirely.', 'It is honored as pre-approval.']
      ], 1, 'Read the name literally: allowed-tools means no permission prompt for those tools. Removal needs `disallowed-tools`.'),

      q(C, 'A CI job runs `claude -p` and behaves differently on two runners because a teammate\'s `~/.claude` hooks load on one. What is the best fix?', [
        ['Ask teammates to clean up their config.', 'It does not scale and is not reproducible.'],
        ['Run with `--bare` and pass settings, MCP config and agents explicitly.', 'Bare mode skips ambient hooks, skills, plugins, MCP servers, memory and CLAUDE.md.'],
        ['Use `--output-format stream-json`.', 'This changes output, not what loads.'],
        ['Resume the same session ID on both runners.', 'It does not control ambient config.']
      ], 1, 'For reproducible scripted runs, isolate from the host with `--bare` and supply what you need with flags.'),

      q(C, 'You need a machine-readable verdict from a headless review. Which combination?', [
        ['`--output-format text`.', 'Plain text needs fragile parsing.'],
        ['`--output-format json` with `--json-schema`, then read `structured_output`.', 'The schema constrains the result and it appears in a dedicated field.'],
        ['`--verbose` alone.', 'Verbose logging is not a result contract.'],
        ['Parse prose with a regex.', 'Brittle.']
      ], 1, 'Use a schema for CI gates. Note that the `format` keyword is treated as an annotation and not enforced.'),

      q(C, 'Rules that apply only to Apex files should load only when working on them. What do you use?', [
        ['One large root CLAUDE.md.', 'It loads always and bloats context.'],
        ['A `.claude/rules/*.md` file scoped to the relevant paths.', 'Path-scoped rules keep context relevant.'],
        ['A personal `~/.claude/CLAUDE.md`.', 'It applies everywhere and is not shared.'],
        ['A SessionStart hook.', 'It runs at session start, not per file.']
      ], 1, 'Scope instructions to where they apply, and keep CLAUDE.md concise and specific.'),

      q(P, 'Your reviewer prompt says "only report important issues," but it flags trivia. What is the best improvement?', [
        ['Add "be very careful."', 'Vague emphasis does not define a boundary.'],
        ['Define explicit reporting criteria with examples of boundary cases.', 'Criteria and examples calibrate the model.'],
        ['Lower max tokens.', 'This truncates output, not noise.'],
        ['Have it rate its own confidence.', 'Self-rated confidence is poorly calibrated.']
      ], 1, 'Replace vague severity words with concrete criteria and a few examples.'),

      q(P, 'A schema field `category` is a strict enum of five values, but some documents fit none and the model guesses. What is the fix?', [
        ['Make it free text.', 'You lose consistency downstream.'],
        ['Add an `other` or `unclear` value plus a `category_detail` string.', 'This gives the model an honest option and preserves the nuance.'],
        ['Remove the field.', 'You lose the information.'],
        ['Retry until it fits.', 'Retries will keep forcing a guess.']
      ], 1, 'Give the model a way to say "none of these" instead of forcing a fabricated value.'),

      q(P, 'Validation fails because the model returned a date in the wrong format. The source text contains the date. What next?', [
        ['Retry, appending the specific validation error.', 'The information is present, so targeted feedback can fix it.'],
        ['Give up.', 'Premature.'],
        ['Drop the field.', 'Data loss.'],
        ['Switch to the Batches API.', 'It does not address format errors.']
      ], 0, 'Validation-retry works when the data is available and the error is specific.'),

      q(P, 'Validation fails because the source has no invoice number at all. What should you do?', [
        ['Retry with a longer prompt.', 'You cannot extract what is not there.'],
        ['Make the field nullable and return null instead of forcing a value.', 'This prevents fabrication.'],
        ['Lower the temperature.', 'Does not create missing data.'],
        ['Ask the model to infer one.', 'This invents data in a finance system.']
      ], 1, 'Retries only help when the information exists. Otherwise model absence explicitly.'),

      q(P, 'A nightly job classifies 50,000 tickets and nobody is waiting on it. Which approach is most appropriate?', [
        ['Synchronous calls in a loop.', 'Works, but costs more.'],
        ['The Message Batches API.', 'It suits high-volume, non-urgent work at lower cost.'],
        ['A streaming connection.', 'Streaming is for latency-sensitive interactive output.'],
        ['One enormous prompt.', 'Quality degrades and limits get hit.']
      ], 1, 'Batch for volume and cost when latency does not matter.'),

      q(P, 'A pre-merge check must finish in about a minute and block the merge. Is the Batches API appropriate?', [
        ['Yes, because it is cheaper.', 'Cost is not the constraint here.'],
        ['No. Batch results can take up to a day, with no latency guarantee.', 'A blocking check needs predictable latency.'],
        ['Yes, if you add retries.', 'Retries do not fix latency.'],
        ['Only for small PRs.', 'Size does not remove the lack of an SLA.']
      ], 1, 'Match the API to the latency requirement: synchronous for blocking checks, batch for deferred work.'),

      q(X, 'After many turns, the agent forgets an order ID stated early on. What is the best mitigation?', [
        ['Use a bigger model.', 'Does not address summarization loss.'],
        ['Keep a persistent "case facts" block (IDs, amounts, dates) re-injected outside the summarized history.', 'Key facts survive compaction.'],
        ['Repeat the whole conversation every turn.', 'Costly and still dilutes attention.'],
        ['Remove tool results.', 'You would lose evidence.']
      ], 1, 'Pin critical facts outside the part of the context that gets summarized.'),

      q(X, 'A tool returns 80 fields and the agent needs 4. What should you do?', [
        ['Pass everything through for completeness.', 'It bloats context and buries the signal.'],
        ['Trim the output to the relevant fields before it enters context.', 'A PostToolUse-style trim keeps context lean.'],
        ['Summarize it with another tool.', 'Extra cost and risk of loss.'],
        ['Increase `max_tokens`.', 'That limits output, not input.']
      ], 1, 'Filter at the boundary. Context is a budget.'),

      q(X, 'Two research sources give different revenue figures. What should the synthesis do?', [
        ['Average them.', 'This fabricates a number nobody reported.'],
        ['Present both with attribution and dates, and flag the conflict.', 'Preserves provenance and lets the reader judge.'],
        ['Silently pick the newer one.', 'It hides a real disagreement.'],
        ['Drop both.', 'You lose evidence.']
      ], 1, 'Keep claim, source and date together, and surface conflicts.'),

      q(X, 'A dashboard shows 96% accuracy overall, but one document type is failing badly. What practice would have caught it?', [
        ['A larger overall sample.', 'The aggregate still hides the segment.'],
        ['Stratified evaluation per document type.', 'Per-segment metrics expose localized failures.'],
        ['A better averaging method.', 'Averaging is the problem.'],
        ['Relying on confidence scores alone.', 'Uncalibrated scores can mask failures.']
      ], 1, 'Report accuracy by category, especially for rare or hard types.'),

      q(X, 'You plan to auto-approve extractions when the model reports confidence of at least 0.9. What must you do first?', [
        ['Nothing, since self-reported confidence is reliable.', 'It often is not.'],
        ['Calibrate against a labeled set to check what 0.9 actually corresponds to, per category.', 'Only measured accuracy justifies a threshold.'],
        ['Lower the threshold to 0.5.', 'Arbitrary.'],
        ['Remove the threshold.', 'Removes the control entirely.']
      ], 1, 'Validate any confidence-based routing against labeled data before relying on it.')
    ]
  });
})();

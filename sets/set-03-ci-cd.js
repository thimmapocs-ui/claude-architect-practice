// Set 3 — Claude Code in CI/CD: automated review & test generation. Original practice content.
(function () {
  const C = 'Claude Code Configuration & Workflows';
  const P = 'Prompt Engineering & Structured Output';
  const X = 'Context Management & Reliability';
  const SC = 'You run Claude Code headlessly in CI to review pull requests, generate tests, and post feedback. Developers quickly ignore noisy bots, so precision and actionable output matter more than volume.';

  (window.QUESTION_SETS = window.QUESTION_SETS || []).push({
    id: 'set-03-ci-cd',
    title: 'Set 3 · Claude Code in CI/CD',
    description: 'Headless mode, output formats, false-positive control, batch processing, caching, and multi-pass review.',
    questions: [
      {
        domain: C, scenario: SC,
        question: 'A new CI step runs `claude "Review this diff"` and the job hangs until it times out. What is the fix?',
        options: [
          { text: 'Add -p (--print) so Claude Code runs non-interactively, prints the result, and exits.', correct: true,
            why: 'Without -p, Claude Code starts an interactive session and waits for input that CI never sends.' },
          { text: 'Add --verbose so the job prints what it is waiting for.', correct: false,
            why: 'Verbose logging may explain the hang, but the session is still interactive.' },
          { text: 'Pipe "yes" into the command to answer prompts.', correct: false,
            why: 'This is a brittle hack, and it does not change the interactive mode.' },
          { text: 'Add --continue so it reuses the last session.', correct: false,
            why: '--continue resumes a conversation. It does not make the run non-interactive.' }
        ],
        explanation: 'Print mode (-p) is the entry point for scripts and CI. It processes one prompt and exits with a status code, and it can take input from stdin or files.\n\nCombine it with --output-format, tool restrictions, and a permission mode to make runs predictable.',
        refs: [{ title: 'Run Claude Code programmatically (headless)', url: 'https://docs.claude.com/en/docs/claude-code/headless' }]
      },
      {
        domain: C, scenario: SC,
        question: 'The pipeline must log each run\'s cost and session ID, and save the review text separately. Which output option provides this metadata?',
        options: [
          { text: '--output-format text', correct: false,
            why: 'Plain text contains only the response, without run metadata.' },
          { text: '--output-format json', correct: true,
            why: 'The JSON envelope includes the result along with metadata such as session ID, duration, and cost.' },
          { text: 'Parse the cost from stderr.', correct: false,
            why: 'Cost is not reliably printed to stderr. Use the structured output format.' },
          { text: 'Ask Claude to report its own cost at the end of the review.', correct: false,
            why: 'The model cannot see billing data, so it would make up a number.' }
        ],
        explanation: 'In print mode, --output-format text prints only the answer, json prints one envelope with the result plus metadata, and stream-json prints newline-delimited events as they happen.\n\nTo validate the content of the answer against a schema, add --json-schema and read structured_output.',
        refs: [{ title: 'CLI reference', url: 'https://docs.claude.com/en/docs/claude-code/cli-reference' }]
      },
      {
        domain: P, scenario: SC,
        question: 'Developers mute the review bot because 60% of its comments are style nitpicks and speculative concerns. Which prompt change reduces false positives most?',
        options: [
          { text: 'Add "Only report issues you are highly confident about."', correct: false,
            why: 'Model confidence is poorly calibrated, so vague confidence filters change little.' },
          { text: 'List exactly which issue types to report and which to skip, with an example of each.', correct: true,
            why: 'Report: logic bugs, security issues, data loss, broken contracts. Skip: formatting and naming preferences. Explicit criteria give a checkable boundary.' },
          { text: 'Add "Be conservative."', correct: false,
            why: 'This does not say what to drop, so the model guesses.' },
          { text: 'Report everything, but tag each item with a severity so developers can filter.', correct: false,
            why: 'This moves the filtering work onto developers, and the noise remains.' }
        ],
        explanation: 'Precision comes from explicit, concrete criteria: which categories count, what evidence is needed, and what is out of scope. Examples of what not to flag are especially effective.\n\nVague instructions like "be conservative" or "high confidence only" give the model nothing concrete to check against.',
        refs: [{ title: 'Be clear and direct', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct' }]
      },
      {
        domain: P, scenario: SC,
        question: 'The bot labels findings as critical, major, or minor, but the same kind of issue gets different severities on different PRs. What fixes the inconsistency?',
        options: [
          { text: 'Add few-shot examples for each severity, including borderline cases, each with a short reason.', correct: true,
            why: 'Examples anchor each level and show where the boundaries fall.' },
          { text: 'Replace the levels with a 1–100 numeric score.', correct: false,
            why: 'A finer scale gives more room for inconsistency, not less.' },
          { text: 'Set temperature to 0.', correct: false,
            why: 'This makes the same input more repeatable, but different PRs with similar issues can still be judged differently.' },
          { text: 'Remove severity entirely.', correct: false,
            why: 'This avoids the problem by removing information developers use for triage.' }
        ],
        explanation: 'For categorical judgments, define each category and show examples near the boundaries. The examples teach the decision rule, for example "unvalidated input reaching SQL is critical, even in internal tools", far more reliably than adjectives do.',
        refs: [{ title: 'Use examples (multishot prompting)', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting' }]
      },
      {
        domain: P, scenario: SC,
        question: 'Two workloads: (1) a blocking pre-merge review that developers wait on, and (2) a nightly job that generates test suggestions for 3,000 modules and is read the next morning. Which TWO choices are correct? (Select TWO.)',
        options: [
          { text: 'Run the nightly job through the Message Batches API for lower cost.', correct: true,
            why: 'Batches cost about 50% less and finish within 24 hours (usually much sooner), which fits work that is not latency-sensitive.' },
          { text: 'Keep the pre-merge review on synchronous requests.', correct: true,
            why: 'Developers are blocked waiting for it, so it cannot wait an unpredictable amount of time for a batch to finish.' },
          { text: 'Move the pre-merge review to batches to save money.', correct: false,
            why: 'Batch processing has no latency guarantee, which is unacceptable for a blocking merge check.' },
          { text: 'Batch the nightly job, with each request running a multi-turn tool loop inside the batch.', correct: false,
            why: 'Each batch request is one independent Messages call. A tool loop needs your code between turns, so it cannot run inside a single batch request.' }
        ],
        explanation: 'Match the API to the latency requirement. The Message Batches API processes many independent requests asynchronously at a discount. Use custom_id to match results to inputs.\n\nAnything a human is actively waiting on belongs on synchronous calls.',
        refs: [{ title: 'Batch processing', url: 'https://docs.claude.com/en/docs/build-with-claude/batch-processing' }]
      },
      {
        domain: C, scenario: SC,
        question: 'The review job must never run shell commands, even if a PR contains prompt-injection text. It still needs to read and search code. How should the job be configured?',
        options: [
          { text: 'Add "Do not run shell commands" to the review prompt.', correct: false,
            why: 'Instructions can be overridden or ignored, especially when untrusted PR content is in context.' },
          { text: 'Run with --disallowedTools "Bash" so the tool is unavailable.', correct: true,
            why: 'Removing the tool through configuration makes shell execution impossible, whatever the prompt says.' },
          { text: 'Put the rule in CLAUDE.md.', correct: false,
            why: 'CLAUDE.md is guidance, not enforcement.' },
          { text: 'Ask a human to watch the job logs.', correct: false,
            why: 'By the time someone notices, the command has already run.' }
        ],
        explanation: 'For security boundaries, restrict capabilities through configuration (--allowedTools, --disallowedTools, permission modes, settings deny rules, or hooks) rather than instructions.\n\nThis matters most in CI, where untrusted PR content enters the context.',
        refs: [{ title: 'CLI reference', url: 'https://docs.claude.com/en/docs/claude-code/cli-reference' }, { title: 'Security', url: 'https://docs.claude.com/en/docs/claude-code/security' }]
      },
      {
        domain: X, scenario: SC,
        question: 'On an 80-file PR, review quality drops. Detailed findings cluster in the first and last files, and an obvious bug in file 41 is missed. Cross-file issues also matter. What design works best?',
        options: [
          { text: 'Review each file (or small group) in its own pass, then run a separate integration pass for cross-file issues.', correct: true,
            why: 'Focused passes keep per-file attention high, and the integration pass covers interactions between files.' },
          { text: 'Put the whole diff in one prompt and add "Review every file carefully."', correct: false,
            why: 'This is the setup that is already failing. Instructions do not overcome the attention drop in the middle of a long input.' },
          { text: 'Review only the first 20 files.', correct: false,
            why: 'This drops coverage of 75% of the change.' },
          { text: 'Enable extended thinking on the single large pass.', correct: false,
            why: 'More reasoning budget does not fix uneven attention across a very long input.' }
        ],
        explanation: 'Long inputs suffer from the "lost in the middle" effect. Split large reviews into per-file local passes plus a cross-file pass that gets summaries and interface changes.\n\nWithin any long prompt, put key information first and use clear section headers.',
        refs: [{ title: 'Long context prompting tips', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/long-context-tips' }]
      },
      {
        domain: P, scenario: SC,
        question: 'Every new commit to a PR re-runs the review, and the bot reposts the same eight comments, including ones the author already fixed. What should change?',
        options: [
          { text: 'Include the previous run\'s findings in the prompt, and ask for only new or still-unresolved issues, each marked new or unresolved.', correct: true,
            why: 'With prior state in the prompt, Claude can compare findings against the new code and report only what changed.' },
          { text: 'Lower the temperature so the comments are identical and easier to dedupe.', correct: false,
            why: 'Identical reposts are still noise, and fixed issues would still be reported.' },
          { text: 'Review only the latest commit\'s diff, ignoring earlier context.', correct: false,
            why: 'This misses issues that span commits and cannot tell whether old findings were fixed.' },
          { text: 'Post nothing on re-runs.', correct: false,
            why: 'New issues introduced by later commits would go unreported.' }
        ],
        explanation: 'Each run is stateless unless you pass state in. For iterative review, give the model the previous findings and the current code, and ask for a classification of each finding: fixed, still open, or new.\n\nThis keeps feedback actionable and reduces noise.',
        refs: [{ title: 'Claude Code GitHub Actions', url: 'https://docs.claude.com/en/docs/claude-code/github-actions' }]
      },
      {
        domain: C, scenario: SC,
        question: 'Developers want to run the same review procedure locally before pushing, and CI should use exactly the same one. Where should the procedure live?',
        options: [
          { text: 'In a project skill at .claude/skills/pr-review/SKILL.md, committed to the repo.', correct: true,
            why: 'Committed project skills reach every clone, including CI runners, with one source of truth.' },
          { text: 'In each developer\'s ~/.claude/skills/.', correct: false,
            why: 'Personal skills are not in the repository, so CI runners never see them.' },
          { text: 'Inline in the CI YAML only.', correct: false,
            why: 'Developers cannot easily run it locally, and two copies drift.' },
          { text: 'In .claude/settings.json.', correct: false,
            why: 'Settings hold permissions, hooks, and configuration, not procedures.' }
        ],
        explanation: 'Project-scoped skills and commands in .claude/ travel with the repository. A CI checkout gets them automatically, and so does every developer\'s clone.\n\nPersonal skills (~/.claude/skills) are for individual experiments.',
        refs: [{ title: 'Agent Skills', url: 'https://docs.claude.com/en/docs/claude-code/skills' }]
      },
      {
        domain: P, scenario: SC,
        question: 'Generated tests sometimes fail to compile. Some failures are typos in imports. Others call a fixture factory that does not exist anywhere in the repo. Which TWO practices fit? (Select TWO.)',
        options: [
          { text: 'Retry with the specific compiler errors added to the prompt.', correct: true,
            why: 'Specific error feedback lets Claude fix mechanical problems such as wrong imports or types.' },
          { text: 'When the needed fixture does not exist, stop retrying and report the gap, or provide the fixture\'s location in context.', correct: true,
            why: 'Retrying cannot create information that is missing. The fix is to supply the context or flag the gap.' },
          { text: 'Retry up to ten times with the same prompt.', correct: false,
            why: 'Retrying without feedback tends to repeat the same mistake.' },
          { text: 'Delete tests that fail to compile and report success.', correct: false,
            why: 'This hides failures and gives a false signal of coverage.' }
        ],
        explanation: 'Validation-and-retry loops work when the error is fixable from information the model already has. Feed back the specific error messages.\n\nWhen the failure comes from missing information, such as an absent fixture, more retries will not help. Supply the context or surface the gap.',
        refs: [{ title: 'Reduce hallucinations', url: 'https://docs.claude.com/en/docs/test-and-evaluate/strengthen-guardrails/reduce-hallucinations' }]
      },
      {
        domain: X, scenario: SC,
        question: 'Leadership wants the bot to auto-approve PRs when its self-reported confidence is above 0.9. An audit shows risky concurrency changes often got 0.95. What should approval routing use instead?',
        options: [
          { text: 'Keep the threshold but raise it to 0.99.', correct: false,
            why: 'The signal is not calibrated. Risky changes already score high, so any threshold misses them.' },
          { text: 'Explicit criteria based on observable properties, such as touching concurrency, auth, or migrations, or changing more than N files, which always require human review.', correct: true,
            why: 'Observable properties can be checked and do not depend on the model judging its own reliability.' },
          { text: 'Ask the model to re-rate its confidence after a second look.', correct: false,
            why: 'Self-review inherits the same blind spots.' },
          { text: 'Auto-approve everything that passes CI.', correct: false,
            why: 'Passing tests do not catch design flaws or missing tests.' }
        ],
        explanation: 'Self-rated confidence is a weak proxy for difficulty. Models are often confidently wrong on the hardest cases.\n\nRoute on explicit, observable criteria, and validate any automation policy against labeled outcomes, broken down by segment, before reducing human review.',
        refs: [{ title: 'Define success criteria', url: 'https://docs.claude.com/en/docs/test-and-evaluate/define-success' }]
      },
      {
        domain: X, scenario: SC,
        question: 'Each review request sends 12K tokens of static review guidelines and then the PR diff. Prompt caching is enabled, but there are almost no cache hits. The system prompt begins with "PR #1234 — run at 2026-10-12T08:00Z". What fixes it?',
        options: [
          { text: 'Move per-run values (PR number, timestamp) after the static guidelines, so the cached prefix is identical across runs.', correct: true,
            why: 'Caching matches an exact prefix. Changing text at the top makes every request a cache miss.' },
          { text: 'Switch to the 1-hour cache TTL.', correct: false,
            why: 'A longer TTL does not help when the prefix is different on every request.' },
          { text: 'Add more cache_control breakpoints.', correct: false,
            why: 'Breakpoints after content that changes each run still never match.' },
          { text: 'Lower max_tokens.', correct: false,
            why: 'Output length has no effect on prompt cache hits.' }
        ],
        explanation: 'Prompt caching reuses an exact prefix (tools, then system, then messages) up to a cache_control breakpoint. Put stable content first and variable content last.\n\nA single changing token near the start invalidates everything after it.',
        refs: [{ title: 'Prompt caching', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-caching' }]
      }
    ]
  });
})();

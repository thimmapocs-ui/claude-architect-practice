// Set 1 — Agent SDK: developer productivity agent. Original practice content.
(function () {
  const A = 'Agentic Architecture & Orchestration';
  const T = 'Tool Design & MCP Integration';
  const P = 'Prompt Engineering & Structured Output';
  const X = 'Context Management & Reliability';
  const SC = 'You are building an internal coding assistant with the Claude Agent SDK. It answers questions about a large monorepo, scaffolds new services, and automates routine maintenance using Read, Write, Edit, Bash, Grep, and Glob, plus MCP servers for the issue tracker and service catalog.';

  (window.QUESTION_SETS = window.QUESTION_SETS || []).push({
    id: 'set-01-agent-sdk',
    title: 'Set 1 · Agent SDK developer assistant',
    description: 'Subagents, the agent loop, tool design, hooks, and structured output in a coding-assistant scenario.',
    questions: [
      {
        domain: A, scenario: SC,
        question: 'The coordinator must investigate the auth, billing, and notifications modules. The three investigations are independent, and wall-clock time matters. How should the coordinator run them?',
        options: [
          { text: 'Emit three Agent tool calls in a single response, one per module.', correct: true,
            why: 'Multiple Agent tool calls in one response run the subagents concurrently. Total time is roughly that of the slowest investigation.' },
          { text: 'Spawn one subagent and instruct it to spawn a helper subagent for each module.', correct: false,
            why: 'Subagents cannot spawn their own subagents. Delegation fans out from the coordinator, which owns the Agent tool.' },
          { text: 'Define three AgentDefinitions in the agents option; the SDK runs every defined agent automatically.', correct: false,
            why: 'Definitions are templates. Nothing runs until the coordinator invokes one through the Agent tool.' },
          { text: 'Spawn one subagent per turn, waiting for each result before starting the next.', correct: false,
            why: 'Sequential delegation suits dependent steps. These investigations are independent, so waiting only adds latency.' }
        ],
        explanation: 'Parallelism in the Agent SDK comes from the coordinator issuing several Agent tool calls in the same assistant response. Each call starts an isolated subagent, and their final results come back to the coordinator, which synthesizes them.\n\nUse sequential delegation only when a later task needs an earlier task\'s output. Defining an agent never starts it, and subagents do not spawn their own subagents.',
        refs: [{ title: 'Subagents in the SDK', url: 'https://docs.claude.com/en/docs/agent-sdk/subagents' }]
      },
      {
        domain: A, scenario: SC,
        question: 'The coordinator delegates with the prompt "Fix the null-pointer bug in the files we looked at earlier." The subagent edits unrelated files. What is the most effective fix?',
        options: [
          { text: 'Give the subagent Grep and Glob so it can search for the files itself.', correct: false,
            why: 'More tools let it search, but it still has no idea which files "we looked at", so it is guessing.' },
          { text: 'Write the delegation prompt so it names the file paths, the stack trace, and what a correct fix looks like.', correct: true,
            why: 'A non-fork subagent starts with fresh context. The delegation prompt is the only channel for the parent\'s knowledge.' },
          { text: 'Raise the subagent\'s max turns so it has time to find the right files.', correct: false,
            why: 'More turns do not supply missing context. The subagent can explore longer and still pick the wrong files.' },
          { text: 'Configure the subagent to use the same model as the coordinator.', correct: false,
            why: 'The model is not the problem. A stronger model also cannot see conversation history it was never given.' }
        ],
        explanation: 'Subagents run in isolated context windows and do not see the coordinator\'s conversation. Phrases like "the files we discussed" point to context the subagent never received.\n\nGood delegation prompts are self-contained. They include the goal, the specific inputs (paths, errors, constraints), and the expected shape of the result.',
        refs: [{ title: 'Create custom subagents', url: 'https://docs.claude.com/en/docs/claude-code/sub-agents' }]
      },
      {
        domain: A, scenario: SC,
        question: 'A manual Messages API loop stops whenever the response text contains "Done", and sometimes ends mid-task. Which TWO rules should the loop follow? (Select TWO.)',
        options: [
          { text: 'Continue while stop_reason is "tool_use": run the requested tools, append the results, and call the API again.', correct: true,
            why: '"tool_use" is the structural signal that Claude wants more work done. "end_turn" signals a finished turn.' },
          { text: 'Treat stop_reason "max_tokens" as truncated output, not as completion, and handle it explicitly.', correct: true,
            why: 'max_tokens means generation was cut off. Treating it as success ships partial answers or broken tool calls.' },
          { text: 'Stop as soon as a response contains any text block.', correct: false,
            why: 'Claude often writes explanatory text alongside tool_use blocks. Text does not mean the work is finished.' },
          { text: 'Use a fixed limit of five iterations as the main completion signal.', correct: false,
            why: 'An iteration cap is a useful safety valve, but it is not a completion signal. Tasks legitimately need different numbers of steps.' }
        ],
        explanation: 'Loop control should depend on stop_reason, never on parsing the model\'s prose. "tool_use" means continue, "end_turn" means done, and "max_tokens" means the output was truncated and needs handling (for example, retry with a higher limit).\n\nKeep an iteration cap only as a guard against runaway loops.',
        refs: [{ title: 'Handling stop reasons', url: 'https://docs.claude.com/en/api/handling-stop-reasons' }]
      },
      {
        domain: T, scenario: SC,
        question: 'The MCP server exposes search_code ("Searches the codebase") and find_symbol ("Finds things in code"). The agent often calls the wrong one. What should you change first?',
        options: [
          { text: 'Add a system prompt line telling the agent to prefer find_symbol.', correct: false,
            why: 'A blanket preference just moves the misrouting the other way. It does not tell the model when each tool fits.' },
          { text: 'Set tool_choice to force find_symbol on every request.', correct: false,
            why: 'Forcing one tool removes the choice entirely, so text searches that need search_code break.' },
          { text: 'Rewrite both descriptions to state what each tool takes, what it returns, and when to use it rather than the other.', correct: true,
            why: 'Tool descriptions are the main signal for tool selection. Clear, non-overlapping boundaries fix the routing at its source.' },
          { text: 'Rename the tools so they sort alphabetically in a meaningful order.', correct: false,
            why: 'Tool order and alphabetical sorting are not how the model decides. Vague descriptions are the problem.' }
        ],
        explanation: 'Anthropic\'s guidance calls detailed tool descriptions the most important factor in tool performance. A good description says what the tool does, what inputs it expects, what it returns, its limits, and how it differs from similar tools.\n\nFor example: "find_symbol: resolves a function, class, or variable name to its definition location. Use search_code for free-text or regex searches."',
        refs: [{ title: 'Define tools', url: 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use' }]
      },
      {
        domain: T, scenario: SC,
        question: 'The coordinator gives every subagent all 24 tools from four MCP servers. Tool-selection errors rise as tools are added. Which change helps most?',
        options: [
          { text: 'Give each subagent only the tools its role needs, using the tools field of its AgentDefinition.', correct: true,
            why: 'Fewer, role-relevant tools mean fewer chances to pick the wrong one, and each subagent stays focused on its job.' },
          { text: 'Keep all tools everywhere so subagents can handle surprises.', correct: false,
            why: 'This is the configuration that is already producing errors. Flexibility you rarely use has a real cost in selection accuracy.' },
          { text: 'Make every tool description longer.', correct: false,
            why: 'Better descriptions help, but making all 24 longer does not remove the ambiguity of choosing from too many options.' },
          { text: 'Raise the temperature so the model explores other tools.', correct: false,
            why: 'Higher randomness makes tool selection less reliable, not more.' }
        ],
        explanation: 'Tool-selection accuracy drops as the number of available tools grows, especially when several overlap. Scoping tools per subagent through AgentDefinition.tools is a configuration-level fix: the explorer gets read and search tools, the scaffolder gets write tools, and so on.\n\nThis also enforces least privilege.',
        refs: [{ title: 'Subagents in the SDK', url: 'https://docs.claude.com/en/docs/agent-sdk/subagents' }]
      },
      {
        domain: T, scenario: SC,
        question: 'The create_issue MCP tool fails for three reasons: invalid project key, missing permission, and a transient rate limit. Which TWO changes help the agent recover correctly? (Select TWO.)',
        options: [
          { text: 'Return each failure with isError: true and a message naming the cause and the next step, such as "Rate limited; retry after 30s".', correct: true,
            why: 'Specific, actionable error text lets the model choose the right response: retry, fix the input, or stop.' },
          { text: 'Include a structured field such as retryable: true or false so the agent never retries a permission failure.', correct: true,
            why: 'Telling transient failures apart from permanent ones keeps the agent from retrying requests that can never succeed.' },
          { text: 'Return the same "Operation failed" message for all errors to keep responses consistent.', correct: false,
            why: 'Generic errors force the model to guess. It then retries permanent failures or gives up on transient ones.' },
          { text: 'Return a success result with an empty body so the loop never stalls.', correct: false,
            why: 'Hiding failures as successes makes the agent report that issues were created when they were not.' }
        ],
        explanation: 'Tool errors are input the model reasons over. Mark real failures with isError and make the content actionable: what went wrong, whether a retry can help, and what to change.\n\nKeep valid empty results (for example, "no issues match") separate from failures, so the agent does not retry a query that already returned a real answer.',
        refs: [{ title: 'Handle tool calls', url: 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/handle-tool-calls' }]
      },
      {
        domain: A, scenario: SC,
        question: 'Policy says the agent must never run `git push --force`. A system prompt rule already exists, but a forced push still happened in testing. What enforces the policy?',
        options: [
          { text: 'Repeat the rule in CLAUDE.md in capital letters.', correct: false,
            why: 'Louder instructions are still instructions. Compliance stays probabilistic.' },
          { text: 'A PostToolUse hook that reverts the push after it runs.', correct: false,
            why: 'PostToolUse fires after execution, so the remote has already been overwritten. Reverting afterwards is damage control, not prevention.' },
          { text: 'A PreToolUse hook on Bash that inspects the command and denies forced pushes.', correct: true,
            why: 'PreToolUse runs before the tool executes and can deny the call in code, so the rule holds on every run.' },
          { text: 'Remove Bash from the agent entirely.', correct: false,
            why: 'That blocks forced pushes, but it also blocks the builds, tests, and git commands the agent needs.' }
        ],
        explanation: 'When a rule must always hold, enforce it deterministically at a lifecycle hook instead of relying on the prompt. A PreToolUse hook sees tool_name and tool_input before execution and can return a deny decision with a reason the model can read.\n\nKeep prompt instructions for preferences, where an occasional miss is acceptable.',
        refs: [{ title: 'Hooks reference', url: 'https://docs.claude.com/en/docs/claude-code/hooks' }]
      },
      {
        domain: P, scenario: SC,
        question: 'The scaffolder must emit a service manifest that a deploy script parses. With the prompt "Respond only with JSON", about 3% of runs add prose or omit fields. Two tools are defined: emit_manifest and ask_clarifying_question. For this step you need emit_manifest every time. What should you use?',
        options: [
          { text: 'tool_choice {"type": "tool", "name": "emit_manifest"}, with the manifest schema as its input_schema.', correct: true,
            why: 'Forcing the specific tool guarantees a tool call shaped by that schema instead of free text.' },
          { text: 'tool_choice {"type": "any"}.', correct: false,
            why: '"any" guarantees some tool call, but the model could still choose ask_clarifying_question.' },
          { text: 'Lower the temperature to 0.', correct: false,
            why: 'Lower temperature reduces variety but does not guarantee format. The 3% failure mode can persist.' },
          { text: 'Post-process the output with a regex that extracts the first JSON object.', correct: false,
            why: 'Repairing output treats the symptom and still fails when required fields are missing.' }
        ],
        explanation: 'Tool use with a JSON schema is the standard way to get reliable structured output. tool_choice controls whether and which tool is called: "auto" lets the model decide, "any" requires some tool, and {"type":"tool","name":...} forces one specific tool.\n\nFor guaranteed schema conformance of the input, you can also set strict: true on the tool definition.',
        refs: [{ title: 'Tool use: forcing tool use', url: 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use' }]
      },
      {
        domain: X, scenario: SC,
        question: 'In a long maintenance session, the agent agrees early on to target Node 20 and keep the v2 API prefix. After context compaction, it scaffolds a service with Node 18 and no prefix. What prevents this?',
        options: [
          { text: 'Have the agent record key decisions in a notes file it re-reads before each new phase.', correct: true,
            why: 'A file outside the conversation survives compaction exactly, and re-reading it restores the decisions without loss.' },
          { text: 'Disable compaction so the history is never summarized.', correct: false,
            why: 'Without compaction a long session eventually runs out of context. Quality also drops as the window fills.' },
          { text: 'Raise max_tokens on each request.', correct: false,
            why: 'max_tokens limits the length of the output, not how much history is kept.' },
          { text: 'Run /clear after every phase.', correct: false,
            why: 'Clearing throws away the decisions entirely, which is the opposite of what is needed.' }
        ],
        explanation: 'Summaries lose detail, and exact values (versions, paths, prefixes) are the first to go. Store decisions that later phases depend on in a persistent artifact, such as a scratchpad file or a structured "decisions" block, that the agent re-reads.\n\nCompacting at natural task boundaries, with instructions about what to keep, also helps.',
        refs: [{ title: 'Claude Code best practices', url: 'https://www.anthropic.com/engineering/claude-code-best-practices' }]
      },
      {
        domain: A, scenario: SC,
        question: 'An engineer wants to continue yesterday\'s investigation session. Since then, a teammate merged changes to two of the files the session analyzed. What is the best way to continue?',
        options: [
          { text: 'Resume the session and say nothing; the earlier tool results are still in context.', correct: false,
            why: 'Those tool results describe code that has since changed. The agent would reason from stale evidence.' },
          { text: 'Resume the session and tell the agent which two files changed, so it re-reads them before continuing.', correct: true,
            why: 'This keeps the valuable prior reasoning and targets re-analysis at exactly the stale inputs.' },
          { text: 'Start a fresh session and repeat the entire investigation.', correct: false,
            why: 'This is safe but wasteful when only two files changed. Most of the earlier findings are still valid.' },
          { text: 'Fork the session twice and compare the forks.', correct: false,
            why: 'Forks inherit the same stale context. Comparing them does not refresh anything.' }
        ],
        explanation: 'Resuming restores full context, which is efficient when that context is still accurate. When some inputs have changed, resume and explicitly direct a re-read of the changed files.\n\nIf most earlier tool results are stale, start fresh with a short structured summary of the conclusions that still hold.',
        refs: [{ title: 'Sessions in the Agent SDK', url: 'https://docs.claude.com/en/docs/agent-sdk/sessions' }]
      },
      {
        domain: P, scenario: SC,
        question: 'The agent labels each commit as feat, fix, refactor, or chore. Clear cases are labeled consistently, but borderline cases (such as a refactor that also fixes a bug) flip between runs. What helps most?',
        options: [
          { text: 'Add the instruction "Be consistent when labeling."', correct: false,
            why: 'This states the goal without defining the boundary the model is unsure about.' },
          { text: 'Add more categories so borderline commits fit better.', correct: false,
            why: 'More categories create more boundaries and more ambiguity.' },
          { text: 'Add few-shot examples of borderline commits, each with the chosen label and a one-line reason.', correct: true,
            why: 'Examples show where the boundary lies and why, which is what the model is missing for the hard cases.' },
          { text: 'Ask the model to output a confidence score and drop low-confidence labels.', correct: false,
            why: 'Self-reported confidence is poorly calibrated on the hardest cases, so it does not fix inconsistency.' }
        ],
        explanation: 'Few-shot examples work best when they target the ambiguous cases. Pick two to four borderline examples, show the correct label, and give a short reason.\n\nThis teaches the decision rule more reliably than abstract prose or extra categories.',
        refs: [{ title: 'Use examples (multishot prompting)', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting' }]
      },
      {
        domain: X, scenario: SC,
        question: 'Two research subagents report different test-coverage figures for the payments package: 64% from last quarter\'s CI report and 81% from this week\'s local run. How should the synthesis step handle this?',
        options: [
          { text: 'Report the higher figure, because coverage tends to increase over time.', correct: false,
            why: 'That is an assumption. The difference could come from scope or method, not progress.' },
          { text: 'Average the two and report 72.5%.', correct: false,
            why: 'An average of two measurements with different methods and dates matches neither and hides the conflict.' },
          { text: 'Report both values with their sources and dates, and note the conflict.', correct: true,
            why: 'Keeping provenance lets the reader see that the figures differ in date and method, and decide which applies.' },
          { text: 'Drop both figures because they conflict.', correct: false,
            why: 'Dropping data loses information. Both measurements are real and useful with context.' }
        ],
        explanation: 'In multi-agent synthesis, keep the mapping from each claim to its source through every handoff. When sources conflict, include both values with their source, date, and method, and flag the discrepancy.\n\nDo not silently pick a winner. Resolve it only when the evidence actually supports doing so.',
        refs: [{ title: 'How we built our multi-agent research system', url: 'https://www.anthropic.com/engineering/built-multi-agent-research-system' }]
      }
    ]
  });
})();

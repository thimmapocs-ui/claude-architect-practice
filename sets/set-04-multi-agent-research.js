// Set 4 — Multi-agent research system. Original practice content.
(function () {
  const A = 'Agentic Architecture & Orchestration';
  const T = 'Tool Design & MCP Integration';
  const X = 'Context Management & Reliability';
  const SC = 'You are building a market-intelligence system with the Claude Agent SDK. A coordinator delegates to subagents for web search, filing analysis, synthesis, and report writing. Reports must be well cited and are reviewed by analysts.';

  (window.QUESTION_SETS = window.QUESTION_SETS || []).push({
    id: 'set-04-multi-agent-research',
    title: 'Set 4 · Multi-agent research system',
    description: 'Coordinator/subagent design, loop termination, tool_choice sequencing, MCP resources, hooks, and escalation handoffs.',
    questions: [
      {
        domain: A, scenario: SC,
        question: 'The filing-analysis subagent\'s response has stop_reason "max_tokens", and its last block is a tool_use whose JSON input is cut off. What should the harness do?',
        options: [
          { text: 'Close the open braces and execute the tool with the repaired input.', correct: false,
            why: 'Valid syntax does not restore the missing values, so the tool would run with invented or missing arguments.' },
          { text: 'Retry the request with a higher max_tokens, then execute the complete tool call.', correct: true,
            why: 'The output ran out of tokens. More room lets Claude finish the tool call properly.' },
          { text: 'Return a tool_result with is_error: true for the truncated call.', correct: false,
            why: 'Error results pair with complete tool calls. A truncated block is not a valid call to answer.' },
          { text: 'Treat the response as final and pass the text so far to the coordinator.', correct: false,
            why: 'max_tokens is not completion. The coordinator would get an unfinished result.' }
        ],
        explanation: 'Branch on stop_reason. tool_use means execute and continue, end_turn means finished, and max_tokens means truncated. When truncation cuts through a tool_use block, retry with a larger output limit.\n\nNever repair or execute partial tool input.',
        refs: [{ title: 'Handling stop reasons', url: 'https://docs.claude.com/en/api/handling-stop-reasons' }]
      },
      {
        domain: A, scenario: SC,
        question: 'An Agent SDK harness runs with max_turns set to 20. It should publish a report only when the run truly finished, and flag runs that were cut off. What should it check?',
        options: [
          { text: 'Whether the final text contains "Report complete".', correct: false,
            why: 'Parsing the model\'s wording is fragile. The phrase can be missing on success or appear early.' },
          { text: 'The ResultMessage subtype: "success" means finished, and "error_max_turns" means the cap stopped an incomplete run.', correct: true,
            why: 'The result subtype is the SDK\'s structural signal for how the loop ended.' },
          { text: 'Whether the run used fewer than 20 turns.', correct: false,
            why: 'A turn count is only indirect evidence. It does not cover other error outcomes, such as budget limits or execution errors.' },
          { text: 'Whether the last assistant message has no tool calls.', correct: false,
            why: 'A capped run may never produce that message, and this gives no explicit signal about other errors.' }
        ],
        explanation: 'The Agent SDK ends the stream with a ResultMessage whose subtype reports the outcome (success, error_max_turns, error_during_execution, and so on). Check the subtype before using the result.\n\nTreat turn and budget caps as safety valves, not as completion.',
        refs: [{ title: 'Agent SDK overview', url: 'https://docs.claude.com/en/docs/agent-sdk/overview' }]
      },
      {
        domain: T, scenario: SC,
        question: 'The synthesis subagent must report every finding through one of three tools: log_metric, log_quote, or log_claim. Sometimes it answers in plain text instead. The right tool depends on the finding. What should you set?',
        options: [
          { text: 'tool_choice {"type": "any"}', correct: true,
            why: 'This forces a call to one of the provided tools while still letting the model choose which one fits.' },
          { text: 'tool_choice {"type": "tool", "name": "log_claim"}', correct: false,
            why: 'This forces every finding through one schema, including metrics and quotes that need different fields.' },
          { text: 'Keep "auto" and add "Always use a tool" to the system prompt.', correct: false,
            why: 'This raises the odds of a tool call, but under "auto" the model can still answer in text.' },
          { text: 'Set strict: true on the three tools.', correct: false,
            why: 'Strict mode constrains the inputs of a tool call. It does not force a tool call to happen.' }
        ],
        explanation: 'tool_choice has four settings: "auto" lets the model decide, "any" requires some tool, "tool" forces a named tool, and "none" allows no tools.\n\nCombine "any" with strict: true when you need both a guaranteed tool call and schema-conformant inputs.',
        refs: [{ title: 'Implement tool use', url: 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use' }]
      },
      {
        domain: T, scenario: SC,
        question: 'The filing-analysis subagent must call fetch_filing_index before any other tool. After that, it may call any analysis tool or finish with text. Which TWO settings implement this? (Select TWO.)',
        options: [
          { text: 'First request: tool_choice {"type": "tool", "name": "fetch_filing_index"}.', correct: true,
            why: 'Forcing the named tool makes the first step certain rather than likely.' },
          { text: 'Follow-up requests: tool_choice {"type": "auto"}.', correct: true,
            why: 'After the forced step, "auto" lets the model choose analysis tools or write its final answer.' },
          { text: 'Every request: tool_choice {"type": "any"}.', correct: false,
            why: '"any" does not control which tool comes first, and it blocks a final text answer.' },
          { text: 'Follow-up requests: tool_choice {"type": "none"}.', correct: false,
            why: '"none" would block the analysis tools the later steps need.' }
        ],
        explanation: 'To enforce order, force the required tool on the first request, then relax tool_choice on later requests. Leaving the forced setting in place traps the loop.\n\nPrompt instructions alone make the order likely, not guaranteed.',
        refs: [{ title: 'Implement tool use', url: 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use' }]
      },
      {
        domain: T, scenario: SC,
        question: 'Subagents waste their first several tool calls finding out which datasets exist and what fields they contain. The catalog changes daily. Which MCP design fits best?',
        options: [
          { text: 'Hard-code today\'s catalog into each subagent\'s system prompt.', correct: false,
            why: 'The catalog changes daily, so the prompt is stale by tomorrow.' },
          { text: 'Expose the catalog as an MCP resource, with a resource template such as datasets://{id}/schema for per-dataset details.', correct: true,
            why: 'Resources are MCP\'s primitive for readable data. The host can attach the catalog up front, and every read returns current data.' },
          { text: 'Add a list_datasets tool and tell agents to call it first.', correct: false,
            why: 'This still spends a tool call on discovery every session, and it wraps read-only data as an action.' },
          { text: 'Let agents guess dataset names and retry on errors.', correct: false,
            why: 'Trial and error wastes calls and invites hallucinated names.' }
        ],
        explanation: 'MCP separates resources (data to read, addressed by URI, with templates for parameterized families) from tools (actions).\n\nExposing a content catalog as a resource gives agents a map of what exists before they act, and it stays current because the server answers each read.',
        refs: [{ title: 'MCP: Resources', url: 'https://modelcontextprotocol.io/docs/concepts/resources' }]
      },
      {
        domain: A, scenario: SC,
        question: 'One request asks three independent questions about a company: supply-chain risk, pending patents, and executive turnover. The coordinator holds a company profile all three need. Today, one subagent answers all three and its coverage is shallow. What should the coordinator do?',
        options: [
          { text: 'Spawn three subagents in one response, each with one question and the company profile copied into its prompt.', correct: true,
            why: 'Focused subtasks give each question depth, and parallel calls save time. The profile must be in each prompt because subagents do not see the coordinator\'s history.' },
          { text: 'Spawn three subagents with short prompts. They can read the profile from the coordinator\'s conversation.', correct: false,
            why: 'Non-fork subagents start fresh. The only parent content they receive is the delegation prompt.' },
          { text: 'Chain three subagents, each given the previous one\'s findings.', correct: false,
            why: 'Chaining suits dependent steps. These questions are independent, so it only adds latency.' },
          { text: 'Keep one subagent and ask it to answer the questions one at a time.', correct: false,
            why: 'Juggling three concerns in one context is the cause of the shallow coverage.' }
        ],
        explanation: 'Split multi-concern requests into focused subtasks. Run independent subtasks in parallel by emitting several Agent tool calls in one response, and pass the shared context explicitly in every delegation prompt.\n\nThe coordinator then synthesizes the results.',
        refs: [{ title: 'Subagents in the SDK', url: 'https://docs.claude.com/en/docs/agent-sdk/subagents' }]
      },
      {
        domain: A, scenario: SC,
        question: 'The coordinator keeps sending filing-analysis work to the general-purpose subagent. The custom filings agent has a detailed prompt, but its description is just "Document helper." What fixes the routing?',
        options: [
          { text: 'Rewrite the description to name the tasks it handles, for example "Analyzes SEC 10-K/10-Q filings: extracts risk factors, segment revenue, and guidance changes."', correct: true,
            why: 'Claude chooses which subagent to use by reading the descriptions, before any prompt loads.' },
          { text: 'Make the agent\'s prompt even more detailed.', correct: false,
            why: 'The prompt becomes the subagent\'s system prompt only after delegation, so it has no effect on selection.' },
          { text: 'Give the filings agent the Agent tool.', correct: false,
            why: 'The Agent tool lets an agent spawn subagents. It does not affect whether the coordinator picks this one.' },
          { text: 'Remove the general-purpose agent from the system.', correct: false,
            why: 'This works around the symptom. Other tasks may need the general-purpose agent, and the vague description is still the root cause.' }
        ],
        explanation: 'AgentDefinition.description is used at selection time, and AgentDefinition.prompt is used after delegation. Put "when to use me" in the description: the specific tasks, inputs, and triggers.',
        refs: [{ title: 'Create custom subagents', url: 'https://docs.claude.com/en/docs/claude-code/sub-agents' }]
      },
      {
        domain: A, scenario: SC,
        question: 'Compliance requires that no request ever reaches domains on a blocklist. A prompt rule already failed once in testing, and the search subagent must keep fetching allowed sites. What enforces this?',
        options: [
          { text: 'A PreToolUse hook on WebFetch that denies calls whose URL host is on the blocklist.', correct: true,
            why: 'The hook inspects tool_input before execution and denies in code, so the request is never sent.' },
          { text: 'A PostToolUse hook that strips blocked content from the results.', correct: false,
            why: 'By then the request has already reached the blocked server.' },
          { text: 'Disallow WebFetch entirely.', correct: false,
            why: 'This also blocks the allowed fetching the subagent needs.' },
          { text: 'Repeat the blocklist in the subagent\'s system prompt.', correct: false,
            why: 'Prompt compliance is probabilistic, and it has already failed once.' }
        ],
        explanation: 'Use PreToolUse hooks for rules that must always hold and depend on the arguments. Match the tool, inspect tool_input, and return a deny decision with a reason.\n\nPostToolUse is for transforming results after execution, not for prevention.',
        refs: [{ title: 'Hooks in the Agent SDK', url: 'https://docs.claude.com/en/docs/agent-sdk/hooks' }]
      },
      {
        domain: A, scenario: SC,
        question: 'A teammate proposes letting the search subagent message the synthesis subagent directly. You need every finding to pass through the coordinator, guaranteed on unattended runs. Which TWO choices achieve this? (Select TWO.)',
        options: [
          { text: 'Leave any peer-messaging tool out of each subagent\'s explicit tools list.', correct: true,
            why: 'A tool that is not configured does not exist for the subagent, so direct contact is impossible.' },
          { text: 'Have the coordinator collect each result and pass the relevant findings in the next subagent\'s delegation prompt.', correct: true,
            why: 'Routing through the coordinator keeps every handoff visible and lets it control what each subagent receives.' },
          { text: 'Give both subagents a shared findings file to read and write.', correct: false,
            why: 'This creates a side channel that bypasses the coordinator entirely.' },
          { text: 'Tell subagents in their prompts to report only to the coordinator.', correct: false,
            why: 'A prompt rule is not a guarantee, especially on unattended runs.' }
        ],
        explanation: 'Hub-and-spoke routing gives observability, consistent error handling, and controlled information flow.\n\nEnforce it through capability configuration (the tools lists), not instructions, and have the coordinator pass context explicitly.',
        refs: [{ title: 'Subagents in the SDK', url: 'https://docs.claude.com/en/docs/agent-sdk/subagents' }]
      },
      {
        domain: T, scenario: SC,
        question: 'The search tool fails for three reasons (rate limit, query too long, paywalled source), and every failure returns is_error with the text "search failed". The agent retries paywalls and gives up on rate limits. What fixes its recovery?',
        options: [
          { text: 'Return a distinct message per cause that says what failed and what to do, for example "Rate limited: retry after 60s" or "Query exceeds 400 chars: shorten it".', correct: true,
            why: 'Specific, actionable errors let the model pick the right recovery for each cause.' },
          { text: 'Have the coordinator retry every failure twice with backoff.', correct: false,
            why: 'This helps only the transient cause. Paywalls and overlong queries fail the same way every time.' },
          { text: 'Add a system prompt list of which causes are retryable.', correct: false,
            why: 'The error text never names a cause, so the model cannot apply the list.' },
          { text: 'Retry silently in the harness before Claude sees the error.', correct: false,
            why: 'This hides the failures the model needs to adapt to, such as shortening the query or skipping the source.' }
        ],
        explanation: 'is_error marks a failure, and the content explains it. Make the content say what went wrong, whether retrying can help, and what to change.\n\nGeneric error text forces the model to guess.',
        refs: [{ title: 'Handle tool calls', url: 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/handle-tool-calls' }]
      },
      {
        domain: X, scenario: SC,
        question: 'The system finds that a regulator\'s 2023 report lists 4,100 market participants, while a 2025 trade survey with a different methodology lists 6,800. Analysts, who cannot see transcripts, must decide quickly. What should the escalation contain?',
        options: [
          { text: 'Both figures with source, date, and method; the checks already done; and a recommended next step.', correct: true,
            why: 'A self-contained handoff keeps the evidence and lets a time-pressed analyst decide quickly.' },
          { text: 'The 2025 figure only, marked as current.', correct: false,
            why: 'This assumes the gap is growth over time, when the methods also differ. The system would be resolving the very question it escalated.' },
          { text: 'Both figures and the full raw outputs from every subagent.', correct: false,
            why: 'Raw dumps force the analyst to redo the agents\' analysis.' },
          { text: 'Both figures labeled "contradictory", with no dates.', correct: false,
            why: 'Leaving out dates hides the most likely explanation for the difference.' }
        ],
        explanation: 'Escalations must stand alone. Include the conflicting values with full attribution (source, date, method), a summary of what was verified, and a recommendation.\n\nPreserve both values instead of silently choosing one.',
        refs: [{ title: 'How we built our multi-agent research system', url: 'https://www.anthropic.com/engineering/built-multi-agent-research-system' }]
      },
      {
        domain: A, scenario: SC,
        question: 'A request covers an emerging topic whose structure is unknown, and the token budget is tight. A fixed subtopic template missed key areas on similar topics before. How should the coordinator decompose the work?',
        options: [
          { text: 'Run a short scoping pass to map the topic, then build a prioritized delegation plan and adjust it as findings arrive.', correct: true,
            why: 'Mapping the topic first means the budget goes to high-value subtopics.' },
          { text: 'Reuse the fixed template and run all subtopics in parallel.', correct: false,
            why: 'A template written before the topic\'s structure is known will miss areas, as it has before.' },
          { text: 'Spawn subagents for every plausible angle at once.', correct: false,
            why: 'Unprioritized breadth burns the limited budget on low-value, overlapping work.' },
          { text: 'Do one broad pass, then patch gaps found at synthesis time.', correct: false,
            why: 'This finds gaps only after the budget is spent on a possibly misdirected first pass.' }
        ],
        explanation: 'Use fixed pipelines for predictable work and adaptive decomposition for open-ended work. For open-ended work, first explore cheaply (often in a subagent), then plan, then execute, and re-plan as you learn.',
        refs: [{ title: 'Building effective agents', url: 'https://www.anthropic.com/engineering/building-effective-agents' }]
      }
    ]
  });
})();

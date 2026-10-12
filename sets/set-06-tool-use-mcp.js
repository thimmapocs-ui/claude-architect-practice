// Set 6 — Tool use mechanics, MCP servers & sessions. Original practice content.
(function () {
  const A = 'Agentic Architecture & Orchestration';
  const T = 'Tool Design & MCP Integration';
  const C = 'Claude Code Configuration & Workflows';
  const SC = 'Your platform team is building a release-automation agent. Some steps call the Messages API with a hand-written tool loop; others run on the Claude Agent SDK with custom MCP servers for deployments, tickets, and runbooks.';

  (window.QUESTION_SETS = window.QUESTION_SETS || []).push({
    id: 'set-06-tool-use-mcp',
    title: 'Set 6 · Tool use mechanics, MCP & sessions',
    description: 'Message layout for tool results, forced tool_choice side effects, strict tools, pause_turn, hook gates, MCP errors and notifications, server scopes, subagent tool lists, and session forking.',
    questions: [
      {
        domain: A, scenario: SC,
        question: 'Claude returns two tool_use blocks. After running them, your loop must also record an audit note ("executed by runner-7 at 10:02") that stays in the conversation history. Which next message does the API accept?',
        options: [
          { text: 'One user message, sent right after the assistant message, containing both tool_result blocks first and the audit note as a text block after them.', correct: true,
            why: 'Results must be in the message immediately after the tool_use message, and inside that message the tool_result blocks come before any text.' },
          { text: 'One user message with the audit note as the first text block, followed by both tool_result blocks.', correct: false,
            why: 'Text placed before the tool_result blocks breaks the ordering rule, so the request is rejected.' },
          { text: 'A user message with the audit note, then a second user message with the two tool_result blocks.', correct: false,
            why: 'The results no longer immediately follow the assistant tool_use message, which the API rejects.' },
          { text: 'Drop the note from the history and log it only in the runner, since tool results cannot share a message with text.', correct: false,
            why: 'Text is allowed after the results. Dropping the note also breaks the requirement that it stays in the history.' }
        ],
        explanation: 'For client tools, the reply to an assistant tool_use message is a user message whose content starts with one tool_result per tool_use_id. Any extra text goes after those blocks.\n\nPut nothing between the assistant message and that user message.',
        refs: [{ title: 'Handle tool calls', url: 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/handle-tool-calls' }]
      },
      {
        domain: T, scenario: SC,
        question: 'The first request uses tool_choice {"type": "tool", "name": "get_release_calendar"}. The response ends with stop_reason "tool_use", and no calendar data appears anywhere. A teammate says the API failed to run the tool. What is actually going on, and what should the loop do?',
        options: [
          { text: 'Nothing failed. The API never runs client tools. Run the tool, return a tool_result with the matching tool_use_id, and relax tool_choice on the follow-up request.', correct: true,
            why: 'Forcing a tool only controls what Claude asks for. Running it, and then letting Claude move on, is the harness\'s job.' },
          { text: 'Retry the same request, because the tool call was probably dropped by a transient error.', correct: false,
            why: 'The response is complete and correct. Retrying just produces the same tool request again.' },
          { text: 'Switch to tool_choice {"type": "any"} so the API runs whichever tool Claude picks.', correct: false,
            why: 'No tool_choice setting makes the API execute a client tool.' },
          { text: 'Paste the calendar into the next request as a plain user text message.', correct: false,
            why: 'An open tool_use must be answered with a tool_result that references its ID. Plain text leaves the call unanswered.' }
        ],
        explanation: 'stop_reason "tool_use" hands control back to your code. Execute the tool, append the tool_result, and send a new request.\n\nIf you leave the forced tool_choice in place, Claude has to call the same tool again, so switch to "auto" once the forced step is done.',
        refs: [{ title: 'Implement tool use', url: 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use' }]
      },
      {
        domain: T, scenario: SC,
        question: 'A triage step must always end with a call to one of three routing tools, so it uses tool_choice {"type": "any"}. Reviewers want a short reason for each routing decision, but the responses contain only tool_use blocks, even though the prompt asks Claude to explain first. What should you change?',
        options: [
          { text: 'Add a required rationale field to each routing tool\'s input schema and keep tool_choice as "any".', correct: true,
            why: 'The reason then arrives inside the forced tool call, so you keep both the guaranteed call and the explanation.' },
          { text: 'Repeat the "explain first" instruction in every user turn and mark it IMPORTANT.', correct: false,
            why: 'With "any" or a named tool, the API prefills the assistant turn to force tool use, so no text can come before the call, whatever the prompt says.' },
          { text: 'Switch tool_choice to "auto" and keep the instruction.', correct: false,
            why: 'The text would come back, but "auto" lets Claude answer without calling a tool. The step requires a call every time.' },
          { text: 'Set disable_parallel_tool_use to true.', correct: false,
            why: 'This only limits how many tools Claude can call in one response. It does not allow text before the call.' }
        ],
        explanation: 'Forced tool use ("any" or a named tool) means no natural-language preamble. If you need both a guaranteed call and reasoning, put the reasoning in the tool input.\n\nIf a tool call does not have to be guaranteed, "auto" plus a clear instruction gives you the text and usually the call too.',
        refs: [{ title: 'Implement tool use', url: 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use' }]
      },
      {
        domain: T, scenario: SC,
        question: 'Claude calls record_release on every run, but sometimes passes build_number as the string "1042" instead of an integer, or leaves out the required environment field. Which change guarantees that tool inputs match the schema?',
        options: [
          { text: 'Add "strict": true to the record_release tool definition.', correct: true,
            why: 'Strict tool use constrains generation so the input always matches input_schema, including types and required fields.' },
          { text: 'Force the tool with tool_choice {"type": "tool", "name": "record_release"}.', correct: false,
            why: 'Claude already calls the tool every time. Forcing it controls whether it is called, not how the input is shaped.' },
          { text: 'Validate inputs in code and retry with the error messages.', correct: false,
            why: 'This is a sound fallback, but it fixes errors after they happen, adds calls, and still guarantees nothing.' },
          { text: 'Write longer descriptions for each schema property.', correct: false,
            why: 'Descriptions guide the model but do not enforce types.' }
        ],
        explanation: 'Without strict mode, tool inputs usually follow the schema, but not always. With strict: true, Claude is constrained to produce valid inputs.\n\nA valid shape still is not a correct value, so keep semantic checks (for example, "does this build exist?") in code.',
        refs: [{ title: 'Structured outputs', url: 'https://docs.claude.com/en/docs/build-with-claude/structured-outputs' }]
      },
      {
        domain: A, scenario: SC,
        question: 'A research step uses the server-side web search tool. Some responses come back with stop_reason "pause_turn" and no final answer. What should the application do?',
        options: [
          { text: 'Send a follow-up request that includes the paused assistant content as it is, so Claude can continue the turn.', correct: true,
            why: 'pause_turn means the API paused a long-running server-tool turn. Sending the content back lets Claude resume where it stopped.' },
          { text: 'Treat the partial content as the final answer.', correct: false,
            why: 'The turn is not finished, so the answer may be incomplete.' },
          { text: 'Run the web search locally and return a tool_result block.', correct: false,
            why: 'Web search is a server tool that the API runs itself. pause_turn is not a request for your code to run anything.' },
          { text: 'Throw away the response and resend the original request.', correct: false,
            why: 'This discards the searches already done and may pause again at the same point.' }
        ],
        explanation: 'Branch on stop_reason. With client tools, "tool_use" means run the tool and return results. With server tools, "pause_turn" means pass the assistant content back so Claude can continue. "end_turn" means finished, and "max_tokens" means the output was cut off.',
        refs: [{ title: 'Handling stop reasons', url: 'https://docs.claude.com/en/api/handling-stop-reasons' }]
      },
      {
        domain: T, scenario: SC,
        question: 'The system prompt says "Always look up the history of a change before modifying it." The agent now calls lookup_ticket to get file history, even though that tool\'s description says "Looks up a ticket by key. Not for code or file history; use git log via Bash." Ticket lookups themselves work fine. What is the best fix?',
        options: [
          { text: 'Reword the system prompt line to say what to use: "Before modifying a file, check its history with git log."', correct: true,
            why: 'The vague phrase "look up the history" pulls Claude toward a tool named lookup_*. Naming the intended tool removes that pull at its source.' },
          { text: 'Make the lookup_ticket description even longer.', correct: false,
            why: 'The description already states the boundary. The system prompt is what causes the misroute.' },
          { text: 'Remove lookup_ticket from the agent.', correct: false,
            why: 'Ticket lookups are needed and work correctly.' },
          { text: 'Force the first tool call of each session to Bash.', correct: false,
            why: 'This affects one call only, and it forces Bash even when no history is needed.' }
        ],
        explanation: 'Tool selection is influenced by the whole prompt, not only the tool descriptions. Broad verbs in the system prompt ("search", "look up", "check") can match a similarly named tool.\n\nWhen the description is already clear, look for the conflicting wording elsewhere.',
        refs: [{ title: 'Tool use overview', url: 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview' }]
      },
      {
        domain: A, scenario: SC,
        question: 'deploy_to_prod must never run unless run_smoke_tests has passed earlier in the same session. In testing, Claude sometimes calls deploy_to_prod first, and sometimes calls it on its own with no test call at all. Which design enforces the rule?',
        options: [
          { text: 'Record smoke-test passes in session state, and add a PreToolUse hook on deploy_to_prod that denies the call, with a reason, when no pass is recorded.', correct: true,
            why: 'The hook checks real state in code before every deploy, however the call arrives, and the denial tells Claude to run the tests first.' },
          { text: 'Add a required smoke_test_run_id parameter to deploy_to_prod.', correct: false,
            why: 'A required field only guarantees that a value is present. Claude could still supply an invented or stale ID.' },
          { text: 'Set disable_parallel_tool_use so the tests and the deploy happen in separate turns.', correct: false,
            why: 'Calling one tool per turn does not stop a lone deploy call that has no test before it.' },
          { text: 'Put the rule in bold at the top of the system prompt.', correct: false,
            why: 'Prompt rules are probabilistic, and this one has already failed.' }
        ],
        explanation: 'When one action must follow another, enforce the order with a deterministic gate that checks recorded results, not with instructions or schema fields.\n\nPreToolUse hooks run before the tool executes and can deny the call with a message that steers Claude\'s next step.',
        refs: [{ title: 'Hooks in the Agent SDK', url: 'https://docs.claude.com/en/docs/agent-sdk/hooks' }]
      },
      {
        domain: T, scenario: SC,
        question: 'The ticket MCP server\'s search_incidents tool returns an empty list both when there are no incidents and when the ticket database is unreachable. During outages, the agent tells users the service has no open incidents. How should the server report the outage?',
        options: [
          { text: 'Return a tool result with isError: true and a message saying the database is unreachable and that retrying later may help. Keep the empty list for real no-match results.', correct: true,
            why: 'isError separates "the lookup failed" from "the lookup found nothing", and the message gives Claude a recovery path.' },
          { text: 'Let the exception go unhandled so the MCP connection fails.', correct: false,
            why: 'A crash or protocol error gives the model nothing useful to reason with. Tool execution failures belong in the tool result, marked with isError.' },
          { text: 'Log the outage to the server\'s monitoring dashboard.', correct: false,
            why: 'Monitoring helps humans, but the agent still sees an empty list and gives the same wrong answer.' },
          { text: 'Retry inside the server until the database comes back.', correct: false,
            why: 'Outages can last minutes, so this hangs the session. Use bounded retries and then report the error.' }
        ],
        explanation: 'A failure to reach the data must never look like a valid empty result.\n\nIn MCP, tool execution errors go in the result with isError: true and a descriptive message. Claude can then retry, use a fallback, or tell the user the data is temporarily unavailable.',
        refs: [{ title: 'MCP: Tools', url: 'https://modelcontextprotocol.io/docs/concepts/tools' }]
      },
      {
        domain: T, scenario: SC,
        question: 'The runbook MCP server adds and removes runbook resources many times a day, but each runbook\'s content rarely changes once published. Long agent sessions keep trying to read runbooks that have been deleted. Which server change fixes this?',
        options: [
          { text: 'Advertise the resources listChanged capability and send notifications/resources/list_changed whenever runbooks are added or removed.', correct: true,
            why: 'This is MCP\'s mechanism for changes to which resources exist. The client can refresh its list instead of acting on stale entries.' },
          { text: 'Support resources/subscribe, so the client receives notifications/resources/updated for runbooks it follows.', correct: false,
            why: 'Subscriptions report content changes to a known URI. The problem here is resources being added and removed.' },
          { text: 'Return an empty contents array when a deleted runbook is read.', correct: false,
            why: 'An empty successful read hides the failure. A missing resource should return an error.' },
          { text: 'Tell the agent to call resources/list before every read.', correct: false,
            why: 'This is a prompt workaround that adds a call to every read and depends on the model following it.' }
        ],
        explanation: 'MCP has two kinds of resource notification. list_changed reports that the catalog changed (entries added or removed). resources/updated, for subscribed URIs, reports that a resource\'s content changed.\n\nChoose based on what actually changes.',
        refs: [{ title: 'MCP: Resources', url: 'https://modelcontextprotocol.io/docs/concepts/resources' }]
      },
      {
        domain: T, scenario: SC,
        question: 'Deployment tools come from the deploy team\'s MCP server, and ticket tools come from the support team\'s server. Each team ships its server independently, and neither will maintain a shared gateway. One release task needs live calls to both. How do you set up tool access?',
        options: [
          { text: 'Configure both servers for the agent. The host connects to each one and gives Claude the combined set of tools.', correct: true,
            why: 'An MCP host keeps one client connection per server and merges the discovered tools, so one conversation can use both.' },
          { text: 'Build an aggregator MCP server that re-exports both teams\' tools.', correct: false,
            why: 'This is the shared middleware nobody will maintain, and the host already combines servers.' },
          { text: 'Configure only the deploy server, and add the ticket server\'s tool name pattern to allowedTools.', correct: false,
            why: 'allowedTools only auto-approves tools that are already available. An unconfigured server contributes no tools.' },
          { text: 'Run two separate agents and have a person copy results between them.', correct: false,
            why: 'This adds manual steps and latency for no benefit, because one agent can use both servers.' }
        ],
        explanation: 'Tools from every connected MCP server are available together. Server boundaries follow team ownership, and the host is where they come together.\n\nUse per-agent tool lists to limit what each agent sees.',
        refs: [{ title: 'MCP in the Agent SDK', url: 'https://docs.claude.com/en/docs/agent-sdk/mcp' }]
      },
      {
        domain: C, scenario: SC,
        question: 'You are trying out an unstable MCP server that you need only in this repository. The repository\'s .mcp.json is committed and shared, and teammates must not get the trial server. Where should you register it?',
        options: [
          { text: 'Use local scope (claude mcp add --scope local …), which stores it privately for you and only for this project.', correct: true,
            why: 'Local-scoped servers are not written to .mcp.json, so teammates never load them.' },
          { text: 'Use project scope (claude mcp add --scope project …).', correct: false,
            why: 'Project scope writes to the shared .mcp.json, which is exactly what you need to avoid.' },
          { text: 'Add it to .mcp.json and list .mcp.json in .gitignore.', correct: false,
            why: 'The file is already tracked, so ignoring it has no effect, and the entry could easily be committed.' },
          { text: 'Describe the server\'s launch command in CLAUDE.local.md.', correct: false,
            why: 'CLAUDE.md files give the model instructions. They do not register MCP servers.' }
        ],
        explanation: 'MCP server scopes: local (just you, this project; the default), project (.mcp.json, shared through git), and user (just you, all projects).\n\nShared servers go in .mcp.json, with secrets passed through ${ENV_VAR} expansion. Experiments stay local.',
        refs: [{ title: 'Connect Claude Code to tools via MCP', url: 'https://docs.claude.com/en/docs/claude-code/mcp' }]
      },
      {
        domain: T, scenario: SC,
        question: 'The agent must change "status: draft" to "status: published" in the third entry of a release-notes file. All entries come from the same template and are identical apart from their position. Edit fails because old_string is not unique, and a longer anchor still matches several entries. What should it do next?',
        options: [
          { text: 'Read the whole file, then Write it back with only the third entry changed.', correct: true,
            why: 'Read shows the file with line numbers, so the entry can be found by position. Write saves the exact intended result.' },
          { text: 'Rerun Edit with replace_all: true.', correct: false,
            why: 'This changes every entry, not only the third.' },
          { text: 'Keep making old_string longer until it spans most of the file.', correct: false,
            why: 'Since the entries are identical, this becomes fragile and amounts to rewriting the file anyway.' },
          { text: 'Run a sed command for a guessed line number without reading the file.', correct: false,
            why: 'Editing blindly by position can change the wrong line, and nothing confirms what changed.' }
        ],
        explanation: 'Edit replaces exact text, and old_string must match exactly once unless replace_all is set.\n\nIf no unique anchor exists, the fallback is Read, then Write the full content.',
        refs: [{ title: 'Claude Code settings: tools', url: 'https://docs.claude.com/en/docs/claude-code/settings' }]
      },
      {
        domain: A, scenario: SC,
        question: 'A read-only auditor subagent should use only get_deploy_status and list_releases. The same deploy MCP server also provides rollback_release, and rollback_release must not be available to this subagent at all. What should you configure?',
        options: [
          { text: 'In the subagent definition, set its tools list to only get_deploy_status and list_releases.', correct: true,
            why: 'The tools list is an allowlist. Tools left off it do not exist in the subagent\'s session.' },
          { text: 'Put the two tools in allowedTools for the subagent.', correct: false,
            why: 'allowedTools controls which tools are auto-approved. It does not remove any tool from availability.' },
          { text: 'Define the deploy MCP server inline in the subagent instead of globally.', correct: false,
            why: 'The server exposes all of its tools, including rollback_release.' },
          { text: 'Tell the subagent in its prompt never to call rollback_release.', correct: false,
            why: 'This is an instruction, not a capability limit.' }
        ],
        explanation: 'Keep availability and permission separate. The tools list decides what a subagent can see. Permission rules and allowedTools decide whether a visible tool runs without asking.\n\nFor least privilege, start with availability.',
        refs: [{ title: 'Subagents in the SDK', url: 'https://docs.claude.com/en/docs/agent-sdk/subagents' }]
      },
      {
        domain: A, scenario: SC,
        question: 'Engineers ask open-ended questions such as "Why did last night\'s deploy roll back?", and each tool result decides what to check next. A teammate wants one fixed tool order, because the order differs between runs and logs are hard to compare. What is the right design?',
        options: [
          { text: 'Keep the model-driven loop: Claude chooses each next tool based on what earlier results showed.', correct: true,
            why: 'The path of an open-ended investigation depends on what each step finds. A different order on each run is expected, not a defect.' },
          { text: 'Replace the loop with a fixed Glob, Grep, Read, Bash pipeline.', correct: false,
            why: 'A fixed sequence cannot follow an unexpected lead.' },
          { text: 'Add a classifier that maps each question type to a preset tool sequence.', correct: false,
            why: 'The question type does not predict what the investigation will uncover halfway through.' },
          { text: 'Write a numbered tool procedure into the system prompt.', correct: false,
            why: 'This removes the adaptability the agent exists to provide, and it is not enforced anyway.' }
        ],
        explanation: 'Use fixed workflows when the steps are known in advance, and agents when the next step depends on what was found.\n\nTo make logs comparable, use structured tracing of each tool call and its result, not a forced order.',
        refs: [{ title: 'Building effective agents', url: 'https://www.anthropic.com/engineering/building-effective-agents' }]
      },
      {
        domain: A, scenario: SC,
        question: 'A long session has investigated a failed release with dozens of tool calls, and the underlying data has not changed since. You want to try two rollback strategies, each starting from that exact context with every tool result intact, without either trial affecting the other. What should you do?',
        options: [
          { text: 'Fork the session (fork_session / forkSession) twice and run one strategy in each fork.', correct: true,
            why: 'Each fork gets a copy of the full history under a new session ID, so both trials start from the same baseline and stay independent.' },
          { text: 'Resume the session for strategy one, then resume it again for strategy two.', correct: false,
            why: 'Plain resume adds to the same timeline, so the second trial would see the first trial\'s turns.' },
          { text: 'Start two new sessions, each seeded with a written summary of the investigation.', correct: false,
            why: 'A summary loses detail. This approach suits stale data, but here the data is current and exact context is required.' },
          { text: 'Spawn two subagents from the resumed session.', correct: false,
            why: 'Subagents start with a fresh context and receive only their prompt, not the parent\'s tool results.' }
        ],
        explanation: 'Resume continues a session. Fork branches it into a new session that shares the history up to the branch point.\n\nForking is the way to compare approaches from the same starting point without paying for the investigation twice.',
        refs: [{ title: 'Sessions in the Agent SDK', url: 'https://docs.claude.com/en/docs/agent-sdk/sessions' }]
      }
    ]
  });
})();

// Set 5 — Reliability, escalation & structured extraction. Original practice content.
(function () {
  const A = 'Agentic Architecture & Orchestration';
  const C = 'Claude Code Configuration & Workflows';
  const P = 'Prompt Engineering & Structured Output';
  const X = 'Context Management & Reliability';
  const SUP = 'You run a customer-support agent built on Claude. It looks up orders, issues refunds through tools, and hands off to human agents. Policy and customer trust matter more than automation rate.';
  const EXT = 'You run an extraction pipeline that turns invoices and contracts into JSON for a finance system. Outputs are validated against a JSON schema, and bad records block downstream reconciliation.';
  const DEV = 'Your team uses Claude Code daily for refactoring, debugging, and documentation, and is deciding how much to automate.';

  (window.QUESTION_SETS = window.QUESTION_SETS || []).push({
    id: 'set-05-reliability',
    title: 'Set 5 · Reliability, escalation & extraction',
    description: 'Human handoffs, honoring user boundaries, error propagation, evaluation by segment, and schema design for extraction.',
    questions: [
      {
        domain: X, scenario: SUP,
        question: 'Mid-conversation, a customer writes: "Stop. I want to talk to a person." The agent is fairly sure it could resolve the issue in one more step. What should it do?',
        options: [
          { text: 'Try the one more step first, then offer a human if it fails.', correct: false,
            why: 'This overrides an explicit request. Being able to solve the issue does not change who the customer asked for.' },
          { text: 'Ask whether the customer is sure, since the fix is close.', correct: false,
            why: 'The request was clear. Pushing back adds friction and damages trust.' },
          { text: 'Hand off immediately, with a structured summary of the case so far.', correct: true,
            why: 'An explicit request for a human is a direct escalation trigger. The summary means the customer does not have to repeat anything.' },
          { text: 'Hand off only if the customer\'s sentiment score is negative.', correct: false,
            why: 'Sentiment is not the trigger. The explicit request is.' }
        ],
        explanation: 'Honor explicit requests for a human immediately. Good handoffs are self-contained: customer and case IDs, what was verified, what was tried, and the open question. The receiving agent should not need the transcript.',
        refs: [{ title: 'Customer support agent guide', url: 'https://docs.claude.com/en/docs/about-claude/use-case-guides/customer-support-chat' }]
      },
      {
        domain: X, scenario: SUP,
        question: 'Which TWO situations should trigger escalation to a human agent? (Select TWO.)',
        options: [
          { text: 'The customer asks for an exception that the refund policy neither allows nor forbids.', correct: true,
            why: 'This is a policy gap. The agent has no legitimate basis for the decision, so a human should make it.' },
          { text: 'The agent has tried the same lookup three times with no new information.', correct: true,
            why: 'No progress is a clear trigger, because continuing wastes the customer\'s time.' },
          { text: 'The customer uses angry language but the request is routine and within policy.', correct: false,
            why: 'Tone alone does not require a human if the agent can resolve the request within policy.' },
          { text: 'The agent\'s self-rated confidence drops below 0.7.', correct: false,
            why: 'Self-rated confidence is poorly calibrated, and agents are often confidently wrong on the hardest cases.' }
        ],
        explanation: 'Escalate on explicit, observable triggers: the customer asks for a human, policy does not cover the case, the agent is making no progress, or the action is high risk (for example, a refund above a limit, enforced with a hook).\n\nAvoid proxies such as sentiment or self-reported confidence.',
        refs: [{ title: 'Building effective agents', url: 'https://www.anthropic.com/engineering/building-effective-agents' }]
      },
      {
        domain: A, scenario: SUP,
        question: 'Refunds above $200 must always go to a human. The system prompt says so, but logs show three $350 refunds that the agent issued. What should you implement?',
        options: [
          { text: 'A PreToolUse hook on issue_refund that denies amounts over $200 and returns a reason telling the agent to escalate.', correct: true,
            why: 'Code enforces the limit on every call, and the denial reason sends the agent to the handoff path.' },
          { text: 'Stronger wording in the system prompt.', correct: false,
            why: 'Instructions are probabilistic, and they have already failed three times.' },
          { text: 'A nightly audit that reverses large refunds.', correct: false,
            why: 'This detects violations after the fact. The policy requires prevention.' },
          { text: 'Remove the refund tool.', correct: false,
            why: 'This blocks the small refunds the agent should handle on its own.' }
        ],
        explanation: 'Business rules with financial or legal consequences belong in deterministic enforcement points, such as hooks or tool-side validation, not only in prompts.\n\nA denial with a clear reason also steers the model\'s next action.',
        refs: [{ title: 'Hooks reference', url: 'https://docs.claude.com/en/docs/claude-code/hooks' }]
      },
      {
        domain: X, scenario: SUP,
        question: 'The order-lookup tool times out after receiving 3 of 5 line items. A cached snapshot from 2 hours ago exists. What should the tool return to the agent?',
        options: [
          { text: 'A success result with the 3 line items and no note.', correct: false,
            why: 'Presenting partial data as complete leads the agent to give the customer wrong information.' },
          { text: '"Lookup failed."', correct: false,
            why: 'This throws away the partial data and gives no recovery options.' },
          { text: 'An error noting the timeout, the query attempted, the 3 items received, and that a 2-hour-old cache is available.', correct: true,
            why: 'With full context, the agent can retry, use the partial data with a caveat, or fall back to the cache.' },
          { text: 'Retry internally until the order service responds.', correct: false,
            why: 'Unbounded retries hang the conversation. Use bounded retries, then return the error with context.' }
        ],
        explanation: 'Give errors context: the failure type, what was attempted, any partial results, and the available alternatives. Never present a failure as a success.\n\nKeep local retries bounded, and then pass the error to the agent with enough detail to decide.',
        refs: [{ title: 'Handle tool calls', url: 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/handle-tool-calls' }]
      },
      {
        domain: P, scenario: EXT,
        question: 'The schema makes `po_number` a required string. Many invoices really have no PO, and the model invents plausible-looking numbers for them. What should you change?',
        options: [
          { text: 'Make po_number nullable (or optional) and instruct the model to return null when it is not present.', correct: true,
            why: 'A required field with no valid answer pressures the model to fabricate one. Allowing null removes that pressure.' },
          { text: 'Add "Do not hallucinate" to the prompt.', correct: false,
            why: 'The schema still demands a value, so the pressure remains.' },
          { text: 'Validate the PO format with a regex.', correct: false,
            why: 'Invented values can match the format exactly.' },
          { text: 'Retry until the PO matches the ERP.', correct: false,
            why: 'Retries cannot produce a PO that does not exist, so the loop cannot succeed.' }
        ],
        explanation: 'Design schemas for the real data. Make fields nullable when the information may legitimately be absent, and add "unclear" or "other" enum values where appropriate. A strict schema guarantees structure, not truth.',
        refs: [{ title: 'Structured outputs', url: 'https://docs.claude.com/en/docs/build-with-claude/structured-outputs' }]
      },
      {
        domain: P, scenario: EXT,
        question: 'For one vendor, contract_end_date fails validation on every retry. The date appears only in a master agreement that is never included in the request, and downstream reconciliation needs it. What should you do?',
        options: [
          { text: 'Increase the retry limit and add more detailed validation errors.', correct: false,
            why: 'Retries fix format and reasoning errors, not missing source information.' },
          { text: 'Include the master agreement in the extraction request.', correct: true,
            why: 'The value exists, so give the model the document that contains it.' },
          { text: 'Make the field nullable and accept nulls.', correct: false,
            why: 'Nullable fits truly absent data. Here the value exists, and downstream systems need it.' },
          { text: 'Add few-shot examples of contract dates.', correct: false,
            why: 'Examples improve format and judgment, but they cannot reveal a date that is not in the input.' }
        ],
        explanation: 'First diagnose why validation keeps failing. If the model has the information but formats or computes it wrong, retry with specific feedback. If the information is not in the input, fix the input, or flag the gap when the data truly does not exist.',
        refs: [{ title: 'Reduce hallucinations', url: 'https://docs.claude.com/en/docs/test-and-evaluate/strengthen-guardrails/reduce-hallucinations' }]
      },
      {
        domain: X, scenario: EXT,
        question: 'Labeled evaluation shows 97% field accuracy across English, German, and Japanese invoices. The team wants to stop human review. What should you check first?',
        options: [
          { text: 'Accuracy broken down by language and by field, to confirm every segment meets the target.', correct: true,
            why: 'An aggregate figure can hide a failing segment, such as Japanese tax fields.' },
          { text: 'A larger sample to narrow the confidence interval on 97%.', correct: false,
            why: 'A more precise average still hides weak segments.' },
          { text: 'The model\'s self-reported confidence on each field.', correct: false,
            why: 'Uncalibrated self-confidence does not validate the aggregate figure.' },
          { text: 'Whether 97% beats the accuracy of human data entry.', correct: false,
            why: 'Comparing one average with another does not reveal weak segments.' }
        ],
        explanation: 'Before automating, validate each segment (language, document type, field), not just the average. After rollout, keep stratified sampling of auto-approved outputs to catch drift.',
        refs: [{ title: 'Create strong empirical evaluations', url: 'https://docs.claude.com/en/docs/test-and-evaluate/develop-tests' }]
      },
      {
        domain: P, scenario: EXT,
        question: 'Extracted line items sometimes do not add up to the stated invoice total. The source documents themselves are correct. What is the best pattern?',
        options: [
          { text: 'Validate the arithmetic in code. On a mismatch, retry with the specific discrepancy, such as "line items sum to 1,240.00 but total_amount is 1,420.00".', correct: true,
            why: 'Specific feedback on a checkable error lets the model find and fix the misread value.' },
          { text: 'Accept the records and let finance catch the errors.', correct: false,
            why: 'This pushes a detectable error downstream, where it blocks reconciliation.' },
          { text: 'Ask the model to "double-check math" in the prompt.', correct: false,
            why: 'This helps a little, but it is not verification.' },
          { text: 'Drop the total field.', correct: false,
            why: 'This removes the very cross-check that catches extraction errors.' }
        ],
        explanation: 'Combine schema validation (structure) with semantic validation in code (sums, dates, cross-field rules). Feed failures back with the exact discrepancy.\n\nIt also helps to extract both the stated total and the computed total, so mismatches are visible.',
        refs: [{ title: 'Structured outputs', url: 'https://docs.claude.com/en/docs/build-with-claude/structured-outputs' }]
      },
      {
        domain: C, scenario: DEV,
        question: 'A developer says: "Find why this test fails, but don\'t edit anything. I\'ll fix it myself." Claude finds that the cause is a one-character typo. What is the correct behavior?',
        options: [
          { text: 'Fix it, since it is trivial, and show the diff.', correct: false,
            why: 'This edits a file the developer explicitly reserved for themselves. The size of the change is irrelevant.' },
          { text: 'Explain the root cause and show the suggested change as text, without editing any files.', correct: true,
            why: 'This delivers the full diagnosis while honoring the boundary the developer set.' },
          { text: 'Enter plan mode and apply the fix after approval.', correct: false,
            why: 'The developer did not ask for an approval gate. They said they would make the fix.' },
          { text: 'Ask whether the no-edit rule still applies to such a small fix.', correct: false,
            why: 'The instruction was clear, so asking again treats it as negotiable.' }
        ],
        explanation: 'When a user draws a boundary, comply immediately and fully, and still do all the useful work inside it.\n\nCapability is never a reason to cross a boundary the user has stated.',
        refs: [{ title: 'Common workflows', url: 'https://docs.claude.com/en/docs/claude-code/common-workflows' }]
      },
      {
        domain: C, scenario: DEV,
        question: 'Claude is iterating against a test suite the team wrote first. The latest diff "passes" because Claude changed two assertions to match its buggy output. Developers still want Claude to add new edge-case tests. What is the right correction?',
        options: [
          { text: 'Block all writes to the test directory with a PreToolUse hook.', correct: false,
            why: 'This also blocks the new edge-case tests the team wants.' },
          { text: 'Revert the assertion edits and tell Claude that modifying or removing existing tests to make them pass is unacceptable.', correct: true,
            why: 'This restores the fixed target and points iteration back at the implementation.' },
          { text: 'Run the tests more often with a PostToolUse hook.', correct: false,
            why: 'The weakened tests pass, so running them more often only confirms the false success.' },
          { text: 'Ask Claude for a confidence score that the fix is correct.', correct: false,
            why: 'Self-assessment does not detect a moved target.' }
        ],
        explanation: 'In test-driven iteration, the tests are the contract. Say explicitly that existing tests must not be edited to pass, and that solutions must be general rather than special-cased to the test inputs.\n\nUse hard blocks only when no legitimate edits to those files are needed.',
        refs: [{ title: 'Claude Code best practices', url: 'https://www.anthropic.com/engineering/claude-code-best-practices' }]
      },
      {
        domain: C, scenario: DEV,
        question: 'A nightly run shows three failures. Two are in modules that share a date utility, and the likely fix for one changes that utility\'s signature. The third is in an unrelated module. How should you hand these to Claude Code?',
        options: [
          { text: 'Give all three in one message.', correct: false,
            why: 'This mixes the unrelated failure into a coordination task it has no part in.' },
          { text: 'Give the two related failures together in one message, and handle the unrelated one separately.', correct: true,
            why: 'Interacting fixes need to be designed together. Independent ones are best handled and verified on their own.' },
          { text: 'Give them one at a time, in any order.', correct: false,
            why: 'Fixing one of the related failures can invalidate the other fix, because the shared signature changes.' },
          { text: 'Run three parallel subagents and merge their patches.', correct: false,
            why: 'Patches made independently against a shared utility are likely to conflict.' }
        ],
        explanation: 'Group work by how much it interacts. Batch issues whose fixes depend on each other, and handle independent issues sequentially (or in parallel), verifying each.\n\nParallel subagents suit independent, self-contained tasks.',
        refs: [{ title: 'Subagents', url: 'https://docs.claude.com/en/docs/claude-code/sub-agents' }]
      },
      {
        domain: X, scenario: DEV,
        question: 'Claude Code drafts a pre-refactor assessment. It states reproduced test failures and guesses taken from old code comments ("this may race under load") with equal certainty. Uncertain items must stay visible. What should you change?',
        options: [
          { text: 'Define report sections for "Verified (reproduced)" and "Unconfirmed (from comments or inference)", and quote the original wording of each source.', correct: true,
            why: 'The structure makes confidence explicit, and quoting keeps the original hedging.' },
          { text: 'Remove every claim that cannot be verified.', correct: false,
            why: 'This deletes the items the team needs to investigate.' },
          { text: 'Add a 1–10 confidence score to each finding.', correct: false,
            why: 'Self-rated numbers are poorly calibrated and lose the context of where each claim came from.' },
          { text: 'Have a second instance review the draft.', correct: false,
            why: 'The hedging has already been stripped from the draft, so the reviewer cannot recover it.' }
        ],
        explanation: 'Keep uncertainty and attribution in the output format itself. Separate verified facts from claims, and carry over the source\'s exact qualifiers.\n\nSummarization that drops a qualifier turns a guess into an apparent fact.',
        refs: [{ title: 'Prompt engineering overview', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview' }]
      }
    ]
  });
})();

// Set 7 — Prompts, evaluation & batch pipelines. Original practice content.
(function () {
  const A = 'Agentic Architecture & Orchestration';
  const C = 'Claude Code Configuration & Workflows';
  const P = 'Prompt Engineering & Structured Output';
  const X = 'Context Management & Reliability';
  const SC = 'Your data-platform team runs Claude over thousands of documents and pull requests: a nightly Message Batches job, a headless Claude Code review step in CI, and extraction prompts whose JSON feeds downstream systems.';

  (window.QUESTION_SETS = window.QUESTION_SETS || []).push({
    id: 'set-07-prompts-batches',
    title: 'Set 7 · Prompts, evaluation & batch pipelines',
    description: 'Balanced few-shot examples, normalization rules, honest enums, eval design, safe rollout, Message Batches correlation and deadlines, --json-schema, import paths, forked skills, and structured handoffs.',
    questions: [
      {
        domain: P, scenario: SC,
        question: 'The review prompt has four few-shot examples, and every one of them flags a TODO comment. The prose rules say TODOs that reference a ticket (TODO(ABC-123)) are allowed, yet the reviewer flags those too. Which revision is most effective?',
        options: [
          { text: 'Replace two of the examples with allowed TODO(ABC-123) cases, each with a short reason for not flagging it.', correct: true,
            why: 'Examples that only ever flag teach "always flag". Contrasting examples show where the line is.' },
          { text: 'Delete all the examples and rely on the prose rules.', correct: false,
            why: 'The examples are what made the output format consistent. Removing them brings that problem back.' },
          { text: 'Move the exemption to the top of the prompt in capital letters.', correct: false,
            why: 'The prose rule is already there. Claude follows the pattern the examples demonstrate.' },
          { text: 'Add four more examples that flag other kinds of TODOs.', correct: false,
            why: 'This strengthens the one-sided pattern.' }
        ],
        explanation: 'Few-shot examples teach judgment as well as format, and the model generalizes from the pattern they share. Vary the examples, and include cases where the correct action is to do nothing.',
        refs: [{ title: 'Use examples (multishot prompting)', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting' }]
      },
      {
        domain: P, scenario: SC,
        question: 'A prompt converts free-form changelog entries to JSON using a detailed prose rule list. The output is inconsistent across different entry styles, not on repeated identical inputs. For entries with no version number, Claude sometimes omits the key, sometimes writes null, and sometimes invents a version. Which TWO changes help most? (Select TWO.)',
        options: [
          { text: 'Add two or three example pairs, each showing a sample entry and its expected JSON.', correct: true,
            why: 'Concrete input-to-output pairs show the transformation directly, instead of leaving prose open to interpretation.' },
          { text: 'Include an example of an entry with no version and its expected output ("version": null).', correct: true,
            why: 'The missing-version case is where the output varies, so an example of exactly that case removes the ambiguity.' },
          { text: 'Set temperature to 0.', correct: false,
            why: 'The variation comes from different inputs, not from sampling. Each new style can still trigger a different reading of the rules.' },
          { text: 'Repeat the rule list twice in the prompt.', correct: false,
            why: 'Repeating ambiguous rules does not make them clearer.' }
        ],
        explanation: 'When prose rules are applied inconsistently, the rules are usually ambiguous.\n\nExamples, including edge cases from real data, are among the most reliable ways to steer format and edge-case handling.',
        refs: [{ title: 'Use examples (multishot prompting)', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting' }]
      },
      {
        domain: P, scenario: SC,
        question: 'An extraction step pulls release dates and versions from vendor notices. The outputs pass schema validation but keep the source formatting, such as "next Friday", "15/03/26", and "v2.1". Each prompt already includes the notice\'s publication date. New styles appear every week, and deduplication needs one canonical form. What should you change?',
        options: [
          { text: 'Add normalization rules to the prompt: dates in ISO 8601 (YYYY-MM-DD), with relative dates resolved against the publication date, and versions as MAJOR.MINOR.PATCH with no prefix.', correct: true,
            why: 'Rules that define the target format apply to any style, including new ones, and the model can resolve relative dates because it has the reference date.' },
          { text: 'Rewrite the values afterward with regular expressions.', correct: false,
            why: 'A regular expression cannot turn "next Friday" into a date, and every new style needs a new pattern.' },
          { text: 'Add few-shot examples for every style seen so far.', correct: false,
            why: 'New styles appear weekly, so the list of examples always falls behind.' },
          { text: 'Add string length limits to the schema fields.', correct: false,
            why: 'A schema can reject values but cannot convert them.' }
        ],
        explanation: 'A schema guarantees structure, not meaning: "next Friday" is still a valid string.\n\nState the canonical form for each value in the prompt or in field descriptions, and give the model the context it needs (here, the reference date) to compute it.',
        refs: [{ title: 'Be clear and direct', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct' }]
      },
      {
        domain: P, scenario: SC,
        question: 'The reviewer labels each API change as breaking: "yes" or "no". For some diffs, even senior engineers disagree, and the model simply guesses. The downstream tool rejects null or missing labels. Which schema change handles the ambiguous cases best?',
        options: [
          { text: 'Add an "unclear" value to the enum and send findings with that label to human review.', correct: true,
            why: 'This gives an honest answer that is still a valid value for the downstream tool, and people decide the cases the model cannot.' },
          { text: 'Make the field nullable.', correct: false,
            why: 'The downstream tool rejects null.' },
          { text: 'Enable strict tool use.', correct: false,
            why: 'The guessed labels already fit the schema. The problem is judgment, not shape.' },
          { text: 'Add examples that contrast breaking and non-breaking changes.', correct: false,
            why: 'Examples teach a boundary that exists. Here even experts disagree, so there is no consistent boundary to teach.' }
        ],
        explanation: 'A closed enum with no honest option forces the model to guess. Add "unclear" or "other" values where the real data needs them, define them in the field descriptions, and route them deliberately.',
        refs: [{ title: 'Structured outputs', url: 'https://docs.claude.com/en/docs/build-with-claude/structured-outputs' }]
      },
      {
        domain: P, scenario: SC,
        question: 'The team will refine the extraction prompt on a sample before the first nightly run, comparing several prompt versions per day. The sample scores need to predict quality on the full run. Which TWO practices are correct? (Select TWO.)',
        options: [
          { text: 'Choose sample documents that match the real mix of document types and include known edge cases.', correct: true,
            why: 'A representative sample is what makes its scores predict full-run quality.' },
          { text: 'Score every version with automated checks, such as code that validates each extracted field against a labeled answer.', correct: true,
            why: 'Automated grading is fast and consistent enough to compare several versions a day.' },
          { text: 'Have an engineer hand-grade every output in every round.', correct: false,
            why: 'This is accurate but too slow for several versions a day. Save human grading for what code cannot check.' },
          { text: 'Build the sample only from documents earlier versions got wrong.', correct: false,
            why: 'A sample made only of failures no longer represents the real workload, so its scores do not predict the full run.' }
        ],
        explanation: 'Good evaluations are task-specific, representative, include edge cases, and are automated where possible.\n\nPrefer code-based grading, then model-based grading with a clear rubric, and use human grading only when needed.',
        refs: [{ title: 'Define success criteria', url: 'https://docs.claude.com/en/docs/test-and-evaluate/define-success' }, { title: 'Create strong empirical evaluations', url: 'https://docs.claude.com/en/docs/test-and-evaluate/develop-tests' }]
      },
      {
        domain: X, scenario: SC,
        question: 'Developers act on nearly every comment from the CI reviewer, which has two high-precision categories. The team wants to add an untested "missing license header" category. The PR interface shows all comments the same way, with no labels, confidence display, or filtering. How should the team introduce it?',
        options: [
          { text: 'Run the new category offline on recently merged PRs, measure its precision, and enable it only once the precision is acceptable.', correct: true,
            why: 'Measuring before release keeps unknown noise away from the trust the existing categories have earned.' },
          { text: 'Enable it now and label its comments "experimental".', correct: false,
            why: 'The interface cannot show labels, so developers would see noisy comments as official output.' },
          { text: 'Enable it with a self-rated confidence score so developers can skip weak findings.', correct: false,
            why: 'The interface cannot display or filter scores, and self-rated confidence is poorly calibrated anyway.' },
          { text: 'Add "only report high-confidence issues" to the new category\'s prompt and enable it.', correct: false,
            why: 'This vague instruction has nothing concrete to check, and it skips measurement entirely.' }
        ],
        explanation: 'False positives in one category make developers distrust the whole tool.\n\nRelease new checks behind an offline evaluation on real data, and turn them on only after their precision is known.',
        refs: [{ title: 'Create strong empirical evaluations', url: 'https://docs.claude.com/en/docs/test-and-evaluate/develop-tests' }]
      },
      {
        domain: P, scenario: SC,
        question: 'The nightly batch sends one request per document. The results come back in a different order from the submission, and some entries are errors with no model output. How should the pipeline match each result to its document?',
        options: [
          { text: 'Give each request a unique custom_id derived from the document ID, and read that custom_id from each result line.', correct: true,
            why: 'Every result line, successful or not, carries the custom_id of its request.' },
          { text: 'Match results to requests by their position in the list.', correct: false,
            why: 'Batch results can come back in any order.' },
          { text: 'Ask the model to echo the document ID in its output.', correct: false,
            why: 'Errored requests have no model output, so the entries you most need to match would have no ID.' },
          { text: 'Poll a per-request endpoint for each custom_id.', correct: false,
            why: 'Status is polled for the whole batch, and results are downloaded as one file.' }
        ],
        explanation: 'custom_id is the batch correlation key. It must be unique within the batch, and you choose its value, so make it meaningful (for example, doc-48213).',
        refs: [{ title: 'Batch processing', url: 'https://docs.claude.com/en/docs/build-with-claude/batch-processing' }]
      },
      {
        domain: P, scenario: SC,
        question: 'A finished batch has succeeded, errored, and expired entries. Some errors are invalid_request (a malformed payload), and others are transient server errors. Which TWO steps are correct? (Select TWO.)',
        options: [
          { text: 'Collect the custom_ids of the errored and expired entries and resubmit only those, in a new batch.', correct: true,
            why: 'Resubmitting only what failed avoids paying again for completed work.' },
          { text: 'Fix the payloads of invalid_request entries before resubmitting, and resubmit transient errors unchanged.', correct: true,
            why: 'Malformed requests fail the same way every time until they are fixed. Transient errors are worth a straight retry.' },
          { text: 'Resubmit the entire batch so all results come from one run.', correct: false,
            why: 'This doubles the cost and repeats work that already succeeded.' },
          { text: 'Wait longer, because expired requests finish later.', correct: false,
            why: 'Expired means the request was not processed within the window. It will not finish later.' }
        ],
        explanation: 'Treat batch results by type. Use succeeded entries. Fix the payload of invalid_request errors, retry transient errors, and resubmit expired entries. Match everything by custom_id.',
        refs: [{ title: 'Batch processing', url: 'https://docs.claude.com/en/docs/build-with-claude/batch-processing' }]
      },
      {
        domain: P, scenario: SC,
        question: 'A monthly compliance extraction runs on the Message Batches API for the discount. Its report is due no later than 36 hours after month-end close. When should the batch be submitted?',
        options: [
          { text: 'No later than 12 hours after close, so the full 24-hour processing window still ends before the deadline.', correct: true,
            why: 'Plan around the documented maximum of 24 hours, not the typical completion time.' },
          { text: 'Any time within the 36 hours, because most batches finish within an hour.', correct: false,
            why: 'Typical is not guaranteed, and a late submission can miss the deadline.' },
          { text: 'Submit at any time, and cancel and resubmit if it is not done within an hour.', correct: false,
            why: 'Running longer than an hour is normal. Resubmitting restarts the wait.' },
          { text: 'Use synchronous calls instead, because batches have no deadline.', correct: false,
            why: 'The deadline leaves room for a batch. Switching gives up the savings for no reason.' }
        ],
        explanation: 'Batches cost about 50% less but have no latency SLA. Most finish quickly, but processing can take up to 24 hours, after which requests expire.\n\nWork backward from your deadline using the maximum, and leave time to resubmit failures.',
        refs: [{ title: 'Batch processing', url: 'https://docs.claude.com/en/docs/build-with-claude/batch-processing' }]
      },
      {
        domain: A, scenario: SC,
        question: 'Each nightly batch request defines a client-side fetch_schema tool. Many results "succeeded" but end with stop_reason "tool_use" and contain tool_use blocks instead of final answers. How should the pipeline handle them?',
        options: [
          { text: 'Run the requested tools, then send follow-up requests that include the assistant content and the matching tool_result blocks, either batched or synchronous.', correct: true,
            why: 'Each batch request is a single Messages call, so a client tool loop has to continue in a new request.' },
          { text: 'Keep polling until the batch runs the tools.', correct: false,
            why: 'Batches never run client tools, and retrieved results are final.' },
          { text: 'Resubmit the same requests by custom_id.', correct: false,
            why: 'Nothing changed, so they would stop at tool_use again.' },
          { text: 'Remove the tool from every request.', correct: false,
            why: 'Tools are allowed in batch requests, and the task needs the schema data.' }
        ],
        explanation: 'A batch request cannot pause mid-request for your code to run a tool. Treat stop_reason "tool_use" as a successful partial step, and continue the conversation in a later request.\n\nIf the needed data is known up front, include it in the prompt to avoid the extra round trip.',
        refs: [{ title: 'Batch processing', url: 'https://docs.claude.com/en/docs/build-with-claude/batch-processing' }]
      },
      {
        domain: C, scenario: SC,
        question: 'The CI review runs claude -p with --output-format json, but the findings inside the result field are sometimes prose, which breaks parsing. Each run is slow, so the team will not add an external re-run loop. What gives schema-validated findings?',
        options: [
          { text: 'Add --json-schema with the findings schema and read the structured_output field.', correct: true,
            why: 'Claude Code checks the final answer against the schema within the same invocation, so a successful run returns data that conforms.' },
          { text: 'Switch to --output-format stream-json.', correct: false,
            why: 'This changes how events are delivered, not whether the content is free-form.' },
          { text: 'Validate the output in the pipeline and re-run the job on failure.', correct: false,
            why: 'The team has ruled out an external re-run loop, and each re-run repeats the full cost.' },
          { text: 'Add the output format and examples to CLAUDE.md.', correct: false,
            why: 'CLAUDE.md is guidance, not enforcement.' }
        ],
        explanation: '--output-format json wraps the run in an envelope (result, session_id, cost, and more), but result is still whatever Claude wrote.\n\n--json-schema adds schema validation, and the conforming data appears in structured_output.',
        refs: [{ title: 'Run Claude Code programmatically (headless)', url: 'https://docs.claude.com/en/docs/claude-code/headless' }]
      },
      {
        domain: C, scenario: SC,
        question: 'Shared security standards live at docs/standards/security.md in the repository root. CI checks the repository out to a different temporary path on every run. How should services/billing/CLAUDE.md import the file?',
        options: [
          { text: '@../../docs/standards/security.md', correct: true,
            why: 'Relative import paths resolve from the file that contains the import, so this works wherever the repository is checked out.' },
          { text: '@docs/standards/security.md', correct: false,
            why: 'This resolves relative to services/billing/, not to the directory where Claude was launched.' },
          { text: '@/home/runner/work/repo/docs/standards/security.md', correct: false,
            why: 'Absolute paths are supported, but the checkout path changes on every run.' },
          { text: '@~/docs/standards/security.md', correct: false,
            why: 'This points into the runner\'s home directory, not the repository.' }
        ],
        explanation: 'CLAUDE.md imports (@path) are expanded when the session starts. Relative paths resolve from the importing file, which keeps imports portable across clones and CI runners.',
        refs: [{ title: 'Manage Claude\'s memory', url: 'https://docs.claude.com/en/docs/claude-code/memory' }]
      },
      {
        domain: C, scenario: SC,
        question: 'You set context: fork on a verbose /license-audit skill to keep its output out of the main session. It now audits the wrong packages. Its instructions say "audit the packages we discussed above." How do you fix it and keep the isolation?',
        options: [
          { text: 'Rewrite the skill so it stands on its own: it finds its inputs itself (for example, by running git diff and reading the changed package manifests).', correct: true,
            why: 'A forked skill runs in a fresh subagent that never sees the main conversation, so it has to collect its own inputs.' },
          { text: 'Remove context: fork and run /compact after each audit.', correct: false,
            why: 'This puts the verbose output back in the main session, which breaks the isolation requirement, and compacting can lose details.' },
          { text: 'Set the agent field to general-purpose.', correct: false,
            why: 'Changing the subagent type does not give it the main conversation\'s history.' },
          { text: 'Set a larger model in the skill\'s frontmatter.', correct: false,
            why: 'A stronger model still cannot see a discussion it was never given.' }
        ],
        explanation: 'context: fork runs the skill\'s content as the prompt of an isolated subagent, and only the result comes back.\n\nForked skills must be self-contained, with no references to "earlier" or "above". They get their inputs from arguments or by fetching them.',
        refs: [{ title: 'Agent Skills', url: 'https://docs.claude.com/en/docs/claude-code/skills' }]
      },
      {
        domain: A, scenario: SC,
        question: 'Two new workflows are being added. A license-compliance check always runs the same three steps in the same order. An incident investigation decides each next lookup from what the previous one found. Which design fits?',
        options: [
          { text: 'Run the compliance check as a fixed chain of steps, and let the agent plan the investigation\'s subtasks as findings arrive.', correct: true,
            why: 'Predictable work gets a fixed workflow, and open-ended work gets dynamic decomposition.' },
          { text: 'Use dynamic decomposition for both workflows.', correct: false,
            why: 'Adaptive planning on a fully predictable task adds cost and latency and makes it harder to test.' },
          { text: 'Build one fixed pipeline with a branch for every known incident cause.', correct: false,
            why: 'New incidents fall outside the predefined branches.' },
          { text: 'Use dynamic decomposition for compliance and a fixed chain for incidents.', correct: false,
            why: 'This gives each workflow the structure that suits the other.' }
        ],
        explanation: 'Start with the simplest structure that works. Use prompt chaining and other workflows when the steps are known, and agents when the path emerges from what is found.',
        refs: [{ title: 'Building effective agents', url: 'https://www.anthropic.com/engineering/building-effective-agents' }]
      },
      {
        domain: P, scenario: SC,
        question: 'Stuck jobs escalate to on-call engineers who cannot see the session. An intake script parses each handoff for root cause, affected services, and recommended action, but prose handoffs sometimes leave fields out. What design fixes this?',
        options: [
          { text: 'Produce the handoff as structured output (a tool or JSON schema with required fields), and still check stop_reason before parsing.', correct: true,
            why: 'A schema makes the handoff machine-parseable by design, and checking stop_reason catches refusals and truncation.' },
          { text: 'Attach the full transcript to every handoff.', correct: false,
            why: 'The fields the script expects are still missing, and the engineer receives raw noise.' },
          { text: 'Have a second Claude instance review each handoff for completeness.', correct: false,
            why: 'The output is still prose, and the review is just another probabilistic check.' },
          { text: 'Add examples of complete handoffs to the prompt.', correct: false,
            why: 'This helps, but it is probabilistic, and the script parses every handoff.' }
        ],
        explanation: 'A handoff serves two readers: a person who needs a self-contained summary, and code that needs a fixed shape.\n\nUse a schema with required fields for the shape. Write the summary for someone who never saw the session.',
        refs: [{ title: 'Structured outputs', url: 'https://docs.claude.com/en/docs/build-with-claude/structured-outputs' }]
      }
    ]
  });
})();

// Set 2 — Claude Code team configuration & workflows. Original practice content.
(function () {
  const C = 'Claude Code Configuration & Workflows';
  const X = 'Context Management & Reliability';
  const SC = 'Your team of twelve uses Claude Code every day for feature work, refactoring, debugging, and documentation in a TypeScript monorepo. You maintain the shared Claude Code configuration in the repository.';

  (window.QUESTION_SETS = window.QUESTION_SETS || []).push({
    id: 'set-02-claude-code-team',
    title: 'Set 2 · Claude Code team configuration',
    description: 'CLAUDE.md scopes, rules, skills, settings, hooks, MCP config, and plan mode in a shared repository.',
    questions: [
      {
        domain: C, scenario: SC,
        question: 'A new teammate says Claude never follows the team\'s "use Vitest, not Jest" convention, although it works for everyone else. The convention lives in the tech lead\'s ~/.claude/CLAUDE.md. What is the fix?',
        options: [
          { text: 'Move the convention into the project CLAUDE.md and commit it.', correct: true,
            why: 'The project CLAUDE.md is version-controlled, so every clone, including the new teammate\'s and CI\'s, loads it.' },
          { text: 'Ask the new teammate to copy the lead\'s ~/.claude/CLAUDE.md to their machine.', correct: false,
            why: 'This works once, then drifts. Each personal copy diverges, and future teammates miss it too.' },
          { text: 'Add the convention to the lead\'s .claude/settings.local.json.', correct: false,
            why: 'settings.local.json holds personal settings such as permissions, not instructions, and it is not shared.' },
          { text: 'Tell the new teammate to mention Vitest in every prompt.', correct: false,
            why: 'This relies on memory every time. Team conventions belong in shared configuration.' }
        ],
        explanation: 'CLAUDE.md scope follows its location. ~/.claude/CLAUDE.md is personal and applies to all of that user\'s projects. ./CLAUDE.md (or ./.claude/CLAUDE.md) is project scope and shared through git. Subdirectory CLAUDE.md files load when Claude works in those directories.\n\nTeam conventions belong in project scope.',
        refs: [{ title: 'Manage Claude\'s memory', url: 'https://docs.claude.com/en/docs/claude-code/memory' }]
      },
      {
        domain: C, scenario: SC,
        question: 'A developer wants `npm run dev:sandbox` auto-approved for themselves, only in this repository, without affecting teammates. Where should the allow rule go?',
        options: [
          { text: '.claude/settings.json', correct: false,
            why: 'That file is committed and shared, so the rule would apply to the whole team.' },
          { text: '.claude/settings.local.json', correct: true,
            why: 'Local project settings are personal to this repository and are meant to stay out of version control.' },
          { text: '~/.claude/settings.json', correct: false,
            why: 'User settings apply to every project on the machine, which is broader than "only in this repository".' },
          { text: 'The project CLAUDE.md', correct: false,
            why: 'CLAUDE.md holds instructions, not permission rules, so it does not auto-approve anything.' }
        ],
        explanation: 'Claude Code reads settings from several scopes. Managed (enterprise) settings come first, then command-line arguments, local project settings (.claude/settings.local.json), shared project settings (.claude/settings.json), and finally user settings (~/.claude/settings.json).\n\nPermissions and hooks belong in settings files. Instructions belong in CLAUDE.md.',
        refs: [{ title: 'Claude Code settings', url: 'https://docs.claude.com/en/docs/claude-code/settings' }]
      },
      {
        domain: C, scenario: SC,
        question: 'GraphQL resolver conventions run to 300 lines. Resolvers live under packages/*/src/resolvers/ in nine packages. The team wants one maintained file that loads only when Claude works on a resolver. What should you configure?',
        options: [
          { text: 'Add the conventions to the root CLAUDE.md.', correct: false,
            why: 'Root CLAUDE.md loads in every session, so unrelated work pays for 300 lines of resolver rules.' },
          { text: 'Put a CLAUDE.md in each of the nine resolvers/ directories.', correct: false,
            why: 'This loads on demand, but nine copies drift apart. The team asked for one maintained file.' },
          { text: 'Add .claude/rules/graphql-resolvers.md with paths frontmatter matching packages/*/src/resolvers/**.', correct: true,
            why: 'A path-scoped rule is one file, and it loads only when Claude reads or edits a matching file.' },
          { text: 'Create a resolver skill that developers invoke before editing resolvers.', correct: false,
            why: 'Manual invocation depends on people remembering. The requirement is automatic, path-triggered loading.' }
        ],
        explanation: 'Files in .claude/rules/ without frontmatter load in every session. Adding `paths:` globs in YAML frontmatter makes a rule conditional: it loads when Claude touches matching files.\n\nThis is the right tool for conventions tied to file types or locations spread across the tree. Make sure the frontmatter block is properly closed with `---`.',
        refs: [{ title: 'Manage Claude\'s memory', url: 'https://docs.claude.com/en/docs/claude-code/memory' }]
      },
      {
        domain: C, scenario: SC,
        question: 'The project CLAUDE.md has 40 lines of coding standards and a 250-line on-call runbook used a few times a month. Claude has started missing standards. What should you do with the runbook?',
        options: [
          { text: 'Move it to a project skill at .claude/skills/oncall-runbook/SKILL.md with a clear description.', correct: true,
            why: 'Only the skill\'s short description loads up front. The full runbook loads when it is invoked or relevant.' },
          { text: 'Move it to docs/runbook.md and @import it from CLAUDE.md.', correct: false,
            why: 'Imports expand at launch, so every session still loads all 250 lines.' },
          { text: 'Move it to .claude/rules/ with paths matching ops/**.', correct: false,
            why: 'On-call work is an invoked workflow, not editing of ops files. The rule may not load when it is needed.' },
          { text: 'Cut it down to a five-line summary in CLAUDE.md.', correct: false,
            why: 'The runbook needs its exact steps, and a summary forces Claude to guess them during an incident.' }
        ],
        explanation: 'Use CLAUDE.md for guidance that should always apply, and skills for occasional procedures. Skills use progressive disclosure: the name and description are always visible, and the SKILL.md body (plus any referenced files) loads only when used.\n\nA lean CLAUDE.md improves adherence to the rules that remain.',
        refs: [{ title: 'Agent Skills', url: 'https://docs.claude.com/en/docs/claude-code/skills' }]
      },
      {
        domain: C, scenario: SC,
        question: 'Which TWO tasks should start in plan mode rather than direct execution? (Select TWO.)',
        options: [
          { text: 'Migrate authentication from server sessions to JWTs across about 40 files.', correct: true,
            why: 'This is a large, multi-file change with design decisions. Agreeing on the approach first prevents expensive rework.' },
          { text: 'Fix an intermittent deadlock in a queue module nobody on the team has worked in.', correct: true,
            why: 'The cause is unknown and the code is unfamiliar. Read-only exploration and a proposed diagnosis come before edits.' },
          { text: 'Rename a local variable in one function for clarity.', correct: false,
            why: 'You can describe this diff in one sentence. Planning adds overhead with no reduction in risk.' },
          { text: 'Add a missing null check at a line the stack trace points to.', correct: false,
            why: 'The location and fix are already known, so direct execution with a test to verify is enough.' }
        ],
        explanation: 'Plan mode lets Claude read and explore without editing, then propose a plan for approval. It pays off when the approach, the location, or the code itself needs investigation, or when several valid approaches exist.\n\nFor small changes whose shape is already known, execute directly and verify with tests.',
        refs: [{ title: 'Claude Code best practices', url: 'https://www.anthropic.com/engineering/claude-code-best-practices' }]
      },
      {
        domain: C, scenario: SC,
        question: 'Everyone should get the same issue-tracker MCP server, but each developer has their own API token. How should you configure it?',
        options: [
          { text: 'Commit .mcp.json with the server definition and the team\'s shared token inline.', correct: false,
            why: 'This puts secrets in version control, which is a serious security problem.' },
          { text: 'Commit .mcp.json at the repo root and reference the token as ${TRACKER_TOKEN} from each developer\'s environment.', correct: true,
            why: 'Project-scope .mcp.json shares the server definition, and environment-variable expansion keeps each token personal and out of git.' },
          { text: 'Have each developer add the server with user scope on their own machine.', correct: false,
            why: 'This works, but the configurations drift and new teammates have to rediscover the setup.' },
          { text: 'Describe the server URL in CLAUDE.md so Claude connects to it.', correct: false,
            why: 'CLAUDE.md does not configure MCP connections. Claude cannot connect to a server just because it is described in text.' }
        ],
        explanation: 'MCP servers can be configured at local, project (.mcp.json, committed), or user scope. Project scope is for team-shared tools. Claude Code expands environment variables such as ${VAR} in .mcp.json, so credentials stay outside the repository.\n\nClaude Code asks for approval before using project-scoped servers from .mcp.json.',
        refs: [{ title: 'Connect Claude Code to tools via MCP', url: 'https://docs.claude.com/en/docs/claude-code/mcp' }]
      },
      {
        domain: C, scenario: SC,
        question: 'Every file Claude edits must be formatted with Prettier immediately, without relying on Claude remembering to do it. What should you add?',
        options: [
          { text: 'A CLAUDE.md line: "Always run Prettier after editing files."', correct: false,
            why: 'This is guidance. Claude will usually comply, but not every time.' },
          { text: 'A PostToolUse hook matching Edit|Write that runs Prettier on the edited file.', correct: true,
            why: 'The hook runs in code after every matching tool call, so formatting is deterministic.' },
          { text: 'A PreToolUse hook matching Edit|Write that runs Prettier.', correct: false,
            why: 'PreToolUse runs before the edit, so it would format the old content and the new edit would remain unformatted.' },
          { text: 'A git pre-commit hook only.', correct: false,
            why: 'This helps at commit time, but files stay unformatted during the session, which the requirement rules out.' }
        ],
        explanation: 'Hooks turn "should" into "always". PostToolUse runs after a tool succeeds, which suits formatting, linting, and logging. PreToolUse runs before a tool executes and can block or modify the call, which suits guardrails.\n\nConfigure shared hooks in .claude/settings.json so the whole team gets them.',
        refs: [{ title: 'Get started with hooks', url: 'https://docs.claude.com/en/docs/claude-code/hooks-guide' }]
      },
      {
        domain: C, scenario: SC,
        question: 'The project CLAUDE.md should include the branching rules from docs/CONTRIBUTING.md, which another team maintains and updates often. What is the best way to include them?',
        options: [
          { text: 'Paste the relevant sections into CLAUDE.md.', correct: false,
            why: 'The copy goes stale whenever the other team updates CONTRIBUTING.md.' },
          { text: 'Add a markdown link: [Contributing](docs/CONTRIBUTING.md).', correct: false,
            why: 'A plain link is just text. It does not load the file\'s contents into context.' },
          { text: 'Add an import line: @docs/CONTRIBUTING.md', correct: true,
            why: 'Imports pull in the current contents of the file, so there is one source of truth.' },
          { text: 'Ask Claude to read CONTRIBUTING.md at the start of each session.', correct: false,
            why: 'This depends on someone remembering every session.' }
        ],
        explanation: 'CLAUDE.md supports `@path/to/file` imports, which expand into context at launch. Relative paths resolve from the importing file.\n\nImports keep a single source of truth across teams. They do not reduce context cost, so import only what every session needs.',
        refs: [{ title: 'Manage Claude\'s memory', url: 'https://docs.claude.com/en/docs/claude-code/memory' }]
      },
      {
        domain: X, scenario: SC,
        question: 'Finding flaky-test patterns means reading about 200 test files. In past sessions this filled the context before the fix work began. What should you do?',
        options: [
          { text: 'Delegate the survey to a subagent that returns a categorized list of flaky patterns with file paths.', correct: true,
            why: 'The verbose reading happens in the subagent\'s context. Only the distilled findings come back.' },
          { text: 'Run /clear after reading the files, then start fixing.', correct: false,
            why: 'Clearing deletes the findings the fix phase needs.' },
          { text: 'Read the files in plan mode.', correct: false,
            why: 'Plan mode prevents edits, but the reads still land in the main context.' },
          { text: 'Ask Claude to read the files faster by skimming.', correct: false,
            why: 'Skimming still adds content to context and reduces accuracy.' }
        ],
        explanation: 'Subagents have isolated context windows, so delegating high-volume exploration keeps the main conversation focused. Ask for a structured return, such as pattern, files, and evidence, so precise details survive the handoff.\n\nPlan mode controls what Claude may do. It does not control where output goes.',
        refs: [{ title: 'Subagents', url: 'https://docs.claude.com/en/docs/claude-code/sub-agents' }]
      },
      {
        domain: C, scenario: SC,
        question: 'Claude\'s implementation of a date-range parser keeps missing edge cases (leap days, open-ended ranges, time zones) that are described in prose. What is the most reliable workflow?',
        options: [
          { text: 'Rewrite the prose description with more adjectives and emphasis.', correct: false,
            why: 'Prose is what has already failed. More emphasis does not make it unambiguous.' },
          { text: 'Write test cases for each edge case first, then have Claude implement until they all pass.', correct: true,
            why: 'Tests are an unambiguous, runnable target that Claude can check itself against, then iterate on.' },
          { text: 'Ask Claude to rate its confidence that every edge case is handled.', correct: false,
            why: 'Self-rated confidence is not verification, and the model can be confidently wrong.' },
          { text: 'Switch to a larger model.', correct: false,
            why: 'A larger model may help a little, but the missing piece is a verifiable success criterion.' }
        ],
        explanation: 'Give Claude a way to verify its work. Test-first iteration (write the tests, confirm they fail, implement until they pass) turns vague requirements into a feedback loop.\n\nTell Claude not to modify the tests to make them pass.',
        refs: [{ title: 'Claude Code best practices', url: 'https://www.anthropic.com/engineering/claude-code-best-practices' }]
      },
      {
        domain: X, scenario: SC,
        question: 'After generating a large refactor, the developer asks the same session to review its own diff. The review approves everything, but a bug reaches production. What improves the review?',
        options: [
          { text: 'Ask the same session to "review more critically".', correct: false,
            why: 'The session still carries the reasoning that produced the change, so it tends to confirm its own choices.' },
          { text: 'Run the review in a fresh session or subagent that sees only the diff and the requirements.', correct: true,
            why: 'An independent reviewer without the generation context is more likely to question the decisions.' },
          { text: 'Have the session rate the diff\'s quality from 1 to 10.', correct: false,
            why: 'A self-assigned score does not add independent scrutiny.' },
          { text: 'Skip review and rely only on the existing tests.', correct: false,
            why: 'Tests catch what they cover. Review is meant to catch what they do not.' }
        ],
        explanation: 'Self-review is limited because the model keeps the context that led to its decisions. A separate instance (a new session, a subagent, or a CI job) reviewing only the artifact and the spec gives independent judgment.\n\nThis is the "writer/reviewer" pattern recommended for Claude Code.',
        refs: [{ title: 'Claude Code best practices', url: 'https://www.anthropic.com/engineering/claude-code-best-practices' }]
      },
      {
        domain: C, scenario: SC,
        question: 'The shared .claude/settings.json allows `Bash(npm run *)` and denies `Bash(npm run deploy:*)`. A developer\'s session tries `npm run deploy:prod`. What happens?',
        options: [
          { text: 'It runs, because the allow rule matches.', correct: false,
            why: 'Both rules match, and deny takes precedence over allow.' },
          { text: 'It is blocked, because deny rules take precedence over allow rules.', correct: true,
            why: 'Permission evaluation checks deny first, so a matching deny wins whatever allow rules exist.' },
          { text: 'Claude Code prompts the user, because the rules conflict.', correct: false,
            why: 'There is no conflict to resolve. Deny is evaluated first and wins.' },
          { text: 'It depends on which rule appears first in the file.', correct: false,
            why: 'Rule order within the file does not decide the outcome. The rule type does.' }
        ],
        explanation: 'Claude Code permission rules are evaluated deny, then ask, then allow. The first matching category wins, so a deny always beats an allow.\n\nThis lets teams grant broad allows while carving out forbidden actions. For complex command patterns, back the deny rule with a PreToolUse hook, because argument order and shell tricks can slip past simple prefix patterns.',
        refs: [{ title: 'Identity and access management (permissions)', url: 'https://docs.claude.com/en/docs/claude-code/iam' }]
      }
    ]
  });
})();

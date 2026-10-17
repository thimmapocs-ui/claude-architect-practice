# Claude Architect Practice

Free, community-made practice questions for the **Claude Certified Architect – Foundations** exam.
All questions are original, scenario-based, and explain every option, so you learn why the wrong
answers are wrong.

> Unofficial. Not affiliated with or endorsed by Anthropic, and not real exam content.
> Verify against the official docs at https://docs.claude.com.

## Features
- 8 sets (120 questions) covering the five exam domains:
  - Agentic Architecture & Orchestration
  - Tool Design & MCP Integration
  - Claude Code Configuration & Workflows
  - Prompt Engineering & Structured Output
  - Context Management & Reliability
- Practice mode (feedback after each question) or Exam mode (feedback at the end)
- Option and question shuffling, flag-for-review, per-domain score breakdown, and "review incorrect only"
- Best and last scores saved in the browser's localStorage. No backend, no tracking.
- Pure static HTML/CSS/JS. You can open `index.html` directly from disk.

## Study tools
- **Home**: readiness estimate weighted by exam domain, mastery per domain, day streak and a daily mission list. Everything is computed from your own answers.
- **Fix My Weak Areas**: builds a session from questions you missed, then unseen ones, then your weakest correct answers
- **Daily Practice**: five questions that change each day
- **Flashcards**: flashcards on a spaced schedule (1, 3, 7, 14 days) with Again / Got it
- **Fix the Code**: find the faulty line in 10 config and code snippets, then pick the right fix (hooks, loops, schemas, MCP config, CI)
- **Mock Exam**: timed, 30 or 60 questions drawn by domain weight
- **Practice Tests**: 8 sets, practice or exam mode
- **Lessons**, **Quick Reference** (printable), **Common Mistakes**, and an interactive **study plan**, with a "Salesforce lens" note per domain
- **Search** across everything (press `/` or Ctrl/Cmd+K), and export/import of your progress as JSON

Exam facts (question count, pass mark, domain weights) are community-reported and unofficial. Claude Code details follow https://code.claude.com/docs.

## Run locally
Open `index.html` in a browser, or run:
```bash
python3 -m http.server 8080   # then visit http://localhost:8080
```

## Host it for free
| Option | Steps |
|---|---|
| **GitHub Pages** | Push this folder to a public repo on a personal account, then go to Settings → Pages → Deploy from branch → `main` / root. |
| **Netlify Drop** | Drag the folder onto https://app.netlify.com/drop. |
| **Cloudflare Pages** | Create project → Direct upload → upload the folder. |

## Add a question set
1. Copy an existing file in `sets/` to `sets/set-NN-your-topic.js`.
2. Add `<script src="sets/set-NN-your-topic.js"></script>` to `index.html`, before `app.js`.

Each question looks like this:
```js
{
  domain: 'Tool Design & MCP Integration',      // used for the score breakdown
  scenario: 'Short shared context...',
  question: 'What should you do? (Select TWO.)',  // say "Select TWO" when 2 answers are correct
  options: [
    { text: 'Option A', correct: true,  why: 'Why this is right.' },
    { text: 'Option B', correct: false, why: 'Why this is wrong.' }
  ],
  explanation: 'Overall explanation. Blank lines start new paragraphs. Use `code` for identifiers.',
  refs: [{ title: 'Doc title', url: 'https://docs.claude.com/...' }]
}
```
Single- or multi-select is detected from the number of `correct: true` options.

**Contributions:** write your own questions. Don't paste content from paid practice tests or
exam dumps.

# Claude Architect Practice

Free, community-made practice questions for the **Claude Certified Architect – Foundations** exam.
All questions are original, scenario-based, and explain every option, so you learn why the wrong
answers are wrong.

> Unofficial. Not affiliated with or endorsed by Anthropic, and not real exam content.
> Verify against the official docs at https://docs.claude.com.

## Features
- 7 sets (90 questions) covering the five exam domains:
  - Agentic Architecture & Orchestration
  - Tool Design & MCP Integration
  - Claude Code Configuration & Workflows
  - Prompt Engineering & Structured Output
  - Context Management & Reliability
- Practice mode (feedback after each question) or Exam mode (feedback at the end)
- Option and question shuffling, flag-for-review, per-domain score breakdown, and "review incorrect only"
- Best and last scores saved in the browser's localStorage. No backend, no tracking.
- Pure static HTML/CSS/JS. You can open `index.html` directly from disk.

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

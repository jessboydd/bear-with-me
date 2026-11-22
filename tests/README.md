# Scenario tests

`tools/scenario-test.mjs` replays the four self-tests from November 22, 2026 (`tests/scenarios.json`) against the bear and writes a report you can read side by side with your own notes.

It calls the same server piece as the live app (`api/chat.js`): the same model, rules, reply limit and Anthropic call. Nothing about the app changes when you run it.

## 1. Dry run first (free, no key)

```bash
node tools/scenario-test.mjs --dry-run
```

This makes **no AI calls**. It feeds in made-up sample replies that copy the problems seen on November 22, to show that the scoring catches them. The report lands in `tests/results/`.

## 2. Add the photos for Test 4

Put the two photos from Test 4 in `tests/fixtures/` as `t4-blurry-1.jpg` and `t4-blurry-2.jpg` (or change the names in `tests/scenarios.json`). Photos in `tests/fixtures/` are ignored by git, so they stay off the public repo. Without them, Test 4 is skipped in real runs.

## 3. Real runs (costs money: roughly $1–3 for both versions at 5 runs each)

The script reads the key from the `ANTHROPIC_API_KEY` environment variable. It never prints or saves it. Never paste the key into a chat, a file in this repo, or a command that gets saved to your shell history.

**Option A: your own computer, typed in privately**

```bash
read -rs ANTHROPIC_API_KEY && export ANTHROPIC_API_KEY
```

Paste the key and press Enter; nothing is shown and nothing is saved to shell history. It disappears when you close the terminal.

**Option B: the key already stored in Vercel**

```bash
npx vercel env pull .env.test --environment=development
```

Run this from the repo (it needs a Vercel login). `.env.test` is ignored by git, but it is a plain-text file with your key in it: delete it when you're done.

```bash
node --env-file=.env.test tools/scenario-test.mjs --runs 5 --label baseline
```

**Option C: this Claude Code cloud session.** Claude can open a secure form that stores the key on the session's environment. Claude never sees it, and it isn't added to the repo.

## 4. Compare the live version with the revised one

The live version as tested on November 22 is saved on the branch `claude/preserve-live-2026-11-22`.

```bash
git worktree add ../bear-baseline claude/preserve-live-2026-11-22
```

```bash
node tools/scenario-test.mjs --runs 5 --label baseline --handler ../bear-baseline/api/chat.js
```

```bash
node tools/scenario-test.mjs --runs 5 --label revised
```

Then compare the two reports in `tests/results/`. The AI answers a little differently each time, so the reports count how many of the 5 runs had each issue rather than trusting a single run.

## Reading the report

- **fail**: a clear rule was broken (for example, urgency wasn't "stop" for the red oil light, or a tire reply never mentioned the door label or owner's manual).
- **review**: a pattern worth reading yourself (for example, a mention of "shoulder" or "spare"). These are flags, not verdicts.
- Every run's full transcript is in the report, so you can judge tone and clarity yourself.

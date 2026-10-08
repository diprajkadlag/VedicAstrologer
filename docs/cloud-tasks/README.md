# Cloud-session feature tasks (October 2026)

Six task files for Claude Code cloud sessions. The planning and checking are already done:
- the code was read;
- the astronomy was cross-checked against Swiss Ephemeris 2.10.03 and Drik Panchang;
- the four-language wording is written.

So each session can spend its credit on building. Every session also reads `CLAUDE.md` in
the repository root.

**Budget:** $60 of cloud-session credit, which expires on **5 Nov 2026 at 08:59 German time**.
The estimates below add up to $29–46, leaving a buffer for fixes.

| # | Task | Model | Estimate | Start |
|---|---|---|---|---|
| 01 | [Ninth-division chart (D9)](01-navamsha-d9.md) | Sonnet 5.5 | $3–6 | now; it also measures the real cost |
| 02 | [Aspects on tap](02-aspects-on-tap.md) | Sonnet 5.5 | $4–7 | after 01 is merged |
| 03 | [Transits over the birth chart + Now button](03-transits-over-birth-chart.md) | Opus 5.5 | $8–12 | after 02 is merged |
| 04 | [Read aloud](04-read-aloud.md) | Sonnet 5.5 | $2–3 | any time |
| 05 | [Panchang: engine and day view](05-panchang-day.md) | Opus 5.5 | $8–12 | any time |
| 06 | [Panchang: month calendar](06-panchang-month.md) | Sonnet 5.5 | $4–6 | after 05 is merged |

01, 04 and 05 can run at the same time, but all three edit
`components/analysis/InterpretationPanel.tsx` (different sections plus the shared imports).
Merge their pull requests one at a time and expect one "merge main" round. 01 → 02 → 03
all change the chart card, so run those strictly one after another.

## How to run a task

1. Open claude.ai/code (or the Claude app → Code, or the desktop app with **Cloud**
   selected). Pick the repository `diprajkadlag/VedicAstrologer`.
2. Choose the model in the model menu, or send `/model sonnet` (or `/model opus`) as the first message.
3. Send: `Do docs/cloud-tasks/01-navamsha-d9.md`
4. Let it run, answering if it asks. It ends by opening a pull request.
5. Check the pull request:
   - CI must be green. CI also runs the phone checks and uploads screenshots in the run's artifacts.
   - To try it on your PC: `git fetch`, check out the branch, `npm run dev`, open <http://localhost:3737>.
6. Merge when happy. GitHub Pages then redeploys the live app.

## Keep the budget on track

- Note the remaining credit (usage menu) before and after task 01, then scale the other estimates by what it really cost.
- Don't use Fable 5.1 for these. It costs 2.5× Opus and 5× Sonnet per token, and the task
  files carry the hard thinking already.
- If a session goes in circles, stop it and add one line of guidance rather than letting it explore.
- If a pull request conflicts with main, open the same session and send:
  `Merge main into this branch, fix the conflicts, run the checks, push.`
- If money runs short, skip 06 first, then 04.
- When all are merged, one short session can add the CHANGELOG entry. Sessions are told
  not to edit it, so parallel runs can't conflict there.

## Tracker

| # | Started | Credit before | Credit after | Pull request | Merged |
|---|---|---|---|---|---|
| 01 | | | | | |
| 02 | | | | | |
| 03 | | | | | |
| 04 | | | | | |
| 05 | | | | | |
| 06 | | | | | |

## Where the reference values come from

- **Positions** (test chart: 15 May 1990, 10:30 IST, Pune). The app's engine and Swiss
  Ephemeris 2.10.03 (Moshier, Lahiri) agree within 1.2″ for all bodies and the ascendant,
  and the D9 signs agree for all of them.
- **Almanac.** For Pune on 8 Oct 2026, the engine, Swiss Ephemeris and Drik Panchang agree:
  - sunrise within 1 s (engine vs Swiss Ephemeris);
  - lunar day, mansion, yoga, karana and Rahu Kaal times within 1–2 minutes of Drik Panchang.

  Four further dates agree on every index.
- **Transits.** Saturn entered sidereal Pisces on 29 Mar 2025 (Swiss Ephemeris 16:14 UTC,
  app 16:37 UTC). Jupiter entered Gemini on 14 May 2025 (17:06 / 17:09 UTC).

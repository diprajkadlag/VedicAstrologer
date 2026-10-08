# 04 — Read the house reading aloud

**Model:** Sonnet 5.5 · **Estimate:** $2–3 · **Can start any time.** Read `CLAUDE.md` first.

## What the user gets

In the twelve-house reading at the end of the page:
- a **Listen to all 12 houses** button, which becomes Pause / Resume and Stop while reading;
- a speed choice (Slower / Normal);
- a small **Listen** button on each house card.

The phone's or computer's own voice reads the card text in the current interface
language. The card being read is highlighted. There is no network call and no new
dependency: it uses the browser's Web Speech API (`window.speechSynthesis`).

## 1. Pure helpers — new `components/analysis/houseSpeech.ts` and test

- `buildHouseSpeech({ chart, house, locale, labels }): string` reads the same content, in
  the same order, as `HouseCard` in `components/analysis/InterpretationPanel.tsx`:
  1. house title — `readLocalized(BHAVA_EDUCATION[n].name, locale)`;
  2. sign name;
  3. "{labels.lord}: {lord name}, {labels.house} {lord's house}";
  4. `bhavaSummary.significance` (from `buildLocalizedBhavaRows(chart, locale)`);
  5. "{labels.constructive}: …" — `BHAVA_EDUCATION[n].constructive`;
  6. "{labels.watchFor}: …" — `.caution`;
  7. one sentence per resident: "{planet}: {GRAHA_EDUCATION[id].signifies}".

  `labels` comes from the panel's existing `copy` (`lord`, `house`, `constructive`, `watchFor`).
  The helpers are imported from `@/lib/astro/education`, `@/lib/astro/glossary` (`RASI_PROFILES`)
  and `@/lib/export/kundaliSummary`.
- `splitForSpeech(text): string[]` splits into sentence-sized chunks of at most about
  200 characters, at `.`, `!`, `?` and the Devanagari danda `।`. Chrome cuts off long
  single utterances, so queue one utterance per chunk.
- `pickVoice(voices, locale): { voice: SpeechSynthesisVoice | null; fallback: "hi" | null }`:
  - prefer an exact `lang` match: `en-IN`, `hi-IN`, `mr-IN`, `de-DE`;
  - then any voice of the same language (`en-*`, `de-*`, …);
  - for `mr` with no Marathi voice, use a Hindi voice (same script) and return `fallback: "hi"`;
  - otherwise `null`.

**Tests**
- The speech for house 1 and house 7 contains the house title and the significance in all four languages.
- Hindi text splits at `।`; no chunk exceeds 220 characters.
- `pickVoice` cases:
  - `[en-US, hi-IN]` with `en` → en-US;
  - `[hi-IN]` with `mr` → hi-IN plus the fallback;
  - `[de-AT]` with `de` → de-AT;
  - `[]` → null.

## 2. Controls — new `components/analysis/ReadAloud.tsx`

- A `useReadAloud()` hook holding the queue, current house, state
  (`idle | speaking | paused`) and rate (`0.85` or `1`).
- **Lint-safe patterns** (CLAUDE.md rule 9; `set-state-in-effect` and `purity` are errors here):
  - Browser check: `useSyncExternalStore(subscribeToNothing, () => true, () => false)`, as in
    `components/ui/AstroTerm.tsx`. Render buttons disabled until it is true. If
    `"speechSynthesis" in window` is false, show the `unsupported` note instead.
  - Voices load asynchronously. Read them with `useSyncExternalStore`, subscribed to
    `voiceschanged`. `getVoices()` returns a new array on every call, so cache the snapshot
    (return the previous array unless the list of `voiceURI`s changed); otherwise React
    loops forever.
  - Use the `onend` and `onerror` properties of each utterance, not `addEventListener`.
    The e2e stub only provides the properties.
  - Change state only in event handlers and utterance callbacks.
  - To stop on a language change, render the controls with `key={locale}` so they remount.
    The unmount cleanup calls `speechSynthesis.cancel()`. Stop does the same.
- Set each utterance's `lang` to the chosen voice's `lang`, or to `en-IN` / `hi-IN` /
  `mr-IN` / `de-DE` when there is no voice.
- Show `noVoice` when `pickVoice` finds nothing, and `hindiFallback` for Marathi read by a Hindi voice.

**Wire-up in `InterpretationPanel.tsx`** (`HousesTab` and `HouseCard`; find them with `rg -n`):
- The main control row goes under the "House-by-house" heading. The main button is at
  least 40 px tall; the per-card buttons are at least 24 px tall.
- The card being read gets `ring-2 ring-[var(--accent)]` and `aria-current="true"`, and
  scrolls into view with `block: "nearest"`.
- Add an `aria-live="polite"` status line, e.g. "Reading house 3 of 12" or "Finished reading".
- Keep the existing card content and order unchanged; the existing `TwelveHouseSummary`
  tests must still pass.

## 3. Text — use as given

| key | en | hi | mr | de |
|---|---|---|---|---|
| listenAll | Listen to all 12 houses | सभी 12 भाव सुनें | सर्व 12 भाव ऐका | Alle 12 Häuser anhören |
| listen | Listen | सुनें | ऐका | Anhören |
| listenHouseAria | Listen to house {house} | भाव {house} सुनें | भाव {house} ऐका | Haus {house} anhören |
| pause | Pause | रोकें | थांबवा | Pause |
| resume | Resume | जारी रखें | पुन्हा सुरू करा | Weiter |
| stop | Stop | बंद करें | बंद करा | Stopp |
| speed | Speed | गति | वेग | Tempo |
| slower | Slower | धीमी | हळू | Langsamer |
| normal | Normal | सामान्य | सामान्य | Normal |
| reading | Reading house {house} of 12 | 12 में से भाव {house} पढ़ा जा रहा है | 12 पैकी भाव {house} वाचला जात आहे | Haus {house} von 12 wird vorgelesen |
| finished | Finished reading | पढ़ना पूरा हुआ | वाचन पूर्ण झाले | Vorlesen beendet |
| noVoice | This device has no voice for this language. | इस डिवाइस पर इस भाषा की आवाज़ नहीं है। | या उपकरणावर या भाषेचा आवाज नाही. | Dieses Gerät hat keine Stimme für diese Sprache. |
| hindiFallback | No Marathi voice on this device, so the Hindi voice reads the Marathi text. | इस डिवाइस पर मराठी आवाज़ नहीं है, इसलिए मराठी पाठ हिंदी आवाज़ में पढ़ा जा रहा है। | या उपकरणावर मराठी आवाज नाही, म्हणून मराठी मजकूर हिंदी आवाजात वाचला जात आहे. | Auf diesem Gerät gibt es keine Marathi-Stimme, daher liest die Hindi-Stimme den Marathi-Text. |
| unsupported | This browser cannot read text aloud. | यह ब्राउज़र पाठ पढ़कर नहीं सुना सकता। | हा ब्राउझर मजकूर वाचून दाखवू शकत नाही. | Dieser Browser kann keinen Text vorlesen. |

## 4. Browser check — stub the speech engine

Add `e2e/read-aloud.spec.ts`. Stub the API before the page loads:

```ts
await page.addInitScript(() => {
  const spoken: { text: string; lang: string }[] = [];
  (window as unknown as { __spoken: typeof spoken }).__spoken = spoken;
  const voices = [{ name: "Test English", lang: "en-IN", default: true, localService: true, voiceURI: "t-en" }];
  const synth = {
    speaking: false, paused: false, pending: false,
    getVoices: () => voices,
    speak(u: { text: string; lang: string; onend?: (e: unknown) => void }) {
      spoken.push({ text: u.text, lang: u.lang });
      setTimeout(() => u.onend?.({}), 5);
    },
    cancel() {}, pause() { this.paused = true; }, resume() { this.paused = false; },
    addEventListener() {}, removeEventListener() {},
  };
  Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
  (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance = function (this: Record<string, unknown>, text: string) {
    this.text = text; this.lang = ""; this.rate = 1; this.voice = null;
  };
});
```

Then:
1. `generateChart(page)`.
2. Scroll to `#house-analysis` and click **Listen to all 12 houses**.
3. Expect `__spoken[0].text` to contain house 1's title and `lang` to start with `en`.
4. Expect the status line to appear.
5. Run `expectNoHorizontalOverflow(page)` and save `read-aloud.png`.

## Done when

- [ ] `houseSpeech.test.ts` passes; the stubbed e2e passes locally or in CI.
- [ ] All four languages work, and the Marathi → Hindi voice fallback shows its note.
- [ ] Pause, Resume and Stop work; nothing keeps speaking after Stop or a language change.
- [ ] typecheck, lint, test and build pass. Pull request opened.

## Out of scope

Reading other sections or the PDF, downloading audio, server-side voices, and storing settings.

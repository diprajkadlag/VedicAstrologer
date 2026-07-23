"use client";

import {
  type MouseEvent,
  type ReactNode,
  useId,
  useRef,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { BookOpenCheck, CircleHelp, X } from "lucide-react";

import {
  useAppPreferences,
  useScopedTranslations,
} from "@/components/providers/AppPreferencesProvider";
import type { AstroTermId } from "@/lib/astro/glossary";
import { getLocalizedAstroGlossaryEntry } from "@/lib/astro/localizedGlossary";
import { defineMessages } from "@/lib/i18n";

const messages = defineMessages({
  en: {
    learnAbout: "Learn about {term}",
    close: "Close definition",
    glossary: "Jyotish glossary",
    sanskrit: "Sanskrit",
    calculation: "How this app calculates it",
    reading: "How to read it",
    disclaimer:
      "These are traditional symbolic concepts for reflective interpretation, not deterministic claims, scientifically validated predictions, or consequential advice.",
  },
  hi: {
    learnAbout: "{term} के बारे में जानें",
    close: "परिभाषा बन्द करें",
    glossary: "ज्योतिष शब्दावली",
    sanskrit: "संस्कृत",
    calculation: "यह ऐप इसकी गणना कैसे करता है",
    reading: "इसे कैसे पढ़ें",
    disclaimer:
      "ये आत्मचिन्तन के लिए पारंपरिक प्रतीकात्मक अवधारणाएँ हैं—न निश्चित दावे, न वैज्ञानिक रूप से प्रमाणित भविष्यवाणियाँ और न महत्त्वपूर्ण निर्णयों की सलाह।",
  },
  mr: {
    learnAbout: "{term} विषयी जाणून घ्या",
    close: "व्याख्या बंद करा",
    glossary: "ज्योतिष शब्दसंग्रह",
    sanskrit: "संस्कृत",
    calculation: "हे ॲप याची गणना कशी करते",
    reading: "हे कसे वाचावे",
    disclaimer:
      "या आत्मचिंतनासाठीच्या पारंपरिक प्रतीकात्मक संकल्पना आहेत—निश्चित दावे, वैज्ञानिकरीत्या प्रमाणित भविष्यवाणी किंवा महत्त्वाच्या निर्णयांचा सल्ला नव्हे.",
  },
});

export interface AstroTermProps {
  term: AstroTermId;
  children?: ReactNode;
  className?: string;
  variant?: "inline" | "chip";
}

const subscribeToNothing = () => () => undefined;

export default function AstroTerm({
  term,
  children,
  className = "",
  variant = "inline",
}: AstroTermProps) {
  const { locale } = useAppPreferences();
  const t = useScopedTranslations(messages);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const instanceId = useId().replaceAll(":", "");
  const entry = getLocalizedAstroGlossaryEntry(term, locale);
  const titleId = `glossary-${term}-${instanceId}`;
  const isClient = useSyncExternalStore(subscribeToNothing, () => true, () => false);

  function openDialog() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }

  function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) event.currentTarget.close();
  }

  const triggerClass =
    variant === "chip"
      ? "inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/[0.08] px-2.5 py-1 text-xs text-violet-800 transition hover:border-violet-600/40 hover:bg-violet-500/15 dark:border-violet-300/15 dark:bg-violet-300/[0.055] dark:text-violet-100/85 dark:hover:border-violet-200/30 dark:hover:bg-violet-300/10"
      : "inline-flex items-baseline gap-1 border-b border-dotted border-violet-600/45 text-inherit underline-offset-4 transition hover:border-violet-700 hover:text-violet-700 dark:border-violet-300/45 dark:hover:border-violet-200 dark:hover:text-violet-200";

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={t("learnAbout", { term: entry.title })}
        onClick={openDialog}
        className={`${triggerClass} ${className}`}
      >
        {children ?? entry.title}
        <CircleHelp aria-hidden="true" className="size-[0.85em] shrink-0 self-center opacity-65" />
      </button>

      {isClient ? createPortal(<dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={closeFromBackdrop}
        className="m-auto max-h-[min(82vh,720px)] w-[min(92vw,650px)] overflow-y-auto rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-0 text-left text-[var(--foreground)] shadow-2xl shadow-black/35 backdrop:bg-black/60 backdrop:backdrop-blur-sm dark:border-white/15 dark:bg-[#0d1020] dark:shadow-black/70 dark:backdrop:bg-black/75"
      >
        <article className="relative p-5 sm:p-7">
          <form method="dialog" className="absolute right-4 top-4">
            <button
              type="submit"
              aria-label={t("close")}
              className="grid size-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-slate-600 transition hover:bg-violet-500/10 hover:text-[var(--foreground)] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </form>

          <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
            <BookOpenCheck aria-hidden="true" className="size-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">
              {t("glossary")}
            </span>
          </div>
          <h2
            id={titleId}
            className="mt-3 pr-12 text-2xl font-semibold text-[var(--foreground)]"
          >
            {entry.title}
          </h2>
          {entry.sanskrit ? (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-200/70">
              {t("sanskrit")}: {entry.sanskrit}
            </p>
          ) : null}

          <p className="mt-5 rounded-xl border border-violet-500/15 bg-violet-500/[0.065] p-4 text-sm font-medium leading-6 text-violet-900 dark:border-violet-300/10 dark:bg-violet-300/[0.045] dark:text-violet-100/90">
            {entry.short}
          </p>
          <p className="mt-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
            {entry.detailed}
          </p>

          {entry.calculation ? (
            <section className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">
                {t("calculation")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {entry.calculation}
              </p>
            </section>
          ) : null}

          <section className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">
              {t("reading")}
            </h3>
            <ul className="mt-3 space-y-2">
              {entry.readingTips.map((tip) => (
                <li
                  key={tip}
                  className="flex gap-2 text-sm leading-6 text-slate-700 dark:text-slate-300"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-600/80 dark:bg-amber-300/70"
                  />
                  {tip}
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-6 border-t border-[var(--border)] pt-4 text-[11px] leading-5 text-[var(--muted)]">
            {t("disclaimer")}
          </p>
        </article>
      </dialog>, document.body) : null}
    </>
  );
}

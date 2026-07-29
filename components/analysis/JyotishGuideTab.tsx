"use client";

import {
  BookOpenText,
  Calculator,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Grid3X3,
  Info,
  Orbit,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  ANALYSIS_LIMITATIONS,
  auditVedicChart,
} from "@/lib/astro/analysisAudit";
import {
  BHAVA_EDUCATION,
  EDUCATION_TERMS,
  GRAHA_EDUCATION,
  LOCALIZED_ANALYSIS_LIMITATIONS,
  buildGrahaInBhavaReading,
  readLocalized,
  type CalculationStatus,
  type EducationTermId,
} from "@/lib/astro/education";
import {
  GRAHA_IDS,
  type GrahaId,
  type HouseNumber,
  type VedicChart,
} from "@/lib/astro/ephemeris";
import type { AppLocale } from "@/lib/i18n";

type GuideSection = "terms" | "grahas" | "explorer" | "integrity";

export interface JyotishGuideTabProps {
  locale: AppLocale;
  chart?: VedicChart;
  initialSection?: GuideSection;
  onSelectPlanet?: (graha: GrahaId) => void;
  onSelectHouse?: (bhava: HouseNumber) => void;
}

const COPY = {
  en: {
    eyebrow: "INTERACTIVE JYOTISH GUIDE",
    title: "Learn the language before reading the chart",
    subtitle:
      "Explore the small set of concepts that explains most of this app. Every interpretation is framed as a traditional symbolic lens—not a scientific prediction or fixed verdict.",
    terms: "Key terms",
    grahas: "Grahas",
    explorer: "Graha × Bhava",
    integrity: "Method & limits",
    search: "Search terms",
    searchPlaceholder: "Try Lagna, Pada, Dasha…",
    resultCount: "terms",
    noResults: "No matching term. Try a broader word.",
    howToRead: "How to use it",
    calculated: "Calculated here",
    partlyCalculated: "Partly calculated",
    notCalculated: "Not calculated",
    concept: "Concept",
    statusIntro:
      "The badge says whether this app actually calculates the item. Educational text alone is not a chart result.",
    grahaIntro:
      "Choose a graha to see its traditional scope. A graha is not simply good or bad; expression changes with context and human choices.",
    astronomicalIdentity: "Astronomical identity",
    signifies: "Symbolic significations",
    constructive: "Constructive expression",
    caution: "Potential imbalance",
    inquiry: "Reflection question",
    openInChart: "Highlight in chart",
    explorerIntro:
      "This explorer exposes the rule used for all 108 combinations: graha = function, Bhava = life field. Select both to see how the focus changes.",
    chooseGraha: "1 · Choose a graha",
    chooseBhava: "2 · Choose a Bhava",
    selectedReading: "3 · Read the synthesis",
    bhava: "Bhava",
    methodNote: "What this reading did—and did not—calculate",
    inspectBhava: "Highlight this Bhava",
    traditionalLabel: "Traditional symbolic interpretation",
    integrityIntro:
      "Accuracy has two different meanings here: internal calculation consistency can be checked; astrology's interpretive claims cannot be promoted as scientifically predictive.",
    chartAudit: "Current chart integrity audit",
    noChart:
      "Generate a chart to run structural checks. The limitations below apply with or without a chart.",
    consistent: "Internally consistent",
    inconsistent: "Needs review",
    checks: "structural checks",
    errors: "errors",
    warnings: "warnings",
    whatWasChecked: "What the audit checks",
    checkedText:
      "Rasi, Nakshatra and Pada derivation; whole-sign Bhava sequence; graha-to-Bhava membership; motion flags; supported graha set; Rahu–Ketu opposition; coordinate and model declarations.",
    whatItCannotProve: "Transparent limitations",
    finding: "Structural inconsistency",
    technicalDiagnostics: "Developer diagnostics",
    diagnosticItem: "Internal consistency finding",
    fairness:
      "Balanced reading standard: describe constructive and difficult expressions, disclose missing factors, avoid fear, and never treat symbolic text as medical, legal, financial or psychological diagnosis.",
  },
  hi: {
    eyebrow: "इंटरैक्टिव ज्योतिष मार्गदर्शिका",
    title: "कुंडली पढ़ने से पहले उसकी भाषा सीखें",
    subtitle:
      "उन चुनिंदा अवधारणाओं को समझें जो इस ऐप का अधिकांश भाग स्पष्ट करती हैं। हर व्याख्या पारंपरिक प्रतीकात्मक दृष्टि है—वैज्ञानिक भविष्यवाणी या अंतिम निर्णय नहीं।",
    terms: "मुख्य शब्द",
    grahas: "ग्रह",
    explorer: "ग्रह × भाव",
    integrity: "पद्धति और सीमाएँ",
    search: "शब्द खोजें",
    searchPlaceholder: "जैसे लग्न, पाद, दशा…",
    resultCount: "शब्द",
    noResults: "कोई मेल नहीं मिला। अधिक सामान्य शब्द खोजें।",
    howToRead: "इसे कैसे पढ़ें",
    calculated: "यहाँ गणना होती है",
    partlyCalculated: "आंशिक गणना",
    notCalculated: "गणना नहीं होती",
    concept: "अवधारणा",
    statusIntro:
      "बैज बताता है कि ऐप वास्तव में इस विषय की गणना करता है या नहीं। केवल शैक्षिक पाठ कुंडली-परिणाम नहीं है।",
    grahaIntro:
      "किसी ग्रह का पारंपरिक क्षेत्र समझने के लिए उसे चुनें। ग्रह केवल शुभ या अशुभ नहीं; उसकी अभिव्यक्ति संदर्भ और मानवीय चुनाव से बदलती है।",
    astronomicalIdentity: "खगोलीय पहचान",
    signifies: "प्रतीकात्मक कारकत्व",
    constructive: "रचनात्मक अभिव्यक्ति",
    caution: "संभावित असंतुलन",
    inquiry: "मनन प्रश्न",
    openInChart: "कुंडली में चिह्नित करें",
    explorerIntro:
      "यह अन्वेषक सभी 108 संयोजनों का नियम स्पष्ट करता है: ग्रह = कार्य, भाव = जीवन-क्षेत्र। दोनों चुनकर देखें कि ध्यान कैसे बदलता है।",
    chooseGraha: "1 · ग्रह चुनें",
    chooseBhava: "2 · भाव चुनें",
    selectedReading: "3 · संश्लेषण पढ़ें",
    bhava: "भाव",
    methodNote: "इस पाठ में क्या गणना हुई—और क्या नहीं",
    inspectBhava: "यह भाव चिह्नित करें",
    traditionalLabel: "पारंपरिक प्रतीकात्मक व्याख्या",
    integrityIntro:
      "यहाँ शुद्धता के दो अलग अर्थ हैं: गणना की आंतरिक संगति जाँची जा सकती है; ज्योतिषीय व्याख्या को वैज्ञानिक भविष्यवाणी नहीं कहा जा सकता।",
    chartAudit: "वर्तमान कुंडली की संगति-जाँच",
    noChart:
      "संरचनात्मक जाँच के लिए कुंडली बनाएँ। नीचे की सीमाएँ कुंडली के साथ या बिना लागू होती हैं।",
    consistent: "आंतरिक रूप से सुसंगत",
    inconsistent: "समीक्षा आवश्यक",
    checks: "संरचनात्मक जाँच",
    errors: "त्रुटियाँ",
    warnings: "चेतावनियाँ",
    whatWasChecked: "जाँच में क्या शामिल है",
    checkedText:
      "राशि, नक्षत्र और पाद की व्युत्पत्ति; पूर्ण-राशि भाव-क्रम; ग्रह-भाव सदस्यता; गति-चिह्न; समर्थित ग्रह-सूची; राहु–केतु विरोध; निर्देशांक और मॉडल घोषणाएँ।",
    whatItCannotProve: "पारदर्शी सीमाएँ",
    finding: "संरचनात्मक असंगति",
    technicalDiagnostics: "डेवलपर निदान",
    diagnosticItem: "आंतरिक संगति निष्कर्ष",
    fairness:
      "संतुलित पाठ का मानक: रचनात्मक और कठिन—दोनों अभिव्यक्तियाँ बताएँ, छूटे कारक स्पष्ट करें, भय न पैदा करें और प्रतीकात्मक पाठ को चिकित्सा, कानूनी, वित्तीय या मनोवैज्ञानिक निदान न मानें।",
  },
  mr: {
    eyebrow: "परस्परसंवादी ज्योतिष मार्गदर्शिका",
    title: "कुंडली वाचण्याआधी तिची भाषा शिका",
    subtitle:
      "या अ‍ॅपचा बहुतांश भाग स्पष्ट करणाऱ्या निवडक संकल्पना समजून घ्या. प्रत्येक अर्थ हा पारंपरिक प्रतीकात्मक दृष्टिकोन आहे—वैज्ञानिक भाकीत किंवा अंतिम निर्णय नव्हे.",
    terms: "मुख्य संज्ञा",
    grahas: "ग्रह",
    explorer: "ग्रह × भाव",
    integrity: "पद्धत व मर्यादा",
    search: "संज्ञा शोधा",
    searchPlaceholder: "उदा. लग्न, पाद, दशा…",
    resultCount: "संज्ञा",
    noResults: "जुळणारी संज्ञा नाही. अधिक सामान्य शब्द वापरा.",
    howToRead: "हे कसे वाचावे",
    calculated: "येथे गणना होते",
    partlyCalculated: "अंशतः गणना",
    notCalculated: "गणना होत नाही",
    concept: "संकल्पना",
    statusIntro:
      "बॅज या अ‍ॅपमध्ये त्या बाबीची प्रत्यक्ष गणना होते का ते सांगतो. फक्त शैक्षणिक मजकूर हा कुंडलीचा निष्कर्ष नाही.",
    grahaIntro:
      "ग्रहाची पारंपरिक व्याप्ती पाहण्यासाठी तो निवडा. ग्रह फक्त शुभ किंवा अशुभ नसतो; संदर्भ व मानवी निवडींनुसार अभिव्यक्ती बदलते.",
    astronomicalIdentity: "खगोलीय ओळख",
    signifies: "प्रतीकात्मक कारकत्व",
    constructive: "रचनात्मक अभिव्यक्ती",
    caution: "संभाव्य असंतुलन",
    inquiry: "चिंतनप्रश्न",
    openInChart: "कुंडलीत ठळक करा",
    explorerIntro:
      "हा अन्वेषक सर्व 108 संयोगांचा नियम स्पष्ट करतो: ग्रह = कार्य, भाव = जीवनक्षेत्र. दोन्ही निवडून भर कसा बदलतो ते पाहा.",
    chooseGraha: "1 · ग्रह निवडा",
    chooseBhava: "2 · भाव निवडा",
    selectedReading: "3 · संश्लेषण वाचा",
    bhava: "भाव",
    methodNote: "या वाचनात काय मोजले—आणि काय नाही",
    inspectBhava: "हा भाव ठळक करा",
    traditionalLabel: "पारंपरिक प्रतीकात्मक अर्थ",
    integrityIntro:
      "येथे अचूकतेचे दोन वेगळे अर्थ आहेत: गणनेची अंतर्गत सुसंगती तपासता येते; ज्योतिषीय अर्थाला वैज्ञानिक भाकीत म्हणता येत नाही.",
    chartAudit: "वर्तमान कुंडलीची सुसंगती तपासणी",
    noChart:
      "संरचनात्मक तपासणीसाठी कुंडली तयार करा. खालील मर्यादा कुंडली असो वा नसो लागू आहेत.",
    consistent: "अंतर्गत सुसंगत",
    inconsistent: "पुनरावलोकन आवश्यक",
    checks: "संरचनात्मक तपासण्या",
    errors: "त्रुटी",
    warnings: "सूचना",
    whatWasChecked: "तपासणीत काय समाविष्ट आहे",
    checkedText:
      "राशी, नक्षत्र व पाद व्युत्पत्ती; पूर्ण-राशी भावक्रम; ग्रह-भाव सदस्यता; गतीचिन्हे; समर्थित ग्रहसंच; राहू–केतू विरोध; निर्देशांक व मॉडेल घोषणा.",
    whatItCannotProve: "पारदर्शक मर्यादा",
    finding: "संरचनात्मक विसंगती",
    technicalDiagnostics: "विकसक निदान",
    diagnosticItem: "अंतर्गत सुसंगती निष्कर्ष",
    fairness:
      "संतुलित वाचनाचे मानक: रचनात्मक व कठीण दोन्ही अभिव्यक्ती सांगा, वगळलेले घटक स्पष्ट करा, भीती निर्माण करू नका आणि प्रतीकात्मक मजकुराला वैद्यकीय, कायदेशीर, आर्थिक किंवा मानसशास्त्रीय निदान मानू नका.",
  },
  de: {
    eyebrow: "INTERAKTIVER JYOTISH-LEITFADEN",
    title: "Erst die Sprache lernen, dann die Kundali lesen",
    subtitle:
      "Erkunde die wenigen Grundbegriffe, die den größten Teil dieser App erklären. Jede Deutung wird als traditionelle symbolische Perspektive formuliert — nicht als wissenschaftliche Vorhersage oder festes Urteil.",
    terms: "Schlüsselbegriffe",
    grahas: "Grahas",
    explorer: "Graha × Bhava",
    integrity: "Methode & Grenzen",
    search: "Begriffe suchen",
    searchPlaceholder: "Zum Beispiel Lagna, Pada, Dasha …",
    resultCount: "Begriffe",
    noResults:
      "Kein passender Begriff gefunden. Versuche einen allgemeineren Suchbegriff.",
    howToRead: "So wird es gelesen",
    calculated: "Hier berechnet",
    partlyCalculated: "Teilweise berechnet",
    notCalculated: "Nicht berechnet",
    concept: "Konzept",
    statusIntro:
      "Das Kennzeichen zeigt, ob die App diesen Faktor tatsächlich berechnet. Ein Lerntext allein ist noch kein Ergebnis der Kundali.",
    grahaIntro:
      "Wähle einen Graha, um seinen traditionellen Bedeutungsrahmen zu erkunden. Ein Graha ist nicht einfach gut oder schlecht; sein Ausdruck verändert sich mit Kontext und menschlichen Entscheidungen.",
    astronomicalIdentity: "Astronomische Einordnung",
    signifies: "Symbolische Karakatvas",
    constructive: "Konstruktiver Ausdruck",
    caution: "Mögliches Ungleichgewicht",
    inquiry: "Reflexionsfrage",
    openInChart: "In der Kundali hervorheben",
    explorerIntro:
      "Dieser Explorer legt die Regel für alle 108 Kombinationen offen: Graha = Funktion, Bhava = Lebensfeld. Wähle beides, um zu sehen, wie sich der Schwerpunkt verändert.",
    chooseGraha: "1 · Graha wählen",
    chooseBhava: "2 · Bhava wählen",
    selectedReading: "3 · Synthese lesen",
    bhava: "Bhava",
    methodNote:
      "Was diese Deutung berechnet hat — und was nicht",
    inspectBhava: "Diesen Bhava hervorheben",
    traditionalLabel: "Traditionelle symbolische Deutung",
    integrityIntro:
      "Genauigkeit hat hier zwei verschiedene Bedeutungen: Die interne Konsistenz der Berechnung ist prüfbar; astrologische Deutungsansprüche dürfen nicht als wissenschaftlich vorhersagefähig dargestellt werden.",
    chartAudit: "Integritätsprüfung der aktuellen Kundali",
    noChart:
      "Erstelle eine Kundali, um strukturelle Prüfungen auszuführen. Die folgenden Grenzen gelten mit und ohne berechnete Kundali.",
    consistent: "Intern konsistent",
    inconsistent: "Überprüfung erforderlich",
    checks: "Strukturprüfungen",
    errors: "Fehler",
    warnings: "Warnungen",
    whatWasChecked: "Was die Prüfung kontrolliert",
    checkedText:
      "Ableitung von Rasi, Nakshatra und Pada; Ganzzeichen-Abfolge der Bhavas; Zuordnung von Grahas zu Bhavas; Bewegungskennzeichen; unterstützte Grahas; Opposition von Rahu und Ketu; Koordinaten- und Modelldeklarationen.",
    whatItCannotProve: "Transparente Grenzen",
    finding: "Strukturelle Inkonsistenz",
    technicalDiagnostics: "Technische Diagnostik",
    diagnosticItem: "Befund zur internen Konsistenz",
    fairness:
      "Standard für ausgewogene Deutungen: konstruktive und schwierige Ausdrucksformen benennen, fehlende Faktoren offenlegen, keine Angst erzeugen und symbolische Texte niemals als medizinische, rechtliche, finanzielle oder psychologische Diagnose behandeln.",
  },
} as const;

const STATUS_TONE: Record<CalculationStatus, string> = {
  calculated:
    "border-emerald-400/25 bg-emerald-400/10 text-[var(--foreground)]",
  "partly-calculated":
    "border-amber-400/25 bg-amber-400/10 text-[var(--foreground)]",
  "not-calculated":
    "border-rose-400/25 bg-rose-400/10 text-[var(--foreground)]",
  concept:
    "border-sky-400/25 bg-sky-400/10 text-[var(--foreground)]",
};

const SECTION_ICONS = {
  terms: BookOpenText,
  grahas: Orbit,
  explorer: Grid3X3,
  integrity: ShieldCheck,
} as const;

function statusLabel(
  status: CalculationStatus,
  copy: (typeof COPY)[AppLocale],
): string {
  return {
    calculated: copy.calculated,
    "partly-calculated": copy.partlyCalculated,
    "not-calculated": copy.notCalculated,
    concept: copy.concept,
  }[status];
}

function TermsSection({
  locale,
}: {
  locale: AppLocale;
}) {
  const copy = COPY[locale];
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<EducationTermId | null>("lagna");
  const filteredTerms = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return EDUCATION_TERMS;
    return EDUCATION_TERMS.filter((term) =>
      [
        readLocalized(term.name, locale),
        readLocalized(term.summary, locale),
        readLocalized(term.detail, locale),
        term.id,
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalized),
    );
  }, [locale, query]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <label
          className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]"
          htmlFor="jyotish-term-search"
        >
          {copy.search}
        </label>
        <div className="relative mt-2">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            id="jyotish-term-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
          />
        </div>
        <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
          <Calculator aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
          <p>
            {filteredTerms.length} {copy.resultCount} · {copy.statusIntro}
          </p>
        </div>
      </div>

      {filteredTerms.length ? (
        <div className="grid gap-3">
          {filteredTerms.map((term) => {
            const isOpen = term.id === openId;
            const panelId = `jyotish-term-${term.id}`;
            return (
              <article
                key={term.id}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenId(isOpen ? null : term.id)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left"
                >
                  <span>
                    <span className="block font-semibold text-[var(--foreground)]">
                      {readLocalized(term.name, locale)}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-[var(--muted)]">
                      {readLocalized(term.summary, locale)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span
                      className={`hidden rounded-full border px-2.5 py-1 text-[10px] font-semibold sm:inline ${STATUS_TONE[term.calculationStatus]}`}
                    >
                      {statusLabel(term.calculationStatus, copy)}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`size-4 text-[var(--muted)] transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                </button>
                {isOpen ? (
                  <div
                    id={panelId}
                    className="border-t border-[var(--border)] px-4 pb-5 pt-4"
                  >
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold sm:hidden ${STATUS_TONE[term.calculationStatus]}`}
                    >
                      {statusLabel(term.calculationStatus, copy)}
                    </span>
                    <p className="text-sm leading-7 text-[var(--foreground)]">
                      {readLocalized(term.detail, locale)}
                    </p>
                    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                        {copy.howToRead}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {readLocalized(term.readingSequence, locale)}
                      </p>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
          {copy.noResults}
        </p>
      )}
    </div>
  );
}

function GrahasSection({
  locale,
  onSelectPlanet,
}: Pick<JyotishGuideTabProps, "locale" | "onSelectPlanet">) {
  const copy = COPY[locale];
  const [selected, setSelected] = useState<GrahaId>("sun");
  const graha = GRAHA_EDUCATION[selected];

  return (
    <div>
      <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
        {copy.grahaIntro}
      </p>
      <div
        role="group"
        aria-label={copy.grahas}
        className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9"
      >
        {GRAHA_IDS.map((id) => (
          <button
            type="button"
            key={id}
            aria-pressed={selected === id}
            onClick={() => setSelected(id)}
            className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
              selected === id
                ? "border-[var(--accent)] bg-[var(--surface-muted)] text-[var(--foreground)]"
                : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {readLocalized(GRAHA_EDUCATION[id].name, locale)}
          </button>
        ))}
      </div>

      <article className="mt-5 rounded-3xl border border-[var(--border)] bg-[var(--surface-soft)] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {copy.traditionalLabel}
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              {readLocalized(graha.name, locale)}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {copy.astronomicalIdentity}:{" "}
              {readLocalized(graha.astronomicalKind, locale)}
            </p>
          </div>
          {onSelectPlanet ? (
            <button
              type="button"
              onClick={() => onSelectPlanet(selected)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-medium text-[var(--foreground)]"
            >
              {copy.openInChart}
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            [copy.signifies, readLocalized(graha.signifies, locale), Sparkles],
            [
              copy.constructive,
              readLocalized(graha.constructive, locale),
              CheckCircle2,
            ],
            [copy.caution, readLocalized(graha.caution, locale), CircleAlert],
          ].map(([label, value, Icon]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <Icon
                aria-hidden="true"
                className="size-4 text-[var(--accent)]"
              />
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {String(label)}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                {String(value)}
              </p>
            </div>
          ))}
        </div>
        <blockquote className="mt-4 border-l-2 border-[var(--accent)] pl-4 text-sm italic leading-6 text-[var(--muted)]">
          <strong className="not-italic text-[var(--foreground)]">
            {copy.inquiry}:{" "}
          </strong>
          {readLocalized(graha.inquiry, locale)}
        </blockquote>
      </article>
    </div>
  );
}

function ExplorerSection({
  locale,
  onSelectPlanet,
  onSelectHouse,
}: Pick<
  JyotishGuideTabProps,
  "locale" | "onSelectPlanet" | "onSelectHouse"
>) {
  const copy = COPY[locale];
  const [grahaId, setGrahaId] = useState<GrahaId>("sun");
  const [bhavaNumber, setBhavaNumber] = useState<HouseNumber>(1);
  const reading = buildGrahaInBhavaReading(
    grahaId,
    bhavaNumber,
    locale,
  );

  return (
    <div>
      <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
        {copy.explorerIntro}
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--foreground)]">
              {copy.chooseGraha}
            </legend>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {GRAHA_IDS.map((id) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={grahaId === id}
                  onClick={() => {
                    setGrahaId(id);
                    onSelectPlanet?.(id);
                  }}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-medium ${
                    grahaId === id
                      ? "border-[var(--accent)] bg-[var(--surface-muted)] text-[var(--foreground)]"
                      : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)]"
                  }`}
                >
                  {readLocalized(GRAHA_EDUCATION[id].name, locale)}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--foreground)]">
              {copy.chooseBhava}
            </legend>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, index) => {
                const number = (index + 1) as HouseNumber;
                return (
                  <button
                    type="button"
                    key={number}
                    aria-pressed={bhavaNumber === number}
                    aria-label={`${copy.bhava} ${number}: ${readLocalized(
                      BHAVA_EDUCATION[number].name,
                      locale,
                    )}`}
                    onClick={() => {
                      setBhavaNumber(number);
                      onSelectHouse?.(number);
                    }}
                    className={`aspect-square rounded-xl border text-sm font-semibold ${
                      bhavaNumber === number
                        ? "border-[var(--accent)] bg-[var(--surface-muted)] text-[var(--foreground)]"
                        : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)]"
                    }`}
                  >
                    {number}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <article
          aria-live="polite"
          className="rounded-3xl border border-[var(--border)] bg-[var(--surface-soft)] p-5 sm:p-6"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {copy.selectedReading}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            {reading.title}
          </h3>
          <p className="mt-4 text-sm leading-7 text-[var(--foreground)]">
            {reading.summary}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]">
                {copy.constructive}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                {reading.constructive}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]">
                {copy.caution}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                {reading.caution}
              </p>
            </div>
          </div>

          <blockquote className="mt-4 border-l-2 border-[var(--accent)] pl-4 text-sm italic leading-6 text-[var(--muted)]">
            {reading.inquiry}
          </blockquote>

          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              <Info aria-hidden="true" className="size-4 text-[var(--accent)]" />
              {copy.methodNote}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              {reading.methodNote}
            </p>
          </div>

          {onSelectHouse ? (
            <button
              type="button"
              onClick={() => onSelectHouse(bhavaNumber)}
              className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-medium text-[var(--foreground)]"
            >
              {copy.inspectBhava}
            </button>
          ) : null}
        </article>
      </div>
    </div>
  );
}

function IntegritySection({
  locale,
  chart,
}: Pick<JyotishGuideTabProps, "locale" | "chart">) {
  const copy = COPY[locale];
  const result = useMemo(() => (chart ? auditVedicChart(chart) : null), [chart]);

  return (
    <div>
      <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
        {copy.integrityIntro}
      </p>

      {result ? (
        <article className="mt-5 rounded-3xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                {copy.chartAudit}
              </p>
              <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
                {result.isStructurallyConsistent ? (
                  <CheckCircle2 aria-hidden="true" className="size-5" />
                ) : (
                  <CircleAlert aria-hidden="true" className="size-5" />
                )}
                {result.isStructurallyConsistent
                  ? copy.consistent
                  : copy.inconsistent}
              </p>
            </div>
            <p className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--muted)]">
              {result.checksPerformed} {copy.checks} · {result.errorCount}{" "}
              {copy.errors} · {result.warningCount} {copy.warnings}
            </p>
          </div>

          {result.findings.length ? (
            <details className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3">
              <summary className="text-xs font-semibold text-[var(--foreground)]">
                {copy.technicalDiagnostics}
              </summary>
              <div className="mt-3 space-y-2">
                {result.findings.map((finding, index) => (
                  <div key={`${finding.code}-${index}`}>
                    <p className="text-xs text-[var(--foreground)]">
                      {copy.diagnosticItem} {index + 1}
                    </p>
                    <code className="mt-1 block break-all text-[10px] text-[var(--muted)]">
                      {finding.code}
                      {finding.path ? ` · ${finding.path}` : ""}
                    </code>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </article>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted)]">
          {copy.noChart}
        </p>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            {copy.whatWasChecked}
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
            {copy.checkedText}
          </p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            {copy.whatItCannotProve}
          </p>
          <ul className="mt-3 space-y-3">
            {ANALYSIS_LIMITATIONS.map((limitation) => (
              <li
                key={limitation.id}
                className="flex gap-2 text-sm leading-6 text-[var(--muted)]"
              >
                <CircleAlert
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-amber-500"
                />
                <span>
                  {readLocalized(
                    LOCALIZED_ANALYSIS_LIMITATIONS[limitation.id],
                    locale,
                  )}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface-muted)] p-5">
        <p className="flex items-start gap-3 text-sm font-medium leading-6 text-[var(--foreground)]">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-[var(--accent)]"
          />
          {copy.fairness}
        </p>
      </div>
    </div>
  );
}

export default function JyotishGuideTab({
  locale,
  chart,
  initialSection = "terms",
  onSelectPlanet,
  onSelectHouse,
}: JyotishGuideTabProps) {
  const copy = COPY[locale];
  const [section, setSection] = useState<GuideSection>(initialSection);
  const sections: readonly { id: GuideSection; label: string }[] = [
    { id: "terms", label: copy.terms },
    { id: "grahas", label: copy.grahas },
    { id: "explorer", label: copy.explorer },
    { id: "integrity", label: copy.integrity },
  ];

  return (
    <section className="text-[var(--foreground)]">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {copy.eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--muted)]">
          {copy.subtitle}
        </p>
      </header>

      <div
        role="tablist"
        aria-label={copy.eyebrow}
        className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1.5 sm:grid-cols-4"
      >
        {sections.map((item) => {
          const Icon = SECTION_ICONS[item.id];
          return (
            <button
              type="button"
              role="tab"
              id={`guide-tab-${item.id}`}
              key={item.id}
              aria-selected={section === item.id}
              aria-controls={`guide-panel-${item.id}`}
              onClick={() => setSection(item.id)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${
                section === item.id
                  ? "bg-[var(--surface-muted)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon aria-hidden="true" className="size-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`guide-panel-${section}`}
        aria-labelledby={`guide-tab-${section}`}
        className="mt-6"
      >
        {section === "terms" ? <TermsSection locale={locale} /> : null}
        {section === "grahas" ? (
          <GrahasSection
            locale={locale}
            onSelectPlanet={onSelectPlanet}
          />
        ) : null}
        {section === "explorer" ? (
          <ExplorerSection
            locale={locale}
            onSelectPlanet={onSelectPlanet}
            onSelectHouse={onSelectHouse}
          />
        ) : null}
        {section === "integrity" ? (
          <IntegritySection locale={locale} chart={chart} />
        ) : null}
      </div>
    </section>
  );
}

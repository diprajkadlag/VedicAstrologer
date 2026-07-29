"use client";

import { useMemo } from "react";
import {
  BadgeCheck,
  BookOpenCheck,
  CircleAlert,
  ExternalLink,
  Microscope,
  Scale,
} from "lucide-react";

import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { auditVedicChart } from "@/lib/astro/analysisAudit";
import type { VedicChart } from "@/lib/astro/ephemeris";
import type { AppLocale } from "@/lib/i18n";

interface MethodologyCopy {
  tabTitle: string;
  eyebrow: string;
  intro: string;
  auditTitle: string;
  auditPass: string;
  auditFail: string;
  checks: string;
  errors: string;
  warnings: string;
  auditBoundary: string;
  technicalDiagnostics: string;
  diagnosticItem: string;
  calculatedTitle: string;
  calculated: readonly string[];
  interpretationTitle: string;
  interpretation: readonly string[];
  omittedTitle: string;
  omitted: string;
  criticalTitle: string;
  critical: readonly string[];
  sourcesTitle: string;
  astronomySource: string;
  siderealSource: string;
  evidenceSource: string;
}

const COPY: Readonly<Record<AppLocale, MethodologyCopy>> = {
  en: {
    tabTitle: "Method & limits",
    eyebrow: "Transparent methodology",
    intro:
      "This page separates reproducible astronomical calculations from traditional Jyotish interpretation. Passing the audit means the chart agrees with its own mathematical rules; it does not prove that astrology predicts personality or events.",
    auditTitle: "Chart consistency audit",
    auditPass: "Internal checks passed",
    auditFail: "Inconsistencies detected",
    checks: "checks",
    errors: "errors",
    warnings: "warnings",
    auditBoundary:
      "This is a structural software audit, not evidence of predictive validity. No independent Swiss Ephemeris or JPL comparison was run by this app or session; compare boundary-sensitive charts with a certified ephemeris.",
    technicalDiagnostics: "Developer diagnostics",
    diagnosticItem: "Internal consistency finding",
    calculatedTitle: "What the app calculates",
    calculated: [
      "Apparent geocentric Sun, Moon and planetary positions using Astronomy Engine; its upstream target is about ±1 arcminute.",
      "A custom Lahiri-style sidereal conversion using a J2000 anchor, IAU-1976 precession and truncated nutation. It is documented, but not Swiss Ephemeris-certified.",
      "A location-sensitive Lagna, whole-sign Bhavas, 27 Nakshatras and four Padas.",
      "Mean Rahu and Ketu, always opposite; true-node results can differ near boundaries.",
      "Vimshottari Mahadasha and Antardasha using a disclosed 365.25-day-year convention.",
    ],
    interpretationTitle: "What is traditional interpretation",
    interpretation: [
      "Personality, house, graha and Dasha text is rule-based symbolic synthesis—not a measured fact about the person.",
      "A placement can support more than one reading. The app should show constructive and difficult expressions instead of forcing one verdict.",
      "Transit scores are transparent editorial summaries, not probabilities, risk estimates or event forecasts. Dasha periods are timelines and are not scored.",
    ],
    omittedTitle: "Currently not calculated",
    omitted:
      "Shadbala, divisional/Varga charts such as Navamsha, classical Drishti, Yuti orbs, combustion, yogas, Ashtakavarga, rectification and event probabilities. Educational descriptions of these terms must not be mistaken for chart results.",
    criticalTitle: "Critical-reading commitments",
    critical: [
      "No guaranteed events, diagnoses, lifespan, fertility, compatibility, wealth or career claims.",
      "No flattering conclusion selected merely because it feels personally validating.",
      "Conflicting indicators, missing methods and boundary uncertainty must be stated.",
      "Birth-time uncertainty can materially change Lagna and Bhavas; rounded times deserve extra caution.",
      "Medical, legal, financial, safety and mental-health decisions require qualified evidence-based help.",
    ],
    sourcesTitle: "Calculation and evidence references",
    astronomySource: "Astronomy Engine validation and accuracy",
    siderealSource: "Swiss Ephemeris sidereal-method documentation",
    evidenceSource: "IAU educational statement on astronomy and astrology",
  },
  hi: {
    tabTitle: "विधि और सीमाएँ",
    eyebrow: "पारदर्शी कार्यविधि",
    intro:
      "यह पृष्ठ पुनरुत्पाद्य खगोलीय गणना को पारंपरिक ज्योतिषीय व्याख्या से अलग रखता है। जाँच सफल होने का अर्थ केवल यह है कि कुण्डली अपने गणितीय नियमों से मेल खाती है; इससे व्यक्तित्व या घटनाओं की ज्योतिषीय भविष्यवाणी सिद्ध नहीं होती।",
    auditTitle: "कुण्डली संगति जाँच",
    auditPass: "आंतरिक जाँच सफल",
    auditFail: "असंगतियाँ मिलीं",
    checks: "जाँच",
    errors: "त्रुटियाँ",
    warnings: "चेतावनियाँ",
    auditBoundary:
      "यह संरचनात्मक सॉफ्टवेयर जाँच है, भविष्यवाणी की वैज्ञानिक वैधता का प्रमाण नहीं। इस ऐप या सत्र ने Swiss Ephemeris अथवा JPL से स्वतंत्र तुलना नहीं की है; सीमा के पास वाली कुण्डली को प्रमाणित पंचांग से मिलाएँ।",
    technicalDiagnostics: "डेवलपर निदान",
    diagnosticItem: "आंतरिक संगति निष्कर्ष",
    calculatedTitle: "ऐप क्या गणना करता है",
    calculated: [
      "Astronomy Engine से सूर्य, चन्द्र और ग्रहों की आभासी भूकेन्द्रीय स्थिति; मूल इंजन का लक्ष्य लगभग ±1 चाप-मिनट है।",
      "J2000 आधार, IAU-1976 प्रीसेशन और संक्षिप्त न्यूटेशन वाला कस्टम लाहिरी-शैली निरयन रूपान्तरण। यह प्रलेखित है, पर Swiss Ephemeris द्वारा प्रमाणित नहीं।",
      "स्थान-संवेदी लग्न, पूर्ण-राशि भाव, 27 नक्षत्र और चार पाद।",
      "माध्य राहु-केतु, जो सदैव विपरीत हैं; सीमा के पास वास्तविक पात का परिणाम बदल सकता है।",
      "स्पष्ट 365.25-दिन-वर्ष परंपरा से विंशोत्तरी महादशा और अन्तर्दशा।",
    ],
    interpretationTitle: "क्या पारंपरिक व्याख्या है",
    interpretation: [
      "व्यक्तित्व, भाव, ग्रह और दशा का पाठ नियम-आधारित प्रतीकात्मक संश्लेषण है—व्यक्ति के बारे में मापा हुआ तथ्य नहीं।",
      "एक स्थिति के एक से अधिक अर्थ हो सकते हैं; ऐप को केवल एक निर्णय थोपने के बजाय रचनात्मक और कठिन दोनों रूप दिखाने चाहिए।",
      "गोचर अंक पारदर्शी संपादकीय सार हैं, संभावना, जोखिम-अनुमान या घटना-पूर्वानुमान नहीं। दशा केवल कालरेखा है; उसे अंक नहीं दिए जाते।",
    ],
    omittedTitle: "अभी जिनकी गणना नहीं होती",
    omitted:
      "षड्बल, नवांश जैसे वर्ग, शास्त्रीय दृष्टि, युति-अंश, अस्तता, योग, अष्टकवर्ग, जन्म-समय संशोधन और घटना-प्रायिकता। इन शब्दों की शैक्षिक व्याख्या को आपकी कुण्डली का परिणाम न समझें।",
    criticalTitle: "आलोचनात्मक पठन के नियम",
    critical: [
      "घटना, रोग-निदान, आयु, प्रजनन, अनुकूलता, धन या करियर की निश्चित घोषणा नहीं।",
      "केवल अच्छा लगने के कारण प्रशंसात्मक निष्कर्ष नहीं चुना जाएगा।",
      "विरोधी संकेत, अनुपलब्ध विधियाँ और सीमा-अनिश्चितता स्पष्ट कही जाएगी।",
      "अनिश्चित जन्म-समय लग्न और भाव बदल सकता है; गोल समय को अधिक सावधानी से पढ़ें।",
      "चिकित्सा, कानून, धन, सुरक्षा और मानसिक स्वास्थ्य के निर्णयों के लिए योग्य प्रमाण-आधारित सहायता लें।",
    ],
    sourcesTitle: "गणना और प्रमाण संदर्भ",
    astronomySource: "Astronomy Engine की जाँच और शुद्धता",
    siderealSource: "Swiss Ephemeris की निरयन-विधि",
    evidenceSource: "खगोल और ज्योतिष पर IAU शैक्षिक वक्तव्य",
  },
  mr: {
    tabTitle: "पद्धत व मर्यादा",
    eyebrow: "पारदर्शक कार्यपद्धती",
    intro:
      "हे पान पुनरुत्पादक खगोलीय गणना आणि पारंपरिक ज्योतिषीय अर्थनिर्णय वेगळे दाखवते. तपासणी उत्तीर्ण होणे म्हणजे कुंडली स्वतःच्या गणिती नियमांशी सुसंगत आहे; त्यामुळे ज्योतिष व्यक्तिमत्त्व किंवा घटना भाकीत करते हे सिद्ध होत नाही.",
    auditTitle: "कुंडली सुसंगती तपासणी",
    auditPass: "अंतर्गत तपासण्या उत्तीर्ण",
    auditFail: "विसंगती आढळली",
    checks: "तपासण्या",
    errors: "त्रुटी",
    warnings: "इशारे",
    auditBoundary:
      "ही संरचनात्मक सॉफ्टवेअर तपासणी आहे; भविष्यकथनाच्या वैज्ञानिक वैधतेचा पुरावा नाही. या ॲपने किंवा सत्राने Swiss Ephemeris अथवा JPL शी स्वतंत्र तुलना केलेली नाही; सीमेजवळील कुंडली प्रमाणित पंचांगाशी पडताळा.",
    technicalDiagnostics: "विकसक निदान",
    diagnosticItem: "अंतर्गत सुसंगती निष्कर्ष",
    calculatedTitle: "ॲप काय मोजते",
    calculated: [
      "Astronomy Engine वापरून सूर्य, चंद्र व ग्रहांची आभासी भूकेंद्री स्थिती; मूळ इंजिनचे लक्ष्य सुमारे ±1 चाप-मिनिट आहे.",
      "J2000 आधार, IAU-1976 प्रीसेशन व संक्षिप्त न्यूटेशन असलेले कस्टम लाहिरी-शैली निरयन रूपांतरण. ते नोंदवलेले आहे, पण Swiss Ephemeris-प्रमाणित नाही.",
      "स्थान-संवेदनशील लग्न, पूर्ण-राशी भाव, 27 नक्षत्रे आणि चार पाद.",
      "मध्यम राहू-केतू, नेहमी परस्परविरुद्ध; सीमेजवळ खऱ्या पाताचे परिणाम वेगळे असू शकतात.",
      "स्पष्ट 365.25-दिवस-वर्ष पद्धतीने विंशोत्तरी महादशा आणि अंतर्दशा.",
    ],
    interpretationTitle: "काय पारंपरिक अर्थनिर्णय आहे",
    interpretation: [
      "व्यक्तिमत्त्व, भाव, ग्रह व दशा मजकूर हा नियमाधारित प्रतीकात्मक संयोग आहे—व्यक्तीबद्दल मोजलेले तथ्य नाही.",
      "एका स्थितीचे एकापेक्षा अधिक अर्थ असू शकतात; एकच निकाल लादण्याऐवजी रचनात्मक आणि कठीण दोन्ही रूपे दाखवली पाहिजेत.",
      "गोचर गुण हे पारदर्शक संपादकीय सार आहेत; संभाव्यता, जोखीम-मापन किंवा घटना-भाकीत नाहीत. दशा ही कालरेषा आहे; तिला गुण दिले जात नाहीत.",
    ],
    omittedTitle: "सध्या न मोजलेले घटक",
    omitted:
      "षड्बल, नवांशासारखे वर्ग, शास्त्रीय दृष्टी, युतीचे अंश, अस्तंगतता, योग, अष्टकवर्ग, जन्मवेळ शुद्धीकरण आणि घटना-संभाव्यता. या संज्ञांची शैक्षणिक माहिती तुमच्या कुंडलीचा निकाल समजू नये.",
    criticalTitle: "चिकित्सक वाचनाचे नियम",
    critical: [
      "घटना, निदान, आयुष्य, प्रजनन, जुळवणी, संपत्ती किंवा करिअरची निश्चित घोषणा नाही.",
      "फक्त आनंददायी वाटते म्हणून स्तुतीपर निष्कर्ष निवडला जाणार नाही.",
      "विरोधी संकेत, उपलब्ध नसलेल्या पद्धती आणि सीमा-अनिश्चितता स्पष्ट सांगितली जाईल.",
      "अनिश्चित जन्मवेळ लग्न व भाव बदलू शकते; गोल केलेली वेळ अधिक सावधपणे वाचा.",
      "वैद्यकीय, कायदेशीर, आर्थिक, सुरक्षितता व मानसिक आरोग्य निर्णयांसाठी पात्र पुरावाधारित मदत घ्या.",
    ],
    sourcesTitle: "गणना व पुरावा संदर्भ",
    astronomySource: "Astronomy Engine पडताळणी व अचूकता",
    siderealSource: "Swiss Ephemeris निरयन-पद्धत दस्तऐवज",
    evidenceSource: "खगोलशास्त्र व ज्योतिषावरील IAU शैक्षणिक विधान",
  },
  de: {
    tabTitle: "Methode & Grenzen",
    eyebrow: "Transparente Methodik",
    intro:
      "Diese Seite trennt reproduzierbare astronomische Berechnungen von traditioneller Jyotish-Deutung. Ein bestandener Audit bedeutet, dass die Kundali ihren eigenen mathematischen Regeln entspricht; er beweist nicht, dass Astrologie Persönlichkeit oder Ereignisse vorhersagen kann.",
    auditTitle: "Konsistenzprüfung der Kundali",
    auditPass: "Interne Prüfungen bestanden",
    auditFail: "Inkonsistenzen erkannt",
    checks: "Prüfungen",
    errors: "Fehler",
    warnings: "Warnungen",
    auditBoundary:
      "Dies ist ein struktureller Software-Audit, kein Beleg für Vorhersagekraft. Weder diese App noch diese Sitzung hat einen unabhängigen Vergleich mit Swiss Ephemeris oder JPL durchgeführt. Prüfen Sie grenznahe Kundalis mit einer zertifizierten Ephemeride.",
    technicalDiagnostics: "Entwicklerdiagnose",
    diagnosticItem: "Befund der internen Konsistenzprüfung",
    calculatedTitle: "Was die App berechnet",
    calculated: [
      "Scheinbare geozentrische Positionen von Surya, Chandra und den Grahas mit Astronomy Engine; deren angegebenes Genauigkeitsziel liegt bei ungefähr ±1 Bogenminute.",
      "Eine eigene Lahiri-nahe siderische Umrechnung mit J2000-Anker, IAU-1976-Präzession und verkürzter Nutation. Sie ist dokumentiert, aber nicht durch Swiss Ephemeris zertifiziert.",
      "Ein ortsabhängiges Lagna, Ganzzeichen-Bhavas, 27 Nakshatras und vier Padas.",
      "Mittlere Positionen von Rahu und Ketu, stets einander gegenüber; nahe einer Grenze können Ergebnisse mit wahren Mondknoten abweichen.",
      "Vimshottari-Mahadasha und -Antardasha nach der offengelegten Konvention eines Jahres mit 365,25 Tagen.",
    ],
    interpretationTitle: "Was traditionelle Deutung ist",
    interpretation: [
      "Texte zu Persönlichkeit, Bhava, Graha und Dasha sind regelbasierte symbolische Synthesen—keine gemessenen Tatsachen über eine Person.",
      "Eine Platzierung kann mehrere Lesarten unterstützen. Die App soll konstruktive und schwierige Ausdrucksformen zeigen, statt ein einziges Urteil zu erzwingen.",
      "Gochara-Werte sind transparente redaktionelle Zusammenfassungen, keine Wahrscheinlichkeiten, Risikoschätzungen oder Ereignisprognosen. Dasha-Zeiträume werden nicht bewertet.",
    ],
    omittedTitle: "Derzeit nicht berechnet",
    omitted:
      "Shadbala, Varga-Kundalis wie Navamsha, klassische Drishti, Yuti-Orben, Verbrennung, Yogas, Ashtakavarga, Geburtszeitkorrektur und Ereigniswahrscheinlichkeiten. Lehrtexte zu diesen Begriffen dürfen nicht mit Ergebnissen Ihrer Kundali verwechselt werden.",
    criticalTitle: "Grundsätze für kritisches Lesen",
    critical: [
      "Keine garantierten Aussagen zu Ereignissen, Diagnosen, Lebensdauer, Fruchtbarkeit, Partnerschaft, Vermögen oder Karriere.",
      "Kein schmeichelhaftes Ergebnis wird nur deshalb gewählt, weil es sich bestätigend anfühlt.",
      "Widersprüchliche Hinweise, fehlende Methoden und Unsicherheit an Grenzen werden ausdrücklich benannt.",
      "Eine unsichere Geburtszeit kann Lagna und Bhavas wesentlich verändern; gerundete Zeiten erfordern besondere Vorsicht.",
      "Medizinische, rechtliche, finanzielle, sicherheitsbezogene und psychische Entscheidungen benötigen qualifizierte, evidenzbasierte Beratung.",
    ],
    sourcesTitle: "Quellen zu Berechnung und Evidenz",
    astronomySource: "Validierung und Genauigkeit von Astronomy Engine",
    siderealSource: "Dokumentation der siderischen Methoden von Swiss Ephemeris",
    evidenceSource: "IAU-Bildungserklärung zu Astronomie und Astrologie",
  },
};

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-6 text-[var(--muted)]">
          <span
            aria-hidden="true"
            className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[var(--accent)]"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function MethodologyTab({ chart }: { chart: VedicChart }) {
  const { locale } = useAppPreferences();
  const copy = COPY[locale];
  const audit = useMemo(() => auditVedicChart(chart), [chart]);

  return (
    <section aria-labelledby="methodology-title" className="space-y-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {copy.eyebrow}
        </p>
        <h2
          id="methodology-title"
          className="mt-2 text-2xl font-semibold text-[var(--foreground)]"
        >
          {copy.tabTitle}
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--muted)]">
          {copy.intro}
        </p>
      </header>

      <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3">
            {audit.isStructurallyConsistent ? (
              <BadgeCheck aria-hidden="true" className="mt-0.5 size-5 text-emerald-500" />
            ) : (
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 text-rose-500" />
            )}
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">{copy.auditTitle}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {audit.isStructurallyConsistent ? copy.auditPass : copy.auditFail}
              </p>
            </div>
          </div>
          <p className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)]">
            {audit.checksPerformed} {copy.checks} · {audit.errorCount} {copy.errors} ·{" "}
            {audit.warningCount} {copy.warnings}
          </p>
        </div>
        {!audit.isStructurallyConsistent ? (
          <details className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs text-[var(--muted)]">
            <summary className="font-semibold text-[var(--foreground)]">
              {copy.technicalDiagnostics}
            </summary>
            <ul className="mt-3 space-y-2">
              {audit.findings.map((finding, index) => (
                <li key={`${finding.code}-${finding.path ?? ""}`}>
                  <span>{copy.diagnosticItem} {index + 1}</span>
                  <code className="mt-1 block break-all text-[10px]">
                    {finding.code}
                    {finding.path ? ` · ${finding.path}` : ""}
                  </code>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        <p className="mt-4 border-t border-[var(--border)] pt-3 text-xs leading-5 text-[var(--muted)]">
          {copy.auditBoundary}
        </p>
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Microscope aria-hidden="true" className="size-4" />
            <h3 className="font-semibold">{copy.calculatedTitle}</h3>
          </div>
          <BulletList items={copy.calculated} />
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <BookOpenCheck aria-hidden="true" className="size-4" />
            <h3 className="font-semibold">{copy.interpretationTitle}</h3>
          </div>
          <BulletList items={copy.interpretation} />
        </article>
      </div>

      <article className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.055] p-5">
        <h3 className="font-semibold text-[var(--foreground)]">{copy.omittedTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy.omitted}</p>
      </article>

      <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
        <div className="flex items-center gap-2 text-[var(--accent)]">
          <Scale aria-hidden="true" className="size-4" />
          <h3 className="font-semibold">{copy.criticalTitle}</h3>
        </div>
        <BulletList items={copy.critical} />
      </article>

      <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
        <h3 className="font-semibold text-[var(--foreground)]">{copy.sourcesTitle}</h3>
        <div className="mt-3 flex flex-col items-start gap-2 text-sm">
          {[
            ["https://github.com/cosinekitty/astronomy", copy.astronomySource],
            ["https://www.astro.com/ftp/swisseph/doc/swephprg.2.10.pdf", copy.siderealSource],
            ["https://www.iau.org/static/archives/announcements/pdf/ann19029a.pdf", copy.evidenceSource],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[var(--accent)] underline-offset-4 hover:underline"
            >
              {label}
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          ))}
        </div>
      </article>
    </section>
  );
}

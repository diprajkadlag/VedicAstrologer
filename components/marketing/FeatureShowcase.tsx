"use client";

import {
  Box,
  BrainCircuit,
  ChartNoAxesCombined,
  Download,
  Languages,
  LockKeyhole,
  Orbit,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { type KeyboardEvent, type MouseEvent, useId, useState } from "react";

import { useScopedTranslations } from "@/components/providers/AppPreferencesProvider";
import { defineMessages } from "@/lib/i18n";

const messages = defineMessages({
  en: {
    eyebrow: "One form · one connected chart",
    title: "See your birth sky—and understand every house.",
    body: "Enter your birth details once. Explore the calculated Lahiri-sidereal sky in 3D, compare two traditional chart layouts, read twelve personalized house summaries, and switch the entire experience to your language.",
    noAccount: "No sign-up",
    languages: "4 languages",
    interactive: "Interactive 3D",
    localPdf: "Private PDF",
    privacy: "Chart calculations stay in your browser. Place search sends only the city query to OpenStreetMap.",
    boundary: "Vedic astrology text is a traditional symbolic framework, not a scientific prediction.",
    start: "Create my birth chart",
    cosmos: "3D cosmos",
    cosmosTitle: "Orbit the sidereal sky",
    cosmosBody: "Rotate, zoom, follow trajectories, and select a planetary body to inspect its exact zodiac sign, lunar mansion, quarter, and house.",
    cosmosAlt: "Illustration of Earth inside a geocentric sidereal celestial sphere",
    charts: "Zodiac charts",
    chartsTitle: "Two traditions, one chart",
    chartsBody: "Switch between North and South Indian layouts while every placement and selected house stays synchronized.",
    chartsAlt: "Illustration of North and South Indian zodiac-chart layouts",
    analysis: "12-house summary",
    analysisTitle: "Read every house without hunting for context",
    analysisBody: "Each house gets a concise personalized explanation: what it traditionally signifies, what the calculated sign, ruler, and resident planets add, and where to stay balanced.",
    analysisAlt: "Premium report preview with twelve color-coded house-summary cards",
    timing: "Periods & transits",
    timingTitle: "Explore symbolic timing without certainty claims",
    timingBody: "Review Vimshottari periods and current transit themes with the assumptions and limitations kept visible.",
    timingAlt: "Illustration of period and transit timing cards and timeline",
    pdf: "Birth-chart PDF",
    pdfTitle: "Take a clear summary with you",
    pdfBody: "Choose English, Hindi, Marathi, or German and download the same twelve-house summary as a private, client-generated report.",
    pdfAlt: "Premium multilingual report preview with twelve readable house summaries",
  },
  hi: {
    eyebrow: "एक फॉर्म · एक जुड़ी हुई कुंडली",
    title: "अपना जन्म-आकाश देखें—और हर घर को समझें।",
    body: "जन्म विवरण केवल एक बार भरें। गणना किए गए लाहिरी निरयन आकाश को 3D में देखें, दो पारंपरिक कुंडली शैलियों की तुलना करें, बारह व्यक्तिगत घर-सार पढ़ें और पूरे अनुभव की भाषा बदलें।",
    noAccount: "साइन-अप नहीं",
    languages: "4 भाषाएँ",
    interactive: "संवादात्मक 3D",
    localPdf: "निजी PDF",
    privacy: "कुंडली की गणना आपके ब्राउज़र में रहती है। स्थान-खोज OpenStreetMap को केवल शहर की खोज भेजती है।",
    boundary: "ज्योतिष पाठ पारंपरिक प्रतीकात्मक ढाँचा है, वैज्ञानिक भविष्यवाणी नहीं।",
    start: "मेरी कुंडली बनाएँ",
    cosmos: "3D ब्रह्मांड",
    cosmosTitle: "निरयन आकाश में भ्रमण करें",
    cosmosBody: "घुमाएँ, ज़ूम करें, पथ देखें और किसी ग्रह को चुनकर उसकी राशि, नक्षत्र, पाद और भाव की सटीक स्थिति जानें।",
    cosmosAlt: "भूकेंद्रीय निरयन खगोलीय गोले के भीतर पृथ्वी का चित्रण",
    charts: "राशि कुंडलियाँ",
    chartsTitle: "दो परंपराएँ, एक कुंडली",
    chartsBody: "उत्तर और दक्षिण भारतीय विन्यास बदलें; हर ग्रह-स्थिति और चुना हुआ भाव साथ-साथ अद्यतन रहता है।",
    chartsAlt: "उत्तर और दक्षिण भारतीय राशि-कुंडली विन्यास का चित्रण",
    analysis: "12 घरों का सार",
    analysisTitle: "हर घर को संदर्भ सहित आसानी से पढ़ें",
    analysisBody: "हर घर के लिए संक्षिप्त व्यक्तिगत व्याख्या मिलती है—उसका पारंपरिक अर्थ, गणना की गई राशि, भावेश और स्थित ग्रह क्या जोड़ते हैं, तथा कहाँ संतुलन रखना चाहिए।",
    analysisAlt: "बारह रंगीन घर-सार कार्डों वाला प्रीमियम रिपोर्ट पूर्वावलोकन",
    timing: "दशा और गोचर",
    timingTitle: "निश्चितता के दावे बिना प्रतीकात्मक समय देखें",
    timingBody: "विंशोत्तरी अवधियाँ और वर्तमान गोचर-विषय देखें; मान्यताएँ और सीमाएँ हमेशा सामने रहती हैं।",
    timingAlt: "दशा और गोचर कार्ड तथा समयरेखा का चित्रण",
    pdf: "कुंडली PDF",
    pdfTitle: "स्पष्ट सार अपने साथ रखें",
    pdfBody: "अंग्रेज़ी, हिन्दी, मराठी या जर्मन चुनें और यही बारह-घर सार निजी, ब्राउज़र में बनी रिपोर्ट के रूप में डाउनलोड करें।",
    pdfAlt: "बारह पठनीय घर-सारों वाली प्रीमियम बहुभाषी रिपोर्ट",
  },
  mr: {
    eyebrow: "एक फॉर्म · एक जोडलेली कुंडली",
    title: "तुमचे जन्म-आकाश पाहा—आणि प्रत्येक घर समजा.",
    body: "जन्ममाहिती फक्त एकदाच भरा. गणना केलेले लाहिरी निरयन आकाश 3D मध्ये पाहा, दोन पारंपरिक कुंडली मांडण्यांची तुलना करा, बारा वैयक्तिक घर-सारांश वाचा आणि संपूर्ण अनुभवाची भाषा बदला.",
    noAccount: "साइन-अप नाही",
    languages: "4 भाषा",
    interactive: "परस्परसंवादी 3D",
    localPdf: "खासगी PDF",
    privacy: "कुंडलीची गणना तुमच्या ब्राउझरमध्येच राहते. स्थळ-शोध OpenStreetMap कडे फक्त शहराची शोध-विनंती पाठवतो.",
    boundary: "ज्योतिष मजकूर हा पारंपरिक प्रतीकात्मक आराखडा आहे; वैज्ञानिक भविष्यवाणी नाही.",
    start: "माझी कुंडली तयार करा",
    cosmos: "3D ब्रह्मांड",
    cosmosTitle: "निरयन आकाशात भ्रमण करा",
    cosmosBody: "फिरवा, झूम करा, मार्ग पाहा आणि ग्रह निवडून त्याची अचूक राशी, नक्षत्र, पाद व भाव तपासा.",
    cosmosAlt: "भूकेंद्री निरयन खगोलीय गोलात पृथ्वीचे चित्रण",
    charts: "राशी कुंडल्या",
    chartsTitle: "दोन परंपरा, एक कुंडली",
    chartsBody: "उत्तर व दक्षिण भारतीय मांडणी बदला; प्रत्येक ग्रहस्थिती आणि निवडलेला भाव समक्रमित राहतो.",
    chartsAlt: "उत्तर व दक्षिण भारतीय राशी-कुंडली मांडणीचे चित्रण",
    analysis: "12 घरांचा सारांश",
    analysisTitle: "प्रत्येक घराचा संदर्भ सहज वाचा",
    analysisBody: "प्रत्येक घरासाठी संक्षिप्त वैयक्तिक स्पष्टीकरण मिळते—त्याचा पारंपरिक अर्थ, गणिती राशी, भावेश व स्थित ग्रह काय जोडतात आणि कुठे संतुलन ठेवावे.",
    analysisAlt: "बारा रंगीत घर-सारांश कार्डांसह प्रीमियम अहवाल पूर्वदृश्य",
    timing: "दशा व गोचर",
    timingTitle: "निश्चिततेचा दावा न करता प्रतीकात्मक काळ पाहा",
    timingBody: "विंशोत्तरी कालखंड व सध्याचे गोचर-विषय पाहा; गृहीतके आणि मर्यादा कायम दिसतात.",
    timingAlt: "दशा व गोचर कार्डे आणि कालरेषेचे चित्रण",
    pdf: "कुंडली PDF",
    pdfTitle: "स्पष्ट सारांश सोबत ठेवा",
    pdfBody: "इंग्रजी, हिन्दी, मराठी किंवा जर्मन निवडा आणि हाच बारा-घर सारांश ब्राउझरमध्ये तयार झालेल्या खासगी अहवालात डाउनलोड करा.",
    pdfAlt: "बारा वाचनीय घर-सारांशांसह प्रीमियम बहुभाषिक अहवाल",
  },
  de: {
    eyebrow: "Ein Formular · ein verbundenes Horoskop",
    title: "Sieh deinen Geburtshimmel—und verstehe jedes Haus.",
    body: "Gib deine Geburtsdaten einmal ein. Erkunde den berechneten siderischen Lahiri-Himmel in 3D, vergleiche zwei traditionelle Darstellungen, lies zwölf persönliche Hauszusammenfassungen und wechsle die Sprache der gesamten App.",
    noAccount: "Ohne Anmeldung",
    languages: "4 Sprachen",
    interactive: "Interaktives 3D",
    localPdf: "Privates PDF",
    privacy: "Die Horoskopberechnung bleibt in deinem Browser. Die Ortssuche sendet nur die Stadtanfrage an OpenStreetMap.",
    boundary: "Texte der vedischen Astrologie sind ein traditioneller symbolischer Deutungsrahmen, keine wissenschaftliche Vorhersage.",
    start: "Mein Geburtshoroskop erstellen",
    cosmos: "3D-Kosmos",
    cosmosTitle: "Bewege dich durch den siderischen Himmel",
    cosmosBody: "Drehe und zoome die Ansicht, verfolge Bahnen und wähle einen Himmelskörper, um Tierkreiszeichen, Mondstation, Viertel und Haus genau zu prüfen.",
    cosmosAlt: "Illustration der Erde in einer geozentrischen siderischen Himmelssphäre",
    charts: "Tierkreisdiagramme",
    chartsTitle: "Zwei Traditionen, ein Geburtshoroskop",
    chartsBody: "Wechsle zwischen nord- und südindischer Darstellung; alle Positionen und das gewählte Haus bleiben synchron.",
    chartsAlt: "Illustration nord- und südindischer Tierkreisdiagramme",
    analysis: "Zusammenfassung aller 12 Häuser",
    analysisTitle: "Verstehe jedes Haus direkt im Zusammenhang",
    analysisBody: "Jedes Haus erhält eine kurze persönliche Einordnung: seine traditionelle Bedeutung, der Beitrag von berechnetem Zeichen, Herrscher und enthaltenen Planeten sowie ein ausgewogener Hinweis.",
    analysisAlt: "Hochwertige Berichtsvorschau mit zwölf farblich gegliederten Hauszusammenfassungen",
    timing: "Perioden & Transite",
    timingTitle: "Symbolische Zeitmodelle ohne Gewissheitsversprechen",
    timingBody: "Betrachte Vimshottari-Perioden und aktuelle Transitthemen; Annahmen und Grenzen bleiben stets sichtbar.",
    timingAlt: "Illustration von Perioden- und Transitkarten mit Zeitachse",
    pdf: "Geburtshoroskop-PDF",
    pdfTitle: "Nimm eine klare Zusammenfassung mit",
    pdfBody: "Wähle Englisch, Hindi, Marathi oder Deutsch und lade dieselbe Zusammenfassung aller zwölf Häuser als privaten, im Browser erzeugten Bericht herunter.",
    pdfAlt: "Hochwertige mehrsprachige Berichtsvorschau mit zwölf gut lesbaren Hauszusammenfassungen",
  },
});

const FEATURE_IDS = ["cosmos", "charts", "analysis", "timing", "pdf"] as const;
type FeatureId = (typeof FEATURE_IDS)[number];

const icons = {
  cosmos: Orbit,
  charts: ChartNoAxesCombined,
  analysis: BrainCircuit,
  timing: Sparkles,
  pdf: Download,
} as const;

export default function FeatureShowcase() {
  const t = useScopedTranslations(messages);
  const [selected, setSelected] = useState<FeatureId>("cosmos");
  const tabsId = useId();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const active = {
    cosmos: {
      label: t("cosmos"),
      title: t("cosmosTitle"),
      body: t("cosmosBody"),
      alt: t("cosmosAlt"),
      image: "cosmos-premium.webp",
    },
    charts: {
      label: t("charts"),
      title: t("chartsTitle"),
      body: t("chartsBody"),
      alt: t("chartsAlt"),
      image: "charts-premium.webp",
    },
    analysis: {
      label: t("analysis"),
      title: t("analysisTitle"),
      body: t("analysisBody"),
      alt: t("analysisAlt"),
      image: "report-premium.webp",
    },
    timing: {
      label: t("timing"),
      title: t("timingTitle"),
      body: t("timingBody"),
      alt: t("timingAlt"),
      image: "timing.svg",
    },
    pdf: {
      label: t("pdf"),
      title: t("pdfTitle"),
      body: t("pdfBody"),
      alt: t("pdfAlt"),
      image: "report-premium.webp",
    },
  } satisfies Record<
    FeatureId,
    { label: string; title: string; body: string; alt: string; image: string }
  >;

  /** Keep the tapped tab centred in the strip on phones; scrolls only the strip. */
  function centerTab(event: MouseEvent<HTMLButtonElement>) {
    const button = event.currentTarget;
    const strip = button.parentElement;
    if (!strip || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({
      left: button.offsetLeft - (strip.clientWidth - button.offsetWidth) / 2,
      behavior: "smooth",
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? FEATURE_IDS.length - 1
          : event.key === "ArrowRight"
            ? (index + 1) % FEATURE_IDS.length
            : (index - 1 + FEATURE_IDS.length) % FEATURE_IDS.length;
    const next = FEATURE_IDS[nextIndex];
    setSelected(next);
    document.getElementById(`${tabsId}-${next}`)?.focus();
  }

  const current = active[selected];

  return (
    <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-xl shadow-violet-950/5">
      <div className="p-5 sm:p-7">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
          <Box aria-hidden="true" className="size-4" />
          {t("eyebrow")}
        </p>
        <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          {t("body")}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            [LockKeyhole, t("noAccount")],
            [Languages, t("languages")],
            [Orbit, t("interactive")],
            [Download, t("localPdf")],
          ].map(([Icon, label]) => (
            <span
              key={String(label)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--muted)]"
            >
              <Icon aria-hidden="true" className="size-3.5 text-[var(--accent)]" />
              {String(label)}
            </span>
          ))}
        </div>
      </div>

      <div className="border-y border-[var(--border)] bg-[var(--surface-soft)] p-2">
        <div
          role="tablist"
          aria-label={t("eyebrow")}
          className="scroll-x-fade flex gap-1 overflow-x-auto"
        >
          {FEATURE_IDS.map((id, index) => {
            const Icon = icons[id];
            return (
              <button
                key={id}
                id={`${tabsId}-${id}`}
                type="button"
                role="tab"
                aria-selected={selected === id}
                aria-controls={`${tabsId}-panel`}
                tabIndex={selected === id ? 0 : -1}
                onClick={(event) => {
                  setSelected(id);
                  centerTab(event);
                }}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  selected === id
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon aria-hidden="true" className="size-3.5" />
                {active[id].label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id={`${tabsId}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabsId}-${selected}`}
        className="grid gap-0 lg:grid-cols-[1.18fr_0.82fr]"
      >
        <div className="bg-[#080a17] p-3">
          <Image
            key={current.image}
            src={`${basePath}/features/${current.image}`}
            alt={current.alt}
            width={800}
            height={520}
            sizes="(min-width: 1280px) 40vw, (min-width: 1024px) 55vw, 100vw"
            className="aspect-[20/13] h-full w-full rounded-2xl object-cover"
          />
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {current.label}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            {current.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {current.body}
          </p>
          <button
            type="button"
            onClick={() => {
              document.getElementById("birth-data")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
              window.requestAnimationFrame(() => {
                document.getElementById("full-name")?.focus();
              });
            }}
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/15 transition hover:bg-violet-600"
          >
            <Sparkles aria-hidden="true" className="size-4" />
            {t("start")}
          </button>
        </div>
      </div>

      <div className="grid gap-2 border-t border-[var(--border)] p-4 text-[10px] leading-5 text-[var(--muted)] sm:grid-cols-2 sm:px-6">
        <p>{t("privacy")}</p>
        <p className="sm:text-right">{t("boundary")}</p>
      </div>
    </section>
  );
}

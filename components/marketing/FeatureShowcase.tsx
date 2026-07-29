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
import { type KeyboardEvent, useId, useState } from "react";

import { useScopedTranslations } from "@/components/providers/AppPreferencesProvider";
import { defineMessages } from "@/lib/i18n";

const messages = defineMessages({
  en: {
    eyebrow: "Everything stays connected",
    title: "Your birth sky, made visible.",
    body: "Explore Lahiri-sidereal positions in an interactive 3D sky, traditional Rasi charts, transparent Jyotish guidance, and a downloadable report in your language.",
    noAccount: "No sign-up",
    languages: "4 languages",
    interactive: "Interactive 3D",
    localPdf: "Private PDF",
    privacy: "Chart calculations stay in your browser. Place search sends only the city query to OpenStreetMap.",
    boundary: "Jyotish text is a traditional symbolic framework, not a scientific prediction.",
    start: "Create my Kundali",
    cosmos: "3D cosmos",
    cosmosTitle: "Orbit the sidereal sky",
    cosmosBody: "Rotate, zoom, follow trajectories, and select a graha to inspect its exact Rasi, Nakshatra, Pada, and Bhava.",
    cosmosAlt: "Illustration of Earth inside a geocentric sidereal celestial sphere",
    charts: "Rasi charts",
    chartsTitle: "Two traditions, one chart",
    chartsBody: "Switch between North and South Indian layouts while every placement and selected Bhava stays synchronized.",
    chartsAlt: "Illustration of North and South Indian Rasi chart layouts",
    analysis: "Transparent guidance",
    analysisTitle: "See how every reading was built",
    analysisBody: "Calculated positions, traditional symbolism, cautions, and missing methods are separated so you can read critically.",
    analysisAlt: "Illustration of transparent Jyotish analysis cards",
    timing: "Dasha & Gochara",
    timingTitle: "Explore symbolic timing without certainty claims",
    timingBody: "Review Vimshottari periods and current Gochara themes with the assumptions and limitations kept visible.",
    timingAlt: "Illustration of Dasha and Gochara timing cards and timeline",
    pdf: "Kundali PDF",
    pdfTitle: "Take a clear summary with you",
    pdfBody: "Choose English, Hindi, Marathi, or German and download a private, client-generated Kundali summary.",
    pdfAlt: "Illustration of a multilingual downloadable Kundali PDF",
  },
  hi: {
    eyebrow: "हर दृश्य आपस में जुड़ा रहता है",
    title: "अपने जन्म-आकाश को स्पष्ट रूप में देखें।",
    body: "संवादात्मक 3D आकाश, पारंपरिक राशि कुंडलियों, पारदर्शी ज्योतिष मार्गदर्शन और अपनी भाषा में डाउनलोड योग्य सार के साथ लाहिरी निरयन स्थितियाँ देखें।",
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
    analysis: "पारदर्शी मार्गदर्शन",
    analysisTitle: "देखें कि पाठ कैसे बनाया गया",
    analysisBody: "गणना, पारंपरिक प्रतीक, सावधानियाँ और अनुपलब्ध विधियाँ अलग दिखती हैं ताकि आप आलोचनात्मक रूप से पढ़ सकें।",
    analysisAlt: "पारदर्शी ज्योतिष विश्लेषण कार्डों का चित्रण",
    timing: "दशा और गोचर",
    timingTitle: "निश्चितता के दावे बिना प्रतीकात्मक समय देखें",
    timingBody: "विंशोत्तरी अवधियाँ और वर्तमान गोचर-विषय देखें; मान्यताएँ और सीमाएँ हमेशा सामने रहती हैं।",
    timingAlt: "दशा और गोचर कार्ड तथा समयरेखा का चित्रण",
    pdf: "कुंडली PDF",
    pdfTitle: "स्पष्ट सार अपने साथ रखें",
    pdfBody: "अंग्रेज़ी, हिन्दी, मराठी या जर्मन चुनकर निजी, ब्राउज़र में बनी कुंडली-सार PDF डाउनलोड करें।",
    pdfAlt: "बहुभाषी डाउनलोड योग्य कुंडली PDF का चित्रण",
  },
  mr: {
    eyebrow: "प्रत्येक दृश्य एकमेकांशी जोडलेले",
    title: "तुमचे जन्म-आकाश स्पष्टपणे पाहा.",
    body: "परस्परसंवादी 3D आकाश, पारंपरिक राशी कुंडल्या, पारदर्शक ज्योतिष मार्गदर्शन आणि तुमच्या भाषेतील डाउनलोडयोग्य सारांशातून लाहिरी निरयन स्थिती पाहा.",
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
    analysis: "पारदर्शक मार्गदर्शन",
    analysisTitle: "प्रत्येक वाचन कसे तयार झाले ते पाहा",
    analysisBody: "गणना, पारंपरिक प्रतीके, सावधगिरी आणि नसलेल्या पद्धती वेगळ्या दाखवल्या आहेत, त्यामुळे तुम्ही चिकित्सकपणे वाचू शकता.",
    analysisAlt: "पारदर्शक ज्योतिष विश्लेषण कार्डांचे चित्रण",
    timing: "दशा व गोचर",
    timingTitle: "निश्चिततेचा दावा न करता प्रतीकात्मक काळ पाहा",
    timingBody: "विंशोत्तरी कालखंड व सध्याचे गोचर-विषय पाहा; गृहीतके आणि मर्यादा कायम दिसतात.",
    timingAlt: "दशा व गोचर कार्डे आणि कालरेषेचे चित्रण",
    pdf: "कुंडली PDF",
    pdfTitle: "स्पष्ट सारांश सोबत ठेवा",
    pdfBody: "इंग्रजी, हिन्दी, मराठी किंवा जर्मन निवडा आणि ब्राउझरमध्ये तयार झालेला खासगी कुंडली-सारांश डाउनलोड करा.",
    pdfAlt: "बहुभाषिक डाउनलोडयोग्य कुंडली PDF चे चित्रण",
  },
  de: {
    eyebrow: "Alle Ansichten bleiben verbunden",
    title: "Dein Geburtshimmel – sichtbar gemacht.",
    body: "Erkunde siderische Lahiri-Positionen in einem interaktiven 3D-Himmel, traditionellen Rasi-Darstellungen, transparenter Jyotish-Einordnung und einem Bericht in deiner Sprache.",
    noAccount: "Ohne Anmeldung",
    languages: "4 Sprachen",
    interactive: "Interaktives 3D",
    localPdf: "Privates PDF",
    privacy: "Die Horoskopberechnung bleibt in deinem Browser. Die Ortssuche sendet nur die Stadtanfrage an OpenStreetMap.",
    boundary: "Jyotish-Texte sind ein traditioneller symbolischer Deutungsrahmen, keine wissenschaftliche Vorhersage.",
    start: "Meine Kundali erstellen",
    cosmos: "3D-Kosmos",
    cosmosTitle: "Bewege dich durch den siderischen Himmel",
    cosmosBody: "Drehe und zoome die Ansicht, verfolge Bahnen und wähle einen Graha, um Rasi, Nakshatra, Pada und Bhava genau zu prüfen.",
    cosmosAlt: "Illustration der Erde in einer geozentrischen siderischen Himmelssphäre",
    charts: "Rasi-Darstellungen",
    chartsTitle: "Zwei Traditionen, eine Kundali",
    chartsBody: "Wechsle zwischen nord- und südindischer Darstellung; alle Positionen und der gewählte Bhava bleiben synchron.",
    chartsAlt: "Illustration nord- und südindischer Rasi-Darstellungen",
    analysis: "Transparente Einordnung",
    analysisTitle: "Erkenne, wie jede Deutung entsteht",
    analysisBody: "Berechnete Positionen, traditionelle Symbolik, Gegenperspektiven und fehlende Methoden werden klar getrennt.",
    analysisAlt: "Illustration transparenter Jyotish-Analysekarten",
    timing: "Dasha & Gochara",
    timingTitle: "Symbolische Zeitmodelle ohne Gewissheitsversprechen",
    timingBody: "Betrachte Vimshottari-Perioden und aktuelle Gochara-Themen; Annahmen und Grenzen bleiben stets sichtbar.",
    timingAlt: "Illustration von Dasha- und Gochara-Karten mit Zeitachse",
    pdf: "Kundali-PDF",
    pdfTitle: "Nimm eine klare Zusammenfassung mit",
    pdfBody: "Wähle Englisch, Hindi, Marathi oder Deutsch und lade eine privat im Browser erzeugte Kundali-Zusammenfassung herunter.",
    pdfAlt: "Illustration einer mehrsprachigen herunterladbaren Kundali-PDF",
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
      image: "cosmos.svg",
    },
    charts: {
      label: t("charts"),
      title: t("chartsTitle"),
      body: t("chartsBody"),
      alt: t("chartsAlt"),
      image: "charts.svg",
    },
    analysis: {
      label: t("analysis"),
      title: t("analysisTitle"),
      body: t("analysisBody"),
      alt: t("analysisAlt"),
      image: "analysis.svg",
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
      image: "pdf.svg",
    },
  } satisfies Record<
    FeatureId,
    { label: string; title: string; body: string; alt: string; image: string }
  >;

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
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--muted)]"
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
          className="flex gap-1 overflow-x-auto"
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
                onClick={() => setSelected(id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
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
              document.getElementById("guided-birth-heading")?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
              document.getElementById("full-name")?.focus();
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

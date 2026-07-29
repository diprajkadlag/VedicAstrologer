"use client";

import { useState } from "react";
import { Download, FileText, LoaderCircle } from "lucide-react";

import type { VedicChart } from "@/lib/astro/ephemeris";
import {
  buildKundaliPdfFilename,
  buildKundaliSummary,
  type KundaliPdfRequest,
} from "@/lib/export/kundaliSummary";
import {
  APP_LOCALES,
  type AppLocale,
} from "@/lib/i18n";

export interface KundaliPdfDownloadProps {
  chart: VedicChart;
  request: KundaliPdfRequest;
  asOf: Date;
  /** Initial PDF language. The user can choose another language in the control. */
  locale: AppLocale;
  className?: string;
}

type DownloadStatus = "idle" | "preparing" | "error";

const COPY: Readonly<
  Record<
    AppLocale,
    {
      selectLabel: string;
      download: string;
      preparing: string;
      error: string;
    }
  >
> = {
  en: {
    selectLabel: "PDF language",
    download: "Download Kundali PDF",
    preparing: "Preparing PDF…",
    error: "The PDF could not be created. Verify the chart and try again.",
  },
  hi: {
    selectLabel: "PDF भाषा",
    download: "कुंडली PDF डाउनलोड करें",
    preparing: "PDF बन रही है…",
    error: "PDF नहीं बन सकी। कुंडली की जाँच करके फिर प्रयास करें।",
  },
  mr: {
    selectLabel: "PDF भाषा",
    download: "कुंडली PDF डाउनलोड करा",
    preparing: "PDF तयार होत आहे…",
    error: "PDF तयार झाली नाही. कुंडली तपासून पुन्हा प्रयत्न करा.",
  },
  de: {
    selectLabel: "PDF-Sprache",
    download: "Kundali-PDF herunterladen",
    preparing: "PDF wird erstellt…",
    error:
      "Die PDF konnte nicht erstellt werden. Kundali prüfen und erneut versuchen.",
  },
};

const LANGUAGE_NAMES: Readonly<Record<AppLocale, string>> = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी",
  de: "Deutsch",
};

function publicFontRoot(): string {
  // `document.baseURI` already contains the Next.js basePath on GitHub Pages.
  // A relative URL therefore works for both `/` deployments and project pages.
  return new URL("fonts/", document.baseURI).href;
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);

  try {
    anchor.click();
  } finally {
    anchor.remove();
    // Allow the navigation task to claim the Blob before releasing it.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }
}

export default function KundaliPdfDownload({
  chart,
  request,
  asOf,
  locale,
  className,
}: KundaliPdfDownloadProps) {
  const [selection, setSelection] = useState<{
    sourceLocale: AppLocale;
    documentLocale: AppLocale;
  }>({
    sourceLocale: locale,
    documentLocale: locale,
  });
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const copy = COPY[locale];
  const documentLocale =
    selection.sourceLocale === locale ? selection.documentLocale : locale;

  async function downloadPdf() {
    if (status === "preparing") return;
    setStatus("preparing");

    try {
      const summary = buildKundaliSummary({
        chart,
        request,
        asOf,
        locale: documentLocale,
      });
      const [{ pdf }, pdfDocumentModule] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./KundaliPdfDocument"),
      ]);

      pdfDocumentModule.registerKundaliPdfFonts(publicFontRoot());
      const PdfDocument = pdfDocumentModule.KundaliPdfDocument;
      const blob = await pdf(<PdfDocument summary={summary} />).toBlob();
      const filename = buildKundaliPdfFilename(
        request.person.fullName,
        request.birth.localDate,
        documentLocale,
      );

      triggerBrowserDownload(blob, filename);
      setStatus("idle");
    } catch {
      // Birth data and generated report content are deliberately never logged.
      setStatus("error");
    }
  }

  return (
    <div className={className}>
      <div className="inline-flex max-w-full flex-wrap items-stretch overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <label className="sr-only" htmlFor="kundali-pdf-language">
          {copy.selectLabel}
        </label>
        <div className="flex items-center border-r border-[var(--border)] px-2.5">
          <FileText
            aria-hidden="true"
            className="mr-1.5 size-3.5 text-violet-600 dark:text-violet-300"
          />
          <select
            id="kundali-pdf-language"
            value={documentLocale}
            onChange={(event) => {
              setSelection({
                sourceLocale: locale,
                documentLocale: event.target.value as AppLocale,
              });
              if (status === "error") setStatus("idle");
            }}
            aria-label={copy.selectLabel}
            className="min-h-9 bg-transparent py-1.5 pr-1 text-xs font-medium text-[var(--foreground)] outline-none"
          >
            {APP_LOCALES.map((option) => (
              <option key={option} value={option}>
                {LANGUAGE_NAMES[option]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={downloadPdf}
          disabled={status === "preparing"}
          className="inline-flex min-h-9 items-center gap-1.5 bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        >
          {status === "preparing" ? (
            <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
          ) : (
            <Download aria-hidden="true" className="size-3.5" />
          )}
          {status === "preparing" ? copy.preparing : copy.download}
        </button>
      </div>
      {status === "error" ? (
        <p role="alert" className="mt-1.5 max-w-md text-xs text-rose-700 dark:text-rose-300">
          {copy.error}
        </p>
      ) : null}
    </div>
  );
}

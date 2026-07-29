import type { Metadata, Viewport } from "next";

import { AppPreferencesProvider } from "@/components/providers/AppPreferencesProvider";
import { DEFAULT_APP_LOCALE } from "@/lib/i18n";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Jyotish Observatory",
    template: "%s · Jyotish Observatory",
  },
  description:
    "Explore a Lahiri-sidereal birth chart through an interactive 3D celestial sphere, traditional Vedic charts, and Jyotish analysis.",
  applicationName: "Jyotish Observatory",
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#060711" },
    { media: "(prefers-color-scheme: light)", color: "#f6f5f1" },
  ],
};

const preferenceBootScript = `
(() => {
  try {
    const root = document.documentElement;
    const locale = localStorage.getItem("jyotish-observatory-locale");
    const storedTheme = localStorage.getItem("jyotish-observatory-theme");
    const theme = storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : "light";
    const resolvedLocale =
      locale === "en" || locale === "hi" || locale === "mr" || locale === "de"
        ? locale
        : "en";
    root.lang = resolvedLocale;
    root.dataset.locale = resolvedLocale;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  } catch {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={DEFAULT_APP_LOCALE}
      data-theme="light"
      data-locale={DEFAULT_APP_LOCALE}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceBootScript }} />
      </head>
      <body>
        <AppPreferencesProvider>{children}</AppPreferencesProvider>
      </body>
    </html>
  );
}

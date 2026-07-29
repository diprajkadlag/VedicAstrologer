import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { pdf } from "@react-pdf/renderer";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { calculateVedicChart } from "../../lib/astro/ephemeris";
import {
  buildKundaliSummary,
  type KundaliPdfRequest,
} from "../../lib/export/kundaliSummary";
import { APP_LOCALES } from "../../lib/i18n";

import {
  KundaliPdfDocument,
  registerKundaliPdfFonts,
} from "./KundaliPdfDocument";

const birthInstant = new Date("1996-11-09T20:15:00.000Z");
const chart = calculateVedicChart({
  instant: birthInstant,
  latitude: 18.5204,
  longitude: 73.8567,
});
const request: KundaliPdfRequest = {
  person: { fullName: "Asha Deshmukh", gender: "female" },
  birth: {
    instant: birthInstant,
    localDate: "1996-11-10",
    localTime: "01:45:00",
    timeZone: "Asia/Kolkata",
    utcOffset: "+05:30",
  },
  location: {
    label: "Pune, Maharashtra, India",
    latitude: 18.5204,
    longitude: 73.8567,
  },
};

const FONT_FILES = new Set([
  "NotoSans-Regular.ttf",
  "NotoSans-Bold.ttf",
  "NotoSansDevanagari-Variable.ttf",
]);

let fontServer: Server;
let fontRoot = "";

beforeAll(async () => {
  fontServer = createServer(async (incoming, response) => {
    const filename = incoming.url?.split("/").at(-1) ?? "";
    if (!FONT_FILES.has(filename)) {
      response.writeHead(404);
      response.end();
      return;
    }

    try {
      const bytes = await readFile(
        resolve(process.cwd(), "public", "fonts", filename),
      );
      response.writeHead(200, {
        "Content-Type": "font/ttf",
        "Content-Length": bytes.byteLength,
      });
      response.end(bytes);
    } catch {
      response.writeHead(500);
      response.end();
    }
  });

  await new Promise<void>((resolveListen, rejectListen) => {
    fontServer.once("error", rejectListen);
    fontServer.listen(0, "127.0.0.1", resolveListen);
  });
  const address = fontServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to start the local PDF font server.");
  }
  fontRoot = `http://127.0.0.1:${address.port}/fonts`;
  registerKundaliPdfFonts(fontRoot);
});

afterAll(async () => {
  await new Promise<void>((resolveClose, rejectClose) => {
    fontServer.close((error) => {
      if (error) rejectClose(error);
      else resolveClose();
    });
  });
});

describe("KundaliPdfDocument browser render path", () => {
  it.each(APP_LOCALES)(
    "renders a valid %s PDF Blob with bundled Noto fonts",
    async (locale) => {
      const summary = buildKundaliSummary({
        chart,
        request,
        asOf: new Date("2026-07-29T12:00:00.000Z"),
        locale,
      });
      const blob = await pdf(
        <KundaliPdfDocument summary={summary} />,
      ).toBlob();
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const signature = new TextDecoder("ascii").decode(bytes.slice(0, 5));

      expect(blob.type).toBe("application/pdf");
      expect(signature).toBe("%PDF-");
      expect(bytes.byteLength).toBeGreaterThan(15_000);
    },
    30_000,
  );
});

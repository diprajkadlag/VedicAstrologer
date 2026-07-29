import type { ReactNode } from "react";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type {
  KundaliBhavaRow,
  KundaliSummary,
} from "../../lib/export/kundaliSummary";

const registeredFontRoots = new Set<string>();

/**
 * Registering by URL keeps the large font binaries out of the JavaScript
 * bundle. The caller supplies the base-path-aware public `/fonts` URL.
 */
export function registerKundaliPdfFonts(fontRootUrl: string): void {
  const root = fontRootUrl.replace(/\/+$/, "");
  if (registeredFontRoots.has(root)) return;

  Font.register({
    family: "Noto Sans",
    fonts: [
      { src: `${root}/NotoSans-Regular.ttf`, fontWeight: 400 },
      { src: `${root}/NotoSans-Bold.ttf`, fontWeight: 700 },
    ],
  });
  Font.register({
    family: "Noto Sans Devanagari",
    fonts: [
      {
        src: `${root}/NotoSansDevanagari-Variable.ttf`,
        fontWeight: 400,
      },
      {
        src: `${root}/NotoSansDevanagari-Variable.ttf`,
        fontWeight: 700,
      },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
  registeredFontRoots.add(root);
}

const palette = {
  ink: "#17132b",
  body: "#363149",
  muted: "#6f6980",
  violet: "#6d4fd3",
  violetSoft: "#f2effc",
  gold: "#b8871d",
  goldSoft: "#fff8e4",
  line: "#ddd8e8",
  paper: "#fffefd",
  warning: "#8a451e",
  warningSoft: "#fff5ec",
} as const;

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingRight: 42,
    paddingBottom: 46,
    paddingLeft: 42,
    backgroundColor: palette.paper,
    color: palette.body,
    fontSize: 9.2,
    lineHeight: 1.45,
  },
  reportHeader: {
    marginBottom: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  reportBrand: {
    color: palette.violet,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  reportSection: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: 700,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 42,
    right: 42,
    color: palette.muted,
    fontSize: 7.5,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 6,
  },
  hero: {
    paddingVertical: 24,
    paddingHorizontal: 22,
    backgroundColor: palette.violetSoft,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: palette.violet,
    marginBottom: 20,
  },
  title: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.15,
  },
  subtitle: {
    color: palette.violet,
    fontSize: 10,
    fontWeight: 700,
    marginTop: 7,
  },
  personName: {
    color: palette.body,
    fontSize: 14,
    marginTop: 15,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  detailCell: {
    width: "50%",
    paddingHorizontal: 4,
    marginBottom: 7,
  },
  label: {
    color: palette.muted,
    fontSize: 7.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  value: {
    color: palette.ink,
    fontSize: 9.5,
  },
  coreRow: {
    flexDirection: "row",
    marginHorizontal: -4,
  },
  coreCard: {
    width: "33.333%",
    paddingHorizontal: 4,
  },
  coreCardInner: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    padding: 10,
    minHeight: 86,
  },
  coreLabel: {
    color: palette.gold,
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 5,
  },
  corePlacement: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 4,
  },
  coreDetail: {
    color: palette.muted,
    fontSize: 8,
    marginBottom: 2,
  },
  dashaPanel: {
    backgroundColor: palette.goldSoft,
    borderRadius: 9,
    padding: 12,
  },
  dashaReference: {
    color: palette.muted,
    fontSize: 8,
    marginBottom: 8,
  },
  dashaRow: {
    flexDirection: "row",
    marginHorizontal: -4,
  },
  dashaCell: {
    width: "50%",
    paddingHorizontal: 4,
  },
  dashaLord: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 3,
  },
  dashaDates: {
    color: palette.body,
    fontSize: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 7,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    minHeight: 39,
    alignItems: "center",
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableHeader: {
    backgroundColor: palette.violetSoft,
    minHeight: 30,
  },
  tableCell: {
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  tableHeaderText: {
    color: palette.violet,
    fontSize: 7.2,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  tablePrimary: {
    color: palette.ink,
    fontSize: 9,
    fontWeight: 700,
  },
  tableSecondary: {
    color: palette.muted,
    fontSize: 7.7,
    marginTop: 2,
  },
  colGraha: { width: "18%" },
  colPlacement: { width: "26%" },
  colNakshatra: { width: "32%" },
  colBhava: { width: "24%" },
  bhavaCard: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    padding: 10,
    marginBottom: 9,
  },
  bhavaHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  bhavaName: {
    color: palette.ink,
    fontSize: 10.5,
    fontWeight: 700,
    maxWidth: "72%",
  },
  bhavaRasi: {
    color: palette.violet,
    fontSize: 9,
    fontWeight: 700,
  },
  bhavaDomain: {
    color: palette.body,
    fontSize: 8.5,
    marginBottom: 5,
  },
  occupantLine: {
    color: palette.gold,
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 5,
  },
  bhavaReadingRow: {
    flexDirection: "row",
    marginHorizontal: -4,
  },
  bhavaReadingCell: {
    width: "50%",
    paddingHorizontal: 4,
  },
  positive: {
    color: "#285b3b",
    fontSize: 7.8,
  },
  caution: {
    color: palette.warning,
    fontSize: 7.8,
  },
  methodItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bullet: {
    color: palette.violet,
    width: 14,
    fontSize: 9,
    fontWeight: 700,
  },
  methodText: {
    flex: 1,
    color: palette.body,
    fontSize: 9,
  },
  auditBox: {
    backgroundColor: palette.violetSoft,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  auditText: {
    color: palette.violet,
    fontSize: 9,
    fontWeight: 700,
  },
  limitation: {
    backgroundColor: palette.warningSoft,
    borderLeftWidth: 2,
    borderLeftColor: "#d29458",
    paddingVertical: 7,
    paddingHorizontal: 9,
    marginBottom: 7,
    color: palette.warning,
    fontSize: 8.5,
  },
});

function Footer({ summary }: { summary: KundaliSummary }) {
  const { copy } = summary;
  return (
    <View style={styles.footer} fixed>
      <Text>{copy.generatedBy}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${copy.page} ${pageNumber} ${copy.of} ${totalPages}`
        }
      />
    </View>
  );
}

function ReportPage({
  summary,
  sectionTitle,
  children,
}: {
  summary: KundaliSummary;
  sectionTitle: string;
  children: ReactNode;
}) {
  return (
    <Page
      size="A4"
      style={[
        styles.page,
        {
          fontFamily:
            summary.locale === "hi" || summary.locale === "mr"
              ? "Noto Sans Devanagari"
              : "Noto Sans",
        },
      ]}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.reportBrand}>{summary.copy.title}</Text>
        <Text style={styles.reportSection}>{sectionTitle}</Text>
      </View>
      {children}
      <Footer summary={summary} />
    </Page>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailCell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function BhavaCard({
  row,
  summary,
}: {
  row: KundaliBhavaRow;
  summary: KundaliSummary;
}) {
  const { copy } = summary;
  return (
    <View style={styles.bhavaCard} wrap={false}>
      <View style={styles.bhavaHeader}>
        <Text style={styles.bhavaName}>
          {copy.bhava} {row.number} · {row.name}
        </Text>
        <Text style={styles.bhavaRasi}>{row.rasi}</Text>
      </View>
      <Text style={styles.bhavaDomain}>{row.domain}</Text>
      <Text style={styles.occupantLine}>
        {copy.occupants}: {row.occupants}
      </Text>
      <View style={styles.bhavaReadingRow}>
        <View style={styles.bhavaReadingCell}>
          <Text style={styles.label}>{copy.constructiveExpression}</Text>
          <Text style={styles.positive}>{row.constructive}</Text>
        </View>
        <View style={styles.bhavaReadingCell}>
          <Text style={styles.label}>{copy.caution}</Text>
          <Text style={styles.caution}>{row.caution}</Text>
        </View>
      </View>
    </View>
  );
}

export function KundaliPdfDocument({
  summary,
}: {
  summary: KundaliSummary;
}) {
  const { copy } = summary;
  const firstBhavas = summary.bhavas.slice(0, 6);
  const secondBhavas = summary.bhavas.slice(6);

  return (
    <Document
      title={`${copy.title} · ${summary.person.fullName}`}
      author="Vedic Astrologer"
      subject={copy.subtitle}
      language={summary.locale}
    >
      <ReportPage summary={summary} sectionTitle={copy.coreAnchors}>
        <View style={styles.hero}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
          <Text style={styles.personName}>{summary.person.fullName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.identityAndBirth}</Text>
          <View style={styles.detailGrid}>
            <Detail label={copy.name} value={summary.person.fullName} />
            <Detail label={copy.addressing} value={summary.person.gender} />
            <Detail
              label={copy.birthCivilTime}
              value={summary.birth.civilTime}
            />
            <Detail label={copy.birthInstant} value={summary.birth.instant} />
            <Detail label={copy.place} value={summary.birth.place} />
            <Detail
              label={copy.coordinates}
              value={summary.birth.coordinates}
            />
            <Detail label={copy.timeZone} value={summary.birth.timeZone} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.coreAnchors}</Text>
          <View style={styles.coreRow}>
            {summary.core.map((anchor) => (
              <View key={anchor.id} style={styles.coreCard}>
                <View style={styles.coreCardInner}>
                  <Text style={styles.coreLabel}>{anchor.label}</Text>
                  <Text style={styles.corePlacement}>
                    {anchor.rasi} · {anchor.degree}
                  </Text>
                  <Text style={styles.coreDetail}>
                    {anchor.nakshatra} · {copy.pada} {anchor.pada}
                  </Text>
                  {anchor.bhava ? (
                    <Text style={styles.coreDetail}>
                      {copy.bhava} {anchor.bhava}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.vimshottari}</Text>
          <View style={styles.dashaPanel}>
            <Text style={styles.dashaReference}>
              {copy.referenceDate}: {summary.dashas.asOf}
            </Text>
            <View style={styles.dashaRow}>
              <View style={styles.dashaCell}>
                <Text style={styles.label}>{copy.mahadasha}</Text>
                <Text style={styles.dashaLord}>
                  {summary.dashas.mahadasha.lord}
                </Text>
                <Text style={styles.dashaDates}>
                  {summary.dashas.mahadasha.start} —{" "}
                  {summary.dashas.mahadasha.end}
                </Text>
              </View>
              <View style={styles.dashaCell}>
                <Text style={styles.label}>{copy.antardasha}</Text>
                <Text style={styles.dashaLord}>
                  {summary.dashas.antardasha.lord}
                </Text>
                <Text style={styles.dashaDates}>
                  {summary.dashas.antardasha.start} —{" "}
                  {summary.dashas.antardasha.end}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ReportPage>

      <ReportPage summary={summary} sectionTitle={copy.grahaPositions}>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCell, styles.colGraha]}>
              <Text style={styles.tableHeaderText}>{copy.graha}</Text>
            </View>
            <View style={[styles.tableCell, styles.colPlacement]}>
              <Text style={styles.tableHeaderText}>{copy.placement}</Text>
            </View>
            <View style={[styles.tableCell, styles.colNakshatra]}>
              <Text style={styles.tableHeaderText}>{copy.nakshatraPada}</Text>
            </View>
            <View style={[styles.tableCell, styles.colBhava]}>
              <Text style={styles.tableHeaderText}>{copy.bhavaMotion}</Text>
            </View>
          </View>
          {summary.grahas.map((row, index) => (
            <View
              key={row.id}
              style={[
                styles.tableRow,
                ...(index === summary.grahas.length - 1
                  ? [styles.tableRowLast]
                  : []),
              ]}
              wrap={false}
            >
              <View style={[styles.tableCell, styles.colGraha]}>
                <Text style={styles.tablePrimary}>{row.graha}</Text>
              </View>
              <View style={[styles.tableCell, styles.colPlacement]}>
                <Text style={styles.tablePrimary}>{row.rasi}</Text>
                <Text style={styles.tableSecondary}>{row.degree}</Text>
              </View>
              <View style={[styles.tableCell, styles.colNakshatra]}>
                <Text style={styles.tablePrimary}>
                  {row.nakshatra} · {copy.pada} {row.pada}
                </Text>
                <Text style={styles.tableSecondary}>
                  {copy.nakshatraLord}: {row.nakshatraLord}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.colBhava]}>
                <Text style={styles.tablePrimary}>
                  {copy.bhava} {row.bhava}
                </Text>
                <Text style={styles.tableSecondary}>{row.motion}</Text>
              </View>
            </View>
          ))}
        </View>
      </ReportPage>

      <ReportPage
        summary={summary}
        sectionTitle={`${copy.bhavaSummary} · 1–6`}
      >
        {firstBhavas.map((row) => (
          <BhavaCard key={row.number} row={row} summary={summary} />
        ))}
      </ReportPage>

      <ReportPage
        summary={summary}
        sectionTitle={`${copy.bhavaSummary} · 7–12`}
      >
        {secondBhavas.map((row) => (
          <BhavaCard key={row.number} row={row} summary={summary} />
        ))}
      </ReportPage>

      <ReportPage summary={summary} sectionTitle={copy.methodology}>
        <View style={styles.auditBox}>
          <Text style={styles.auditText}>
            {copy.internalAudit}: {summary.audit.checksPerformed}{" "}
            {copy.passedChecks}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.methodology}</Text>
          {summary.method.map((item, index) => (
            <View key={index} style={styles.methodItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.methodText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.limitations}</Text>
          {summary.limitations.map((item, index) => (
            <Text key={index} style={styles.limitation}>
              {item}
            </Text>
          ))}
        </View>
      </ReportPage>
    </Document>
  );
}

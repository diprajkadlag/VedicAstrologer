import type { GrahaId } from "./ephemeris";
import { GRAHA_EDUCATION, readLocalized } from "./education";
import type { AppLocale } from "../i18n";

export interface DashaSynthesisText {
  summary: string;
  constructive: string;
  caution: string;
  inquiry: string;
}

/**
 * Localized reading of a major-period and sub-period lord pair, used by the
 * Dashas tab and by the life timeline's "on this date" card.
 */
export function dashaSynthesis(
  major: GrahaId,
  minor: GrahaId,
  locale: AppLocale,
): DashaSynthesisText {
  const majorProfile = GRAHA_EDUCATION[major];
  const minorProfile = GRAHA_EDUCATION[minor];
  const majorName = readLocalized(majorProfile.name, locale);
  const minorName = readLocalized(minorProfile.name, locale);
  if (locale === "hi") {
    return {
      summary: `${majorName} का दीर्घ विषय—${readLocalized(majorProfile.signifies, locale)}—${minorName} के सक्रिय माध्यम—${readLocalized(minorProfile.signifies, locale)}—से व्यक्त हो सकता है। यह दो प्रतीकात्मक कार्यों का संवाद है, घटना की भविष्यवाणी नहीं।`,
      constructive: `${readLocalized(majorProfile.constructive, locale)} को ${readLocalized(minorProfile.constructive, locale)} के साथ साधना रचनात्मक दिशा हो सकती है।`,
      caution: `${readLocalized(majorProfile.caution, locale)} और ${readLocalized(minorProfile.caution, locale)}—दोनों को बिना भय या निश्चित लेबल के जाँचें।`,
      inquiry: readLocalized(minorProfile.inquiry, locale),
    };
  }
  if (locale === "mr") {
    return {
      summary: `${majorName}चा दीर्घ विषय—${readLocalized(majorProfile.signifies, locale)}—${minorName}च्या सक्रिय माध्यमातून—${readLocalized(minorProfile.signifies, locale)}—व्यक्त होऊ शकतो. हा दोन प्रतीकात्मक कार्यांचा संवाद आहे; घटनेचे भाकीत नाही.`,
      constructive: `${readLocalized(majorProfile.constructive, locale)} याला ${readLocalized(minorProfile.constructive, locale)}सोबत साधणे ही रचनात्मक दिशा ठरू शकते.`,
      caution: `${readLocalized(majorProfile.caution, locale)} आणि ${readLocalized(minorProfile.caution, locale)}—दोन्ही भीती किंवा निश्चित लेबल न लावता तपासा.`,
      inquiry: readLocalized(minorProfile.inquiry, locale),
    };
  }
  if (locale === "de") {
    return {
      summary: `${majorName}s langfristiges Thema – ${readLocalized(majorProfile.signifies, locale)} – kann sich durch den aktiven Kanal von ${minorName} – ${readLocalized(minorProfile.signifies, locale)} – ausdrücken. Dies beschreibt das Zusammenspiel zweier symbolischer Funktionen, keine Ereignisprognose.`,
      constructive: `Eine mögliche konstruktive Richtung verbindet ${readLocalized(majorProfile.constructive, locale)} mit ${readLocalized(minorProfile.constructive, locale)}.`,
      caution: `Prüfe sowohl ${readLocalized(majorProfile.caution, locale)} als auch ${readLocalized(minorProfile.caution, locale)} ohne Angst oder starre Zuschreibung.`,
      inquiry: readLocalized(minorProfile.inquiry, locale),
    };
  }
  return {
    summary: `${majorName}'s longer theme—${readLocalized(majorProfile.signifies, locale)}—may be expressed through ${minorName}'s active channel of ${readLocalized(minorProfile.signifies, locale)}. This is a dialogue between two symbolic functions, not an event prediction.`,
    constructive: `A constructive direction combines ${readLocalized(majorProfile.constructive, locale)} with ${readLocalized(minorProfile.constructive, locale)}.`,
    caution: `Examine both ${readLocalized(majorProfile.caution, locale)} and ${readLocalized(minorProfile.caution, locale)} without fear or a fixed label.`,
    inquiry: readLocalized(minorProfile.inquiry, locale),
  };
}

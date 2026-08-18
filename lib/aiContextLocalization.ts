import {
  RASIS,
  type GrahaId,
  type Motion,
  type NakshatraName,
  type RasiName,
} from "./astro/ephemeris";
import {
  getLocalizedGrahaName,
  getLocalizedNakshatraName,
  getLocalizedRasiName,
} from "./astro/localizedNames";
import {
  APP_LOCALES,
  type AppLocale,
} from "./i18n";
import type {
  AstrologyContextPayload,
  JsonSafe,
  NatalPlanetContext,
} from "./aiPromptBuilder";
import type {
  TransitAnalysis,
  TransitNoticeIntensity,
  TransitScoreBand,
} from "./transits";

interface LocalizedContextCopy {
  interpretationBoundary: string;
  sidereal: string;
  wholeSign: string;
  meanNodes: string;
  dashaConvention: string;
  houseReference: string;
  scoreBands: Readonly<Record<TransitScoreBand, string>>;
  noticeIntensities: Readonly<Record<TransitNoticeIntensity, string>>;
  motions: Readonly<Record<Motion, string>>;
}

const LOCALIZED_CONTEXT_COPY: Readonly<
  Record<AppLocale, LocalizedContextCopy>
> = {
  en: {
    interpretationBoundary:
      "Vedic astrology is presented as a symbolic, reflective tradition. It does not establish causation or guarantee events and must not replace medical, legal, financial, mental-health, or other qualified professional advice.",
    sidereal: "Sidereal zodiac",
    wholeSign: "Whole-sign houses",
    meanNodes: "Mean lunar nodes",
    dashaConvention: "365.25-day year",
    houseReference: "Natal whole-sign Ascendant and birth Moon sign",
    scoreBands: {
      intensive: "Intensive",
      reflective: "Reflective",
      steady: "Steady",
      supportive: "Supportive",
      "highly-supportive": "Highly supportive",
    },
    noticeIntensities: {
      background: "Background",
      notable: "Notable",
      major: "Major",
    },
    motions: {
      direct: "Direct",
      retrograde: "Retrograde",
      stationary: "Stationary",
    },
  },
  hi: {
    interpretationBoundary:
      "ज्योतिष को प्रतीकात्मक चिन्तन-परम्परा के रूप में प्रस्तुत किया जाता है। यह कारण-सम्बन्ध सिद्ध नहीं करता या घटनाओं की गारंटी नहीं देता और चिकित्सा, कानूनी, वित्तीय, मानसिक-स्वास्थ्य या अन्य योग्य विशेषज्ञ की सलाह का स्थान नहीं ले सकता।",
    sidereal: "निरयण राशि-चक्र",
    wholeSign: "पूर्ण-राशि भाव",
    meanNodes: "मध्यम चन्द्र-नोड",
    dashaConvention: "365.25-दिवसीय वर्ष",
    houseReference: "जन्म लग्न और जन्म चन्द्र राशि से पूर्ण-राशि भाव",
    scoreBands: {
      intensive: "गहन",
      reflective: "चिन्तनशील",
      steady: "स्थिर",
      supportive: "सहायक",
      "highly-supportive": "अत्यन्त सहायक",
    },
    noticeIntensities: {
      background: "पृष्ठभूमि",
      notable: "उल्लेखनीय",
      major: "प्रमुख",
    },
    motions: {
      direct: "मार्गी",
      retrograde: "वक्री",
      stationary: "स्थिर",
    },
  },
  mr: {
    interpretationBoundary:
      "ज्योतिष ही प्रतीकात्मक चिंतनपरंपरा म्हणून मांडली आहे. ती कारणसंबंध सिद्ध करत नाही किंवा घटनांची हमी देत नाही आणि वैद्यकीय, कायदेशीर, आर्थिक, मानसिक आरोग्य किंवा इतर पात्र तज्ज्ञांच्या सल्ल्याची जागा घेऊ शकत नाही.",
    sidereal: "निरयण राशिचक्र",
    wholeSign: "पूर्ण-राशी भाव",
    meanNodes: "मध्यम चंद्रनोड",
    dashaConvention: "365.25 दिवसांचे वर्ष",
    houseReference: "जन्मलग्न आणि जन्मचंद्र राशीपासून पूर्ण-राशी भाव",
    scoreBands: {
      intensive: "तीव्र",
      reflective: "चिंतनशील",
      steady: "स्थिर",
      supportive: "सहायक",
      "highly-supportive": "अत्यंत सहायक",
    },
    noticeIntensities: {
      background: "पार्श्वभूमी",
      notable: "लक्षणीय",
      major: "प्रमुख",
    },
    motions: {
      direct: "मार्गी",
      retrograde: "वक्री",
      stationary: "स्थिर",
    },
  },
  de: {
    interpretationBoundary:
      "Vedische Astrologie wird als symbolische Tradition zur Reflexion dargestellt. Sie belegt keine Kausalität, garantiert keine Ereignisse und ersetzt keine medizinische, rechtliche, finanzielle, psychologische oder andere qualifizierte Fachberatung.",
    sidereal: "Siderischer Tierkreis",
    wholeSign: "Ganzzeichenhäuser",
    meanNodes: "Mittlere Mondknoten",
    dashaConvention: "Jahr mit 365,25 Tagen",
    houseReference:
      "Ganzzeichenhäuser vom Geburtsaszendenten und vom Mondzeichen bei der Geburt",
    scoreBands: {
      intensive: "Intensiv",
      reflective: "Reflektierend",
      steady: "Ausgeglichen",
      supportive: "Unterstützend",
      "highly-supportive": "Sehr unterstützend",
    },
    noticeIntensities: {
      background: "Hintergrund",
      notable: "Bemerkenswert",
      major: "Stark",
    },
    motions: {
      direct: "Direktläufig",
      retrograde: "Rückläufig",
      stationary: "Stationär",
    },
  },
};

export interface LocalizedNameReference {
  /** Locale-native user-facing name; internal enum names are not exposed. */
  name: string;
}

export interface LocalizedRasiReference
  extends LocalizedNameReference {
  index: number;
}

export type LocalizedNakshatraReference =
  LocalizedNameReference;

function assertAppLocale(locale: AppLocale): void {
  if (!APP_LOCALES.includes(locale)) {
    throw new RangeError(`Unsupported AI context locale: ${locale}.`);
  }
}

function localizedGrahaReference(
  id: GrahaId,
  locale: AppLocale,
): LocalizedNameReference {
  return { name: getLocalizedGrahaName(id, locale) };
}

function localizedRasiReference(
  signIndex: number,
  locale: AppLocale,
): LocalizedRasiReference {
  const id = RASIS[signIndex];
  if (!id) {
    throw new RangeError("Rasi index must be an integer from 0 through 11.");
  }
  return {
    name: getLocalizedRasiName(id, locale),
    index: signIndex,
  };
}

function localizedNakshatraReference(
  id: NakshatraName,
  locale: AppLocale,
): LocalizedNakshatraReference {
  return { name: getLocalizedNakshatraName(id, locale) };
}

/**
 * Converts the stable calculation context into the locale-native schema shown
 * in the preview and sent to an LLM. Astronomical names are emitted only in the
 * selected locale; stable internal enum names never become parallel labels.
 * Raw English transit prose is deliberately excluded because its numeric scores
 * and disclosed rule contributions are the portable data.
 */
export function projectAstrologyContextForLocale(
  context: AstrologyContextPayload,
  locale: AppLocale,
) {
  assertAppLocale(locale);
  const copy = LOCALIZED_CONTEXT_COPY[locale];
  const natalPlanetById = new Map(
    context.natal.planets.map((planet) => [planet.id, planet]),
  );
  function requireNatalContextPlanet(id: GrahaId) {
    const planet = natalPlanetById.get(id);
    if (!planet) {
      throw new RangeError(`AI context is missing natal ${id}.`);
    }
    return planet;
  }
  const natalMoon = requireNatalContextPlanet("moon");

  const transitPositionById = new Map(
    context.transits.positions.map((position) => [position.id, position]),
  );
  function requireTransitPosition(id: GrahaId) {
    const position = transitPositionById.get(id);
    if (!position) {
      throw new RangeError(`AI context is missing the ${id} transit.`);
    }
    return position;
  }

  function scoreProjection(
    theme: Pick<
      JsonSafe<TransitAnalysis["daily"]>,
      "baseline" | "score" | "band" | "reasons"
    >,
  ) {
    return {
      baseline: theme.baseline,
      score: theme.score,
      band: {
        id: theme.band,
        name: copy.scoreBands[theme.band],
      },
      ruleContributions: theme.reasons.map((reason) => ({
        ruleId: reason.ruleId,
        contribution: reason.contribution,
      })),
    };
  }

  function planetProjection(planet: NatalPlanetContext) {
    return {
      planet: localizedGrahaReference(planet.id, locale),
      sign: localizedRasiReference(planet.signIndex, locale),
      degreeInSign: planet.degreeInSign,
      siderealLongitudeDeg: planet.siderealLongitudeDeg,
      nakshatra: {
        ...localizedNakshatraReference(planet.nakshatra, locale),
        pada: planet.nakshatraPada,
        lord: localizedGrahaReference(planet.nakshatraLord, locale),
      },
      house: planet.house,
      motion: {
        id: planet.motion,
        name: copy.motions[planet.motion],
      },
      retrograde: planet.retrograde,
      speedDegPerDay: planet.speedDegPerDay,
    };
  }

  function transitPositionProjection(id: GrahaId) {
    const position = requireTransitPosition(id);
    return {
      planet: localizedGrahaReference(position.id, locale),
      sign: localizedRasiReference(position.signIndex, locale),
      degreeInSign: position.degreeInSign,
      siderealLongitudeDeg: position.siderealLongitudeDeg,
      nakshatra: {
        ...localizedNakshatraReference(position.nakshatra, locale),
        pada: position.nakshatraPada,
      },
      motion: {
        id: position.motion,
        name: copy.motions[position.motion],
      },
      retrograde: position.retrograde,
      houseFromAscendant: position.houseFromLagna,
      houseFromBirthMoonSign: position.houseFromMoon,
    };
  }

  function majorTransitProjection(id: "jupiter" | "saturn") {
    const notice = context.transits.majorTransits[id];
    const position = requireTransitPosition(id);
    return {
      planet: localizedGrahaReference(id, locale),
      sign: localizedRasiReference(position.signIndex, locale),
      houseFromAscendant: notice.houseFromLagna,
      houseFromBirthMoonSign: notice.houseFromJanmaRasi,
      intensity: {
        id: notice.intensity,
        name: copy.noticeIntensities[notice.intensity],
      },
      score: notice.score,
      ruleContributions: notice.reasons.map((reason) => ({
        ruleId: reason.ruleId,
        contribution: reason.contribution,
      })),
    };
  }

  const transitMoon = requireTransitPosition("moon");
  const transitSun = requireTransitPosition("sun");
  const transitMercury = requireTransitPosition("mercury");

  return {
    schemaVersion: "vedic-astrologer-presentation/v1" as const,
    sourceSchemaVersion: context.schemaVersion,
    presentationLocale: locale,
    referenceInstant: context.referenceInstant,
    natal: {
      birthInstant: context.natal.birthInstant,
      coordinateSystem: {
        id: context.natal.coordinateSystem,
        name: copy.sidereal,
      },
      ayanamsa: { ...context.natal.ayanamsa },
      houseSystem: {
        id: context.natal.houseSystem,
        name: copy.wholeSign,
      },
      nodeModel: {
        id: context.natal.nodeModel,
        name: copy.meanNodes,
      },
      location: { ...context.natal.location },
      ascendant: {
        sign: localizedRasiReference(
          context.natal.lagna.signIndex,
          locale,
        ),
        degreeInSign: context.natal.lagna.degreeInSign,
        siderealLongitudeDeg:
          context.natal.lagna.siderealLongitudeDeg,
        nakshatra: {
          ...localizedNakshatraReference(
            context.natal.lagna.nakshatra,
            locale,
          ),
          pada: context.natal.lagna.nakshatraPada,
        },
      },
      birthMoonSign: localizedRasiReference(
        natalMoon.signIndex,
        locale,
      ),
      birthNakshatra: {
        ...localizedNakshatraReference(
          context.natal.birthNakshatra.name,
          locale,
        ),
        pada: context.natal.birthNakshatra.pada,
        lord: localizedGrahaReference(
          context.natal.birthNakshatra.lord,
          locale,
        ),
      },
      planets: context.natal.planets.map(planetProjection),
      houses: context.natal.houses.map((house) => ({
        number: house.number,
        sign: localizedRasiReference(house.signIndex, locale),
        lord: {
          planet: localizedGrahaReference(house.lord, locale),
          house: house.lordHouse,
          sign: localizedRasiReference(
            requireNatalContextPlanet(house.lord).signIndex,
            locale,
          ),
        },
        occupants: house.occupants.map((id) =>
          localizedGrahaReference(id, locale),
        ),
      })),
    },
    vimshottari: {
      convention: {
        id: context.vimshottari.convention,
        name: copy.dashaConvention,
      },
      asOf: context.vimshottari.asOf,
      birthMahadashaLord: localizedGrahaReference(
        context.vimshottari.birthMahadashaLord,
        locale,
      ),
      birthMahadashaBalanceYears:
        context.vimshottari.birthMahadashaBalanceYears,
      mahadasha: {
        ...context.vimshottari.mahadasha,
        lord: localizedGrahaReference(
          context.vimshottari.mahadasha.lord,
          locale,
        ),
      },
      antardasha: {
        ...context.vimshottari.antardasha,
        lord: localizedGrahaReference(
          context.vimshottari.antardasha.lord,
          locale,
        ),
        majorLord: localizedGrahaReference(
          context.vimshottari.antardasha.majorLord,
          locale,
        ),
      },
    },
    transits: {
      asOf: context.transits.asOf,
      natalInstant: context.transits.natalInstant,
      observerLocation: { ...context.transits.observerLocation },
      natalReference: {
        ascendantSign: localizedRasiReference(
          context.natal.lagna.signIndex,
          locale,
        ),
        birthMoonSign: localizedRasiReference(
          natalMoon.signIndex,
          locale,
        ),
        moonNakshatra: localizedNakshatraReference(
          context.transits.natalReference.moonNakshatra,
          locale,
        ),
      },
      positions: context.transits.positions.map((position) =>
        transitPositionProjection(position.id),
      ),
      daily: {
        ...scoreProjection(context.transits.daily),
        moonSign: localizedRasiReference(
          transitMoon.signIndex,
          locale,
        ),
        moonNakshatra: {
          ...localizedNakshatraReference(
            context.transits.daily.moonNakshatra,
            locale,
          ),
          pada: context.transits.daily.moonNakshatraPada,
          lord: localizedGrahaReference(
            context.transits.daily.moonNakshatraLord,
            locale,
          ),
        },
        houseFromAscendant:
          context.transits.daily.moonHouseFromLagna,
        houseFromBirthMoonSign:
          context.transits.daily.moonHouseFromJanmaRasi,
      },
      monthly: {
        ...scoreProjection(context.transits.monthly),
        sun: {
          sign: localizedRasiReference(
            transitSun.signIndex,
            locale,
          ),
          houseFromAscendant:
            context.transits.monthly.sunHouseFromLagna,
          houseFromBirthMoonSign:
            context.transits.monthly.sunHouseFromJanmaRasi,
        },
        mercury: {
          sign: localizedRasiReference(
            transitMercury.signIndex,
            locale,
          ),
          houseFromAscendant:
            context.transits.monthly.mercuryHouseFromLagna,
          houseFromBirthMoonSign:
            context.transits.monthly.mercuryHouseFromJanmaRasi,
          retrograde:
            context.transits.monthly.mercuryRetrograde,
        },
      },
      major: {
        jupiter: majorTransitProjection("jupiter"),
        saturn: majorTransitProjection("saturn"),
      },
      metadata: {
        ruleSet: context.transits.metadata.ruleSet,
        zodiac: {
          id: context.transits.metadata.zodiac,
          name: copy.sidereal,
        },
        ayanamsa: context.transits.metadata.ayanamsa,
        houseReference: {
          id: "natal-whole-sign-ascendant-and-birth-moon",
          name: copy.houseReference,
        },
        scoreRange: [...context.transits.metadata.scoreRange],
        scoreBaseline:
          context.transits.metadata.scoreBaseline,
      },
    },
    interpretationBoundary: copy.interpretationBoundary,
  };
}

export type LocalizedAstrologyContextPayload = ReturnType<
  typeof projectAstrologyContextForLocale
>;

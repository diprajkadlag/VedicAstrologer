import type { GrahaId, RasiName } from "./ephemeris";

export const ASTRO_TERM_IDS = [
  "lagna",
  "graha",
  "rasi",
  "janma-rasi",
  "bhava",
  "whole-sign-house",
  "house-lord",
  "nakshatra",
  "pada",
  "nakshatra-lord",
  "ayanamsa",
  "lahiri",
  "retrograde",
  "gochara",
  "dasha",
  "vimshottari",
  "mahadasha",
  "antardasha",
  "rahu-ketu",
] as const;

export type AstroTermId = (typeof ASTRO_TERM_IDS)[number];

export interface AstroGlossaryEntry {
  id: AstroTermId;
  title: string;
  sanskrit?: string;
  short: string;
  detailed: string;
  calculation?: string;
  readingTips: readonly string[];
}

export const ASTRO_GLOSSARY: Readonly<Record<AstroTermId, AstroGlossaryEntry>> = {
  lagna: {
    id: "lagna",
    title: "Lagna / Ascendant",
    sanskrit: "Lagna",
    short: "The sidereal zodiac degree rising on the eastern horizon for the exact time and place.",
    detailed: "Lagna anchors the twelve houses and describes the chart's embodied point of view: vitality, appearance, temperament, first reactions, and the way life is approached. It changes quickly, so accurate time and location matter. It is a chart angle, not a planet.",
    calculation: "This app calculates the eastern intersection of the local horizon and true ecliptic, then applies Lahiri ayanamsa. The Lagna sign begins the first whole-sign house.",
    readingTips: ["Read its sign for style.", "Read its ruler for direction and support.", "Read planets in the first house for strong modifiers."],
  },
  graha: {
    id: "graha",
    title: "Graha",
    sanskrit: "Graha",
    short: "A Jyotish planetary agent or 'seizer' that symbolizes a distinct function of experience.",
    detailed: "The nine grahas used here are Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu, and Ketu. Sun and Moon are luminaries; Rahu and Ketu are lunar nodes rather than physical planets. A graha gains context from its Rasi, house, Nakshatra, motion, rulerships, and relationships with other grahas.",
    readingTips: ["A graha says what function is active.", "Its sign describes how it acts.", "Its house describes where the function becomes visible."],
  },
  rasi: {
    id: "rasi",
    title: "Rasi / Zodiac Sign",
    sanskrit: "Rāśi",
    short: "One of twelve equal 30-degree divisions of the sidereal zodiac.",
    detailed: "A Rasi supplies elemental tone, modality, and a planetary ruler. In a whole-sign chart it also fills one entire house. Rasis describe style and conditions; they do not operate independently from the grahas and house topics placed within them.",
    calculation: "Sidereal longitude 0-30 degrees is Mesha, 30-60 Vrishabha, continuing in 30-degree sections through Meena.",
    readingTips: ["Element describes the mode of engagement.", "Modality describes how energy moves.", "The Rasi lord connects the sign to another house."],
  },
  "janma-rasi": {
    id: "janma-rasi",
    title: "Janma Rasi / Birth Moon Sign",
    sanskrit: "Janma Rāśi",
    short: "The sidereal zodiac sign occupied by the Moon at birth.",
    detailed: "Janma Rasi is a central emotional and experiential reference point in Jyotish. Transit houses counted from the birth Moon are commonly used in Gochara to describe how current conditions may be felt subjectively, while houses counted from Lagna emphasize concrete life areas.",
    readingTips: ["Use it for Moon-relative transit houses.", "Combine it with the birth Nakshatra for emotional patterning.", "Do not replace the Lagna chart with Moon-sign reading alone."],
  },
  bhava: {
    id: "bhava",
    title: "Bhava / House",
    sanskrit: "Bhāva",
    short: "One of twelve life fields organized from the Lagna.",
    detailed: "Bhavas describe where chart themes unfold: self, resources, skills, home, creativity, service, partnership, transformation, meaning, vocation, gains, and release. A house is read through its inherent topic, the Rasi occupying it, its planetary lord, resident grahas, and timing or transit activation.",
    readingTips: ["An empty house is not inactive.", "Its lord remains the primary carrier of its topics.", "Resident grahas emphasize but do not own the house."],
  },
  "whole-sign-house": {
    id: "whole-sign-house",
    title: "Whole-sign Houses",
    short: "A house system in which the entire Lagna sign is House 1 and each following sign is the next house.",
    detailed: "Whole-sign houses keep Rasi and Bhava boundaries aligned at zero degrees of each sign. If Simha rises, all of Simha is House 1, Kanya is House 2, and so on. The exact Lagna degree remains important as an angle even though it is not the house boundary.",
    calculation: "House number = the number of signs counted inclusively from the Lagna sign, wrapping after Meena.",
    readingTips: ["Use the sign sequence to verify house numbering.", "Interpret the exact Lagna degree separately from the whole-sign boundary."],
  },
  "house-lord": {
    id: "house-lord",
    title: "House Lord",
    sanskrit: "Bhāveśa",
    short: "The graha ruling the Rasi that occupies a house.",
    detailed: "The house lord carries that house's topics into the house and sign where the lord itself is placed. For example, if the tenth-house sign is ruled by Mercury and Mercury occupies the fifth house, career topics become linked with learning, counsel, creativity, or other fifth-house themes. This is a connection, not a guaranteed event.",
    readingTips: ["Identify the sign in the house.", "Find that sign's ruler.", "Read the ruler's house, sign, and condition."],
  },
  nakshatra: {
    id: "nakshatra",
    title: "Nakshatra / Lunar Mansion",
    sanskrit: "Nakṣatra",
    short: "One of 27 equal lunar mansions, each spanning 13°20′ of the sidereal zodiac.",
    detailed: "Nakshatras add a finer symbolic layer through a ruler, deity, image, motivation, gifts, and shadow tendencies. The Moon's birth Nakshatra is especially important for temperament and for establishing the starting Vimshottari Dasha period.",
    calculation: "The 360-degree zodiac is divided into 27 sections of 13°20′, beginning with Ashwini at 0 degrees sidereal Mesha.",
    readingTips: ["Use the mansion as a nuance, not a standalone verdict.", "The Moon's exact progress determines Dasha balance.", "Its four Padas refine expression further."],
  },
  pada: {
    id: "pada",
    title: "Pada",
    sanskrit: "Pāda",
    short: "One of four quarters within a Nakshatra, each spanning 3°20′.",
    detailed: "A Pada refines how a Nakshatra theme is expressed and connects the lunar mansion to a Navamsha division. This app reports Pada 1-4 from exact sidereal longitude but does not yet render a separate Navamsha chart.",
    calculation: "The degree within a Nakshatra is divided by 3°20′ and numbered from 1 through 4.",
    readingTips: ["Use Pada after establishing the planet, sign, house, and Nakshatra.", "Treat boundary placements with the ephemeris accuracy note in mind."],
  },
  "nakshatra-lord": {
    id: "nakshatra-lord",
    title: "Nakshatra Lord",
    short: "The graha assigned to a lunar mansion in the repeating Vimshottari sequence.",
    detailed: "Nakshatra lords repeat Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, and Mercury across the 27 mansions. The lord links a planet's mansion placement to that graha's natal position and also determines the Mahadasha operating at birth for the Moon's mansion.",
    readingTips: ["Find where the lord sits in the natal chart.", "Distinguish a Nakshatra lord from a Rasi or house lord."],
  },
  ayanamsa: {
    id: "ayanamsa",
    title: "Ayanamsa",
    sanskrit: "Ayanāṃśa",
    short: "The angular correction between tropical and sidereal zodiac reference frames.",
    detailed: "Earth's precession causes the equinox-based tropical zodiac to move relative to the stars. An ayanamsa specifies the offset subtracted from tropical ecliptic longitude to obtain a sidereal longitude. Different ayanamsa conventions can move placements near boundaries.",
    readingTips: ["Compare charts only when the same ayanamsa is used.", "Boundary differences are methodological, not calculation noise alone."],
  },
  lahiri: {
    id: "lahiri",
    title: "Lahiri Ayanamsa",
    sanskrit: "Chitrapaksha",
    short: "A widely used Indian sidereal reference convention, also called Chitrapaksha.",
    detailed: "Lahiri anchors the sidereal zodiac through the Chitrapaksha convention associated with Spica and is the standard selected for this app. It supplies one consistent frame for Rasis, Nakshatras, Lagna, planets, and nodes.",
    calculation: "The engine applies its documented Lahiri precession model and nutation correction to apparent true-ecliptic positions.",
    readingTips: ["Keep this setting fixed when comparing natal and transit charts."],
  },
  retrograde: {
    id: "retrograde",
    title: "Retrograde Motion",
    sanskrit: "Vakri",
    short: "Apparent backward motion in geocentric zodiac longitude.",
    detailed: "Retrograde is an observational effect produced by relative orbital motion. In interpretation it is often read as intensification, revision, internalization, or a less straightforward expression of the graha. It does not make a planet automatically good or bad.",
    calculation: "The app samples longitude before and after the selected instant. A negative longitudinal speed receives the R flag; speeds close to zero are labeled stationary.",
    readingTips: ["Read the graha's sign, house, and rulership first.", "Avoid treating retrograde as a universal reversal of meaning."],
  },
  gochara: {
    id: "gochara",
    title: "Gochara / Transit",
    sanskrit: "Gocara",
    short: "The movement of current grahas through the zodiac relative to the natal chart.",
    detailed: "Gochara compares a selected date's planetary positions with the birth chart. Jyotish commonly counts transit houses from both Lagna and Janma Rasi. Transits describe temporary emphasis and are strongest when read together with natal promise and Dasha timing.",
    readingTips: ["Use Lagna-relative houses for life areas.", "Use Moon-relative houses for felt experience.", "Treat scores as transparent summaries, not fate probabilities."],
  },
  dasha: {
    id: "dasha",
    title: "Dasha",
    sanskrit: "Daśā",
    short: "A symbolic planetary-period system used to organize time in Jyotish.",
    detailed: "A Dasha identifies which graha's natal themes are emphasized during a span of life. It is not a transit and does not guarantee events. Results are interpreted through the period lord's natal house, sign, rulerships, relationships, and simultaneous transits.",
    readingTips: ["Read the natal condition of the period lord.", "Combine major and minor period lords.", "Use transits as timing context rather than isolated proof."],
  },
  vimshottari: {
    id: "vimshottari",
    title: "Vimshottari Dasha",
    sanskrit: "Viṃśottarī Daśā",
    short: "A 120-year sequence of nine planetary periods derived from the birth Moon's Nakshatra.",
    detailed: "Vimshottari cycles through Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, and Mercury with unequal durations totaling 120 years. The Moon's Nakshatra determines the birth lord, while its exact progress through that mansion determines how much of the first period remains.",
    calculation: "This app uses exact Nakshatra progress and a documented 365.25-day-year convention with half-open period boundaries.",
    readingTips: ["Mahadasha gives the broad chapter.", "Antardasha gives the active subtheme.", "Read both lords in the natal chart."],
  },
  mahadasha: {
    id: "mahadasha",
    title: "Mahadasha",
    sanskrit: "Mahādaśā",
    short: "The major planetary period forming the broad background chapter in Vimshottari timing.",
    detailed: "A Mahadasha can last from 6 to 20 years depending on its lord. Its lord's natal domains, house placement, house rulerships, and condition describe the long-running developmental agenda. Every Mahadasha contains nine Antardashas that change the immediate emphasis.",
    readingTips: ["Treat it as a long chapter, not a single prediction.", "Locate the lord in the natal chart.", "Then layer the current Antardasha and transits."],
  },
  antardasha: {
    id: "antardasha",
    title: "Antardasha",
    sanskrit: "Antardaśā",
    short: "A sub-period inside a Mahadasha that channels the major period through another graha.",
    detailed: "The Mahadasha lord describes the larger chapter; the Antardasha lord describes the nearer-term route through which that chapter is experienced. For example, a Saturn major period with a Mercury sub-period combines Saturn's duty, time, and structure with Mercury's learning, communication, analysis, and exchange. The combination is interpreted from both lords' natal placements rather than from names alone.",
    calculation: "Each Mahadasha is divided into nine Antardashas. A sub-period's duration equals major-lord years multiplied by minor-lord years divided by 120.",
    readingTips: ["Read the major lord as context and minor lord as immediate focus.", "Check houses owned and occupied by both.", "Look for shared topics, then current transit activation."],
  },
  "rahu-ketu": {
    id: "rahu-ketu",
    title: "Rahu and Ketu",
    short: "The ascending and descending lunar nodes, always opposite each other.",
    detailed: "Rahu and Ketu are mathematical intersections of the Moon's orbit with the ecliptic. Rahu is associated with appetite, amplification, novelty, and worldly reach; Ketu with severance, concentrated perception, release, and inwardness. They are not physical planets and require contextual reading.",
    calculation: "This app uses the mean lunar node model and places Ketu exactly 180 degrees from Rahu.",
    readingTips: ["Read their sign and house axis together.", "Avoid reducing Rahu to good and Ketu to bad, or vice versa."],
  },
};

export interface RasiProfile {
  name: RasiName;
  ruler: GrahaId;
  element: "Fire" | "Earth" | "Air" | "Water";
  modality: "Movable" | "Fixed" | "Dual";
  style: string;
  constructive: string;
  growthEdge: string;
}

export const RASI_PROFILES: Readonly<Record<RasiName, RasiProfile>> = {
  Aries: { name: "Aries", ruler: "mars", element: "Fire", modality: "Movable", style: "direct, initiating, independent, and action-led", constructive: "courageous beginnings and clear initiative", growthEdge: "pace action so urgency does not outrun awareness" },
  Taurus: { name: "Taurus", ruler: "venus", element: "Earth", modality: "Fixed", style: "steady, sensory, resource-conscious, and preserving", constructive: "patient cultivation and dependable values", growthEdge: "let stability remain responsive rather than immovable" },
  Gemini: { name: "Gemini", ruler: "mercury", element: "Air", modality: "Dual", style: "curious, verbal, connective, and adaptable", constructive: "versatile learning and articulate exchange", growthEdge: "turn breadth of interest into sustained understanding" },
  Cancer: { name: "Cancer", ruler: "moon", element: "Water", modality: "Movable", style: "protective, receptive, memory-rich, and caring", constructive: "responsive nurture and strong emotional roots", growthEdge: "care without making safety depend on control" },
  Leo: { name: "Leo", ruler: "sun", element: "Fire", modality: "Fixed", style: "expressive, dignified, creative, and heart-centered", constructive: "generous visibility and principled leadership", growthEdge: "share the stage and separate purpose from applause" },
  Virgo: { name: "Virgo", ruler: "mercury", element: "Earth", modality: "Dual", style: "discerning, practical, analytical, and improvement-oriented", constructive: "skillful service and precise problem-solving", growthEdge: "let refinement support life rather than postpone it" },
  Libra: { name: "Libra", ruler: "venus", element: "Air", modality: "Movable", style: "relational, balancing, aesthetic, and agreement-seeking", constructive: "fair exchange and intelligent cooperation", growthEdge: "make a clear choice without outsourcing preference" },
  Scorpio: { name: "Scorpio", ruler: "mars", element: "Water", modality: "Fixed", style: "intense, private, investigative, and transformative", constructive: "focused resilience and emotional honesty", growthEdge: "replace defensive control with trustworthy depth" },
  Sagittarius: { name: "Sagittarius", ruler: "jupiter", element: "Fire", modality: "Dual", style: "meaning-seeking, exploratory, candid, and future-facing", constructive: "broad perspective and ethical aspiration", growthEdge: "test conviction against detail and lived evidence" },
  Capricorn: { name: "Capricorn", ruler: "saturn", element: "Earth", modality: "Movable", style: "structured, responsible, strategic, and achievement-aware", constructive: "patient construction and accountable leadership", growthEdge: "let duty include warmth, rest, and human proportion" },
  Aquarius: { name: "Aquarius", ruler: "saturn", element: "Air", modality: "Fixed", style: "systemic, independent, collective, and principle-driven", constructive: "durable contribution to groups and ideas", growthEdge: "keep abstract ideals connected to personal presence" },
  Pisces: { name: "Pisces", ruler: "jupiter", element: "Water", modality: "Dual", style: "imaginative, compassionate, permeable, and contemplative", constructive: "inspired empathy and integrative understanding", growthEdge: "give intuition boundaries and practical form" },
};

export function getAstroGlossaryEntry(id: AstroTermId): AstroGlossaryEntry {
  return ASTRO_GLOSSARY[id];
}

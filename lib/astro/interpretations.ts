import {
  GRAHA_IDS,
  NAKSHATRAS,
  type GrahaId,
  type GrahaPosition,
  type HouseNumber,
  type Motion,
  type NakshatraName,
  type Pada,
  type RasiName,
  type VedicChart,
} from "./ephemeris";
import { getRasiDisplayName } from "./display";

export interface HouseMeaning {
  number: HouseNumber;
  name: string;
  sanskritName: string;
  theme: string;
  significations: readonly string[];
  summary: string;
  constructiveExpression: string;
  growthQuestion: string;
}

export const HOUSE_MEANINGS = [
  {
    number: 1,
    name: "Self & Body",
    sanskritName: "Tanu Bhava",
    theme: "identity, vitality, embodiment, and beginnings",
    significations: ["identity", "body", "appearance", "temperament", "life direction"],
    summary: "The first house describes the way a person meets life: the body, visible temperament, vitality, and instinctive approach to new experience.",
    constructiveExpression: "Clear self-awareness and the confidence to initiate without losing sensitivity to context.",
    growthQuestion: "How can I act from an authentic identity rather than a defended image?",
  },
  {
    number: 2,
    name: "Wealth & Speech",
    sanskritName: "Dhana Bhava",
    theme: "resources, family culture, speech, food, and values",
    significations: ["accumulated wealth", "speech", "family", "food", "personal values"],
    summary: "The second house concerns what is gathered and sustained: money, family inheritance, the voice, nourishment, and the values behind material choices.",
    constructiveExpression: "Steady stewardship of resources and speech that is both truthful and considerate.",
    growthQuestion: "What do my words and spending reveal about what I truly value?",
  },
  {
    number: 3,
    name: "Courage & Communication",
    sanskritName: "Sahaja Bhava",
    theme: "initiative, skills, siblings, communication, and short journeys",
    significations: ["courage", "writing", "skills", "siblings", "local movement"],
    summary: "The third house shows practiced ability, everyday communication, self-directed effort, siblings and peers, and the courage built through repetition.",
    constructiveExpression: "Curiosity translated into practical skill, direct communication, and sustainable effort.",
    growthQuestion: "Which small, repeated action would make my courage more reliable?",
  },
  {
    number: 4,
    name: "Home & Inner Life",
    sanskritName: "Sukha Bhava",
    theme: "home, emotional security, mothering, land, and inner peace",
    significations: ["home", "mother", "emotional roots", "property", "inner contentment"],
    summary: "The fourth house describes foundations: home and land, formative care, private emotional life, education, and the conditions that create inner steadiness.",
    constructiveExpression: "A secure inner base that supports both belonging and healthy independence.",
    growthQuestion: "What conditions genuinely help my nervous system feel at home?",
  },
  {
    number: 5,
    name: "Intelligence & Creativity",
    sanskritName: "Putra Bhava",
    theme: "creative intelligence, children, learning, counsel, and joy",
    significations: ["creativity", "children", "study", "romance", "discernment"],
    summary: "The fifth house speaks to generative intelligence: creativity, children, study, mantra, romance, play, and the capacity to recognize meaningful patterns.",
    constructiveExpression: "Generous creativity joined with disciplined learning and responsible delight.",
    growthQuestion: "What wants to be created through me, and what practice will help it mature?",
  },
  {
    number: 6,
    name: "Service & Challenges",
    sanskritName: "Ari Bhava",
    theme: "work, health routines, service, conflict, and problem-solving",
    significations: ["service", "daily work", "health habits", "debts", "competition"],
    summary: "The sixth house addresses the friction of ordinary life: work and service, health routines, debts, competitors, and the craft of solving concrete problems.",
    constructiveExpression: "Competence, humility, and consistent habits that turn difficulty into useful service.",
    growthQuestion: "Which routine would reduce avoidable struggle while improving my capacity to help?",
  },
  {
    number: 7,
    name: "Partnership",
    sanskritName: "Yuvati Bhava",
    theme: "committed relationship, agreements, exchange, and the public other",
    significations: ["marriage", "partnership", "contracts", "clients", "negotiation"],
    summary: "The seventh house concerns one-to-one bonds, marriage, business partnership, agreements, clients, and qualities encountered through significant others.",
    constructiveExpression: "Mutuality in which clear boundaries make cooperation and intimacy more trustworthy.",
    growthQuestion: "How can I meet another person fully without abandoning my own center?",
  },
  {
    number: 8,
    name: "Transformation & Shared Resources",
    sanskritName: "Randhra Bhava",
    theme: "change, vulnerability, longevity, hidden matters, and shared assets",
    significations: ["transformation", "inheritance", "shared wealth", "research", "vulnerability"],
    summary: "The eighth house holds profound transitions, joint resources, inheritance, longevity, secrets, research, and the intimacy that requires surrendering control.",
    constructiveExpression: "Emotional honesty and research-minded resilience in periods of uncertainty or change.",
    growthQuestion: "What becomes possible when I relate to change with curiosity instead of control?",
  },
  {
    number: 9,
    name: "Dharma & Fortune",
    sanskritName: "Dharma Bhava",
    theme: "meaning, ethics, teachers, pilgrimage, higher study, and grace",
    significations: ["dharma", "teachers", "philosophy", "long journeys", "fortune"],
    summary: "The ninth house explores guiding meaning: ethics, teachers and father figures, higher learning, pilgrimage, long travel, faith, and fortunate perspective.",
    constructiveExpression: "A lived philosophy that remains principled while learning from unfamiliar worlds.",
    growthQuestion: "Which belief becomes more truthful when tested through direct experience?",
  },
  {
    number: 10,
    name: "Career & Public Life",
    sanskritName: "Karma Bhava",
    theme: "vocation, responsibility, action, leadership, and reputation",
    significations: ["career", "status", "public contribution", "authority", "responsibility"],
    summary: "The tenth house describes visible action: vocation, leadership, achievement, reputation, responsibility, and the contribution for which one becomes known.",
    constructiveExpression: "Purposeful work whose public impact is supported by accountability and craft.",
    growthQuestion: "What kind of responsibility would make my ambition meaningful?",
  },
  {
    number: 11,
    name: "Gains & Community",
    sanskritName: "Labha Bhava",
    theme: "networks, gains, aspirations, elder allies, and collective impact",
    significations: ["income", "friends", "communities", "aspirations", "recognition"],
    summary: "The eleventh house concerns gains from effort, friendships and networks, communities, patrons, large goals, and participation in something wider than oneself.",
    constructiveExpression: "Ambition connected to reciprocal networks and benefits that can be shared.",
    growthQuestion: "Which community helps my aspirations become more generous and realistic?",
  },
  {
    number: 12,
    name: "Liberation & Retreat",
    sanskritName: "Vyaya Bhava",
    theme: "release, solitude, sleep, distant places, loss, and transcendence",
    significations: ["liberation", "retreat", "sleep", "foreign places", "expenditure"],
    summary: "The twelfth house describes endings and release: solitude, sleep and dreams, distant places, institutions, expenses, compassion, and contemplative freedom.",
    constructiveExpression: "Restorative retreat, conscious generosity, and the wisdom to release what has completed its purpose.",
    growthQuestion: "What can I release so that rest, compassion, or spiritual attention has room to deepen?",
  },
] as const satisfies readonly HouseMeaning[];

export interface GrahaArchetype {
  id: GrahaId;
  name: string;
  sanskritName: string;
  domain: string;
  constructive: string;
  shadow: string;
  color: string;
}

export const GRAHA_ARCHETYPES: Readonly<Record<GrahaId, GrahaArchetype>> = {
  sun: { id: "sun", name: "Sun", sanskritName: "Surya", domain: "identity, purpose, vitality, and authority", constructive: "integrity, confidence, and principled leadership", shadow: "pride, rigidity, or dependence on recognition", color: "#fbbf24" },
  moon: { id: "moon", name: "Moon", sanskritName: "Chandra", domain: "mind, feeling, memory, and nourishment", constructive: "receptivity, care, and emotional intelligence", shadow: "reactivity, dependency, or fluctuating focus", color: "#e2e8f0" },
  mercury: { id: "mercury", name: "Mercury", sanskritName: "Budha", domain: "reason, language, trade, and adaptation", constructive: "discernment, curiosity, and articulate exchange", shadow: "over-analysis, nervousness, or cleverness without grounding", color: "#4ade80" },
  venus: { id: "venus", name: "Venus", sanskritName: "Shukra", domain: "relationship, pleasure, art, and agreement", constructive: "grace, affection, creativity, and diplomacy", shadow: "indulgence, avoidance, or approval-seeking", color: "#f9a8d4" },
  mars: { id: "mars", name: "Mars", sanskritName: "Mangala", domain: "action, courage, protection, and conflict", constructive: "initiative, precision, stamina, and brave boundaries", shadow: "haste, anger, combativeness, or burnout", color: "#fb7185" },
  jupiter: { id: "jupiter", name: "Jupiter", sanskritName: "Guru", domain: "wisdom, expansion, ethics, and guidance", constructive: "generosity, faith, good counsel, and broad understanding", shadow: "excess, dogmatism, or optimism without proportion", color: "#fde047" },
  saturn: { id: "saturn", name: "Saturn", sanskritName: "Shani", domain: "time, duty, limits, labor, and maturity", constructive: "patience, realism, endurance, and earned authority", shadow: "fear, isolation, scarcity, or excessive severity", color: "#60a5fa" },
  rahu: { id: "rahu", name: "Rahu", sanskritName: "Rahu", domain: "appetite, novelty, amplification, and worldly ambition", constructive: "innovation, unconventional reach, and willingness to cross boundaries", shadow: "obsession, distortion, instability, or never-enough striving", color: "#a78bfa" },
  ketu: { id: "ketu", name: "Ketu", sanskritName: "Ketu", domain: "release, instinct, severance, and inward insight", constructive: "discernment, spiritual independence, and concentrated perception", shadow: "disconnection, abrupt rejection, or difficulty sustaining worldly engagement", color: "#fb923c" },
};

type HouseEffectTuple = readonly [string, string, string, string, string, string, string, string, string, string, string, string];

/** House-specific traditional themes. Interpretation remains contextual, not predictive. */
export const PLANET_IN_HOUSE_EFFECTS: Readonly<Record<GrahaId, HouseEffectTuple>> = {
  sun: [
    "A visible, self-directed presence seeks to lead; healthy confidence grows when identity is anchored in purpose rather than applause.",
    "Resources, voice, and family values become places to establish dignity; measured speech prevents authority from sounding absolute.",
    "Initiative and communication carry conviction, favoring self-taught skill; listening keeps courage from becoming one-sided assertion.",
    "Private life and belonging are closely tied to pride and purpose; inner security strengthens when leadership also makes room for tenderness.",
    "Creative intelligence wants recognition and responsible expression, often through teaching, study, children, or a personally meaningful craft.",
    "Identity is forged through work, service, and overcoming obstacles; sustainable routines keep the drive to prove oneself from exhausting vitality.",
    "Partnership mirrors questions of autonomy and authority; mutual respect grows when neither person must orbit the other.",
    "Purpose develops through deep change, research, or shared-resource questions; humility makes vulnerability a source of strength.",
    "Principles, teachers, and higher learning illuminate life direction; confidence is strongest when beliefs remain open to lived evidence.",
    "Public contribution and leadership are emphasized, with visibility increasing the need for ethical responsibility and a humane use of power.",
    "Aspirations and networks can bring recognition; leadership flourishes when collective gains matter as much as personal status.",
    "Purpose may mature in retreat, distant settings, or service behind the scenes; conscious rest prevents isolation from dimming vitality.",
  ],
  moon: [
    "Feeling and perception are immediately visible, creating responsiveness and adaptability; emotional boundaries help preserve a stable sense of self.",
    "Security is sought through family, food, savings, and a resonant voice; mindful consumption steadies changing needs.",
    "The mind learns through movement, conversation, and repetition, often sensitizing sibling dynamics; consistent practice contains scattered attention.",
    "Home, memory, and caregiving strongly shape contentment; a nourishing private rhythm becomes the base for outer life.",
    "Imagination, affection, and pattern-recognition animate study, romance, or parenting; emotional steadiness helps creative work ripen.",
    "Mood responds to work and health rhythms, making supportive routines especially important; service can channel sensitivity into practical care.",
    "Emotional needs become clear through close bonds and public exchange; reciprocal care works better than expecting a partner to regulate every feeling.",
    "Intuition is drawn to hidden emotional currents, shared resources, and transition; trusted support helps intensity become insight rather than anxiety.",
    "Meaning is felt as much as reasoned, favoring travel, story, teaching, or devotion; discernment protects against adopting a belief only for belonging.",
    "The public readily perceives sensitivity and care, supporting people-centered work; private restoration keeps reputation from governing mood.",
    "Friends and communities influence hopes and emotional wellbeing; belonging deepens when popularity is not confused with intimacy.",
    "A porous inner world favors dream, compassion, retreat, or foreign residence; sleep and boundaries are essential forms of emotional hygiene.",
  ],
  mercury: [
    "Identity is expressed through thought, humor, language, and versatility; embodiment helps the quick mind avoid living only in analysis.",
    "Speech, calculation, commerce, and adaptable resource strategies are emphasized; clarity about values keeps clever choices trustworthy.",
    "Communication, writing, tools, and self-directed learning are natural arenas of strength, especially when curiosity is organized into practice.",
    "The mind works actively around home, education, and private decisions; naming feelings directly prevents intellect from substituting for emotional contact.",
    "Study, teaching, games, analysis, and inventive creativity are enlivened; depth grows by staying with one question beyond its first novelty.",
    "Detailed problem-solving supports work, health tracking, and service; nervous overload eases when efficiency includes rest.",
    "Dialogue and negotiation are central to partnership and client work; agreements benefit from plain language as well as charm.",
    "Research, psychology, confidential information, and shared accounts attract the investigative mind; ethical discretion is indispensable.",
    "Philosophy, languages, publication, and travel broaden reason; wisdom appears when information is integrated rather than merely collected.",
    "Communication, analytics, business, or coordination can define vocation; credibility grows through consistent follow-through.",
    "Networks circulate ideas and opportunities quickly, supporting commerce and collaborative goals; selectivity keeps connection from becoming noise.",
    "Thought turns inward toward imagination, institutions, distant cultures, or contemplation; journaling and quiet structure can translate subtle ideas into form.",
  ],
  venus: [
    "Grace, sociability, aesthetic sensitivity, and a desire for harmony color the presentation; honest preference keeps charm from hiding the self.",
    "Beauty, food, voice, family bonds, and financial comfort receive attention; durable pleasure follows values-based spending.",
    "Artful communication and cooperative skill-building support writing, design, media, or sibling rapport; courage grows through tactful directness.",
    "A beautiful, relationally warm home supports happiness; peace becomes genuine when conflict is addressed rather than decorated over.",
    "Romance, art, performance, learning, and affection for children are fertile fields; creative discipline gives pleasure lasting shape.",
    "Diplomacy improves service and workplace relationships, while attention to bodily balance supports health; over-accommodation can create hidden resentment.",
    "Partnership, agreement, and attraction are prominent, favoring cooperation; mature love includes boundaries and the capacity to tolerate difference.",
    "Intimacy and shared resources seek trust, beauty, and emotional depth; transparent agreements protect against entanglement or avoidance.",
    "Love of culture, philosophy, teachers, or distant places broadens values; ideals become wiser when they include ordinary relational work.",
    "Public roles may involve art, design, counsel, hospitality, negotiation, or relationship-building; substance must accompany appeal.",
    "Friends, patrons, and collaborative communities can support gains and aspirations; reciprocal values matter more than social polish alone.",
    "Pleasure and relationship may connect with retreat, imagination, foreign places, or compassionate service; clear limits prevent costly idealization.",
  ],
  mars: [
    "Action, competition, and independence are readily visible, giving courage and physical drive; tactical patience makes force more effective.",
    "Effort is directed toward earning, defending values, and forceful speech; financial strategy and a pause before speaking reduce unnecessary conflict.",
    "Initiative, technical skill, enterprise, and brave communication are strengthened; respectful rivalry keeps momentum constructive.",
    "Energy focuses on home, land, protection, and private autonomy; physical outlets help domestic frustration become purposeful action.",
    "Competitive intelligence and bold creativity support sport, engineering, debate, or enterprise; play benefits from patience with different learning styles.",
    "Mars meets a natural field in challenge, service, training, and competition, favoring decisive problem-solving when effort is paced and ethically directed.",
    "Partnership carries heat, candor, and strong desire; collaborative goals and fair conflict rules prevent chemistry from becoming combat.",
    "Courage enters crisis, surgery, research, and joint-resource matters; preparation and consent are crucial wherever stakes run high.",
    "Conviction fuels study, advocacy, travel, and disciplined practice; humility keeps principled action from hardening into crusade.",
    "Ambition and executive force favor demanding work and leadership; strategic pacing and respect for colleagues sustain achievement.",
    "Goals are pursued energetically through teams and networks; shared missions work best when competition does not fracture community.",
    "Energy may operate behind the scenes, abroad, in institutions, or through spiritual discipline; recovery and conscious anger work prevent depletion.",
  ],
  jupiter: [
    "A broad, hopeful, counsel-giving presence seeks meaning and growth; grounded proportion keeps confidence credible.",
    "Knowledge, ethical values, supportive family culture, and resource growth are emphasized; generosity is strongest when paired with stewardship.",
    "Teaching, writing, mentoring siblings or peers, and expanding practical skills are favored; repetition turns broad ideas into competence.",
    "Home, education, family wisdom, and inner faith can become sources of support; genuine contentment needs emotional presence as well as ideals.",
    "Learning, counsel, children, creativity, and discernment receive expansive attention; humility protects wisdom from becoming certainty.",
    "Service and problem-solving gain ethics and perspective, potentially supporting healing or teaching roles; realistic routines check overextension.",
    "Partnership can be a field of mutual growth, guidance, and fairness; listening prevents goodwill from slipping into unsolicited instruction.",
    "Research, inheritance, healing, and philosophical engagement with change can deepen wisdom; practical transparency anchors trust.",
    "Jupiter strongly resonates with teachers, dharma, higher study, and long journeys, amplifying perspective when beliefs remain ethically embodied.",
    "Vocation may involve counsel, education, law, strategy, stewardship, or principled leadership; promises should remain proportionate to delivery.",
    "Supportive networks, patrons, teaching communities, and long-range aims can increase gains; shared benefit gives success coherence.",
    "Compassion, contemplation, foreign experience, and charitable expenditure may expand inner life; discernment keeps generosity sustainable.",
  ],
  saturn: [
    "A serious, observant, self-controlled presence develops through responsibility; self-respect grows by valuing gradual progress rather than rehearsing inadequacy.",
    "Resources, family duties, and speech invite patience and long-term structure; scarcity fears soften through consistent stewardship.",
    "Skills and courage mature through repetition, disciplined communication, and sustained effort; comparison with peers need not define the pace.",
    "Home, care, property, or emotional security may feel weighty, making deliberate foundations important; warmth belongs alongside duty.",
    "Creativity, study, romance, or parenting ask for patience and craft; joy becomes durable when it is practiced rather than postponed.",
    "Saturn supports disciplined service, systems, health routines, and endurance with difficult tasks; rigidity must not replace responsive care.",
    "Partnership is treated seriously and tested by time, duty, or boundaries; reliability becomes intimate when emotional availability accompanies commitment.",
    "Long processes of change, shared obligations, research, or grief build depth; asking for support prevents resilience from becoming isolation.",
    "Beliefs, higher study, teachers, and travel mature through testing and sustained practice; skepticism is useful when it remains open to meaning.",
    "Career, responsibility, administration, and earned authority are emphasized, often rewarding patient construction more than quick recognition.",
    "Networks and gains develop slowly through dependable contribution; fewer durable alliances may matter more than broad approval.",
    "Solitude, institutions, distant residence, or contemplative discipline can carry duty and depth; intentional connection protects against withdrawal.",
  ],
  rahu: [
    "Identity and presentation become experimental, ambitious, or difficult to categorize; grounding reduces dependence on reinvention and external fascination.",
    "Strong appetite surrounds wealth, speech, family status, or unusual resources; transparent values help separate innovation from compulsion.",
    "Media, technology, persuasion, travel, and bold self-made skills receive restless momentum; verification keeps reach from outrunning accuracy.",
    "Home, roots, property, and emotional security may involve foreign, unusual, or rapidly changing circumstances; simple routines restore belonging.",
    "Creative risk, performance, romance, intelligence, or recognition can become compelling; process matters when outcomes feel addictive.",
    "Rahu intensifies competition, complex work, health experimentation, and the drive to solve difficult problems; evidence and moderation contain excess.",
    "Partnership and public exchange can feel magnetic, unconventional, or status-laden; clarity prevents projection from masquerading as destiny.",
    "Hidden systems, taboo subjects, technology, shared assets, or crisis can fascinate; ethics and trusted counsel are essential amid intensity.",
    "Foreign philosophies, influential teachers, travel, publication, or certainty may become powerful ambitions; intellectual humility counters grand narratives.",
    "Public reach, unconventional vocation, visibility, and appetite for achievement are amplified; a stable ethical compass helps success remain coherent.",
    "Large networks, digital communities, social influence, and ambitious gains are energized; meaningful allies help distinguish aspiration from endless escalation.",
    "Foreign settings, institutions, altered states, retreat, expense, or imagination are intensified; boundaries and sleep protect psychological clarity.",
  ],
  ketu: [
    "Identity carries inwardness, instinct, or a sense of being unlike the presented role; embodied participation balances self-observation.",
    "Speech, family patterns, food, or resources may be approached with detachment or unusual acuity; consistent care prevents neglect of practical needs.",
    "Skills can feel intuitive and self-contained, favoring concise communication or concentrated craft; collaboration widens what instinct already knows.",
    "Roots and private life may feel spiritually charged, mobile, or hard to define; chosen rituals can create a grounded sense of home.",
    "Creativity, study, romance, or parenting carry past familiarity and selective intensity; staying present keeps discernment from becoming disengagement.",
    "Ketu cuts through problems and can bring austere focus to service or health; nuanced routines are safer than abrupt rejection of ordinary care.",
    "Partnership prompts detachment from projection and conventional scripts; emotional presence makes independence compatible with intimacy.",
    "Research, transformation, hidden knowledge, and release strongly resonate, giving penetrating insight when isolation and fatalism are avoided.",
    "Inherited philosophy and spiritual practice may feel deeply familiar; lived inquiry keeps insight from becoming disinterest in other perspectives.",
    "Public roles can feel insufficient unless aligned with inner purpose, favoring specialized or behind-the-scenes mastery; contribution still needs visible continuity.",
    "Selective friendships and non-attachment to gains can clarify collective purpose; remaining engaged prevents discernment from turning into social absence.",
    "Ketu resonates with retreat, contemplation, release, and subtle perception; grounding, care, and ordinary connection keep solitude integrated.",
  ],
};

export interface PlanetHouseInterpretation {
  planet: GrahaArchetype;
  house: HouseMeaning;
  effect: string;
  synthesis: string;
}

export function getHouseMeaning(number: HouseNumber): HouseMeaning {
  const house = HOUSE_MEANINGS[number - 1];
  if (!house) throw new RangeError(`Unknown house number: ${number}.`);
  return house;
}

export function interpretPlanetInHouse(id: GrahaId, houseNumber: HouseNumber): PlanetHouseInterpretation {
  const planet = GRAHA_ARCHETYPES[id];
  const house = getHouseMeaning(houseNumber);
  const effect = PLANET_IN_HOUSE_EFFECTS[id][houseNumber - 1];

  return {
    planet,
    house,
    effect,
    synthesis: `${planet.name} brings ${planet.domain} into ${house.theme}. At its most constructive this supports ${planet.constructive}; watch for ${planet.shadow}.`,
  };
}

export interface NakshatraProfile {
  index: number;
  name: NakshatraName;
  lord: GrahaId;
  deity: string;
  symbol: string;
  motivation: string;
  essence: string;
  gifts: readonly string[];
  shadows: readonly string[];
}

export const NAKSHATRA_PROFILES = [
  { index: 0, name: "Ashwini", lord: "ketu", deity: "Ashwini Kumaras", symbol: "Horse's head", motivation: "Dharma", essence: "Swift beginnings, healing initiative, and an instinct to restore movement.", gifts: ["speed", "courage", "healing instinct"], shadows: ["impatience", "unfinished starts"] },
  { index: 1, name: "Bharani", lord: "venus", deity: "Yama", symbol: "Womb", motivation: "Artha", essence: "Creative containment, endurance, and responsibility for consequential choices.", gifts: ["resilience", "creative power", "loyalty"], shadows: ["intensity", "control"] },
  { index: 2, name: "Krittika", lord: "sun", deity: "Agni", symbol: "Flame or blade", motivation: "Kama", essence: "Purification, discernment, and the courage to separate what nourishes from what does not.", gifts: ["clarity", "protection", "refinement"], shadows: ["sharp criticism", "severity"] },
  { index: 3, name: "Rohini", lord: "moon", deity: "Prajapati", symbol: "Ox cart", motivation: "Moksha", essence: "Growth through beauty, cultivation, embodiment, and fertile imagination.", gifts: ["creativity", "magnetism", "cultivation"], shadows: ["attachment", "possessiveness"] },
  { index: 4, name: "Mrigashira", lord: "mars", deity: "Soma", symbol: "Deer's head", motivation: "Moksha", essence: "A searching, gentle intelligence drawn toward discovery, connection, and the next clue.", gifts: ["curiosity", "adaptability", "research"], shadows: ["restlessness", "elusiveness"] },
  { index: 5, name: "Ardra", lord: "rahu", deity: "Rudra", symbol: "Teardrop", motivation: "Kama", essence: "Truth discovered through storms, emotional honesty, and the dismantling of stale structures.", gifts: ["depth", "technical insight", "renewal"], shadows: ["turbulence", "harshness"] },
  { index: 6, name: "Punarvasu", lord: "jupiter", deity: "Aditi", symbol: "Quiver of arrows", motivation: "Artha", essence: "Return to wholeness, restorative optimism, and the ability to begin again wisely.", gifts: ["renewal", "generosity", "perspective"], shadows: ["repetition", "overconfidence"] },
  { index: 7, name: "Pushya", lord: "saturn", deity: "Brihaspati", symbol: "Cow's udder", motivation: "Dharma", essence: "Nourishment through discipline, teaching, stewardship, and dependable care.", gifts: ["support", "devotion", "responsibility"], shadows: ["self-denial", "rigidity"] },
  { index: 8, name: "Ashlesha", lord: "mercury", deity: "Nagas", symbol: "Coiled serpent", motivation: "Dharma", essence: "Penetrating perception, strategic communication, and sensitivity to hidden bonds.", gifts: ["intuition", "strategy", "psychological insight"], shadows: ["entanglement", "suspicion"] },
  { index: 9, name: "Magha", lord: "ketu", deity: "Pitris", symbol: "Royal throne", motivation: "Artha", essence: "Ancestral dignity, stewardship of legacy, and responsibility within lineage or institution.", gifts: ["leadership", "tradition", "dignity"], shadows: ["status-consciousness", "authoritarianism"] },
  { index: 10, name: "Purva Phalguni", lord: "venus", deity: "Bhaga", symbol: "Front legs of a bed", motivation: "Kama", essence: "Pleasure, creativity, affection, and the renewal that follows genuine relaxation.", gifts: ["warmth", "artistry", "hospitality"], shadows: ["indulgence", "avoidance"] },
  { index: 11, name: "Uttara Phalguni", lord: "sun", deity: "Aryaman", symbol: "Back legs of a bed", motivation: "Moksha", essence: "Sustained alliance, generous patronage, and commitments that outlast initial attraction.", gifts: ["reliability", "friendship", "service"], shadows: ["obligation", "need for recognition"] },
  { index: 12, name: "Hasta", lord: "moon", deity: "Savitar", symbol: "Hand", motivation: "Moksha", essence: "Skillful hands, practical intelligence, humor, and the ability to bring ideas within reach.", gifts: ["dexterity", "craft", "resourcefulness"], shadows: ["control", "restless busyness"] },
  { index: 13, name: "Chitra", lord: "mars", deity: "Tvashtar", symbol: "Bright jewel", motivation: "Kama", essence: "Brilliant form-making, design intelligence, and the urge to shape a distinctive life.", gifts: ["design", "charisma", "precision"], shadows: ["image-focus", "perfectionism"] },
  { index: 14, name: "Swati", lord: "rahu", deity: "Vayu", symbol: "Young shoot in wind", motivation: "Artha", essence: "Independent movement, negotiation, and flexibility that learns balance through change.", gifts: ["adaptability", "diplomacy", "independence"], shadows: ["dispersion", "indecision"] },
  { index: 15, name: "Vishakha", lord: "jupiter", deity: "Indra-Agni", symbol: "Triumphal arch", motivation: "Dharma", essence: "Focused aspiration, purposeful competition, and commitment to a chosen destination.", gifts: ["determination", "persuasion", "goal focus"], shadows: ["fixation", "rivalry"] },
  { index: 16, name: "Anuradha", lord: "saturn", deity: "Mitra", symbol: "Lotus", motivation: "Dharma", essence: "Devotion, friendship, organization, and the capacity to thrive across distance or difference.", gifts: ["loyalty", "cooperation", "discipline"], shadows: ["over-accommodation", "emotional reserve"] },
  { index: 17, name: "Jyeshtha", lord: "mercury", deity: "Indra", symbol: "Earring or umbrella", motivation: "Artha", essence: "Protective seniority, strategic competence, and responsibility under pressure.", gifts: ["resourcefulness", "protection", "command"], shadows: ["defensiveness", "superiority"] },
  { index: 18, name: "Mula", lord: "ketu", deity: "Nirriti", symbol: "Bundle of roots", motivation: "Kama", essence: "Radical inquiry that goes to the root, releases illusion, and rebuilds from truth.", gifts: ["investigation", "courage", "transformation"], shadows: ["destructiveness", "rootlessness"] },
  { index: 19, name: "Purva Ashadha", lord: "venus", deity: "Apas", symbol: "Winnowing basket", motivation: "Moksha", essence: "Persuasive conviction, cleansing renewal, and values defended with creative passion.", gifts: ["inspiration", "persuasion", "resilience"], shadows: ["invincibility", "argumentativeness"] },
  { index: 20, name: "Uttara Ashadha", lord: "sun", deity: "Vishvadevas", symbol: "Elephant tusk", motivation: "Moksha", essence: "Enduring victory through universal principles, patient leadership, and accountable action.", gifts: ["integrity", "persistence", "leadership"], shadows: ["inflexibility", "heavy responsibility"] },
  { index: 21, name: "Shravana", lord: "moon", deity: "Vishnu", symbol: "Ear", motivation: "Artha", essence: "Learning through listening, transmission, pathways, and careful attention to what connects people.", gifts: ["listening", "learning", "communication"], shadows: ["gossip", "over-concern with reputation"] },
  { index: 22, name: "Dhanishtha", lord: "mars", deity: "Vasus", symbol: "Drum", motivation: "Dharma", essence: "Rhythm, prosperity, performance, and coordinated action in service of a group.", gifts: ["timing", "leadership", "generosity"], shadows: ["status pursuit", "emotional distance"] },
  { index: 23, name: "Shatabhisha", lord: "rahu", deity: "Varuna", symbol: "Empty circle", motivation: "Dharma", essence: "Independent healing inquiry, systems thinking, privacy, and truth beyond convention.", gifts: ["research", "healing", "originality"], shadows: ["isolation", "over-intellectualization"] },
  { index: 24, name: "Purva Bhadrapada", lord: "jupiter", deity: "Aja Ekapada", symbol: "Front legs of a funeral cot", motivation: "Artha", essence: "Fierce idealism, inner fire, and the willingness to confront profound contradictions.", gifts: ["vision", "devotion", "transformative speech"], shadows: ["extremity", "gloom"] },
  { index: 25, name: "Uttara Bhadrapada", lord: "saturn", deity: "Ahir Budhnya", symbol: "Back legs of a funeral cot", motivation: "Kama", essence: "Deep composure, compassion, and patient contact with the hidden foundations of life.", gifts: ["steadiness", "wisdom", "compassion"], shadows: ["inertia", "withdrawal"] },
  { index: 26, name: "Revati", lord: "mercury", deity: "Pushan", symbol: "Fish or journey", motivation: "Moksha", essence: "Safe passage, nourishment, imagination, and the completion of one journey before another begins.", gifts: ["guidance", "kindness", "creativity"], shadows: ["drifting", "over-idealization"] },
] as const satisfies readonly NakshatraProfile[];

export function getNakshatraProfile(nameOrIndex: NakshatraName | number): NakshatraProfile {
  const profile = typeof nameOrIndex === "number"
    ? NAKSHATRA_PROFILES[nameOrIndex]
    : NAKSHATRA_PROFILES.find((candidate) => candidate.name === nameOrIndex);
  if (!profile) throw new RangeError(`Unknown nakshatra: ${String(nameOrIndex)}.`);
  return profile;
}

interface RasiTemperament {
  sign: RasiName;
  orientation: string;
  strength: string;
  growthEdge: string;
}

const RASI_TEMPERAMENTS: Readonly<Record<RasiName, RasiTemperament>> = {
  Aries: { sign: "Aries", orientation: "direct, initiating, and challenge-ready", strength: "decisive momentum", growthEdge: "making room for timing and collaboration" },
  Taurus: { sign: "Taurus", orientation: "steady, sensory, and continuity-seeking", strength: "patient cultivation", growthEdge: "adapting before stability becomes stagnation" },
  Gemini: { sign: "Gemini", orientation: "curious, connective, and mentally mobile", strength: "versatile communication", growthEdge: "turning variety into sustained understanding" },
  Cancer: { sign: "Cancer", orientation: "protective, receptive, and belonging-centered", strength: "attuned care", growthEdge: "maintaining boundaries while remaining open" },
  Leo: { sign: "Leo", orientation: "expressive, dignified, and creatively self-directed", strength: "heart-led leadership", growthEdge: "sharing the stage without shrinking" },
  Virgo: { sign: "Virgo", orientation: "observant, practical, and improvement-minded", strength: "precise service", growthEdge: "allowing wholeness before perfection" },
  Libra: { sign: "Libra", orientation: "relational, balancing, and aesthetically aware", strength: "fair-minded cooperation", growthEdge: "choosing clearly when harmony is unavailable" },
  Scorpio: { sign: "Scorpio", orientation: "intense, private, and transformation-oriented", strength: "emotional courage", growthEdge: "trusting without controlling outcomes" },
  Sagittarius: { sign: "Sagittarius", orientation: "exploratory, candid, and meaning-seeking", strength: "inspiring perspective", growthEdge: "grounding convictions in detail and listening" },
  Capricorn: { sign: "Capricorn", orientation: "strategic, responsible, and achievement-aware", strength: "durable construction", growthEdge: "including vulnerability and rest in success" },
  Aquarius: { sign: "Aquarius", orientation: "independent, systemic, and community-minded", strength: "original social intelligence", growthEdge: "bringing ideals into warm personal contact" },
  Pisces: { sign: "Pisces", orientation: "imaginative, compassionate, and boundary-sensitive", strength: "intuitive synthesis", growthEdge: "giving inspiration practical form and limits" },
};

export interface PersonalitySynthesis {
  headline: string;
  summary: string;
  strengths: readonly string[];
  growthEdges: readonly string[];
  ascendantSign: RasiName;
  moonNakshatra: NakshatraName;
}

export function synthesizePersonality(ascendantSign: RasiName, moonNakshatra: NakshatraName): PersonalitySynthesis {
  const ascendant = RASI_TEMPERAMENTS[ascendantSign];
  const moon = getNakshatraProfile(moonNakshatra);
  return {
    headline: `${getRasiDisplayName(ascendantSign)} rising · ${moonNakshatra} Moon`,
    summary: `A ${ascendant.orientation} way of meeting life combines with ${moon.essence.toLowerCase()} This can make ${ascendant.strength} most convincing when it is supported by ${moon.gifts[0]} and ${moon.gifts[1]}.`,
    strengths: [ascendant.strength, ...moon.gifts],
    growthEdges: [ascendant.growthEdge, ...moon.shadows],
    ascendantSign,
    moonNakshatra,
  };
}

export interface CorePlacementSummary {
  label: "Ascendant" | "Sun" | "Moon";
  sign: RasiName;
  degreeDeg: number;
  formattedDegree: string;
  nakshatra: NakshatraName;
  pada: Pada;
  house: HouseNumber | null;
}

export interface CoreSummary {
  ascendant: CorePlacementSummary;
  sun: CorePlacementSummary;
  moon: CorePlacementSummary;
  birthNakshatra: NakshatraProfile;
  personality: PersonalitySynthesis;
}

function requirePlanet(chart: VedicChart, id: GrahaId): GrahaPosition {
  const planet = chart.planets.find((candidate) => candidate.id === id);
  if (!planet) throw new RangeError(`Chart is missing ${id}.`);
  return planet;
}

export function formatDegreeMinute(degreeDeg: number): string {
  if (!Number.isFinite(degreeDeg)) throw new TypeError("degreeDeg must be finite.");
  const normalized = ((degreeDeg % 30) + 30) % 30;
  const totalArcMinutes = Math.floor(normalized * 60 + 1e-9);
  return `${Math.floor(totalArcMinutes / 60)}° ${String(totalArcMinutes % 60).padStart(2, "0")}′`;
}

function corePlacement(label: CorePlacementSummary["label"], placement: VedicChart["ascendant"] | GrahaPosition, house: HouseNumber | null): CorePlacementSummary {
  return {
    label,
    sign: placement.sign.name,
    degreeDeg: placement.sign.degreeDeg,
    formattedDegree: formatDegreeMinute(placement.sign.degreeDeg),
    nakshatra: placement.nakshatra.name,
    pada: placement.nakshatra.pada,
    house,
  };
}

export function getCoreSummary(chart: VedicChart): CoreSummary {
  const sun = requirePlanet(chart, "sun");
  const moon = requirePlanet(chart, "moon");
  return {
    ascendant: corePlacement("Ascendant", chart.ascendant, 1),
    sun: corePlacement("Sun", sun, sun.house),
    moon: corePlacement("Moon", moon, moon.house),
    birthNakshatra: getNakshatraProfile(moon.nakshatra.name),
    personality: synthesizePersonality(chart.ascendant.sign.name, moon.nakshatra.name),
  };
}

export interface PlanetPositionRow {
  id: GrahaId;
  planet: string;
  rasi: RasiName;
  degreeDeg: number;
  degreeMinute: string;
  absoluteLongitudeDeg: number;
  nakshatra: NakshatraName;
  nakshatraLord: GrahaId;
  pada: Pada;
  house: HouseNumber;
  motion: Motion;
  retrograde: boolean;
  speedDegPerDay: number;
}

export function getPlanetPositionRows(chart: VedicChart): PlanetPositionRow[] {
  return GRAHA_IDS.map((id) => requirePlanet(chart, id)).map((planet) => ({
    id: planet.id,
    planet: planet.name,
    rasi: planet.sign.name,
    degreeDeg: planet.sign.degreeDeg,
    degreeMinute: formatDegreeMinute(planet.sign.degreeDeg),
    absoluteLongitudeDeg: planet.siderealLongitudeDeg,
    nakshatra: planet.nakshatra.name,
    nakshatraLord: planet.nakshatra.lord,
    pada: planet.nakshatra.pada,
    house: planet.house,
    motion: planet.motion,
    retrograde: planet.retrograde,
    speedDegPerDay: planet.speedDegPerDay,
  }));
}

export interface HouseAnalysis {
  number: HouseNumber;
  sign: RasiName;
  meaning: HouseMeaning;
  planets: readonly GrahaPosition[];
  planetEffects: readonly PlanetHouseInterpretation[];
  summary: string;
}

export function buildHouseAnalyses(chart: VedicChart): HouseAnalysis[] {
  return chart.houses.map((house) => {
    const planets = house.planets.map((id) => requirePlanet(chart, id));
    return {
      number: house.number,
      sign: house.sign.name,
      meaning: getHouseMeaning(house.number),
      planets,
      planetEffects: planets.map((planet) => interpretPlanetInHouse(planet.id, house.number)),
      summary: planets.length === 0
        ? `No classical graha occupies this whole-sign house. Its ${getHouseMeaning(house.number).theme} remain part of the chart and are read through the sign, its ruler, and timing factors.`
        : `${planets.map((planet) => planet.name).join(" and ")} emphasize ${getHouseMeaning(house.number).theme}.`,
    };
  });
}

export const VIMSHOTTARI_SEQUENCE = [
  { lord: "ketu", years: 7 },
  { lord: "venus", years: 20 },
  { lord: "sun", years: 6 },
  { lord: "moon", years: 10 },
  { lord: "mars", years: 7 },
  { lord: "rahu", years: 18 },
  { lord: "jupiter", years: 16 },
  { lord: "saturn", years: 19 },
  { lord: "mercury", years: 17 },
] as const satisfies readonly { lord: GrahaId; years: number }[];

export type DashaLord = (typeof VIMSHOTTARI_SEQUENCE)[number]["lord"];
export const VIMSHOTTARI_TOTAL_YEARS = 120;
/** This basic implementation uses the conventional 365.25-day Julian year. */
export const VIMSHOTTARI_YEAR_DAYS = 365.25;
export const VIMSHOTTARI_YEAR_MS = VIMSHOTTARI_YEAR_DAYS * 24 * 60 * 60 * 1000;
const NAKSHATRA_SIZE_DEG = 360 / 27;

export interface DashaCombinationInterpretation {
  majorLord: DashaLord;
  minorLord: DashaLord;
  headline: string;
  summary: string;
  majorTheme: string;
  minorTheme: string;
  constructivePotential: string;
  caution: string;
  reflection: string;
}

const DASHA_IMMEDIATE_FOCUS: Readonly<Record<DashaLord, string>> = {
  sun: "clarifying purpose, visibility, leadership, vitality, and the relationship with authority",
  moon: "emotional needs, home rhythms, care, memory, belonging, and the quality of daily responsiveness",
  mercury: "learning, writing, analysis, communication, trade, decisions, and adaptable problem-solving",
  venus: "relationship, agreement, values, art, pleasure, diplomacy, and the balance between enjoyment and commitment",
  mars: "action, courage, boundaries, technical effort, competition, and the disciplined use of force",
  jupiter: "study, guidance, ethics, teaching, expansion, generosity, and the beliefs that organize growth",
  saturn: "responsibility, limits, sustained work, maturity, structure, and the consequences of long-term choices",
  rahu: "ambition, unfamiliar territory, technology, amplification, appetite, and experiences that stretch established identity",
  ketu: "release, specialization, inward attention, severance, intuitive pattern-recognition, and freedom from stale attachment",
};

const DASHA_REFLECTIONS: Readonly<Record<DashaLord, string>> = {
  sun: "Where can I act with visible integrity without making recognition the measure of worth?",
  moon: "Which rhythm of care and restoration would make my responses steadier?",
  mercury: "What needs to be named, studied, organized, or communicated more precisely?",
  venus: "Which relationship or value becomes healthier through both appreciation and a clear boundary?",
  mars: "What deserves decisive effort, and where would better pacing make courage more effective?",
  jupiter: "Which opportunity genuinely enlarges understanding, and which one is simply excess?",
  saturn: "What patient structure would turn present pressure into durable capacity?",
  rahu: "What is the deeper need beneath the current appetite for novelty, reach, or recognition?",
  ketu: "What can be released without withdrawing from the practical responsibility that remains?",
};

/**
 * Composes the symbolic relationship between a Vimshottari major and minor
 * lord. Natal placements still determine where these themes are expressed.
 */
export function interpretDashaCombination(
  majorLord: DashaLord,
  minorLord: DashaLord,
): DashaCombinationInterpretation {
  const major = GRAHA_ARCHETYPES[majorLord];
  const minor = GRAHA_ARCHETYPES[minorLord];
  const sameLord = majorLord === minorLord;

  return {
    majorLord,
    minorLord,
    headline: `${major.name} Mahadasha · ${minor.name} Antardasha`,
    summary: sameLord
      ? `${major.name} themes are concentrated: the long ${major.domain} chapter and the immediate sub-period point in the same direction. This can make the period feel coherent and emphatic, while also magnifying both its resources and its blind spots.`
      : `${major.name} sets the longer chapter through ${major.domain}. ${minor.name} becomes the nearer-term channel, bringing attention to ${DASHA_IMMEDIATE_FOCUS[minorLord]}. The result is a dialogue between the two natal grahas rather than a standalone prediction.`,
    majorTheme: `${major.name} provides the background agenda: ${major.domain}. Its constructive register is ${major.constructive}.`,
    minorTheme: `${minor.name} describes the active route through that agenda: ${DASHA_IMMEDIATE_FOCUS[minorLord]}.`,
    constructivePotential: `A constructive use of this combination joins ${major.constructive} with ${minor.constructive}. The houses owned and occupied by both lords show where that integration is most relevant.`,
    caution: `Watch for ${major.shadow}${sameLord ? ", especially because the same pattern is being reinforced" : ` interacting with ${minor.shadow}`}. These are reflection points, not promised events.`,
    reflection: DASHA_REFLECTIONS[minorLord],
  };
}

export interface AntardashaPeriod {
  level: "antardasha";
  lord: DashaLord;
  majorLord: DashaLord;
  start: string;
  end: string;
  durationYears: number;
  isCurrent: boolean;
}

export interface MahadashaPeriod {
  level: "mahadasha";
  lord: DashaLord;
  start: string;
  end: string;
  durationYears: number;
  isCurrent: boolean;
  containsBirth: boolean;
  antardashas: readonly AntardashaPeriod[];
}

export interface VimshottariInput {
  birthInstant: Date | string;
  moonSiderealLongitudeDeg: number;
  asOf: Date | string;
}

export interface VimshottariTimeline {
  birthInstant: string;
  asOf: string;
  convention: "365.25-day year";
  moonNakshatra: NakshatraName;
  moonNakshatraIndex: number;
  moonNakshatraProgress: number;
  birthMahadashaLord: DashaLord;
  birthMahadashaElapsedYears: number;
  birthMahadashaBalanceYears: number;
  cycleStart: string;
  cycleEnd: string;
  mahadashas: readonly MahadashaPeriod[];
  currentMahadasha: MahadashaPeriod;
  currentAntardasha: AntardashaPeriod;
}

function instantMilliseconds(value: Date | string, label: string): number {
  const milliseconds = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(milliseconds)) throw new TypeError(`${label} must be a valid instant.`);
  return milliseconds;
}

function iso(milliseconds: number): string {
  return new Date(Math.round(milliseconds)).toISOString();
}

function sequenceFrom(startLord: DashaLord): readonly (typeof VIMSHOTTARI_SEQUENCE)[number][] {
  const startIndex = VIMSHOTTARI_SEQUENCE.findIndex((period) => period.lord === startLord);
  return Array.from({ length: VIMSHOTTARI_SEQUENCE.length }, (_, offset) =>
    VIMSHOTTARI_SEQUENCE[(startIndex + offset) % VIMSHOTTARI_SEQUENCE.length],
  );
}

function containsInstant(startMs: number, endMs: number, instantMs: number): boolean {
  return instantMs >= startMs && instantMs < endMs;
}

function buildAntardashas(majorLord: DashaLord, majorStartMs: number, majorEndMs: number, asOfMs: number): AntardashaPeriod[] {
  const majorYears = VIMSHOTTARI_SEQUENCE.find((period) => period.lord === majorLord)!.years;
  const sequence = sequenceFrom(majorLord);
  let cursor = majorStartMs;

  return sequence.map((period, index) => {
    const durationYears = (majorYears * period.years) / VIMSHOTTARI_TOTAL_YEARS;
    const end = index === sequence.length - 1
      ? majorEndMs
      : Math.round(cursor + durationYears * VIMSHOTTARI_YEAR_MS);
    const antardasha: AntardashaPeriod = {
      level: "antardasha",
      lord: period.lord,
      majorLord,
      start: iso(cursor),
      end: iso(end),
      durationYears,
      isCurrent: containsInstant(cursor, end, asOfMs),
    };
    cursor = end;
    return antardasha;
  });
}

/**
 * Calculates Vimshottari periods from the Moon's exact progress through its
 * birth nakshatra. Periods are half-open: an instant exactly at an end boundary
 * belongs to the next period. A complete 120-year cycle containing `asOf` is
 * returned, so the function also behaves deterministically outside one lifespan.
 */
export function calculateVimshottariTimeline(input: VimshottariInput): VimshottariTimeline {
  const birthMs = instantMilliseconds(input.birthInstant, "birthInstant");
  const asOfMs = instantMilliseconds(input.asOf, "asOf");
  if (!Number.isFinite(input.moonSiderealLongitudeDeg)) {
    throw new TypeError("moonSiderealLongitudeDeg must be finite.");
  }

  const longitude = ((input.moonSiderealLongitudeDeg % 360) + 360) % 360;
  const nakshatraIndex = Math.min(26, Math.floor(longitude / NAKSHATRA_SIZE_DEG));
  const degreeWithinNakshatra = longitude - nakshatraIndex * NAKSHATRA_SIZE_DEG;
  const progress = degreeWithinNakshatra / NAKSHATRA_SIZE_DEG;
  const profile = getNakshatraProfile(nakshatraIndex);
  const birthMajor = VIMSHOTTARI_SEQUENCE.find((period) => period.lord === profile.lord)!;
  const elapsedYears = birthMajor.years * progress;
  const balanceYears = birthMajor.years - elapsedYears;
  const initialCycleStartMs = Math.round(birthMs - elapsedYears * VIMSHOTTARI_YEAR_MS);
  const cycleDurationMs = VIMSHOTTARI_TOTAL_YEARS * VIMSHOTTARI_YEAR_MS;
  const cycleOffset = Math.floor((asOfMs - initialCycleStartMs) / cycleDurationMs);
  const cycleStartMs = Math.round(initialCycleStartMs + cycleOffset * cycleDurationMs);
  const cycleEndMs = Math.round(cycleStartMs + cycleDurationMs);
  const sequence = sequenceFrom(birthMajor.lord);
  let cursor = cycleStartMs;

  const mahadashas = sequence.map((period, index) => {
    const end = index === sequence.length - 1
      ? cycleEndMs
      : Math.round(cursor + period.years * VIMSHOTTARI_YEAR_MS);
    const major: MahadashaPeriod = {
      level: "mahadasha",
      lord: period.lord,
      start: iso(cursor),
      end: iso(end),
      durationYears: period.years,
      isCurrent: containsInstant(cursor, end, asOfMs),
      containsBirth: containsInstant(cursor, end, birthMs),
      antardashas: buildAntardashas(period.lord, cursor, end, asOfMs),
    };
    cursor = end;
    return major;
  });
  const currentMahadasha = mahadashas.find((period) => period.isCurrent);
  const currentAntardasha = currentMahadasha?.antardashas.find((period) => period.isCurrent);
  if (!currentMahadasha || !currentAntardasha) {
    throw new RangeError("Unable to locate the requested instant in the Vimshottari cycle.");
  }

  return {
    birthInstant: iso(birthMs),
    asOf: iso(asOfMs),
    convention: "365.25-day year",
    moonNakshatra: profile.name,
    moonNakshatraIndex: nakshatraIndex,
    moonNakshatraProgress: progress,
    birthMahadashaLord: birthMajor.lord,
    birthMahadashaElapsedYears: elapsedYears,
    birthMahadashaBalanceYears: balanceYears,
    cycleStart: iso(cycleStartMs),
    cycleEnd: iso(cycleEndMs),
    mahadashas,
    currentMahadasha,
    currentAntardasha,
  };
}

export interface ChartAnalysis {
  core: CoreSummary;
  positions: readonly PlanetPositionRow[];
  houses: readonly HouseAnalysis[];
  dashas: VimshottariTimeline;
}

export function analyzeVedicChart(chart: VedicChart, birthInstant: Date | string, asOf: Date | string): ChartAnalysis {
  const chartInstantMs = instantMilliseconds(chart.instant, "chart.instant");
  const birthInstantMs = instantMilliseconds(birthInstant, "birthInstant");
  if (Math.abs(chartInstantMs - birthInstantMs) > 1) {
    throw new RangeError(
      "Natal analysis requires birthInstant to match the chart instant.",
    );
  }
  const moon = requirePlanet(chart, "moon");
  return {
    core: getCoreSummary(chart),
    positions: getPlanetPositionRows(chart),
    houses: buildHouseAnalyses(chart),
    dashas: calculateVimshottariTimeline({
      birthInstant,
      moonSiderealLongitudeDeg: moon.siderealLongitudeDeg,
      asOf,
    }),
  };
}

export const INTERPRETATION_DISCLAIMER = "Jyotish interpretation is a symbolic tradition, not a scientific personality test or a guarantee of events. Use these themes for reflection rather than medical, legal, financial, or other consequential decisions.";

// Compile-time and runtime alignment checks keep lookup tables synchronized
// with the canonical ephemeris constants.
if (NAKSHATRA_PROFILES.some((profile, index) => profile.name !== NAKSHATRAS[index])) {
  throw new Error("Nakshatra profiles are not aligned with the ephemeris order.");
}

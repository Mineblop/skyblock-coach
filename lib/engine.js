// ---------------------------------------------------------------------------
// SkyBlock Coach — shared rules engine
// Safe to run on BOTH the server and the browser. Contains NO secrets.
// This is the heart of the product: a library of "candidate actions", each of
// which knows whether it applies to a player and how much impact it has.
// Add new game knowledge by appending rules to the RULES array below.
// ---------------------------------------------------------------------------

export const fmt = (n) =>
  n >= 1e9 ? (n / 1e9).toFixed(1) + "B"
  : n >= 1e6 ? (n / 1e6).toFixed(1) + "M"
  : n >= 1e3 ? (n / 1e3).toFixed(0) + "k"
  : String(n);

// ---- sample PlayerStates (also what the normalizer produces) ----
export const SAMPLES = {
  early: {
    name: "FreshSpawn", sbLevel: 8, stage: "early",
    purse: 34000, bank: 120000, networth: 0.9e6,
    skills: { combat: 6, farming: 9, mining: 7, foraging: 5, avg: 6.4 },
    slayers: { zombie: 0, spider: 0, wolf: 0 }, catacombs: 0,
    magicalPower: 12, hotmTier: 0,
    weapon: "Rogue Sword", armor: "Hardened Diamond", pet: null, minionSlots: 6, fairySouls: 12,
  },
  mid: {
    name: "GrindArc", sbLevel: 24, stage: "mid",
    purse: 2.1e6, bank: 41e6, networth: 180e6,
    skills: { combat: 24, farming: 22, mining: 26, foraging: 18, avg: 23 },
    slayers: { zombie: 5, spider: 4, wolf: 3 }, catacombs: 12,
    magicalPower: 410, hotmTier: 4,
    weapon: "Livid Dagger", armor: "Shadow Assassin", pet: "Epic Ender Dragon", minionSlots: 19, fairySouls: 180,
  },
  late: {
    name: "EndgameKing", sbLevel: 41, stage: "late",
    purse: 88e6, bank: 2.4e9, networth: 6.8e9,
    skills: { combat: 44, farming: 39, mining: 45, foraging: 35, avg: 41 },
    slayers: { zombie: 8, spider: 8, wolf: 7, enderman: 7 }, catacombs: 34,
    magicalPower: 1180, hotmTier: 8,
    weapon: "Terminator", armor: "Necron (max)", pet: "Legendary Golden Dragon", minionSlots: 25, fairySouls: 238,
  },
};

// ---- rule library ----
// Each rule: { id, lens, baseImpact(0-100), applies(state)->bool, build(state)->card }
export const RULES = [
  // ===== EARLY =====
  { id: "first-minions", lens: "coins", baseImpact: 80,
    applies: (s) => s.minionSlots < 11 && s.stage === "early",
    build: () => ({
      title: "Fill and upgrade your minion slots",
      why: "Minions are your passive income backbone — early on nothing compounds faster.",
      cost: "~200k coins", time: "ongoing",
      impact: "Steady offline coins + collection unlocks that gate everything later",
      steps: ["Place minions for collections you already farm (Clay, Tarantula)", "Craft the next tiers with your resources", "Add fuel + a Diamond Spreading"] }) },
  { id: "first-slayer", lens: "power", baseImpact: 78,
    applies: (s) => s.slayers.zombie === 0 && s.sbLevel >= 5,
    build: () => ({
      title: "Do your first Revenant (Zombie) slayer quests",
      why: "Slayers unlock core progression rewards and cheap power spikes — you have zero so far.",
      cost: "a few hundred k", time: "~30 min to T2",
      impact: "Unlocks Revenant drops, first real combat items, and a whole progression track",
      steps: ["Buy a Revenant Falchion from AH", "Spawn a T1 boss in the Graveyard", "Push to T2, then upgrade the sword"] }) },
  { id: "aote", lens: "power", baseImpact: 70,
    applies: (s) => s.stage === "early" && s.magicalPower != null && s.magicalPower < 80,
    build: () => ({
      title: "Get an Aspect of the End (AOTE)",
      why: "The classic early mobility + damage jump — cheap and transforms movement.",
      cost: "~800k coins", time: "buy now",
      impact: "8-block teleport + speed burst; huge quality-of-life and combat step",
      steps: ["Save ~1M coins", "Buy AOTE from the Auction House", "Reforge it for combat"] }) },
  { id: "early-accessories", lens: "power", baseImpact: 60,
    applies: (s) => s.magicalPower != null && s.magicalPower < 120,
    build: (s) => ({
      title: "Build your accessory (talisman) bag",
      why: `Magical Power scales your entire stat sheet — you're at ${s.magicalPower}, low for your stage.`,
      cost: "cheap, mostly shops/drops", time: "a session",
      impact: "Every accessory adds permanent stats; fastest broad power gain early",
      steps: ["Buy common talismans from NPC shops", "Enrich the best ones later", "Add a Talisman Enrichment on your top stat"] }) },

  // ===== MID =====
  { id: "pet-upgrade", lens: "power", baseImpact: 82,
    applies: (s) => s.pet && /Epic Ender Dragon/.test(s.pet),
    build: () => ({
      title: "Upgrade your Ender Dragon pet to Legendary",
      why: "Your combat scales hard off this pet — the Epic→Legendary jump is your biggest single power lever right now.",
      cost: "~24M coins (live AH)", time: "buy, or level up current",
      impact: "+~18% effective combat power, smoother T4 slayers & dungeon DPS",
      steps: ["Buy a Legendary Ender Dragon, or a low-level one to level cheaper", "Level it in Combat XP zones / dungeons", "Slot the right pet item"] }) },
  { id: "catacombs-push", lens: "progression", baseImpact: 85,
    applies: (s) => s.catacombs > 0 && s.catacombs < 20 && s.stage === "mid",
    build: (s) => ({
      title: "Push Catacombs to level 20+",
      why: `Catacombs is the biggest mid-game bottleneck — it gates gear, stats, and the best money methods. You're at ${s.catacombs}.`,
      cost: "time + carries optional", time: "the main grind",
      impact: "Unlocks stronger dungeon gear, higher stats, and master-mode income",
      steps: ["Run F4–F5 for XP and drops", "Get a class to 20+ for the stat bonus", "Buy a cheap dungeon weapon"] }) },
  { id: "money-method-mid", lens: "coins", baseImpact: 80,
    applies: (s) => s.stage === "mid" && s.purse + s.bank < 60e6,
    build: () => ({
      title: "Switch to a stage-appropriate money method",
      why: "Your gear can support far better coins/hr than minions alone — cash flow is your limiter for the next upgrades.",
      cost: "gear you likely already own", time: "per session",
      impact: "~5–15M/hr depending on method vs. passive-only now",
      steps: ["Try Enderman slayer XP + drops if combat allows", "Or Gemstone mining if HotM is 4+", "Reinvest into pet + Catacombs"] }) },
  { id: "hotm-mid", lens: "progression", baseImpact: 66,
    applies: (s) => s.hotmTier > 0 && s.hotmTier < 7 && s.stage === "mid",
    build: (s) => ({
      title: "Advance your Heart of the Mountain",
      why: `HotM tier ${s.hotmTier} unlocks better mining perks and gemstone income — a strong parallel track.`,
      cost: "Mithril/Gemstone powder", time: "ongoing",
      impact: "Unlocks perks, Powder Ghast, and higher gemstone money potential",
      steps: ["Grind Powder in the Crystal Hollows", "Prioritise Mining Speed + Fortune perks", "Unlock Powder Buff & Daily Powder"] }) },

  // ===== LATE =====
  { id: "reforge-audit", lens: "power", baseImpact: 64,
    applies: (s) => s.stage === "late",
    build: () => ({
      title: "Audit reforges, enchants & gemstones for min-maxing",
      why: "At your level the gains are in optimization — small % leaks across gear add up to a real power gap.",
      cost: "~150M for top reforges", time: "a session",
      impact: "Several % more DPS/EHP with no new gear",
      steps: ["Check each piece against current BiS reforge", "Fill empty gemstone slots with the right cut", "Apply any missing top-tier enchants"] }) },
  { id: "master-mode", lens: "coins", baseImpact: 78,
    applies: (s) => s.catacombs >= 30 && s.stage === "late",
    build: (s) => ({
      title: "Run Master Mode dungeons for income + gear",
      why: `You're geared for it (Cata ${s.catacombs}) — M6/M7 are among the best late-game coins and the source of BiS drops.`,
      cost: "gear owned", time: "per run",
      impact: "High-value drops + strong coins/hr",
      steps: ["Form or join an M6 team", "Farm for chest RNG + secrets", "Sell duplicates, keep upgrades"] }) },
  { id: "networth-diversify", lens: "coins", baseImpact: 55,
    applies: (s) => s.networth > 1e9,
    build: (s) => ({
      title: "Put idle capital to work (bazaar/flipping)",
      why: `You have ${fmt(s.networth)} networth — idle coins are opportunity cost. Market activity compounds it.`,
      cost: "capital you already hold", time: "passive-ish",
      impact: "Bazaar craft-flips / AH flips can outpace grinding at your scale",
      steps: ["Watch bazaar spreads on high-volume items", "Craft-flip enchanted items", "Snipe underpriced AH gear"] }) },

  // ===== UNIVERSAL =====
  { id: "fairy-souls", lens: "progression", baseImpact: 50,
    applies: (s) => s.fairySouls < 230,
    build: (s) => ({
      title: "Collect more Fairy Souls",
      why: `Free permanent stats — you have ${s.fairySouls}/~242. One of the best effort-to-power ratios at any stage.`,
      cost: "free", time: "a couple sessions",
      impact: "Exchange every 5 for permanent HP/Def/Str/Speed/Crit",
      steps: ["Use a Fairy Soul waypoint guide/mod", "Sweep each island you visit", "Exchange at the Fairy in the Wilderness"] }) },
];

// ---- scoring ----
function lensWeight(rule, lens) {
  if (lens === "balanced") return 1;
  return rule.lens === lens ? 1.4 : 0.55;
}

// Returns ranked action cards for a PlayerState under the chosen lens.
export function scoreActions(state, lens = "balanced") {
  const out = [];
  for (const r of RULES) {
    if (!r.applies(state)) continue;
    const card = r.build(state);
    out.push({ ...card, id: r.id, lens: r.lens, score: r.baseImpact * lensWeight(r, lens) });
  }
  return out.sort((a, b) => b.score - a.score);
}

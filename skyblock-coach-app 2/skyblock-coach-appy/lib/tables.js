// ---------------------------------------------------------------------------
// Accurate Hypixel SkyBlock XP tables + small conversion helpers.
// These replace the rough guesses the old normalizer used.
// ---------------------------------------------------------------------------

// XP required PER skill level (level 1..60), from the NEU constants.
// Cumulative to level 50 = 55,172,425; to level 60 = 111,672,425 (verified).
export const SKILL_XP_PER_LEVEL = [50,125,200,300,500,750,1000,1500,2000,3500,5000,7500,10000,15000,20000,30000,50000,75000,100000,200000,300000,400000,500000,600000,700000,800000,900000,1000000,1100000,1200000,1300000,1400000,1500000,1600000,1700000,1800000,1900000,2000000,2100000,2200000,2300000,2400000,2500000,2600000,2750000,2900000,3100000,3400000,3700000,4000000,4300000,4600000,4900000,5200000,5500000,5800000,6100000,6400000,6700000,7000000];

// Per-skill level caps (base game caps).
export const SKILL_CAPS = { taming:50, mining:60, foraging:50, enchanting:60, carpentry:50, farming:50, combat:60, fishing:50, alchemy:50 };

// XP required PER catacombs level (level 1..50). Verified: this array sums to
// 569,809,640 — the confirmed total XP to reach Catacombs 50.
export const CATA_PER_LEVEL = [50,75,110,160,230,330,470,670,950,1340,1890,2665,3760,5260,7380,10300,14400,20000,27600,38000,52500,71500,97000,132000,180000,243000,328000,445000,600000,800000,1065000,1410000,1900000,2500000,3300000,4300000,5600000,7200000,9200000,12000000,15000000,19000000,24000000,30000000,38000000,48000000,60000000,75000000,93000000,116250000];

// Cumulative HotM XP to reach each tier (tier 1..10).
export const HOTM_CUMULATIVE = [0,3000,12000,37000,97000,197000,347000,557000,847000,1247000];

export function xpToSkillLevel(xp, cap = 60) {
  if (!xp || xp <= 0) return 0;
  let cum = 0;
  for (let i = 0; i < SKILL_XP_PER_LEVEL.length && i < cap; i++) {
    cum += SKILL_XP_PER_LEVEL[i];
    if (xp < cum) return i;   // still working toward level i+1
  }
  return cap;
}

export function xpToCatacombsLevel(xp) {
  if (!xp || xp <= 0) return 0;
  let cum = 0;
  for (let i = 0; i < CATA_PER_LEVEL.length; i++) {
    cum += CATA_PER_LEVEL[i];
    if (xp < cum) return i;      // still working toward level i+1
  }
  return 50;
}

// Returns 0 if the player never unlocked HotM (no mining_core), else tier 1..10.
export function xpToHotmTier(xp) {
  if (xp == null) return 0;
  let tier = 1;
  for (let i = 1; i < HOTM_CUMULATIVE.length; i++) {
    if (xp >= HOTM_CUMULATIVE[i]) tier = i + 1; else break;
  }
  return tier;
}

const RARITY_ORDER = ["COMMON","UNCOMMON","RARE","EPIC","LEGENDARY","MYTHIC","DIVINE"];
export function titleCase(s) {
  return String(s || "").toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
export function prettyRarity(r) { return titleCase(r); }
export function rarityRank(r) { return RARITY_ORDER.indexOf(String(r || "").toUpperCase()); }

// strip Minecraft color/format codes (§a, §l, etc.)
export function stripCodes(s) { return String(s || "").replace(/§./g, "").trim(); }

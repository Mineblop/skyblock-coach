// ---------------------------------------------------------------------------
// Accurate Hypixel SkyBlock XP tables + small conversion helpers.
// These replace the rough guesses the old normalizer used.
// ---------------------------------------------------------------------------

// Cumulative XP to reach each skill level (0..60).
export const SKILL_XP = [0,50,175,375,675,1175,1925,2925,4425,6425,9925,14925,22425,32425,47425,67425,97425,147425,222425,322425,522425,822425,1222425,1722425,2322425,3022425,3822425,4722425,5722425,6822425,8022425,9322425,10722425,12222425,13822425,15522425,17322425,19222425,21222425,23322425,25522425,27822425,30222425,32722425,35322425,38072425,40972425,44022425,47222425,50572425,54072425,57722425,61522425,65472425,69572425,73822425,78222425,82772425,87472425,92322425,97322425];

// XP required PER catacombs level (level 1..50). Verified: this array sums to
// 569,809,640 — the confirmed total XP to reach Catacombs 50.
export const CATA_PER_LEVEL = [50,75,110,160,230,330,470,670,950,1340,1890,2665,3760,5260,7380,10300,14400,20000,27600,38000,52500,71500,97000,132000,180000,243000,328000,445000,600000,800000,1065000,1410000,1900000,2500000,3300000,4300000,5600000,7200000,9200000,12000000,15000000,19000000,24000000,30000000,38000000,48000000,60000000,75000000,93000000,116250000];

// Cumulative HotM XP to reach each tier (tier 1..10).
export const HOTM_CUMULATIVE = [0,3000,12000,37000,97000,197000,347000,557000,847000,1247000];

export function xpToSkillLevel(xp) {
  if (!xp || xp <= 0) return 0;
  let lvl = 0;
  for (let i = 0; i < SKILL_XP.length; i++) {
    if (xp >= SKILL_XP[i]) lvl = i; else break;
  }
  return lvl;
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

// ---------------------------------------------------------------------------
// Server-only: turn a raw Hypixel /v2/skyblock/profiles response into the clean
// PlayerState object the rules engine reads.
//
// Real Hypixel profile JSON is deep and version-dependent, so this is a
// DEFENSIVE, best-effort extractor: it pulls the fields it can find, guesses
// sensibly, and never throws on a missing field. Flesh this out (or drop in a
// library like SkyHelper's networth calculator) as you extend the coach — this
// function is the main "make it fully accurate" TODO.
// ---------------------------------------------------------------------------

// Cumulative XP required to reach each skill level (standard SkyBlock table, 0..60).
const SKILL_XP = [0,50,175,375,675,1175,1925,2925,4425,6425,9925,14925,22425,32425,47425,67425,97425,147425,222425,322425,522425,822425,1222425,1722425,2322425,3022425,3822425,4722425,5722425,6822425,8022425,9322425,10722425,12222425,13822425,15522425,17322425,19222425,21222425,23322425,25522425,27822425,30222425,32722425,35322425,38072425,40972425,44022425,47222425,50572425,54072425,57722425,61522425,65472425,69572425,73822425,78222425,82772425,87472425,92322425,97322425];

function xpToLevel(xp) {
  if (!xp || xp <= 0) return 0;
  let lvl = 0;
  for (let i = 0; i < SKILL_XP.length; i++) {
    if (xp >= SKILL_XP[i]) lvl = i; else break;
  }
  return lvl;
}

function pick(obj, ...paths) {
  for (const p of paths) {
    const v = p.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function stageFor(sbLevel) {
  if (sbLevel < 15) return "early";
  if (sbLevel < 35) return "mid";
  return "late";
}

// profilesResponse = parsed JSON from /v2/skyblock/profiles; uuid = player uuid (no dashes)
export function normalize(profilesResponse, uuid, username) {
  const profiles = profilesResponse?.profiles || [];
  if (!profiles.length) return null;

  // pick the profile the player has selected, else the first
  const profile = profiles.find((p) => p.selected) || profiles[0];
  const m = profile?.members?.[uuid] || {};

  // --- skills (v2 stores per-skill experience under player_data.experience) ---
  const exp = pick(m, "player_data.experience", "experience_skill") || {};
  const skillXp = (name) =>
    pick(m, `player_data.experience.SKILL_${name.toUpperCase()}`) ??
    pick(m, `experience_skill_${name}`) ?? 0;

  const skills = {
    combat: xpToLevel(skillXp("combat")),
    farming: xpToLevel(skillXp("farming")),
    mining: xpToLevel(skillXp("mining")),
    foraging: xpToLevel(skillXp("foraging")),
  };
  const skillVals = Object.values(skills);
  skills.avg = +(skillVals.reduce((a, b) => a + b, 0) / skillVals.length).toFixed(1);

  // --- slayers ---
  const sl = pick(m, "slayer.slayer_bosses") || m.slayer_bosses || {};
  const slayerLvl = (k) => pick(sl, `${k}.claimed_levels`) ? Object.keys(sl[k].claimed_levels).length : 0;
  const slayers = {
    zombie: slayerLvl("zombie"), spider: slayerLvl("spider"),
    wolf: slayerLvl("wolf"), enderman: slayerLvl("enderman"),
  };

  // --- catacombs ---
  const cataXp = pick(m, "dungeons.dungeon_types.catacombs.experience") || 0;
  // dungeon XP uses a different table; rough level via a simple approximation.
  const catacombs = cataXp ? Math.min(50, Math.floor(Math.cbrt(cataXp / 200))) : 0;

  // --- economy ---
  const purse = pick(m, "currencies.coin_purse", "coin_purse") || 0;
  const bank = pick(profile, "banking.balance") || 0;

  // --- misc ---
  const sbLevel = Math.floor((pick(m, "leveling.experience") || 0) / 100);
  const magicalPower = 0;   // TODO: compute from accessory bag; needs item decoding
  const hotmTier = pick(m, "mining_core.nodes.special_0") ? 1 : (pick(m, "mining_core.experience") ? 2 : 0);
  const fairySouls = pick(m, "fairy_soul.total_collected", "fairy_souls_collected") || 0;
  const minionSlots = 5 + Math.min(20, Math.floor((pick(m, "player_data.crafted_generators")?.length || 0) / 5));

  return {
    name: username,
    sbLevel,
    stage: stageFor(sbLevel),
    purse, bank,
    networth: purse + bank, // TODO: swap in a real networth calc for item/pet value
    skills, slayers, catacombs,
    magicalPower, hotmTier,
    weapon: "—", armor: "—", pet: null, // TODO: decode inventory NBT for these
    minionSlots, fairySouls,
    _partial: true, // signal to the UI that some fields need deeper decoding
  };
}

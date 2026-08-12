// ---------------------------------------------------------------------------
// Server-only: raw Hypixel /v2/skyblock/profiles response -> clean PlayerState.
// Now uses accurate XP tables + the skyhelper-networth library for real
// item-valued networth. Every risky step is wrapped so a failure degrades
// gracefully instead of crashing the whole lookup.
// ---------------------------------------------------------------------------

import { ProfileNetworthCalculator } from "skyhelper-networth";
import {
  xpToSkillLevel, xpToCatacombsLevel, xpToHotmTier,
  titleCase, prettyRarity, stripCodes,
} from "./tables.js";

function pick(obj, ...paths) {
  for (const p of paths) {
    const v = p.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}
const stageFor = (lvl) => (lvl < 15 ? "early" : lvl < 35 ? "mid" : "late");

// async because networth calculation fetches live prices
export async function normalize(profilesResponse, uuid, username) {
  const profiles = profilesResponse?.profiles || [];
  if (!profiles.length) return null;
  const profile = profiles.find((p) => p.selected) || profiles[0];
  const m = profile?.members?.[uuid];
  if (!m) return null;

  // ---- skills ----
  const skillXp = (name) =>
    pick(m, `player_data.experience.SKILL_${name.toUpperCase()}`) ??
    pick(m, `experience_skill_${name}`) ?? 0;
  const skills = {
    combat: xpToSkillLevel(skillXp("combat")),
    farming: xpToSkillLevel(skillXp("farming")),
    mining: xpToSkillLevel(skillXp("mining")),
    foraging: xpToSkillLevel(skillXp("foraging")),
    fishing: xpToSkillLevel(skillXp("fishing")),
    enchanting: xpToSkillLevel(skillXp("enchanting")),
    alchemy: xpToSkillLevel(skillXp("alchemy")),
    taming: xpToSkillLevel(skillXp("taming")),
  };
  const sv = Object.values(skills);
  skills.avg = +(sv.reduce((a, b) => a + b, 0) / sv.length).toFixed(1);

  // ---- slayers ----
  const sl = pick(m, "slayer.slayer_bosses") || m.slayer_bosses || {};
  const slLvl = (k) => (sl?.[k]?.claimed_levels ? Object.keys(sl[k].claimed_levels).length : 0);
  const slayers = { zombie: slLvl("zombie"), spider: slLvl("spider"), wolf: slLvl("wolf"),
    enderman: slLvl("enderman"), blaze: slLvl("blaze"), vampire: slLvl("vampire") };

  // ---- catacombs & hotm (accurate tables) ----
  const catacombs = xpToCatacombsLevel(pick(m, "dungeons.dungeon_types.catacombs.experience") || 0);
  const hotmTier = xpToHotmTier(pick(m, "mining_core.experience"));

  // ---- economy ----
  const purse = pick(m, "currencies.coin_purse", "coin_purse") || 0;
  const bank = pick(profile, "banking.balance") || 0;

  // ---- active pet (structured data, no NBT needed) ----
  let activePet = null;
  const pets = pick(m, "pets_data.pets") || m.pets || [];
  const act = Array.isArray(pets) ? pets.find((p) => p.active) : null;
  if (act) activePet = { name: `${prettyRarity(act.tier)} ${titleCase(act.type)}`, rarity: (act.tier || "").toUpperCase(), type: act.type };

  // ---- networth + top items (skyhelper-networth) ----
  let networth = purse + bank;
  let networthSource = "fallback";
  let topItems = [];
  try {
    const calc = new ProfileNetworthCalculator(m, undefined, bank);
    // never let a slow/unreachable price feed hang the request
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("networth timeout")), 9000));
    const nw = await Promise.race([calc.getNetworth(), timeout]);
    if (nw && typeof nw.networth === "number") {
      networth = nw.networth;
      networthSource = "calculated";
      // flatten every categorized item, keep the priciest few
      const all = [];
      for (const cat of Object.values(nw.types || {})) {
        for (const it of cat?.items || []) {
          if (it?.price > 0) all.push({ name: stripCodes(it.name), value: Math.round(it.price) });
        }
      }
      all.sort((a, b) => b.value - a.value);
      topItems = all.slice(0, 6);
    }
  } catch (e) {
    // prices unreachable or lib error -> keep purse+bank fallback, no crash
    networthSource = "fallback";
  }

  // ---- misc ----
  const sbLevel = Math.floor((pick(m, "leveling.experience") || 0) / 100);
  const fairySouls = pick(m, "fairy_soul.total_collected", "fairy_souls_collected") || 0;
  const minionSlots = 5 + Math.min(20, Math.floor((pick(m, "player_data.crafted_generators")?.length || 0) / 5));

  return {
    name: username, uuid,
    sbLevel, stage: stageFor(sbLevel),
    purse, bank, networth, networthSource,
    skills, slayers, catacombs, hotmTier, fairySouls, minionSlots,
    activePet,
    pet: activePet ? activePet.name : null, // back-compat for the rules engine
    weapon: topItems[0]?.name || "—",       // best guess: highest-value item
    magicalPower: null,                     // TODO: needs accessory-bag computation
    topItems,
    // player render image (loads in the browser)
    skinUrl: `https://crafatar.com/renders/body/${uuid}?scale=8&overlay`,
    headUrl: `https://crafatar.com/avatars/${uuid}?size=80&overlay`,
  };
}

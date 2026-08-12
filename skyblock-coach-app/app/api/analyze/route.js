// ---------------------------------------------------------------------------
// Server-side proxy. This code runs ONLY on the server — it is never shipped to
// the browser — which is exactly what lets it use your secret API key safely.
//
// Flow:  username  →  Mojang (username→uuid)  →  Hypixel (profiles, with YOUR key)
//        →  normalize  →  rules engine  →  JSON back to the browser.
//
// The player only ever sends a username. They never see or supply a key.
// ---------------------------------------------------------------------------

import { normalize } from "@/lib/normalize";
import { scoreActions } from "@/lib/engine";

// Simple in-memory caches. Good enough for one server instance; swap for Redis
// if you scale to many instances. These are what keep you under the
// 300-requests / 5-minutes Hypixel rate limit.
const profileCache = new Map(); // username -> { at, data }
const PROFILE_TTL = 3 * 60 * 1000; // 3 min

export async function GET(request) {
  const key = process.env.HYPIXEL_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Server is missing HYPIXEL_API_KEY. Add it to .env.local (see README)." },
      { status: 500 }
    );
  }

  const name = new URL(request.url).searchParams.get("name")?.trim();
  if (!name) return Response.json({ error: "Missing ?name" }, { status: 400 });

  // serve from cache if fresh
  const cached = profileCache.get(name.toLowerCase());
  if (cached && Date.now() - cached.at < PROFILE_TTL) {
    return Response.json(cached.data);
  }

  try {
    // 1) username -> uuid (Mojang)
    const mojang = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`
    );
    if (mojang.status === 404) {
      return Response.json({ error: `No Minecraft account named "${name}".` }, { status: 404 });
    }
    if (!mojang.ok) throw new Error("Mojang lookup failed");
    const { id: uuid, name: properName } = await mojang.json();

    // 2) uuid -> skyblock profiles (Hypixel, using YOUR server-side key)
    const hy = await fetch(`https://api.hypixel.net/v2/skyblock/profiles?uuid=${uuid}`, {
      headers: { "API-Key": key },
    });
    if (hy.status === 403) {
      return Response.json({ error: "Hypixel rejected the API key (check it in .env.local)." }, { status: 502 });
    }
    if (hy.status === 429) {
      return Response.json({ error: "Rate limited by Hypixel — try again in a moment." }, { status: 429 });
    }
    if (!hy.ok) throw new Error("Hypixel lookup failed");
    const body = await hy.json();

    if (!body.profiles || body.profiles.length === 0) {
      return Response.json(
        { error: `"${properName}" has no SkyBlock profiles, or has their API disabled in-game.` },
        { status: 404 }
      );
    }

    // 3) normalize + rank
    const profile = normalize(body, uuid, properName);
    if (!profile) {
      return Response.json({ error: "Could not read that profile (API may be disabled)." }, { status: 422 });
    }
    const actions = scoreActions(profile, "balanced");

    const payload = { profile, actions };
    profileCache.set(name.toLowerCase(), { at: Date.now(), data: payload });
    return Response.json(payload);
  } catch (e) {
    return Response.json({ error: "Lookup failed: " + e.message }, { status: 500 });
  }
}

"use client";

import { useMemo, useState } from "react";
import { SAMPLES, scoreActions, fmt } from "@/lib/engine";

export default function Home() {
  const [profile, setProfile] = useState(SAMPLES.mid);
  const [lens, setLens] = useState("balanced");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const actions = useMemo(
    () => (profile ? scoreActions(profile, lens).slice(0, 6) : []),
    [profile, lens]
  );

  function loadSample(k) { setProfile(SAMPLES[k]); setNote(""); }

  async function analyze() {
    const n = name.trim();
    if (!n) { setNote("Enter a username, or load a sample profile."); return; }
    setLoading(true);
    setNote("Looking up " + n + "…");
    try {
      const res = await fetch("/api/analyze?name=" + encodeURIComponent(n));
      const data = await res.json();
      if (!res.ok) { setNote(data.error || "Lookup failed."); return; }
      setProfile(data.profile);
      setNote(
        data.profile.networthSource === "fallback"
          ? "Live profile loaded. (Networth couldn't be priced this time, so it's showing purse + bank — try again in a moment.)"
          : "Live profile loaded."
      );
    } catch {
      setNote("Network error — is the server running?");
    } finally { setLoading(false); }
  }

  const s = profile;
  const isLive = !!s?.uuid;

  return (
    <div className="wrap">
      <header>
        <h1>SkyBlock <span>Coach</span></h1>
        <p>
          Reads your actual profile and tells you the single highest-impact thing to
          do next — for coins, power, or overall progression. Type a username for a
          live lookup, or load a sample profile to see the engine adapt.
        </p>
      </header>

      <div className="card">
        <div className="controls">
          <div className="field">
            <label htmlFor="user">Minecraft username</label>
            <input id="user" value={name} placeholder="e.g. Technoblade"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyze()} />
          </div>
          <button className="primary" onClick={analyze} disabled={loading}>
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </div>
        <div className="samples">
          <span className="samples-label">Or load a sample profile:</span>
          <button onClick={() => loadSample("early")}>🌱 New player</button>
          <button onClick={() => loadSample("mid")}>⚔️ Mid-game</button>
          <button onClick={() => loadSample("late")}>👑 Late-game</button>
        </div>
        {note && <div className="note">{note}</div>}
      </div>

      {s && (
        <>
          <div className="section-h"><h2>Profile</h2><div className="rule" /></div>
          <div className="card">
            <div className="profile-head">
              {isLive && (
                <img className="skin" src={s.skinUrl} alt={s.name}
                  onError={(e) => { e.currentTarget.src = `https://mc-heads.net/body/${s.uuid}`; }} />
              )}
              <div className="profile-body">
                <div className="who">
                  <b>{s.name}</b>
                  <span className="stage">{s.stage}-game</span>
                  <span className="muted">SkyBlock Level {s.sbLevel}</span>
                </div>
                <div className="stats">
                  <Stat k="Networth" v={fmt(s.networth)} sub={s.networthSource === "fallback" ? "purse+bank" : "calculated"} />
                  <Stat k="Purse + Bank" v={fmt(s.purse + s.bank)} />
                  <Stat k="Avg Skill" v={s.skills.avg} />
                  <Stat k="Catacombs" v={s.catacombs || "—"} />
                  <Stat k="HotM Tier" v={s.hotmTier || "—"} />
                  <Stat k="Fairy Souls" v={s.fairySouls || "—"} />
                </div>
              </div>
            </div>

            {/* per-skill breakdown */}
            <div className="subhead">Skills</div>
            <div className="chips">
              {Object.entries(s.skills).filter(([k]) => k !== "avg").map(([k, v]) => (
                <span className="chip" key={k}><b>{v}</b> {k}</span>
              ))}
            </div>

            {/* active pet */}
            {s.activePet && (
              <>
                <div className="subhead">Active pet</div>
                <span className={"petcard r-" + (s.activePet.rarity || "").toLowerCase()}>
                  {s.activePet.name}
                </span>
              </>
            )}

            {/* top items */}
            {s.topItems && s.topItems.length > 0 && (
              <>
                <div className="subhead">Most valuable items</div>
                <div className="items">
                  {s.topItems.map((it, i) => (
                    <div className="item" key={i}>
                      <span className="item-name">{it.name}</span>
                      <span className="item-val">{fmt(it.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {isLive && (
              <div className="tinynote">
                Magical Power / Magic Find aren't shown yet — computing them accurately
                needs full accessory-bag decoding, which is the next thing to add.
              </div>
            )}
          </div>

          <div className="section-h">
            <h2>Do this next</h2><div className="rule" />
            <div className="lens">
              {["balanced", "coins", "power"].map((l) => (
                <button key={l} data-l={l} className={lens === l ? "on" : ""} onClick={() => setLens(l)}>
                  {l[0].toUpperCase() + l.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {actions.length ? actions.map((a, i) => (
            <div className={"action " + a.lens} key={a.id}>
              <div className="top">
                <span className="rank">#{i + 1}</span>
                <h3>{a.title}</h3>
                <span className={"tag " + a.lens}>{a.lens}</span>
              </div>
              <div className="why">{a.why}</div>
              <div className="meta">
                <div><span>Cost:</span> {a.cost}</div>
                <div><span>Time:</span> {a.time}</div>
                <div><span>Impact:</span> {a.impact}</div>
              </div>
              <ol className="steps">{a.steps.map((x, j) => <li key={j}>{x}</li>)}</ol>
            </div>
          )) : (
            <div className="empty">No recommendations triggered — this profile looks well-optimized for the current rule set.</div>
          )}
        </>
      )}

      <footer>
        Recommendation numbers are illustrative where live Bazaar/AH prices would plug in.<br />
        Your Hypixel API key lives only on the server — players never enter one.
      </footer>
    </div>
  );
}

function Stat({ k, v, sub }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { SAMPLES, scoreActions, fmt } from "@/lib/engine";

export default function Home() {
  const [profile, setProfile] = useState(SAMPLES.mid); // start non-empty
  const [lens, setLens] = useState("balanced");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const actions = useMemo(
    () => (profile ? scoreActions(profile, lens).slice(0, 6) : []),
    [profile, lens]
  );

  function loadSample(k) {
    setProfile(SAMPLES[k]);
    setNote("");
  }

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
        data.profile._partial
          ? "Live profile loaded. Some fields (gear, magical power, networth) use placeholder decoding — see the normalizer TODOs to make them exact."
          : "Live profile loaded."
      );
    } catch {
      setNote("Network error — is the dev server running?");
    } finally {
      setLoading(false);
    }
  }

  const s = profile;

  return (
    <div className="wrap">
      <header>
        <h1>SkyBlock <span>Coach</span></h1>
        <p>
          Reads your actual profile and tells you the single highest-impact thing to
          do next — for coins, power, or overall progression. Type a username for a
          live lookup, or load a sample profile to see the engine adapt across skill levels.
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
            <div className="who">
              <b>{s.name}</b>
              <span className="stage">{s.stage}-game</span>
              <span className="muted">SkyBlock Level {s.sbLevel}</span>
            </div>
            <div className="stats">
              <Stat k="Networth" v={fmt(s.networth)} />
              <Stat k="Purse + Bank" v={fmt(s.purse + s.bank)} />
              <Stat k="Avg Skill" v={s.skills.avg} />
              <Stat k="Catacombs" v={s.catacombs || "—"} />
              <Stat k="Magical Power" v={s.magicalPower} />
              <Stat k="HotM Tier" v={s.hotmTier || "—"} />
              <Stat k="Weapon" v={s.weapon} />
              <Stat k="Pet" v={s.pet || "none"} />
            </div>
          </div>

          <div className="section-h">
            <h2>Do this next</h2>
            <div className="rule" />
            <div className="lens">
              {["balanced", "coins", "power"].map((l) => (
                <button key={l} data-l={l} className={lens === l ? "on" : ""}
                  onClick={() => setLens(l)}>
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

function Stat({ k, v }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}

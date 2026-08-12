# SkyBlock Coach

A personalized "what should I do next" progression coach for Hypixel SkyBlock.
Players type their username and get a ranked, stage-aware action plan for coins,
power, and overall progression. **Players never enter an API key** — you hold one
secret key on the server and every lookup uses it.

---

## What you need (all free)

1. **Node.js** (version 18 or newer) — https://nodejs.org (download the "LTS" installer).
   To check if you already have it, open a terminal and run: `node -v`
2. **A Hypixel API key** — https://developer.hypixel.net → sign in with your
   Minecraft account → **Create App** → **Personal API Key**. Copy the key.
   (Takes ~2 minutes. This is the one thing only you can do — it's tied to your account.)
3. *(For deploying)* a free **GitHub** account and a free **Vercel** account.

---

## Run it on your computer (5 minutes)

1. Open a terminal **in this folder**.
2. Install the code's dependencies:
   ```
   npm install
   ```
3. Add your key. Copy the example env file and paste your key into the copy:
   ```
   cp .env.local.example .env.local
   ```
   Then open `.env.local` in any text editor and replace `paste-your-key-here`
   with the key you copied from developer.hypixel.net.
4. Start it:
   ```
   npm run dev
   ```
5. Open **http://localhost:3000** in your browser.

The sample profiles (New / Mid / Late) work immediately with no key. Once your
key is in `.env.local`, typing a real username does a live lookup.

---

## Put it online for free (Vercel)

1. Push this folder to a new GitHub repository.
2. Go to https://vercel.com → **Add New Project** → import that repo.
3. In Vercel's project settings → **Environment Variables**, add:
   - Name: `HYPIXEL_API_KEY`
   - Value: your key
4. Click **Deploy**. Vercel gives you a live URL. You can point your own domain at
   it later in the project settings.

Your key lives only in Vercel's server environment — it never reaches visitors.

---

## How it's put together

```
app/
  page.js              the UI (runs in the browser)
  layout.js            page shell
  globals.css          styling
  api/analyze/route.js the SERVER proxy — holds your key, calls Mojang + Hypixel
lib/
  engine.js            the rules engine (shared, no secrets) — ADD RULES HERE
  normalize.js         turns raw Hypixel JSON into a clean PlayerState (server only)
```

- **Why players don't need a key:** the browser only ever calls your own
  `/api/analyze?name=…`. That route runs on the server, reads your key from
  `process.env.HYPIXEL_API_KEY`, and makes the Hypixel call for them. The key is
  never in any page a visitor can view.
- **Rate limits:** Hypixel allows 300 requests / 5 min per key. `route.js` caches
  each player's profile for a few minutes so repeated clicks don't burn requests.
  That's plenty for a lot of players. Cache price data globally too as you add it.

---

## Where to take it next

- **`lib/engine.js` is the product.** Every recommendation is one self-contained
  rule (`applies` + `build`). Add your own SkyBlock knowledge by appending rules —
  that growing library is the moat.
- **`lib/normalize.js` is the main accuracy TODO.** It extracts core fields today
  and marks placeholders for the hard parts (gear, magical power, real networth).
  Flesh those out, or drop in a library like SkyHelper's networth calculator.
- Add live Bazaar/AH prices (no key needed for `/skyblock/bazaar`) to make the
  cost/impact numbers real instead of illustrative.

# Bear With Me

Ask the Bear, the AI helper for *Bear With Me: The Ready Kit*, plus the stable link printed in the booklet's QR code.

| Address | What it is |
|---|---|
| https://jessboydd.github.io/bear-with-me/ | The QR link. `index.html` forwards to the current Ask the Bear. Change the two links in it to point the booklet somewhere new; printed QR codes never change. |
| https://jessboydd.github.io/bear-with-me/app/ | The standalone app in **demo mode**: real camera, photo and chat screens, sample answers instead of AI. |

## What's here

- `app/index.html`, `app/app.js`: the app. Snap or upload a photo (shrunk on the phone before sending), chat, urgency chips (Stop soon / Check soon / FYI), a written-in stop banner, and a dashboard-light lookup that works without AI.
- `app/lights.js`: the 14 dashboard lights from the booklet (pp. 5–11), with the facts the bear treats as verified. Review against an owner's manual before testing.
- **My car's numbers**: the booklet's page 3 in the app (tire pressure, spare or inflator kit, oil type, roadside help, insurance). Saved on the phone only. The bear is told the car, tire and oil numbers; phone numbers and insurance never leave the phone. A saved roadside number adds a Call button to the home screen and the stop banner.
- `api/chat.js`: the private server piece. Keeps the API key secret, writes the bear's rules itself, checks the tester code, limits message and photo size, and sends photos to Anthropic's API.
- `qr/`: the booklet QR code (SVG and PNG).
- `tools/build-claude-version.py`: builds the Claude version of Ask the Bear (the artifact) from this same code, using Claude's AI in place of `api/chat.js`. Rebuild and republish it after app changes so the two stay the same.

## Demo mode vs. live

The app runs in demo mode on GitHub Pages, when opened as a file, or with `?demo` added to the address. Anywhere else it talks to `/api/chat`.

## Going live (when ready)

1. **Anthropic API account:** at console.anthropic.com, add a payment method, set a monthly spending limit, and create an API key.
2. **Vercel account:** sign in with GitHub and import this repo. No build settings are needed.
3. **Vercel → Project → Settings → Environment Variables:**
   - `ANTHROPIC_API_KEY`: the key from step 1.
   - `BEAR_ACCESS_CODE`: a tester code you choose. Testers enter it once.
   - `BEAR_MODEL` (optional): defaults to `claude-sonnet-5-5`.
4. Open `https://<your-vercel-address>/app/` and test it on a phone.
5. Point `index.html` at that address so the booklet QR opens the live app.

Never put the API key in any file in this repo; the repo is public.

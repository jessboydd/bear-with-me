// Reads pages of an owner's manual and pulls out the driver's car facts.
// Runs on Vercel as /api/manual. The phone reads the PDF itself and sends only the
// text of the pages that look useful, a few dozen pages per request.
// Uses the same settings as api/chat.js (ANTHROPIC_API_KEY, BEAR_ACCESS_CODE, BEAR_MODEL).

import { MANUAL_FIELDS, FIELD } from "../app/manual-fields.js";

const MODEL = process.env.BEAR_MODEL || "claude-sonnet-5-5";
const MAX_PAGES = 60;
const MAX_CHARS = 90_000;

export function manualRules() {
  return `You read pages from a car owner's manual and pull out facts about the driver's car. Return JSON only, no other text.

Facts to look for (key: what it is):
${MANUAL_FIELDS.map(f => `- ${f.key}: ${f.desc}`).join("\n")}

Rules:
- Use only what these pages say. Never fill in from your own knowledge, and never guess.
- Copy values exactly as written. Tire pressures: the PSI number only (e.g. "35"); if a page gives only kPa, skip it.
- If the manual gives different values for different trims, engines or tire sizes, return each one as its own fact and say which it's for in "note".
- "page" is the number from the [Page N] marker the fact appears under.
- Keep each value under 100 characters and each note under 80. Skip facts these pages don't state.

Format:
{"facts":[{"key":"front","value":"35","note":"cold, 225/65R17 tires","page":412}]}
If these pages state none of the facts: {"facts":[]}`;
}

// Returns { text } for the AI, or { error } describing what's wrong.
export function pagesText(body) {
  const pages = body?.pages;
  if (!Array.isArray(pages) || !pages.length) return { error: "no pages" };
  if (pages.length > MAX_PAGES) return { error: "too many pages" };
  let total = 0;
  const out = [];
  for (const p of pages) {
    const n = Number(p?.n), text = String(p?.text ?? "");
    if (!Number.isInteger(n) || n < 1) return { error: "bad page" };
    total += text.length;
    out.push(`[Page ${n}]\n${text}`);
  }
  if (total > MAX_CHARS) return { error: "too much text" };
  return { text: out.join("\n\n") };
}

// Keeps only well-formed facts about the known keys.
export function parseFacts(full) {
  let data;
  try { data = JSON.parse(full.slice(full.indexOf("{"), full.lastIndexOf("}") + 1)); } catch { return []; }
  const facts = Array.isArray(data?.facts) ? data.facts : [];
  return facts.flatMap(f => {
    const field = FIELD[f?.key];
    let value = String(f?.value ?? "").replace(/\s+/g, " ").trim().slice(0, 100);
    if (!field || !value) return [];
    if (field.unit === "PSI") { const m = value.match(/\d{2,3}(\.\d)?/); if (!m) return []; value = m[0]; }
    if (field.choices && !field.choices.includes(value)) return [];
    const page = Number.isInteger(f?.page) && f.page > 0 ? f.page : null;
    return [{ key: field.key, value, note: String(f?.note ?? "").replace(/\s+/g, " ").trim().slice(0, 80), page }];
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const code = process.env.BEAR_ACCESS_CODE;
  if (code && req.headers["x-bear-code"] !== code) return res.status(401).json({ error: "tester code" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "server not set up" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  const { text, error } = pagesText(body);
  if (error) return res.status(error.startsWith("too") ? 413 : 400).json({ error });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, system: manualRules(), messages: [{ role: "user", content: text }] })
    });
    if (!r.ok) {
      console.error("Anthropic API error", r.status, await r.text());
      return res.status(r.status === 429 ? 429 : 502).json({ error: "ai unavailable" });
    }
    const data = await r.json();
    const full = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    return res.status(200).json({ facts: parseFacts(full) });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "ai unavailable" });
  }
}

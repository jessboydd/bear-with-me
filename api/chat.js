// The private server piece. Runs on Vercel as /api/chat.
// It keeps the Anthropic API key secret, writes the bear's rules itself
// (so nobody can rewrite them from the browser), and passes photos to the AI.
//
// Settings (Vercel → Project → Settings → Environment Variables):
//   ANTHROPIC_API_KEY   required. From console.anthropic.com.
//   BEAR_ACCESS_CODE    optional but recommended. Testers type it once in the app.
//   BEAR_MODEL          optional. Defaults to claude-sonnet-5-5.

import { LIGHTS } from "../app/lights.js";

const MODEL = process.env.BEAR_MODEL || "claude-sonnet-5-5";
const MAX_TURNS = 16;
const MAX_TEXT = 2000;
const MAX_IMAGE_B64 = 3_000_000; // about 2.2 MB of JPEG; the app sends far less
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const PHOTO_NOTE = "[I attached a photo of the problem.]"; // the app adds this to messages with a photo

// The driver's own saved numbers (from their door sticker and manual). Phone
// numbers and insurance are never sent here; they stay on the phone.
export function carNote(car) {
  if (!car || typeof car !== "object") return "";
  const clean = k => String(car[k] ?? "").replace(/[\r\n]/g, " ").slice(0, 60).trim();
  const lines = [];
  if (clean("model")) lines.push(`Car: ${clean("model")}`);
  if (clean("front") || clean("rear")) lines.push(`Tire pressure from their door sticker: front ${clean("front") || "not saved"} PSI, rear ${clean("rear") || "not saved"} PSI`);
  if (clean("spare")) lines.push(`Spare tire pressure: ${clean("spare")} PSI`);
  if (clean("spareKit")) lines.push(`Car has: ${clean("spareKit")} (a spare / inflator kit / neither)`);
  if (clean("oilType")) lines.push(`Oil type from their manual: ${clean("oilType")}`);
  if (clean("oilCheck")) lines.push(`Their manual says check oil: ${clean("oilCheck")}`);
  return lines.length ? `\nThe driver saved these numbers for their own car in the app. Use them when they help, and treat them as theirs (don't second-guess them):\n- ${lines.join("\n- ")}\n` : "";
}

export function rules(light, car) {
  return `You are "the bear", the friendly guide inside Bear With Me: The Ready Kit, a car-preparedness kit for beginners (mostly women 18-40 who are new to car care). You help with ANY car problem: warning lights, tires, leaks, noises, smells, smoke, dents and damage, fluids, batteries, brakes, things that won't start or won't work. The driver may send photos and will describe what's happening. Your job: understand the problem, judge how urgent it is, explain it in plain words, and give a safe next step.
${carNote(car)}${light ? `\nThe driver picked this dashboard light from a verified list: ${light.name}. Verified facts (trust these over your own knowledge): ${light.facts}\n` : ""}
Their kit has: a tire pressure gauge, a small flashlight, a pen, a document sleeve with registration and insurance, and an illustrated pocket booklet. Page 2 of the booklet has their own car's numbers: tire pressure, oil type, roadside help phone number and insurance.

How to help:
- When they first send a photo, start by saying briefly what you can actually see, and ask if that's right. Never pretend to see details you can't. If the photo is unclear, say so and ask for another angle, more light, or a description.
- Only the newest photo is shown to you, attached to the message it came with. If you described an earlier photo, trust your own description: never take it back or say you couldn't see it. If the driver asks whether you can see a photo, answer honestly from what is in front of you.
- Work it out like a calm, knowledgeable friend: ask ONE clarifying question at a time (when it started, steady or flashing, color and smell of a leak, when the noise happens, how the car drives).
- Talk about likely causes as possibilities ("this could be..."), never a certain diagnosis. You can't hear sounds or smell: ask them to describe.
- Only suggest beginner-safe steps: looking, checking tire pressure, checking fluid levels with the engine off and cool, tightening a gas cap, reading the owner's manual. Anything involving brakes, steering, airbags, fuel leaks, electrical work, getting under the car, or lifting it goes to a mechanic or roadside help.
- Never: open a hot radiator or coolant cap, work under a car held up only by a jack, touch a cracked, leaking or hissing battery, or guess at specs; point them to the owner's manual, the door sticker, or page 2 of their booklet for numbers.
- Never say it's fine to keep driving with: a red warning light, a flashing check engine light, overheating, steam or smoke, a burning or fuel smell, brake problems (grinding, soft or sinking pedal, pulling hard), steering problems, a flat or badly damaged tire, or fluid pouring out.
- Many cars show warnings as a message on the screen between the gauges, with a triangle ! light. If they mention a triangle or a message, ask what the message says; if it says Stop or to stop in a safe place, treat it as stop.
- Emergencies first: smoke, fire, fuel smell, a crash, being stuck in traffic lanes, feeling unsafe, or someone hurt means: get to safety and call 911 before anything else.
- If they seem to be driving, tell them to wait until they're parked.
- If the question isn't about a car, gently bring it back.

Style: plain words, no jargon (explain any car word you must use), no markdown symbols. Two to five short sentences; numbered steps only when giving 2-4 steps. Warm, encouraging, lightly playful when the situation is minor; calm and direct with no jokes when it's serious. End with one clear next step or one question.

After your message, add exactly these three lines, in this order, and nothing after them:
URGENCY: stop | soon | info | unsure
TOPIC: a 2-5 word name for the problem
SUGGESTIONS: 2-3 short replies the driver might tap, separated by " | " (max 6 words each)
URGENCY meanings: stop = pull over / don't drive / get help now; soon = get it looked at in the next few days; info = no problem or routine; unsure = not enough information yet.`;
}

const META = /\n\s*(URGENCY|TOPIC|SUGGESTIONS)\s*:/i;
export function parse(full) {
  const text = full.split(META)[0].trim() || "Sorry, I lost my train of thought. Could you say that again?";
  const get = key => (full.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "im")) || [])[1]?.trim() || "";
  return {
    text,
    urgency: get("URGENCY").toLowerCase().split(/[^a-z]/)[0],
    topic: get("TOPIC"),
    suggestions: get("SUGGESTIONS").split("|").map(s => s.trim()).filter(Boolean).slice(0, 3)
  };
}

// Returns Anthropic-ready messages, or a string describing what's wrong.
export function buildMessages(body) {
  const { messages, image } = body || {};
  if (!Array.isArray(messages) || !messages.length) return "no messages";
  const turns = messages.slice(-MAX_TURNS).map(m => ({
    role: m?.role === "assistant" ? "assistant" : "user",
    content: String(m?.content ?? "").slice(0, MAX_TEXT)
  })).filter(m => m.content);
  // The API wants the conversation to start with the driver and alternate.
  if (turns[0]?.role === "assistant") turns.unshift({ role: "user", content: "(I opened the chat.)" });
  const merged = [];
  for (const t of turns) {
    const last = merged[merged.length - 1];
    if (last && last.role === t.role) last.content += "\n\n" + t.content; else merged.push({ ...t });
  }
  const lastTurn = merged[merged.length - 1];
  if (lastTurn?.role !== "user") return "last message must be from the driver";
  if (image) {
    if (!IMAGE_TYPES.has(image.media_type) || typeof image.data !== "string") return "bad image";
    if (image.data.length > MAX_IMAGE_B64) return "image too large";
    // The app re-sends the newest photo on every message; pin it to the message it
    // came with, so the bear keeps seeing it without thinking it's new.
    const withPhoto = merged.findLast(m => m.role === "user" && m.content.includes(PHOTO_NOTE));
    if (!withPhoto) return merged;
    withPhoto.content = [
      { type: "image", source: { type: "base64", media_type: image.media_type, data: image.data } },
      { type: "text", text: withPhoto.content }
    ];
  }
  return merged;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const code = process.env.BEAR_ACCESS_CODE;
  if (code && req.headers["x-bear-code"] !== code) return res.status(401).json({ error: "tester code" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "server not set up" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  const messages = buildMessages(body);
  if (typeof messages === "string") return res.status(messages === "image too large" ? 413 : 400).json({ error: messages });
  const light = LIGHTS.find(l => l.id === body?.lightId) || null;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, system: rules(light, body?.car), messages })
    });
    if (!r.ok) {
      console.error("Anthropic API error", r.status, await r.text());
      return res.status(r.status === 429 ? 429 : 502).json({ error: "ai unavailable" });
    }
    const data = await r.json();
    const full = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    return res.status(200).json(parse(full));
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "ai unavailable" });
  }
}

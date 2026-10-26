import { LIGHTS } from "./lights.js";

/* ---------- Mode ----------
   live: talks to /api/chat (the private server piece on Vercel).
   demo: sample answers, no AI. Used on GitHub Pages, when opened as a file, or with ?demo. */
const params = new URLSearchParams(location.search);
const DEMO = params.has("demo") || location.protocol === "file:" || location.hostname.endsWith("github.io");
const API = "/api/chat";

const TOPICS = ["A light came on", "Tire looks low or flat", "Something's leaking", "A weird noise", "Smoke or a burning smell", "Car won't start", "Brakes feel off"];
const LEVEL = { stop: "Stop soon", soon: "Check soon", info: "FYI", unsure: "Still figuring out" };

/* ---------- Icons ---------- */
const S = (inner, sw = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const SYM = {
  tpms: S('<path d="M6 6c-2 3-2 9 0 12M18 6c2 3 2 9 0 12"/><path d="M7 17h10"/><path d="M12 8v5M12 15.5v.5"/>'),
  check_engine: S('<path d="M4 10h2V8h4V6h4v2h3l2 2h1v6h-1l-2 2H8l-2-2H4z"/><path d="M2 11v4"/>'),
  oil_pressure: S('<path d="M3 11h9l4-3 5 2-5 1-3 5H5z"/><path d="M8 11V8h3"/><path d="M20 14c0 1-1 2-1 2s-1-1-1-2 1-2 1-2 1 1 1 2z"/>'),
  coolant_temp: S('<path d="M12 4v9"/><circle cx="12" cy="16" r="2.5"/><path d="M12 6h3M12 9h3"/><path d="M3 19c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0"/>'),
  battery: S('<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M7 7V5M17 7V5"/><path d="M6 13h3M15 13h3M16.5 11.5v3"/>'),
  high_beam: S('<path d="M13 6c4 0 7 2.5 7 6s-3 6-7 6z"/><path d="M3 8h7M3 12h7M3 16h7"/>')
};
const SHAPE = {
  stop: '<svg viewBox="0 0 28 28" aria-hidden="true"><polygon points="8.2,1 19.8,1 27,8.2 27,19.8 19.8,27 8.2,27 1,19.8 1,8.2" fill="currentColor"/></svg>',
  soon: '<svg viewBox="0 0 28 28" aria-hidden="true"><polygon points="14,2 27,26 1,26" fill="#F2B705" stroke="#231930" stroke-width="2.5" stroke-linejoin="round"/></svg>',
  info: '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="13" fill="currentColor"/></svg>',
  unsure: '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="4 4"/></svg>'
};
const I = {
  back: S('<path d="M19 12H5M11 6l-6 6 6 6"/>', 2.2),
  cam: S('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', 2.2),
  img: S('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>', 2),
  send: S('<path d="M12 19V5M6 11l6-6 6 6"/>', 2.4),
  chev: S('<path d="M6 9l6 6 6-6"/>', 2.2)
};
// Kit Bear: the brand mark
const KIT_BEAR = `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="32" cy="32" r="16" fill="#B997F8"/><circle cx="88" cy="32" r="16" fill="#B997F8"/><circle cx="32" cy="32" r="7" fill="#FF7044"/><circle cx="88" cy="32" r="7" fill="#FF7044"/><rect x="14" y="32" width="92" height="76" rx="30" fill="#B997F8"/><circle cx="44" cy="60" r="5" fill="#231930"/><circle cx="76" cy="60" r="5" fill="#231930"/><ellipse cx="60" cy="69" rx="6" ry="4" fill="#231930"/><path d="M30 80 Q60 96 90 80" fill="none" stroke="#231930" stroke-width="5" stroke-linecap="round"/><rect x="86" y="79" width="9" height="17" rx="4.5" fill="#FF7044" stroke="#231930" stroke-width="2.5"/></svg>`;
// The simple bold bear: the same guide as in the booklet
const GUIDE_BEAR = `<svg viewBox="0 0 240 240" aria-hidden="true"><circle cx="58" cy="62" r="32" fill="#231930"/><circle cx="182" cy="62" r="32" fill="#231930"/><ellipse cx="120" cy="126" rx="94" ry="80" fill="#231930"/><circle cx="84" cy="116" r="10" fill="#F8F4FC"/><circle cx="156" cy="116" r="10" fill="#F8F4FC"/><ellipse cx="120" cy="158" rx="46" ry="34" fill="#F8F4FC"/><path d="M104 142q16-10 32 0q-3 14-16 16q-13-2-16-16z" fill="#231930"/><path d="M120 158v8M108 170q12 9 24 0" fill="none" stroke="#231930" stroke-width="4.5" stroke-linecap="round"/></svg>`;

/* ---------- State ---------- */
const st = { screen: "home", turns: [], topic: "", level: "unsure", light: null, quick: [], busy: false, error: "", pending: null, needCode: false };
const app = document.getElementById("app");
const byId = id => LIGHTS.find(l => l.id === id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const chip = level => `<span class="chip ${level}">${SHAPE[level]}${LEVEL[level]}</span>`;
const store = {
  get(k) { try { return localStorage.getItem(k) || ""; } catch { return ""; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};

const demoNote = () => DEMO ? `<div class="demo"><b>Demo</b><span>Sample answers only. The real AI isn't connected yet.</span></div>` : "";

/* ---------- Screens ---------- */
function home() {
  return `
  ${demoNote()}
  <div class="top" style="justify-content:space-between">
    <div class="brand">${KIT_BEAR}<span>Bear With Me</span></div>
    <div class="checker" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<i class="${(i + Math.floor(i / 6)) % 2 ? "" : "k"}"></i>`).join("")}</div>
  </div>
  <h1>Something going on with your car?</h1>
  <p class="muted">Show me or tell me. We'll figure out your next step together.</p>
  ${st.needCode ? codeBox() : ""}
  <div class="btns">
    <button class="btn lav" id="snap">${I.cam}Snap it</button>
    <button class="btn" id="up">${I.img}Upload</button>
  </div>
  <p class="hint" style="margin-top:-6px">Only when you're parked. Never while driving.</p>
  <form class="describe" id="descForm">
    <label class="sr" for="desc">Describe what's happening</label>
    <input id="desc" type="text" placeholder="Tell me what's happening" autocomplete="off">
    <button class="round send" aria-label="Ask the bear">${I.send}</button>
  </form>
  <div class="stack">
    <div class="label">Or start with</div>
    <div class="topics">${TOPICS.map(t => `<button data-topic="${esc(t)}">${esc(t)}</button>`).join("")}</div>
  </div>
  ${st.error ? `<p class="err">${esc(st.error)}</p>` : ""}
  <details class="lightsbox">
    <summary><span>Look up a dashboard light</span><span style="width:22px;height:22px">${I.chev}</span></summary>
    <div class="lights">
      ${LIGHTS.map(l => `<button class="light" data-pick="${l.id}"><span class="sym">${SYM[l.id]}</span><b>${esc(l.name)}</b>${chip(l.level)}</button>`).join("")}
    </div>
  </details>
  <p class="hint">The bear can get things wrong. If you ever feel unsafe, call 911.</p>
  <div class="spacer"></div>`;
}

function codeBox() {
  return `<div class="codebox">
    <p class="small"><b>Tester code needed.</b> Enter the code from your session to talk to the bear.</p>
    <form id="codeForm"><label class="sr" for="code">Tester code</label><input id="code" type="text" autocomplete="off" autocapitalize="none" placeholder="Tester code"><button class="round send" aria-label="Save code">${I.send}</button></form>
  </div>`;
}

function stopBanner() {
  return `<div class="banner" role="alert">
    <div class="bt">${SHAPE.stop.replace('fill="currentColor"', 'fill="#FFFFFF"')}Stop soon</div>
    <ol>
      <li>Pull over as soon as it's safe.</li>
      <li>Turn off the engine and turn on your hazard lights.</li>
      <li>Don't keep driving until someone checks it.</li>
    </ol>
    <p>Roadside help: your number is on page 3 of your booklet. In danger, smoke or fire? Get away from the car and call <b>911</b>.</p>
  </div>`;
}

function chat() {
  const msgs = st.turns.map(t => {
    if (t.role === "user") return `<div class="msg me">${t.photoUrl ? `<img src="${t.photoUrl}" alt="Your photo">` : ""}${esc(t.display ?? t.content)}</div>`;
    return `<div class="msg bot${t.think ? " think" : ""}">${esc(t.display ?? t.content)}</div>`;
  }).join("");
  return `
  <div class="head">
    <div class="headrow">
      <button class="round" id="home" aria-label="Start over">${I.back}</button>
      <span style="width:36px;height:36px;flex:none">${GUIDE_BEAR}</span>
      <div class="t"><b>${esc(st.topic || "Ask the bear")}</b>${chip(st.level)}${DEMO ? ' <span class="chip unsure">Demo</span>' : ""}</div>
    </div>
    ${st.level === "stop" ? stopBanner() : ""}
  </div>
  <div class="chat" id="chatlog">${msgs}</div>
  ${st.quick.length && !st.busy ? `<div class="quick">${st.quick.map(q => `<button data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>` : ""}
  ${st.error ? `<p class="err">${esc(st.error)}</p>` : ""}
  <div class="composer">
    ${st.pending ? `<div class="pending"><img src="${st.pending.url}" alt="Photo to send"><span>Photo ready to send</span><button id="unpend">Remove</button></div>` : ""}
    <form id="chatForm">
      <button type="button" class="round" id="addPhoto" aria-label="Add a photo" style="background:var(--tint);border-color:var(--tint)">${I.cam}</button>
      <label class="sr" for="msg">Message</label>
      <input id="msg" type="text" placeholder="${st.pending ? "Add a note (optional)" : "Type a reply"}" autocomplete="off" ${st.busy ? "disabled" : ""}>
      <button class="round send" aria-label="Send" ${st.busy ? "disabled" : ""}>${I.send}</button>
    </form>
    <p class="hint">The bear can get things wrong. A mechanic and your owner's manual have the final word.</p>
  </div>`;
}

/* ---------- Render + events ---------- */
let photoTarget = "new";
function render() {
  app.innerHTML = st.screen === "chat" ? chat() : home();
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
  const pick = (target, input) => () => { photoTarget = target; document.getElementById(input).click(); };
  on("snap", pick("new", "photo"));
  on("up", pick("new", "upload"));
  on("addPhoto", pick("chat", "photo"));
  on("unpend", () => { st.pending = null; render(); });
  on("home", () => { st.screen = "home"; st.error = ""; st.pending = null; render(); window.scrollTo(0, 0); });
  app.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => startLight(byId(b.dataset.pick)));
  app.querySelectorAll("[data-topic]").forEach(b => b.onclick = () => start(b.dataset.topic, null));
  app.querySelectorAll("[data-q]").forEach(b => b.onclick = () => send(b.dataset.q));
  const df = document.getElementById("descForm");
  if (df) df.onsubmit = e => { e.preventDefault(); const t = document.getElementById("desc").value.trim(); if (t) start(t, null); };
  const cf = document.getElementById("chatForm");
  if (cf) cf.onsubmit = e => { e.preventDefault(); const i = document.getElementById("msg"); const t = i.value.trim(); if (t || st.pending) { i.value = ""; send(t); } };
  const kf = document.getElementById("codeForm");
  if (kf) kf.onsubmit = e => { e.preventDefault(); const c = document.getElementById("code").value.trim(); if (c) { store.set("bearCode", c); st.needCode = false; st.error = ""; render(); } };
  if (st.screen === "chat") window.scrollTo(0, document.body.scrollHeight);
}

for (const id of ["photo", "upload"]) {
  document.getElementById(id).onchange = async e => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    let pic;
    try { pic = await shrink(f); }
    catch { st.error = "That photo couldn't be opened. Try a different one, or describe what you see."; render(); return; }
    if (photoTarget === "chat" && st.screen === "chat") { st.pending = pic; render(); }
    else start("", pic);
  };
}

// Phone photos are large. Shrink to at most 1280 px on the long side as a JPEG
// before sending: faster on a weak signal, and cheaper for the AI to read.
async function shrink(file) {
  const url = URL.createObjectURL(file);
  const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
  const scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  const data = c.toDataURL("image/jpeg", 0.85).split(",")[1];
  return { url, media_type: "image/jpeg", data };
}

/* ---------- Conversation ---------- */
function reset() { Object.assign(st, { screen: "chat", turns: [], topic: "", level: "unsure", light: null, quick: [], busy: false, error: "", pending: null }); }

function start(text, pic) {
  reset();
  st.pending = pic;
  send(text);
}

function startLight(l) {
  reset();
  st.light = l; st.topic = l.name; st.level = l.level;
  const first = l.level === "stop"
    ? "Do the steps above first. Once you're stopped somewhere safe, tell me what's happening and I'll help with what comes next."
    : l.first;
  st.turns.push({ role: "assistant", content: first });
  st.quick = l.level === "stop" ? ["I've pulled over", "I'm on the highway", "What could cause this?"] : l.quick;
  render(); window.scrollTo(0, 0);
}

const RANK = { info: 0, unsure: 1, soon: 2, stop: 3 };
function applyMeta({ urgency, topic, suggestions }) {
  // Urgency only goes up on its own; it comes down only on a clear "info" call.
  if (LEVEL[urgency] && (RANK[urgency] >= RANK[st.level] || urgency === "info" || st.level === "unsure")) st.level = urgency;
  if (topic && !st.light) st.topic = topic.slice(0, 40);
  st.quick = (suggestions || []).slice(0, 3);
}

async function send(text) {
  if (st.busy) return;
  const pic = st.pending; st.pending = null;
  let content = text || "";
  if (pic) content = (content ? content + "\n\n" : "") + "[I attached a photo of the problem.]";
  if (!content) return;
  st.turns.push({ role: "user", content, display: text, photoUrl: pic?.url });
  st.busy = true; st.error = ""; st.quick = [];
  const bot = { role: "assistant", content: "", display: pic ? "Taking a look…" : "Thinking…", think: true };
  st.turns.push(bot);
  render();

  try {
    const res = DEMO ? await demoReply(content, !!pic) : await liveReply(bot, pic);
    bot.content = bot.display = res.text; bot.think = false;
    applyMeta(res);
  } catch (e) {
    st.turns.pop(); st.turns.pop();
    if (pic) st.pending = pic;
    if (e.status === 401) { st.needCode = true; st.screen = "home"; st.error = store.get("bearCode") ? "That tester code didn't work. Check it and try again." : ""; }
    else st.error = e.status === 429 ? "Too many messages in a row. Wait a minute and try again."
      : e.status === 413 ? "That photo is too big to send. Try a different one."
      : "That didn't go through. Check your signal and try again.";
    if (!st.turns.length) st.screen = "home";
  } finally {
    st.busy = false; render();
  }
}

async function liveReply(bot, pic) {
  // Only the newest photo goes to the AI; earlier photos are covered by the bear's own descriptions.
  const history = st.turns.filter(t => t !== bot).slice(-14).map(t => ({ role: t.role, content: t.content }));
  const r = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json", "x-bear-code": store.get("bearCode") },
    body: JSON.stringify({ messages: history, lightId: st.light?.id || null, image: pic ? { media_type: pic.media_type, data: pic.data } : null })
  });
  if (!r.ok) { const err = new Error("http"); err.status = r.status; throw err; }
  return r.json();
}

/* ---------- Demo answers (no AI) ---------- */
const DEMO_SCRIPT = [
  { re: /smoke|fire|burn|crash|fuel smell|gas smell/i, urgency: "stop", topic: "Smoke or burning smell",
    text: "If you see smoke or smell burning, get everyone out and away from the car, then call 911. Once you're safe, tell me what you noticed first.",
    suggestions: ["We're safe now", "It was just a smell"] },
  { re: /brake|grind|pedal/i, urgency: "stop", topic: "Brakes feel off",
    text: "Brake trouble isn't something to drive on. If the pedal feels soft or you hear grinding, pull over when it's safe and call for help. What did you notice?",
    suggestions: ["Pedal feels soft", "Grinding sound", "It pulls to one side"] },
  { re: /gauge|how do i check|check it/i, urgency: "soon", topic: "Checking tire pressure",
    text: "Press the gauge straight onto the valve until the hissing stops, then read the number. Compare it to the sticker inside your driver's door. What does it say?",
    suggestions: ["It's way below", "It's close", "It's above"] },
  { re: /tire|flat|low/i, urgency: "soon", topic: "Tire looks low",
    text: "A tire that looks low is worth checking before you drive far. Use the gauge in your kit and compare it to the number on your driver's door sticker. Want me to walk you through it?",
    suggestions: ["How do I check it?", "It looks totally flat"] },
  { re: /leak|puddle|drip/i, urgency: "unsure", topic: "Something's leaking",
    text: "Let's figure out what's leaking. What color is the puddle, and where is it under the car: front, middle or back?",
    suggestions: ["Green or orange", "Brown or black", "Clear like water"] },
  { re: /noise|sound|squeal|click|rattle/i, urgency: "unsure", topic: "A weird noise",
    text: "Noises can mean a lot of things. When do you hear it: when you brake, when you turn, or when you speed up?",
    suggestions: ["When I brake", "When I turn", "All the time"] },
  { re: /start/i, urgency: "unsure", topic: "Car won't start",
    text: "When you turn the key or press start, what happens: clicking, a slow crank, or nothing at all?",
    suggestions: ["Clicking", "Slow crank", "Nothing at all"] },
  { re: /light|red|amber|yellow|green|blue/i, urgency: "unsure", topic: "A light came on",
    text: "What color is the light: red, amber, or green or blue? You can also pick it from the light list on the home screen.",
    suggestions: ["Red", "Amber", "Green or blue"] }
];
function demoReply(content, hasPhoto) {
  return new Promise(ok => setTimeout(() => {
    const userTurns = st.turns.filter(t => t.role === "user").length;
    if (hasPhoto && userTurns === 1) return ok({
      text: "Here's where I'd tell you what I can see in your photo and check that I've got it right. For this demo, let's pretend it shows a tire that looks lower than the others. Does it look flatter than the rest?",
      urgency: "unsure", topic: "Photo check", suggestions: ["Yes, it's flatter", "How do I check it?"] });
    if (st.light) return ok({
      text: st.light.facts.split(". ").slice(0, 2).join(". ").replace(/\.?$/, ".") + " Anything else you're noticing?",
      urgency: st.light.level, topic: st.light.name, suggestions: ["What could cause this?", "Is it safe to drive?"] });
    const hit = DEMO_SCRIPT.find(s => s.re.test(content));
    if (hit) return ok(hit);
    ok({ text: "In the demo I can only give sample answers. Once the real AI is connected, I'll answer this properly. Try a topic from the home screen to see how a conversation flows.",
      urgency: st.level, topic: st.topic, suggestions: [] });
  }, 900));
}

/* ---------- Boot ---------- */
render();

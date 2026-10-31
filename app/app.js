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
const SYM = { // same symbols as the booklet
  oil_pressure: S('<path d="M2 12h3l1.5-2h5l1 2h2l6.5-3 .5 1-6 7H4a2 2 0 0 1-2-2z"/><path d="M7 7h4M9 7v3"/><path d="M21.6 14.6c0 .8-.6 1.4-1.1 1.4s-1.1-.6-1.1-1.4c0-.6.6-1.5 1.1-2 .5.5 1.1 1.4 1.1 2z" fill="currentColor"/>'),
  coolant_temp: S('<path d="M12 3v10"/><circle cx="12" cy="15" r="2.4" fill="currentColor"/><path d="M12 5h3M12 8h3M12 11h3"/><path d="M3 19c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0M3 22c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0"/>'),
  battery: S('<rect x="3" y="7" width="18" height="12" rx="1.5"/><path d="M6 7V5h3v2M15 7V5h3v2"/><path d="M6 13h4M14 13h4M16 11v4"/>'),
  brake: S('<text x="12" y="15" font-family="Roboto Condensed, sans-serif" font-size="6.8" font-weight="800" fill="currentColor" stroke="none" text-anchor="middle">BRAKE</text>'),
  check_engine: S('<path d="M2.5 7v5"/><path d="M4.5 6.5h2V5h3V3h5v2h2l2 2h2.5v6.5H19l-2 2H9.5l-2-2h-3z"/><path d="M2.5 9.5h2"/><text x="12" y="22.5" font-family="Roboto Condensed, sans-serif" font-size="6.2" font-weight="800" fill="currentColor" stroke="none" text-anchor="middle">CHECK</text>'),
  eps: S('<circle cx="9.5" cy="12" r="7"/><circle cx="9.5" cy="12" r="2"/><path d="M2.8 11h4.7M11.5 11h4.7M9.5 14v5"/><path d="M21 6.5v8"/><circle cx="21" cy="18" r="1" fill="currentColor"/>'),
  tpms: S('<path d="M5.5 5C4 7 3.5 9.5 3.5 12s.8 4.6 2 6h13c1.2-1.4 2-3.5 2-6s-.5-5-2-7"/><path d="M7 21v-3M10.3 21v-3M13.7 21v-3M17 21v-3"/><path d="M12 7v6"/><circle cx="12" cy="15.5" r=".9" fill="currentColor"/>'),
  abs: S('<text x="12" y="15.5" font-family="Roboto Condensed, sans-serif" font-size="10" font-weight="800" fill="currentColor" stroke="none" text-anchor="middle">ABS</text>'),
  traction: S('<path d="M5 13l1.8-5h10.4L19 13v3.5H5z"/><path d="M5 13h14"/><circle cx="8" cy="16.5" r="1.4" fill="currentColor"/><circle cx="16" cy="16.5" r="1.4" fill="currentColor"/><path d="M6 21c1.2-1.4 2-1.4 3 0s1.8 1.4 3 0M13 21c1.2-1.4 2-1.4 3 0s1.8 1.4 3 0"/>'),
  airbag: S('<circle cx="8" cy="4.5" r="2"/><path d="M7 8.5l-1.5 6.5h5l2 6"/><path d="M6 11l4 3"/><circle cx="16.5" cy="10.5" r="4.5" fill="currentColor"/>'),
  low_fuel: S('<rect x="4" y="4" width="10" height="16" rx="1.5"/><path d="M6.5 7h5v4h-5z"/><path d="M3 20h12"/><path d="M14 9h2l2 2v6a1.5 1.5 0 0 0 3 0V8.5L19 6.5"/>'),
  service: S('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5a1.5 1.5 0 0 0 2 2l5.8-5.8a4 4 0 0 0 5.4-5.4l-2.4 2.4-2-2z"/>'),
  high_beam: S('<path d="M12.5 5c5 0 8.5 3 8.5 7s-3.5 7-8.5 7z" fill="currentColor"/><path d="M2.5 7.5h6.5M2.5 10.5h6.5M2.5 13.5h6.5M2.5 16.5h6.5"/>'),
  seatbelt: S('<circle cx="12" cy="4.5" r="2"/><path d="M8 21v-8a4 4 0 0 1 8 0v8"/><path d="M9 10.5l6 7.5"/>'),
  master_warning: S('<path d="M12 3L22 20H2z" fill="currentColor" stroke="none"/><path d="M12 9v5" stroke="#231930" stroke-width="2.2"/><circle cx="12" cy="17" r="1.1" fill="#231930" stroke="none"/>'),
  door_open: S('<rect x="9" y="3" width="8" height="18" rx="3"/><path d="M9 9.5L4 12.5"/><path d="M10.5 7h5M10.5 16h5"/>')
};
// Symbol colors as they glow on a dashboard
const GLOW = { eps:"#FF5A5F", airbag:"#FF5A5F", oil_pressure:"#FF5A5F", coolant_temp:"#FF5A5F", battery:"#FF5A5F", brake:"#FF5A5F", seatbelt:"#FF5A5F", door_open:"#FF5A5F", high_beam:"#4D8DFF" };
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
  add: S('<path d="M12 5v14M5 12h14"/>', 2.4),
  chev: S('<path d="M6 9l6 6 6-6"/>', 2.2),
  car: S('<path d="M4 16v-4l2-5h12l2 5v4z"/><path d="M4 12h16"/><circle cx="8" cy="16" r="1.6"/><circle cx="16" cy="16" r="1.6"/>', 2),
  phone: S('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>', 2)
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

/* ---------- My car's numbers (saved on this phone only) ---------- */
const CAR_KEY = "bearCar";
let car = (() => { try { return JSON.parse(store.get(CAR_KEY) || "{}") || {}; } catch { return {}; } })();
let carDoc = null, carTimer = 0;
function saveCar() {
  store.set(CAR_KEY, JSON.stringify(car));
  if (carDoc) { clearTimeout(carTimer); carTimer = setTimeout(() => carDoc.set({ ...car }).catch(() => {}), 600); }
}
// Inside Claude, browser storage may not last, so the numbers are also kept in
// the viewer's own private Claude storage. Outside Claude this does nothing.
async function connectCarStore() {
  try {
    const use = window.claude?.use;
    if (!use) return;
    const [db, user] = await Promise.all([use("db"), use("user")]);
    const uid = db && user ? await user.id() : null;
    if (!uid) return;
    carDoc = db.doc("data/users/" + uid + "/car");
    const snap = await carDoc.get();
    if (snap.exists) { car = { ...snap.data() }; store.set(CAR_KEY, JSON.stringify(car)); if (st.screen !== "car") render(); }
    else if (Object.keys(car).length) carDoc.set({ ...car }).catch(() => {});
  } catch { carDoc = null; }
}
const telHref = n => "tel:" + String(n).replace(/[^0-9+]/g, "");
function carSummary() {
  const bits = [];
  if (car.model) bits.push(car.model);
  if (car.front || car.rear) bits.push(`Tires ${car.front || "?"} / ${car.rear || "?"} PSI`);
  if (car.oilType) bits.push(`Oil ${car.oilType}`);
  return bits.join(" · ");
}
// What the bear is told about this car. Phone numbers and insurance stay on the phone.
function carForBear() {
  const c = {};
  for (const k of ["model", "front", "rear", "spare", "spareKit", "oilType", "oilCheck"]) if (car[k]) c[k] = String(car[k]).slice(0, 60);
  return Object.keys(c).length ? c : null;
}

const demoNote = () => DEMO ? `<div class="demo"><b>Demo</b><span>Sample answers only. The real AI isn't connected yet.</span></div>` : "";

/* ---------- Add to home screen ----------
   Only in the installable app (index.html sets window.BEAR_PWA), never inside Claude. */
let installEvt = null;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const installed = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; if (st.screen === "home") render(); });
window.addEventListener("appinstalled", () => { installEvt = null; render(); });
function installCard() {
  if (!window.BEAR_PWA || installed() || store.get("bearInstallHide")) return "";
  const how = installEvt ? `<button class="btn lav" id="install">${I.add}Add to home screen</button>`
    : isIOS ? `<p class="small">Tap <b>Share</b> at the bottom of Safari, then <b>Add to Home Screen</b>.</p>` : "";
  if (!how) return "";
  return `<div class="codebox">
    <p class="small"><b>Keep the bear on your phone.</b> Add it to your home screen so it's one tap away, even with no signal.</p>
    ${how}
    <button class="linkbtn" id="installHide">Not now</button>
  </div>`;
}

/* ---------- Screens ---------- */
function home() {
  return `
  ${demoNote()}
  <div class="top" style="justify-content:space-between">
    <div class="brand">${GUIDE_BEAR}<span>Bear With Me</span></div>
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
  ${car.roadside ? `<a class="btn call" href="${telHref(car.roadside)}">${I.phone}Call roadside help</a>` : ""}
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
  <button class="carcard" id="openCar">
    <span class="carico">${I.car}</span>
    <span class="cartext"><b>My car's numbers</b><span class="small muted">${esc(carSummary() || "Tire pressure, oil type, roadside help. Fill it in while things are calm.")}</span></span>
    <span style="width:22px;height:22px;transform:rotate(-90deg)">${I.chev}</span>
  </button>
  ${installCard()}
  <details class="lightsbox">
    <summary><span>Look up a dashboard light</span><span style="width:22px;height:22px">${I.chev}</span></summary>
    ${["stop","soon","info"].map(lv => `
    <div class="label lvl">${chip(lv)}</div>
    <div class="lights">
      ${LIGHTS.filter(l => l.level === lv).map(l => `<button class="light" data-pick="${l.id}"><span class="sym" style="color:${GLOW[l.id] || "#F2B705"}">${SYM[l.id]}</span><b>${esc(l.name)}</b>${l.urgent ? `<span class="chip stop">${SHAPE.stop}Stop</span>` : ""}</button>`).join("")}
    </div>`).join("")}
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
    ${car.roadside ? `<a class="callbtn" href="${telHref(car.roadside)}">${I.phone}Call roadside help</a>` : `<p>Roadside help: your number is on page 2 of your booklet, or save it in My car's numbers.</p>`}
    <p>In danger, smoke or fire? Get away from the car and call <b>911</b>.</p>
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

function carScreen() {
  const txt = (k, label, opts = {}) => `<label class="field ${opts.cls || ""}"><span>${label}</span><input data-car="${k}" value="${esc(car[k] || "")}" ${opts.type ? `type="${opts.type}"` : 'type="text"'} ${opts.mode ? `inputmode="${opts.mode}"` : ""} placeholder="${opts.ph || ""}" autocomplete="off">${opts.unit ? `<em>${opts.unit}</em>` : ""}</label>`;
  const pick = (k, label, choices, multi) => `<div class="pickrow"><span>${label}</span><div class="topics">${choices.map(c => {
      const on = multi ? (car[k] || []).includes(c) : car[k] === c;
      return `<button type="button" class="${on ? "on" : ""}" aria-pressed="${on}" data-carpick="${k}" data-val="${esc(c)}" data-multi="${multi ? 1 : ""}">${esc(c)}</button>`; }).join("")}</div></div>`;
  return `
  <div class="head">
    <div class="headrow">
      <button class="round" id="home" aria-label="Back">${I.back}</button>
      <div class="t"><b>My car's numbers</b></div>
    </div>
  </div>
  <p class="muted small">Fill this in now, while things are calm. It's saved on this phone only, and the bear uses your car, tire and oil numbers when it helps you.</p>
  <section class="carsec">
    <div class="label">Car</div>
    ${txt("model", "Year, make, model", { ph: "e.g. 2019 Honda Civic" })}
  </section>
  <section class="carsec">
    <div class="label">Tire pressure · driver's door sticker</div>
    <div class="pair">${txt("front", "Front", { mode: "numeric", unit: "PSI" })}${txt("rear", "Rear", { mode: "numeric", unit: "PSI" })}</div>
    ${txt("spare", "Spare (if listed)", { mode: "numeric", unit: "PSI" })}
    ${pick("spareKit", "Car has", ["A spare", "Inflator kit", "Neither"])}
    <p class="hint" style="text-align:left">Use the sticker inside the driver's door, not the number on the tire.</p>
  </section>
  <section class="carsec">
    <div class="label">Oil · owner's manual</div>
    ${txt("oilType", "Type", { ph: "e.g. 0W-20" })}
    ${pick("oilCheck", "Check it", ["Warm", "Cold"])}
  </section>
  <section class="carsec">
    <div class="label">Roadside help</div>
    ${txt("roadside", "Phone", { type: "tel", mode: "tel", ph: "Number to call" })}
    ${pick("roadsideVia", "Through", ["Insurance", "Car maker", "Other"])}
  </section>
  <section class="carsec">
    <div class="label">Insurance</div>
    ${txt("insurer", "Company")}
    ${pick("cardIn", "Card is in", ["My kit", "Glove box", "My phone"], true)}
  </section>
  <p class="hint" id="saved" aria-live="polite">${carSummary() ? "Saved on this phone." : ""}</p>
  <div class="spacer"></div>`;
}

/* ---------- Render + events ---------- */
let photoTarget = "new";
function render() {
  app.innerHTML = st.screen === "chat" ? chat() : st.screen === "car" ? carScreen() : home();
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
  const pick = (target, input) => () => { photoTarget = target; document.getElementById(input).click(); };
  on("snap", pick("new", "photo"));
  on("up", pick("new", "upload"));
  on("addPhoto", pick("chat", "photo"));
  on("unpend", () => { st.pending = null; render(); });
  on("install", async () => { const e = installEvt; installEvt = null; await e?.prompt(); render(); });
  on("installHide", () => { store.set("bearInstallHide", "1"); render(); });
  on("openCar", () => { st.screen = "car"; render(); window.scrollTo(0, 0); });
  app.querySelectorAll("[data-car]").forEach(inp => inp.oninput = () => {
    car[inp.dataset.car] = inp.value.trim(); saveCar();
    const sv = document.getElementById("saved"); if (sv) sv.textContent = "Saved on this phone.";
  });
  app.querySelectorAll("[data-carpick]").forEach(b => b.onclick = () => {
    const k = b.dataset.carpick, v = b.dataset.val;
    if (b.dataset.multi) { const a = new Set(car[k] || []); a.has(v) ? a.delete(v) : a.add(v); car[k] = [...a]; }
    else car[k] = car[k] === v ? "" : v;
    saveCar(); render();
  });
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
  const stop = l.level === "stop" || l.urgent;
  st.light = l; st.topic = l.name; st.level = stop ? "stop" : l.level;
  const first = stop
    ? "Do the steps above first. Once you're stopped somewhere safe, tell me what's happening and I'll help with what comes next."
    : l.first;
  st.turns.push({ role: "assistant", content: first });
  st.quick = stop ? ["I've pulled over", "I'm on the highway", "What could cause this?"] : l.quick;
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
      : !navigator.onLine ? "No signal right now. The light lookup and your car's numbers still work."
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
    body: JSON.stringify({ messages: history, lightId: st.light?.id || null, car: carForBear(), image: pic ? { media_type: pic.media_type, data: pic.data } : null })
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
    if (hit && hit.topic === "Checking tire pressure" && (car.front || car.rear))
      return ok({ ...hit, text: `Press the gauge straight onto the valve until the hissing stops, then read the number. Your saved numbers are ${car.front || "?"} PSI front and ${car.rear || "?"} PSI rear. What does the gauge say?` });
    if (hit) return ok(hit);
    ok({ text: "In the demo I can only give sample answers. Once the real AI is connected, I'll answer this properly. Try a topic from the home screen to see how a conversation flows.",
      urgency: st.level, topic: st.topic, suggestions: [] });
  }, 900));
}

/* ---------- Boot ---------- */
render();
connectCarStore();

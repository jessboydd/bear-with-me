// Safety rules the app enforces itself, without relying on the AI. Shared by the
// app (banners, urgency label), the server (tells the bear what's on screen) and
// tests/safety.test.mjs. Banner wording comes from the pocket booklet (pp. 3-8, 12-15).
import { LIGHTS } from "./lights.js";

/* ---------- Urgency levels ---------- */
// stop:   stop driving; don't go on until someone checks it.
// check:  stop somewhere safe and look; what you find decides whether you drive on.
// soon:   a known, routine problem to get looked at in the next few days.
// info:   nothing is wrong (a normal indicator).
// unsure: not enough information yet.
export const LEVEL = { stop: "Stop safely now", check: "Stop & check", soon: "Check soon", info: "FYI", unsure: "Not sure yet" };
export const RANK = { info: 0, unsure: 1, soon: 2, check: 3, stop: 4 };
const higher = (a, b) => (RANK[a] ?? -1) >= (RANK[b] ?? -1) ? a : b;

/* ---------- Banners (verified wording) ---------- */
// Booklet p. 12, "Pull over, then read on".
export const STOP_STEPS = [
  "Signal, slow down, and pull over as far from traffic as you can.",
  "Turn on your hazard lights. Put the car in park and turn the engine off.",
  "Don't drive on until someone checks it. Call roadside help."
];
export const STOP_NOTE = "On a busy road, staying buckled in is often safest. If you get out, use the side away from traffic.";
// Each light's own first step (booklet pp. 5-8), shown above the steps.
export const STOP_FIRST = {
  oil_pressure: "Oil pressure: the engine may not be getting enough oil. Turn the engine off as soon as you've stopped.",
  coolant_temp: "Overheating: turn off the A/C, then the engine. Steam? Stay back. Never open the radiator or coolant cap while it's hot.",
  battery: "Charging: the car may stop running, so pull over while you still can.",
  brake: "Brakes: first make sure the parking brake is fully off. Still on? Pull over carefully.",
  eps: "Steering may suddenly feel very heavy. Hold the wheel firmly as you pull over.",
  abs: "ABS: the anti-lock brakes have a problem. If the red brake light is on too, stop right away."
};
// Stop & check: booklet p. 8 (stop and check all four), p. 14 (how), p. 15 (what it means).
export const CHECK = {
  tpms: {
    lead: "One or more tires may be low. Stop somewhere safe and check before you decide whether to drive on.",
    steps: [
      "Until you stop, avoid hard braking and sharp turns.",
      "Check all four tires with your gauge (booklet p. 14).",
      "Compare with the sticker inside the driver's door or your owner's manual, not the number on the tire."
    ],
    warn: "A tire that's flat, damaged, losing air or far below its number, or a car that pulls or shakes: don't drive on it. Call roadside help."
  },
  general: {
    lead: "This could be serious. Stop somewhere safe and look before you decide whether to drive on.",
    steps: [
      "Pull over when it's safe, as far from traffic as you can.",
      "Tell the bear what you see, hear or smell."
    ],
    warn: "If the car drives differently, or you see smoke or smell burning or fuel, don't drive on. Call for help."
  }
};
export const UNSURE_NOTE = "If it's red or flashing, or the car drives, sounds or smells different, pull over when it's safe.";
// When to call 911, by what the driver reported. Not every stop needs 911.
export const EMERGENCY = {
  fire: "Smoke, fire or a fuel smell: get everyone out and away from the car, then call 911.",
  crash: "After a crash: if anyone is hurt or you're in danger, call 911.",
  hurt: "Someone is hurt: call 911.",
  stranded: "Stuck in traffic lanes or on tracks: turn on your hazards. If you can't get the car out of the way safely, get away from it if you safely can, and call 911."
};

/* ---------- Reading the driver's message ---------- */
// Conservative on purpose: each rule needs the problem stated as happening now, so
// "I don't smell gas", "what if I smell gas?", "an accident last year" and quoted
// words don't set anything off. The AI still judges everything these miss.
const NEGATION = /\b(no|not|never|none|nothing|without|don'?t|doesn'?t|didn'?t|isn'?t|aren'?t|wasn'?t|weren'?t|haven'?t|hasn'?t|can'?t|cannot|couldn'?t|won'?t|neither|nor)\b/i;
const HYPOTHETICAL = /\b(what if|if|in case|suppose|supposing|imagine|should i|what (do|should) (i|you) do|what does|how do (i|you) know|is it (normal|bad|dangerous))\b/i;
// "No, there's smoke" starts with an answer word, not a negation of the smoke.
const LEADING_ANSWER = /^(no|nope|yes|yeah|yep|ok|okay|well|um|uh)\b[,!]?\s*/i;
const HISTORY = /\b(last (year|month|week|winter|summer|spring|fall|night)|(\d+|a|one|two|few|several|couple( of)?) (years?|months?|weeks?|days?) ago|yesterday|used to|in the past|previously|once before|a while (back|ago)|back in|years back)\b/i;
const RESOLVED = /\b(stopped|went away|gone|cleared|no longer|turned out|was nothing|is fixed|got fixed|fixed it|resolved|went out)\b/i;

// tier "911": get safe and call 911. tier "stop": stop safely now.
const RULES = [
  { kind: "fire", tier: "911", re: /\b(smoke|smoking|flames?|on fire)\b|\bfire\b(?!\s*(truck|engine|department|station|hydrant|fighters?|extinguisher))/i,
    // Exhaust vapor on a cold day is common; the bear judges that one.
    exclude: /\b(exhaust|tailpipe|cigarette|vape|vaping)\b|\b(someone|somebody|friend|passenger|he|she|they) (is |was )?smoking\b/i,
    present: /\b(there'?s|there is|there are|i (can )?see|i'?m seeing|seeing|coming (out|from|up)|pouring|under the hood|from (the |my )?(hood|engine|car|vents?|dash)|car is|engine is|hood is|it'?s|is on)\b/i },
  { kind: "fire", tier: "911", re: /\b(smell(s|ing)?|smelled|reeks?)\b[^.]{0,30}\b(gas|gasoline|fuel|petrol)\b|\b(gas|gasoline|fuel|petrol)\b[^.]{0,20}\b(smell|leak(ing)?|dripping|pouring|spilling)\b/i, present: /./ },
  { kind: "crash", tier: "911", re: /\b(crash(ed)?|accident|collision|rear[- ]ended|t-?boned|hit (by|me|another|a (car|truck|pole|tree|deer)))\b/i,
    present: /\b(just|right now|now|today|minutes? ago|a minute ago|happened|i'?m in|i am in|we'?re in|i'?ve been in|someone hit|got hit|hit me|i hit|i crashed|we crashed)\b/i },
  { kind: "hurt", tier: "911", re: /\b(is|are|am|'s|'re|'m|got|been) (badly |really |seriously |very )?(hurt|injured)\b|\b(bleeding|unconscious|not breathing|passed out|can'?t breathe)\b/i,
    present: /\b(someone|somebody|i'?m|i am|he'?s|she'?s|they'?re|we'?re|my (friend|passenger|kid|child|son|daughter|mom|dad|mother|father|partner|husband|wife|baby)|passenger)\b/i, negationAllowed: /not breathing|can'?t breathe/i },
  { kind: "stranded", tier: "911", re: /\b(stuck|stalled|broke(n)? down|died|won'?t (move|start))\b[^.]{0,40}\b(in (the )?(traffic|middle of the road|intersection|(left|right|fast|middle) lane|lane)|on (the )?(tracks|railroad|railway|highway|freeway|interstate))\b/i,
    present: /./, negationAllowed: /won'?t (move|start)/i },
  { kind: null, tier: "stop", re: /\b(brakes?|brake pedal|pedal)\b[^.]{0,30}\b(soft|spongy|sinks?|sinking|goes (all the way )?to the floor|to the floor|not working|don'?t work|doesn'?t work|failed|failing|gone out)\b|\b(car|it|brakes?) (can'?t|cannot|won'?t) stop\b|\bcan'?t stop the car\b/i,
    present: /./, negationAllowed: /don'?t work|doesn'?t work|not working|can'?t stop|cannot stop|won'?t stop/i },
  { kind: null, tier: "stop", re: /\b(steering|steering wheel|wheel)\b[^.]{0,30}\b(heavy|locked|stiff|won'?t turn|hard to turn|not working)\b|\bcan'?t steer\b/i,
    present: /./, negationAllowed: /won'?t turn|not working|can'?t steer/i },
  { kind: null, tier: "stop", re: /\b(steam(ing)?)\b/i, present: /\b(there'?s|i (can )?see|coming (out|from|up)|from (the |my )?(hood|engine)|under the hood|pouring|it'?s)\b/i },
  { kind: null, tier: "stop", re: /\b(burning|burnt|burned)\b[^.]{0,20}\bsmell|\bsmell(s|ing)?\b[^.]{0,15}\bburn/i, present: /./ },
  { kind: null, tier: "stop", re: /\boverheat(ing|ed)?\b|\b(temp(erature)? (gauge|light|warning|needle))\b[^.]{0,30}\b(red|high|hot|on|up)\b/i, present: /./ },
  { kind: null, tier: "stop", re: /\boil[- ]pressure\b[^.]{0,40}\b(light|warning|message|low|on)\b|\b(light|warning)\b[^.]{0,20}\boil[- ]pressure\b|\bred oil\b/i, present: /./ },
  { kind: null, tier: "stop", re: /\b(flashing|blinking)\b[^.]{0,30}\bcheck engine\b|\bcheck engine\b[^.]{0,30}\b(flashing|blinking)\b/i, present: /./ }
];

// Splits a message into clauses, so "I don't smell gas but there's smoke" is two checks.
function clauses(text) {
  return String(text || "")
    .replace(/[“”"«»][^“”"«»]{0,80}[“”"«»]/g, " ")      // quoted words aren't the driver's situation
    .split(/[.!?;\n]+|,\s*(?=but\b|and\b|so\b|though\b)|\bbut\b|\bthough\b/i)
    .map(s => s.trim().replace(LEADING_ANSWER, "")).filter(Boolean);
}
// True when a negation word comes before the match in the same clause.
const negatedBefore = (clause, index) => NEGATION.test(clause.slice(0, index));

// Returns { tier: "911" | "stop", kind, clause } or null.
export function checkMessage(text) {
  let found = null;
  for (const clause of clauses(text)) {
    if (HYPOTHETICAL.test(clause) || HISTORY.test(clause)) continue;
    for (const rule of RULES) {
      const m = clause.match(rule.re);
      if (!m || !rule.present.test(clause) || rule.exclude?.test(clause)) continue;
      // A negation before or inside the match ("no smoke", "brakes aren't soft") cancels it,
      // except words that state the problem itself ("the brakes don't work").
      const span = clause.slice(0, m.index) + (rule.negationAllowed ? m[0].replace(rule.negationAllowed, "") : m[0]);
      if (NEGATION.test(span)) continue;
      if (RESOLVED.test(clause.slice(m.index))) continue;
      const hit = { tier: rule.tier, kind: rule.kind, clause };
      if (!found || (hit.tier === "911" && found.tier !== "911")) found = hit;
    }
  }
  return found;
}

/* ---------- Lowering urgency ---------- */
// The driver's own words must report a change: the light went off, the problem stopped,
// or (for Stop & check) a reading from checking. The AI saying so isn't enough.
const CHANGE = /\b(went off|turned off|is off|it'?s off|its off|light'?s off|(light|it) (went|is|has gone) out|is gone|it'?s gone|went away|disappeared|(it'?s|is|got|was) fixed|fixed it|resolved|cleared|no longer (on|there|flashing|happening)|(it|smoke|steam|noise|smell|light|beeping|flashing) (has )?stopped|stopped (flashing|smoking|beeping|happening)|was (just )?(the|my) parking brake|parking brake was on|it was nothing)\b/i;
const READING = /\b\d{2}(\.\d)?\s*(psi)?\b|\b(checked|measured)\b/i;
export function driverReportsChange(text, level) {
  for (const clause of clauses(text)) {
    if (HYPOTHETICAL.test(clause)) continue;
    const m = clause.match(CHANGE) || (level === "check" && clause.match(READING));
    if (m && !negatedBefore(clause, m.index)) return true;
  }
  return false;
}

// Works out what the app shows after the bear replies.
//   current: level on screen now. floor: the lowest level allowed (from a picked light
//   or the emergency check). ai: the bear's URGENCY. lower: the bear's LOWER reason.
//   driverText: the driver's newest message.
// Stop and Stop & check stay on screen until the driver reports a change AND the bear agrees.
export function nextLevel({ current, floor, ai, lower, driverText }) {
  const said = RANK[ai] !== undefined ? ai : current;
  const changed = !!lower && driverReportsChange(driverText, current);
  if (changed) return { level: said, floor: null, lowered: RANK[said] < RANK[current] ? lower : "" };
  let level = said;
  if (RANK[current] >= RANK.check && RANK[level] < RANK[current]) level = current;
  if (floor) level = higher(level, floor);
  return { level, floor, lowered: "" };
}

/* ---------- What the bear is told is on screen ---------- */
export function describeShown(shown) {
  if (!shown || !RANK.hasOwnProperty(shown.level)) return "";
  const light = LIGHTS.find(l => l.id === shown.light);
  const lines = [`The app is showing the label "${LEVEL[shown.level]}".`];
  if (shown.level === "stop") {
    if (light && STOP_FIRST[light.id]) lines.push(STOP_FIRST[light.id]);
    lines.push(...STOP_STEPS.map((s, i) => `${i + 1}. ${s}`), STOP_NOTE);
  } else if (shown.level === "check") {
    const c = light?.id === "tpms" ? CHECK.tpms : CHECK.general;
    lines.push(c.lead, ...c.steps.map((s, i) => `${i + 1}. ${s}`), c.warn);
  } else if (shown.level === "unsure") lines.push(UNSURE_NOTE);
  if (EMERGENCY[shown.emergency]) lines.unshift(EMERGENCY[shown.emergency]);
  return lines.join("\n");
}

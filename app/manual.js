// Reads an owner's manual PDF on the phone and asks the server to pull out the car's facts.
// The PDF never leaves the phone: only the text of pages that look useful is sent,
// in parts, to /api/manual. Loaded only when someone picks a manual.
import { MANUAL_FIELDS } from "./manual-fields.js";

const PDFJS = "./vendor/pdfjs/pdf.min.mjs";
const WORKER = new URL("./vendor/pdfjs/pdf.worker.min.mjs", import.meta.url).href;
// Words that mark pages worth reading. Everything else (radio, seats, warranty...) is skipped.
const USEFUL = /tire|tyre|psi|kpa|inflation|spare|jack|lug nut|oil|sae|viscosity|\b[05]w-?\d{2}\b|coolant|antifreeze|fuel|octane|gasoline|fuse|hood|capacit|specification|maintenance|service interval/gi;
const MAX_PAGES_READ = 300;   // most useful pages sent, whatever the manual's size
const PART_CHARS = 50_000;    // text per request, well under the server's limit
const PART_PAGES = 50;
const AT_ONCE = 3;            // requests in flight

export class ManualError extends Error {
  constructor(kind, status) { super(kind); this.kind = kind; this.status = status; }
}

// Text of every page: [{ n, text }].
export async function readPdf(file, onProgress) {
  const pdfjs = await import(PDFJS);
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  let doc;
  try { doc = await task.promise; }
  catch (e) { throw new ManualError(e?.name === "PasswordException" ? "locked" : "unreadable"); }
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const { items } = await page.getTextContent();
    const text = items.map(i => i.str + (i.hasEOL ? "\n" : " ")).join("").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
    pages.push({ n, text });
    page.cleanup();
    if (n % 10 === 0 || n === doc.numPages) onProgress?.({ stage: "read", done: n, total: doc.numPages });
  }
  task.destroy();
  if (pages.reduce((a, p) => a + p.text.length, 0) < 2000) throw new ManualError("no text");
  return pages;
}

// The pages most likely to hold the facts, in page order.
export function usefulPages(pages) {
  return pages
    // The first pages usually name the car, so they always go along.
    .map(p => ({ ...p, score: (p.text.match(USEFUL) || []).length + (p.n <= 5 && p.text ? 2 : 0) }))
    .filter(p => p.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PAGES_READ)
    .sort((a, b) => a.n - b.n)
    .map(({ n, text }) => ({ n, text: text.slice(0, 6000) }));
}

export function parts(pages) {
  const out = [];
  let cur = [], size = 0;
  for (const p of pages) {
    if (cur.length && (size + p.text.length > PART_CHARS || cur.length >= PART_PAGES)) { out.push(cur); cur = []; size = 0; }
    cur.push(p); size += p.text.length;
  }
  if (cur.length) out.push(cur);
  return out;
}

// Same fact found more than once becomes one choice with all its pages.
export function mergeFacts(facts) {
  const byKey = {};
  for (const f of facts) {
    const list = byKey[f.key] ||= [];
    const norm = f.value.toLowerCase().replace(/\s+/g, " ");
    let c = list.find(x => x.norm === norm);
    if (!c) list.push(c = { norm, value: f.value, notes: [], pages: [], count: 0 });
    c.count++;
    if (f.note && !c.notes.includes(f.note)) c.notes.push(f.note);
    if (f.page && !c.pages.includes(f.page)) c.pages.push(f.page);
  }
  return MANUAL_FIELDS.filter(f => byKey[f.key]).map(f => ({
    key: f.key, label: f.label, unit: f.unit || "", car: f.car || "",
    choices: byKey[f.key].sort((a, b) => b.count - a.count || (a.pages[0] ?? 1e9) - (b.pages[0] ?? 1e9)).slice(0, 4)
      .map(({ value, notes, pages }) => ({ value, note: notes.slice(0, 2).join("; "), pages: pages.sort((a, b) => a - b).slice(0, 3) }))
  }));
}

// The whole job: read, pick pages, ask the server part by part, merge.
export async function analyzeManual(file, { code, onProgress, api = "/api/manual" }) {
  const pages = await readPdf(file, onProgress);
  const todo = parts(usefulPages(pages));
  if (!todo.length) throw new ManualError("nothing found");
  const facts = [];
  let done = 0, next = 0;
  onProgress?.({ stage: "find", done, total: todo.length });
  async function worker() {
    while (next < todo.length) {
      const part = todo[next++];
      const r = await fetch(api, { method: "POST", headers: { "content-type": "application/json", "x-bear-code": code || "" }, body: JSON.stringify({ pages: part }) });
      if (!r.ok) throw new ManualError("http", r.status);
      facts.push(...((await r.json()).facts || []));
      onProgress?.({ stage: "find", done: ++done, total: todo.length });
    }
  }
  await Promise.all(Array.from({ length: Math.min(AT_ONCE, todo.length) }, worker));
  return { pageCount: pages.length, found: mergeFacts(facts) };
}

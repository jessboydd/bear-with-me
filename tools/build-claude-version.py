"""Build the Claude version of Ask the Bear from the standalone app.

    python3 tools/build-claude-version.py OUTPUT.html

Inlines app/lights.js, swaps the server call (api/chat.js) for Claude's own
AI ("sample"), and copies the bear's rules from api/chat.js, so both versions
stay the same. Publish with capabilities:
    {"sample": {"images": true}, "db": {}, "user": {}}
"""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
app = (ROOT / "app/app.js").read_text()
lights = (ROOT / "app/lights.js").read_text()
api = (ROOT / "api/chat.js").read_text()
html = (ROOT / "app/index.html").read_text()

def sub(a, b, s):
    assert a in s, "build step no longer matches: " + a[:70]
    return s.replace(a, b)

lights = re.sub(r"^//.*\n", "", lights, flags=re.M).replace("export const LIGHTS", "const LIGHTS")
app = sub('import { LIGHTS } from "./lights.js";\n', lights + "\n", app)

a = app.index("/* ---------- Mode ----------"); b = app.index("const TOPICS")
app = app[:a] + '''/* ---------- Mode ----------
   Inside Claude: the bear's AI comes from Claude ("sample").
   If Claude's AI isn't available where the page is open, the bear gives demo answers. */
let sample = null, DEMO = true, photosBlocked = false;
const NO_PHOTOS = "Claude doesn't allow photos where this page is open right now. Describe what you see in words instead. (Photos work in the standalone app.)";

''' + app[b:]

fn = api[api.index("// The driver's own saved numbers"):api.index("// Returns Anthropic-ready messages")]
fn = fn.replace("export function", "function").replace("export const", "const")
app = sub("/* ---------- Demo answers (no AI) ---------- */", fn + "\n/* ---------- Demo answers (no AI) ---------- */", app)

a = app.index("async function liveReply")
b = app.rindex("}", 0, app.index("// The driver's own saved numbers")) + 1
app = app[:a] + r'''async function sampleReply(bot, pic) {
  const history = st.turns.filter(t => t !== bot).slice(-14).map(t => ({ role: t.role, content: t.content }));
  const input = [{ role: "user", content: rules(st.light, carForBear()) }];
  if (history[0]?.role === "assistant") input.push({ role: "user", content: "(I opened the chat.)" });
  input.push(...history);
  const opts = { cache: false, onText: ({ text }) => {
    const v = text.split(META)[0].replace(/\n\s*(U|UR|URG\w*|T|TO|TOP\w*|S|SU|SUG\w*)$/i, "").trim();
    if (!v) return;
    bot.display = v; bot.think = false;
    const el = document.getElementById("chatlog")?.lastElementChild;
    if (el) { el.textContent = v; el.classList.remove("think"); window.scrollTo(0, document.body.scrollHeight); }
  } };
  // Like the standalone app, the newest photo goes with every message so the bear keeps seeing it.
  const photo = pic || st.photo;
  if (photo) opts.images = [photo.file];
  const { text: full } = await sample(input, opts);
  return parse(full);
}
''' + app[b:]
app = sub("await liveReply(bot, pic)", "await sampleReply(bot, pic)", app)
old = app[app.index("    if (e.status === 401)"):app.index('    if (!st.turns.length) st.screen = "home";')]
app = app.replace(old, '''    const code = e?.code;
    if (code === "images_unavailable") { photosBlocked = true; st.pending = null; }
    if (code === "not_granted" || code === "sampling_disabled") { sample = null; DEMO = true; }
    st.error = ({
      not_granted: "Claude's AI isn't available here, so the bear is giving demo answers.",
      sampling_disabled: "Claude's AI isn't available on this account, so the bear is giving demo answers.",
      rate_limited: "Too many messages in a row. Wait a minute and try again.",
      image_rejected: "That photo couldn't be read. Try a different one, a little closer.",
      images_unavailable: NO_PHOTOS,
      refused: "I can't help with that one. Try asking another way."
    })[code] || "That didn't go through. Check your signal and try again.";
''')
app = sub("const pick = (target, input) => () => { photoTarget = target;",
          "const pick = (target, input) => () => { if (photosBlocked) { st.error = NO_PHOTOS; render(); return; } photoTarget = target;", app)
app = sub('return { url, media_type: "image/jpeg", data };', 'return { url, media_type: "image/jpeg", data, file };', app)
app = sub("<span>Sample answers only. The real AI isn't connected yet.</span>",
          "<span>Sample answers only. Claude's AI isn't available where this is open.</span>", app)
a = app.index("// Show the tester code box right away"); b = app.index("\n", app.index("if (!DEMO) checkCode(", a)) + 1
app = app[:a] + app[b:]
app = sub("/* ---------- Boot ---------- */\nrender();", '''/* ---------- Boot ---------- */
render();
(async () => {
  try { sample = await window.claude?.use?.("sample") ?? null; } catch { sample = null; }
  DEMO = !sample; render();
})();''', app)
assert "liveReply" not in app and "checkCode(store" not in app and "export " not in app and "import " not in app

css = html.split("<style>")[1].split("</style>")[0]
page = f'''<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ask the Bear</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@700;800&family=Figtree:wght@400;500;600;700&display=swap">
<style>{css}</style>

<div class="app" id="app"></div>
<input type="file" id="photo" accept="image/*" capture="environment" hidden>
<input type="file" id="upload" accept="image/*" hidden>

<script>
/* Ask the Bear, Claude version. Built by tools/build-claude-version.py from the
   standalone app in jessboydd/bear-with-me, so both stay the same. */
{app}</script>
'''
pathlib.Path(sys.argv[1]).write_text(page)
print("wrote", sys.argv[1], len(page), "bytes")

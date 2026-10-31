// Runs the app on your computer, including the private /api/chat piece.
//   ANTHROPIC_API_KEY=... BEAR_ACCESS_CODE=... npm run dev
// then open http://localhost:3000/app/  (add ?demo for sample answers).
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./api/chat.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml" };

// Just enough of Vercel's req/res helpers for api/chat.js.
function vercelRes(res) {
  res.status = code => { res.statusCode = code; return res; };
  res.json = obj => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(obj)); return res; };
  return res;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/chat") {
    let raw = "";
    for await (const chunk of req) { raw += chunk; if (raw.length > 5_000_000) return vercelRes(res).status(413).json({ error: "too large" }); }
    try { req.body = JSON.parse(raw || "{}"); } catch { return vercelRes(res).status(400).json({ error: "bad json" }); }
    return handler(req, vercelRes(res));
  }
  let file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) { res.statusCode = 403; return res.end(); }
  if (url.pathname.endsWith("/")) file = path.join(file, "index.html");
  else if (!path.extname(file)) { res.writeHead(301, { location: url.pathname + "/" + url.search }); return res.end(); }
  if (path.basename(file).startsWith(".")) { res.statusCode = 404; return res.end("Not found"); }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-cache" });
    res.end(body);
  } catch { res.statusCode = 404; res.end("Not found"); }
}).listen(PORT, () => console.log(`Ask the Bear: http://localhost:${PORT}/app/`));

// Calls the Anthropic API for the bear, and asks once more when a reply runs out of
// room or comes back empty. Shared by api/chat.js and api/manual.js. (Files starting
// with "_" in api/ are helpers, not web addresses.)
//
// Why: the model thinks before it answers, and that thinking counts toward max_tokens.
// With a tight limit, the thinking could use it all up, leaving a reply cut off
// mid-sentence or no reply at all (found in the November 22, 2026 comparison).

export async function askClaude({ request, complete, retryWithinMs = Infinity }) {
  const started = Date.now();
  let last = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(request)
    });
    if (!r.ok) return { error: r.status, detail: await r.text() };
    const data = await r.json();
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    last = { text, stopReason: data.stop_reason, attempts: attempt };
    if (data.stop_reason !== "max_tokens" && complete(text)) return { ...last, ok: true };
    console.warn(`Reply incomplete (stop_reason ${data.stop_reason}, ${text.length} characters), attempt ${attempt}`);
    // Only ask again if there's time left before the server's own time limit.
    if (Date.now() - started > retryWithinMs) break;
  }
  return { ...last, ok: false };
}

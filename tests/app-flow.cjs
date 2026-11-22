// Checks the app's urgency labels, banners and emergency check in a phone-sized
// browser, with the bear's replies scripted (no AI, no key, no cost).
//   npm run dev   (in another terminal), then:   node tests/app-flow.cjs
// Needs Playwright (npm i -D playwright). Screenshots go to tests/results/screens/.
const { chromium, devices } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = process.env.BEAR_URL || "http://localhost:3000/app/";
const SHOTS = path.join(__dirname, "results", "screens");
fs.mkdirSync(SHOTS, { recursive: true });
const reply = (text, urgency, extra = {}) => ({ text, urgency, topic: extra.topic || "Test", light: extra.light || "", lower: extra.lower || "", suggestions: extra.suggestions || ["OK"] });

let failures = 0;
const check = (ok, what) => { console.log(`${ok ? "pass" : "FAIL"}  ${what}`); if (!ok) failures++; };

(async () => {
  const browser = await chromium.launch();
  async function phone(replies, delay = 50) {
    const ctx = await browser.newContext({ ...devices["iPhone 13"], serviceWorkers: "block" });
    const page = await ctx.newPage();
    const sent = [];
    await page.route("**/api/chat", async r => {
      if (r.request().method() === "GET") return r.fulfill({ json: { needsCode: false, codeOk: true } });
      sent.push(JSON.parse(r.request().postData()));
      await new Promise(ok => setTimeout(ok, delay));
      r.fulfill({ json: replies.shift() || reply("Okay.", "unsure") });
    });
    await page.goto(BASE);
    return { page, sent, ctx };
  }
  const chipText = page => page.textContent(".headrow .chip");
  const typeAndSend = async (page, text) => { await page.fill("#msg", text); await page.click("#chatForm .send"); };
  const startTyped = async (page, text) => { await page.fill("#desc", text); await page.click("#descForm button"); };
  const pickLight = async (page, id) => { await page.click("summary"); await page.click(`[data-pick=${id}]`); };
  const waitReply = page => page.waitForFunction(() => !document.querySelector(".msg.think"));

  // 1. Red oil light picked: Stop safely now, its own first step, and the bear can't lower it.
  { const { page, ctx } = await phone([reply("Okay. Tell me when you've stopped.", "info")]);
    await pickLight(page, "oil_pressure");
    check(/stop safely now/i.test(await chipText(page)), "oil light: label is STOP SAFELY NOW");
    check(/Turn the engine off as soon as you've stopped/.test(await page.textContent(".banner")), "oil light: banner has the oil light's own first step");
    await page.screenshot({ path: path.join(SHOTS, "1-oil-stop-banner.png") });
    await typeAndSend(page, "What could cause this?"); await waitReply(page);
    check(/stop safely now/i.test(await chipText(page)), "oil light: stays Stop safely now when the bear says info without a reported change");
    await ctx.close(); }

  // 2. Brake light, then the driver reports it was the parking brake and the bear agrees.
  { const { page, ctx } = await phone([reply("Great, that explains it.", "info", { lower: "parking brake was on" })]);
    await pickLight(page, "brake");
    await typeAndSend(page, "It was the parking brake, the light's off now"); await waitReply(page);
    check(/fyi/i.test(await chipText(page)), "brake light: lowered to FYI after the driver reports it was the parking brake");
    check(!(await page.$(".banner")), "brake light: banner removed once resolved");
    check(/Now: FYI/.test(await page.textContent(".change")), "brake light: a note says why the label changed");
    await page.screenshot({ path: path.join(SHOTS, "2-brake-resolved.png") });
    await ctx.close(); }

  // 3. "I smell gas": the app shows the stop banner with the 911 line before the bear even answers.
  { const { page, ctx } = await phone([reply("Get everyone away from the car and call 911.", "stop")], 1500);
    await startTyped(page, "I smell gas");
    await page.waitForSelector(".msg.think");
    check(!!(await page.$(".banner .sos")), "gas smell: 911 line shows right away, before the bear replies");
    check(/911/.test(await page.textContent(".banner .sos")), "gas smell: the line says call 911");
    await page.screenshot({ path: path.join(SHOTS, "3-gas-911.png") });
    await ctx.close(); }

  // 4. Negated and historical statements don't trigger anything.
  for (const text of ["I don't smell gas, but my check engine light is on and steady", "I was in an accident last year and now there's a rattle"]) {
    const { page, ctx } = await phone([reply("Let's look at that.", "soon")], 800);
    await startTyped(page, text);
    await page.waitForSelector(".msg.think");
    check(!(await page.$(".banner")), `no false alarm: "${text}"`);
    await ctx.close();
  }

  // 5. Test 2 typed: the bear recognizes the tire light, so the app shows the verified tire banner,
  //    keeps it through "it's cold", and lowers only after readings the bear agrees with.
  { const { page, sent, ctx } = await phone([
      reply("Tires can look fine and still be low. Follow the steps at the top.", "check", { light: "tpms", topic: "Yellow tire light" }),
      reply("Cold can lower pressure, but don't skip the check.", "soon"),
      reply("Close to your number, so adding air at a nearby pump may be appropriate.", "soon", { lower: "readings close to the door number" })]);
    await startTyped(page, "A yellow light that looks like a flat tire with an exclamation point just came on. My tire looks fine I think. Is it still safe to drive?");
    await waitReply(page);
    check(/stop & check/i.test(await chipText(page)), "tire light: label is STOP & CHECK");
    const banner = await page.textContent(".banner.check");
    check(/driver's door/.test(banner) && /roadside help/.test(banner) && !/spare/i.test(banner), "tire light: banner gives the gauge, door sticker and roadside steps, no spare");
    await page.screenshot({ path: path.join(SHOTS, "5-tire-check-banner.png") });
    await typeAndSend(page, "It's steady. It may be because it's cold outside. Can I ignore it until I get home?"); await waitReply(page);
    check(/stop & check/i.test(await chipText(page)), "tire light: stays STOP & CHECK after 'it's cold'");
    check(sent[1].lightId === "tpms" && sent[1].shown.level === "check", "tire light: the bear is told the light and what's on screen");
    await typeAndSend(page, "All four read 33 and the door sticker says 35"); await waitReply(page);
    check(/check soon/i.test(await chipText(page)), "tire light: lowered to Check soon after readings the bear agrees with");
    check(!sent.some(b => b.messages.some(m => m.content.startsWith("Now:"))), "notes about label changes are never sent to the bear");
    await ctx.close(); }

  // 6. Not sure yet: the rule of thumb and a button into the light list.
  { const { page, ctx } = await phone([reply("I can't tell which light that is yet. What color is it?", "unsure", { topic: "Unclear dashboard light" })]);
    await startTyped(page, "This warning light came on in my car. Can you tell me what it means and whether it's safe to keep driving?");
    await waitReply(page);
    check(/not sure yet/i.test(await chipText(page)), "unclear light: label is NOT SURE YET");
    check(/red or flashing/.test(await page.textContent(".unsure-card")), "unclear light: card shows the red-or-flashing rule");
    await page.screenshot({ path: path.join(SHOTS, "6-unsure-card.png") });
    await page.click("#openLights");
    check(await page.$eval("details.lightsbox", d => d.open), "unclear light: button opens the light list");
    await ctx.close(); }

  // 7. Light list: grouped like the booklet, with each light's real urgency where it differs.
  { const { page, ctx } = await phone([]);
    await page.click("summary");
    const tpms = await page.textContent("[data-pick=tpms]"), abs = await page.textContent("[data-pick=abs]");
    check(/stop & check/i.test(tpms) && /stop safely now/i.test(abs), "light list: tire shows Stop & check, ABS shows Stop safely now");
    await page.screenshot({ path: path.join(SHOTS, "7-light-list.png"), fullPage: true });
    await ctx.close(); }

  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed` : "\nAll app checks passed");
  process.exit(failures ? 1 : 0);
})();

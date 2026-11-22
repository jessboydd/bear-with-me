// Tests for the app's own safety rules (app/safety.js). No AI, no network.
//   node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { checkMessage, driverReportsChange, nextLevel, describeShown } from "../app/safety.js";

const tier = t => checkMessage(t)?.tier ?? null;

test("real emergencies call for 911", () => {
  for (const t of [
    "I smell gas",
    "There's smoke coming out of the hood",
    "My car is on fire",
    "Smoke is pouring from the engine!!",
    "No, there's smoke coming from under the hood",
    "I just got rear-ended and my neck hurts",
    "I was just in an accident",
    "Someone hit me a minute ago",
    "My passenger is bleeding",
    "My car stalled in the middle lane of the highway",
    "I don't smell gas, but there's smoke coming out of the vents",
    "It smells like gasoline inside the car",
    "Fuel is leaking under the car"
  ]) assert.equal(tier(t), "911", t);
});

test("stop-driving problems ask to stop, not to call 911", () => {
  for (const t of [
    "I'm driving and a red oil-pressure warning light just came on. I'm about 10 minutes away from home I believe. Should I keep driving?",
    "The brake pedal feels soft and sinks to the floor",
    "My brakes don't work right",
    "There's steam coming from the hood",
    "I smell something burning",
    "The temperature gauge is in the red",
    "My car is overheating",
    "The check engine light is flashing",
    "The steering wheel suddenly got really heavy"
  ]) assert.equal(tier(t), "stop", t);
});

test("negated statements don't set anything off", () => {
  for (const t of [
    "I don't smell gas",
    "There's no smoke",
    "No smoke or fire, just a light",
    "It's not overheating, the gauge is normal",
    "Nobody is hurt and there was no accident",
    "My brakes aren't soft or spongy",
    "I haven't smelled anything burning",
    "I don't see any steam",
    "There isn't any smoke coming from the hood",
    "We're not hurt"
  ]) assert.equal(tier(t), null, t);
});

test("hypothetical questions don't set anything off", () => {
  for (const t of [
    "What if I smell gas?",
    "If there's smoke coming from the hood, what should I do?",
    "What should I do if my brakes feel soft?",
    "What does a burning smell usually mean?",
    "In case my car overheats, what do I do?",
    "Is it normal to smell gas after filling up?"
  ]) assert.equal(tier(t), null, t);
});

test("past events don't set anything off", () => {
  for (const t of [
    "I was in an accident last year",
    "I was in an accident last year and now there's a rattle",
    "My car overheated two years ago",
    "Yesterday I smelled gas but it's fine now",
    "My brakes used to feel soft before the repair",
    "A while back there was smoke from the engine"
  ]) assert.equal(tier(t), null, t);
});

test("quoted words and resolved problems don't set anything off", () => {
  for (const t of [
    'The booklet says "get away if you smell gas"',
    "The smoke stopped after I turned the car off",
    "The burning smell went away"
  ]) assert.equal(tier(t), null, t);
});

test("everyday messages from the November 22 tests don't set anything off", () => {
  for (const t of [
    "A yellow light that looks like a flat tire with an exclamation point just came on. My tire looks fine I think. Is it still safe to drive?",
    "It's steady. It may be because it's cold outside. Can I ignore it until I get home?",
    "There's a blue light on my dashboard that looks like a headlight with straight lines coming out of it. Is something wrong with my car??",
    "No, it's still on",
    "I'm driving on a dark road and theirs a car ahead of me going the same direction. Should I keep my high beams on so I can see better in this dark?",
    "This warning light came on in my car. Can you tell me what it means and whether it's safe to keep driving?",
    "It's steady. And that's the best picture I can get.",
    "My front tire is a little low",
    "I can't stop worrying about this light"
  ]) assert.equal(tier(t), null, t);
});

test("everyday words that only sound alarming don't set anything off", () => {
  for (const t of [
    "There's a fire truck behind me with its lights on",
    "There's white smoke from the exhaust on this cold morning, is that normal?",
    "My friend is smoking in the car and it smells",
    "The gas light came on",
    "It's a gas station brand of oil, is that okay?",
    "The accident report from my insurance came in the mail",
    "My kid hurt his knee at school, unrelated, but the tire light is on"
  ]) assert.equal(tier(t), null, t);
});

test("a driver reports a change only in their own words, not hypothetically", () => {
  assert.equal(driverReportsChange("The light went off after I released the parking brake", "stop"), true);
  assert.equal(driverReportsChange("It was the parking brake, it's off now", "stop"), true);
  assert.equal(driverReportsChange("The light hasn't gone away", "stop"), false);
  assert.equal(driverReportsChange("It's still on", "stop"), false);
  assert.equal(driverReportsChange("What if it goes away?", "stop"), false);
  assert.equal(driverReportsChange("I've stopped the car on the shoulder", "stop"), false);
  assert.equal(driverReportsChange("All four read 34 and the door says 35", "check"), true);
  assert.equal(driverReportsChange("All four read 34 and the door says 35", "stop"), false);
});

test("a picked light keeps its urgency until the driver reports a change", () => {
  // Red oil light picked: the bear can't lower it on its own.
  let r = nextLevel({ current: "stop", floor: "stop", ai: "info", lower: "", driverText: "What could cause this?" });
  assert.equal(r.level, "stop");
  // Even if the bear says LOWER, the driver has to have said something changed.
  r = nextLevel({ current: "stop", floor: "stop", ai: "soon", lower: "light went off", driverText: "I'm on the highway" });
  assert.equal(r.level, "stop");
  // Both agree: the brake light was the parking brake.
  r = nextLevel({ current: "stop", floor: "stop", ai: "info", lower: "parking brake was on", driverText: "It was the parking brake, the light's off now" });
  assert.equal(r.level, "info"); assert.equal(r.floor, null); assert.match(r.lowered, /parking brake/);
  // Tire check: readings reported and the bear agrees.
  r = nextLevel({ current: "check", floor: "check", ai: "soon", lower: "tires measured close to the door number", driverText: "All four read 33, the sticker says 35" });
  assert.equal(r.level, "soon");
});

test("the bear can raise urgency at any time, and settle an unsure chat", () => {
  assert.equal(nextLevel({ current: "soon", floor: null, ai: "stop", lower: "", driverText: "now it's flashing" }).level, "stop");
  assert.equal(nextLevel({ current: "unsure", floor: null, ai: "info", lower: "", driverText: "it's blue" }).level, "info");
  assert.equal(nextLevel({ current: "soon", floor: null, ai: "info", lower: "", driverText: "ok" }).level, "info");
  // A stop the bear chose itself also stays until the driver reports a change (Test 1 pushback).
  assert.equal(nextLevel({ current: "stop", floor: null, ai: "check", lower: "", driverText: "What if I just take the next exit?" }).level, "stop");
});

test("the bear is told what's on screen, in the booklet's words", () => {
  const s = describeShown({ level: "check", light: "tpms" });
  assert.match(s, /Stop & check/); assert.match(s, /door/); assert.match(s, /roadside help/);
  assert.doesNotMatch(s, /spare/i);
  assert.match(describeShown({ level: "stop", light: "oil_pressure" }), /Turn the engine off/);
  assert.match(describeShown({ level: "stop", emergency: "fire" }), /911/);
  const fire = describeShown({ level: "stop", emergency: "fire" });
  assert.ok(fire.indexOf("pull over") < fire.indexOf("get everyone out"), "smoke: pull over comes before getting out");
  assert.equal(describeShown({ level: "nonsense" }), "");
});

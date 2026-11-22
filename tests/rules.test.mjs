// Tests for the bear's rules (api/chat.js): what they say in each situation. No AI calls.
//   node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { rules } from "../api/chat.js";

test("steps on screen are only mentioned when steps are showing", () => {
  for (const level of ["info", "unsure", "soon"]) {
    const r = rules(null, null, { level, light: "", emergency: "" });
    assert.doesNotMatch(r, /Follow the steps at the top/, level);
    assert.match(r, /never mention "steps at the top"/, level);
  }
  for (const level of ["stop", "check"]) assert.match(rules(null, null, { level, light: "", emergency: "" }), /steps are at the top for once they've stopped/, level);
});

test("a 911 situation is always said in the reply, pulling over first", () => {
  const r = rules(null, null, { level: "stop", light: "", emergency: "fire" });
  assert.match(r, /always say it in your own reply/);
  assert.ok(r.indexOf("pull over as soon as it's safe and turn off the engine; get everyone out") > 0);
  assert.doesNotMatch(rules(null, null, { level: "stop", light: "oil_pressure", emergency: "" }), /This is a 911 situation/);
});

test("no blanket ban on controls, but no how-to on an unknown car", () => {
  const r = rules(null, null, null);
  assert.doesNotMatch(r, /experiment with unfamiliar controls/);
  assert.match(r, /Never tell them not to use or touch their controls/);
  assert.match(r, /Don't describe how to move a lever/);
});

test("tire replies name the door sticker; a steady check engine light is Check soon", () => {
  const r = rules(null, null, null);
  assert.match(r, /Every reply about tire pressure names where their number is: the sticker inside the driver's door/);
  assert.match(r, /steady check engine light while the car drives normally: that's soon/);
});

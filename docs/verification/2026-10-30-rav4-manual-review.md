# Verification record: dashboard lights checked against the 2017 Toyota RAV4 owner's manual

**Review date:** October 30, 2026 (Central time, then UTC−5)  
**Record written:** November 22, 2026, from the repository history. This file reconstructs the review from what was saved; it is not the original review notes.  
**Applies to:** `app/lights.js` (the facts the bear treats as verified) and, through them, the bear's answers and the app's light lookup.

## Sources

| Source | What it says |
|---|---|
| Pull request [#3](https://github.com/jessboydd/bear-with-me/pull/3), "Match the app's lights to the RAV4 manual review", merged Oct 30, 11:50 PM | The list of changes (summarized below). Links the Claude Code session where the review was done: `claude.ai/code/session_01BBy4TaQAPP75SBkF2iXU2q`. |
| Commit `b225d31` (Jessica Boyd, with Claude), Oct 30, 11:40 PM | The same changes; edits `app/lights.js`, `app/app.js`, `api/chat.js`. |
| Header of `app/lights.js` | "Checked against the 2017 Toyota RAV4 owner's manual (pp. 78–82, 615–634, 662–663) on Oct 30, 2026, keeping the booklet generic and taking the stricter 'stop' advice where cars differ." |
| README (pull request #9, Nov 8) | One-line summary of the same review. |

## Method, as recorded

- **Reference:** the 2017 Toyota RAV4 owner's manual, pages 78–82, 615–634 and 662–663. The repository doesn't record which page supports which light.
- **Rule for differences:** keep the facts general enough for any car, and where cars differ, take the stricter "stop" advice.
- **Scope:** the facts for each dashboard light, their urgency, the symbols shown in the app, and the booklet page reference for the driver's own numbers.

## Changes made on October 30 (from pull request #3)

- **Stricter stop advice:** battery/charging and ABS now say pull over and call for help; low tire pressure says stop somewhere safe soon; check engine and airbag say get it checked right away; overheating turns off the A/C first.
- **New lights:** power steering (stop) and the triangle ! master warning (read the screen message).
- **US symbols:** the words BRAKE and ABS, and the engine with CHECK.
- **Amber lights that still mean stop** (tire pressure, ABS) show a red STOP tag and open with the stop banner.
- **Removed** the "wait 10 minutes" and "wait 30 minutes" lines, which the manual doesn't back up.
- **The booklet's car numbers** are now on page 2 (was page 3).

## Each light: before, after the review, and now

Quoted exactly from `app/lights.js` at three points: before the review (`b225d31~1`), after it (`b225d31`), and the live app today (`b436628`, after the November 22 safety review).

| Light | Before Oct 30 | After Oct 30 | Now (Nov 22) |
|---|---|---|---|
| Oil pressure | Stop | Stop | Stop |
| Engine temperature | Stop | Stop | Stop |
| Battery / charging | Stop | Stop | Stop |
| Brake warning | Stop | Stop | Stop |
| Check engine | Check soon | Check soon | Check soon |
| Low tire pressure | Check soon | Check soon + red STOP tag | Stop & check |
| ABS (anti-lock brakes) | Check soon | Check soon + red STOP tag | Stop |
| Traction / stability | Check soon | Check soon | Check soon |
| Airbag (SRS) | Check soon | Check soon | Check soon |
| Low fuel | Check soon | Check soon | Check soon |
| Service reminder | Check soon | Check soon | Check soon |
| High beams on | FYI | FYI | FYI |
| Seatbelt | FYI | FYI | FYI |
| Door open | FYI | FYI | FYI |
| Power steering | — | Stop | Stop |
| Triangle ! (master warning) | — | Check soon | Not sure yet |

### Oil pressure (`oil_pressure`)

**Before Oct 30** (Stop): The engine may not be getting enough oil pressure. Driving can quickly destroy the engine. Pull over when safe, turn off the engine, and do not keep driving with the light on. Once the engine has cooled for about 10 minutes, the oil level can be checked with the dipstick, but low oil pressure can have other causes, so call roadside help or a mechanic before driving.

**After Oct 30** (Stop): The engine may not be getting enough oil pressure, which can quickly damage it. Pull over when it's safe, turn the engine off, and don't keep driving. Call roadside help or a mechanic.

*Symbol description after Oct 30:* An old-style oil can with a drip. Some cars show it as a screen message, like Oil Pressure Low, with a triangle warning light.

**Now:** unchanged since October 30.

### Engine temperature (`coolant_temp`)

**Before Oct 30** (Stop): The engine is overheating. Pull over when safe and turn off the engine. Never open the radiator or coolant cap while the engine is hot: the coolant is under pressure and can cause severe burns. Wait at least 30 minutes. If steam is coming from under the hood, stay away from it. Call roadside help or a mechanic before driving again.

**After Oct 30** (Stop): The engine is overheating. Pull over when it's safe, turn off the A/C, then turn off the engine. If steam is coming from under the hood, stay back and wait until it stops before opening the hood. Never open the radiator or coolant cap while the engine is hot: hot coolant can spray out and burn. Call roadside help or a mechanic before driving again.

*Symbol description after Oct 30:* A thermometer standing in wavy lines. Some cars show it as a screen message, like Engine Coolant Temp High.

**Now:** unchanged since October 30.

### Battery / charging (`battery`)

**Before Oct 30** (Stop): The charging system is not working, so the car is running on battery power and may stop running soon. Turn off things you don't need (radio, heated seats, extra chargers). If you're close, drive straight to a shop or safe place; if not, pull over somewhere safe and call for help.

**After Oct 30** (Stop): The charging system isn't working, so the car may stop running. Pull over when it's safe and call for help. Driving on may be dangerous.

*Symbol description after Oct 30:* A rectangle battery with a plus and a minus sign. Some cars show a message like Charging System Malfunction.

**Now:** unchanged since October 30.

### Brake warning (`brake`)

**Before Oct 30** (Stop): First make sure the parking brake is fully released. If the light stays on, the brakes may need attention (low brake fluid is a common cause). Pull over carefully when it's safe and call for help. Don't keep driving if the pedal feels soft or sinks, or the brakes grind or pull.

**After Oct 30** (Stop): First make sure the parking brake is fully released. If the light stays on, the brakes may need attention (low brake fluid is a common cause). Pull over carefully when it's safe and call for help. Continuing to drive may be dangerous.

*Symbol description after Oct 30:* The word BRAKE (most US cars), or an exclamation point in a circle between curved brackets.

**Now:** unchanged since October 30.

### Check engine (`check_engine`)

**Before Oct 30** (Check soon): Steady light: the car found an engine or emissions problem. Get it checked soon; many auto parts stores read the code for free. A loose gas cap is a common cause: tighten it until it clicks; the light can take a few drives to go off. Flashing light: a serious engine problem (often a misfire) that can damage the car. Slow down, avoid hard acceleration, and get it to a shop as soon as possible, or pull over when safe and call for help if the car runs badly.

**After Oct 30** (Check soon): The car found an engine, emissions or transmission control problem. Get it checked right away; many auto parts stores read the code for free. First check two common causes: a loose gas cap (tighten it until it clicks) and an empty tank (fill up). The light can take a few drives to go off. Flashing: treat it like a red light and pull over when it's safe.

*Symbol description after Oct 30:* The outline of an engine, often with the word CHECK.

**Now:** unchanged since October 30.

### Low tire pressure (`tpms`)

**Before Oct 30** (Check soon): Steady light: one or more tires is low on air. Check all four with a tire gauge and fill to the PSI on the sticker inside the driver's door frame (not the number on the tire). If it flashes for about a minute when the car starts and then stays on, the tire-pressure sensor system has a problem: have a shop check it. Cold weather often makes this light come on.

**After Oct 30** (Check soon + red STOP tag): One or more tires is low. Stop somewhere safe as soon as you can and check all four with a tire gauge; fill to the number on the sticker inside the driver's door (the PSI under cold tire pressure, not the number on the tire). Avoid hard braking and sharp turns until then. If the light flashes for about a minute when the car starts and then stays on, the sensor system needs a shop. Cold weather can lower tire pressure and turn the light on. With a small spare tire on, the light may stay on; that's expected.

*Symbol description after Oct 30:* A horseshoe shape (a tire seen from the side) with an exclamation point inside.

**Now** (Stop & check; changed Nov 22: level changed to Stop & check, facts revised): One or more tires may be low. A tire can look normal and still be low, so looking isn't enough. Stop somewhere safe, avoiding hard braking and sharp turns until then, and check all four with the tire gauge against the sticker inside the driver's door or the owner's manual (the PSI under cold tire pressure, not the number on the tire). A tire that's flat, damaged, losing air or far below its number, or a car that pulls or shakes: don't drive on it; call roadside help. If the readings are close to the number, the tires look undamaged and nothing else seems wrong, adding air at a nearby pump may be appropriate, but that's the driver's judgment, not a promise that driving is safe. Don't suggest changing to a spare unless they ask: not every car has one, and changing one isn't safe for everyone. If the light flashes for about a minute when the car starts and then stays on, the sensor system needs a shop. Cold weather can lower tire pressure, but it's not a reason to ignore the light. With a small spare tire on, the light may stay on.

### ABS (anti-lock brakes) (`abs`)

**Before Oct 30** (Check soon): The anti-lock part of the brakes may not be working. Normal braking still works, so leave extra stopping distance and get it checked soon. If the ABS light comes on together with the red brake light, treat it as stop soon: pull over when safe and call for help.

**After Oct 30** (Check soon + red STOP tag): The anti-lock brake system has a problem. Pull over when it's safe and call for help; driving on may be dangerous. If the red brake light is on too, stop right away.

*Symbol description after Oct 30:* The letters ABS (most US cars), sometimes inside a circle between curved brackets.

**Now** (Stop; changed Nov 22: level changed to Stop): *Facts unchanged since October 30.*

### Traction / stability (`traction`)

**Before Oct 30** (Check soon): Flashing: traction or stability control is working right now, usually on a slippery road. Ease off the gas and drive gently. Staying on: the system may have a problem, or it was switched off with a button; have a shop check it. Some cars show a separate OFF light when the system is turned off.

**After Oct 30** (Check soon): Flashing: traction or stability control is working right now, usually on a slippery road. Ease off the gas and drive gently. Staying on: the system has a problem; have a shop check it. A separate light with the word OFF means the system was turned off with a button.

*Symbol description after Oct 30:* A car with two wavy skid lines underneath.

**Now:** unchanged since October 30.

### Airbag (SRS) (`airbag`)

**Before Oct 30** (Check soon): Red or amber, depending on the car. The airbags may not open in a crash. Get it checked soon by a shop; never try to fix airbag parts yourself.

**After Oct 30** (Check soon): The airbag or seatbelt safety system has a problem, so the airbags may not work in a crash. Get it checked right away by a shop; never try to fix airbag parts yourself.

*Symbol description after Oct 30:* A seated person with a large circle (the airbag) in front of them, or the letters SRS. Red on many cars.

**Now:** unchanged since October 30.

### Low fuel (`low_fuel`)

**Before Oct 30** (Check soon): Time to fill up. How far you can go once the light comes on varies by car, so don't count on it. Running out can leave you stranded somewhere unsafe. Tip: the small arrow next to the fuel gauge's pump symbol points to the side your gas cap is on.

**After Oct 30** (Check soon): *No change to the facts.*

*Symbol description after Oct 30:* A gas pump.

**Now:** unchanged since October 30.

### Service reminder (`service`)

**Before Oct 30** (Check soon): A reminder that an oil change or scheduled service is due, based on time or miles. It's not an emergency: book a service soon. Don't confuse it with the red oil pressure light (an oil can), which means pull over. Not sure which one it is? Treat it as the red one and check the owner's manual.

**After Oct 30** (Check soon): A reminder that an oil change or scheduled service is due, based on time or miles. It's not an emergency: book it soon. Don't confuse it with the red oil pressure light (an oil can) or an Oil Pressure Low message, which mean pull over. Not sure which one it is? Treat it as the red one and check the owner's manual.

*Symbol description after Oct 30:* A wrench, or a screen message like Maintenance Required Soon. Usually amber.

**Now:** unchanged since October 30.

### High beams on (`high_beam`)

**Before Oct 30** (FYI): Your high beams are on. That's fine on dark empty roads. Switch to regular headlights when another car is coming toward you or you're following someone, so you don't blind them. The headlight stalk is usually on the left of the steering wheel: push or pull it to switch.

**After Oct 30** (FYI): *No change to the facts.*

*Symbol description after Oct 30:* A blue headlight shape (like a capital D) with straight lines going out to the side.

**Now** (FYI; changed Nov 22: facts revised): Your high beams (brights) are on. Nothing is wrong with the car. Switch them off for oncoming cars or when following someone, so you don't dazzle the other driver. How to switch them differs from car to car: the headlights section of the owner's manual shows how on theirs. Don't describe a lever or switch movement. If they don't know how to switch them off, they can pull over when it's safe and check the headlights section of the owner's manual.

### Seatbelt (`seatbelt`)

**Before Oct 30** (FYI): A reminder to buckle up. It can also come on when a passenger isn't buckled, or when something heavy sits on the passenger seat. Often red, but it's a reminder, not a car problem.

**After Oct 30** (FYI): A reminder to buckle up. It also comes on when a front passenger isn't buckled, and a bag or something heavy on the front seat can set it off. Often red, but it's a reminder, not a car problem.

**Now:** unchanged since October 30.

### Door open (`door_open`)

**Before Oct 30** (FYI): A door, the hood or the trunk isn't fully shut. When you're stopped somewhere safe, close each one firmly. Often red, but it's a reminder, not a car problem.

**After Oct 30** (FYI): A door or the trunk isn't fully shut. When you're stopped somewhere safe, close each one firmly. Often red, but it's a reminder, not a car problem.

*Symbol description after Oct 30:* A car seen from above with a door sticking out, or a picture of your car on the screen showing which door is open.

**Now:** unchanged since October 30.

### Power steering (`eps`)

*Added in the October 30 review.*  
**After Oct 30** (Stop): The power steering has a problem, and steering may suddenly feel very heavy. Hold the wheel firmly, pull over when it's safe, and call for help.

**Now:** unchanged since October 30.

### Triangle ! (master warning) (`master_warning`)

*Added in the October 30 review.*  
**After Oct 30** (Check soon): The car is showing a warning message on the screen. Read the message: it says what's wrong. If it says Stop, or to stop in a safe place, pull over when it's safe and call for help. If you can't read it while driving, pull over when it's safe to read it.

**Now** (Not sure yet; changed Nov 22: level changed to Not sure yet): *Facts unchanged since October 30.*

## Changed after the review (November 22, 2026)

These changes came from the safety and clarity review of Jessica's November 22 self-tests, not from the manual. They are in pull requests #13 and #14 and in *Bear With Me · Build Log, Part 2*.

- **Low tire pressure:** now **Stop & check** (stop somewhere safe and measure before deciding). Facts follow Jessica's tire policy: measure first, the door sticker or owner's manual for the number, no general PSI rule, roadside help for an unsafe tire, no spare by default.
- **ABS:** now labeled **Stop safely now** (the booklet's page 8 gives it a red "Stop" callout on an amber page).
- **Triangle ! (master warning):** now **Not sure yet** until the driver reads the message; a message saying Stop raises it to Stop safely now.
- **High beams:** the instruction "the headlight stalk is usually on the left… push or pull it" was removed (the booklet has none); if the driver doesn't know how to switch them off, they pull over and check the owner's manual.
- Each light now also records its booklet section (`group`) separately from its urgency (`level`).

## Not recorded, and how to complete this record

- **Which manual page supports which light.** The pages are recorded only as a set (78–82, 615–634, 662–663). The original review session (`session_01BBy4TaQAPP75SBkF2iXU2q`) may hold this detail.
- **The manual's edition and region,** and whether the PDF or a printed copy was used.
- **Who checked each item, and what was considered and left out.**
- **A re-check of the November 22 wording against the manual.** Those changes were made for safety and clarity, not by reading the manual again.
- **Other vehicles.** The facts are kept general, but were checked against one car only.

To complete it, open the original review session, or the manual pages above, and add a page reference to each light's section in this file.

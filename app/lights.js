// Dashboard-light facts the bear treats as verified. Shared by the app (lookup)
// and the server (passed to the AI as trusted facts).
// Review every entry against an owner's manual before testing with people.
export const LIGHTS = [
  { id: "tpms", name: "Low tire pressure", level: "soon",
    looks: "Horseshoe shape (a tire cross-section) with an exclamation point inside",
    facts: "Steady light: one or more tires is low on air. Check all four with a tire gauge and fill to the PSI on the sticker inside the driver's door frame (not the number on the tire). If it flashes for about a minute when the car starts and then stays on, the tire-pressure sensor system has a problem: have a shop check it. Cold weather often makes this light come on.",
    first: "Got it, the low tire pressure light. Is it steady, or did it flash for about a minute when you started the car?",
    quick: ["It's steady", "It flashed first", "A tire looks flat"] },
  { id: "check_engine", name: "Check engine", level: "soon",
    looks: "Outline of an engine block, sometimes with the word CHECK",
    facts: "Steady light: the car found an engine or emissions problem. Get it checked soon; many auto parts stores read the code for free. A loose gas cap is a common cause: tighten it until it clicks; the light can take a few drives to go off. Flashing light: a serious engine problem (often a misfire) that can damage the car. Slow down, avoid hard acceleration, and get it to a shop as soon as possible, or pull over when safe and call for help if the car runs badly.",
    first: "Okay, the check engine light. Is it steady or flashing? And is the car driving any differently?",
    quick: ["Steady, drives fine", "It's flashing", "Could it be my gas cap?"] },
  { id: "oil_pressure", name: "Oil pressure", level: "stop",
    looks: "An old-style oil can with a drip coming out of the spout",
    facts: "The engine may not be getting enough oil pressure. Driving can quickly destroy the engine. Pull over when safe, turn off the engine, and do not keep driving with the light on. Once the engine has cooled for about 10 minutes, the oil level can be checked with the dipstick, but low oil pressure can have other causes, so call roadside help or a mechanic before driving." },
  { id: "coolant_temp", name: "Engine temperature", level: "stop",
    looks: "A thermometer standing in wavy lines (liquid)",
    facts: "The engine is overheating. Pull over when safe and turn off the engine. Never open the radiator or coolant cap while the engine is hot: the coolant is under pressure and can cause severe burns. Wait at least 30 minutes. If steam is coming from under the hood, stay away from it. Call roadside help or a mechanic before driving again." },
  { id: "battery", name: "Battery / charging", level: "stop",
    looks: "A rectangle battery with a plus and a minus sign",
    facts: "The charging system is not working, so the car is running on battery power and may stop running soon. Turn off things you don't need (radio, heated seats, extra chargers). If you're close, drive straight to a shop or safe place; if not, pull over somewhere safe and call for help." },
  { id: "high_beam", name: "High beams on", level: "info",
    looks: "Blue headlight shape (like a capital D) with straight lines going out to the side",
    facts: "Your high beams are on. That's fine on dark empty roads. Switch to regular headlights when another car is coming toward you or you're following someone, so you don't blind them. The headlight stalk is usually on the left of the steering wheel: push or pull it to switch.",
    first: "That blue light just means your high beams are on. Nothing is wrong with the car. Want to know how to switch them off?",
    quick: ["How do I turn them off?", "When should I use them?"] }
];

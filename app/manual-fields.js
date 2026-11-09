// The facts the app looks for in an owner's manual. Shared by the app (app/manual.js)
// and the server (api/manual.js), so both agree on what each one means.
// `car` is the My car's numbers field a fact fills in; the rest are kept as "From your manual".
export const MANUAL_FIELDS = [
  { key: "model", car: "model", label: "Car", desc: "the vehicle's year, make and model as the manual names it" },
  { key: "front", car: "front", label: "Front tire pressure", unit: "PSI", desc: "recommended cold front tire pressure in PSI, as a number" },
  { key: "rear", car: "rear", label: "Rear tire pressure", unit: "PSI", desc: "recommended cold rear tire pressure in PSI, as a number" },
  { key: "spare", car: "spare", label: "Spare tire pressure", unit: "PSI", desc: "spare tire pressure in PSI, as a number" },
  { key: "spareKit", car: "spareKit", label: "Car has", choices: ["A spare", "Inflator kit", "Neither"], desc: 'exactly "A spare", "Inflator kit" or "Neither"' },
  { key: "tireSize", label: "Tire size", desc: "tire size, e.g. 225/65R17" },
  { key: "oilType", car: "oilType", label: "Oil type", desc: "engine oil grade, e.g. 0W-20" },
  { key: "oilAmount", label: "Oil amount", desc: "engine oil capacity, saying whether it's with the filter" },
  { key: "coolant", label: "Coolant", desc: "the coolant type the manual specifies" },
  { key: "fuel", label: "Fuel", desc: "required or recommended fuel and octane" },
  { key: "spareWhere", label: "Spare and jack are", desc: "where the spare tire (or inflator kit) and jack are stored" },
  { key: "hoodRelease", label: "Hood release", desc: "where the hood release lever is" },
  { key: "fuseBox", label: "Fuse boxes", desc: "where the fuse boxes are" },
  { key: "oilInterval", label: "Oil change", desc: "how often to change the oil (miles or months)" }
];
export const FIELD = Object.fromEntries(MANUAL_FIELDS.map(f => [f.key, f]));

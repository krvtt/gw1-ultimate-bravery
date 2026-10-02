// Anti-Synergien (v6): Zustandsmodell prüfen – harte Konflikte nie ohne Bravery, weiche selten, Selbstsabotage greift
const fs = require('fs'), vm = require('vm');
const ctx = {console, Math}; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/data.js', 'utf8').replace('const GWDATA=', 'globalThis.GWDATA='), ctx);
vm.runInContext(fs.readFileSync(__dirname + '/cores.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(__dirname + '/generator.js', 'utf8'), ctx);
const G = ctx.GWGen, N = +process.argv[2] || 1500;
const has = (b, t) => b.bar.some(s => s.tags.has(t));
let n = 0, hard = 0, lowMax = 0, dirClash = 0, t0 = Date.now();
const softBy = {}, ids = {}, examples = [];
for (const mode of ['pve', 'pvp']) for (let w = 1; w <= 10; w += 3) for (let i = 0; i < N / 8; i++) {
  const b = G.genBuild({mode, weird: w, seed: (i + 1) * 104723 + w * 7 + (mode === 'pvp' ? 3 : 0)});
  if (!b) continue; n++;
  const cs = G.conflictsOf(b.bar);
  if (cs.some(c => c.sev === 'hard')) hard++;
  const shown = cs.filter(c => c.w >= 0.6);
  softBy[w] = softBy[w] || [0, 0]; softBy[w][1]++; if (shown.length) softBy[w][0]++;
  for (const c of shown) { ids[c.id] = (ids[c.id] || 0) + 1; if (examples.length < 6 && !examples.some(e => e.id === c.id)) examples.push({id: c.id, s: c.s.n.en, w: c.with.map(x => x.n.en).join(', '), txt: c.txt.de}); }
  if (has(b, 'needs_lowhp') && has(b, 'maxhp')) lowMax++;
  if (has(b, 'needs_lowhp') && (has(b, 'needs_morehp') || has(b, 'hp_keep_high'))) dirClash++;
}
console.log(`${n} Builds ohne Bravery | harte Konflikte: ${hard} | wenig-LP + Max-LP: ${lowMax} | LP-Richtung gegeneinander: ${dirClash} | ${Math.round(n / ((Date.now() - t0) / 1000))} Builds/s`);
console.log('sichtbare weiche Konflikte je Weirdness: ' + Object.entries(softBy).map(([w, [a, t]]) => `w${w} ${(100 * a / t).toFixed(1)} %`).join(' | '));
console.log('häufigste: ' + JSON.stringify(ids));
for (const e of examples) console.log(`  ${e.id}: ${e.s} ↔ ${e.w} – ${e.txt}`);
// Selbstsabotage
let sb = 0, used = 0;
for (let i = 0; i < 300; i++) {
  const b = G.genBuild({mode: 'pve', weird: 1 + (i % 10), seed: 555 + i * 31, relax: ['sabotage']});
  if (!b) continue; sb++; if (b.braveUsed.includes('sabotage')) used++;
}
console.log(`Selbstsabotage: ${used}/${sb} Builds mit sichtbarem Konflikt (${(100 * used / sb).toFixed(0)} %)`);
// Motor "Auf Messers Schneide": läuft er, und ohne Max-LP?
let lm = 0, lmOk = 0, lmClash = 0, ex = null;
for (let i = 0; i < 200; i++) {
  const b = G.genBuild({mode: 'pve', weird: 8, seed: 900 + i * 17, forceMotor: 'lowhp'});
  if (!b) continue; lm++;
  if ((b.motors || []).some(m => m.id === 'lowhp')) { lmOk++; if (!ex) ex = b; }
  if (has(b, 'maxhp')) lmClash++;
}
console.log(`Motor lowhp erzwungen: ${lmOk}/${lm} laufen, davon mit Max-LP-Quelle: ${lmClash}`);
if (ex) console.log('  Beispiel: ' + ex.name + ' | ' + ex.bar.map(s => s.n.en).join(' | '));
// Grenth's Balance nie mit Max-LP (ohne Bravery)
let gb = 0, gbBad = 0;
for (let i = 0; i < 4000 && gb < 60; i++) {
  const b = G.genBuild({mode: 'pve', weird: 1 + (i % 10), primary: 4, seed: 7000 + i * 13});
  if (b && b.bar.some(s => s.n.en === "Grenth's Balance")) { gb++; if (has(b, 'maxhp') || has(b, 'needs_morehp')) gbBad++; }
}
console.log(`Grenth's Balance in ${gb} Necro-Builds, davon mit Max-LP/Mehr-LP-Skill: ${gbBad}`);
const fail = hard > 0 || lowMax > n * 0.002 || used / sb < 0.5;
console.log(fail ? 'FEHLER' : 'OK');
process.exit(fail ? 1 : 0);

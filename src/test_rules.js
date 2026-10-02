// Prüft die Review-Regeln: Gegenstandszauber, Nah-/Fernkampf, Zweitprofession, Waffe/Attribut, Auslöser, Full Bravery
const fs = require('fs'), vm = require('vm');
const ctx = {console, Math}; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['data.js', 'cores.js', 'generator.js', 'gear.js', 'names.js']) if (fs.existsSync(__dirname + '/' + f)) vm.runInContext(fs.readFileSync(__dirname + '/' + f, 'utf8').replace('const GWDATA=', 'globalThis.GWDATA='), ctx);
const G = ctx.GWGen, N = +process.argv[2] || 3000;
const WM = new Set(Object.values(G.WEAPON_ATTR));
let n = 0, itemMartial = 0, rangedClose = 0, secLow = 0, secHigh = 0, hi = 0, lo = 0, primOnlyLow = 0, gearErr = 0;
let weapNoAttr = 0, weapInacc = 0, foreignMastery = 0, unusedLine = 0, dead = 0, overcastNoSrc = 0, de_dagger = 0, nameErr = 0;
const names = {};
for (let i = 0; i < N; i++) {
  const w = 1 + (i % 10), b = G.genBuild({mode: i % 3 ? 'pve' : 'pvp', weird: w, seed: 9000 + i * 13}); if (!b) continue; n++;
  if (b.fam !== 'caster' && b.bar.some(s => s.t === 25)) itemMartial++;
  if ((b.fam === 'bow' || b.fam === 'spear') && b.bar.some(s => s.tags.has('closerange'))) rangedClose++;
  const sec = b.bar.filter(s => s.p === b.secondary).length;
  if (w >= 6) { hi++; secHigh += sec; } else { lo++; secLow += sec; if (sec === 0) primOnlyLow++; }
  try { const g = ctx.GWGear.gearSets(b, 'de'); if (g.length !== 2) gearErr++; } catch (e) { gearErr++; }
  const auto = b.core && b.core.auto;
  if (b.fam !== 'caster' && !auto) {
    const wa = G.WEAPON_ATTR[b.fam];
    if (!b.attributes.some(([a, r]) => a === wa && r >= 9)) weapNoAttr++;
    if (!G.accessible(G.view(b.mode), b.primary, b.secondary).has(wa)) weapInacc++;
    if (b.bar.some(s => s.tags.has('attack') && WM.has(s.a) && s.a !== wa)) foreignMastery++;
  }
  const used = new Set(b.bar.map(s => s.a));
  if (b.attributes.some(([a]) => !used.has(a) && a !== b.weaponAttr && a !== G.PRIMARY_ATTR[b.primary])) unusedLine++;
  if (!b.core && G.deadPayoffs(b.bar).length) dead++;
  if (b.bar.some(s => s.tags.has('needs_overcast')) && b.bar.filter(s => s.tags.has('needs_overcast')).length >= 2 && !b.bar.some(s => s.tags.has('overcast'))) overcastNoSrc++;
  if (b.primary === 10 && b.secondary === 6 && b.fam === 'dagger') de_dagger++;
  if (G.nameBuild) { const nm = G.nameBuild(b); if (!nm || /undefined|null|  /.test(nm)) nameErr++; names[nm] = (names[nm] || 0) + 1; }
}
console.log(`${n} Builds | Gegenstandszauber in Waffen-Builds: ${itemMartial} | Nahbereich mit Bogen/Speer: ${rangedClose} | Waffen-Set-Fehler: ${gearErr}`);
console.log(`Ø Skills der Zweitprofession: Stufe 1–5 ${(secLow / lo).toFixed(1)} (reine Primär-Leisten ${Math.round(100 * primOnlyLow / lo)} %), Stufe 6–10 ${(secHigh / hi).toFixed(1)}`);
console.log(`Waffe ohne Waffenattribut ≥9: ${weapNoAttr} | Waffenattribut nicht verfügbar: ${weapInacc} | fremde Waffen-Angriffe: ${foreignMastery} | Linie ohne Nutzen: ${unusedLine}`);
console.log(`Nutznießer ohne Auslöser (ohne Kerne): ${dead} | 2× Überzauberung ohne Quelle: ${overcastNoSrc} | D/E mit Dolchen: ${de_dagger}`);
if (G.nameBuild) console.log(`Namen: ${Object.keys(names).length} verschiedene, Fehler ${nameErr} | Beispiele: ${Object.entries(names).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => k + ' ' + v).join(', ')}`);
// Full Bravery: jede Stufe muss Builds liefern, gelockerte Regeln werden angezeigt
for (const br of [1, 2, 3]) {
  let ok = 0, rel = {}, hard = 0;
  for (let i = 0; i < 300; i++) {
    const b = G.genBuild({mode: 'pve', weird: 1 + i % 10, seed: 777 + i * 31, bravery: br}); if (!b) continue; ok++;
    if (b.bravery.length !== br) hard++;
    if (G.validate(b).hard.length) hard++;
    b.bravery.forEach(x => rel[x] = (rel[x] || 0) + 1);
  }
  console.log(`Bravery ${br}: ${ok}/300 Builds, Fehler ${hard}, gelockert: ${JSON.stringify(rel)}`);
}

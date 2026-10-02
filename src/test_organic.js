// Wie oft entstehen die früheren Spaß-Kerne organisch (ohne festen Kern)? Plus Motor-Verteilung.
const fs = require('fs'), vm = require('vm');
const ctx = {console, Math}; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['data.js', 'cores.js', 'generator.js']) vm.runInContext(fs.readFileSync(__dirname + '/' + f, 'utf8').replace('const GWDATA=', 'globalThis.GWDATA='), ctx);
const G = ctx.GWGen, N = +process.argv[2] || 4000;
const has = (b, n) => b.bar.some(s => s.n.en === n), cnt = (b, f) => b.bar.filter(f).length, tag = t => s => s.tags.has(t);
const CHECK = {
  blitzreiter: b => b.primary === 6 && b.fam !== 'caster' && (has(b, 'Conjure Lightning') || has(b, 'Ride the Lightning')),
  energiesense: b => b.primary === 6 && has(b, 'Radiant Scythe'),
  illusionsklingen: b => has(b, 'Illusionary Weaponry'),
  beruehrer: b => b.primary === 2 && cnt(b, tag('touch')) >= 2,
  ansteckung: b => has(b, 'Contagion') && cnt(b, tag('selfcond')) >= 1,
  stolpern: b => has(b, '"I Meant to Do That!"') && cnt(b, tag('selfkd')) >= 1,
  siegel: b => has(b, 'Symbolic Strike') && cnt(b, tag('signet')) >= 4,
  waffengeist: b => has(b, "Spirit's Strength") && cnt(b, tag('weaponspell')) >= 1,
  dolchwerfer: b => b.primary === 7 && b.fam === 'caster' && has(b, 'Dancing Daggers'),
  bogenassassine: b => b.primary === 7 && b.fam === 'bow',
  kritsense: b => b.primary === 7 && b.fam === 'scythe',
  halbtakt: b => b.primary === 5 && cnt(b, s => s.tags.has('spell') && s.p !== 5 && s.act >= 2) >= 2,
  anfuehrer: b => b.primary === 9 && (b.fam === 'axe' || b.fam === 'sword') && cnt(b, tag('shoutchant')) >= 2,
  hammermoench: b => b.primary === 3 && b.fam === 'hammer',
  dickehose: b => cnt(b, tag('needs_morehp')) >= 2 && cnt(b, tag('maxhp')) >= 1,
  erschaffer: b => b.primary === 8 && cnt(b, tag('needs_creature')) >= 1 && cnt(b, tag('minion')) >= 1,
  naturgeister: b => b.primary === 8 && cnt(b, s => s.t === 19) >= 2,
  zauberderwisch: b => b.primary === 10 && b.fam === 'caster',
  seelensammler: b => b.primary === 4 && b.fam === 'dagger',
  feuerpfeil: b => has(b, 'Kindle Arrows') && has(b, 'Mark of Rodgort'),
};
const hit = {}, motors = {}; let n = 0, fixed = 0, links = 0, metaLinked = 0, metaAll = 0;
for (let i = 0; i < N; i++) {
  const b = G.genBuild({mode: i % 3 ? 'pve' : 'pvp', weird: 7 + (i % 4), seed: 50000 + i * 7});
  if (!b) continue; n++;
  if (b.core) { fixed++; continue; }
  for (const [k, f] of Object.entries(CHECK)) if (f(b)) hit[k] = (hit[k] || 0) + 1;
  for (const m of b.motors) motors[m.id] = (motors[m.id] || 0) + 1;
  links += b.links.length;
  const linked = new Set(b.links.flatMap(l => [l.from.id, l.to.id]));
  for (const s of b.bar) if (s.m >= 0.5) { metaAll++; if (linked.has(s.id)) metaLinked++; }
}
console.log(`${n} Builds (Weirdness 7–10), davon ${fixed} mit festem Kern; Ø ${(links / (n - fixed)).toFixed(1)} sichtbare Synergie-Verbindungen pro Leiste`);
console.log(`Meta-Skills in schrägen Leisten: ${metaAll}, davon ${Math.round(100 * metaLinked / Math.max(1, metaAll))} % als Synergie-Glied`);
console.log('Organisch entstandene frühere Kerne (pro 1.000 Builds):');
console.log(Object.keys(CHECK).map(k => `${k} ${((hit[k] || 0) * 1000 / (n - fixed)).toFixed(1)}`).join(' | '));
console.log('Motoren:', Object.entries(motors).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));

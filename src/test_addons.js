// Prüft die Heroes-Handbook-Logik im Generator: Skill-Filter (Kampagnen/freigeschaltet), Verbindungen, Punkte,
// Primärprofession auf Weirdness 6–10, Primärattribut auf niedriger Weirdness, keine Punkte auf ungenutzte Attribute.
// Aufruf: node src/test_addons.js [N]
const fs = require('fs'), vm = require('vm');
const ctx = {console, Math}; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['data.js', 'cores.js', 'generator.js', 'gear.js', 'names.js']) if (fs.existsSync(__dirname + '/' + f)) vm.runInContext(fs.readFileSync(__dirname + '/' + f, 'utf8').replace('const GWDATA=', 'globalThis.GWDATA='), ctx);
const G = ctx.GWGen, N = +process.argv[2] || 600;
let fail = 0;
const check = (ok, msg) => { console.log((ok ? 'OK   ' : 'FAIL ') + msg); if (!ok) fail++; };
const pct = (a, b) => (100 * a / Math.max(1, b)).toFixed(1) + '%';
const V = G.view('pve');

// 1) Kampagnen-Filter (Basis + Prophecies) solo + Team
{
  const f = s => s.c <= 1;
  let n = 0, bad = 0, nul = 0;
  for (let i = 0; i < N; i++) { const b = G.genBuild({mode: i % 4 ? 'pve' : 'pvp', weird: 1 + i % 10, seed: 500 + i * 7, filter: f}); if (!b) { nul++; continue; } n++;
    if (b.bar.some(s => !f(s) && s.n.en !== 'Charm Animal')) bad++; }
  check(!bad && nul / N < 0.02, `Kampagnen-Filter solo: ${n} Leisten, ${bad} mit fremden Skills, ${nul} ohne Leiste`);
  let tb = 0, tn = 0;
  for (let i = 0; i < 20; i++) { const t = G.genTeam({size: [4, 6, 8][i % 3], weird: 2 + i % 8, seed: 77 + i, filter: f}); tn++;
    if (t.members.some(m => m.bar.some(s => !f(s) && s.n.en !== 'Charm Animal'))) tb++; }
  check(!tb, `Kampagnen-Filter Team: ${tn} Teams, ${tb} mit fremden Skills`);
  const tf = G.genTeam({size: 4, weird: 5, seed: 3, filter: f, heroes: ['anton', 'zenmai', 'mox']});
  check(tf.members.length === 4 && tf.swapped.length >= 2 && tf.members.every(m => m.bar.every(s => f(s) || s.n.en === 'Charm Animal')),
    `Helden ohne Skills in der Basis werden ersetzt: ${tf.swapped.map(x => x.join('→')).join(', ')}`);
}
// 2) Nur freigeschaltete (zufällige 45 % aller Skills)
{
  const rnd = G.rngFrom(4711), mine = new Set(V.skills.filter(() => rnd() < 0.45).map(s => s.id)), f = s => mine.has(s.id);
  let n = 0, bad = 0, nul = 0;
  for (let i = 0; i < N; i++) { const b = G.genBuild({mode: 'pve', weird: 1 + i % 10, seed: 900 + i * 11, filter: f}); if (!b) { nul++; continue; } n++;
    if (b.bar.some(s => !f(s) && s.n.en !== 'Charm Animal')) bad++; }
  check(!bad && nul / N < 0.05, `Freigeschaltet 45 %: ${n} Leisten, ${bad} mit gesperrten Skills, ${nul} ohne Leiste (${pct(nul, N)})`);
  const tiny = new Set(V.skills.filter(s => s.p === 6).slice(0, 6).map(s => s.id));
  const b0 = G.genBuild({mode: 'pve', weird: 5, seed: 1, filter: s => tiny.has(s.id)});
  check(b0 === null, 'Viel zu kleine Basis → null (App zeigt Hinweis)');
}
// 3) Verbindungen an/aus + eigene
{
  const cnt = src => [...G.EDGE_MAP.values()].reduce((t, m) => t + [...m.values()].filter(e => e.src === src).length, 0);
  G.setEdgeConfig(); const c0 = cnt('core'), p0 = cnt('pvx');
  G.setEdgeConfig({core: false}); const c1 = cnt('core');
  G.setEdgeConfig({pvx: false}); const p1 = cnt('pvx');
  G.setEdgeConfig({custom: [['Fireball', 'Ether Prodigy', 3]]});
  const e = G.EDGE_MAP.get('Fireball') && G.EDGE_MAP.get('Fireball').get('Ether Prodigy');
  check(c0 > 0 && p0 > 0 && c1 === 0 && p1 === 0 && e && e.src === 'custom' && e.w === 3, `Kanten: core ${c0}→${c1}, pvx ${p0}→${p1}, eigene ${JSON.stringify(e)}`);
  // Paar aus zwei häufigen Elementarmagier-Skills, die bisher selten zusammen liegen
  const freq = {}, pair = {}, bars = [];
  for (let i = 0; i < 300; i++) { const b = G.genBuild({mode: 'pve', weird: 5, primary: 6, seed: 3000 + i}); if (!b) continue; bars.push(b.bar.map(s => s.n.en)); }
  for (const bb of bars) for (const x of bb) freq[x] = (freq[x] || 0) + 1;
  const top = Object.entries(freq).filter(([n]) => V.byName.get(n).p === 6).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([n]) => n);
  let A = top[0], B = null, best = 1e9;
  for (const y of top.slice(1)) { const both = bars.filter(bb => bb.includes(A) && bb.includes(y)).length; if (both < best && V.byName.get(y).a !== V.byName.get(A).a) { best = both; B = y; } }
  const co = cfg => { G.setEdgeConfig(cfg); let both = 0, one = 0;
    for (let i = 0; i < 300; i++) { const b = G.genBuild({mode: 'pve', weird: 5, primary: 6, seed: 3000 + i}); if (!b) continue;
      const a = b.bar.some(s => s.n.en === A), c = b.bar.some(s => s.n.en === B); if (a || c) one++; if (a && c) both++; }
    return [both, one]; };
  const [b0, o0] = co(), [b1, o1] = co({custom: [[A, B, 3]]});
  check(b1 > b0 * 1.5 + 2, `Eigene Kante wirkt: ${A} + ${B} zusammen ${b0}/${o0} → ${b1}/${o1}`);
  G.setEdgeConfig();
}
// 4) Punkte
{
  const m1 = G.braveMult({weird: 1, braveUsed: []}), m10 = G.braveMult({weird: 10, braveUsed: ['a', 'b', 'c']});
  const team = {members: [{weird: 6, braveUsed: ['a']}, {weird: 6, braveUsed: []}]};
  check(m1 === 1 && m10 === 3.01 && G.points('vq', {weird: 10, braveUsed: ['a', 'b', 'c']}) === 120 && G.points('hm', {weird: 1, braveUsed: []}) === 20
    && G.points('nm', {weird: 10, braveUsed: []}, false) === 0 && G.braveMult(team) === 1.58,
    `Punkte: ×${m1} … ×${m10}, Vanquish w10+3 Regeln = 120, gescheitert = 0, Team ×${G.braveMult(team)}`);
}
// 5) Weirdness 6–10: Primärprofession nicht nur Beiwerk; 6) w1–4: Primärattribut genutzt; 7) keine ungenutzten Attributlinien
{
  let w10Few = 0, hi = 0, priLow = 0, w10 = 0, w10Low = 0, lo = 0, paMiss = 0, paRank = 0, n = 0, unused = 0, secAvg = 0, paIdle = 0;
  const ex = [];
  for (let i = 0; i < N * 3; i++) {
    const w = 1 + i % 10, b = G.genBuild({mode: i % 5 ? 'pve' : 'pvp', weird: w, seed: 12000 + i * 17}); if (!b) continue; n++;
    const auto = b.core && b.core.auto, pri = b.bar.filter(s => s.p === b.primary).length, PA = G.PRIMARY_ATTR[b.primary];
    if (w >= 6 && w <= 9 && !b.core) { hi++; secAvg += b.bar.filter(s => s.p === b.secondary).length; if (pri < 3) { priLow++; if (ex.length < 3) ex.push(`${b.name} w${w} ${pri} prim`); } }
    if (w === 10 && !b.core) { w10++; if (pri < 2) { w10Few++; if (((b.attributes.find(([a]) => a === PA) || [0, 0])[1]) < 9) w10Low++; } }
    if (w <= 4 && !b.core) { lo++; const r = (b.attributes.find(([a]) => a === PA) || [0, 0])[1]; if (r < 8) paMiss++; else paRank += r;
      if (r && !b.bar.some(s => s.a === PA)) paIdle++; }
    const used = new Set(b.bar.map(s => s.a));
    if (b.attributes.some(([a, r]) => r > 0 && !used.has(a) && a !== b.weaponAttr && a !== PA)) { unused++; if (ex.length < 6) ex.push(`${b.name}: ungenutzt ${b.attributes.filter(([a]) => !used.has(a)).map(x => x.join('=')).join(',')}`); }
  }
  check(!priLow, `w6–9: Primärprofession ≥ 3 Skills in ${hi - priLow}/${hi} (Zweitprofession Ø ${(secAvg / Math.max(1, hi)).toFixed(1)})`);
  check(!w10Low, `w10: ${w10Few}/${w10} Leisten mit 0–1 Primärskills, alle mit Primärattribut ≥ 9 (${w10Low} Verstöße)`);
  check(!paMiss, `w1–4: Primärattribut ≥ 8 gesetzt in ${lo - paMiss}/${lo} (Ø Rang ${(paRank / Math.max(1, lo - paMiss)).toFixed(1)}, davon nur passiv ${pct(paIdle, lo)})`);
  check(!unused, `Keine Punkte auf ungenutzte Attribute: ${unused}/${n} Leisten mit toter Linie`);
  if (ex.length) console.log('  Beispiele: ' + ex.join(' | '));
}
// 8) Beta: Helden, Rollen-Leitplanken, Pick your core, Kult-Namen
{
  let teams = 0, badHeal = 0, badHero = 0, warn = 0, dup = 0, size = 0;
  for (let i = 0; i < 90; i++) {
    const sz = [4, 6, 8][i % 3], heroes = i % 2 ? ['koss', 'dunkoro', 'norgu', 'razah', 'xandra', 'anton', 'mox'].slice(0, sz - 1) : [];
    const t = G.genTeam({size: sz, weird: 1 + i % 10, seed: 4000 + i, heroes}); teams++;
    if (t.members.length !== sz) size++;
    if (t.warn.length) warn++;
    const ids = t.members.filter(m => m.slot.kind === 'hero').map(m => m.slot.hero.id);
    if (new Set(ids).size !== ids.length) dup++;
    for (const m of t.members) {
      if ((m.role === 'heal' || m.role === 'prot') && ![3, 8].includes(m.primary)) badHeal++;
      if (m.slot.kind === 'hero' && !m.slot.hero.flex && m.primary !== m.slot.hero.p) badHero++;
    }
  }
  check(!badHeal && !badHero && !dup && !size && !warn, `Helden-Teams: ${teams} Teams, Heiler/Prot nur Mo/Rt (${badHeal} Fehler), Heldenprofession gehalten (${badHero}), doppelte Helden ${dup}, falsche Größe ${size}, Warnungen ${warn}`);
  const w = G.genTeam({size: 4, weird: 5, seed: 1, heroes: ['koss', 'goren', 'jora'], you: 1});
  check(w.warn.includes('noheal') && !w.members.some(m => m.role === 'heal' && ![3, 8].includes(m.primary)), 'Nur Krieger → Warnung „noheal“, kein Krieger-Heiler');
  const el = V.skills.filter(s => s.e); let ok = 0;
  for (let i = 0; i < 150; i++) { const e = el[(i * 37) % el.length], b = G.genBuild({mode: i % 4 ? 'pve' : 'pvp', weird: 1 + i % 10, seed: 900 + i, elite: e.id}); if (b && b.bar.some(s => s.id === e.id) && b.picked === e.id) ok++; }
  check(ok >= 147, `Pick your core: ${ok}/150 Leisten mit dem gewählten Elite`);
  let n = 0, m = 0;
  for (let i = 0; i < 400; i++) { const b = G.genBuild({mode: 'pve', weird: 1 + i % 10, seed: 70000 + i * 13}); if (!b) continue; n++; if (G.isMemeName(b.name)) m++; }
  check(m / n > 0.08 && m / n < 0.35, `Kult-Namen in ${(100 * m / n).toFixed(0)} % der Leisten (Ziel 8–35 %)`);
}
console.log(fail ? `${fail} FEHLER` : 'ALLE ADD-ON-LOGIKTESTS OK');
process.exit(fail ? 1 : 0);

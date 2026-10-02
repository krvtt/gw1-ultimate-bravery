// Massentest: tausende Builds erzeugen und Regeln prüfen
const fs = require('fs'), vm = require('vm');
const ctx = {console, Math}; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/data.js', 'utf8').replace('const GWDATA=', 'globalThis.GWDATA='), ctx);
vm.runInContext(fs.readFileSync(__dirname + '/cores.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(__dirname + '/generator.js', 'utf8'), ctx);
const G = ctx.GWGen, N = +process.argv[2] || 2000, P = ['', 'W', 'R', 'Mo', 'N', 'Me', 'E', 'A', 'Rt', 'P', 'D'];
const nat = {1:['axe','sword','hammer'],2:['bow'],3:['caster'],4:['caster'],5:['caster'],6:['caster'],7:['dagger'],8:['caster'],9:['spear'],10:['scythe']};
let fail = 0, nulls = 0, soft = 0, t0 = Date.now(); const hard = {}, stats = {}, coreSeen = {}, samples = [];
for (const mode of ['pve', 'pvp']) for (let w = 1; w <= 10; w += 3) for (let i = 0; i < N / 8; i++) {
  const b = G.genBuild({mode, weird: w, seed: (i + 1) * 7919 + w * 104729 + (mode === 'pvp' ? 1 : 0)});
  if (!b) { nulls++; continue; }
  const v = G.validate(b);
  if (v.hard.length) { fail++; v.hard.forEach(h => { const k = h.split(':')[0]; hard[k] = (hard[k] || 0) + 1; }); }
  if (v.soft.length) soft++;
  const d = G.decodeTemplate(b.code);
  if (d.p1 !== b.primary || d.skills.join() !== b.bar.map(s => s.id).join()) { fail++; hard.template = (hard.template || 0) + 1; }
  const k = mode + ' w' + w; const st = stats[k] = stats[k] || {n: 0, unnat: 0, meta: 0, core: 0, passive: 0, prim: 0};
  st.n++; st.meta += b.bar.filter(s => s.m >= 0.5).length; if (!nat[b.primary].includes(b.fam)) st.unnat++;
  if (b.core) { st.core++; coreSeen[b.core.id] = (coreSeen[b.core.id] || 0) + 1; }
  if (b.passive.length) st.passive++;
  if (b.primaryRank) st.prim++;
  if ((b.core && samples.length < 10 && !samples.some(x => x.core && x.core.id === b.core.id)) || (samples.length < 4 && i % 53 === 7)) samples.push(b);
}
console.log('Builds/s:', Math.round(N / ((Date.now() - t0) / 1000)), '| null:', nulls, '| harte Fehler:', fail, JSON.stringify(hard), '| weiche Hinweise:', soft);
for (const [k, v] of Object.entries(stats)) console.log(k.padEnd(8), 'Off-Archetyp', (100 * v.unnat / v.n).toFixed(0).padStart(3) + '%', ' Meta/Bar', (v.meta / v.n).toFixed(2), ' Kern', (100 * v.core / v.n).toFixed(0) + '%', ' Primärattribut genutzt', (100 * v.prim / v.n).toFixed(0) + '%');
console.log('Kerne:', JSON.stringify(coreSeen));
const A = ctx.GWDATA.names.attribute;
for (const b of samples) console.log(`\n${b.mode} w${b.weird} ${P[b.primary]}/${P[b.secondary]} ${b.role} ${b.fam}${b.core ? ' [' + b.core.name.de + ']' : ''} ${b.attributes.map(([a, r]) => A[a].de.slice(0, 12) + ' ' + r + (b.passive.includes(a) ? 'p' : '')).join(', ')}\n   ` + b.bar.map(s => s.n.en).join(' | '));

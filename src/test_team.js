const fs = require('fs'), vm = require('vm');
const ctx = {console, Math}; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/data.js', 'utf8').replace('const GWDATA=', 'globalThis.GWDATA='), ctx);
vm.runInContext(fs.readFileSync(__dirname + '/cores.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(__dirname + '/generator.js', 'utf8'), ctx);
const G = ctx.GWGen, P = ['', 'W', 'R', 'Mo', 'N', 'Me', 'E', 'A', 'Rt', 'P', 'D'];
let miss = 0, n = 0, t0 = Date.now();
for (const size of [4, 6, 8]) for (let w = 1; w <= 10; w += 3) for (let i = 0; i < 25; i++) {
  const t = G.genTeam({size, weird: w, seed: i * 31 + w * 1000 + size}); n++;
  if (G.teamCheck(t).length) miss++;
  if (i === 0 && (w === 4 || w === 10) && size === 8) {
    console.log(`\nTeam ${size} w${w} Thema: ${t.theme ? t.theme.name.de : '-'} fehlt: ${G.teamCheck(t)}`);
    t.members.forEach(m => console.log(`  ${m.role.padEnd(7)} ${P[m.primary]}/${P[m.secondary]} ${m.fam.padEnd(6)} ${m.bar.map(s => s.n.en).join(' | ')}`));
    G.rerollMember(t, 3, false); console.log('  reroll#4 ->', P[t.members[3].primary] + '/' + P[t.members[3].secondary], t.members[3].bar.map(s => s.n.en).join(' | '));
  }
}
console.log(`\n${n} Teams, ${miss} mit Lücke (Zustands-/Verhexungsentfernung, Rez, Heiler), ${Math.round((Date.now() - t0) / n)} ms/Team`);
for (let i = 0; i < 5; i++) { const b = G.genBuild({mode: 'pvp', weird: 3 + i * 2, seed: 900 + i});
  console.log(`PvP w${b.weird} ${P[b.primary]}/${P[b.secondary]} ${b.fam}: ${b.bar.map(s => s.n.en + (s.isPvpVersion ? '*' : '')).join(' | ')}`); }

/* GW1 Ultimate Bravery – Knowledge Base (English only). Reads GWDATA, GW_WIKI, GW_KB and the generator (GWGen). */
(function () {
'use strict';
const G = window.GWGen, D = window.GWDATA, N = D.names;
const W = window.GW_WIKI || {skills: {}, pvx: {use: {pve: {}, pvp: {}}}, fetched: ''};
const K = window.GW_KB || {stats: {}, gloss: [], prov: {}, res: {}, pairs: []};
const V = G.view('pve'), VP = G.view('pvp');
const AB = ['X', 'W', 'R', 'Mo', 'N', 'Me', 'E', 'A', 'Rt', 'P', 'D'];
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const fmt = n => Number(n || 0).toLocaleString('en-US');
const prof = p => (p && N.profession[p] && N.profession[p].en) || 'Common';
const attr = a => a >= 0 && N.attribute[a] ? N.attribute[a].en : (a >= 900 ? 'Title track' : 'No attribute');
const typ = t => (N.type[t] && N.type[t].en) || '';
const camp = c => (N.campaign && N.campaign[c] && N.campaign[c].en) || '';
const byId = id => V.byId.get(+id);
// Icons aus dem optionalen Wiki-Lauf (fundorte.js + icons/ neben der HTML)
const ICS = new Set((W.ic || []));
const icon = s => { const f = window.GW_SOURCES && window.GW_SOURCES[s.id]; return f && f.icon ? f.icon : ICS.has(s.id) ? 'icons/' + s.id + '.jpg' : ''; };

// ---------- Traits in plain English ----------
const COND = {bleeding: 'Bleeding', burning: 'Burning', poison: 'Poison', cripple: 'Crippled', blind: 'Blind', daze: 'Dazed',
  deepwound: 'Deep Wound', disease: 'Disease', weakness: 'Weakness', crackedarmor: 'Cracked Armor'};
const GROUPS = [['foe', 'Against foes'], ['ally', 'For allies'], ['self', 'For you'], ['need', 'Needs / pays off with'], ['fric', 'Friction & limits'], ['kind', 'Kind']];
const T = {
  dmg: ['foe', 'Damage'], aoe: ['foe', 'Area damage'], kd: ['foe', 'Knockdown'], interrupt: ['foe', 'Interrupt'], snare: ['foe', 'Slows foes'],
  edenial: ['foe', 'Energy denial'], rm_ench: ['foe', 'Removes enchantments'], degen: ['foe', 'Degeneration'], armorpen: ['foe', 'Armor penetration'],
  control: ['foe', 'Control'],
  heal_other: ['ally', 'Heals an ally'], heal_party: ['ally', 'Heals the party'], prot: ['ally', 'Protection'], rm_cond: ['ally', 'Removes conditions'],
  rm_hex: ['ally', 'Removes hexes'], partybuff: ['ally', 'Party buff'], energy_ally: ['ally', 'Energy for allies'], rez: ['ally', 'Resurrection'],
  heal_self: ['self', 'Heals you'], defense: ['self', 'Defense'], stability: ['self', 'Cannot be knocked down'], energy: ['self', 'Energy'],
  maxhp: ['self', '+ Maximum health'], adr_gain: ['self', 'Gains adrenaline'], attackbuff: ['self', 'Attack buff'], recharge: ['self', 'Faster recharge'],
  speed: ['self', 'Speed'], gapclose: ['self', 'Shadow step / gap closer'], self_ench: ['self', 'Enchants you'], lowhp_src: ['self', 'Lowers your health'],
  selfcond: ['self', 'Conditions on you'], selfkd: ['self', 'Knocks you down'], rm_cond_self: ['self', 'Removes your conditions'], crit: ['self', 'Critical hits'],
  creature: ['self', 'Creates a creature'], minion: ['self', 'Animates minions'], spirit: ['self', 'Creates a spirit'], corpse: ['self', 'Uses corpses'],
  overcast: ['self', 'Causes Overcast'],
  needs_hex: ['need', 'Pays off vs. hexed foes'], needs_cond: ['need', 'Pays off vs. foes with conditions'], needs_kd: ['need', 'Pays off vs. knocked-down foes'],
  needs_ench: ['need', 'Pays off while you are enchanted'], needs_selfench: ['need', 'Counts your enchantments'], needs_attack: ['need', 'Needs attacks'],
  needs_spirit: ['need', 'Needs spirits nearby'], needs_minion: ['need', 'Needs minions'], needs_spells: ['need', 'Pays off per spell cast'],
  needs_signets: ['need', 'Counts your signets'], needs_shoutchant: ['need', 'Needs shouts or chants'], needs_stance: ['need', 'Needs a stance'],
  needs_selfcond: ['need', 'Feeds on conditions on you'], needs_selfkd: ['need', 'Wants you knocked down'], needs_hexes: ['need', 'Needs several hexes'],
  needs_waterhex: ['need', 'Needs water hexes'], needs_overcast: ['need', 'Needs Overcast'], needs_morehp: ['need', 'Wants more health than the target'],
  needs_lowhp: ['need', 'Wants low own health'], needs_bigenergy: ['need', 'Scales with your energy'], needs_crit: ['need', 'Pays off on critical hits'],
  needs_item: ['need', 'Needs a bundle'], needs_wpnspell: ['need', 'Needs a weapon spell'], needs_creature: ['need', 'Needs creatures'],
  needs_elespells: ['need', 'Needs elemental spells'], needs_shield: ['need', 'Needs a shield'], rm_dench: ['need', 'Consumes Dervish enchantments'],
  on_dench_loss: ['need', 'Triggers on enchantment loss'], req_lead: ['need', 'Must follow a lead attack'], req_offhand: ['need', 'Must follow an off-hand attack'],
  req_dual: ['need', 'Must follow a dual attack'], adrenal: ['need', 'Costs adrenaline'],
  ends_on_ench: ['fric', 'Ends when you are enchanted'], ends_on_otherench: ['fric', 'Ends on your next enchantment'], ends_on_attack: ['fric', 'Ends when you attack'],
  ends_on_adrenal: ['fric', 'Ends on adrenal skills'], ends_on_attackskill: ['fric', 'Ends on attack skills'], ends_on_nonhex: ['fric', 'Ends on non-hex skills'],
  ends_on_nonadrenal: ['fric', 'Ends on non-adrenal skills'], ends_on_move: ['fric', 'Ends when you move'], adr_dump: ['fric', 'Loses all adrenaline'],
  e_dump: ['fric', 'Loses all energy'], no_spells: ['fric', 'You cannot cast spells'], 'anti:selfench': ['fric', 'Removes your enchantments'],
  hp_keep_high: ['fric', 'Ends below 50% health'], rm_foe_cond: ['fric', 'Removes conditions from foes'], strict: ['fric', 'Useless without its source'],
  melee_only: ['fric', 'Melee only'], nondagger: ['fric', 'Non-dagger weapons only'], elem_weapon: ['fric', 'Needs an elemental weapon'],
  attack: ['kind', 'Attack'], spell: ['kind', 'Spell'], hex: ['kind', 'Hex'], ench: ['kind', 'Enchantment'], signet: ['kind', 'Signet'], stance: ['kind', 'Stance'],
  shout: ['kind', 'Shout'], chant: ['kind', 'Chant'], touch: ['kind', 'Touch skill'], ritual: ['kind', 'Ritual'], weaponspell: ['kind', 'Weapon spell'],
  item: ['kind', 'Bundle'], trap: ['kind', 'Trap'], well: ['kind', 'Well'], form: ['kind', 'Form'], prep: ['kind', 'Preparation'], lead: ['kind', 'Lead attack'],
  offhand: ['kind', 'Off-hand attack'], dual: ['kind', 'Dual attack'], maintained: ['kind', 'Maintained'], sacrifice: ['kind', 'Health sacrifice'],
  closerange: ['kind', 'Close range'], mesmerhex: ['kind', 'Mesmer hex'], waterhex: ['kind', 'Water hex'], utility: ['kind', 'Utility'], pet: ['kind', 'Pet'],
};
const HIDE = new Set(['cond', 'heal', 'shoutchant', 'dench']);
function tagInfo(t) {
  if (HIDE.has(t) || t.startsWith('elem:')) return null;
  if (T[t]) return T[t];
  let m = t.match(/^c_(.+)$/); if (m && COND[m[1]]) return ['foe', 'Causes ' + COND[m[1]]];
  m = t.match(/^needs_(.+)$/); if (m && COND[m[1]]) return ['need', 'Pays off vs. ' + COND[m[1]]];
  m = t.match(/^dis:(\w+):(\d+)$/); if (m) return ['fric', 'Disables your ' + ((G.DIS_NAME[m[1]] || {}).en || m[1]) + ' (' + m[2] + 's)'];
  m = t.match(/^attune:(\d+)$/); if (m) return ['need', 'Attunement: ' + attr(+m[1])];
  return ['kind', t.replace(/_/g, ' ')];
}
// Wiki-Listen mit Gliederung: führende Leerzeichen = Unterpunkt
const li = l => { const d = (l.match(/^ */)[0].length / 2) | 0; return `<li${d ? ` style="margin-left:${d * 16}px;list-style:circle"` : ''}>${esc(l.trim())}</li>`; };
const PV_TXT = {W: "Added from the wiki's structured skill data", M: 'Manual correction', R: 'Read from the skill description (rule-based)'};
function provOf(name, tag) {
  const p = K.prov[name] || {};
  if ((p.w || []).some(([c, , pvp]) => !pvp && c === '+' + tag)) return 'W';
  if ((p.o || []).includes('+' + tag)) return 'M';
  return 'R';
}

// ---------- Engines ----------
const ENG_INFO = {
  attune: 'Attunements refund energy when you use skills of their element.',
  longcast: 'Mesmer primary: Fast Casting also speeds up long spells of other professions.',
  halfrange: 'Assassin thrown-dagger spells, sped up by Deadly Haste.',
  primexploit: "Other professions' skills that profit from your primary attribute – depends on the primary, so no fixed member list.",
  touch: 'Stack engine: the bar wants at least 3 touch skills.', teleport: 'Stack engine: the bar wants at least 3 shadow steps.',
  aoe: 'Stack engine: the bar wants at least 4 area-damage skills.', interrupt: 'Stack engine: the bar wants at least 3 interrupts.',
  edenial: 'Stack engine: the bar wants at least 3 energy-denial skills.',
};
function members(m) {
  if (m.special === 'primexploit') return [];
  const ctx = {primary: m.prim ? m.prim[0] : 1, fam: 'caster', mode: 'pve'};
  return V.skills.filter(s => G.motorHit(m, s, ctx));
}
const MEM = new Map(G.MOTORS.map(m => [m.id, members(m)]));
function roleIn(m, s) {
  if (m.stack || m.special) return 'member';
  if (m.cons.some(t => s.tags.has(t))) return 'payoff';
  if (m.prod.some(t => s.tags.has(t))) return 'enabler';
  return 'member';
}
const metaSort = (a, b) => (b.m - a.m) || a.n.en.localeCompare(b.n.en);
function chip(s, extra) {
  return `<span class="sk" tabindex="0" role="button" style="--kc:var(--${AB[s.p] || 'X'})" data-sid="${s.id}" title="${esc(prof(s.p) + ' · ' + attr(s.a))}">${esc(s.n.en)}${extra ? ' ' + extra : ''}${s.m >= 0.5 ? ' <span class="mt">META</span>' : ''}</span>`;
}
function chips(list, max) {
  const sh = list.slice(0, max);
  return sh.map(s => chip(s)).join('') + (list.length > max ? ` <span class="more">+${list.length - max} more</span>` : '');
}

// ---------- Engine-Netz: Eingabe (Professionen) → verborgene Schicht (Engines) → Ausgabe (Rollen) ----------
const NET_ROLES = [['dmg', 'Damage', s => s.tags.has('dmg')], ['tank', 'Tank', s => s.tags.has('defense') || s.tags.has('stability')],
  ['support', 'Support', s => ['partybuff', 'energy_ally', 'rm_cond', 'rm_hex', 'speed', 'rez', 'edenial', 'interrupt'].some(t => s.tags.has(t))],
  ['prot', 'Prot', s => s.tags.has('prot')], ['heal', 'Healer', s => s.tags.has('heal_other') || s.tags.has('heal_party')]];
const NET_PROFS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0];
const NET = (() => {
  const ms = G.MOTORS, inE = [], outE = [];
  for (const m of ms) {
    const mem = MEM.get(m.id);
    for (const p of NET_PROFS) { const c = mem.filter(s => (s.p || 0) === p).length; if (c >= 2) inE.push({p, m: m.id, c}); }
    for (const [r, , f] of NET_ROLES) { const c = mem.filter(f).length; if (c >= 3 && c >= mem.length * 0.08) outE.push({r, m: m.id, c}); }
  }
  // Engines nach Schwerpunkt der Professionen sortieren (weniger Kreuzungen)
  const bary = m => { const es = inE.filter(e => e.m === m.id); const w = es.reduce((t, e) => t + e.c, 0);
    return w ? es.reduce((t, e) => t + NET_PROFS.indexOf(e.p) * e.c, 0) / w : (m.prim ? NET_PROFS.indexOf(m.prim[0]) : 5); };
  const order = ms.slice().sort((x, y) => bary(x) - bary(y) || x.name.en.localeCompare(y.name.en));
  return {inE, outE, order};
})();
let netW = 5, netSel = null;
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function netAct(tw) {
  const w = new Map(G.MOTORS.map(m => [m.id, G.motorWeight(m, tw)])), mx = Math.max(...w.values()) || 1;
  for (const [k, v] of w) w.set(k, v / mx);
  return w;
}
function renderNet(sel) {
  if (sel !== undefined) netSel = sel ? 'm:' + sel : null;
  const W0 = 800, H0 = 900, top = 34, X1 = 146, X2 = 414, X3 = 672, PW = 178;
  const act = netAct((netW - 1) / 9), ord = NET.order, n = ord.length;
  const ey = i => top + 10 + i * ((H0 - top - 30) / (n - 1));
  const py = i => top + 30 + i * ((H0 - top - 80) / (NET_PROFS.length - 1));
  const ry = i => top + 90 + i * ((H0 - top - 200) / (NET_ROLES.length - 1));
  const EP = new Map(ord.map((m, i) => [m.id, ey(i)])), PP = new Map(NET_PROFS.map((p, i) => [p, py(i)])), RP = new Map(NET_ROLES.map(([r], i) => [r, ry(i)]));
  const pc = p => `var(--${AB[p] || 'X'})`;
  const keyOn = k => !netSel || k.split(' ').includes(netSel);
  const curve = (x1, y1, x2, y2) => { const dx = (x2 - x1) * 0.5; return `M${x1.toFixed(1)},${y1.toFixed(1)} C${(x1 + dx).toFixed(1)},${y1.toFixed(1)} ${(x2 - dx).toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`; };
  let edges = '', pulses = '', k = 0;
  const pulseList = [];
  for (const e of NET.inE) {
    const keys = `p:${e.p} m:${e.m}`, on = keyOn(keys), a = act.get(e.m);
    const id = 'ne' + (k++), d = curve(X1 + 10, PP.get(e.p), X2 - PW / 2, EP.get(e.m));
    const op = netSel ? (on ? 0.85 : 0.04) : 0.08 + 0.5 * a;
    edges += `<path id="${id}" class="nedge" data-k="${keys}" d="${d}" stroke="${pc(e.p)}" stroke-width="${(0.5 + Math.sqrt(e.c) * 0.5).toFixed(2)}" opacity="${op.toFixed(2)}"/>`;
    if (on && (netSel || a > 0.45)) pulseList.push([id, pc(e.p), e.c * (netSel ? 1 : a), 0]);
  }
  for (const e of NET.outE) {
    const keys = `m:${e.m} r:${e.r}`, on = keyOn(keys), a = act.get(e.m);
    const id = 'ne' + (k++), d = curve(X2 + PW / 2, EP.get(e.m), X3 - 12, RP.get(e.r));
    const op = netSel ? (on ? 0.85 : 0.04) : 0.08 + 0.5 * a;
    edges += `<path id="${id}" class="nedge out" data-k="${keys}" d="${d}" stroke-width="${(0.5 + Math.sqrt(e.c) * 0.5).toFixed(2)}" opacity="${op.toFixed(2)}"/>`;
    if (on && (netSel || a > 0.45)) pulseList.push([id, 'var(--gold2)', e.c * (netSel ? 1 : a), 1]);
  }
  if (!reduceMotion) {
    pulseList.sort((x, y) => y[2] - x[2]).slice(0, netSel ? 60 : 46).forEach(([id, col, , layer], i) => {
      const dur = 2.6 + (i % 5) * 0.35, begin = (layer ? 1.3 : 0) + (i * 0.37) % 2.6;
      pulses += `<circle class="pulse" r="3.2" fill="${col}" opacity="0"><animateMotion dur="${dur.toFixed(2)}s" begin="${begin.toFixed(2)}s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href="#${id}"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="${dur.toFixed(2)}s" begin="${begin.toFixed(2)}s" repeatCount="indefinite"/></circle>`;
    });
  }
  let nodes = '';
  NET_PROFS.forEach(p => {
    const y = PP.get(p), cnt = NET.inE.filter(e => e.p === p).reduce((t, e) => t + e.c, 0), on = keyOn('p:' + p), r = 5 + Math.sqrt(cnt) * 0.55;
    nodes += `<g class="inode${netSel === 'p:' + p ? ' on' : ''}" data-np="${p}" data-k="p:${p}" tabindex="0" role="button" aria-label="${esc(prof(p))}" opacity="${netSel && !on ? 0.35 : 1}">
      <circle cx="${X1}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${pc(p)}" class="glow"/><text x="${X1 - r - 9}" y="${y.toFixed(1)}" text-anchor="end" dominant-baseline="middle">${esc(prof(p))}</text></g>`;
  });
  ord.forEach(m => {
    const y = EP.get(m.id), a = act.get(m.id), on = keyOn('m:' + m.id), selOn = netSel === 'm:' + m.id;
    nodes += `<g class="node${selOn ? ' on' : ''}${a > 0.7 ? ' hot' : ''}" data-m="${m.id}" data-k="m:${m.id}" tabindex="0" role="button" aria-label="${esc(m.name.en)}" opacity="${netSel && !on ? 0.3 : 1}">
      <rect x="${X2 - PW / 2}" y="${(y - 9.5).toFixed(1)}" width="${PW}" height="19" rx="9.5" style="--a:${a.toFixed(2)}"/>
      <rect class="bar" x="${X2 - PW / 2 + 8}" y="${(y + 6.6).toFixed(1)}" width="${((PW - 16) * a).toFixed(1)}" height="1.6" rx="0.8"/>
      <text x="${X2}" y="${(y + 0.5).toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${esc(m.name.en)}</text></g>`;
  });
  NET_ROLES.forEach(([r, name]) => {
    const y = RP.get(r), cnt = NET.outE.filter(e => e.r === r).reduce((t, e) => t + e.c, 0), on = keyOn('r:' + r), rad = 6 + Math.sqrt(cnt) * 0.5;
    nodes += `<g class="onode${netSel === 'r:' + r ? ' on' : ''}" data-nr="${r}" data-k="r:${r}" tabindex="0" role="button" aria-label="${esc(name)}" opacity="${netSel && !on ? 0.35 : 1}">
      <circle cx="${X3}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}" class="glow"/><text x="${X3 + rad + 9}" y="${y.toFixed(1)}" dominant-baseline="middle">${esc(name)}</text></g>`;
  });
  const heads = `<text class="lh" x="${X1}" y="16" text-anchor="middle">INPUT · PROFESSIONS</text><text class="lh" x="${X2}" y="16" text-anchor="middle">HIDDEN · ENGINES</text><text class="lh" x="${X3}" y="16" text-anchor="middle">OUTPUT · ROLES</text>`;
  const svg = $('#net');
  svg.setAttribute('viewBox', `0 0 ${W0} ${H0}`);
  svg.innerHTML = `<defs><filter id="nglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${heads}<g class="edges">${edges}</g><g class="pulses">${pulses}</g>${nodes}`;
  $('#nwv').textContent = netW;
}
function netIntro() {
  const act = netAct((netW - 1) / 9), top = G.MOTORS.slice().sort((a, b) => act.get(b.id) - act.get(a.id)).slice(0, 8);
  $('#edetail').innerHTML = `<h4>Reading the network</h4>
    <p class="small">Read it like a small neural network. <b>Inputs</b> are the professions: each line is a group of their skills that can drive an engine. <b>Hidden nodes</b> are the ${G.MOTORS.length} engines – the mechanics a bar grows around. <b>Outputs</b> are the roles the engine's skills fill.</p>
    <p class="small">The <b>weirdness slider</b> is the input signal. It sets how strongly each engine fires: the glow and the thin bar under each engine show how likely the generator picks it at that weirdness. Pulses run along the strongest active paths.</p>
    <p class="small">Hover a node to trace its lines, click it for details.</p>
    <h3>Most active at weirdness ${netW}</h3><div class="elist" style="margin:0">${top.map(m => `<button class="chip" data-m="${m.id}">${esc(m.name.en)}<small>${Math.round(act.get(m.id) * 100)}%</small></button>`).join('')}</div>`;
}
// Hover: Verbindungen eines Knotens hervorheben, ohne neu zu zeichnen
function netHover(k) {
  const svg = $('#net'); svg.classList.toggle('hl', !!k);
  svg.querySelectorAll('.nedge').forEach(e => e.classList.toggle('lit', !!k && e.dataset.k.split(' ').includes(k)));
}
function showNetNode(kind, v) {
  if (kind === 'p') {
    const es = NET.inE.filter(e => e.p === v).sort((a, b) => b.c - a.c), act = netAct((netW - 1) / 9);
    $('#edetail').innerHTML = `<h4>${esc(prof(v))}</h4><div class="muted small">Input node · brings skills into ${es.length} engines</div>
      <p class="small">Line width = number of its skills inside the engine. Glow on the engines = how likely the generator picks them at weirdness ${netW}.</p>
      <div class="elist" style="margin:0">${es.map(e => `<button class="chip" data-m="${e.m}">${esc(G.MOTOR_BY_ID[e.m].name.en)}<small>${e.c} · ${Math.round(act.get(e.m) * 100)}%</small></button>`).join('')}</div>`;
  } else {
    const [, name] = NET_ROLES.find(x => x[0] === v), es = NET.outE.filter(e => e.r === v).sort((a, b) => b.c - a.c);
    $('#edetail').innerHTML = `<h4>${esc(name)}</h4><div class="muted small">Output node · ${es.length} engines deliver this role</div>
      <p class="small">Line width = engine skills that do this job (damage, defense/stability, party utility, protection or healing).</p>
      <div class="elist" style="margin:0">${es.map(e => `<button class="chip" data-m="${e.m}">${esc(G.MOTOR_BY_ID[e.m].name.en)}<small>${e.c}</small></button>`).join('')}</div>`;
  }
  netSel = kind + ':' + v; renderNet();
  document.querySelectorAll('#elist .chip').forEach(b => b.classList.remove('on'));
}
function showEngine(id) {
  const m = G.MOTOR_BY_ID[id]; if (!m) return;
  const mem = MEM.get(id).slice().sort(metaSort);
  const en = mem.filter(s => roleIn(m, s) === 'enabler'), pay = mem.filter(s => roleIn(m, s) === 'payoff'), other = mem.filter(s => roleIn(m, s) === 'member');
  const shared = G.MOTORS.filter(o => o.id !== id).map(o => { const B = new Set(MEM.get(o.id).map(s => s.id)); return [o, mem.filter(s => B.has(s.id)).length]; })
    .filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 8);
  $('#edetail').innerHTML = `<h4>${esc(m.name.en)}</h4>
    <div class="muted small">Typical from weirdness ~${Math.round(1 + m.wild * 9)} · ${mem.length} skills${m.prim ? ' · primary: ' + m.prim.map(prof).join(', ') : ''}${m.fam ? ' · ' + (m.fam === 'weapon' ? 'weapon builds' : m.fam + ' builds') : ''}</div>
    ${ENG_INFO[id] ? `<p class="small">${esc(ENG_INFO[id])}</p>` : ''}
    ${pay.length ? `<h3>Payoffs · ${pay.length}</h3>${chips(pay, 18)}` : ''}
    ${en.length ? `<h3>Enablers · ${en.length}</h3>${chips(en, 18)}` : ''}
    ${other.length ? `<h3>Members · ${other.length}</h3>${chips(other, 24)}` : ''}
    ${shared.length ? `<h3>Shares skills with</h3><div class="elist" style="margin:0">${shared.map(([o, c]) => `<button class="chip" data-m="${o.id}">${esc(o.name.en)}<small>${c}</small></button>`).join('')}</div>` : ''}`;
  renderNet(id);
  document.querySelectorAll('#elist .chip').forEach(b => b.classList.toggle('on', b.dataset.m === id));
}

// ---------- Skills ----------
let pf = 0, ff = new Set(), selId = null;
const FILTERS = [['elite', 'Elite', s => s.e], ['meta', 'Meta (PvE)', s => s.m >= 0.5], ['fric', 'Has friction', s => G.isConflictSource(s)],
  ['wiki', 'Wiki bug / anomaly', s => { const w = W.skills[s.id]; return !!(w && w.fl); }], ['pve', 'PvE-only', s => s.rp], ['open', 'Open question', s => !!K.res[s.n.en]]];
function renderFilters() {
  $('#pf').innerHTML = `<button class="chip${pf === 0 ? ' on' : ''}" data-pf="0">All</button>` + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p =>
    `<button class="chip${pf === p ? ' on' : ''}" data-pf="${p}" style="border-left:3px solid var(--${AB[p]})">${esc(prof(p))}</button>`).join('');
  $('#ff').innerHTML = FILTERS.map(([id, l]) => `<button class="chip${ff.has(id) ? ' on' : ''}" data-ff="${id}">${esc(l)}</button>`).join('');
}
function renderResults() {
  const q = $('#q').value.trim().toLowerCase();
  let list = V.skills.filter(s => (!pf || s.p === pf) && [...ff].every(f => FILTERS.find(x => x[0] === f)[2](s)));
  if (q) list = list.filter(s => s.n.en.toLowerCase().includes(q) || s.n.de.toLowerCase().includes(q));
  list.sort((a, b) => (q ? (b.n.en.toLowerCase().startsWith(q) - a.n.en.toLowerCase().startsWith(q)) : 0) || metaSort(a, b));
  $('#res').innerHTML = list.slice(0, 120).map(s => `<div class="res${s.id === selId ? ' on' : ''}" role="option" tabindex="0" data-sid="${s.id}" style="--kc:var(--${AB[s.p] || 'X'})">
    <span>${esc(s.n.en)}${s.e ? ' <span class="mt" style="color:var(--gold)">★</span>' : ''}</span><span class="r">${esc(AB[s.p] !== 'X' ? AB[s.p] : '—')} · ${esc(attr(s.a))}</span></div>`).join('')
    || '<div class="res muted">No skill matches.</div>';
  $('#rescount').textContent = `${list.length} of ${V.skills.length} skills${list.length > 120 ? ' · showing 120' : ''}`;
}
function costLine(s) {
  const c = [];
  if (s.en) c.push(s.en + ' energy'); if (s.ad) c.push(s.ad + ' adrenaline'); if (s.sac) c.push(s.sac + '% sacrifice'); if (s.up) c.push('upkeep ' + s.up);
  if (s.oc) c.push(s.oc + ' overcast'); if (s.act) c.push(s.act + 's cast'); if (s.rc) c.push(s.rc + 's recharge');
  return c.join(' · ');
}
function traitsHtml(s) {
  const rows = {};
  for (const t of [...s.tags].sort()) { const ti = tagInfo(t); if (!ti) continue; (rows[ti[0]] = rows[ti[0]] || []).push([t, ti[1]]); }
  const body = GROUPS.filter(([g]) => rows[g]).map(([g, l]) => `<div style="margin:8px 0"><div class="muted small" style="margin-bottom:4px">${l}</div><div class="tags">${rows[g].map(([t, lab]) => {
    const pv = provOf(s.n.en, t);
    return `<span class="tg${g === 'fric' ? ' fr' : ''}" title="${esc(PV_TXT[pv] + ' · tag ' + t)}"><span class="pv ${pv}">${pv}</span>${esc(lab)}</span>`;
  }).join('')}</div></div>`).join('');
  const removed = ((K.prov[s.n.en] || {}).w || []).filter(([c, , pvp]) => c.startsWith('−') && !pvp);
  return body + (removed.length ? `<div class="small muted" style="margin-top:6px">Removed after the wiki check: ${removed.map(([c, why]) => `<span title="${esc(why)}">${esc((tagInfo(c.slice(1)) || [0, c.slice(1)])[1])}</span>`).join(', ')}</div>` : '');
}
function synergyHtml(s) {
  const out = [];
  for (const [p, k, thr] of G.SYN) {
    if (s.tags.has(k)) {
      const src = V.skills.filter(x => x !== s && x.tags.has(p)).sort((a, b) => (b.p === s.p) - (a.p === s.p) || metaSort(a, b));
      if (src.length) out.push(`<div style="margin:8px 0"><div class="small"><b>${esc((tagInfo(k) || [0, k])[1])}</b> <span class="muted">· fed by ${fmt(src.length)} skills with “${esc((tagInfo(p) || [0, p])[1])}”${thr > 1 ? ` · wants ${thr} on the bar` : ''}</span></div>${chips(src, 8)}</div>`);
    }
  }
  for (const [p, k] of G.SYN) {
    if (s.tags.has(p) && !s.tags.has(k)) {
      const dst = V.skills.filter(x => x !== s && x.tags.has(k)).sort((a, b) => (b.p === s.p) - (a.p === s.p) || metaSort(a, b));
      if (dst.length && dst.length <= 60) out.push(`<div style="margin:8px 0"><div class="small"><b>Feeds “${esc((tagInfo(k) || [0, k])[1])}”</b> <span class="muted">· ${fmt(dst.length)} skills</span></div>${chips(dst, 8)}</div>`);
    }
  }
  const em = G.EDGE_MAP.get(s.n.en);
  if (em) {
    const list = [...em.entries()].map(([n, e]) => [V.byName.get(n), e]).filter(([x]) => x).sort((a, b) => b[1].w - a[1].w);
    const pair = new Map(K.pairs.flatMap(([a, b, c]) => [[a + '|' + b, c], [b + '|' + a, c]]));
    out.push(`<div style="margin:8px 0"><div class="small"><b>Linked skills</b> <span class="muted">– fixed edges from fun cores and pairs measured on PvX</span></div>${list.slice(0, 14).map(([x, e]) =>
      chip(x, `<span class="a">${e.src === 'pvx' ? 'PvX' + (pair.get(s.n.en + '|' + x.n.en) ? ' ×' + pair.get(s.n.en + '|' + x.n.en) : '') : 'core'}</span>`)).join('')}</div>`);
  }
  return out.join('') || '<p class="small muted">No explicit synergy relations – the skill is picked for its role (damage, healing, defense …).</p>';
}
const RULE_TITLE = {hpdir: 'Low health vs. high health', lowhp_maxhp: 'Low health vs. maximum health', lowhp_heal: 'Low health vs. self-healing',
  highhp_sac: 'High health vs. sacrifice', ench_ends: 'Ends when you are enchanted', otherench_ends: 'Ends on your next enchantment',
  attack_ends: 'Ends when you attack', adrenal_ends: 'Ends on adrenal skills', attackskill_ends: 'Ends on attack skills', nonhex_ends: 'Ends on non-hex skills',
  nonadrenal_ends: 'Ends on non-adrenal skills', move_ends: 'Ends when you move', adrdump: 'Throws adrenaline away', edump: 'Throws energy away',
  nospells: 'No spells while active', selfkd: 'Wants to fall – but cannot', selfcond_cleanse: 'Feeds on your conditions – and cleanses them',
  foecond: 'Applies conditions – and strips them again', selfench: 'Loses all your enchantments'};
const RULE_B = {hpdir: 'skills that want more health than the target or end below 50% health', lowhp_maxhp: 'skills that raise your maximum health',
  lowhp_heal: 'self-heals (penalty capped)', highhp_sac: 'sacrifice and self-damage', ench_ends: 'your own enchantments – hard if one is maintained',
  otherench_ends: 'other self-enchantments', attack_ends: 'attack skills (from the 2nd one)', adrenal_ends: 'adrenal skills',
  attackskill_ends: 'attack skills (from the 2nd one)', nonhex_ends: 'non-hex skills (from the 3rd one)', nonadrenal_ends: 'non-adrenal skills (from the 3rd one)',
  move_ends: 'speed boosts and shadow steps', adrdump: 'other adrenal skills (from the 3rd one)', edump: 'skills that scale with your energy',
  nospells: 'other spells – hard with 5 or more', selfkd: 'stability (“cannot be knocked down”)', selfcond_cleanse: 'skills that remove your own conditions',
  foecond: 'your condition skills (penalty capped)', selfench: 'your self-enchantments'};
const hasAny = (s, tags) => (Array.isArray(tags) ? tags : [tags]).some(t => s.tags.has(t));
const partnersOf = r => V.skills.filter(y => r.test ? r.test(y) : hasAny(y, r.b));
function frictionHtml(s) {
  const out = [];
  for (const r of G.CONFLICT_RULES) {
    if (hasAny(s, r.a)) {
      const p = partnersOf(r).filter(y => y !== s).sort((a, b) => (b.p === s.p) - (a.p === s.p) || metaSort(a, b));
      out.push(`<div class="box warn"><b>${esc(RULE_TITLE[r.id] || r.id)}</b> – ${esc(r.txt.en)}. Clashes with ${esc(RULE_B[r.id] || '')}.<div style="margin-top:6px">${chips(p, 6)}</div></div>`);
    } else if (!r.test && hasAny(s, r.b)) {
      const a = V.skills.filter(y => y !== s && hasAny(y, r.a)).sort(metaSort);
      if (a.length) out.push(`<div class="box"><b>${esc(RULE_TITLE[r.id] || r.id)}</b> – this skill is the partner side: ${esc(r.txt.en)} (${a.length} skill${a.length > 1 ? 's' : ''}).<div style="margin-top:6px">${chips(a, 6)}</div></div>`);
    }
  }
  for (const t of s.tags) {
    const m = t.match(/^dis:(\w+):(\d+)$/); if (!m) continue;
    out.push(`<div class="box ${+m[2] >= 8 ? 'bad' : 'warn'}"><b>Locks your own skills</b> – disables your ${esc((G.DIS_NAME[m[1]] || {}).en || m[1])} for ${m[2]}s. ${+m[2] >= 10 ? 'Strong penalty per affected skill.' : +m[2] >= 5 ? 'Medium penalty per affected skill.' : 'Small penalty.'}${+m[2] >= 8 ? ' Hard when 5 or more of the other skills are affected.' : ''}</div>`);
  }
  return out.join('') || '<p class="small muted">No known friction.</p>';
}
function metaHtml(s) {
  const sp = VP.byId.get(s.id), up = (W.pvx.use.pve || {})[s.id] || 0, uv = (W.pvx.use.pvp || {})[s.id] || 0;
  const row = (l, v, u) => `<span>${l}</span><div class="meter" aria-label="${l} ${v.toFixed(2)}"><i style="width:${Math.round(v * 100)}%"></i></div><span>${v.toFixed(2)} <span class="muted">· ${u ? (u * 100).toFixed(1) + '% of rated bars' : 'not in rated bars'}</span></span>`;
  return `<div class="bars">${row('PvE', s.m, up)}${sp && !s.rp ? row('PvP', sp.m, uv) : ''}</div>
    <p class="small muted" style="margin:8px 0 0">Meta value 0–1 from weighted use in PvXwiki bars (Great/Good, meta pages count double), plus a 0.3 base for the classic hand-picked list. Meta skills are welcome in weird bars only as a synergy link.</p>`;
}
function wikiHtml(s) {
  const w = W.skills[s.id];
  if (!w) return '<p class="small muted">No wiki data.</p>';
  const rel = (w.rel || []).map(n => V.byName.get(n)).filter(Boolean);
  return `${w.fl ? `<div class="box bad">${w.fl.includes('bug') ? '<b>Known bug</b> listed on the wiki. ' : ''}${w.fl.includes('anomaly') ? '<b>Anomaly</b>: the description differs from the actual behaviour. ' : ''}See the notes.</div>` : ''}
    <div class="grid2"><div>${w.acq && w.acq.length ? `<h3 style="margin-top:6px">Acquisition</h3><ul class="clean">${w.acq.map(li).join('')}</ul>` : ''}</div>
    <div>${w.notes && w.notes.length ? `<h3 style="margin-top:6px">Wiki notes</h3><ul class="clean">${w.notes.map(li).join('')}</ul>` : ''}
    ${w.hero ? `<h3>Hero usage</h3><ul class="clean">${w.hero.map(li).join('')}</ul>` : ''}</div></div>
    ${rel.length ? `<h3>Related on the wiki</h3>${chips(rel, 12)}` : ''}
    <div class="src">Source: <a href="${esc(w.u)}" target="_blank" rel="noopener">Guild Wars Wiki ↗</a> · revision ${esc(w.r || '–')} · skill text from gw-skilldata (game client)</div>`;
}
function showSkill(id, push) {
  const s = byId(id); if (!s) return;
  selId = s.id;
  const sp = VP.byId.get(s.id), pvpText = s.pvp ? s.pvp.d.en : null;
  const ms = G.MOTORS.filter(m => MEM.get(m.id).some(x => x.id === s.id));
  const open = K.res[s.n.en];
  $('#skillcard').innerHTML = `<article class="card" style="--kc:var(--${AB[s.p] || 'X'})">
    ${icon(s) ? `<img class="ico" src="${esc(icon(s))}" alt="" onerror="this.remove()">` : ''}<h4>${esc(s.n.en)}</h4><div class="de">German client: ${esc(s.n.de)}</div>
    <div class="meta"><span style="color:var(--${AB[s.p] || 'X'})"><b>${esc(prof(s.p))}</b></span><span>${esc(attr(s.a))}</span><span>${esc(typ(s.t))}</span>${s.e ? '<span style="color:var(--gold)">Elite</span>' : ''}${s.rp ? '<span>PvE-only</span>' : ''}${camp(s.c) ? `<span>${esc(camp(s.c))}</span>` : ''}</div>
    <div class="desc">${esc(s.d.en)}<div class="muted small" style="margin-top:6px">${esc(costLine(s))}</div></div>
    ${pvpText ? `<details style="margin-top:8px"><summary class="small">PvP version</summary><div class="desc" style="margin-top:6px">${esc(pvpText)}<div class="muted small" style="margin-top:6px">${esc(costLine(sp || s))}</div></div></details>` : ''}
    ${open ? `<div class="box warn" style="margin-top:12px"><b>Open question (unverified):</b> ${open.map(esc).join('; ')}</div>` : ''}
    <h3>How the generator reads it</h3>${traitsHtml(s)}
    <div class="small muted" style="margin-top:6px"><span class="tg" style="padding:1px 6px"><span class="pv R">R</span>rule-based</span> <span class="tg" style="padding:1px 6px"><span class="pv W">W</span>from wiki data</span> <span class="tg" style="padding:1px 6px"><span class="pv M">M</span>manual</span></div>
    ${ms.length ? `<h3>Engines</h3><div class="elist" style="margin:0">${ms.map(m => `<button class="chip" data-m="${m.id}">${esc(m.name.en)}<small>${roleIn(m, s)}</small></button>`).join('')}</div>` : ''}
    <h3>Synergies</h3>${synergyHtml(s)}
    <h3>Friction</h3>${frictionHtml(s)}
    <h3>Meta value</h3>${metaHtml(s)}
    <h3>From the wiki</h3>${wikiHtml(s)}
  </article>`;
  document.querySelectorAll('#res .res').forEach(r => r.classList.toggle('on', +r.dataset.sid === s.id));
  if (push) history.replaceState(null, '', '#skill-' + s.id);
}
function openSkill(id) {
  showSkill(id, true);
  const card = $('#skillcard');
  if (card.getBoundingClientRect().top < 0 || card.getBoundingClientRect().top > innerHeight * 0.6) $('#skills').scrollIntoView({behavior: 'smooth'});
}

// ---------- Friction ----------
function renderFriction() {
  $('#rules').innerHTML = G.CONFLICT_RULES.map(r => {
    const a = V.skills.filter(s => hasAny(s, r.a)).sort(metaSort);
    const hard = r.hardIf || r.hardAt;
    return `<div class="rule"><h5>${esc(RULE_TITLE[r.id] || r.id)}<span class="badge soft">soft</span>${hard ? '<span class="badge hard">can be hard</span>' : ''}</h5>
      <div class="why">${esc(r.txt.en[0].toUpperCase() + r.txt.en.slice(1))}. Clashes with ${esc(RULE_B[r.id] || '')}. Penalty ${r.w}${r.cap ? ' per partner, capped at ' + r.cap : r.once ? ' once' : ' per partner'}${r.free ? `, first ${r.free} free` : ''}.</div>
      <div class="muted small" style="margin-bottom:4px">Triggered by ${a.length} skill${a.length === 1 ? '' : 's'}</div>${chips(a, 10)}</div>`;
  }).join('');
  const dis = V.skills.flatMap(s => [...s.tags].filter(t => t.startsWith('dis:')).map(t => { const [, g, sec] = t.split(':'); return {s, g, sec: +sec}; }))
    .sort((a, b) => b.sec - a.sec || a.s.n.en.localeCompare(b.s.n.en));
  $('#distable').innerHTML = `<thead><tr><th>Skill</th><th>Locks</th><th>For</th><th>Penalty per affected skill</th></tr></thead><tbody>${dis.map(d => `<tr><td>${chip(d.s)}</td><td>${esc((G.DIS_NAME[d.g] || {}).en || d.g)}</td><td>${d.sec}s</td><td>${d.sec >= 10 ? 'strong (1.0)' : d.sec >= 5 ? 'medium (0.5)' : 'small (0.2)'}${d.sec >= 8 ? ' · hard if ≥ 5 affected' : ''}</td></tr>`).join('')}</tbody>`;
}

// ---------- Mechanics ----------
let gcat = 'All';
function renderGloss() {
  const cats = ['All', ...new Set(K.gloss.map(g => g.c))];
  $('#gfil').innerHTML = cats.map(c => `<button class="chip${c === gcat ? ' on' : ''}" data-gc="${esc(c)}">${esc(c)}</button>`).join('');
  $('#gloss').innerHTML = K.gloss.filter(g => gcat === 'All' || g.c === gcat).map(g => `<div class="term">
    <div class="q">${esc(g.c)}</div><h5>${esc(g.t)}</h5>
    ${g.q ? `<blockquote>${esc(g.q)}</blockquote><div class="q">${g.k === 'in-game' ? 'In-game description' : 'Guild Wars Wiki'}</div>` : ''}
    <div class="use"><b>In the generator:</b> ${esc(g.n)}</div>
    <div class="lk"><a href="${esc(g.u)}" target="_blank" rel="noopener">Guild Wars Wiki ↗</a>${g.r ? ` <span class="muted">· revision ${esc(g.r)}</span>` : ''}</div></div>`).join('');
}

// ---------- Sources ----------
function renderSources() {
  const st = K.stats;
  $('#srcs').innerHTML = [
    ['gw-skilldata', `Skill names, descriptions and numbers as in the game client (EN + DE), ${fmt(st.skills)} skills, ${fmt(st.pvp)} with PvP versions.`, `Commit ${esc(st.skilldata || '–')} · MIT licence`, 'https://github.com/build-wars/gw-skilldata'],
    ['Guild Wars Wiki', `${fmt(st.wikiSkillPages)} skill pages + ${fmt(st.pvp)} PvP pages + ${fmt(st.mechPages)} mechanics pages: structured fields (causes, removes, target), notes, acquisition, hero usage, bug and anomaly flags.`, `Fetched ${esc((W.fetched || '').slice(0, 10))} · GFDL`, 'https://wiki.guildwars.com/'],
    ['PvXwiki', `${fmt(st.pvxBars)} skill bars from build pages, ${fmt(st.pvxGood)} rated Great/Good. Used for the meta value per mode and ${fmt(st.pvxEdges)} measured synergy pairs.`, `Fetched ${esc((W.fetched || '').slice(0, 10))} · CC BY-NC-SA`, 'https://gwpvx.fandom.com/'],
    ['Confidence', `Traits are read from descriptions by rules (R), checked against the wiki fields (${fmt(st.wikiFixes)} automatic corrections, W) and hand-corrected where needed (${fmt(st.overrides)} overrides, M). ${fmt(st.residuals)} differences remain open.`, 'See “Open questions”', null],
  ].map(([h, p, f, u]) => `<div class="panel"><h5 style="margin:0 0 6px;font:500 19px/1.2 var(--serif);color:var(--gold2)">${esc(h)}</h5><p class="small" style="margin:0 0 8px;color:var(--text2)">${p}</p><div class="small muted">${f}${u ? ` · <a href="${u}" target="_blank" rel="noopener">open ↗</a>` : ''}</div></div>`).join('');
  $('#pipe').innerHTML = [
    ['1 · Skill data', 'gw-skilldata: texts, costs, attributes, PvP splits'], ['2 · Rule-based traits', 'descriptions → causes, needs, state, friction'],
    ['3 · Wiki check', 'structured wiki fields add or remove traits; the rest goes to review'], ['4 · Manual overrides', 'targeted corrections where rules fail'],
    ['5 · PvX', 'meta value per mode, measured pairs as synergy edges'], ['6 · Generator', 'engines, friction, scoring, hard rules'],
    ['7 · Mass tests', 'thousands of generated builds per release: rules, friction, organic cores'],
  ].map(([b, t]) => `<div><b>${esc(b)}</b>${esc(t)}</div>`).join('');
  const open = Object.entries(K.res);
  $('#open').innerHTML = open.length ? `<div class="tablewrap"><table><thead><tr><th>Skill</th><th>Difference between wiki and generator</th></tr></thead><tbody>${open.map(([n, why]) => {
    const s = V.byName.get(n); return `<tr><td>${s ? chip(s) : esc(n)}</td><td>${why.map(esc).join('<br>')}</td></tr>`; }).join('')}</tbody></table></div>
    <p class="small muted">Mostly wording questions (effect only under a condition, condition on allies instead of foes, or a gap in the wiki field). Full review list: <code>review/mechanik-abgleich.md</code> in the project.</p>` : '<p class="small muted">None.</p>';
  $('#foot').innerHTML = `Skill data: <a href="https://github.com/build-wars/gw-skilldata" target="_blank" rel="noopener">build-wars/gw-skilldata</a> (MIT). Descriptions and notes: <a href="https://wiki.guildwars.com/" target="_blank" rel="noopener">Guild Wars Wiki</a> (GFDL). Build statistics: <a href="https://gwpvx.fandom.com/" target="_blank" rel="noopener">PvXwiki</a> (CC BY-NC-SA). Guild Wars is a trademark of ArenaNet/NCSOFT. Unofficial fan tool, non-commercial.`;
}

// ---------- Punkte ----------
function renderPoints() {
  const B = G.POINTS_BASE;
  $('#ptsrules').innerHTML = [
    ['Base points', `Mission in normal mode <b>${B.nm}</b> · mission in hard mode <b>${B.hm}</b> · vanquish <b>${B.vq}</b>. A failed attempt is logged with 0 points.`],
    ['Weirdness factor', '× (1 + 0.08 per weirdness step above 1) – weirdness 10 is worth 1.72×.'],
    ['Full Bravery handicap', '× (1 + 0.25 per <i>effective</i> rule). A rule counts only if it actually changed the bar – the card shows these as “Today ignored”.'],
    ['Teams', 'Average weirdness and average effective rules of all members. One entry per team run.'],
    ['Vanquish', 'Only in hard mode. Guild Wars Wiki: “To vanquish an area, you must defeat every primary foe that spawns in hard mode.”'],
    ['Titles & achievements', 'Points fill the title track “Ultimate Bravery”: 8 ranks from Brave Recruit (50) to Legendary Ultimate Bravery (5,000). 33 achievements are read from the logbook – from “First Steps” to “The Versatile Hero” (all 10 primaries) and “Assemble!” (all 31 heroes).'],
    ['Storage', 'Logbook, skill base and connections live in this browser (localStorage). Use “Backup” in the randomizer to save or move them. A shared leaderboard needs a server and is not part of this edition.'],
  ].map(([h, t]) => `<div class="rule"><h5>${esc(h)}</h5><div class="why">${t}</div></div>`).join('');
  const ws = [1, 3, 5, 7, 8, 9, 10];
  $('#ptstable').innerHTML = `<thead><tr><th>Effective rules</th>${ws.map(w => `<th>w${w}</th>`).join('')}<th>Vanquish at w10</th></tr></thead><tbody>` +
    [0, 1, 2, 3].map(r => { const b = w => ({weird: w, braveUsed: Array(r).fill('x')});
      return `<tr><td>${r}</td>${ws.map(w => { const m = G.braveMult(b(w)); return `<td class="x${m >= 2.5 ? ' hi' : ''}">×${m.toFixed(2)}</td>`; }).join('')}<td>${G.points('vq', b(10))} points</td></tr>`; }).join('') + '</tbody>';
  $('#ptsnote').textContent = 'Points are a fun handicap, not a balance statement: a weirdness-10 bar with three rules off can be easier than a meta bar in the wrong area.';
}
// ---------- Kopf, Ablauf ----------
function renderHero() {
  const st = K.stats;
  $('#stamps').innerHTML = `<span>Skill data <b>gw-skilldata ${esc(st.skilldata || '')}</b></span><span>Guild Wars Wiki <b>${esc((W.fetched || '').slice(0, 10))}</b></span><span>PvXwiki <b>${esc((W.fetched || '').slice(0, 10))}</b></span><span>Generator <b>v${esc(D.v)}</b></span>`;
  $('#kpis').innerHTML = [[fmt(st.skills), `skills · ${fmt(st.pvp)} with PvP versions`], [G.MOTORS.length, 'engines'], [G.CONFLICT_RULES.length + 1, 'friction rules'],
    [fmt((st.wikiSkillPages || 0) + (st.pvp || 0) + (st.mechPages || 0)), 'wiki pages read'], [fmt(st.pvxBars), `PvX bars · ${fmt(st.pvxGood)} rated`], [fmt(st.pvxEdges), 'measured pairs in use']]
    .map(([b, s]) => `<div class="kpi"><b>${b}</b><span>${esc(s)}</span></div>`).join('');
  const steps = [
    ['Settings', 'Mode, weirdness, role – and Full Bravery switches up to 3 rules off.', 0],
    ['Fixed core?', 'Only at weirdness 9–10, and rarely: one of 20 classic fun cores.', 1],
    ['Engine first?', 'The weirder, the more often an engine is chosen before the professions.', 1],
    ['Professions & weapon', 'Role affinity and common pairs; a weapon only with its weapon attribute.', 1],
    ['Skill pool', 'Both professions, gear rules, no attacks of another weapon – limited to your unlocked skills and campaigns if you set a skill base.', 0],
    ['Pick engines', 'Feasible in the pool, matched to the weirdness.', 1],
    ['Attribute lines', 'Engine skills pull their attributes along; at most three lines.', 1],
    ['Anchor', 'The engine payoff goes in first, then the elite.', 0],
    ['Fill the bar', 'Role, synergy, engine, feel – minus friction; PvX pairs count less the weirder it gets.', 1],
    ['Spend points', 'Only lines the bar uses, the weapon line (≥ 9) and the primary attribute – at weirdness 1–4 always ≥ 8.', 1],
    ['Validate', 'Engine running, no payoff without enabler, role quotas, no hard friction; the primary profession keeps ≥ 4 skills at weirdness 1–4, ≥ 3 at 5–9.', 1],
    ['Result', 'Name from the motto, template code, links and any friction on the card.', 0],
  ];
  $('#flow').innerHTML = steps.map(([b, t, w]) => `<div class="step${w ? ' w' : ''}"><b>${esc(b)}</b><span>${esc(t)}</span></div>`).join('');
}

// ---------- Ereignisse ----------
document.addEventListener('click', e => {
  const sk = e.target.closest('[data-sid]'); if (sk) { openSkill(+sk.dataset.sid); return; }
  const np = e.target.closest('[data-np]'); if (np) { showNetNode('p', +np.dataset.np); return; }
  const nr = e.target.closest('[data-nr]'); if (nr) { showNetNode('r', nr.dataset.nr); return; }
  if (e.target.closest('#netreset')) { netSel = null; renderNet(); netIntro(); document.querySelectorAll('#elist .chip').forEach(b => b.classList.remove('on')); return; }
  const m = e.target.closest('[data-m]'); if (m) { showEngine(m.dataset.m); if (!e.target.closest('#engines')) $('#engines').scrollIntoView({behavior: 'smooth'}); return; }
  const p = e.target.closest('[data-pf]'); if (p) { pf = +p.dataset.pf; renderFilters(); renderResults(); return; }
  const f = e.target.closest('[data-ff]'); if (f) { const id = f.dataset.ff; ff.has(id) ? ff.delete(id) : ff.add(id); renderFilters(); renderResults(); return; }
  const g = e.target.closest('[data-gc]'); if (g) { gcat = g.dataset.gc; renderGloss(); }
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-sid],[data-m],[data-np],[data-nr]')) { e.preventDefault(); e.target.click(); } });
$('#net').addEventListener('mouseover', e => { const g = e.target.closest('[data-k]'); if (g && !g.classList.contains('nedge')) netHover(g.dataset.k); });
$('#net').addEventListener('mouseleave', () => netHover(null));
$('#nw').addEventListener('input', e => { netW = +e.target.value; renderNet(); if (!netSel) netIntro(); });
$('#q').addEventListener('input', renderResults);
const secs = [...document.querySelectorAll('section.blk')], tabs = [...document.querySelectorAll('nav.tabs a')];
const io = new IntersectionObserver(es => { for (const en of es) if (en.isIntersecting) tabs.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id)); }, {rootMargin: '-45% 0px -50% 0px'});
secs.forEach(s => io.observe(s));

renderHero();
$('#elist').innerHTML = G.MOTORS.map(m => `<button class="chip" data-m="${m.id}">${esc(m.name.en)}<small>${MEM.get(m.id).length || '·'}</small></button>`).join('');
renderNet(null); netIntro();
renderFilters(); renderResults();
renderFriction(); renderGloss(); renderPoints(); renderSources();
const h = location.hash.match(/^#skill-(\d+)$/);
showSkill(h ? +h[1] : (V.byName.get("Grenth's Balance") || V.skills[0]).id, false);
window.GWKB = {showSkill, showEngine};
})();

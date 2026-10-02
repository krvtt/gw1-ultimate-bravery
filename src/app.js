/* GW1 Ultimate Bravery – Oberfläche */
(function () {
'use strict';
const G = window.GWGen, D = window.GWDATA, N = D.names;
const AB = ['X','W','R','Mo','N','Me','E','A','Rt','P','D'];
const $ = s => document.querySelector(s);
const T = {
  de: {tagline:'Zufällige Off-Meta-Builds, die trotzdem funktionieren.', mode:'Modus', scope:'Umfang', weird:'Weirdness', primary:'Primärprofession',
    role:'Rolle', lang:'Sprache', roll:'Würfeln!', share:'Link kopieren', random:'Zufall', copy:'Code kopiert', linkcopied:'Link kopiert',
    reroll:'Neu würfeln', rerollKeep:'Neu würfeln, Profession behalten', template:'Vorlagencode', team:'Team', theme:'Team-Thema',
    missing:'Hinweis: Im Team fehlt noch', rm_cond:'Cond-Removal', rm_hex:'Hex-Removal', rez:'2. Rez', heal:'Healer',
    idea:'Spielidee', dmgBy:'Damage', sustainBy:'Sustain', energyBy:'Energie', synBy:'Synergie', none:'–',
    brave:'Today I go full bravery', braveHint:'Jeder Haken setzt eine zufällige Regel außer Kraft. Ohne Haken bleibt jede Stufe stimmig.', braveOff:'Heute ignoriert', braveNoEffect:'Diesmal ohne Folgen – passte nicht zu dieser Leiste', primTag:'Primär', weapTag:'Waffe',
    runes:'inkl. Rune/Kopfbedeckung', srcMissing:'Fundort: noch nicht geladen (Platzhalter). Anleitung: README.', srcLoaded:'Fundorte geladen',
    srcNone:'Fundorte noch nicht geladen – Tooltips zeigen einen Platzhalter.', where:'Fundort', energy:'Energie', adrenaline:'Adrenalin',
    activation:'Aktivierung', recharge:'Wiederaufladung', upkeep:'Unterhalt', sacrifice:'Opfer', overcast:'Überzauberung', pvp:'PvP-Version',
    pveonly:'nur PvE', rank:'Rang', noattr:'kein Attribut', elite:'ELITE', soft:'Hinweis', pts:'Punkte', weapon:'Waffe', mem:'Mitglied',
    bonkers:'Völlig irre', plan:'Spielidee', attrsH:'Attribute', setsH:'Waffen-Sets', upgradesNote:'Upgrade-Namen englisch, Details ohne Gewähr.', runesShort:'inkl. Rune/Kopfbedeckung',
    motor:'Motor', gear:'Ausrüstung', gearElem:{fire:'Feuer',cold:'Kälte',lightning:'Blitz',earth:'Erde'}, gearNote:'Waffe mit {x}schaden nötig (Präfix-Upgrade), sonst wirkt {s} nicht.',
    rate:'Bewerten', ratedUp:'👍 gespeichert', ratedDown:'👎 gespeichert', ratings:'Bewertungen', exportR:'exportieren', clearR:'löschen', confirmClear:'Alle Bewertungen löschen?', notePh:'Notiz (optional)', saveR:'Speichern', reasons:{fun:'lustig',strong:'stark',slow:'zäh',broken:'kaputt',boring:'langweilig',meta:'zu meta',confusing:'unklar'}, wikiNotes:'Wiki-Notizen (EN)', wikiBug:'Wiki: bekannter Bug – siehe Notizen', wikiAnomaly:'Wiki: Beschreibung weicht vom Verhalten ab (Anomalie)', heroUse:'Helden (Wiki)',
    primNone:'Primärattribut ohne Punkte – bringt dieser Leiste wenig.', core:'Spaß-Kern', primLbl:'Primärattribut', discount:'Rabatt',
    foot1:'Skilldaten:', foot2:'Beschreibungen aus dem Guild Wars Wiki (GFDL) bzw. GuildWiki (CC BY-NC-SA 2.5). Guild Wars ist eine Marke von ArenaNet/NCSOFT. Inoffizielles Fan-Tool, nicht kommerziell.'},
  en: {tagline:'Random off-meta builds that still work.', mode:'Mode', scope:'Scope', weird:'Weirdness', primary:'Primary profession',
    role:'Role', lang:'Language', roll:'Roll!', share:'Copy link', random:'Random', copy:'Code copied', linkcopied:'Link copied',
    reroll:'Reroll', rerollKeep:'Reroll, keep profession', template:'Template code', team:'Team', theme:'Team theme',
    missing:'Note: the team still lacks', rm_cond:'cond removal', rm_hex:'hex removal', rez:'2nd rez', heal:'healer',
    idea:'Game plan', dmgBy:'Damage', sustainBy:'Sustain', energyBy:'Energy', synBy:'Synergy', none:'–',
    brave:'Today I go full bravery', braveHint:'Each tick switches off one random rule. Without ticks every level stays coherent.', braveOff:'Ignored today', braveNoEffect:'No effect this time – did not fit this bar', primTag:'primary', weapTag:'weapon',
    runes:'incl. rune/headgear', srcMissing:'Source: not loaded yet (placeholder). See README.', srcLoaded:'Sources loaded',
    srcNone:'Skill sources not loaded yet – tooltips show a placeholder.', where:'Source', energy:'Energy', adrenaline:'Adrenaline',
    activation:'Activation', recharge:'Recharge', upkeep:'Upkeep', sacrifice:'Sacrifice', overcast:'Overcast', pvp:'PvP version',
    pveonly:'PvE only', rank:'rank', noattr:'no attribute', elite:'ELITE', soft:'Note', pts:'points', weapon:'Weapon', mem:'Member',
    bonkers:'Utterly bonkers', plan:'Game plan', attrsH:'Attributes', setsH:'Weapon sets', upgradesNote:'Upgrade names in English, details without guarantee.', runesShort:'incl. rune/headgear',
    motor:'Engine', gear:'Gear', gearElem:{fire:'fire',cold:'cold',lightning:'lightning',earth:'earth'}, gearNote:'Needs a weapon dealing {x} damage (prefix upgrade), otherwise {s} does nothing.',
    rate:'Rate', ratedUp:'👍 saved', ratedDown:'👎 saved', ratings:'Ratings', exportR:'export', clearR:'clear', confirmClear:'Delete all ratings?', notePh:'Note (optional)', saveR:'Save', reasons:{fun:'fun',strong:'strong',slow:'sluggish',broken:'broken',boring:'boring',meta:'too meta',confusing:'unclear'}, wikiNotes:'Wiki notes', wikiBug:'Wiki: known bug – see notes', wikiAnomaly:'Wiki: description differs from behaviour (anomaly)', heroUse:'Heroes (wiki)',
    primNone:'No points in the primary attribute – it does little for this bar.', core:'Fun core', primLbl:'Primary attribute', discount:'discount',
    foot1:'Skill data:', foot2:'Descriptions from the Guild Wars Wiki (GFDL) / GuildWiki (CC BY-NC-SA 2.5). Guild Wars is a trademark of ArenaNet/NCSOFT. Unofficial non-commercial fan tool.'},
};
// Community-Jargon, in beiden Sprachen gleich (Waffen heißen wie im jeweiligen Spielclient)
const ROLES = {dmg:{de:'Damage',en:'Damage'}, heal:{de:'Healer',en:'Healer'}, prot:{de:'Prot',en:'Prot'},
  support:{de:'Support',en:'Support'}, tank:{de:'Tank',en:'Tank'}, duel:{de:'Duelist',en:'Duelist'}};
const WEAP = {caster:{de:'Caster',en:'Caster'}, axe:{de:'Axt',en:'Axe'}, sword:{de:'Schwert',en:'Sword'}, hammer:{de:'Hammer',en:'Hammer'},
  dagger:{de:'Dolche',en:'Daggers'}, scythe:{de:'Sense',en:'Scythe'}, spear:{de:'Speer',en:'Spear'}, bow:{de:'Bogen',en:'Bow'}};
const WL = {de:['','Meta-nah','Bewährt','Solide mit Twist','Frisch','Ungewöhnlich','Eigenwillig','Schräg','Sehr schräg','Wild','Völlig irre, aber spielbar'],
  en:['','Close to meta','Proven','Solid with a twist','Fresh','Unusual','Quirky','Odd','Very odd','Wild','Utterly bonkers – but viable']};

const PRIM = {
  1: r => ({de:`+${r} % Rüstungsdurchdringung für alle Angriffsfertigkeiten.`, en:`+${r}% armor penetration for all attack skills.`}),
  2: r => ({de:`Angriffe, Rituale, Berührungs- und Waldläufer-Fertigkeiten kosten ${4*r} % weniger Energie.`, en:`Attacks, rituals, touch and Ranger skills cost ${4*r}% less energy.`}),
  3: r => ({de:`Mönchszauber auf Verbündete heilen zusätzlich ${Math.floor(3.2*r)} LP.`, en:`Monk spells on allies heal an extra ${Math.floor(3.2*r)} Health.`}),
  4: r => ({de:`+${r} Energie, wenn in der Nähe eine Nicht-Geist-Kreatur stirbt (max. 3× pro 15 s).`, en:`+${r} energy when a non-spirit creature dies nearby (max 3× per 15 s).`}),
  5: r => ({de:`Mesmer-Zauber und -Siegel wirken ${Math.round((1-Math.pow(0.955,r))*100)} % schneller, fremde Zauber erst ab 2 s Wirkzeit. PvE: Mesmer-Zauber laden ${3*r} % schneller.`, en:`Mesmer spells and signets cast ${Math.round((1-Math.pow(0.955,r))*100)}% faster, other spells only from 2 s cast time. PvE: Mesmer spells recharge ${3*r}% faster.`}),
  6: r => ({de:`+${3*r} maximale Energie.`, en:`+${3*r} maximum energy.`}),
  7: r => ({de:`+${r} % Kritchance, ${r>=18?4:r>=13?3:r>=8?2:r>=3?1:0} Energie pro kritischem Treffer.`, en:`+${r}% critical chance, ${r>=18?4:r>=13?3:r>=8?2:r>=3?1:0} energy per critical hit.`}),
  8: r => ({de:`Geister und Diener haben ${4*r} % mehr LP, Waffenzauber halten ${4*r} % länger.`, en:`Spirits and minions have ${4*r}% more Health, weapon spells last ${4*r}% longer.`}),
  9: r => ({de:`2 Energie pro Verbündetem, den deine Schreie/Anfeuerungen treffen (max. ${Math.floor(r/2)}).`, en:`2 energy per ally affected by your shouts/chants (max ${Math.floor(r/2)}).`}),
  10: r => ({de:`Derwisch-Verzauberungen kosten ${4*r} % weniger Energie. PvE: +${r} Rüstung, solange du verzaubert bist.`, en:`Dervish enchantments cost ${4*r}% less energy. PvE: +${r} armor while enchanted.`}),
};
const IMPORTANT = new Set(['attune','needs_elespells','needs_spells','needs_signets','needs_shoutchant','rm_dench','needs_wpnspell','needs_item','needs_spirit','needs_minion','needs_creature','needs_selfench','adrenal','needs_selfcond','needs_selfkd']);
function discounted(s, b) {
  if (!s.en) return null;
  const r = b.primaryRank || 0;
  if (b.primary === 2 && r && (s.tags.has('attack') || s.tags.has('touch') || s.tags.has('ritual') || s.p === 2)) return Math.round(s.en * (1 - 0.04 * r));
  if (b.primary === 10 && r && s.tags.has('dench')) return Math.round(s.en * (1 - 0.04 * r));
  return null;
}
// ---------- Bewertungen (lokal im Browser, Export als Datei) ----------
const RKEY = 'gw1b_ratings';
let memRatings = [];
function loadR() { try { return JSON.parse(localStorage.getItem(RKEY) || '[]'); } catch (e) { return memRatings; } }
function saveR(list) { memRatings = list; try { localStorage.setItem(RKEY, JSON.stringify(list)); } catch (e) {} }
function ratingRecord(b, rating, reasons, note) {
  return {v: G.TUN.version, ts: new Date().toISOString(), mode: b.mode, weird: b.weird, role: b.role, primary: b.primary, secondary: b.secondary,
    fam: b.fam, code: b.code, core: b.core ? b.core.id : null, motors: (b.motors || []).map(m => m.id), skills: b.bar.map(s => s.n.en),
    attributes: b.attributes, links: (b.links || []).map(l => [l.from.n.en, l.to.n.en, l.kind]), name: b.name, bravery: b.bravery || [], rating, reasons, note: note || ''};
}
function exportR() {
  const list = loadR();
  const blob = new Blob([JSON.stringify({tool: 'gw1-bravery', exported: new Date().toISOString(), tuning: G.TUN.version, ratings: list}, null, 1)], {type: 'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bewertungen-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function motorLine(b) {
  const L = st.lang, parts = [];
  for (const m of b.motors || []) {
    const ls = (b.links || []).filter(l => m.cons ? m.cons.includes(l.kind) : (G.motorHit(m, l.from, b) && G.motorHit(m, l.to, b))).slice(0, 2).map(l => `${l.from.n[L]} → ${l.to.n[L]}`);
    parts.push(`<b>${esc(m.name[L])}</b>${ls.length ? ' – ' + esc(ls.join(' · ')) : ''}`);
  }
  return parts.length ? `<div class="story">${t('motor')}: ${parts.join('<br>')}</div>` : '';
}
function braveLine(b) {
  if (!b.bravery || !b.bravery.length) return '';
  const used = new Set(b.braveUsed || []);
  const names = b.bravery.map(id => { const n = esc((G.BRAVERY.find(r => r.id === id) || {name: {de: id, en: id}}).name[st.lang]); return used.has(id) ? n : `<s title="${esc(t('braveNoEffect'))}">${n}</s>`; });
  return `<div class="brave-line">${ICON('i-flame')}<span><b>${t('braveOff')}:</b> ${names.join(' · ')}</span></div>`;
}
function gearLine(b) {
  const els = b.bar.filter(s => s.tags.has('elem_weapon'));
  if (!els.length) return '';
  const s = els[0], el = [...s.tags].find(x => x.startsWith('elem:')); const x = el ? T[st.lang].gearElem[el.slice(5)] : '?';
  return `<div class="note"><b>${t('gear')}:</b> ${esc(t('gearNote').replace('{x}', x).replace('{s}', '„' + s.n[st.lang] + '“'))}</div>`;
}
const ICON = id => `<svg class="ico"><use href="#${id}"/></svg>`;
function rateBox(idx) {
  const R = T[st.lang].reasons;
  return `<div class="rate" data-i="${idx}"><span class="lbl">${t('rate')}</span>
    <button class="rb" data-rate="1" data-i="${idx}" aria-label="gut">${ICON('i-up')}</button><button class="rb" data-rate="-1" data-i="${idx}" aria-label="schlecht">${ICON('i-down')}</button>
    ${Object.entries(R).map(([k, v]) => `<button class="chip" data-reason="${k}">${esc(v)}</button>`).join('')}
    <input class="rnote" placeholder="${esc(t('notePh'))}" maxlength="200"></div>`;
}
const st = {mode:'pve', scope:1, weird:5, prim:0, role:'', lang:'en', seed:0, brave:0, core:'random', elite:0, heroesIn:null, destiny:false};
let current = null; // {kind:'solo'|'team', data}
// Fundorte/Notizen: gebündeltes Wiki-Wissen (wiki.js) + optional fundorte.js vom Skript (bringt Icons mit)
const SRC = (() => {
  const W = (window.GW_WIKI && window.GW_WIKI.skills) || {}, F = window.GW_SOURCES || {};
  const IC = new Set(((window.GW_WIKI && window.GW_WIKI.ic) || []).map(String));   // Icons im Ordner icons/ neben der HTML
  const HD = (window.GW_WIKI && window.GW_WIKI.ichd) || {};                          // hochauflösend in icons-hd/ (optional)
  const ids = new Set([...Object.keys(W), ...Object.keys(F), ...IC]);
  if (!ids.size) return null;
  const out = {};
  for (const id of ids) {
    const w = W[id] || {}, f = F[id] || {};
    out[id] = {lines: (f.lines && f.lines.length ? f.lines : w.acq) || [], notes: (f.notes && f.notes.length ? f.notes : w.notes) || [], page: f.page || w.u,
      icon: f.icon || (IC.has(id) ? 'icons/' + id + '.jpg' : undefined), hd: HD[id] ? 'icons-hd/' + HD[id] : undefined};
  }
  return out;
})();
const t = k => T[st.lang][k] || k;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pname = p => N.profession[p] ? N.profession[p][st.lang] : '';
const aname = a => a < 0 ? t('noattr') : (N.attribute[a] ? N.attribute[a][st.lang] : String(a));

// ---------- Einstellungen / URL ----------
function readHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('m')) st.mode = h.get('m') === 'pvp' ? 'pvp' : 'pve';
  if (h.get('s')) st.scope = [1,4,6,8].includes(+h.get('s')) ? +h.get('s') : 1;
  if (h.get('w')) st.weird = Math.min(10, Math.max(1, +h.get('w') || 5));
  if (h.get('p')) st.prim = +h.get('p') || 0;
  if (h.get('r')) st.role = h.get('r');
  if (h.get('l') && !(typeof Store !== 'undefined' && Store.d && Store.d.lang)) st.lang = h.get('l') === 'en' ? 'en' : 'de';
  if (h.get('seed')) st.seed = +h.get('seed') >>> 0;
  if (h.get('b')) st.brave = Math.min(3, Math.max(0, +h.get('b') || 0));
  st.elite = +h.get('e') || 0; st.core = st.elite ? 'pick' : st.core;
  st.heroesIn = h.get('h') !== null ? h.get('h').split(',').filter(Boolean) : null;
  st.destiny = h.get('d') === '1';
  st.link = h.get('seed') ? linkSpec(h) : null;   // geteilter/gespeicherter Wurf: Pool und Verbindungen exakt wie beim Absender
  return !!h.get('seed');
}
function writeHash() {
  const h = new URLSearchParams({m:st.mode, s:st.scope, w:st.weird, p:st.prim, r:st.role, l:st.lang, b:st.brave, seed:st.seed});
  if (st.scope === 1 && st.core !== 'random' && st.elite) h.set('e', st.elite);
  if (st.scope !== 1 && st.heroesUsed) h.set('h', st.heroesUsed.join(','));
  if (st.destiny) h.set('d', '1');
  linkParams(h);
  history.replaceState(null, '', '#' + h.toString());
  if (typeof rememberBuild === 'function') rememberBuild('#' + h.toString());
}
function seg(id, val, cb) {
  const el = $('#' + id);
  el.querySelectorAll('button').forEach(b => {
    b.classList.toggle('on', b.dataset.v === String(val));
    b.onclick = () => { if (!b.disabled) cb(b.dataset.v); };
  });
}
function syncControls() {
  seg('mode', st.mode, v => { st.mode = v; if (v === 'pvp') { st.scope = 1; st.role = ''; } syncControls(); });
  seg('scope', st.scope, v => { st.scope = +v; syncControls(); });
  seg('lang', st.lang, v => { st.lang = v; if (typeof relang === 'function') relang(); else { syncControls(); render(); } });
  $('#scope').querySelectorAll('button').forEach(b => b.disabled = st.mode === 'pvp' && b.dataset.v !== '1');
  $('#weird').value = st.weird; $('#wv').textContent = st.weird; $('#wlabel').textContent = WL[st.lang][st.weird];
  const prim = $('#prim'); prim.innerHTML = `<option value="0">${t('random')}</option>` + [1,2,3,4,5,6,7,8,9,10].map(p => `<option value="${p}">${esc(pname(p))}</option>`).join('');
  prim.value = st.prim; prim.disabled = st.mode === 'pvp' && st.scope !== 1;
  if (typeof syncHHE === 'function') syncHHE();
  const role = $('#role'); role.innerHTML = `<option value="">${t('random')}</option>` + ['dmg','heal','prot','support','tank'].map(r => `<option value="${r}">${ROLES[r][st.lang]}</option>`).join('');
  role.value = st.role; $('#rolebox').style.display = (st.mode === 'pvp' || st.scope !== 1) ? 'none' : '';
  document.documentElement.lang = st.lang;
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  $('#srcstate').textContent = SRC ? t('srcLoaded') + ' ✓' + (window.GW_WIKI && GW_WIKI.fetched ? ' · Wiki ' + GW_WIKI.fetched.slice(0, 10) : '') : t('srcNone');
  document.querySelectorAll('#brave input').forEach((c, i) => { c.checked = i < st.brave; });
  $('#bravebox').title = t('braveHint');
  $('#rlabel').textContent = t('ratings'); $('#rexport').textContent = t('exportR'); $('#rclear').textContent = t('clearR'); updateRCount();
}

// ---------- Würfeln ----------
function newSeed() { return (Math.random() * 2 ** 32) >>> 0; }
function roll(keepSeed) {
  if (!keepSeed) { st.seed = newSeed(); st.link = null; }
  const P = pools(), E = st.link ? st.link.e : localEdges(), cores = st.link ? st.link.cores : Store.d.links.cores, rf = st.link ? st.link.rf : Store.d.reforged;
  G.setEdgeConfig(E); st.used = {p: P.p, h: st.scope === 1 ? P.p : P.h, e: E, cores, rf};
  if (st.scope === 1) {
    let b = null;
    for (let k = 0; k < 6 && !b; k++) {
      b = G.genBuild({mode: st.mode, weird: st.weird, primary: st.prim || undefined, role: st.mode === 'pvp' ? 'duel' : (st.role || undefined), seed: st.seed, bravery: st.brave,
        filter: asFilter(P.p), cores, elite: st.core !== 'random' && st.elite ? st.elite : undefined});
      if (!b) st.seed = newSeed();
    }
    // Zu wenige Skills auf dem gewählten Charakter: auf alle deine Charaktere ausweichen (Hinweis im Toast)
    if (!b && !st.link && Store.d.base === 'chars' && st.mode !== 'pvp' && curChar()) {
      for (const fb of [localPool(true)]) {
        for (let k = 0; k < 6 && !b; k++) {
          b = G.genBuild({mode: st.mode, weird: st.weird, primary: st.prim || undefined, role: st.mode === 'pvp' ? 'duel' : (st.role || undefined), seed: st.seed, bravery: st.brave,
            filter: asFilter(fb), cores, elite: st.core !== 'random' && st.elite ? st.elite : undefined});
          if (!b) st.seed = newSeed();
        }
        if (b) { st.used.p = st.used.h = fb; setTimeout(() => toast(t5('poolWide')), 50); break; }
      }
    }
    current = {kind: 'solo', data: b};
    st.destiny = false;
  } else {
    // Helden: aus dem Link (gleicher Wurf) oder aus deiner Auswahl; Schicksal: Würfel wählt alles
    const dest = st.destiny ? rollDestiny(st.seed) : null;
    if (dest) st.scope = dest.size;
    const heroes = dest ? [] : (keepSeed && st.heroesIn) ? st.heroesIn : Store.d.heroes;
    st.heroesUsed = heroes.slice(0, st.scope - 1);
    current = {kind: 'team', data: G.genTeam({size: st.scope, weird: st.weird, seed: st.seed, bravery: st.brave, filter: asFilter(P.h), youFilter: sameSet(P.p, P.h) ? undefined : asFilter(P.p), cores,
      heroes: st.heroesUsed, you: st.prim || undefined, reforged: rf, destiny: dest})};
  }
  st.heroesIn = null;
  if (current.kind === 'team' && current.data.members.some(m => m && m.poolFallback)) setTimeout(() => toast(t5('poolWide')), 50);
  writeHash(); render(true);
}

// ---------- Darstellung ----------
function costLine(s, b) {
  const p = [], dc = b ? discounted(s, b) : null, sm = id => `<svg class="ico" style="width:11px;height:11px"><use href="#${id}"/></svg>`;
  if (s.en) p.push(`<span><i class="dot d-en"></i>${dc !== null && dc !== s.en ? dc : s.en}</span>`);
  if (s.ad) p.push(`<span><i class="dot d-ad"></i>${s.ad}</span>`);
  if (s.sac) p.push(`<span><i class="dot d-sac"></i>${s.sac}%</span>`);
  if (s.up) p.push(`<span><i class="dot d-up"></i>−${Math.abs(s.up)}</span>`);
  if (s.act) p.push(`<span>${sm('i-clock')}${s.act}</span>`);
  if (s.rc) p.push(`<span>${sm('i-rech')}${s.rc}</span>`);
  return p.join('');
}
function fmtDesc(txt, rank) {
  let out = esc(txt).replace(/(\d+(?:\.\d+)?)\.\.\.(\d+(?:\.\d+)?)/g, (m, a, b) => {
    if (rank === null) return `<b>${a}…${b}</b>`;
    const v = +a + (+b - +a) * rank / 15;
    const dec = (a.includes('.') || b.includes('.')) ? 1 : 0;
    return `<b>${dec ? v.toFixed(1) : Math.round(v)}</b>`;
  });
  // deutsche Pluralmarker: "1 Sekunde[n]" / "5 Sekunde[n]"
  out = out.replace(/(<b>)?(\d+(?:[.,]\d+)?)(<\/b>)?\s+([^\s\[<]+)\[([^\]]+)\]/g, (m, o, n, c, w, suf) => `${o||''}${n}${c||''} ${w}${+n.replace(',', '.') === 1 ? '' : suf}`);
  return out.replace(/\[([^\]]*)\]/g, '$1');
}
function initials(name) { return name.replace(/[„“"!]/g, '').split(/\s+/).filter(w => w.length > 2 || /^[A-ZÄÖÜ]/.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join(''); }
function skillTile(s, b, i) {
  const pc = AB[s.p] || 'X', src = SRC && SRC[s.id];
  // Icon aus dem Wiki-Lauf (icons/-Ordner neben der HTML); fehlt die Datei, bleiben die Initialen sichtbar
  // große Kacheln: HD-Icon, falls vorhanden – fehlt die Datei, das normale Icon, sonst die Initialen
  const big = src && (src.hd || src.icon), fb = src && src.hd && src.icon ? src.icon : '';
  const face = `<span class="mono">${esc(initials(s.n[st.lang]))}</span>` + (big ? `<img src="${esc(big)}" alt="" loading="lazy"${fb ? ` data-fb="${esc(fb)}"` : ''} onerror="if(this.dataset.fb){this.src=this.dataset.fb;this.removeAttribute('data-fb')}else{this.remove()}">` : '');
  return `<div class="sk${s.e ? ' elite' : ''}" tabindex="0" style="--kc:var(--${pc});--i:${i + (b._idx || 0) * 2}" data-id="${s.id}" data-b="${b._idx}">
    <div class="tile">${face}<span class="num">${i + 1}</span></div><div class="nm">${esc(s.n[st.lang])}</div><div class="costs">${costLine(s, b)}</div></div>`;
}
function idea(b) {
  const L = st.lang, names = arr => arr.slice(0, 2).map(s => esc(s.n[L])).join(', ') || t('none');
  const f = tag => b.bar.filter(s => tag.some(x => s.tags.has(x)));
  const rows = [];
  if (b.role === 'heal') rows.push([ROLES.heal[L], names(f(['heal_other','heal_party']))]);
  if (b.role === 'prot') rows.push([ROLES.prot[L], names(f(['prot']))]);
  rows.push([t('dmgBy'), names(f(['dmg']))], [t('sustainBy'), names(f(['heal_self','defense']))]);
  const en = f(['energy']); if (en.length) rows.push([t('energyBy'), names(en)]);
  const syn = (b.links || []).filter(l => !['attack','adrenal','needs_attack'].includes(l.kind)).slice(0, 3).map(l => `${esc(l.from.n[L])} ${l.kind === 'edge' ? '↔' : '→'} ${esc(l.to.n[L])}`);
  if (syn.length) rows.push([t('synBy'), syn.join('<br>')]);
  return `<ul class="plan">${rows.map(([k, v]) => `<li><b>${esc(k)}:</b> ${v}</li>`).join('')}</ul>`;
}
function attrBlock(b) {
  const rows = b.attributes.map(([a, r]) => {
    const e = b.effective[a] || r, tag = a === G.PRIMARY_ATTR[b.primary] ? t('primTag') : a === b.weaponAttr ? t('weapTag') : '';
    const pips = Array.from({length: 16}, (_, i) => `<i class="${i < r ? 'on' : i < e ? 'rune' : ''}"></i>`).join('');
    return `<div class="attr"><span class="an">${esc(aname(a))}${tag ? `<i>${tag}</i>` : ''}</span><span class="av">${r}${e !== r ? `<small>(${e})</small>` : ''}</span><div class="pips">${pips}</div></div>`;
  }).join('');
  const prim = b.primaryRank ? PRIM[b.primary](b.primaryRank)[st.lang] : t('primNone');
  return rows + `<div class="note">${b.points}/200 · (x) = ${t('runesShort')}</div><div class="note"><b>${esc(aname(G.PRIMARY_ATTR[b.primary]))}:</b> ${esc(prim)}</div>`;
}
function gearBlock(b) {
  const sets = window.GWGear ? window.GWGear.gearSets(b, st.lang) : [];
  return sets.map(set => `<div class="set"><div class="st">${esc(set.title)}</div><dl>${set.items.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`).join('')
    + gearLine(b);
}
function card(b, idx, team) {
  b._idx = idx;
  const pc = AB[b.primary], sc = AB[b.secondary];
  const soft = G.unmet(b.bar).filter(u => IMPORTANT.has(u.k)).map(u => u.s.n[st.lang]);
  const coreHtml = b.core ? `<div class="story"><b>${t('core')}: ${esc(b.core.name[st.lang])}</b> – ${esc(b.core.idea[st.lang])}${b.core.note ? `<br><span style="color:var(--muted)">${esc(b.core.note[st.lang])}</span>` : ''}</div>` : '';
  if (team) return `<article class="card mrow" style="--pc:var(--${pc});--sc:var(--${sc})">
    <div class="card-h">
      <div>${whoPill(b)}<div class="bname">${esc(b.name || '')}</div>
        <div class="pair"><span class="p1">${esc(pname(b.primary))}</span><span class="sl">/</span><span class="p2">${esc(pname(b.secondary))}</span>
        <span class="sub" style="display:inline-flex;margin-left:10px"><span><b>${ROLES[b.role][st.lang]}</b></span><span>${WEAP[b.fam][st.lang]}</span></span></div></div>
      <div class="acts"><button class="code" data-copy="${esc(b.code)}" title="${t('copy')}">${ICON('i-copy')}<span>${esc(b.code)}</span></button>
        <button class="iconbtn" data-act="reroll" data-i="${idx}" title="${t('reroll')}">${ICON('i-redo')}</button>
        <button class="iconbtn" data-act="rerollkeep" data-i="${idx}" title="${t('rerollKeep')}">${ICON('i-lock')}</button></div>
    </div>
    <div class="bar">${b.bar.map((s, i) => skillTile(s, b, i)).join('')}</div>
    <details class="more"><summary>${t('plan')} · ${t('attrsH')} · ${t('setsH')}</summary>
      ${coreHtml}${pickedLine(b)}${motorLine(b)}${braveLine(b)}
      <div class="info"><section><h4>${t('plan')}</h4>${idea(b)}</section><section><h4>${t('attrsH')}</h4>${attrBlock(b)}</section><section class="gear"><h4>${t('setsH')}</h4>${gearBlock(b)}</section></div>
      ${soft.length ? `<div class="hint">${t('soft')}: ${esc(soft.slice(0, 2).join(', '))}</div>` : ''}${conflictLine(b)}${rateBox(idx)}</details></article>`;
  return `<article class="card" style="--pc:var(--${pc});--sc:var(--${sc})">
    <div class="card-h">
      <div>${whoPill(b)}<div class="bname">${esc(b.name || '')}</div>
        <div class="pair"><span class="p1">${esc(pname(b.primary))}</span><span class="sl">/</span><span class="p2">${esc(pname(b.secondary))}</span></div>
        <div class="sub"><span><b>${ROLES[b.role][st.lang]}</b></span><span>${WEAP[b.fam][st.lang]}</span><span>Weirdness ${b.weird}</span>${b.mode === 'pvp' ? '<span>PvP</span>' : ''}<span class="mult" title="${esc(t2('multT'))}">×${G.braveMult(b).toFixed(2)}</span></div></div>
      <div class="acts">${team ? '' : `<button class="iconbtn" data-log="${idx}" title="${esc(t2('logIt'))}">${ICON('i-scroll')}</button>`}
        <button class="code" data-copy="${esc(b.code)}" title="${t('copy')}">${ICON('i-copy')}<span>${esc(b.code)}</span></button>
        <button class="iconbtn" data-act="reroll" data-i="${idx}" title="${t('reroll')}">${ICON('i-redo')}</button>
        ${team ? `<button class="iconbtn" data-act="rerollkeep" data-i="${idx}" title="${t('rerollKeep')}">${ICON('i-lock')}</button>` : ''}
      </div>
    </div>
    ${coreHtml}${pickedLine(b)}${motorLine(b)}${braveLine(b)}
    <div class="bar">${b.bar.map((s, i) => skillTile(s, b, i)).join('')}</div>
    <div class="info">
      <section><h4>${t('plan')}</h4>${idea(b)}</section>
      <section><h4>${t('attrsH')}</h4>${attrBlock(b)}</section>
      <section class="gear"><h4>${t('setsH')}</h4>${gearBlock(b)}</section>
    </div>
    ${soft.length ? `<div class="hint">${t('soft')}: ${esc(soft.slice(0, 2).join(', '))} ${st.lang === 'de' ? 'hat hier wenig Unterstützung' : 'lacks support here'}</div>` : ''}
    ${conflictLine(b)}
    ${rateBox(idx)}</article>`;
}
// Anti-Synergien (Zustandsmodell, v6): offen zeigen, was sich beißt
function conflictLine(b) {
  const cs = (b.conflicts || []).slice(0, 3);
  if (!cs.length) return '';
  const brave = (b.braveUsed || []).includes('sabotage');
  const head = brave ? (st.lang === 'de' ? 'Selbstsabotage' : 'Self-sabotage') : (st.lang === 'de' ? 'Reibung' : 'Friction');
  return `<div class="conflict${brave ? ' brave' : ''}"><b>${head}:</b> ` + cs.map(c =>
    `${esc(c.s.n[st.lang])} ↔ ${esc(c.with.slice(0, 3).map(x => x.n[st.lang]).join(', '))}${c.with.length > 3 ? ' …' : ''} – ${esc(c.txt[st.lang])}`).join('<br>') + '</div>';
}
function render(fresh) {
  const out = $('#out');
  if (!current) { out.innerHTML = ''; return; }
  out.classList.toggle('fresh', !!fresh); if (fresh) { void out.offsetWidth; }
  syncControls();
  if (current.kind === 'solo') {
    out.innerHTML = current.data ? `<div class="builds">${card(current.data, 0, false)}</div>` : `<div class="card"><p>${esc(t2('noBuild'))}</p><button class="tool" data-dlg="dlg-skills">${ICON('i-book')}${esc(t2('skillsT'))}</button></div>`;
  } else {
    const tm = current.data, miss = G.teamCheck(tm);
    out.innerHTML = destinyBanner(tm) + heroWarn(tm) + `<div class="banner">${tm.name ? `<span class="pill tname">${esc(tm.name)}</span>` : ''}${tm.theme ? `<span class="pill">${t('theme')}: ${esc(tm.theme.name[st.lang])}</span>` : ''}${miss.length ? `<span class="warn">${t('missing')}: ${miss.map(m => t(m)).join(', ')}</span>` : ''}<button class="tool" data-log="team">${ICON('i-scroll')}${esc(t2('logTeam'))} <span class="mult">×${G.braveMult(tm).toFixed(2)}</span></button></div>` +
      `<div class="builds team">${tm.members.map((m, i) => card(m, i, true)).join('')}</div>`;
  }
  if (typeof renderBuildbar === 'function') renderBuildbar();
}

// ---------- Tooltip ----------
const tip = $('#tip');
function buildOf(el) { return current.kind === 'solo' ? current.data : current.data.members[+el.dataset.b]; }
function showTip(el) {
  const b = buildOf(el); const s = b.bar.find(x => x.id === +el.dataset.id); if (!s) return;
  const L = st.lang;
  const titled = s.a >= 900;
  const rank = s.a < 0 || titled ? null : (b.effective[s.a] ?? 0);
  const type = N.type[s.t] ? N.type[s.t][L] : '';
  const c = [];
  const dc = discounted(s, b);
  if (s.en) c.push(dc !== null && dc !== s.en ? `${t('energy')} ${s.en} → ${dc}` : `${t('energy')} ${s.en}`); if (s.ad) c.push(`${t('adrenaline')} ${s.ad}`); if (s.sac) c.push(`${t('sacrifice')} ${s.sac}%`);
  if (s.up) c.push(`${t('upkeep')} -${Math.abs(s.up)}`); if (s.oc) c.push(`${t('overcast')} ${s.oc}`);
  if (s.act) c.push(`${t('activation')} ${s.act}s`); if (s.rc) c.push(`${t('recharge')} ${s.rc}s`);
  const src = SRC && SRC[s.id];
  const srcHtml = src && src.lines && src.lines.length
    ? `<b>${t('where')}:</b><br>${src.lines.slice(0, 8).map(l => (/^ /.test(l) ? '&nbsp;&nbsp;· ' : '') + esc(l.trim())).join('<br>')}`
    : esc(t('srcMissing'));
  const notesHtml = src && src.notes && src.notes.length ? `<div class="ts"><b>${t('wikiNotes')}:</b><br>${src.notes.slice(0, 5).map(l => (/^ /.test(l) ? '&nbsp;&nbsp;· ' : '') + esc(l.trim())).join('<br>')}</div>` : '';
  const W = window.GW_WIKI && GW_WIKI.skills[s.id];
  const flagHtml = W && W.fl ? `<div class="ts warn">${W.fl.map(f => t(f === 'bug' ? 'wikiBug' : 'wikiAnomaly')).join('<br>')}</div>` : '';
  const heroHtml = W && W.hero && current.kind === 'team' ? `<div class="ts"><b>${t('heroUse')}:</b><br>${W.hero.slice(0, 2).map(esc).join('<br>')}</div>` : '';
  tip.innerHTML = `<h5>${esc(s.n[L])}</h5>
    <div class="tm">${esc(pname(s.p) || '')}${s.p ? ' · ' : ''}${esc(titled ? (N.attribute[s.a] ? N.attribute[s.a][L] : '') : aname(s.a))}${rank !== null ? ` (${t('rank')} ${rank})` : ''} · ${esc(type)}${s.isPvpVersion ? ' · ' + t('pvp') : ''}${s.rp ? ' · ' + t('pveonly') : ''}</div>
    <div class="tc">${c.map(x => `<span>${esc(x)}</span>`).join('')}</div>
    <div class="td">${fmtDesc(s.d[L], rank)}</div>
    <div class="ts">${srcHtml}</div>${flagHtml}${notesHtml}${heroHtml}`;
  tip.style.display = 'block';
  const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  let x = r.left + r.width / 2 - w / 2, y = r.bottom + 8;
  if (y + h > innerHeight - 8) y = r.top - h - 8;
  x = Math.max(8, Math.min(x, innerWidth - w - 8)); y = Math.max(8, y);
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
function hideTip() { tip.style.display = 'none'; }
document.addEventListener('mouseover', e => { const el = e.target.closest('.sk'); if (el) showTip(el); });
document.addEventListener('mouseout', e => { if (e.target.closest('.sk') && !e.relatedTarget?.closest?.('.sk')) hideTip(); });
document.addEventListener('focusin', e => { const el = e.target.closest('.sk'); if (el) showTip(el); });
document.addEventListener('focusout', hideTip);
addEventListener('scroll', hideTip, {passive: true});

// ---------- Aktionen ----------
function toast(msg) { const el = $('#toast'); el.textContent = msg; el.style.display = 'block'; clearTimeout(toast._t); toast._t = setTimeout(() => el.style.display = 'none', Math.max(1400, String(msg).length * 45)); }
function copy(txt, msg) {
  (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast(msg)).catch(() => {
    const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast(msg); } catch (e) {} ta.remove(); });
}
function buildAt(i) { return current.kind === 'solo' ? current.data : current.data.members[i]; }
function updateRCount() { const n = loadR().length; $('#rcount').textContent = n; $('#rbox').style.display = n ? '' : 'none'; }
document.addEventListener('click', e => {
  const chip = e.target.closest('.chip'); if (chip) { chip.classList.toggle('on'); return; }
  const rb = e.target.closest('[data-rate]');
  if (rb) {
    const box = rb.closest('.rate'), i = +rb.dataset.i, b = buildAt(i);
    const reasons = [...box.querySelectorAll('.chip.on')].map(c => c.dataset.reason);
    const list = loadR(); list.push(ratingRecord(b, +rb.dataset.rate, reasons, box.querySelector('.rnote').value.trim())); saveR(list);
    box.querySelectorAll('.rb').forEach(x => x.classList.toggle('on', x === rb));
    toast(+rb.dataset.rate > 0 ? t('ratedUp') : t('ratedDown')); updateRCount(); return;
  }
  if (e.target.closest('#rexport')) { exportR(); return; }
  if (e.target.closest('#rclear')) { if (confirm(t('confirmClear'))) { saveR([]); updateRCount(); } return; }
  const cp = e.target.closest('[data-copy]'); if (cp) { copy(cp.dataset.copy, t('copy')); return; }
  const a = e.target.closest('[data-act]'); if (!a) return;
  const i = +a.dataset.i;
  if (current.kind === 'solo') { roll(false); return; }
  G.rerollMember(current.data, i, a.dataset.act === 'rerollkeep'); G.nameTeam && G.nameTeam(current.data); render();
});
$('#share').onclick = () => copy(location.href, t('linkcopied'));
$('#weird').oninput = e => { st.weird = +e.target.value; $('#wv').textContent = st.weird; $('#wlabel').textContent = WL[st.lang][st.weird]; };
$('#prim').onchange = e => { st.prim = +e.target.value; };
$('#role').onchange = e => { st.role = e.target.value; };
// Full Bravery: Haken zählen (Reihenfolge egal, 0–3)
document.querySelectorAll('#brave input').forEach(c => c.onchange = () => {
  st.brave = [...document.querySelectorAll('#brave input')].filter(x => x.checked).length;
  document.querySelectorAll('#brave input').forEach((x, i) => { x.checked = i < st.brave; });
});
document.addEventListener('keydown', e => { if (e.key === ' ' && e.target === document.body && !$('#v-build').hidden && !document.querySelector('dialog[open]')) { e.preventDefault(); $('#go').click(); } });

// ================= Heroes Handbook Edition: Speicher, Skill-Basis, Logbuch, Verbindungen, Backup =================
const TX2 = {
  de: {skillsT: 'Skill-Basis', skillsAll: 'alle', skillsMine: 'meine', logT: 'Logbuch', linksT: 'Verbindungen', backupT: 'Backup', pts: 'Punkte',
    entries: 'Einträge', custom: 'eigene', adjusted: 'angepasst', camps: 'Kampagnen', noBuild: 'Mit deiner Skill-Basis ließ sich keine Leiste bauen. Lockere die Auswahl (mehr Skills oder Kampagnen) oder nimm eine andere Primärprofession.',
    logIt: 'Ins Logbuch eintragen', logTeam: 'Team ins Logbuch', multT: 'Punkte-Multiplikator: Weirdness × wirksame Bravery-Regeln',
    baseH: 'Welche Skills darf der Generator nehmen?', baseAll: 'Alle Skills', baseMine: 'Nur meine freigeschalteten', campH: 'Kampagnen',
    campNote: 'Skills außerhalb der gewählten Kampagnen bleiben draußen (PvE-Titelskills zählen zu ihrer Kampagne).', gridH: 'Freigeschaltet je Profession und Kampagne',
    gridNote: 'Klick auf ein Feld schaltet alle Skills darin an oder aus, Klick auf Zeilen- oder Spaltennamen die ganze Reihe. Elite-Skills erbeutest du im Spiel mit dem Siegel der Eroberung.',
    listH: 'Einzelne Skills', search: 'Skill suchen …', anyProf: 'alle Professionen', anyCamp: 'alle Kampagnen', visOn: 'Sichtbare an', visOff: 'Sichtbare aus',
    unlocked: 'freigeschaltet', common: 'Allgemein', applies: 'Gilt ab dem nächsten Wurf.', shown: 'angezeigt',
    newEntry: 'Neuer Eintrag', target: 'Mission oder Gebiet', kind: 'Art', nm: 'Mission NM', hm: 'Mission HM', vq: 'Vanquish (HM)', result: 'Ergebnis', ok: 'geschafft', fail: 'gescheitert',
    note: 'Notiz (optional)', save: 'Speichern', points: 'Punkte', formula: 'Basis (NM 10 · HM 20 · Vanquish 40) × Weirdness-Faktor × (1 + 0,25 je wirksamer Bravery-Regel). Gescheitert = 0.',
    date: 'Datum', build: 'Build', load: 'laden', del: 'löschen', csv: 'CSV exportieren', none: 'Noch keine Einträge. Trag einen Build über das Logbuch-Symbol auf der Karte ein.',
    total: 'Punkte gesamt', doneNM: 'NM geschafft', doneHM: 'HM geschafft', doneVQ: 'Vanquishes', targets: 'Ziele', saved: 'Eingetragen', vqNote: 'Vanquishen geht nur im Hard Mode.',
    listSrc: 'Vorschläge: deine bisherigen Ziele', listSrcW: 'Vorschläge: Missionen und Gebiete aus dem Wiki (englische Namen) + deine bisherigen Ziele', confirmDel: 'Eintrag löschen?',
    linksH: 'Mitgelieferte Verbindungen', core: 'Basis-Kanten (aus den Spaß-Kernen)', pvx: 'Gemessene PvX-Paare', cores: 'Feste Spaß-Kerne auf Weirdness 9–10',
    linksNote: 'Abschalten löscht nichts – wieder einschalten stellt alles her.', customH: 'Eigene Verbindungen', skA: 'Skill A', skB: 'Skill B', strength: 'Stärke',
    weak: 'leicht', mid: 'mittel', strong: 'stark', add: 'Hinzufügen', unknown: 'Unbekannter Skill', customNote: 'Eigene Verbindungen wirken wie feste Synergien: Der Generator nimmt beide Skills bevorzugt zusammen.',
    backupH: 'Speicher', storeOk: 'Alles wird in diesem Browser gespeichert: Skill-Basis, Logbuch, Verbindungen und Bewertungen.', storeNo: 'Dieser Browser erlaubt gerade keinen Speicher (z. B. privates Fenster). Nutze das Backup.',
    backupNote: 'Für Sicherung und Umzug auf ein anderes Gerät: Backup-Datei speichern und dort laden.', bSave: 'Backup speichern', bLoad: 'Backup laden',
    bConfirm: 'Backup laden und den aktuellen Stand ersetzen?', bBad: 'Das ist keine Backup-Datei dieses Tools.', bDone: 'Backup geladen'},
  en: {skillsT: 'Skill base', skillsAll: 'all', skillsMine: 'mine', logT: 'Logbook', linksT: 'Connections', backupT: 'Backup', pts: 'points',
    entries: 'entries', custom: 'custom', adjusted: 'adjusted', camps: 'campaigns', noBuild: 'No bar could be built from your skill base. Widen the selection (more skills or campaigns) or pick another primary profession.',
    logIt: 'Add to logbook', logTeam: 'Log this team', multT: 'Point multiplier: weirdness × effective bravery rules',
    baseH: 'Which skills may the generator use?', baseAll: 'All skills', baseMine: 'Only my unlocked skills', campH: 'Campaigns',
    campNote: 'Skills outside the chosen campaigns stay out (PvE title skills count towards their campaign).', gridH: 'Unlocked per profession and campaign',
    gridNote: 'Click a cell to switch all its skills on or off, click a row or column name for the whole line. Elite skills are captured in game with a Signet of Capture.',
    listH: 'Single skills', search: 'Search skill …', anyProf: 'all professions', anyCamp: 'all campaigns', visOn: 'Visible on', visOff: 'Visible off',
    unlocked: 'unlocked', common: 'Common', applies: 'Applies from the next roll.', shown: 'shown',
    newEntry: 'New entry', target: 'Mission or area', kind: 'Type', nm: 'Mission NM', hm: 'Mission HM', vq: 'Vanquish (HM)', result: 'Result', ok: 'done', fail: 'failed',
    note: 'Note (optional)', save: 'Save', points: 'points', formula: 'Base (NM 10 · HM 20 · vanquish 40) × weirdness factor × (1 + 0.25 per effective bravery rule). Failed = 0.',
    date: 'Date', build: 'Build', load: 'load', del: 'delete', csv: 'Export CSV', none: 'No entries yet. Log a build with the logbook icon on its card.',
    total: 'Total points', doneNM: 'NM done', doneHM: 'HM done', doneVQ: 'Vanquishes', targets: 'Targets', saved: 'Logged', vqNote: 'Vanquishing is only possible in hard mode.',
    listSrc: 'Suggestions: your previous targets', listSrcW: 'Suggestions: missions and areas from the wiki + your previous targets', confirmDel: 'Delete entry?',
    linksH: 'Built-in connections', core: 'Base edges (from the fun cores)', pvx: 'Measured PvX pairs', cores: 'Fixed fun cores at weirdness 9–10',
    linksNote: 'Switching off deletes nothing – switching on restores everything.', customH: 'Your own connections', skA: 'Skill A', skB: 'Skill B', strength: 'Strength',
    weak: 'light', mid: 'medium', strong: 'strong', add: 'Add', unknown: 'Unknown skill', customNote: 'Your connections act like fixed synergies: the generator prefers both skills together.',
    backupH: 'Storage', storeOk: 'Everything is stored in this browser: skill base, logbook, connections and ratings.', storeNo: 'This browser does not allow storage right now (e.g. private window). Use the backup.',
    backupNote: 'To back up or move to another device: save a backup file and load it there.', bSave: 'Save backup', bLoad: 'Load backup',
    bConfirm: 'Load the backup and replace the current state?', bBad: 'This is not a backup file of this tool.', bDone: 'Backup loaded'},
};
const t2 = k => TX2[st.lang][k] || TX2.de[k] || k;
const VB = G.view('pve');
const CAMPS = [0, 1, 2, 3, 4], PROFS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0];
const cname = c => (N.campaign[c] || {})[st.lang] || String(c);
const SKEY = 'gw1ub_store_v1';
const Store = {
  d: null, ok: true,
  def: () => ({v: 1, base: 'all', unlocked: [], camps: CAMPS.slice(), log: [], links: {core: true, pvx: true, cores: true, custom: []}}),
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (e) { this.ok = false; }
    this.d = Object.assign(this.def(), d || {});
    this.d.links = Object.assign(this.def().links, (d && d.links) || {});
  },
  save() { try { localStorage.setItem(SKEY, JSON.stringify(this.d)); this.ok = true; } catch (e) { this.ok = false; } refreshTools(); },
};
Store.load();
// ---------- Skill-Pool ----------
// Lokal: Skill-Basis (alle / meine / meine Charaktere) + Kampagnen. Aus einem Link: exakt der Pool des Absenders,
// damit ein geteilter Link überall denselben Build zeigt – egal, was der Empfänger eingestellt hat.
const CHAR_OK = c => c && c.on !== false && !c.pre;
function charsOn() { return (Store.d.chars || []).filter(CHAR_OK); }
function charUnion() { const u = new Set(); for (const c of charsOn()) for (const i of c.s) u.add(i); return u; }
function curChar() { return typeof flow !== 'undefined' && flow.char ? charsOn().find(c => c.n === flow.char) || null : null; }
function localPool(forHeroes) {
  const d = Store.d, camps = new Set(d.camps);
  let ids = null;
  if (d.base === 'mine') ids = new Set(d.unlocked);
  else if (d.base === 'chars' && charsOn().length) { const c = !forHeroes && st.mode !== 'pvp' ? curChar() : null; ids = c ? new Set(c.s) : charUnion(); }
  if (camps.size >= CAMPS.length && !ids) return null;
  return new Set(VB.skills.filter(s => camps.has(s.c) && (!ids || ids.has(s.id))).map(s => s.id));
}
function pools() { return st.link ? {p: st.link.p, h: st.link.h} : {p: localPool(false), h: localPool(true)}; }
const asFilter = set => set ? (s => set.has(s.id)) : undefined;
const sameSet = (a, b) => a === b || (!!a && !!b && a.size === b.size && [...a].every(x => b.has(x)));
function poolFilter() { return asFilter(pools().p); }
function localEdges() { return {core: Store.d.links.core, pvx: Store.d.links.pvx, custom: Store.d.links.custom}; }
// Link-Kodierung: Pool als Bitfeld über die Skill-Liste (base64url), Verbindungen als Flags + eigene Kanten (Skill-IDs)
function b64u(bytes) { let s = ''; bytes.forEach(b => s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64u(str) { try { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, c => c.charCodeAt(0)); } catch (e) { return null; } }
function encPool(ids) { const by = new Uint8Array(Math.ceil(VB.skills.length / 8)); VB.skills.forEach((s, i) => { if (ids.has(s.id)) by[i >> 3] |= 1 << (i & 7); }); return b64u(by); }
function decPool(str) { const by = unb64u(str); if (!by) return null; const ids = new Set(); VB.skills.forEach((s, i) => { if ((by[i >> 3] >> (i & 7)) & 1) ids.add(s.id); }); return ids; }
function linkParams(h) {
  const u = st.used; if (!u) return;
  if (u.p || u.h) { h.set('n', VB.skills.length); if (u.p) h.set('f', encPool(u.p)); if (st.scope !== 1 && !sameSet(u.p, u.h)) h.set('fh', u.h ? encPool(u.h) : '*'); }
  const x = (u.e.core === false ? 1 : 0) | (u.e.pvx === false ? 2 : 0) | (u.cores === false ? 4 : 0);
  if (x) h.set('x', x);
  const k = (u.e.custom || []).map(([a, b, w]) => { const A = VB.byName.get(a), B = VB.byName.get(b); return A && B ? A.id + '.' + B.id + '.' + w : ''; }).filter(Boolean);
  if (k.length) h.set('k', k.join('_'));
  if (st.scope !== 1 && u.rf === false) h.set('rf', '0');
}
function linkSpec(h) {
  const okN = !h.get('n') || +h.get('n') === VB.skills.length, p = h.get('f') && okN ? decPool(h.get('f')) : null, fh = h.get('fh');
  const x = +h.get('x') || 0, custom = (h.get('k') || '').split('_').map(t => t.split('.')).filter(t => t.length === 3)
    .map(([a, b, w]) => [VB.byId.get(+a), VB.byId.get(+b), +w]).filter(t => t[0] && t[1]).map(([A, B, w]) => [A.n.en, B.n.en, w]);
  return {p, h: fh === '*' ? null : fh && okN ? decPool(fh) : p, e: {core: !(x & 1), pvx: !(x & 2), custom}, cores: !(x & 4), rf: h.get('rf') !== '0'};
}
function applyLinks() { G.setEdgeConfig({core: Store.d.links.core, pvx: Store.d.links.pvx, custom: Store.d.links.custom}); }
applyLinks();
function refreshTools() {
  const d = Store.d, pts = d.log.reduce((s, e) => s + (e.pts || 0), 0);
  const campTxt = d.camps.length < CAMPS.length ? ` · ${d.camps.length} ${t2('camps')}` : '';
  $('#t-skills').innerHTML = `${esc(t2('skillsT'))}: <b>${d.base === 'mine' ? esc(t2('skillsMine')) + ' (' + d.unlocked.length + ')' : esc(t2('skillsAll'))}</b>${esc(campTxt)}`;
  $('#t-log').innerHTML = `${esc(t2('logT'))} · ${d.log.length} · <b>${pts}</b> ${esc(t2('pts'))}`;
  const adj = !d.links.core || !d.links.pvx || !d.links.cores;
  $('#t-links').innerHTML = `${esc(t2('linksT'))}${d.links.custom.length ? ` · ${d.links.custom.length} ${esc(t2('custom'))}` : ''}${adj ? ' · ' + esc(t2('adjusted')) : ''}`;
  $('#t-backup').textContent = t2('backupT');
  if (typeof syncHHE === 'function' && document.querySelector('#t-heroes')) syncHHE();
}
const RENDER = {};
function openDlg(id, arg) { const d = $('#' + id); RENDER[id](arg); if (!d.open) d.showModal(); }

// ---------- Skill-Basis ----------
let skQ = '', skP = -1, skC = -1;
RENDER['dlg-skills'] = () => {
  $('#ds-title').textContent = t2('skillsT');
  const d = Store.d, mine = new Set(d.unlocked), all = VB.skills;
  const ids = (p, c) => all.filter(s => (p < 0 || (s.p || 0) === p) && (c < 0 || s.c === c)).map(s => s.id);
  const cell = (p, c) => { const xs = ids(p, c), on = xs.filter(i => mine.has(i)).length;
    return `<button class="cell ${xs.length && on === xs.length ? 'full' : on ? 'part' : ''}" data-cell="${p}:${c}" ${xs.length ? '' : 'disabled'}>${on}/${xs.length}</button>`; };
  let list = all.filter(s => (skP < 0 || (s.p || 0) === skP) && (skC < 0 || s.c === skC));
  if (skQ) list = list.filter(s => s.n.en.toLowerCase().includes(skQ) || s.n.de.toLowerCase().includes(skQ));
  list.sort((a, b) => a.n[st.lang].localeCompare(b.n[st.lang]));
  $('#ds-body').innerHTML = `<h3>${esc(t2('baseH'))}</h3>
    <div class="seg" id="ds-base"><button data-base="all" class="${d.base === 'all' ? 'on' : ''}">${esc(t2('baseAll'))}</button><button data-base="mine" class="${d.base === 'mine' ? 'on' : ''}">${esc(t2('baseMine'))} (${d.unlocked.length}/${all.length})</button>${(d.chars || []).length ? `<button data-base="chars" class="${d.base === 'chars' ? 'on' : ''}">${esc(t5('swMine'))}</button>` : ''}</div>
    <h3>${esc(t2('campH'))}</h3><div class="row">${CAMPS.map(c => `<label class="tg2"><input type="checkbox" data-camp="${c}" ${d.camps.includes(c) ? 'checked' : ''}> ${esc(cname(c))}</label>`).join('')}</div>
    <p>${esc(t2('campNote'))} ${esc(t2('applies'))}</p>
    <h3>${esc(t2('gridH'))}</h3>
    <div style="overflow-x:auto"><table class="grid"><thead><tr><th></th>${CAMPS.map(c => `<th><button class="hb" data-colc="${c}">${esc(cname(c))}</button></th>`).join('')}<th>Σ</th></tr></thead>
    <tbody>${PROFS.map(p => `<tr><td><button class="hb" data-rowp="${p}">${esc(p ? pname(p) : t2('common'))}</button></td>${CAMPS.map(c => `<td>${cell(p, c)}</td>`).join('')}<td>${cell(p, -1)}</td></tr>`).join('')}</tbody></table></div>
    <p>${esc(t2('gridNote'))}</p>
    <h3>${esc(t2('listH'))}</h3>
    <div class="row"><input class="inp" id="ds-q" placeholder="${esc(t2('search'))}" value="${esc(skQ)}" style="flex:1 1 200px">
      <select class="inp" id="ds-p"><option value="-1">${esc(t2('anyProf'))}</option>${PROFS.map(p => `<option value="${p}" ${skP === p ? 'selected' : ''}>${esc(p ? pname(p) : t2('common'))}</option>`).join('')}</select>
      <select class="inp" id="ds-c"><option value="-1">${esc(t2('anyCamp'))}</option>${CAMPS.map(c => `<option value="${c}" ${skC === c ? 'selected' : ''}>${esc(cname(c))}</option>`).join('')}</select>
      <button class="btn sec" data-vis="1">${esc(t2('visOn'))}</button><button class="btn sec" data-vis="0">${esc(t2('visOff'))}</button></div>
    <div class="sklist" style="margin-top:8px">${list.slice(0, 250).map(s => `<label><input type="checkbox" data-sk="${s.id}" ${mine.has(s.id) ? 'checked' : ''}> ${esc(s.n[st.lang])}${s.e ? ' ★' : ''}<span class="m">${esc(AB[s.p] || '–')} · ${esc(cname(s.c))}</span></label>`).join('')}</div>
    <p>${list.length} · ${Math.min(list.length, 250)} ${esc(t2('shown'))} · ${d.unlocked.length} ${esc(t2('unlocked'))}</p>`;
};
function setUnlocked(idsArr, on) { const m = new Set(Store.d.unlocked); idsArr.forEach(i => on ? m.add(i) : m.delete(i)); Store.d.unlocked = [...m]; Store.save(); }
$('#dlg-skills').addEventListener('click', e => {
  const b = e.target.closest('[data-base]'); if (b) { Store.d.base = b.dataset.base; Store.save(); RENDER['dlg-skills'](); return; }
  const cl = e.target.closest('[data-cell],[data-rowp],[data-colc]');
  if (cl) {
    const [p, c] = cl.dataset.cell ? cl.dataset.cell.split(':').map(Number) : cl.dataset.rowp !== undefined ? [+cl.dataset.rowp, -1] : [-1, +cl.dataset.colc];
    const xs = VB.skills.filter(s => (p < 0 || (s.p || 0) === p) && (c < 0 || s.c === c)).map(s => s.id), m = new Set(Store.d.unlocked);
    setUnlocked(xs, !xs.every(i => m.has(i))); RENDER['dlg-skills'](); return;
  }
  const v = e.target.closest('[data-vis]');
  if (v) { const xs = [...$('#ds-body').querySelectorAll('[data-sk]')].map(x => +x.dataset.sk); setUnlocked(xs, v.dataset.vis === '1'); RENDER['dlg-skills'](); }
});
$('#dlg-skills').addEventListener('change', e => {
  if (e.target.dataset.sk) { setUnlocked([+e.target.dataset.sk], e.target.checked); refreshTools(); return; }
  if (e.target.dataset.camp !== undefined) {
    const c = +e.target.dataset.camp, s = new Set(Store.d.camps); e.target.checked ? s.add(c) : s.delete(c);
    if (!s.size) { e.target.checked = true; return; }
    Store.d.camps = CAMPS.filter(x => s.has(x)); Store.save(); return;
  }
  if (e.target.id === 'ds-p') { skP = +e.target.value; RENDER['dlg-skills'](); }
  if (e.target.id === 'ds-c') { skC = +e.target.value; RENDER['dlg-skills'](); }
});
$('#dlg-skills').addEventListener('input', e => { if (e.target.id === 'ds-q') { skQ = e.target.value.trim().toLowerCase(); const pos = e.target.selectionStart; RENDER['dlg-skills'](); const q = $('#ds-q'); q.focus(); q.setSelectionRange(pos, pos); } });

// ---------- Logbuch ----------
let logCtx = null, logKind = 'nm', logOk = true;
function snapshot(ctx) {
  if (!current) return null;
  if (ctx.team && current.kind === 'team') {
    const tm = current.data;
    return {team: true, name: tm.name || ('Team ' + tm.size + (tm.theme ? ' · ' + tm.theme.name[st.lang] : '')), size: tm.size, mult: G.braveMult(tm), weird: tm.weird, hash: location.hash,
      destiny: tm.destiny ? {kind: tm.destiny.kind, place: tm.destiny.place, region: tm.destiny.region, c: tm.destiny.c} : null,
      members: tm.members.map(m => Object.assign(facts(m), {name: m.name, code: m.code, hero: m.slot && m.slot.kind === 'hero' ? m.slot.hero.id : 'you'})), src: tm};
  }
  const b = ctx.idx !== undefined ? buildAt(ctx.idx) : current.data;
  return b ? Object.assign(facts(b), {team: false, name: b.name, code: b.code, mult: G.braveMult(b), weird: b.weird, brave: (b.braveUsed || []).length, hash: location.hash, src: b}) : null;
}
// Fakten eines Builds fürs Logbuch (Grundlage der Erfolge)
function facts(b) {
  return {p: b.primary, s: b.secondary, role: b.role, fam: b.fam, weird: b.weird, used: (b.braveUsed || []).slice(), motors: (b.motors || []).map(m => m.id),
    picked: b.picked || null, conflicts: (b.conflicts || []).length, elite: (b.bar.find(x => x.e) || {}).id || null, nm: b.name};
}
function orte() {
  const w = (window.GW_WIKI && window.GW_WIKI.orte) || [];
  return [...new Set([...w.map(o => o.n || o), ...Store.d.log.map(e => e.target)])].filter(Boolean).sort();
}
RENDER['dlg-log'] = ctx => {
  if (ctx) { logCtx = snapshot(ctx); logKind = logCtx && logCtx.destiny ? logCtx.destiny.kind : 'nm'; logOk = true; setTimeout(() => { if (logCtx && logCtx.destiny && $('#dl-target')) $('#dl-target').value = logCtx.destiny.place; }, 0); }
  $('#dl-title').textContent = t2('logT');
  const L = Store.d.log, sum = k => L.filter(e => e.ok && e.kind === k).length, total = L.reduce((s, e) => s + (e.pts || 0), 0);
  const prev = logCtx ? G.points(logKind, logCtx.src, logOk) : 0, kinds = ['nm', 'hm', 'vq'];
  const form = logCtx ? `<div class="form"><h3 style="margin-top:0">${esc(t2('newEntry'))}: ${esc(logCtx.name)} <span class="mult">×${logCtx.mult.toFixed(2)}</span></h3>
      <div class="strips" style="margin:0 0 10px">${typeof entryStrips === 'function' ? entryStrips({build: logCtx}) : ''}</div>
      <div class="row"><input class="inp" id="dl-target" list="dl-orte" placeholder="${esc(t2('target'))}" style="flex:1 1 240px"><datalist id="dl-orte">${orte().map(o => `<option value="${esc(o)}">`).join('')}</datalist></div>
      <p class="small" style="font-size:12px;color:var(--muted)">${esc((window.GW_WIKI && window.GW_WIKI.orte) ? t2('listSrcW') : t2('listSrc'))}</p>
      <div class="row" style="margin-top:6px"><span class="lbl">${esc(t2('kind'))}</span><div class="seg">${kinds.map(k => `<button data-kind="${k}" class="${logKind === k ? 'on' : ''}">${esc(t2(k))}</button>`).join('')}</div>
        <span class="lbl" style="margin-left:8px">${esc(t2('result'))}</span><div class="seg"><button data-ok="1" class="${logOk ? 'on' : ''}">${esc(t2('ok'))}</button><button data-ok="0" class="${logOk ? '' : 'on'}">${esc(t2('fail'))}</button></div></div>
      <p style="font-size:12px;color:var(--muted)">${esc(t2('vqNote'))}</p>
      <div class="row" style="margin-top:6px"><input class="inp" id="dl-note" placeholder="${esc(t2('note'))}" maxlength="200" style="flex:1 1 240px">
        <b class="mult" style="font:500 20px var(--serif)">${prev} ${esc(t2('points'))}</b><button class="btn" id="dl-save">${esc(t2('save'))}</button></div>
      <p style="font-size:12px;color:var(--muted)">${esc(t2('formula'))}</p></div>` : '';
  const rows = L.slice().reverse().map(e => `<tr><td class="hide-m">${esc(e.ts.slice(0, 10))}</td><td>${esc(e.target)}</td><td>${esc(t2(e.kind))}</td>
      <td>${esc(e.build.name)}<br><span style="color:var(--muted);font:11px var(--mono)">${esc(e.build.team ? e.build.members.length + '×' : e.build.code || '')}</span></td>
      <td class="${e.ok ? 'ok' : 'no'}">${esc(t2(e.ok ? 'ok' : 'fail'))}</td><td><b>${e.pts}</b></td>
      <td><button class="lnk" data-lload="${e.id}">${esc(t2('load'))}</button> · <button class="lnk" data-ldel="${e.id}">${esc(t2('del'))}</button></td></tr>`).join('');
  $('#dl-body').innerHTML = form + `<div class="kp"><div><b>${total}</b><span>${esc(t2('total'))}</span></div><div><b>${sum('nm')}</b><span>${esc(t2('doneNM'))}</span></div>
      <div><b>${sum('hm')}</b><span>${esc(t2('doneHM'))}</span></div><div><b>${sum('vq')}</b><span>${esc(t2('doneVQ'))}</span></div><div><b>${new Set(L.filter(e => e.ok).map(e => e.target)).size}</b><span>${esc(t2('targets'))}</span></div></div>
    ${L.length ? `<div style="overflow-x:auto"><table class="ltab"><thead><tr><th class="hide-m">${esc(t2('date'))}</th><th>${esc(t2('target'))}</th><th>${esc(t2('kind'))}</th><th>${esc(t2('build'))}</th><th>${esc(t2('result'))}</th><th>${esc(t2('points'))}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <p><button class="btn sec" id="dl-csv">${esc(t2('csv'))}</button></p>` : `<p>${esc(t2('none'))}</p>`}`;
};
function download(name, text, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type})); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
$('#dlg-log').addEventListener('click', e => {
  const k = e.target.closest('[data-kind]'); if (k) { logKind = k.dataset.kind; if (logKind === 'vq') logOk = logOk; keepForm(); return; }
  const o = e.target.closest('[data-ok]'); if (o) { logOk = o.dataset.ok === '1'; keepForm(); return; }
  if (e.target.closest('#dl-save')) {
    const target = $('#dl-target').value.trim(); if (!target) { $('#dl-target').focus(); return; }
    const sn = logCtx, entry = {id: Date.now().toString(36), ts: new Date().toISOString(), target, kind: logKind, ok: logOk, note: $('#dl-note').value.trim(),
      pts: G.points(logKind, sn.src, logOk), mult: sn.mult, build: Object.assign({}, sn, {src: undefined})};
    const before = titleInfo();
    Store.d.log.push(entry); Store.save(); askPersist(); logCtx = null; toast(t2('saved') + ' · ' + entry.pts + ' ' + t2('points')); celebrate(before); RENDER['dlg-log'](); return;
  }
  const ld = e.target.closest('[data-lload]');
  if (ld) { const en = Store.d.log.find(x => x.id === ld.dataset.lload); if (en && en.build.hash) { history.replaceState(null, '', en.build.hash); readHash(); syncControls(); roll(true); $('#dlg-log').close(); } return; }
  const dl = e.target.closest('[data-ldel]');
  if (dl && confirm(t2('confirmDel'))) { Store.d.log = Store.d.log.filter(x => x.id !== dl.dataset.ldel); Store.save(); RENDER['dlg-log'](); return; }
  if (e.target.closest('#dl-csv')) {
    const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const rows = [['date', 'target', 'type', 'result', 'points', 'multiplier', 'build', 'code', 'weirdness', 'note']].concat(Store.d.log.map(x =>
      [x.ts.slice(0, 10), x.target, x.kind, x.ok ? 'done' : 'failed', x.pts, x.mult, x.build.name, x.build.team ? x.build.members.map(m => m.code).join(' ') : x.build.code, x.build.weird, x.note]));
    download('gw1-logbuch-' + new Date().toISOString().slice(0, 10) + '.csv', rows.map(r => r.map(q).join(';')).join('\n'), 'text/csv');
  }
});
function keepForm() { const tv = $('#dl-target') ? $('#dl-target').value : '', nv = $('#dl-note') ? $('#dl-note').value : ''; RENDER['dlg-log'](); $('#dl-target').value = tv; $('#dl-note').value = nv; }

// ---------- Verbindungen ----------
const nameToEn = n => { n = (n || '').trim().toLowerCase(); const s = VB.skills.find(x => x.n.en.toLowerCase() === n || x.n.de.toLowerCase() === n); return s ? s.n.en : null; };
const enToLang = n => { const s = VB.byName.get(n); return s ? s.n[st.lang] : n; };
RENDER['dlg-links'] = () => {
  $('#dk-title').textContent = t2('linksT');
  const k = Store.d.links;
  $('#dk-body').innerHTML = `<h3>${esc(t2('linksH'))}</h3>
    ${['core', 'pvx', 'cores'].map(x => `<label class="tg2"><input type="checkbox" data-lk="${x}" ${k[x] ? 'checked' : ''}> ${esc(t2(x))}</label>`).join('')}
    <p>${esc(t2('linksNote'))}</p>
    <h3>${esc(t2('customH'))}</h3>
    <div class="row"><input class="inp" id="dk-a" list="dk-names" placeholder="${esc(t2('skA'))}" style="flex:1 1 180px"><input class="inp" id="dk-b" list="dk-names" placeholder="${esc(t2('skB'))}" style="flex:1 1 180px">
      <select class="inp" id="dk-w"><option value="1.5">${esc(t2('weak'))}</option><option value="2.5" selected>${esc(t2('mid'))}</option><option value="3">${esc(t2('strong'))}</option></select>
      <button class="btn" id="dk-add">${esc(t2('add'))}</button></div>
    <datalist id="dk-names">${VB.skills.flatMap(s => s.n.de !== s.n.en ? [s.n[st.lang], s.n[st.lang === 'de' ? 'en' : 'de']] : [s.n.en]).map(n => `<option value="${esc(n)}">`).join('')}</datalist>
    <p>${esc(t2('customNote'))}</p>
    ${k.custom.length ? `<table class="ltab"><tbody>${k.custom.map(([a, b, w], i) => `<tr><td>${esc(enToLang(a))} ↔ ${esc(enToLang(b))}</td><td>${esc(t2(w >= 3 ? 'strong' : w >= 2.5 ? 'mid' : 'weak'))}</td><td><button class="lnk" data-kdel="${i}">${esc(t2('del'))}</button></td></tr>`).join('')}</tbody></table>` : ''}`;
};
$('#dlg-links').addEventListener('change', e => { const x = e.target.dataset.lk; if (x) { Store.d.links[x] = e.target.checked; applyLinks(); Store.save(); } });
$('#dlg-links').addEventListener('click', e => {
  if (e.target.closest('#dk-add')) {
    const a = nameToEn($('#dk-a').value), b = nameToEn($('#dk-b').value);
    if (!a || !b || a === b) { toast(t2('unknown')); return; }
    Store.d.links.custom.push([a, b, +$('#dk-w').value]); applyLinks(); Store.save(); RENDER['dlg-links'](); return;
  }
  const d = e.target.closest('[data-kdel]'); if (d) { Store.d.links.custom.splice(+d.dataset.kdel, 1); applyLinks(); Store.save(); RENDER['dlg-links'](); }
});

// ---------- Backup ----------
RENDER['dlg-backup'] = () => {
  $('#db-title').textContent = t2('backupT');
  $('#db-body').innerHTML = `<h3>${esc(t2('backupH'))}</h3><p>${esc(Store.ok ? t2('storeOk') : t2('storeNo'))}</p><p>${esc(t2('backupNote'))}</p>
    <div class="row" style="margin-top:10px"><button class="btn" id="db-save">${esc(t2('bSave'))}</button><button class="btn sec" id="db-load">${esc(t2('bLoad'))}</button></div>`;
};
$('#dlg-backup').addEventListener('click', e => {
  if (e.target.closest('#db-save')) saveBackup();
  if (e.target.closest('#db-load')) $('#bfile').click();
});
$('#bfile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(txt => {
    let j = null; try { j = JSON.parse(txt); } catch (err) {}
    if (!j || j.tool !== 'gw1-bravery' || !j.store) { toast(t2('bBad')); return; }
    if (!confirm(t2('bConfirm'))) return;
    Store.d = Object.assign(Store.def(), j.store); Store.d.links = Object.assign(Store.def().links, j.store.links || {});
    if (Array.isArray(j.ratings)) saveR(j.ratings);
    Store.d.lastBackup = new Date().toISOString(); Store.d.backupLogN = Store.d.log.length;
    applyLinks(); Store.save(); updateRCount(); toast(t2('bDone')); if (typeof route === 'function') route();
  }).finally(() => { e.target.value = ''; });
});

// ================= Beta: echte Helden, Pick your core, Roll your destiny, Titel & Erfolge =================
const TX3 = {
  de: {heroesT: 'Helden', heroesDice: 'Würfel', you: 'Du', rolledHero: 'vom Würfel gewählt', heroesH: 'Deine Helden',
    heroesNote: 'Wähle bis zu 7 Helden in der Reihenfolge, in der sie mitkommen sollen: Beim 4er-Team zählen die ersten 3, beim 6er die ersten 5. Freie Plätze füllt der Würfel – zuerst mit Mönchen oder Ritualisten, damit das Team überlebt. Der Würfel verteilt die Rollen: Heiler und Prot nur Mönch oder Ritualist, Tank nur Krieger, Assassine, Paragon oder Derwisch. Deine eigene Profession stellst du oben bei „Primärprofession“ ein. Helden bekommen keine PvE-only-Skills (laut Wiki nutzen sie nur auf dem Account freigeschaltete Skills) und meiden Skills, die die Helden-KI laut Wiki nicht sinnvoll einsetzt.',
    heroesExcl: 'Je nach Kampagnenfortschritt hast du von Acolyte Jin/Acolyte Sousuke, Margrid the Sly/Master of Whispers und Goren/Norgu zunächst nur einen. Razah kann jede Profession annehmen.',
    heroesShort: 'Reihenfolge zählt. Freie Plätze füllt der Würfel (zuerst Mönche/Ritualisten). Helden bekommen keine PvE-only-Skills.',
    clear: 'Auswahl leeren', reforged: 'Reforged-Helden einbeziehen (Devona, Ghost of Althea)', chosen: 'gewählt',
    noheal: 'Kein Mönch oder Ritualist im Team – niemand kann ernsthaft heilen. Nimm z. B. Dunkoro, Tahlkora, Ogden Stonehealer, Xandra, Zei Ri oder Razah mit, oder spiel selbst Mönch oder Ritualist.',
    noprot: 'Für die Prot-Rolle fehlt ein zweiter Mönch oder Ritualist – der Platz wurde Support.',
    swapped: '{a} ließ sich mit deiner Skill-Basis nicht bauen – {b} springt ein.',
    core: 'Core', coreRandom: 'Zufall', corePick: 'Elite wählen', core3: '1 aus 3', draw3: '3 Elites ziehen', eliteSearch: 'Elite suchen …',
    pickOne: 'Wähle deinen Core', pickNote: 'Klick auf einen Elite – die Leiste wächst um ihn herum.', pickedCore: 'Gewählter Core', unknownElite: 'Unbekannter Elite-Skill',
    destiny: 'Roll your destiny', destinyH: 'Dein Schicksal', teamOf: 'Team aus', provisional: 'Ort und Teamgröße vorläufig auf Regionsebene (UNVERIFIZIERT) – genaue Gebiete kommen mit den Wiki-Daten.',
    inRegion: 'in', anyArea: 'ein Gebiet nach Wahl', anyMission: 'eine Mission nach Wahl', foes: 'Gegner',
    estSize: 'Teamgröße aus der Region geschätzt (UNVERIFIZIERT) – die genaue Gruppengröße kommt mit den Außenposten-Seiten aus dem Wiki.',
    titlesT: 'Titel', titleH: 'Titelspur „Ultimate Bravery“', achH: 'Erfolge', next: 'nächster Rang', maxRank: 'Höchster Rang erreicht',
    unlocked: 'freigeschaltet', newAch: 'Erfolg freigeschaltet', newRank: 'Neuer Rang', noRank: 'ohne Rang'},
  en: {heroesT: 'Heroes', heroesDice: 'dice', you: 'You', rolledHero: 'picked by the dice', heroesH: 'Your heroes',
    heroesNote: 'Pick up to 7 heroes in the order they should join: a team of 4 uses the first 3, a team of 6 the first 5. The dice fills free slots – monks or ritualists first, so the team survives. The dice assigns roles: healer and prot only monk or ritualist, tank only warrior, assassin, paragon or dervish. Set your own profession above under “Primary profession”. Heroes get no PvE-only skills (per the wiki they only use account-unlocked skills) and avoid skills the hero AI does not use well according to the wiki.',
    heroesExcl: 'Depending on your campaign progress you first get only one of Acolyte Jin/Acolyte Sousuke, Margrid the Sly/Master of Whispers and Goren/Norgu. Razah can take any profession.',
    heroesShort: 'Order counts. The dice fill free slots (monks/ritualists first). Heroes never get PvE-only skills.',
    clear: 'Clear selection', reforged: 'Include Reforged heroes (Devona, Ghost of Althea)', chosen: 'picked',
    noheal: 'No monk or ritualist in the team – nobody can really heal. Bring e.g. Dunkoro, Tahlkora, Ogden Stonehealer, Xandra, Zei Ri or Razah, or play a monk or ritualist yourself.',
    noprot: 'A second monk or ritualist for the prot role is missing – that slot became support.',
    swapped: '{a} could not be built from your skill base – {b} steps in.',
    core: 'Core', coreRandom: 'Random', corePick: 'Pick elite', core3: '1 of 3', draw3: 'Draw 3 elites', eliteSearch: 'Search elite …',
    pickOne: 'Pick your core', pickNote: 'Click an elite – the bar grows around it.', pickedCore: 'Picked core', unknownElite: 'Unknown elite skill',
    destiny: 'Roll your destiny', destinyH: 'Your destiny', teamOf: 'Party of', provisional: 'Place and party size provisional at region level (UNVERIFIED) – exact areas come with the wiki data.',
    inRegion: 'in', anyArea: 'an area of your choice', anyMission: 'a mission of your choice', foes: 'foes',
    estSize: 'Party size estimated from the region (UNVERIFIED) – the exact size comes with the outpost pages from the wiki.',
    titlesT: 'Titles', titleH: 'Title track “Ultimate Bravery”', achH: 'Achievements', next: 'next rank', maxRank: 'Highest rank reached',
    unlocked: 'unlocked', newAch: 'Achievement unlocked', newRank: 'New rank', noRank: 'no rank'},
};
const t3 = k => TX3[st.lang][k] || TX3.de[k] || k;
if (!Store.d.heroes) Store.d.heroes = [];
if (Store.d.reforged === undefined) Store.d.reforged = true;
if (!Store.d.ach) Store.d.ach = {};
const HERO = id => G.HERO_BY_ID[id];

// ---------- Karten-Bausteine ----------
function whoPill(b) {
  if (!b.slot) return '';
  const h = b.slot.hero;
  return `<div class="who">${b.slot.kind === 'you' ? `<b>${esc(t3('you'))}</b>` : `<b>${esc(h.n)}</b>${b.slot.rolled ? ` <span class="dice" title="${esc(t3('rolledHero'))}">⚄</span>` : ''}`}</div>`;
}
function pickedLine(b) {
  if (!b.picked) return '';
  const e = b.bar.find(x => x.id === b.picked);
  return e ? `<div class="story"><b>${esc(t3('pickedCore'))}:</b> ${esc(e.n[st.lang])}</div>` : '';
}
function heroWarn(tm) {
  const w = (tm.warn || []).map(x => esc(t3(x)));
  for (const [a, b] of tm.swapped || []) w.push(esc(t3('swapped').replace('{a}', HERO(a) ? HERO(a).n : a).replace('{b}', HERO(b) ? HERO(b).n : b)));
  return w.length ? `<div class="hwarn${(tm.warn || []).includes('noheal') ? ' bad' : ''}">${w.join('<br>')}</div>` : '';
}

// ---------- Roll your destiny ----------
// Vorläufig Regionsebene (UNVERIFIZIERT); sobald GW_WIKI.orte Gebiete mit Gruppengröße enthält, werden diese genutzt.
const REGIONS = [
  {r: 'Ascalon', c: 1, sz: 4, m: 1, vq: 1}, {r: 'Northern Shiverpeaks', c: 1, sz: 6, m: 1, vq: 1}, {r: 'Kryta', c: 1, sz: 6, m: 1, vq: 1},
  {r: 'Maguuma Jungle', c: 1, sz: 6, m: 1, vq: 1}, {r: 'Crystal Desert', c: 1, sz: 6, m: 1, vq: 1}, {r: 'Southern Shiverpeaks', c: 1, sz: 8, m: 1, vq: 1},
  {r: 'Ring of Fire Islands', c: 1, sz: 8, m: 1, vq: 1},
  {r: 'Shing Jea Island', c: 2, sz: 4, m: 1, vq: 1}, {r: 'Kaineng City', c: 2, sz: 6, m: 1, vq: 1}, {r: 'Echovald Forest', c: 2, sz: 8, m: 1, vq: 1}, {r: 'The Jade Sea', c: 2, sz: 8, m: 1, vq: 1},
  {r: 'Istan', c: 3, sz: 4, m: 1, vq: 1}, {r: 'Kourna', c: 3, sz: 6, m: 1, vq: 1}, {r: 'Vabbi', c: 3, sz: 8, m: 1, vq: 1}, {r: 'The Desolation', c: 3, sz: 8, m: 1, vq: 1},
  {r: 'Realm of Torment', c: 3, sz: 8, m: 1, vq: 1},
  {r: 'Far Shiverpeaks', c: 4, sz: 8, m: 0, vq: 1}, {r: 'Charr Homelands', c: 4, sz: 8, m: 0, vq: 1}, {r: 'Tarnished Coast', c: 4, sz: 8, m: 0, vq: 1},
];
function destinyPlaces(kind) {
  const camps = new Set(Store.d.camps);
  const W = (window.GW_WIKI && GW_WIKI.orte || []).filter(o => o.sz && (kind === 'vq' ? o.vq : o.k === 'm') && (o.c === undefined || camps.has(o.c)));
  if (W.length) return W.map(o => ({place: o.n, region: o.r || '', c: o.c, size: Math.min(8, Math.max(4, o.sz)), exact: true, est: !!o.est, kills: o.kills || 0}));
  return REGIONS.filter(x => (kind === 'vq' ? x.vq : x.m) && camps.has(x.c))
    .map(x => ({place: x.r, region: x.r, c: x.c, size: x.sz, exact: false}));
}
function rollDestiny(seed) {
  const rng = G.rngFrom((seed ^ 0x5bd1e995) >>> 0);
  const r = rng(), kind = r < 0.4 ? 'nm' : r < 0.7 ? 'hm' : 'vq';
  let list = destinyPlaces(kind);
  if (!list.length) list = destinyPlaces('nm');
  if (!list.length) return null;
  const pl = list[Math.floor(rng() * list.length)];
  return Object.assign({kind}, pl);
}
function destinyBanner(tm) {
  const d = tm.destiny; if (!d) return '';
  const what = d.exact ? esc(d.place) : `${esc(d.kind === 'vq' ? t3('anyArea') : t3('anyMission'))} ${esc(t3('inRegion'))} <b>${esc(d.region)}</b>`;
  return `<div class="fate"><div class="dk">${esc(t3('destinyH'))}</div>
    <div class="dt"><span class="dkind">${esc(t2(d.kind))}</span> ${what}${d.c !== undefined ? ` <span class="muted">· ${esc(cname(d.c))}</span>` : ''}</div>
    <div class="ds">${d.exact && d.region ? esc(d.region) + ' · ' : ''}${d.kills ? '≈ ' + d.kills + ' ' + esc(t3('foes')) + ' · ' : ''}${esc(t3('teamOf'))} ${tm.size} · ${esc(t3('you'))} + ${tm.size - 1} ${esc(t3('heroesT'))} · Weirdness ${tm.weird} · ×${G.braveMult(tm).toFixed(2)}</div>
    ${!d.exact ? `<div class="dn">${esc(t3('provisional'))}</div>` : d.est ? `<div class="dn">${esc(t3('estSize'))}</div>` : ''}</div>`;
}

// ---------- Helden-Dialog ----------
RENDER['dlg-heroes'] = () => {
  $('#dh-title').textContent = t3('heroesT');
  const sel = Store.d.heroes;
  const cap = st.scope > 1 ? st.scope - 1 : 7;
  const chip = h => { const i = sel.indexOf(h.id); return `<button class="hchip${i >= 0 ? ' on' : ''}${i >= cap ? ' over' : ''}" data-hero="${h.id}" style="--kc:var(--${AB[h.p]})">${i >= 0 ? `<i>${i + 1}</i>` : ''}${esc(h.n)}${h.flex ? ' ✦' : ''}${h.rf ? ' <small>Reforged</small>' : ''}</button>`; };
  $('#dh-body').innerHTML = `<p>${esc(t3('heroesShort'))}</p>
    <div class="hgrid">${[1,2,3,4,5,6,7,8,9,10].map(p => `<div class="hrow"><span class="hp" style="color:var(--${AB[p]})">${esc(pname(p))}</span><div>${G.HEROES.filter(h => h.p === p).map(chip).join('')}</div></div>`).join('')}</div>
    <p class="muted" style="font-size:12.5px">${esc(t3('heroesExcl'))}</p>
    <div class="row"><label class="tg2"><input type="checkbox" id="dh-rf" ${Store.d.reforged ? 'checked' : ''}> ${esc(t3('reforged'))}</label>
      <span style="margin-left:auto">${sel.length}/7 ${esc(t3('chosen'))}</span><button class="btn sec" id="dh-clear">${esc(t3('clear'))}</button></div>`;
};
$('#dlg-heroes').addEventListener('click', e => {
  const c = e.target.closest('[data-hero]');
  if (c) { const id = c.dataset.hero, a = Store.d.heroes; const i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else if (a.length < 7) a.push(id); Store.save(); RENDER['dlg-heroes'](); return; }
  if (e.target.closest('#dh-clear')) { Store.d.heroes = []; Store.save(); RENDER['dlg-heroes'](); }
});
$('#dlg-heroes').addEventListener('change', e => { if (e.target.id === 'dh-rf') { Store.d.reforged = e.target.checked; Store.save(); } });

// ---------- Pick your core ----------
const ELITES = () => VB.skills.filter(s => s.e && (st.mode !== 'pvp' || !s.rp));
let draw = null;
function syncHHE() {
  const cm = $('#coremode'); if (!cm) return;
  cm.innerHTML = ['random', 'pick', 'three'].map(v => `<option value="${v}">${esc(t3(v === 'random' ? 'coreRandom' : v === 'pick' ? 'corePick' : 'core3'))}</option>`).join('');
  cm.value = st.core;
  $('#corebox').style.display = st.scope === 1 ? '' : 'none';
  $('#elite').style.display = st.core === 'pick' ? '' : 'none';
  $('#draw3').style.display = st.core === 'three' ? '' : 'none';
  $('#elite').placeholder = t3('eliteSearch');
  const e = st.elite && VB.byId.get(st.elite);
  if (st.core === 'pick' && e && document.activeElement !== $('#elite')) $('#elite').value = e.n[st.lang];
  $('#elitelist').innerHTML = ELITES().map(s => `<option value="${esc(s.n[st.lang])}">${esc(pname(s.p) || '')}</option>`).join('');
  $('#draw3 span').textContent = t3('draw3');
  $('#destiny span').textContent = t3('destiny');
  $('#t-heroes').innerHTML = `${esc(t3('heroesT'))}: <b>${Store.d.heroes.length ? esc(Store.d.heroes.slice(0, 2).map(id => HERO(id) ? HERO(id).n : id).join(', ')) + (Store.d.heroes.length > 2 ? ' +' + (Store.d.heroes.length - 2) : '') : esc(t3('heroesDice'))}</b>`;
  const ti = titleInfo();
  $('#t-titles').innerHTML = `${esc(t3('titlesT'))}: <b>${esc(ti.rank ? ti.rank.n[st.lang] : t3('noRank'))}</b> · ${Object.keys(Store.d.ach).length}/${ACH.length}`;
}
$('#coremode').addEventListener('change', e => { st.core = e.target.value; draw = null; if (st.core === 'random') st.elite = 0; syncHHE(); if (st.core === 'three') drawThree(); });
$('#elite').addEventListener('change', e => {
  const v = e.target.value.trim().toLowerCase(), s = ELITES().find(x => x.n.de.toLowerCase() === v || x.n.en.toLowerCase() === v);
  if (!s) { toast(t3('unknownElite')); return; }
  st.elite = s.id; roll(false);
});
$('#draw3').addEventListener('click', drawThree);
function drawThree() {
  const f = poolFilter(), all = ELITES().filter(s => (!f || f(s)) && (!st.prim || s.p === st.prim || Math.random() < 0.35));
  const pick = []; const pool = all.slice();
  while (pick.length < 3 && pool.length) pick.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  draw = pick;
  const face = s => { const src = SRC && SRC[s.id]; return `<span class="mono">${esc(initials(s.n[st.lang]))}</span>` + (src && src.icon ? `<img src="${esc(src.icon)}" alt="" onerror="this.remove()">` : ''); };
  $('#out').classList.remove('fresh');
  $('#out').innerHTML = `<div class="card choice"><h3>${esc(t3('pickOne'))}</h3><p class="muted">${esc(t3('pickNote'))}</p><div class="three">${pick.map((s, i) => `
    <button class="opt" data-elite="${s.id}" style="--kc:var(--${AB[s.p] || 'X'});--i:${i * 3}"><div class="tile">${face(s)}</div>
      <b>${esc(s.n[st.lang])}</b><span class="m">${esc(pname(s.p) || '')} · ${esc(aname(s.a))}</span><span class="d">${esc((s.d[st.lang] || '').replace(/\[[^\]]*\]/g, m => m.slice(1, -1)).slice(0, 170))}…</span></button>`).join('')}</div>
    <button class="ghost" id="redraw">${ICON('i-redo')}<span>${esc(t3('draw3'))}</span></button></div>`;
}
document.addEventListener('click', e => {
  const o = e.target.closest('[data-elite]'); if (o) { st.elite = +o.dataset.elite; roll(false); return; }
  if (e.target.closest('#redraw')) { drawThree(); return; }
  if (e.target.closest('#destiny')) { st.destiny = true; if (st.mode === 'pvp') st.mode = 'pve'; if (st.scope === 1) st.scope = 8; roll(false); }
});
// Würfeln im Modus „1 aus 3“ zieht neue Elites statt direkt zu würfeln
$('#go').onclick = () => { st.destiny = false; if (st.scope === 1 && st.core === 'three' && !draw) { drawThree(); return; } draw = null; roll(false); };

// ---------- Titel & Erfolge ----------
const RANKS = [
  [50, 'Mutiger Rekrut', 'Brave Recruit'], [150, 'Wagemutiger Abenteurer', 'Daring Adventurer'], [350, 'Furchtloser Held', 'Fearless Hero'],
  [700, 'Tollkühner Champion', 'Reckless Champion'], [1200, 'Waghalsige Legende', 'Foolhardy Legend'], [2000, 'Off-Meta-Mastermind', 'Off-Meta Mastermind'],
  [3200, 'Meister des Absurden', 'Master of the Absurd'], [5000, 'Legendäre Ultimate Bravery', 'Legendary Ultimate Bravery'],
].map(([p, de, en], i) => ({p, i: i + 1, n: {de, en}}));
function titleInfo() {
  const pts = Store.d.log.reduce((s, e) => s + (e.pts || 0), 0);
  const rank = RANKS.filter(r => pts >= r.p).pop() || null, next = RANKS.find(r => pts < r.p) || null;
  return {pts, rank, next};
}
const BS = e => e.build.team ? (e.build.members || []) : [e.build];
const OK = L => L.filter(e => e.ok);
const uniq = a => new Set(a.filter(x => x !== undefined && x !== null)).size;
const used = (e, id) => BS(e).some(b => (b.used || []).includes(id));
// [id, Symbol, DE-Name, EN-Name, DE-Text, EN-Text, (Logbuch) => [Stand, Ziel]]
const ACH = [
  ['first', '✎', 'Erste Schritte', 'First Steps', 'Trag einen Build ins Logbuch ein.', 'Log a build.', L => [L.length, 1]],
  ['works', '✓', 'Es funktioniert tatsächlich', 'It Actually Works', 'Schaff eine Mission oder einen Vanquish.', 'Complete a mission or vanquish.', L => [OK(L).length, 1]],
  ['fail5', '☠', 'Glorreich gescheitert', 'Glorious Failure', '5 gescheiterte Versuche – Tapferkeit zählt.', '5 failed attempts – bravery counts.', L => [L.filter(e => !e.ok).length, 5]],
  ['comeback', '↺', 'Comeback', 'Comeback', 'Ein Erfolg direkt nach zwei Fehlschlägen.', 'A success right after two failures.', L => [L.some((e, i) => e.ok && i >= 2 && !L[i - 1].ok && !L[i - 2].ok) ? 1 : 0, 1]],
  ['hm', '⚔', 'Härter als gedacht', 'Hard Mode, Harder Build', 'Schaff eine Mission im Hard Mode.', 'Complete a mission in hard mode.', L => [OK(L).filter(e => e.kind === 'hm').length, 1]],
  ['vq1', '⚑', 'Säuberungsaktion', 'Clean Sweep', 'Dein erster Vanquish.', 'Your first vanquish.', L => [OK(L).filter(e => e.kind === 'vq').length, 1]],
  ['vq10', '⚑', 'Vanquisher des Absurden', 'Vanquisher of the Absurd', '10 Vanquishes.', '10 vanquishes.', L => [OK(L).filter(e => e.kind === 'vq').length, 10]],
  ['vet25', '★', 'Kampagnenveteran', 'Campaign Veteran', '25 geschaffte Missionen.', '25 completed missions.', L => [OK(L).filter(e => e.kind !== 'vq').length, 25]],
  ['w10', '∞', 'Völlig irre', 'Absolutely Bonkers', 'Ein Erfolg auf Weirdness 10.', 'A success at weirdness 10.', L => [OK(L).filter(e => e.build.weird >= 10).length, 1]],
  ['w10hm', '∞', 'Wahnsinn mit Methode', 'Method to the Madness', 'Hard Mode oder Vanquish auf Weirdness 10.', 'Hard mode or vanquish at weirdness 10.', L => [OK(L).filter(e => e.build.weird >= 10 && e.kind !== 'nm').length, 1]],
  ['meta', '☺', 'Meta-Sklave', 'Meta Slave', '5 Erfolge auf Weirdness 1. Feigling.', '5 successes at weirdness 1. Coward.', L => [OK(L).filter(e => e.build.weird <= 1).length, 5]],
  ['brave3', '♛', 'Today I Went Full Bravery', 'Today I Went Full Bravery', 'Ein Erfolg mit drei wirksamen Bravery-Regeln.', 'A success with three effective bravery rules.', L => [OK(L).filter(e => BS(e).some(b => (b.used || []).length >= 3)).length, 1]],
  ['sabotage', '✗', 'Task Failed Successfully', 'Task Failed Successfully', 'Erfolg trotz wirksamer Selbstsabotage.', 'Success despite effective self-sabotage.', L => [OK(L).filter(e => used(e, 'sabotage')).length, 1]],
  ['urn', '⚱', 'Urn-glaublich', 'Urn-believable', 'Erfolg mit „Urne statt Waffe“.', 'Success with “Bundles over weapons”.', L => [OK(L).filter(e => used(e, 'urn')).length, 1]],
  ['weapon', '⚒', 'Falsche Waffe, richtiger Held', 'Wrong Weapon, Right Hero', 'Erfolg mit einer Waffe ohne ihr Attribut.', 'Success with a weapon without its attribute.', L => [OK(L).filter(e => used(e, 'weapon')).length, 1]],
  ['rules', '⚖', 'Regelbrecher', 'Rule Breaker', 'Jede der 9 Bravery-Regeln einmal wirksam in einem Erfolg.', 'Each of the 9 bravery rules effective in a success once.', L => [uniq(OK(L).flatMap(e => BS(e).flatMap(b => b.used || []))), G.BRAVERY.length]],
  ['versatile', '✦', 'The Versatile Hero', 'The Versatile Hero', 'Erfolge mit allen 10 Primärprofessionen (deine Leiste).', 'Successes with all 10 primary professions (your bar).', L => [uniq(OK(L).map(e => (e.build.team ? (e.build.members || []).find(m => m.hero === 'you') || {} : e.build).p)), 10]],
  ['jack', '✧', 'Hans Dampf in allen Gassen', 'Jack of All Trades', 'Erfolge mit allen 10 Zweitprofessionen (deine Leiste).', 'Successes with all 10 secondary professions (your bar).', L => [uniq(OK(L).map(e => (e.build.team ? (e.build.members || []).find(m => m.hero === 'you') || {} : e.build).s)), 10]],
  ['eng10', '⚙', 'Motorenbauer', 'Engine Builder', 'Erfolge mit 10 verschiedenen Engines.', 'Successes with 10 different engines.', L => [uniq(OK(L).flatMap(e => BS(e).flatMap(b => b.motors || []))), 10]],
  ['engall', '⚙', 'Großer Motorkasten', 'Engine Collector', 'Erfolge mit allen Engines.', 'Successes with every engine.', L => [uniq(OK(L).flatMap(e => BS(e).flatMap(b => b.motors || []))), G.MOTORS.length]],
  ['party8', '⚐', 'Heroes Handbook', 'Heroes Handbook', 'Ein Erfolg mit vollem 8er-Team.', 'A success with a full party of 8.', L => [OK(L).filter(e => e.build.team && (e.build.size || (e.build.members || []).length) >= 8).length, 1]],
  ['hero15', '♞', 'Heldenflüsterer', 'Hero Whisperer', 'Erfolge mit 15 verschiedenen Helden.', 'Successes with 15 different heroes.', L => [uniq(OK(L).flatMap(e => BS(e).map(b => b.hero)).filter(h => h && h !== 'you')), 15]],
  ['heroall', '♞', 'Alle Mann an Bord', 'Assemble!', 'Erfolge mit allen 31 Helden.', 'Successes with all 31 heroes.', L => [uniq(OK(L).flatMap(e => BS(e).map(b => b.hero)).filter(h => h && h !== 'you')), G.HEROES.length]],
  ['nomonk', '✚', 'Kein Mönch? Kein Problem.', 'No Monk, No Problem', 'Team-Erfolg ganz ohne Mönch (Ritualisten heilen).', 'Team success without any monk (ritualists heal).', L => [OK(L).filter(e => e.build.team && !(e.build.members || []).some(m => m.p === 3)).length, 1]],
  ['core', '◆', 'Core Memory', 'Core Memory', 'Erfolg mit einem selbst gewählten Elite.', 'Success with a self-picked elite.', L => [OK(L).filter(e => BS(e).some(b => b.picked)).length, 1]],
  ['dest1', '☄', 'Schicksal angenommen', 'Destiny Accepted', 'Schaff ein gewürfeltes Schicksal.', 'Complete a rolled destiny.', L => [OK(L).filter(e => e.build.destiny).length, 1]],
  ['dest5', '☄', 'Schicksalsschmied', 'Master of Destiny', '5 geschaffte Schicksale.', '5 completed destinies.', L => [OK(L).filter(e => e.build.destiny).length, 5]],
  ['names', '✍', 'Namedropper', 'Namedropper', '25 verschiedene Build-Namen im Logbuch.', '25 different build names in the logbook.', L => [uniq(L.flatMap(e => BS(e).map(b => b.nm || b.name))), 25]],
  ['meme', '☻', 'Meme-Lord', 'Meme Lord', 'Erfolg mit einem Kult-Namen (Meme, Popkultur, GW-Insider).', 'Success with a cult name (meme, pop culture, GW insider).', L => [OK(L).filter(e => BS(e).some(b => G.isMemeName && G.isMemeName(b.nm || b.name))).length, 1]],
  ['pts1000', '⌘', 'Vierstellig', 'Four Digits', '1.000 Punkte gesamt.', '1,000 points in total.', L => [L.reduce((s, e) => s + (e.pts || 0), 0), 1000]],
];
function checkAch() {
  const L = Store.d.log, got = [];
  for (const a of ACH) { const [cur, goal] = a[6](L); if (cur >= goal && !Store.d.ach[a[0]]) { Store.d.ach[a[0]] = new Date().toISOString(); got.push(a); } }
  return got;
}
function celebrate(before) {
  const got = checkAch(), after = titleInfo();
  if (got.length || (after.rank && (!before.rank || after.rank.i > before.rank.i))) {
    Store.save();
    const msg = got.map(a => t3('newAch') + ': ' + a[st.lang === 'de' ? 2 : 3]);
    if (after.rank && (!before.rank || after.rank.i > before.rank.i)) msg.unshift(t3('newRank') + ': ' + after.rank.n[st.lang]);
    const el = $('#toast'); el.textContent = msg.join(' · '); el.style.display = 'block'; el.classList.add('gold');
    clearTimeout(toast._t); toast._t = setTimeout(() => { el.style.display = 'none'; el.classList.remove('gold'); }, 3200);
  }
}
RENDER['dlg-titles'] = () => {
  $('#dt-title').textContent = t3('titlesT');
  const ti = titleInfo(), L = Store.d.log;
  const pct = ti.next ? Math.round(100 * (ti.pts - (ti.rank ? ti.rank.p : 0)) / (ti.next.p - (ti.rank ? ti.rank.p : 0))) : 100;
  $('#dt-body').innerHTML = `<h3>${esc(t3('titleH'))}</h3>
    <div class="track"><div class="trank">${ti.rank ? `<b>${esc(ti.rank.n[st.lang])}</b> · Rang ${ti.rank.i}` : esc(t3('noRank'))}</div>
      <div class="tbar"><i style="width:${pct}%"></i></div>
      <div class="tnext">${ti.pts} ${esc(t2('points'))} · ${ti.next ? `${esc(t3('next'))}: ${esc(ti.next.n[st.lang])} (${ti.next.p})` : esc(t3('maxRank'))}</div>
      <div class="ranks">${RANKS.map(r => `<span class="${ti.pts >= r.p ? 'on' : ''}">${r.i}. ${esc(r.n[st.lang])} <small>${r.p}</small></span>`).join('')}</div></div>
    <h3>${esc(t3('achH'))} · ${Object.keys(Store.d.ach).length}/${ACH.length}</h3>
    <div class="achs">${ACH.map(a => { const [cur, goal] = a[6](L), on = !!Store.d.ach[a[0]];
      return `<div class="ach${on ? ' on' : ''}"><span class="ai">${a[1]}</span><div><b>${esc(a[st.lang === 'de' ? 2 : 3])}</b><span>${esc(a[st.lang === 'de' ? 4 : 5])}</span>
        ${on ? `<small>${esc(t3('unlocked'))} ${esc(Store.d.ach[a[0]].slice(0, 10))}</small>` : `<div class="tbar sm"><i style="width:${Math.min(100, Math.round(100 * cur / goal))}%"></i></div><small>${Math.min(cur, goal)}/${goal}</small>`}</div></div>`; }).join('')}</div>`;
};

// ================= v7: Landing Page (Hub), Overlays, Unterseiten =================
const TX4 = {
  en: {hubLead: 'Random off-meta builds for Guild Wars that still work – for you alone, for your heroes or for a 1v1. Pick how brave you are today.',
    mDestiny: 'Roll your Destiny', mDestinyD: 'You pick only your class. The dice decide mission or vanquish, the place, the party size, your heroes and every bar.',
    mPick3: 'Pick 1 of 3', mPick3D: 'Three elites of your class are drawn – choose one and the bar grows around it.',
    mSig: 'Pick your Signature', mSigD: 'Search your favourite elite (German or English name) and roll a bar around it.',
    mPve: 'PvE', mPveD: 'Solo bar or a whole party with your heroes.', mPvp: 'PvP 1v1', mPvpD: 'PvP versions of all skills, no PvE-only skills.',
    mRandom: 'Random', mRandomD: 'No questions: mode, size and class are rolled. Weirdness and Full Bravery stay as last time.',
    solo: 'Solo', teamOf: 'Party of', cont: 'Continue', contD: 'as last time', titles: 'Titles & achievements', logbook: 'Logbook',
    howto: 'How to play', howtoD: 'Modes, weirdness, bravery, heroes, points', account: 'Account', accountD: 'Skill base, connections, backup',
    about: 'About', aboutD: 'Sources, wiki data, licences', kb: 'Knowledge Base', kbD: 'Every skill and engine explained (English)',
    open: 'Open', chooseClass: 'Choose your class', anyClass: 'Random', rollIt: 'Roll!', next: 'Next', change: 'Change', reroll: 'Reroll', drawAgain: 'Draw again',
    heroesFor: 'Your heroes', heroesTip: 'The first {n} picked heroes join; the dice fill free slots.', role: 'Role', weird: 'Weirdness', brave: 'Full Bravery',
    braveTip: 'Each tick switches off one random rule – more points, more chaos.', sigSearch: 'Search elite – German or English …', sigNone: 'No elite found.',
    pickNote: 'Click an elite – the bar grows around it.', classElites: 'elites of', allElites: 'all elites',
    entries: 'entries', points: 'points', noEntries: 'No entries yet – roll a build, play it and log it.', rankNone: 'no rank yet', of: 'of',
    accLead: 'Everything here is stored in this browser. Use the backup to move it to another device.', ratingsH: 'Ratings', ratingsT: 'Your 👍/👎 ratings help tune the generator.',
    rExport: 'Export ratings', rClear: 'Delete ratings', load: 'load', del: 'delete', csv: 'Export CSV', foot: 'Unofficial fan project · Guild Wars © ArenaNet/NCSOFT', back: 'Hub',
    modeDestiny: 'Destiny', modePick3: 'Pick 1 of 3', modeSig: 'Signature', fresh: 'You have not logged anything yet.'},
  de: {hubLead: 'Zufällige Off-Meta-Builds für Guild Wars, die trotzdem funktionieren – für dich allein, mit deinen Helden oder für ein 1v1. Wähle, wie mutig du heute bist.',
    mDestiny: 'Roll your Destiny', mDestinyD: 'Du wählst nur deine Klasse. Der Würfel bestimmt Mission oder Vanquish, den Ort, die Teamgröße, deine Helden und jede Leiste.',
    mPick3: 'Pick 1 of 3', mPick3D: 'Drei Elites deiner Klasse werden gezogen – such dir einen aus, die Leiste wächst um ihn herum.',
    mSig: 'Pick your Signature', mSigD: 'Such deinen Lieblings-Elite (deutscher oder englischer Name) und würfle eine Leiste drumherum.',
    mPve: 'PvE', mPveD: 'Solo-Leiste oder eine ganze Gruppe mit deinen Helden.', mPvp: 'PvP 1v1', mPvpD: 'PvP-Versionen aller Skills, keine PvE-only-Skills.',
    mRandom: 'Random', mRandomD: 'Keine Fragen: Modus, Größe und Klasse werden gewürfelt. Weirdness und Full Bravery bleiben wie zuletzt.',
    solo: 'Solo', teamOf: 'Team aus', cont: 'Weiter', contD: 'wie zuletzt', titles: 'Titel & Erfolge', logbook: 'Logbuch',
    howto: 'So funktioniert’s', howtoD: 'Modi, Weirdness, Bravery, Helden, Punkte', account: 'Account', accountD: 'Skill-Basis, Verbindungen, Backup',
    about: 'Über', aboutD: 'Quellen, Wiki-Daten, Lizenzen', kb: 'Knowledge Base', kbD: 'Jeder Skill und jede Engine erklärt (englisch)',
    open: 'Öffnen', chooseClass: 'Wähle deine Klasse', anyClass: 'Zufall', rollIt: 'Würfeln!', next: 'Weiter', change: 'Ändern', reroll: 'Neu würfeln', drawAgain: 'Neu ziehen',
    heroesFor: 'Deine Helden', heroesTip: 'Die ersten {n} gewählten Helden kommen mit, freie Plätze füllt der Würfel.', role: 'Rolle', weird: 'Weirdness', brave: 'Full Bravery',
    braveTip: 'Jeder Haken setzt eine zufällige Regel außer Kraft – mehr Punkte, mehr Chaos.', sigSearch: 'Elite suchen – deutsch oder englisch …', sigNone: 'Kein Elite gefunden.',
    pickNote: 'Klick auf einen Elite – die Leiste wächst um ihn herum.', classElites: 'Elites', allElites: 'alle Elites',
    entries: 'Einträge', points: 'Punkte', noEntries: 'Noch keine Einträge – würfle einen Build, spiel ihn und trag ihn ein.', rankNone: 'noch ohne Rang', of: 'von',
    accLead: 'Alles hier wird in diesem Browser gespeichert. Mit dem Backup ziehst du es auf ein anderes Gerät um.', ratingsH: 'Bewertungen', ratingsT: 'Deine 👍/👎-Bewertungen helfen, den Generator abzustimmen.',
    rExport: 'Bewertungen exportieren', rClear: 'Bewertungen löschen', load: 'laden', del: 'löschen', csv: 'CSV exportieren', foot: 'Inoffizielles Fan-Projekt · Guild Wars © ArenaNet/NCSOFT', back: 'Hub',
    modeDestiny: 'Schicksal', modePick3: 'Pick 1 of 3', modeSig: 'Signature', fresh: 'Du hast noch nichts eingetragen.'},
};
const t4 = k => TX4[st.lang][k] || TX4.en[k] || k;
let flow = Object.assign({kind: 'pve', scope: 1}, Store.d.lastFlow || {});
const views = {hub: $('#v-hub'), page: $('#v-page'), build: $('#v-build')};
function showView(v) {
  for (const [k, el] of Object.entries(views)) el.hidden = k !== v;
  $('#homebtn').hidden = v === 'hub'; $('#hometxt').textContent = t4('back');
  $('#foot').innerHTML = `${esc(t4('foot'))} · <a href="#/about">${esc(t4('about'))}</a> · <a href="#/howto">${esc(t4('howto'))}</a>`;
  if (v !== 'build') hideTip();
  scrollTo(0, 0);
}
const PAGES = {account: renderAccount, titles: () => RENDER['dlg-titles'](), log: renderLogPage, howto: renderHowto, about: renderAbout};
function route() {
  document.querySelectorAll('dialog[open]').forEach(d => d.close());   // Zurück-Geste/Navigation schließt offene Overlays
  const h = location.hash, m = h.match(/^#\/?(\w*)$/);
  if (!h || m) {
    const pg = m && m[1];
    if (pg && PAGES[pg]) { showView('page'); document.querySelectorAll('#v-page .page').forEach(p => p.hidden = p.id !== 'pg-' + pg); PAGES[pg](); return; }
    showView('hub'); renderHub(); return;
  }
  const fromLink = readHash(); showView('build');
  flow = {kind: st.destiny ? 'destiny' : st.mode === 'pvp' ? 'pvp' : (st.core !== 'random' && st.elite) ? 'sig' : 'pve', scope: st.scope};
  syncControls(); roll(fromLink);
}
function relang() {
  Store.d.lang = st.lang; Store.save(); syncControls();
  if (!views.hub.hidden) renderHub(); else if (!views.page.hidden) route(); else render();
}
addEventListener('hashchange', route);
function goBuild() { if (views.build.hidden) { history.pushState(null, '', '#build'); showView('build'); } }
function rememberFlow() { Store.d.lastFlow = Object.assign({}, flow, {prim: st.prim, weird: st.weird, brave: st.brave, role: st.role, elite: flow.kind === 'sig' ? st.elite : 0}); Store.save(); }

// ---------- Hub ----------
const MODE_ICON = {destiny: 'i-star', pick3: 'i-dice', sig: 'i-book', pve: 'i-shield', pvp: 'i-flame', random: 'i-redo'};
function flowLabel(f) {
  const k = f.kind;
  const base = k === 'destiny' ? t4('modeDestiny') : k === 'pick3' ? t4('modePick3') : k === 'sig' ? t4('modeSig') : k === 'pvp' ? 'PvP 1v1' : k === 'random' ? 'Random' : 'PvE';
  return base + (k === 'pve' ? ' · ' + (f.scope > 1 ? t4('teamOf') + ' ' + f.scope : t4('solo')) : '');
}
function miniBar(ids, eliteMark) {
  return `<div class="mini">${ids.map(id => { const s = VB.byId.get(id); if (!s) return ''; const src = SRC && SRC[id];
    return `<div class="tile${s.e && eliteMark !== false ? ' el' : ''}" style="--kc:var(--${AB[s.p] || 'X'})" title="${esc(s.n[st.lang])}"><span class="mono">${esc(initials(s.n[st.lang]))}</span>${src && src.icon ? `<img src="${esc(src.icon)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>`; }).join('')}</div>`;
}
const combo = (p, s) => `<span class="combo"><i style="--kc:var(--${AB[p]})">${esc(AB[p])}</i><i style="--kc:var(--${AB[s]})">${esc(AB[s])}</i></span>`;
function decodeSafe(code) { try { return G.decodeTemplate(code); } catch (e) { return null; } }
function entryStrips(e, max) {
  const ms = e.build.team ? (e.build.members || []) : [e.build];
  return ms.slice(0, max || 8).map(m => { const d = m.code && decodeSafe(m.code); if (!d) return '';
    const who = e.build.team ? (m.hero === 'you' ? t3('you') : (HERO(m.hero) || {}).n || '') : '';
    return `<div class="strip"><span class="who2">${who ? `<b>${esc(who)}</b> · ` : ''}${combo(d.p1, d.p2)} ${esc(m.nm || m.name || '')}</span>${miniBar(d.skills)}</div>`; }).join('');
}
function renderHub() {
  const ti = titleInfo(), L = Store.d.log, last = Store.d.lastFlow;
  const card = (k, extra, cls) => `<div role="button" tabindex="0" class="mode${cls ? ' ' + cls : ''}" data-flow="${k}"><span class="mi">${ICON(MODE_ICON[k])}</span>
    <b>${esc(t4({destiny: 'mDestiny', pick3: 'mPick3', sig: 'mSig', pve: 'mPve', pvp: 'mPvp', random: 'mRandom'}[k]))}</b>
    <span>${esc(t4({destiny: 'mDestinyD', pick3: 'mPick3D', sig: 'mSigD', pve: 'mPveD', pvp: 'mPvpD', random: 'mRandomD'}[k]))}</span>${extra || ''}</div>`;
  const pveChips = `<span class="chips">${[1, 4, 6, 8].map(n => `<button data-flow="pve" data-size="${n}">${n === 1 ? esc(t4('solo')) : n}</button>`).join('')}</span>`;
  const pct = ti.next ? Math.round(100 * (ti.pts - (ti.rank ? ti.rank.p : 0)) / (ti.next.p - (ti.rank ? ti.rank.p : 0))) : 100;
  const recent = L.slice(-2).reverse();
  views.hub.innerHTML = `${baseSwitch()}<p class="hero">${esc(t4('hubLead'))}</p>
    ${backupNag()}${lastBuildCard()}
    ${last ? `<div class="cont">${ICON('i-redo')}<span><b>${esc(t4('cont'))}</b> ${esc(t4('contD'))}: ${esc(flowLabel(last))}${last.prim ? ' · ' + esc(pname(last.prim)) : ''} · W${last.weird || 5}${last.brave ? ' · Bravery ' + last.brave : ''}</span><button class="btn" data-cont="1">${esc(t4('rollIt'))}</button></div>` : ''}
    <div class="modes">${card('destiny', '', 'fate-m')}${card('pick3')}${card('sig')}${card('pve', pveChips)}${card('pvp')}${card('random')}</div>
    <div class="hubrow">
      <div class="panel"><h2>${esc(t4('titles'))}</h2>
        <div class="trank">${ti.rank ? esc(ti.rank.n[st.lang]) : esc(t4('rankNone'))}</div><div class="tbar"><i style="width:${pct}%"></i></div>
        <p>${ti.pts} ${esc(t4('points'))} · ${Object.keys(Store.d.ach).length}/${ACH.length} ${esc(t3('achH'))}${ti.next ? ` · ${esc(t3('next'))}: ${esc(ti.next.n[st.lang])} (${ti.next.p})` : ''}</p>
        <p><a class="lnk" href="#/titles">${esc(t4('open'))} →</a></p></div>
      <div class="panel"><h2>${esc(t4('logbook'))}</h2><p>${L.length} ${esc(t4('entries'))} · ${ti.pts} ${esc(t4('points'))}</p>
        ${recent.length ? recent.map(e => `<div class="strips" style="margin:6px 0">${entryStrips(e, 1)}</div>`).join('') : `<p>${esc(t4('noEntries'))}</p>`}
        <p><a class="lnk" href="#/log">${esc(t4('open'))} →</a></p></div>
    </div>
    <div class="links"><a href="#/howto"><b>${esc(t4('howto'))}</b><span>${esc(t4('howtoD'))}</span></a><a href="#/account"><b>${esc(t4('account'))}</b><span>${esc(t4('accountD'))}</span></a>
      <a href="#/about"><b>${esc(t4('about'))}</b><span>${esc(t4('aboutD'))}</span></a><a href="knowledge.html" target="_blank" rel="noopener"><b>${esc(t4('kb'))} ↗</b><span>${esc(t4('kbD'))}</span></a></div>`;
}
views.hub.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.mode')) { e.preventDefault(); e.target.click(); } });
views.hub.addEventListener('click', e => {
  if (hubExtraClick(e)) return;
  if (e.target.closest('[data-cont]')) { st.link = null; const l = Store.d.lastFlow || {}; flow = {kind: l.kind || 'pve', scope: l.scope || 1}; st.prim = l.prim || 0; st.weird = l.weird || 5; st.brave = l.brave || 0; st.role = l.role || '';
    if (l.elite) { st.elite = l.elite; st.core = 'pick'; } startFlow(true); return; }
  const f = e.target.closest('[data-flow]'); if (!f) return;
  const kind = f.dataset.flow, size = +(e.target.closest('[data-size]') || {dataset: {}}).dataset.size || 1;
  flow = {kind, scope: kind === 'pve' ? size : 1};
  if (kind === 'random') { randomFlow(); return; }
  openClass();
});

// ---------- Ablauf ----------
function applyFlow() {
  const k = flow.kind;
  st.mode = k === 'pvp' ? 'pvp' : 'pve';
  st.scope = k === 'pve' ? flow.scope : k === 'destiny' ? 8 : 1;   // Destiny: die echte Größe setzt der Würfel
  st.destiny = k === 'destiny';
  if (k !== 'pick3' && k !== 'sig') { st.core = 'random'; st.elite = 0; }
  if (k !== 'pve' || st.scope > 1) st.role = k === 'pve' && st.scope === 1 ? st.role : '';
}
function startFlow(direct) {
  st.link = null; applyFlow(); rememberFlow();
  if ((flow.kind === 'pick3' || flow.kind === 'sig') && !(direct && st.elite && flow.kind === 'sig')) { openPick(); return; }
  goBuild(); roll(false);
}
function randomFlow() {
  const opts = [['pve', 1], ['pve', 1], ['pve', 4], ['pve', 6], ['pve', 8], ['pvp', 1]], o = opts[Math.floor(Math.random() * opts.length)];
  const l = Store.d.lastFlow || {};
  flow = {kind: o[0], scope: o[1], random: true}; st.prim = 0; st.weird = l.weird || st.weird; st.brave = l.brave || 0; st.role = '';
  startFlow(true);
}
function rerollCurrent() {
  if (current && current.kind === 'team' && current.data.destiny) { st.destiny = true; }
  if (flow.kind === 'pick3') { openPick(); return; }
  if (flow.random) { randomFlow(); return; }
  applyFlow(); roll(false);
}
$('#go').onclick = rerollCurrent;

// ---------- Klassen-Overlay ----------
let selCls = 0;
function openClass() {
  st.link = null; selCls = st.prim || 0;
  renderClass(); const d = $('#dlg-class'); if (!d.open) d.showModal();
}
function renderClass() {
  const k = flow.kind, team = k === 'pve' && flow.scope > 1, pick = k === 'pick3' || k === 'sig';
  $('#dc-title').textContent = flowLabel(flow) + ' – ' + t4('chooseClass');
  const cls = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => `<button class="cls${selCls === p ? ' on' : ''}" data-cls="${p}" style="--kc:var(--${AB[p]})"><span class="ab">${AB[p]}</span>${esc(pname(p))}</button>`).join('')
    + `<button class="cls${!selCls ? ' on' : ''}" data-cls="0" style="--kc:var(--X)"><span class="ab">?</span>${esc(t4('anyClass'))}</button>`;
  const roleSel = k === 'pve' && !team ? `<div class="fld"><span class="lbl">${esc(t4('role'))}</span><select id="ov-role"><option value="">${esc(t('random'))}</option>${['dmg', 'heal', 'prot', 'support', 'tank'].map(r => `<option value="${r}" ${st.role === r ? 'selected' : ''}>${ROLES[r][st.lang]}</option>`).join('')}</select></div>` : '';
  $('#dc-body').innerHTML = `${charRow()}<div class="classes">${cls}</div>
    <div class="ovrow"><div class="ovw"><div class="wl"><span class="lbl">${esc(t4('weird'))}</span><span><span class="wv" id="ov-wv">${st.weird}</span> <small id="ov-wl">${esc(WL[st.lang][st.weird])}</small></span></div>
      <input type="range" id="ov-w" min="1" max="10" value="${st.weird}"><div class="wl"><span>Meta</span><span>${esc(t('bonkers'))}</span></div></div>
      <div class="fld" title="${esc(t4('braveTip'))}"><span class="lbl">${esc(t4('brave'))}</span><div class="brave" id="ov-b">${[0, 1, 2].map(i => `<label><input type="checkbox" ${i < st.brave ? 'checked' : ''}><span></span></label>`).join('')}</div></div>
      ${roleSel}</div>`;
  const hs = $('#dlg-heroes'); hs.hidden = !team;
  if (team) { RENDER['dlg-heroes'](); $('#dh-title').textContent = t4('heroesFor') + ' · ' + t4('heroesTip').replace('{n}', flow.scope - 1); }
  $('#dc-foot').innerHTML = `<button class="go${k === 'destiny' ? ' destiny' : ''}" id="ov-go">${ICON(pick ? 'i-book' : 'i-dice')}<span>${esc(pick ? t4('next') : t4('rollIt'))}</span></button>`;
}
$('#dlg-class').addEventListener('click', e => {
  const ch = e.target.closest('[data-char]');
  if (ch) { keepOv(); const c = charsOn()[+ch.dataset.char]; flow.char = c && flow.char !== c.n ? c.n : ''; if (flow.char) selCls = c.p; renderClass(); return; }
  const c = e.target.closest('[data-cls]'); if (c) { keepOv(); selCls = +c.dataset.cls; const cc = curChar(); if (cc && cc.p !== selCls) flow.char = ''; renderClass(); return; }
  if (e.target.closest('#ov-go')) {
    st.prim = selCls; st.weird = +$('#ov-w').value;
    st.brave = [...document.querySelectorAll('#ov-b input')].filter(x => x.checked).length;
    st.role = $('#ov-role') ? $('#ov-role').value : '';
    $('#dlg-class').close(); startFlow(false);
  }
});
$('#dlg-class').addEventListener('input', e => { if (e.target.id === 'ov-w') { $('#ov-wv').textContent = e.target.value; $('#ov-wl').textContent = WL[st.lang][+e.target.value]; } });
$('#dlg-class').addEventListener('change', e => { if (e.target.closest('#ov-b')) { const xs = [...document.querySelectorAll('#ov-b input')], n = xs.filter(x => x.checked).length; xs.forEach((x, i) => x.checked = i < n); } });

// ---------- Pick-Overlay: Signature oder 1 aus 3 ----------
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[„“"'!’.]/g, '');
function eliteOpt(s, i) {
  const src = SRC && SRC[s.id], other = st.lang === 'de' ? s.n.en : s.n.de;
  return `<button class="sopt" data-pe="${s.id}" style="--kc:var(--${AB[s.p] || 'X'});--i:${i || 0}"><div class="tile"><span class="mono">${esc(initials(s.n[st.lang]))}</span>${src && src.icon ? `<img src="${esc(src.icon)}" alt="" onerror="this.remove()">` : ''}</div>
    <span><b>${esc(s.n[st.lang])}</b><small>${other !== s.n[st.lang] ? esc(other) + ' · ' : ''}${esc(pname(s.p) || '')} · ${esc(aname(s.a))}</small></span></button>`;
}
function elitePool() { const f = poolFilter(); return ELITES().filter(s => (!st.prim || s.p === st.prim) && (!f || f(s))); }
let three = [];
function openPick(redraw) {
  const d = $('#dlg-pick');
  if (flow.kind === 'sig') {
    $('#dp-title').textContent = 'Pick your Signature' + (st.prim ? ' · ' + pname(st.prim) : '');
    $('#dp-body').innerHTML = `<input class="search" id="ps-q" placeholder="${esc(t4('sigSearch'))}" autocomplete="off"><div class="sres" id="ps-res"></div>`;
    sigResults('');
  } else {
    const f = poolFilter(), pool = elitePool().filter(s => !f || f(s)); three = [];
    while (three.length < 3 && pool.length) three.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    $('#dp-title').textContent = 'Pick 1 of 3' + (st.prim ? ' · ' + pname(st.prim) : '');
    $('#dp-body').innerHTML = `<p>${esc(t4('pickNote'))}</p><div class="three">${three.map((s, i) => `
      <button class="opt" data-pe="${s.id}" style="--kc:var(--${AB[s.p] || 'X'});--i:${i * 3}"><div class="tile"><span class="mono">${esc(initials(s.n[st.lang]))}</span>${SRC && SRC[s.id] && SRC[s.id].icon ? `<img src="${esc(SRC[s.id].icon)}" alt="" onerror="this.remove()">` : ''}</div>
        <b>${esc(s.n[st.lang])}</b><span class="m">${esc(st.lang === 'de' ? s.n.en : s.n.de)} · ${esc(pname(s.p) || '')} · ${esc(aname(s.a))}</span>
        <span class="d">${esc((s.d[st.lang] || '').replace(/\[[^\]]*\]/g, m => m.slice(1, -1)).slice(0, 170))}…</span></button>`).join('')}</div>
      <button class="ghost" id="ps-redraw">${ICON('i-redo')}<span>${esc(t4('drawAgain'))}</span></button>`;
  }
  if (!d.open) d.showModal();
  if (flow.kind === 'sig') setTimeout(() => $('#ps-q') && $('#ps-q').focus(), 30);
}
function sigResults(q) {
  const n = norm(q), list = elitePool().filter(s => !n || norm(s.n.en).includes(n) || norm(s.n.de).includes(n))
    .sort((a, b) => a.n[st.lang].localeCompare(b.n[st.lang]));
  $('#ps-res').innerHTML = list.length ? list.slice(0, 120).map(eliteOpt).join('') : `<p>${esc(t4('sigNone'))}</p>`;
}
$('#dlg-pick').addEventListener('input', e => { if (e.target.id === 'ps-q') sigResults(e.target.value); });
$('#dlg-pick').addEventListener('click', e => {
  const o = e.target.closest('[data-pe]');
  if (o) { st.elite = +o.dataset.pe; st.core = 'pick'; rememberFlow(); $('#dlg-pick').close(); goBuild(); roll(false); return; }
  if (e.target.closest('#ps-redraw')) openPick(true);
});

// ---------- Build-Kopfzeile ----------
function renderBuildbar() {
  const parts = [`<b>${esc(flowLabel(Object.assign({}, flow, {scope: st.scope})))}</b>`];
  if (st.mode === 'pvp' && flow.kind !== 'pvp') parts[0] = '<b>PvP 1v1</b>';
  const cc = !st.link && Store.d.base === 'chars' && st.mode !== 'pvp' ? curChar() : null;
  parts.push(esc(cc ? cc.n + ' (' + pname(cc.p) + ')' : st.prim ? pname(st.prim) : t4('anyClass')), 'W' + st.weird);
  if (st.brave) parts.push('Bravery ' + st.brave);
  const el = st.core !== 'random' && st.elite && VB.byId.get(st.elite); if (el) parts.push(esc(el.n[st.lang]));
  $('#buildbar').innerHTML = `<span class="crumb">${parts.join('<i>·</i>')}</span>
    <span class="sp"><button class="ghost" id="bb-change">${ICON('i-book')}<span>${esc(t4('change'))}</span></button>
    <button class="go${flow.kind === 'destiny' ? ' destiny' : ''}" id="bb-roll">${ICON('i-dice')}<span>${esc(flow.kind === 'pick3' ? t4('drawAgain') : t4('reroll'))}</span><kbd>Space</kbd></button></span>`;
}
$('#buildbar').addEventListener('click', e => {
  if (e.target.closest('#bb-change')) { if (flow.random) flow = {kind: st.mode === 'pvp' ? 'pvp' : 'pve', scope: st.scope}; openClass(); return; }
  if (e.target.closest('#bb-roll')) rerollCurrent();
});

// ---------- Unterseiten ----------
function renderAccount() {
  $('#pa-title').textContent = t4('account'); $('#pa-lead').textContent = t4('accLead');
  RENDER['dlg-chars'](); RENDER['dlg-skills'](); RENDER['dlg-links'](); RENDER['dlg-backup'](); storeStatus();
  $('#db-body').insertAdjacentHTML('beforeend', `<h3>${esc(t4('ratingsH'))}</h3><p>${esc(t4('ratingsT'))} (${loadR().length})</p>
    <div class="row"><button class="btn sec" id="acc-rexp">${esc(t4('rExport'))}</button><button class="btn sec" id="acc-rclr">${esc(t4('rClear'))}</button></div>`);
}
document.addEventListener('click', e => {
  if (e.target.closest('#acc-rexp')) { exportR(); return; }
  if (e.target.closest('#acc-rclr')) { if (confirm(t('confirmClear'))) { saveR([]); updateRCount(); renderAccount(); } }
});
function renderLogPage() {
  const L = Store.d.log, ti = titleInfo(), sum = k => L.filter(e => e.ok && e.kind === k).length;
  $('#pl-body').innerHTML = `<h2 class="ph">${esc(t4('logbook'))}</h2>
    <div class="kp"><div><b>${ti.pts}</b><span>${esc(t2('total'))}</span></div><div><b>${sum('nm')}</b><span>${esc(t2('doneNM'))}</span></div>
      <div><b>${sum('hm')}</b><span>${esc(t2('doneHM'))}</span></div><div><b>${sum('vq')}</b><span>${esc(t2('doneVQ'))}</span></div><div><b>${new Set(L.filter(e => e.ok).map(e => e.target)).size}</b><span>${esc(t2('targets'))}</span></div></div>
    ${L.length ? L.slice().reverse().map(e => `<div class="lent"><div><div class="lt">${esc(e.target)}</div>
        <div class="lm">${esc(e.ts.slice(0, 10))} · ${esc(t2(e.kind))} · ${esc(t2(e.ok ? 'ok' : 'fail'))} · ×${(e.mult || 1).toFixed(2)}${e.build.destiny ? ' · ' + esc(t4('modeDestiny')) : ''}${e.note ? ' · ' + esc(e.note) : ''}</div></div>
        <div class="lp${e.ok ? '' : ' no'}">${e.pts}</div><div class="strips">${entryStrips(e)}</div>
        <div class="la"><button class="lnk" data-lload="${e.id}">${esc(t4('load'))}</button><button class="lnk" data-ldel="${e.id}">${esc(t4('del'))}</button></div></div>`).join('')
      + `<p><button class="btn sec" id="dl-csv">${esc(t4('csv'))}</button></p>` : `<div class="panel"><p>${esc(t4('noEntries'))}</p></div>`}`;
}
// Logbuch-Seite nutzt dieselben Aktionen wie der Dialog (laden, löschen, CSV)
$('#pg-log').addEventListener('click', e => {
  const ld = e.target.closest('[data-lload]');
  if (ld) { const en = Store.d.log.find(x => x.id === ld.dataset.lload); if (en && en.build.hash) { history.pushState(null, '', en.build.hash); route(); } return; }
  const dl = e.target.closest('[data-ldel]');
  if (dl && confirm(t2('confirmDel'))) { Store.d.log = Store.d.log.filter(x => x.id !== dl.dataset.ldel); Store.save(); renderLogPage(); return; }
  if (e.target.closest('#dl-csv')) csvExport();
});
function csvExport() {
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const rows = [['date', 'target', 'type', 'result', 'points', 'multiplier', 'build', 'code', 'weirdness', 'note']].concat(Store.d.log.map(x =>
    [x.ts.slice(0, 10), x.target, x.kind, x.ok ? 'done' : 'failed', x.pts, x.mult, x.build.name, x.build.team ? x.build.members.map(m => m.code).join(' ') : x.build.code, x.build.weird, x.note]));
  download('gw1-logbook-' + new Date().toISOString().slice(0, 10) + '.csv', rows.map(r => r.map(q).join(';')).join('\n'), 'text/csv');
}
function renderHowto() { $('#ph-body').innerHTML = HOWTO[st.lang](); }
function renderAbout() { $('#pb-body').innerHTML = ABOUT[st.lang](); }

// Dialoge, die jetzt Seiten sind: dorthin navigieren
const PAGE_OF = {'dlg-skills': 'account', 'dlg-links': 'account', 'dlg-backup': 'account', 'dlg-titles': 'titles', 'dlg-heroes': null};
openDlg = function (id, arg) {
  const d = $('#' + id);
  if (d && d.showModal) { RENDER[id](arg); if (!d.open) d.showModal(); return; }
  if (PAGE_OF[id]) location.hash = '#/' + PAGE_OF[id];
};

// ---------- How to play & Mechaniken ----------
const braveList = () => G.BRAVERY.map(r => `<li>${esc(r.name[st.lang])}</li>`).join('');
const rankList = () => RANKS.map(r => `${esc(r.n[st.lang])} (${r.p})`).join(' · ');
const HOWTO = {
  en: () => `<h2 class="ph">How to play</h2><div class="panel prose">
    <h3>Quick start</h3><ol><li>Pick a mode on the hub.</li><li>Choose your class, weirdness and Full Bravery in the overlay.</li><li>Roll, load the template code in game (skills window → templates) and play.</li><li>Log the result: mission (normal/hard mode) or vanquish, done or failed – points, titles and achievements follow.</li></ol>
    <h3>Modes</h3><ul><li><b>Roll your Destiny</b> – the dice pick mission or vanquish, a real place from the wiki, the party size of that place, your heroes and all bars. You only pick your class.</li>
      <li><b>Pick 1 of 3</b> – three elites of your class, you choose one, the bar grows around it.</li><li><b>Pick your Signature</b> – search any elite by German or English name.</li>
      <li><b>PvE</b> – solo bar or a party of 4/6/8 with your heroes. <b>PvP 1v1</b> – PvP versions of skills, no PvE-only skills.</li><li><b>Random</b> – mode, size and class are rolled.</li></ul>
    <h3>Weirdness 1–10</h3><p>1 stays close to proven patterns, 10 is as strange as it gets – but the hard rules hold on every level: one elite, at most three attribute lines plus the primary attribute, points only into lines the bar uses, a weapon only with its weapon attribute (rank ≥ 9), no payoff without its trigger. Low weirdness keeps the primary profession as the core (≥ 4 skills on 1–4, ≥ 3 on 5–9) and always uses the primary attribute (≥ 8). On 10 the primary profession may bring only one skill – or none – if the primary attribute still pays off.</p>
    <h3>Full Bravery</h3><p>Each tick switches off one random rule and the generator really uses it. Possible rules:</p><ul>${braveList()}</ul><p>A rule only counts for points if it actually changed the bar; otherwise it is shown crossed out.</p>
    <h3>Parties and heroes</h3><ul><li>You are slot 1, then your heroes. Up to 7 heroes; free slots are filled by the dice – monks or ritualists first so the party survives.</li>
      <li>Roles are rolled with guardrails: healer and prot only monk or ritualist, tank only warrior, assassin, paragon or dervish. Without monk or ritualist you get a red warning instead of a warrior healer.</li>
      <li>Heroes never get PvE-only skills (they only use account-unlocked skills) and avoid skills the hero AI is documented to misuse.</li></ul>
    <h3>Engines and friction</h3><p>Every bar grows around one or two mechanics (“engines”, e.g. burning, signet count, shadow steps). The generator looks for the triggers itself. Skills that fight each other (e.g. low-health payoffs next to max-health buffs) are penalised and shown as friction. Details in the <a href="knowledge.html" target="_blank" rel="noopener">Knowledge Base</a>.</p>
    <h3>App, links and your data</h3><ul><li><b>Phone:</b> open the page, then Share → Add to Home Screen (iPhone/iPad, Safari) or ⋮ → Install app (Android, Chrome). Once loaded it also works offline.</li>
      <li><b>Your data</b> (skill base, characters, logbook, titles, ratings) stays in this browser on this device – nothing is uploaded. Use Account → Backup to move it. On iPhone/iPad the Home Screen app keeps its own storage, separate from Safari.</li>
      <li><b>Sharing:</b> the address bar always holds the current build. Anyone who opens it sees exactly the same build, whatever their own settings are. Links carry the skill pool, never character names.</li>
      <li><b>Your last build</b> is kept on the start page, so closing the app mid-vanquish loses nothing. Logbook entries are saved the moment you add them.</li>
      <li><b>My characters:</b> Account → My characters imports character_completion.json from GWToolbox++. Your bar then only uses what the chosen character has learned; heroes use what all your characters know.</li></ul>
    <h3>Points, titles, achievements</h3><p>Base points: mission normal mode 10, hard mode 20, vanquish 40 (hard mode only). × weirdness factor (1 + 0.08 per level above 1) × (1 + 0.25 per effective bravery rule). Failed = 0. Title track: ${rankList()}. 30 achievements are read from your logbook.</p>
    <h3>Good to know</h3><ul><li>Playability is judged by rules and tags, not by simulation. High weirdness can be tough – that is the point.</li>
      <li>Upgrade names are in English; upgrade details without guarantee. Inscriptions were checked against the Guild Wars Wiki.</li>
      <li>Template codes follow the official format; please report codes that do not load.</li>
      <li>Party sizes come from the outposts’ wiki data; where the wiki has no value, 8 is assumed (marked as estimated).</li>
      <li>Your skill base (account) limits skills and the places Destiny can pick: no campaign, no missions from it.</li></ul></div>`,
  de: () => `<h2 class="ph">So funktioniert’s</h2><div class="panel prose">
    <h3>Schnellstart</h3><ol><li>Modus auf der Startseite wählen.</li><li>Im Overlay Klasse, Weirdness und Full Bravery einstellen.</li><li>Würfeln, Vorlagencode im Spiel laden (Skill-Fenster → Vorlagen) und spielen.</li><li>Ergebnis eintragen: Mission (Normal/Hard Mode) oder Vanquish, geschafft oder gescheitert – Punkte, Titel und Erfolge folgen.</li></ol>
    <h3>Modi</h3><ul><li><b>Roll your Destiny</b> – der Würfel wählt Mission oder Vanquish, einen echten Ort aus dem Wiki, dessen Teamgröße, deine Helden und alle Leisten. Du wählst nur deine Klasse.</li>
      <li><b>Pick 1 of 3</b> – drei Elites deiner Klasse, du wählst einen, die Leiste wächst um ihn herum.</li><li><b>Pick your Signature</b> – jeden Elite suchen, mit deutschem oder englischem Namen.</li>
      <li><b>PvE</b> – Solo-Leiste oder Team aus 4/6/8 mit deinen Helden. <b>PvP 1v1</b> – PvP-Versionen der Skills, keine PvE-only-Skills.</li><li><b>Random</b> – Modus, Größe und Klasse werden gewürfelt.</li></ul>
    <h3>Weirdness 1–10</h3><p>1 bleibt nah an bewährten Mustern, 10 wird maximal schräg – die harten Regeln gelten auf jeder Stufe: ein Elite, höchstens drei Attributlinien plus Primärattribut, Punkte nur in genutzte Linien, Waffe nur mit Waffenattribut (Rang ≥ 9), kein Nutznießer ohne Auslöser. Auf niedriger Stufe bleibt die Primärprofession der Kern (≥ 4 Skills auf 1–4, ≥ 3 auf 5–9) und das Primärattribut wird immer genutzt (≥ 8). Auf 10 darf die Primärprofession nur einen oder gar keinen Skill stellen, wenn sich das Primärattribut trotzdem lohnt.</p>
    <h3>Full Bravery</h3><p>Jeder Haken setzt eine zufällige Regel außer Kraft, und der Generator nutzt das auch aus. Mögliche Regeln:</p><ul>${braveList()}</ul><p>Für Punkte zählt eine Regel nur, wen
    <h3>App, Links und deine Daten</h3><ul><li><b>Handy:</b> Seite öffnen, dann Teilen → Zum Home-Bildschirm (iPhone/iPad, Safari) oder ⋮ → App installieren (Android, Chrome). Einmal geladen, läuft sie auch offline.</li>
      <li><b>Deine Daten</b> (Skill-Basis, Charaktere, Logbuch, Titel, Bewertungen) bleiben in diesem Browser auf diesem Gerät – nichts wird hochgeladen. Zum Umziehen: Account → Backup. Auf iPhone/iPad hat die Home-Screen-App einen eigenen Speicher, getrennt von Safari.</li>
      <li><b>Teilen:</b> Die Adresszeile enthält immer den aktuellen Build. Wer sie öffnet, sieht genau denselben Build – egal, was er selbst eingestellt hat. Links tragen den Skill-Pool, nie Charakternamen.</li>
      <li><b>Dein letzter Build</b> bleibt auf der Startseite, App schließen mitten im Vanquish kostet also nichts. Logbuch-Einträge sind gespeichert, sobald du sie anlegst.</li>
      <li><b>Meine Charaktere:</b> Account → Meine Charaktere importiert character_completion.json aus GWToolbox++. Deine Leiste nutzt dann nur, was der gewählte Charakter gelernt hat; Helden nutzen, was alle deine Charaktere können.</li></ul>n sie die Leiste wirklich verändert hat; sonst ist sie durchgestrichen.</p>
    <h3>Teams und Helden</h3><ul><li>Du bist Platz 1, danach deine Helden. Bis zu 7 Helden; freie Plätze füllt der Würfel – zuerst mit Mönchen oder Ritualisten, damit das Team überlebt.</li>
      <li>Rollen mit Leitplanken: Heiler und Prot nur Mönch oder Ritualist, Tank nur Krieger, Assassine, Paragon oder Derwisch. Ohne Mönch oder Ritualist gibt es eine rote Warnung statt eines Krieger-Heilers.</li>
      <li>Helden bekommen nie PvE-only-Skills (sie nutzen nur auf dem Account freigeschaltete Skills) und meiden Skills, die die Helden-KI laut Wiki nicht sinnvoll einsetzt.</li></ul>
    <h3>Engines und Reibung</h3><p>Jede Leiste wächst um ein bis zwei Mechaniken („Engines“, z. B. Brennen, Siegel zählen, Schattenschritte). Die Auslöser sucht der Generator selbst. Skills, die sich beißen (z. B. Wenig-Leben-Effekte neben Max-Leben-Buffs), werden abgewertet und als Reibung gezeigt. Details in der <a href="knowledge.html" target="_blank" rel="noopener">Knowledge Base</a>.</p>
    <h3>Punkte, Titel, Erfolge</h3><p>Basis: Mission Normal Mode 10, Hard Mode 20, Vanquish 40 (nur Hard Mode). × Weirdness-Faktor (1 + 0,08 je Stufe über 1) × (1 + 0,25 je wirksamer Bravery-Regel). Gescheitert = 0. Titelspur: ${rankList()}. 30 Erfolge werden aus deinem Logbuch gelesen.</p>
    <h3>Gut zu wissen</h3><ul><li>Spielbarkeit wird über Regeln und Tags bewertet, nicht simuliert. Hohe Weirdness kann zäh sein – das ist der Sinn.</li>
      <li>Upgrade-Namen sind englisch, Details ohne Gewähr. Inschriften sind gegen das Guild Wars Wiki geprüft.</li>
      <li>Vorlagencodes folgen dem offiziellen Format; Codes, die nicht laden, bitte melden.</li>
      <li>Teamgrößen stammen aus den Wiki-Daten der Außenposten; fehlt dort ein Wert, gilt 8 (als geschätzt markiert).</li>
      <li>Deine Skill-Basis (Account) begrenzt Skills und die Orte für Destiny: keine Kampagne, keine Missionen daraus.</li></ul></div>`,
};
const ABOUT = {
  en: () => aboutHtml('About', ['Skill data', 'Guild Wars Wiki (descriptions, notes, places, heroes, inscriptions)', 'PvXwiki (meta value, measured pairs)', 'Icons'], 'Data status', 'Licences', 'Unofficial, non-commercial fan project, not affiliated with or endorsed by ArenaNet or NCSOFT. © ArenaNet, LLC. All rights reserved. NCSOFT, ArenaNet, Guild Wars, Guild Wars Factions, Guild Wars Nightfall, Guild Wars: Eye of the North and all associated logos and designs are trademarks or registered trademarks of NCSOFT Corporation. Skill names and icons belong to ArenaNet.'),
  de: () => aboutHtml('Über', ['Skilldaten', 'Guild Wars Wiki (Beschreibungen, Notizen, Orte, Helden, Inschriften)', 'PvXwiki (Meta-Wert, gemessene Paare)', 'Icons'], 'Datenstand', 'Lizenzen', 'Inoffizielles, nicht kommerzielles Fan-Projekt, nicht verbunden mit ArenaNet oder NCSOFT und nicht von ihnen unterstützt. © ArenaNet, LLC. Alle Rechte vorbehalten. NCSOFT, ArenaNet, Guild Wars, Guild Wars Factions, Guild Wars Nightfall, Guild Wars: Eye of the North und alle zugehörigen Logos und Designs sind Marken oder eingetragene Marken der NCSOFT Corporation. Skillnamen und Icons gehören ArenaNet.'),
};
const REPO_URL = 'https://github.com/krvtt/gw1-ultimate-bravery';
function aboutHtml(h, src, ds, lic, tm) {
  const W = window.GW_WIKI || {}, nIc = (W.ic || []).length, nO = (W.orte || []).length;
  return `<h2 class="ph">${esc(h)}</h2><div class="panel prose"><p><b>GUILD WARS · Zaishen Ultimate Bravery · The Versatile Hero's Handbook</b> – v${esc(D.v)}</p>
    <h3>${esc(ds)}</h3><ul><li>${esc(src[0])}: <a href="https://github.com/build-wars/gw-skilldata" target="_blank" rel="noopener">build-wars/gw-skilldata</a> · ${D.skills.length} skills</li>
      <li>${esc(src[1])}: ${esc((W.fetched || '').slice(0, 10) || '–')} · ${nO} places</li><li>${esc(src[2])}: ${(W.pvx && W.pvx.bars) || 0} bars</li><li>${esc(src[3])}: ${nIc}/${D.skills.length} (Guild Wars Wiki)</li></ul>
    <h3>${esc(lic)}</h3><ul><li>gw-skilldata: MIT</li><li><a href="https://wiki.guildwars.com/" target="_blank" rel="noopener">Guild Wars Wiki</a>: GNU FDL 1.3 or later</li><li><a href="https://gwpvx.fandom.com/" target="_blank" rel="noopener">PvXwiki</a>: CC BY-NC-SA</li><li>Tool code: MIT${REPO_URL ? ` · <a href="${esc(REPO_URL)}" target="_blank" rel="noopener">GitHub</a>` : ''}</li></ul>
    <p>${esc(tm)}</p><p><a href="knowledge.html" target="_blank" rel="noopener">Knowledge Base ↗</a></p></div>`;
}

// ---------- Öffnen/Schließen ----------
document.addEventListener('click', e => {
  const o = e.target.closest('[data-dlg]'); if (o) { openDlg(o.dataset.dlg); return; }
  if (e.target.closest('[data-close]')) { e.target.closest('dialog').close(); return; }
  const lg = e.target.closest('[data-log]'); if (lg) { openDlg('dlg-log', lg.dataset.log === 'team' ? {team: true} : {idx: +lg.dataset.log}); }
});
document.querySelectorAll('dialog.dlg').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
const syncControls0 = syncControls;
syncControls = function () { syncControls0(); refreshTools(); };

// ================= Beta-Release: eigene Charaktere (GWToolbox++), letzter Build, Backup-Erinnerung, Web-App =================
const TX5 = {
  en: {swMine: 'Use my characters', swManual: 'My skill base', swBlank: 'Start blank', swImport: 'Import characters →',
    swHintChars: 'Your bar only uses skills the chosen character has learned; heroes use everything your characters know.',
    swHintManual: 'Uses the skills you ticked in your account.', swHintBlank: 'Every skill is available – as if your account had everything unlocked.',
    swHintNone: 'No characters imported yet.',
    lastT: 'Your last build', lastOpen: 'Open', nagT: '{n} logbook entries are not in a backup yet.', nagBtn: 'Save backup',
    charsT: 'My characters (GWToolbox++)', charsLead: 'GWToolbox++ records which skills each of your characters has learned. Import that file and the dice only rolls skills your characters really know.',
    charsSteps: ['Play with GWToolbox++ running and log in every character once – the Completion window updates its list in the background.',
      'Find character_completion.json in the GWToolbox++ settings folder (usually Documents\\GWToolboxpp\\<PC name>).',
      'Import it here. Import again whenever your characters have learned new skills.'],
    charsImport: 'Import character_completion.json', charsAgain: 'Import again', charsClear: 'Remove characters', charsConfirm: 'Remove all imported characters from this browser?',
    charsPriv: 'The file is read in this browser only. Character names stay on this device and never go into shared links.',
    charsNote: 'Toolbox stores the skills each character learned, not your account unlocks. Heroes therefore use what all your characters learned together; skills you only unlocked with Balthazar faction are missing.',
    charsBad: 'This is not a GWToolbox++ character_completion.json.', charsIni: 'Old Toolbox format (.ini). Please update GWToolbox++ – current versions write character_completion.json.',
    charsDone: '{n} characters imported', charsSkills: 'skills', charsPvp: 'PvP character', charsPre: 'Pre-Searing', charsAt: 'Imported', charsUnion: 'skills across your characters',
    yourChars: 'Your characters', persistOk: 'Storage: permanent – the browser will not clear it on its own.',
    persistNo: 'Storage: best effort – the browser may clear it when space runs low. Keep a backup.',
    iosNote: 'iPhone/iPad: the Home Screen app has its own storage, separate from Safari. Set it up after adding it to the Home Screen, or move your state with a backup.',
    updated: 'New version loaded – reload to use it.',
    poolWide: 'Your character knows too few skills for this roll – used the skills of all your characters.',},
  de: {swMine: 'Meine Charaktere', swManual: 'Meine Skill-Basis', swBlank: 'Blanker Start', swImport: 'Charaktere importieren →',
    swHintChars: 'Deine Leiste nutzt nur Skills, die der gewählte Charakter gelernt hat; Helden nutzen alles, was deine Charaktere können.',
    swHintManual: 'Nutzt die Skills, die du im Account angehakt hast.', swHintBlank: 'Alle Skills sind verfügbar – als wäre auf deinem Account alles freigeschaltet.',
    swHintNone: 'Noch keine Charaktere importiert.',
    lastT: 'Dein letzter Build', lastOpen: 'Öffnen', nagT: '{n} Logbuch-Einträge sind noch in keinem Backup.', nagBtn: 'Backup speichern',
    charsT: 'Meine Charaktere (GWToolbox++)', charsLead: 'GWToolbox++ merkt sich, welche Skills jeder deiner Charaktere gelernt hat. Importiere diese Datei, dann würfelt der Würfel nur Skills, die deine Charaktere wirklich können.',
    charsSteps: ['Spiele mit laufendem GWToolbox++ und logge jeden Charakter einmal ein – das Completion-Fenster aktualisiert seine Liste im Hintergrund.',
      'Suche character_completion.json im Einstellungsordner von GWToolbox++ (meist Dokumente\\GWToolboxpp\\<PC-Name>).',
      'Hier importieren. Erneut importieren, wenn deine Charaktere neue Skills gelernt haben.'],
    charsImport: 'character_completion.json importieren', charsAgain: 'Erneut importieren', charsClear: 'Charaktere entfernen', charsConfirm: 'Alle importierten Charaktere aus diesem Browser entfernen?',
    charsPriv: 'Die Datei wird nur in diesem Browser gelesen. Charakternamen bleiben auf diesem Gerät und landen nie in geteilten Links.',
    charsNote: 'Toolbox speichert die Skills, die jeder Charakter gelernt hat, nicht deine Account-Freischaltungen. Helden nutzen deshalb, was alle Charaktere zusammen gelernt haben; nur per Balthasar-Fraktion freigeschaltete Skills fehlen.',
    charsBad: 'Das ist keine character_completion.json von GWToolbox++.', charsIni: 'Altes Toolbox-Format (.ini). Bitte GWToolbox++ aktualisieren – aktuelle Versionen schreiben character_completion.json.',
    charsDone: '{n} Charaktere importiert', charsSkills: 'Skills', charsPvp: 'PvP-Charakter', charsPre: 'Pre-Searing', charsAt: 'Importiert', charsUnion: 'Skills über alle Charaktere',
    yourChars: 'Deine Charaktere', persistOk: 'Speicher: dauerhaft – der Browser löscht ihn nicht von selbst.',
    persistNo: 'Speicher: nach Möglichkeit – der Browser kann ihn bei Platzmangel leeren. Mach ab und zu ein Backup.',
    iosNote: 'iPhone/iPad: Die Home-Screen-App hat einen eigenen Speicher, getrennt von Safari. Richte sie nach dem Hinzufügen zum Home-Screen ein oder übertrage deinen Stand per Backup.',
    updated: 'Neue Version geladen – neu laden, um sie zu nutzen.',
    poolWide: 'Dein Charakter kann zu wenige Skills für diesen Wurf – genommen wurden die Skills all deiner Charaktere.',},
};
const t5 = k => (TX5[st.lang] || TX5.en)[k] || TX5.en[k] || k;

// GWToolbox++ character_completion.json: {Name: {profession, is_pvp, is_pre_searing, skills: [uint32 …]}};
// skills ist ein Bitfeld über die Skill-IDs (Wort = id >> 5, Bit = id & 31), laut Toolbox-Quellcode die gelernten Skills des Charakters.
function parseToolbox(txt) {
  const t = String(txt || '').trim();
  if (/^\[[^{\[]/.test(t)) return 'ini';
  let j; try { j = JSON.parse(t); } catch (e) { return null; }
  if (!j || typeof j !== 'object' || Array.isArray(j)) return null;
  const known = new Set(VB.skills.map(s => s.id)), out = [];
  for (const [name, c] of Object.entries(j)) {
    if (!name || !c || typeof c !== 'object' || !Array.isArray(c.skills)) continue;
    const ids = [];
    c.skills.slice(0, 512).forEach((w, i) => { w = (+w || 0) >>> 0; if (w) for (let b = 0; b < 32; b++) if ((w >>> b) & 1) { const id = i * 32 + b; if (known.has(id)) ids.push(id); } });
    out.push({n: String(name).slice(0, 40), p: Math.min(10, Math.max(0, +c.profession || 0)), pvp: !!c.is_pvp, pre: !!c.is_pre_searing, s: ids, on: !c.is_pvp && !c.is_pre_searing});
  }
  return out.length ? out : null;
}
const tbFile = document.createElement('input');
tbFile.id = 'tbfile'; tbFile.type = 'file'; tbFile.accept = '.json,application/json'; tbFile.hidden = true; document.body.appendChild(tbFile);
tbFile.addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  if (f.size > 20 * 1024 * 1024) { toast(t5('charsBad')); e.target.value = ''; return; }
  f.text().then(txt => {
    const r = parseToolbox(txt);
    if (r === 'ini') { toast(t5('charsIni')); return; }
    if (!r) { toast(t5('charsBad')); return; }
    const prev = new Map((Store.d.chars || []).map(c => [c.n, c.on]));
    r.forEach(c => { if (prev.has(c.n) && !c.pre) c.on = prev.get(c.n); });
    Store.d.chars = r; Store.d.charsAt = new Date().toISOString(); Store.d.base = 'chars'; Store.save(); askPersist();
    toast(t5('charsDone').replace('{n}', r.length)); if (!views.page.hidden) renderAccount(); else route();
  }).finally(() => { e.target.value = ''; });
});
RENDER['dlg-chars'] = () => {
  const cs = Store.d.chars || [];
  $('#dch-title').textContent = t5('charsT');
  $('#dch-body').innerHTML = `<p>${esc(t5('charsLead'))}</p>
    ${cs.length ? `<table class="ltab"><tbody>${cs.map((c, i) => `<tr><td><label class="tg2" style="margin:0"><input type="checkbox" data-chon="${i}" ${CHAR_OK(c) ? 'checked' : ''} ${c.pre ? 'disabled' : ''}> <b>${esc(c.n)}</b></label></td>
      <td>${c.p ? `<span class="ab" style="color:var(--${AB[c.p]})">${esc(AB[c.p])}</span> ${esc(pname(c.p))}` : '–'}</td><td>${c.s.length} ${esc(t5('charsSkills'))}</td><td class="hide-m">${c.pvp ? esc(t5('charsPvp')) : c.pre ? esc(t5('charsPre')) : ''}</td></tr>`).join('')}</tbody></table>
      <p><small>${esc(t5('charsAt'))}: ${esc((Store.d.charsAt || '').slice(0, 10))} · ${charUnion().size} ${esc(t5('charsUnion'))}</small></p>`
      : `<ol class="steps">${t5('charsSteps').map(x => `<li>${esc(x)}</li>`).join('')}</ol>`}
    <div class="row" style="margin-top:10px"><button class="btn" id="dch-imp">${esc(cs.length ? t5('charsAgain') : t5('charsImport'))}</button>${cs.length ? `<button class="btn sec" id="dch-clr">${esc(t5('charsClear'))}</button>` : ''}</div>
    <p><small>${esc(t5('charsPriv'))} ${esc(t5('charsNote'))}</small></p>`;
};
$('#dlg-chars').addEventListener('click', e => {
  if (e.target.closest('#dch-imp')) { tbFile.click(); return; }
  if (e.target.closest('#dch-clr') && confirm(t5('charsConfirm'))) { Store.d.chars = []; if (Store.d.base === 'chars') Store.d.base = 'all'; flow.char = ''; Store.save(); renderAccount(); }
});
$('#dlg-chars').addEventListener('change', e => {
  const i = e.target.dataset.chon; if (i === undefined) return;
  const c = (Store.d.chars || [])[+i]; if (c) { c.on = e.target.checked; Store.save(); RENDER['dlg-chars'](); }
});

// Hub: Schalter „Meine Charaktere / Blanker Start“, letzter Build, Backup-Erinnerung
function baseSwitch() {
  const d = Store.d, n = charsOn().length, on = d.base !== 'all';
  const left = n ? t5('swMine') + ' · ' + n : d.base === 'mine' ? t5('swManual') : t5('swMine');
  const hint = !on ? t5('swHintBlank') : d.base === 'chars' && n ? t5('swHintChars') : d.base === 'mine' ? t5('swHintManual') : t5('swHintNone');
  return `<div class="basesw"><div class="seg"><button data-hb="mine" class="${on ? 'on' : ''}">${esc(left)}</button><button data-hb="all" class="${on ? '' : 'on'}">${esc(t5('swBlank'))}</button></div>
    <small>${esc(hint)}${!n && d.base !== 'mine' ? ` <a class="lnk" href="#/account">${esc(t5('swImport'))}</a>` : ''}</small></div>`;
}
function lastBuildCard() {
  const b = Store.d.lastBuild; if (!b || !b.hash) return '';
  const when = b.at ? new Date(b.at) : null, tm = when ? when.toLocaleString(st.lang === 'de' ? 'de-DE' : 'en-GB', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}) : '';
  return `<div class="cont lastb">${ICON('i-book')}<span><b>${esc(t5('lastT'))}</b> ${esc(flowLabel({kind: b.kind || 'pve', scope: b.scope || 1}))}${b.char ? ' · ' + esc(b.char) : b.prim ? ' · ' + esc(pname(b.prim)) : ''} · W${b.weird || 5}${tm ? ' · ' + esc(tm) : ''}</span>
    <button class="btn" data-lastb="1">${esc(t5('lastOpen'))}</button></div>`;
}
function rememberBuild(hash) {
  const cc = !st.link && Store.d.base === 'chars' && st.mode !== 'pvp' ? curChar() : null;
  Store.d.lastBuild = {hash, at: new Date().toISOString(), kind: flow.kind, scope: st.scope, prim: st.prim, weird: st.weird, char: cc ? cc.n : ''};
  Store.save();
}
function backupNag() {
  const L = Store.d.log, n = L.length - (Store.d.backupLogN || 0); if (n <= 0) return '';
  const since = Store.d.lastBackup || (L[0] && L[0].ts) || '', days = since ? (Date.now() - Date.parse(since)) / 864e5 : 0;
  if (n < 5 && days < 14) return '';
  return `<div class="cont nag">${ICON('i-shield')}<span>${esc(t5('nagT').replace('{n}', n))}</span><button class="btn sec" data-nag="1">${esc(t5('nagBtn'))}</button></div>`;
}
function hubExtraClick(e) {
  const hb = e.target.closest('[data-hb]');
  if (hb) {
    const d = Store.d;
    if (hb.dataset.hb === 'all') d.base = 'all';
    else if (charsOn().length) d.base = 'chars';
    else if (d.unlocked.length) d.base = 'mine';
    else { location.hash = '#/account'; return true; }
    Store.save(); renderHub(); return true;
  }
  if (e.target.closest('[data-lastb]')) { const b = Store.d.lastBuild; if (b && b.hash) { flow = {kind: b.kind || 'pve', scope: b.scope || 1, char: b.char || ''}; location.hash = b.hash; } return true; }
  if (e.target.closest('[data-nag]')) { saveBackup(); renderHub(); return true; }
  return false;
}
function charRow() {
  if (Store.d.base !== 'chars' || flow.kind === 'pvp' || flow.kind === 'random') return '';
  const cs = charsOn(); if (!cs.length) return '';
  return `<div class="chars"><span class="lbl">${esc(t5('yourChars'))}</span><div class="chrs">${cs.map((c, i) => `<button class="chr${flow.char === c.n ? ' on' : ''}" data-char="${i}" style="--kc:var(--${AB[c.p] || 'X'})"><span class="ab">${esc(AB[c.p] || '?')}</span><b>${esc(c.n)}</b><small>${c.s.length}</small></button>`).join('')}</div></div>`;
}
function keepOv() {
  const w = $('#ov-w'); if (w) st.weird = +w.value;
  const b = document.querySelectorAll('#ov-b input'); if (b.length) st.brave = [...b].filter(x => x.checked).length;
  const r = $('#ov-role'); if (r) st.role = r.value;
}
function saveBackup() {
  download('gw1-bravery-backup-' + new Date().toISOString().slice(0, 10) + '.json',
    JSON.stringify({tool: 'gw1-bravery', kind: 'backup', v: 1, exported: new Date().toISOString(), store: Store.d, ratings: loadR()}, null, 1), 'application/json');
  Store.d.lastBackup = new Date().toISOString(); Store.d.backupLogN = Store.d.log.length; Store.save(); askPersist();
}
function askPersist() { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {}); } catch (e) {} }
function storeStatus() {
  const add = ok => { const el = $('#db-body'); if (el) el.insertAdjacentHTML('beforeend', `<p><small>${esc(t5(ok ? 'persistOk' : 'persistNo'))} ${esc(t5('iosNote'))}</small></p>`); };
  try { if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(add, () => add(false)); else add(false); } catch (e) { add(false); }
}
// Web-App: Offline-Speicher nur auf der Webseite (GitHub Pages), nicht in der lokalen Einzeldatei
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && document.querySelector('link[rel=manifest]')) {
  let hadCtrl = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadCtrl) toast(t5('updated')); hadCtrl = true; });
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// Start: Sprache (gemerkt hat Vorrang vor dem Link, sonst Englisch), dann Hub, Unterseite oder Build-Link
if (Store.d.lang || !/[#&]l=/.test(location.hash)) st.lang = Store.d.lang || 'en';
syncControls();
route();
})();

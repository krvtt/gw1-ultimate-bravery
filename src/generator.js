/* GW1 Ultimate Bravery – Generator v2 (läuft im Browser und in Node).
 * Erwartet globales GWDATA (aus data.js). Keine vordefinierten Builds:
 * Jeder Build entsteht aus Zufall + harten Regeln + Bewertungsfunktion.
 * Ausnahme ab Weirdness 7: "Spaß-Kerne" (2–3 Skills mit einer Idee), der Rest wird frei gewürfelt.
 */
(function (root) {
'use strict';

// ---------- Konstanten ----------
const PRIMARY_ATTR = {1:17, 2:23, 3:16, 4:6, 5:0, 6:12, 7:35, 8:36, 9:40, 10:44};
const NATURAL = {1:['axe','sword','hammer'], 2:['bow'], 3:['caster'], 4:['caster'], 5:['caster'], 6:['caster'], 7:['dagger'], 8:['caster'], 9:['spear'], 10:['scythe']};
const CASTER_PRIMARY = new Set([3,4,5,6,8]);
const MELEE = new Set(['axe','sword','hammer','dagger','scythe']);
const TWO_HANDED = new Set(['hammer','dagger','scythe','bow']); // keine Schildhand
const WEAPON_ATTR = {axe:18, sword:20, hammer:19, dagger:29, scythe:41, spear:37, bow:25};
const WEAPON_MASTERY = new Set(Object.values(WEAPON_ATTR));
// Bedürfnisse, die nebenbei erfüllt sind (Gegner hat meist weniger Energie/LP, Waffen-Builds greifen ohnehin an)
const SOFT_NEEDS = new Set(['needs_bigenergy','needs_morehp','needs_lowhp','needs_attack','adrenal','needs_spells']);
// "Full Bravery": Jeder Haken setzt eine zufällige dieser Regeln außer Kraft. Alles bleibt im Spiel legal.
const BRAVERY = [
  {id:'range', name:{de:'Nah- und Fernkampf mischen', en:'Melee and ranged mixed'}},
  {id:'weapon', name:{de:'Waffe ohne passendes Attribut', en:'Weapon without its attribute'}},
  {id:'urn', name:{de:'Urne statt Waffe', en:'Bundles over weapons'}},
  {id:'lines', name:{de:'Vier Attributlinien', en:'Four attribute lines'}},
  {id:'energy', name:{de:'Energie? Egal.', en:'Energy? Whatever.'}},
  {id:'payoff', name:{de:'Nutznießer ohne Auslöser', en:'Payoffs without enablers'}},
  {id:'roles', name:{de:'Rolle? Egal.', en:'Role? Whatever.'}},
  {id:'secprim', name:{de:'Fremdes Primärattribut auf Rang 0', en:'Secondary primary at rank 0'}},
  {id:'sabotage', name:{de:'Selbstsabotage erlaubt', en:'Self-sabotage allowed'}},
];
const CONVENTIONAL = new Set(['1-3','1-6','1-2','1-7','1-10','2-3','2-6','2-4','2-1','3-6','3-5','3-2','3-1','3-8','4-3','4-8','4-5','4-2','5-6','5-4','5-3','5-2','6-3','6-5','6-7','6-4','7-5','7-1','7-6','7-3','8-3','8-4','8-6','8-5','9-1','9-3','9-2','9-6','10-1','10-7','10-3','10-6']);
const COST = [0,1,3,6,10,15,21,28,37,48,61,77,97];
const AFF = {1:{dmg:3,tank:2,support:0.6,prot:0.2,heal:0.2}, 2:{dmg:3,support:1.5,tank:0.3,heal:0.3,prot:0.3},
  3:{heal:3,prot:2.5,dmg:0.8,support:0.6,tank:0.2}, 4:{dmg:2.5,support:2,heal:0.8,prot:0.3,tank:0.2},
  5:{support:2.5,dmg:2.5,prot:0.4,heal:0.3,tank:0.2}, 6:{dmg:3.5,support:0.8,prot:0.5,tank:0.3,heal:0.3},
  7:{dmg:3.5,tank:0.6,support:0.6,heal:0.1,prot:0.1}, 8:{heal:2,support:2,dmg:2,prot:1.2,tank:0.2},
  9:{support:2.5,dmg:2.5,prot:1,heal:0.8,tank:0.3}, 10:{dmg:3,tank:2,support:0.4,heal:0.6,prot:0.3}};
const HEAL = ['heal_other','heal_party'];
const UTIL = ['partybuff','control','interrupt','edenial','rm_ench','energy_ally','snare','kd','speed','weaponspell'];
const THEMES = [
  {id:'burning', tag:'c_burning', name:{de:'Brennen', en:'Burning'}},
  {id:'bleeding', tag:'c_bleeding', name:{de:'Blutung', en:'Bleeding'}},
  {id:'hex', tag:'hex', name:{de:'Verhexungen', en:'Hexes'}},
  {id:'cond', tag:'cond', name:{de:'Zustände', en:'Conditions'}},
  {id:'kd', tag:'kd', name:{de:'KD', en:'KD'}},
  {id:'interrupt', tag:'interrupt', name:{de:'Interrupts', en:'Interrupts'}},
  {id:'edenial', tag:'edenial', name:{de:'E-Denial', en:'E-denial'}},
  {id:'spirit', tag:'spirit', name:{de:'Geister', en:'Spirits'}},
  {id:'shout', tag:'shoutchant', name:{de:'Schreie & Anfeuerungen', en:'Shouts & chants'}},
  {id:'ench', tag:'self_ench', name:{de:'Verzauberungen', en:'Enchantments'}},
];
// Produzent -> Konsument, mit Mindestanzahl an Produzenten
const SYN = [
  ['c_bleeding','needs_bleeding',1],['c_burning','needs_burning',1],['c_poison','needs_poison',1],['c_cripple','needs_cripple',1],
  ['c_blind','needs_blind',1],['c_daze','needs_daze',1],['c_deepwound','needs_deepwound',1],['c_disease','needs_disease',1],
  ['c_weakness','needs_weakness',1],['c_crackedarmor','needs_crackedarmor',1],['cond','needs_cond',1],['hex','needs_hex',1],
  ['kd','needs_kd',1],['self_ench','needs_ench',1],['self_ench','needs_selfench',2],['spirit','needs_spirit',1],
  ['minion','needs_minion',1],['attack','needs_attack',2],['attack','adrenal',2],['adr_gain','adrenal',1],
  ['lead','req_lead',1],['offhand','req_offhand',1],['dual','req_dual',1],
  ['dench','rm_dench',2],['rm_dench','on_dench_loss',1],['dench','on_dench_loss',1],
  ['weaponspell','needs_wpnspell',1],['item','needs_item',1],['creature','needs_creature',1],
  ['signet','needs_signets',3],['shoutchant','needs_shoutchant',2],['stance','needs_stance',1],
  ['selfcond','needs_selfcond',1],['selfkd','needs_selfkd',1],['mesmerhex','needs_hexes',2],['waterhex','needs_waterhex',1],
  ['overcast','needs_overcast',1],['maxhp','needs_morehp',1],['lowhp_src','needs_lowhp',1],['energy','needs_bigenergy',1],['crit','needs_crit',1],['spell','needs_spells',3],
];
const HARD_REQ = ['req_lead','req_offhand','req_dual'];

// ---------- Stellschrauben (per tuning.js überschreibbar: window.GW_TUNING) ----------
const TUN = Object.assign({
  version: 3,
  motorFirst: [0.2, 0.65],   // Anteil "Motor zuerst" bei Weirdness 1 bzw. 10
  anyMotor: [0.55, 0.95],    // Anteil Builds mit Motor überhaupt
  secondMotor: [0, 0.45],    // zweiter Motor
  motorBonus: 2.6,           // Bonus für Skills mit Motor-Tags
  edgeBonus: 2.4,            // Bonus je fester Synergie-Kante (Gewicht 3 = voller Bonus)
  metaLink: 0.6,             // Meta-Skill, der Glied einer Synergie ist
  metaFiller: [1.2, -1.6],   // Meta-Skill als bloßes Füllmaterial (Weirdness 1 → 10)
  tempo: 0.5, payoff: 0.4, sameType: 0.9, longCastMelee: 1.5, maintained: 0.8, deadPayoff: 0.8,
  conflict: 1.0,             // Gewicht der Anti-Synergien (Zustandsmodell)
  coreChance: {9: 0.1, 10: 0.15},
  motorWeights: {},          // z. B. {signets: 1.5} nach Feedback
  skillWeights: {},          // z. B. {"Drunken Blow": 0.5}
}, root.GW_TUNING || {});

// ---------- Motoren: Mechanik-Familien, um die herum eine Leiste organisch wächst ----------
// prod/cons = Tags; stack = Tag, der mehrfach vorkommen soll; wild = wie schräg (0 normal … 1 irre)
const MOTORS = [
  {id:'burning', prod:['c_burning'], cons:['needs_burning'], wild:0.3, name:{de:'Brennen',en:'Burning'}},
  {id:'wounds', prod:['c_bleeding','c_deepwound'], cons:['needs_bleeding','needs_deepwound'], wild:0.2, name:{de:'Blutung & tiefe Wunde',en:'Bleeding & deep wound'}},
  {id:'cripple', prod:['c_cripple'], cons:['needs_cripple'], wild:0.4, name:{de:'Verkrüppeln',en:'Cripple'}},
  {id:'weakness', prod:['c_weakness'], cons:['needs_weakness'], wild:0.4, name:{de:'Schwäche',en:'Weakness'}},
  {id:'cracked', prod:['c_crackedarmor'], cons:['needs_crackedarmor'], wild:0.5, name:{de:'Rissige Rüstung',en:'Cracked armor'}},
  {id:'conds', prod:['cond'], cons:['needs_cond'], wild:0.3, name:{de:'Zustände stapeln',en:'Condition stacking'}},
  {id:'hexes', prod:['hex','mesmerhex'], cons:['needs_hex','needs_hexes'], wild:0.3, name:{de:'Verhexungen stapeln',en:'Hex stacking'}},
  {id:'kd', prod:['kd'], cons:['needs_kd'], wild:0.2, name:{de:'KD-Kette',en:'KD chain'}},
  {id:'selfcond', prod:['selfcond'], cons:['needs_selfcond'], wild:0.9, name:{de:'Selbstquälerei',en:'Self-inflicted'}},
  {id:'selfkd', prod:['selfkd'], cons:['needs_selfkd'], wild:1.0, name:{de:'Absichtlich gestolpert',en:'Meant to do that'}},
  {id:'dervish', prod:['dench'], cons:['rm_dench','on_dench_loss'], thr:2, wild:0.4, name:{de:'Verzauberungen verbrauchen',en:'Burning enchantments'}},
  {id:'enchcount', prod:['self_ench'], cons:['needs_selfench'], thr:2, wild:0.5, name:{de:'Verzauberungs-Stapel',en:'Enchantment stack'}},
  {id:'signets', prod:['signet'], cons:['needs_signets'], thr:4, wild:0.8, name:{de:'Siegel zählen',en:'Counting signets'}},
  {id:'shouts', prod:['shoutchant'], cons:['needs_shoutchant'], thr:2, wild:0.5, name:{de:'Unter Schreien',en:'Under shouts'}},
  {id:'weaponspell', prod:['weaponspell'], cons:['needs_wpnspell'], wild:0.6, name:{de:'Waffenzauber',en:'Weapon spells'}},
  {id:'items', prod:['item'], cons:['needs_item'], wild:0.6, name:{de:'Urnen & Aschen',en:'Bundles'}},
  {id:'spirits', prod:['spirit'], cons:['needs_spirit'], thr:2, wild:0.4, name:{de:'Spirit-Spam',en:'Spirit spam'}},
  {id:'creatures', prod:['creature','minion'], cons:['needs_creature','needs_minion'], wild:0.4, name:{de:'Minion-Master',en:'Minion master'}},
  {id:'waterhex', prod:['waterhex'], cons:['needs_waterhex'], wild:0.5, name:{de:'Eisverhexungen',en:'Water hexes'}},
  {id:'overcast', prod:['overcast'], cons:['needs_overcast'], wild:0.6, name:{de:'Überzauberung',en:'Overcast'}},
  {id:'health', prod:['maxhp'], cons:['needs_morehp'], wild:0.8, name:{de:'Dicke Hose',en:'Big health bar'}},
  {id:'lowhp', prod:['lowhp_src'], cons:['needs_lowhp'], wild:0.85, name:{de:'Auf Messers Schneide',en:'Living on the edge'}},
  {id:'bigenergy', prod:['energy'], cons:['needs_bigenergy'], prim:[6], wild:0.7, name:{de:'Großer Energietank',en:'Big energy tank'}},
  {id:'crit', prod:['crit'], cons:['needs_crit'], wild:0.5, name:{de:'Crits',en:'Crits'}},
  {id:'adrenaline', prod:['adr_gain'], cons:['adrenal'], wild:0.3, fam:'weapon', name:{de:'Adrenalin',en:'Adrenaline'}},
  {id:'combo', prod:['lead','offhand'], cons:['req_lead','req_offhand','req_dual'], wild:0.25, name:{de:'Dolch-Kombo',en:'Dagger combo'}},
  {id:'attune', special:'attune', wild:0.2, fam:'caster', name:{de:'Einstimmung',en:'Attunement'}},
  {id:'gapmelee', prod:['gapclose'], cons:['attackbuff','needs_attack'], prim:[3,4,5,6,8], fam:'weapon', wild:0.9, name:{de:'Caster mit Waffe',en:'Caster with a weapon'}},
  {id:'touch', stack:'touch', min:3, wild:0.9, name:{de:'Touch',en:'Touch'}},
  {id:'longcast', special:'longcast', prim:[5], fam:'caster', wild:0.8, name:{de:'Lange Zauber, halbe Zeit',en:'Long casts, half time'}},
  {id:'teleport', stack:'gapclose', min:3, wild:0.9, name:{de:'Teleport-Troll',en:'Teleport troll'}},
  {id:'aoe', stack:'aoe', min:4, wild:0.1, name:{de:'AoE',en:'AoE'}},
  {id:'interrupt', stack:'interrupt', min:3, wild:0.25, name:{de:'Interrupts',en:'Interrupts'}},
  {id:'edenial', stack:'edenial', min:3, wild:0.4, name:{de:'E-Denial',en:'E-denial'}},
  {id:'halfrange', special:'halfrange', prim:[7], fam:'caster', wild:0.85, name:{de:'Dolchwerfer',en:'Dagger thrower'}},
  {id:'primexploit', special:'primexploit', wild:0.75, name:{de:'Fremdes Primärattribut ausreizen',en:'Primary attribute exploit'}},
];
const MOTOR_BY_ID = Object.fromEntries(MOTORS.map(m => [m.id, m]));

// ---------- Feste Synergie-Kanten (aus den Spaß-Kernen + bekannten Wechselwirkungen; per synergie.js erweiterbar) ----------
const EDGES = [
  ['Ride the Lightning','Conjure Lightning',3], ['Ride the Lightning','Lightning Touch',2], ['Conjure Lightning','Shock',1.5],
  ['Illusionary Weaponry','Flurry',3], ['Illusionary Weaponry','Heart of Fury',3], ['Illusionary Weaponry','Onslaught',2.5],
  ['Illusionary Weaponry','Way of the Assassin',2], ['Illusionary Weaponry','Tiger Stance',2.5], ['Illusionary Weaponry','Weapon of Aggression',3],
  ['Radiant Scythe','Energy Boon',2], ['Radiant Scythe','Zealous Sweep',2],
  ["Spirit's Strength",'Weapon of Aggression',3], ["Spirit's Strength",'Brutal Weapon',2.5], ["Spirit's Strength",'Guided Weapon',2],
  ['Kindle Arrows','Conjure Flame',1], ['Kindle Arrows','Mark of Rodgort',3], ['Mark of Rodgort','Glowing Gaze',2],
  ['Dancing Daggers','Entangling Asp',3], ['Dancing Daggers','Deadly Haste',2.5], ['Deadly Haste','Disrupting Dagger',2], ['Deadly Haste','Crippling Dagger',2],
  ['"I Meant to Do That!"','Drunken Blow',3], ['"I Meant to Do That!"','Desperation Blow',3], ['"I Meant to Do That!"','Grapple',2],
  ['Contagion','Poisoned Heart',3], ['Contagion','Signet of Agony',3], ['Contagion','Chilblains',2], ['Contagion','Burning Speed',2.5],
  ['Way of the Master','Critical Eye',2], ['Way of the Master','Keen Arrow',2], ['Way of the Master','Disrupting Accuracy',2],
  ['Judgment Strike','Holy Strike',2.5], ['Judgment Strike','Stonesoul Strike',2.5],
  ['Arcane Zeal','Mystic Regeneration',2], ['Arcane Zeal','Vow of Piety',2],
  ['Soul Taker','Death Blossom',1.5], ['Symbolic Strike','Signet of Strength',2],
  ['Barbs','Mark of Pain',2], ['Mark of Pain','Splinter Weapon',2], ['Order of Pain','Barbs',1.5],
  ['Glowing Gaze','Searing Flames',2], ['Incendiary Bonds','Searing Flames',1.5], ['Shock Arrow','Shell Shock',2], ['Glowstone','Ebon Hawk',2], ['Glowing Ice','Ice Spikes',2],
  ['Mind Blast','Energy Boon',1.5], ['Mind Burn','Energy Boon',1.5], ['Energy Blast','Energy Boon',2],
  ['Vow of Strength','Twin Moon Sweep',1.5], ['Avatar of Balthazar','Mystic Sweep',1.5], ['Aura of Holy Might','Pious Assault',2],
  ['Signet of Deadly Corruption','Caltrops',2], ['Sadist\'s Signet','Signet of Deadly Corruption',1.5],
  ['Shield of Judgment','Aftershock',1.5], ['Earthbind','Earthquake',2], ['Earthbind','Backbreaker',2],
  ['Arcane Echo','Energy Surge',1.5], ['Keystone Signet','Symbolic Celerity',3], ['Keystone Signet','Signet of Disruption',2],
  ['Weapon of Quickening','Signet of Spirits',1], ['Boon of Creation','Animate Bone Minions',2], ['Explosive Growth','Animate Bone Minions',2],
  ['Grenth\'s Fingers','Plague Signet',1.5], ['Plague Touch','Poisoned Heart',2],
].concat(root.GW_SYNERGY && root.GW_SYNERGY.edges ? root.GW_SYNERGY.edges : []);
// Gemessene Paare aus PvX (build_data.py): [a, b, Gewicht, Anzahl Leisten] – echte Synergien, aber Meta-nah
const PVX_EDGES = (root.GWDATA && root.GWDATA.pvxEdges) || [];
const EDGE_MAP = new Map();
function addEdge(a, b, w, src) {
  for (const [x, y] of [[a, b], [b, a]]) {
    if (!EDGE_MAP.has(x)) EDGE_MAP.set(x, new Map());
    const old = EDGE_MAP.get(x).get(y);
    if (!old || w > old.w || src === 'custom') EDGE_MAP.get(x).set(y, {w: Math.max(w, old ? old.w : 0), src: src === 'custom' ? 'custom' : (old && old.src === 'core' ? 'core' : src)});
  }
}
// Kanten-Konfiguration (Oberfläche → "Verbindungen"): Basis-Kanten und PvX-Kanten abschaltbar, eigene Kanten dazu
let EDGE_CFG = {core: true, pvx: true, custom: []};
function setEdgeConfig(cfg) {
  EDGE_CFG = Object.assign({core: true, pvx: true, custom: []}, cfg || {});
  EDGE_MAP.clear();
  if (EDGE_CFG.core) for (const [a, b, w] of EDGES) addEdge(a, b, w, 'core');
  if (EDGE_CFG.pvx) for (const [a, b, w] of PVX_EDGES) addEdge(a, b, w, 'pvx');
  for (const [a, b, w] of EDGE_CFG.custom || []) addEdge(a, b, Math.max(0.5, Math.min(3, +w || 2)), 'custom');
}
setEdgeConfig();
// PvX-Kanten wirken bei hoher Weirdness schwächer, damit schräge Leisten keine Meta-Kopien werden
function edgeScore(s, bar, tw) {
  const m = EDGE_MAP.get(s.n.en); if (!m) return 0;
  let g = 0; for (const b of bar) { const e = m.get(b.n.en); if (e) g += e.w / 3 * (e.src === 'pvx' ? lerp(1, 0.35, tw || 0) : 1); }
  return g;
}

// Motor: prüfen, ob er in einem Skill-Pool machbar ist, und welche Skills ihn tragen
function motorHit(m, s, ctx) {
  if (m.special === 'attune') return s.attune.length > 0 || (s.tags.has('spell') && s.a >= 8 && s.a <= 11);
  if (m.special === 'longcast') return s.tags.has('spell') && s.p !== 5 && (s.act || 0) >= 2 && (s.tags.has('dmg') || HEAL.some(h => s.tags.has(h)));
  if (m.special === 'primexploit') return s.p && s.p !== ctx.primary && primBenefit(s, ctx.primary, ctx.mode) >= 0.9;
  if (m.special === 'halfrange') return s.p === 7 && s.tags.has('spell') && (s.tags.has('dmg') || s.tags.has('kd') || s.n.en === 'Deadly Haste');
  if (m.stack) return s.tags.has(m.stack);
  return m.prod.some(t => s.tags.has(t)) || m.cons.some(t => s.tags.has(t));
}
function motorIsPayoff(m, s) {
  if (m.special === 'attune') return s.attune.length > 0;
  if (m.special === 'halfrange') return s.n.en === 'Dancing Daggers' || s.n.en === 'Deadly Haste';
  if (m.special || m.stack) return false;
  return m.cons.some(t => s.tags.has(t));
}
function motorFeasible(m, pool, ctx) {
  if (m.prim && !m.prim.includes(ctx.primary)) return false;
  if (m.fam === 'weapon' && ctx.fam === 'caster') return false;
  if (m.fam && m.fam !== 'weapon' && m.fam !== ctx.fam) return false;
  if (m.id === 'items' && ctx.fam !== 'caster' && !ctx.lateWeird) return false;
  if (m.special === 'attune') return pool.some(s => s.attune.length && pool.filter(x => x.a === s.attune[0]).length >= 3);
  if (m.special === 'longcast') return pool.filter(s => motorHit(m, s, ctx)).length >= 2;
  if (m.special === 'primexploit') return pool.filter(s => motorHit(m, s, ctx)).length >= 3;
  if (m.special === 'halfrange') return pool.filter(s => motorHit(m, s, ctx)).length >= 3;
  if (m.stack) return pool.filter(s => s.tags.has(m.stack)).length >= m.min + 1;
  const cons = pool.filter(s => m.cons.some(t => s.tags.has(t)));
  const prod = pool.filter(s => m.prod.some(t => s.tags.has(t)) && !cons.includes(s));
  return cons.length >= 1 && prod.length >= (m.thr || 1);
}
function motorRealized(m, bar, ctx) {
  const hits = bar.filter(s => motorHit(m, s, ctx));
  if (m.special === 'attune') return bar.some(s => s.attune.length && attrCount(s.attune[0], bar, s) >= 2);
  if (m.special) return hits.length >= 2;
  if (m.stack) return hits.length >= m.min - 1;
  return bar.some(s => m.cons.some(t => s.tags.has(t)) && needsOf(s, bar).some(n => m.cons.includes(n.k) && n.have >= 1));
}
function motorWeight(m, tw) {
  const near = Math.exp(-Math.pow(m.wild - tw, 2) / 0.18);
  return near * (TUN.motorWeights[m.id] ?? 1);
}
// Spielgefühl: was sich beim Spielen gut anfühlt
function funScore(s, bar, fam, motors) {
  let g = 0; const t = s.tags;
  const tempo = bar.filter(b => b.tags.has('gapclose') || b.tags.has('speed') || b.tags.has('attackbuff')).length;
  if ((t.has('gapclose') || t.has('speed') || t.has('attackbuff')) && tempo < 2) g += TUN.tempo;
  if (t.has('dmg') && (t.has('aoe') || t.has('kd'))) g += TUN.payoff;
  const stackTags = new Set(motors.filter(m => m.stack).map(m => m.stack).concat(motors.flatMap(m => m.prod || [])));
  const same = bar.filter(b => b.t === s.t).length;
  if (same >= 3 && ![...stackTags].some(x => t.has(x)) && !t.has('attack')) g -= TUN.sameType * (same - 2);
  if (MELEE.has(fam) && t.has('spell') && (s.act || 0) >= 2) g -= TUN.longCastMelee;
  if (s.up && bar.some(b => b.up)) g -= TUN.maintained;
  // Anti-Synergien: siehe conflictsOf (wird in score() als Differenz eingerechnet)
  // Nutznießer ohne Auslöser fühlt sich tot an
  const dead = needsOf(s, bar).filter(n => n.have === 0 && !n.hard).length;
  if (dead && !motors.some(m => motorIsPayoff(m, s))) g -= TUN.deadPayoff * Math.min(dead, 2);
  return g;
}

// ---------- Anti-Synergien: Zustandsmodell (v6, Grundlage: Guild Wars Wiki 30.09.2026) ----------
// a = Tag(s) des auslösenden Skills, b/test = wer sich damit beißt; w = Abzug je Partner; free = so viele Partner sind noch okay
const hasAny = (s, tags) => (Array.isArray(tags) ? tags : [tags]).some(t => s.tags.has(t));
const CONFLICT_RULES = [
  {id:'hpdir', a:'needs_lowhp', b:['needs_morehp','hp_keep_high'], w:3, txt:{de:'will wenig Leben – der Partner will viel', en:'wants low health – partner wants high health'}},
  {id:'lowhp_maxhp', a:'needs_lowhp', b:['maxhp'], w:3, txt:{de:'mehr maximale Lebenspunkte schwächen den Effekt', en:'extra max health weakens it'}},
  {id:'lowhp_heal', a:'needs_lowhp', b:['heal_self'], w:0.7, cap:2, txt:{de:'Selbstheilung hält die Lebenspunkte hoch', en:'self-healing keeps your health high'}},
  {id:'highhp_sac', a:['needs_morehp','hp_keep_high'], b:['lowhp_src'], w:1.2, cap:2.4, txt:{de:'Opfern senkt die eigenen Lebenspunkte', en:'sacrifice lowers your own health'}},
  {id:'ench_ends', a:'ends_on_ench', b:['self_ench'], w:1, hardIf: y => y.up, txt:{de:'endet durch die eigene Verzauberung', en:'ended by your own enchantment'}},
  {id:'otherench_ends', a:'ends_on_otherench', b:['self_ench'], w:0.6, cap:1.8, txt:{de:'endet bei der nächsten Verzauberung', en:'ends when you cast another enchantment'}},
  {id:'attack_ends', a:'ends_on_attack', b:['attack'], w:0.8, once:true, free:1, txt:{de:'endet, sobald du angreifst', en:'ends as soon as you attack'}},
  {id:'adrenal_ends', a:'ends_on_adrenal', b:['adrenal'], w:0.7, cap:2.1, txt:{de:'endet bei Adrenalin-Skills', en:'ends when you use adrenal skills'}},
  {id:'attackskill_ends', a:'ends_on_attackskill', b:['attack'], w:0.4, free:1, cap:1.6, txt:{de:'endet bei Angriffs-Skills', en:'ends when you use attack skills'}},
  {id:'nonhex_ends', a:'ends_on_nonhex', test: y => !y.tags.has('hex'), w:0.3, free:2, cap:1.5, txt:{de:'endet bei jedem Nicht-Verhexungs-Skill', en:'ends on any non-hex skill'}},
  {id:'nonadrenal_ends', a:'ends_on_nonadrenal', test: y => !y.ad, w:0.35, free:2, cap:2, txt:{de:'endet bei Skills ohne Adrenalin', en:'ends on non-adrenal skills'}},
  {id:'move_ends', a:'ends_on_move', b:['speed','gapclose'], w:0.6, cap:1.2, txt:{de:'endet, wenn du dich bewegst', en:'ends when you move'}},
  {id:'adrdump', a:'adr_dump', test: y => y.ad && !y.tags.has('adr_dump'), w:0.3, free:2, cap:1.2, txt:{de:'wirft das Adrenalin der anderen Skills weg', en:'dumps the adrenaline your other skills need'}},
  {id:'edump', a:'e_dump', b:['needs_bigenergy'], w:1.5, txt:{de:'leert die Energie, die der Partner braucht', en:'empties the energy the partner needs'}},
  {id:'nospells', a:'no_spells', test: y => y.tags.has('spell'), w:0.5, hardAt:5, txt:{de:'solange aktiv, keine Zauber', en:'no spells while active'}},
  {id:'selfkd', a:'needs_selfkd', b:['stability'], w:2, txt:{de:'Standfestigkeit verhindert das eigene Niederwerfen', en:'stability prevents your own knockdown'}},
  {id:'selfcond_cleanse', a:'needs_selfcond', test: y => y.tags.has('rm_cond_self') && !y.tags.has('cond'), w:1, txt:{de:'entfernt die Zustände, die der Skill braucht', en:'removes the conditions it feeds on'}},
  {id:'foecond', a:'rm_foe_cond', test: y => y.tags.has('cond'), w:0.5, cap:2, txt:{de:'nimmt Gegnern die eigenen Zustände wieder weg', en:'strips the conditions you applied'}},
  {id:'selfench', a:'anti:selfench', b:['self_ench'], w:1.6, txt:{de:'entfernt alle eigenen Verzauberungen', en:'removes all your enchantments'}},
];
const DIS_GROUP = {all: () => true, attack: y => y.tags.has('attack'), nonattack: y => !y.tags.has('attack'), spell: y => y.tags.has('spell'),
  signet: y => y.tags.has('signet'), stance: y => y.tags.has('stance'), ench: y => y.tags.has('ench'), nonA: y => !!y.p && y.p !== 7,
  nonMe: y => !!y.p && y.p !== 5, attr13: y => y.a === 13};
const DIS_NAME = {all:{de:'alle Skills',en:'all skills'}, attack:{de:'Angriffe',en:'attacks'}, nonattack:{de:'Nicht-Angriffe',en:'non-attacks'},
  spell:{de:'Zauber',en:'spells'}, signet:{de:'Siegel',en:'signets'}, stance:{de:'Haltungen',en:'stances'}, ench:{de:'Verzauberungen',en:'enchantments'},
  nonA:{de:'Nicht-Assassinen-Skills',en:'non-Assassin skills'}, nonMe:{de:'Nicht-Mesmer-Skills',en:'non-Mesmer skills'}, attr13:{de:'Heilgebete',en:'Healing Prayers'}};
const CONFLICT_A = new Set(CONFLICT_RULES.flatMap(r => Array.isArray(r.a) ? r.a : [r.a]));
function disOf(s) {
  if (!s._dis) s._dis = [...s.tags].filter(t => t.startsWith('dis:')).map(t => { const [, g, sec] = t.split(':'); return {g, sec: +sec}; });
  return s._dis;
}
function isConflictSource(s) { if (s._cs === undefined) s._cs = disOf(s).length > 0 || [...CONFLICT_A].some(t => s.tags.has(t)); return s._cs; }
// Alle Anti-Synergien einer Leiste: {s, with:[Partner], id, w, sev:'hard'|'soft', txt}
function conflictsOf(bar) {
  const out = [];
  for (const s of bar) {
    if (!isConflictSource(s)) continue;
    for (const r of CONFLICT_RULES) {
      if (!hasAny(s, r.a)) continue;
      const partners = bar.filter(y => y !== s && (r.test ? r.test(y) : hasAny(y, r.b)));
      const n = partners.length - (r.free || 0);
      if (n <= 0) continue;
      let w = r.once ? r.w : r.w * n; if (r.cap) w = Math.min(w, r.cap);
      const hard = (r.hardIf && partners.some(r.hardIf)) || (r.hardAt && partners.length >= r.hardAt);
      out.push({s, with: partners, id: r.id, w, sev: hard ? 'hard' : 'soft', txt: r.txt});
    }
    for (const d of disOf(s)) {
      const partners = bar.filter(y => y !== s && DIS_GROUP[d.g] && DIS_GROUP[d.g](y));
      if (!partners.length) continue;
      const per = d.sec >= 10 ? 1 : d.sec >= 5 ? 0.5 : 0.2;
      const nm = DIS_NAME[d.g] || {de: d.g, en: d.g};
      out.push({s, with: partners, id: 'dis:' + d.g, w: per * partners.length, sev: d.sec >= 8 && partners.length >= 5 ? 'hard' : 'soft',
        txt: {de: 'sperrt ' + nm.de + ' für ' + d.sec + ' s', en: 'disables ' + nm.en + ' for ' + d.sec + 's'}});
    }
  }
  return out;
}
function conflictPenalty(bar) { let p = 0; for (const c of conflictsOf(bar)) p += c.sev === 'hard' ? 6 : c.w; return p; }
const CONFLICT_SHOW = 0.6;   // ab diesem Gewicht erscheint ein Konflikt auf der Karte

// ---------- Primärattribute (Stand: Guild Wars Wiki, 29.09.2026) ----------
// Wie stark profitiert ein Skill vom Primärattribut der Primärprofession? (0 = gar nicht)
function primBenefit(s, primary, mode) {
  const t = s.tags;
  switch (primary) {
    case 1: return t.has('attack') && s.fam !== 'pet' ? 1 : 0;                                   // Stärke: Rüstungsdurchdringung
    case 2: return (t.has('attack') || t.has('touch') || t.has('ritual') || s.p === 2) && s.en ? 0.3 + s.en / 15 : 0; // Fachkenntnis
    case 3: return s.p === 3 && t.has('spell') && (HEAL.some(h => t.has(h)) || t.has('prot') || t.has('rm_cond') || t.has('rm_hex')) ? 1 : 0;
    case 4: return mode !== 'pve' ? 0 : (t.has('aoe') && t.has('dmg') ? 0.7 : t.has('minion') ? 0.7 : s.en >= 10 ? 0.4 : 0.1);
    case 5: return s.p === 5 && (t.has('spell') || t.has('signet')) ? 0.8 : (t.has('spell') && s.act >= 2 ? 1.3 : 0);
    case 6: return t.has('needs_bigenergy') ? 1.5 : s.en >= 15 ? 0.8 : s.en >= 10 ? 0.5 : 0;
    case 7: return t.has('attack') || t.has('needs_crit') ? 1 : 0;
    case 8: return t.has('spirit') || t.has('minion') || t.has('creature') ? 1 : t.has('weaponspell') ? 0.9 : 0;
    case 9: return t.has('shoutchant') ? 1 : 0;
    case 10: return t.has('dench') && s.en ? 0.4 + s.en / 15 : 0;
  }
  return 0;
}

// ---------- Spaß-Kerne (nur ab Weirdness 7) ----------
const CORES = root.GW_CORES || [];

// ---------- Zufall ----------
function rngFrom(seed) {
  let a = seed >>> 0;
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function pickW(rng, items, wf) {
  let tot = 0; const ws = items.map(x => { const w = Math.max(0, wf(x)); tot += w; return w; });
  if (tot <= 0) return items.length ? items[Math.floor(rng() * items.length)] : null;
  let r = rng() * tot;
  for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- Daten je Modus ----------
const CACHE = {};
function view(mode) {
  if (CACHE[mode]) return CACHE[mode];
  const skills = [];
  for (const s of root.GWDATA.skills) {
    if (mode === 'pvp' && s.rp) continue;
    let v = s;
    if (mode === 'pvp' && s.pvp) v = Object.assign({}, s, s.pvp, {id: s.id, pvpId: s.pvp.id, isPvpVersion: true});
    v = Object.assign({}, v); v.tags = new Set(v.g); v.fam = v.w;
    v.m = mode === 'pvp' ? (s.mp ?? s.m ?? 0) : (s.m ?? 0);   // Meta-Wert 0–1 (PvX), getrennt nach Modus
    v.attune = [...v.tags].filter(x => x.startsWith('attune:')).map(x => +x.split(':')[1]);
    skills.push(v);
  }
  const byId = new Map(skills.map(s => [s.id, s]));
  const byName = new Map(skills.map(s => [s.n.en, s]));
  const attrsByProf = {};
  for (const s of skills) { if (s.a < 0 || s.a >= 900 || !s.p) continue; (attrsByProf[s.p] = attrsByProf[s.p] || new Set()).add(s.a); }
  CACHE[mode] = {skills, byId, byName, attrsByProf, charm: byName.get('Charm Animal')};
  return CACHE[mode];
}

function famOK(skillFam, buildFam) {
  if (!skillFam) return true;
  if (buildFam === 'caster') return false;
  if (skillFam === buildFam || skillFam === 'any' || skillFam === 'pet') return true;
  if (skillFam === 'melee') return MELEE.has(buildFam);
  if (skillFam === 'ranged') return buildFam === 'bow' || buildFam === 'spear';
  return false;
}
// Harte Waffen-/Ausrüstungsbedingungen eines Skills für einen Archetyp
function gearOK(s, fam, relax) {
  relax = relax || {};
  const t = s.tags;
  if (t.has('attack') && !famOK(s.fam, fam)) return false;
  if (s.wr && s.wr !== fam) return false;
  if (t.has('melee_only') && !MELEE.has(fam)) return false;
  if (t.has('needs_shield') && TWO_HANDED.has(fam)) return false;
  if (t.has('nondagger') && (fam === 'dagger' || fam === 'caster')) return false;
  if (t.has('needs_attack') && fam === 'caster') return false;
  if ((fam === 'bow' || fam === 'spear') && t.has('closerange') && !relax.range) return false; // Fernkampf + Nahbereich = keine Synergie
  // Waffen-Skills eines anderen Waffenattributs (z. B. Sensenbeherrschungs-Angriffe mit Dolchen) skalieren nicht mit der getragenen Waffe
  if (fam !== 'caster' && t.has('attack') && WEAPON_MASTERY.has(s.a) && s.a !== WEAPON_ATTR[fam] && !relax.weapon) return false;
  return true;
}

// ---------- Rollen ----------
function quotas(role) {
  return Object.assign({}, {
    dmg: {dmg:4, sustain:1, energy:1}, heal: {heal:4, rm:1, energy:1, prot:0}, prot: {prot:3, heal:1, rm:1, energy:1},
    support: {util:4, dmg:1, energy:1}, tank: {defense:2, attack:2, sustain:1, ctrl:1}, duel: {dmg:3, sustain:2, defense:1, rm:1, ctrl:1},
  }[role]);
}
function counts(bar) {
  const c = {dmg:0, sustain:0, energy:0, heal:0, rm:0, prot:0, util:0, defense:0, attack:0, ctrl:0, rez:0};
  for (const s of bar) {
    const t = s.tags;
    if (t.has('dmg')) c.dmg++;
    if (t.has('heal_self') || t.has('defense')) c.sustain++;
    if (t.has('energy')) c.energy++;
    if (HEAL.some(h => t.has(h))) c.heal++;
    if (t.has('rm_cond') || t.has('rm_hex')) c.rm++;
    if (t.has('prot')) c.prot++;
    if (UTIL.some(x => t.has(x)) || t.has('utility')) c.util++;
    if (t.has('defense') || t.has('stability')) c.defense++;
    if (t.has('attack')) c.attack++;
    if (['snare','kd','interrupt','c_cripple','control','c_blind','c_weakness'].some(x => t.has(x))) c.ctrl++;
    if (t.has('rez')) c.rez++;
  }
  return c;
}
function roleGain(s, c, q) {
  const t = s.tags; let g = 0;
  const add = (k, w) => { g += Math.max(0, (q[k] || 0) - c[k]) > 0 ? w : w * 0.15; };
  if (t.has('dmg') && q.dmg !== undefined) add('dmg', 3);
  if ((t.has('heal_self') || t.has('defense')) && q.sustain !== undefined) add('sustain', 2.5);
  if (t.has('energy') && q.energy !== undefined) add('energy', 2);
  if (HEAL.some(h => t.has(h)) && q.heal !== undefined) add('heal', 3.2);
  if ((t.has('rm_cond') || t.has('rm_hex')) && q.rm !== undefined) add('rm', 2.2);
  if (t.has('prot') && q.prot !== undefined) add('prot', 3);
  if (UTIL.some(x => t.has(x)) && q.util !== undefined) add('util', 2.4);
  if ((t.has('defense') || t.has('stability')) && q.defense !== undefined) add('defense', 2.6);
  if (t.has('attack') && q.attack !== undefined) add('attack', 2.2);
  if (['snare','kd','interrupt','c_cripple','control','c_blind'].some(x => t.has(x)) && q.ctrl !== undefined) add('ctrl', 1.8);
  if (t.has('utility')) g += 0.3;
  return g;
}

// ---------- Mechanik-Abhängigkeiten ----------
function supply(tag, bar, except) { let n = 0; for (const b of bar) if (b !== except && b.tags.has(tag)) n++; return n; }
function attrCount(a, bar, except) { return bar.filter(b => b !== except && b.a === a).length; }
function spellsOfElements(bar, except) { return bar.filter(b => b !== except && b.tags.has('spell') && b.a >= 8 && b.a <= 11).length; }
function needsOf(s, bar) {
  const out = [];
  for (const [p, k, thr] of SYN) if (s.tags.has(k)) out.push({p, k, thr, have: supply(p, bar, s), hard: HARD_REQ.includes(k)});
  for (const a of s.attune) out.push({p: 'attr:' + a, k: 'attune', thr: 2, have: attrCount(a, bar, s), hard: false});
  if (s.tags.has('needs_elespells')) out.push({p: 'elespell', k: 'needs_elespells', thr: 3, have: spellsOfElements(bar, s), hard: false});
  return out;
}
// Nutznießer ohne jeden Auslöser: Elite, "strict"-Skills, Motor-Anker oder mehrere Skills mit demselben Bedarf
function deadPayoffs(bar, anchors) {
  const out = [];
  for (const s of bar) for (const n of needsOf(s, bar)) {
    if (n.hard || n.have > 0 || SOFT_NEEDS.has(n.k)) continue;
    const same = n.k === 'attune' ? bar.filter(b => b.attune.includes(+n.p.slice(5))).length : bar.filter(b => b.tags.has(n.k)).length;
    if (s.tags.has('strict') || s.e || (anchors && anchors.has(s.id)) || same >= 2) { out.push({s, k: n.k}); break; }
  }
  return out;
}
// Was fehlt noch, damit geplante Motoren laufen und kein Nutznießer tot bleibt? (Liste von Prüf-Funktionen)
function openNeeds(bar, motors, ctx, anchors) {
  const out = [];
  for (const m of motors) {
    if (motorRealized(m, bar, ctx)) continue;
    if (m.special === 'attune') {
      const at = bar.find(s => s.attune.length);
      out.push(at ? (s => s.a === at.attune[0] && s.tags.has('spell')) : (s => s.attune.length > 0));
    } else if (m.special || m.stack) out.push(s => motorHit(m, s, ctx));
    else {
      const ns = bar.flatMap(c => needsOf(c, bar).filter(n => m.cons.includes(n.k)));
      if (ns.length) out.push(s => ns.some(n => producesFor(s, n)));
      else out.push(s => m.cons.some(t => s.tags.has(t)));
    }
  }
  for (const d of deadPayoffs(bar, anchors)) { const n = needsOf(d.s, bar).find(x => x.k === d.k); if (n) out.push(s => producesFor(s, n)); }
  return out;
}
function unmet(bar) {
  const list = [];
  for (const s of bar) for (const n of needsOf(s, bar)) if (n.have < n.thr) list.push(Object.assign({s}, n));
  return list;
}
function producesFor(s, need) {
  if (need.p.startsWith('attr:')) return s.a === +need.p.slice(5);
  if (need.p === 'elespell') return s.tags.has('spell') && s.a >= 8 && s.a <= 11;
  return s.tags.has(need.p);
}
function synergy(s, bar, theme) {
  let g = 0;
  for (const n of needsOf(s, bar)) g += n.have >= n.thr ? 1.6 : (n.have > 0 ? 0.6 : -0.4);
  for (const u of unmet(bar)) if (producesFor(s, u)) g += u.hard ? 5 : 2.2;
  for (const [p, k] of SYN) if (s.tags.has(p) && bar.some(b => b.tags.has(k))) g += 0.5;
  if (theme && s.tags.has(theme.tag)) g += 2.2;
  return Math.min(g, 8);
}
// Energiekosten inkl. Rabatt durch Fachkenntnis (Waldläufer) bzw. Mystik (Derwisch), grob mit Rang ~10
function effCost(s, primary) {
  if (!s.en) return 0;
  if (primary === 2 && (s.tags.has('attack') || s.tags.has('touch') || s.tags.has('ritual') || s.p === 2)) return s.en * 0.6;
  if (primary === 10 && s.tags.has('dench')) return s.en * 0.6;
  return s.en;
}
function energyLoad(bar, primary) {
  let e = 0;
  for (const s of bar) {
    if (s.en) e += effCost(s, primary) / Math.max(s.rc || 0, (s.act || 0) + (s.ac || 0.75) + 1, 2);
    if (s.up) e += Math.abs(s.up) * 0.33;
  }
  return e;
}

// ---------- Build erzeugen ----------
function coreFits(c, opt, V, mode) {
  if (c.pveOnly && mode !== 'pve') return false;
  if (opt.primary && !c.p.includes(opt.primary)) return false;
  if (opt.role && opt.role !== 'duel' && opt.role !== (c.role || 'dmg')) return false;
  return (c.must || []).every(n => V.byName.has(n));
}
function pickPair(rng, opt, role, tw, affExp, motor) {
  let primary = opt.primary;
  if (!primary && motor && motor.prim) primary = motor.prim[Math.floor(rng() * motor.prim.length)];
  const PP = opt._profs;   // nur gesetzt, wenn eine Skill-Basis filtert: Professionen ohne genug Skills fallen weg
  if (PP && primary && !PP.prim.has(primary) && !opt.primary) primary = undefined;
  if (!primary && role && role !== 'duel') primary = pickW(rng, PP ? [...PP.prim] : [1,2,3,4,5,6,7,8,9,10], p => Math.pow(AFF[p][role], affExp));
  if (!primary) primary = PP ? [...PP.prim][Math.floor(rng() * PP.prim.size)] : 1 + Math.floor(rng() * 10);
  const secs = [1,2,3,4,5,6,7,8,9,10].filter(p => p !== primary && (!PP || PP.sec.has(p)));
  const secondary = opt.secondary || pickW(rng, secs, p => CONVENTIONAL.has(primary + '-' + p) ? lerp(4, 0.6, tw) : 1);
  return [primary, secondary];
}
function accessible(V, primary, secondary) {
  const acc = new Set(V.attrsByProf[primary] || []);
  for (const a of V.attrsByProf[secondary] || []) if (a !== PRIMARY_ATTR[secondary]) acc.add(a);
  return acc;
}
// Waffe nur, wenn ihr Waffenattribut über Primär- oder Zweitprofession verfügbar ist
function weaponOK(V, primary, secondary, fam, relax) {
  return fam === 'caster' || (relax && relax.weapon) || accessible(V, primary, secondary).has(WEAPON_ATTR[fam]);
}
// Full Bravery: Professionen so wählen, dass die gelockerte Regel überhaupt greifen kann
function braveProfs(rng, primary, secondary, relax, fixedPrim) {
  const req = [];
  if (relax.urn) req.push([8]);                    // Urnen und Aschen sind Ritualisten-Skills
  if (relax.range) req.push([2, 9]);               // Bogen oder Speer
  if (relax.weapon) req.push([1, 2, 7, 9, 10]);    // Professionen mit Angriffsfertigkeiten
  const ok = (p, q) => p !== q && req.every(r => r.includes(p) || r.includes(q));
  if (!req.length || ok(primary, secondary)) return [primary, secondary];
  const all = [1,2,3,4,5,6,7,8,9,10];
  const prims = fixedPrim ? [primary] : [primary].concat(all.filter(p => p !== primary).sort(() => rng() - 0.5));
  for (const p of prims) { const secs = all.filter(q => ok(p, q)); if (secs.length) return [p, secs[Math.floor(rng() * secs.length)]]; }
  return [primary, secondary];
}
function famsFor(V, primary, secondary, relax) {
  const fams = new Set(['caster']);
  for (const s of V.skills) if ((s.p === primary || s.p === secondary) && s.fam && s.fam !== 'pet' && s.fam !== 'any') {
    if (s.fam === 'melee') ['axe','sword','hammer','dagger','scythe'].forEach(f => fams.add(f));
    else if (s.fam === 'ranged') { fams.add('bow'); fams.add('spear'); } else fams.add(s.fam);
  }
  return [...fams].filter(f => weaponOK(V, primary, secondary, f, relax));
}
function buildPool(V, primary, secondary, fam, relax) {
  const secPrim = PRIMARY_ATTR[secondary];
  relax = relax || {};
  return V.skills.filter(s => {
    if (s.p && s.p !== primary && s.p !== secondary) return false;
    if (s.p === secondary && s.a === secPrim && !relax.secprim) return false;
    if (!gearOK(s, fam, relax)) return false;
    if (s.fam === 'pet' && primary !== 2 && secondary !== 2) return false;
    return true;
  });
}

function genBuild(opt) {
  const mode = opt.mode || 'pve';
  const weird = Math.min(10, Math.max(1, opt.weird || 5));
  const tw = (weird - 1) / 9;
  const rng = opt.rng || rngFrom(opt.seed || (Math.random() * 2 ** 32));
  const V = view(mode);
  const affExp = lerp(1.6, 0.2, tw);
  // Skill-Basis (freigeschaltet/Kampagnen): welche Professionen tragen noch eine Primär- bzw. Zweitrolle?
  if (opt.filter && !opt._profs) {
    const n = {}; for (const s of V.skills) if (s.p && opt.filter(s)) n[s.p] = (n[s.p] || 0) + 1;
    const prim = new Set([1,2,3,4,5,6,7,8,9,10].filter(p => (n[p] || 0) >= 10)), sec = new Set([1,2,3,4,5,6,7,8,9,10].filter(p => (n[p] || 0) >= 3));
    if (!prim.size || sec.size < 2) return null;
    opt = Object.assign({}, opt, {_profs: {prim, sec}});
  }
  // Full Bravery: n zufällige Regeln lockern (ohne Haken wird kein Zufall verbraucht → alte Links bleiben gleich)
  const relax = {}, bravery = [];
  const nb = Math.min(3, Math.max(0, opt.bravery | 0));
  if (nb) { const ids = BRAVERY.map(r => r.id); for (let i = 0; i < nb; i++) { const id = ids.splice(Math.floor(rng() * ids.length), 1)[0]; relax[id] = true; bravery.push(id); } }
  if (opt.relax) for (const id of opt.relax) if (!relax[id]) { relax[id] = true; bravery.push(id); }

  // Pick your core: selbst gewählter Elite – die Leiste wächst um ihn herum (keine festen Kerne, kein Motor vorab)
  const E = opt.elite ? V.byId.get(+opt.elite) : null;
  if (opt.elite && (!E || !E.e)) return null;
  // seltene feste Kerne (nur noch Weirdness 9–10)
  let core = null;
  if (!E && opt.cores !== false && (opt.forceCore || rng() < (TUN.coreChance[weird] || 0))) {
    const fits = CORES.filter(c => coreFits(c, opt, V, mode) && (!opt.forceCore || c.id === opt.forceCore)
      && (!opt.filter || (c.must || []).every(n => { const s = V.byName.get(n); return s && opt.filter(s); })));
    core = fits.length ? fits[Math.floor(rng() * fits.length)] : null;
  }
  // Motor zuerst? Dann werden Professionen und Waffe passend zum Motor gesucht.
  let firstMotor = null;
  if (!core && !E && (opt.forceMotor || rng() < lerp(TUN.motorFirst[0], TUN.motorFirst[1], tw))) {
    const cand = MOTORS.filter(m => (!opt.primary || !m.prim || m.prim.includes(opt.primary)) && (!opt.forceMotor || m.id === opt.forceMotor)
      && (!opt._profs || !m.prim || m.prim.some(p => opt._profs.prim.has(p))));
    firstMotor = pickW(rng, cand, m => motorWeight(m, tw));
  }

  for (let attempt = 0; attempt < 50; attempt++) {
    if (firstMotor && attempt === 30 && !opt.forceMotor) firstMotor = null; // Motor nicht machbar → organisch
    let role = opt.role;
    let primary, secondary;
    if (core) { primary = core.p[Math.floor(rng() * core.p.length)]; secondary = core.s ? core.s[Math.floor(rng() * core.s.length)] : pickPair(rng, {primary}, role, tw, affExp)[1]; }
    else if (E && E.p) {
      // Elite-Profession wird Primär (Pflicht, wenn der Elite ihr Primärattribut nutzt) oder Zweitprofession
      const asPrim = E.a === PRIMARY_ATTR[E.p] || opt.primary === E.p || (opt.primary ? false : rng() < 0.6);
      if (asPrim) [primary, secondary] = pickPair(rng, Object.assign({}, opt, {primary: E.p}), role, tw, affExp);
      else [primary, secondary] = pickPair(rng, Object.assign({}, opt, {secondary: E.p}), role, tw, affExp);
    }
    else {
      [primary, secondary] = pickPair(rng, opt, role, tw, affExp, firstMotor);
      if (attempt < 30) [primary, secondary] = braveProfs(rng, primary, secondary, relax, !!opt.primary);
    }
    if (secondary === primary) continue;
    if (!role) role = mode === 'pvp' ? 'duel' : (core || firstMotor) ? pickW(rng, ['dmg','dmg','support','tank'], r => r === 'tank' && !firstMotor ? 0 : Math.pow(AFF[primary][r], affExp * 0.5)) : pickW(rng, ['dmg','heal','prot','support','tank'], r => Math.pow(AFF[primary][r], affExp));

    let fam;
    if (core) {
      const cf = core.auto ? core.fam : core.fam.filter(f => weaponOK(V, primary, secondary, f, relax));
      if (!cf.length) { if (attempt > 5) core = null; continue; }
      fam = cf[Math.floor(rng() * cf.length)];
    } else {
      let famList = famsFor(V, primary, secondary, relax);
      const braveWeapon = relax.range || relax.weapon || relax.urn;
      if ((role === 'heal' || role === 'prot') && !braveWeapon) famList = weird >= 7 ? famList : ['caster'];
      if (role === 'tank') famList = famList.filter(f => MELEE.has(f));
      // Full Bravery: gelockerte Waffenregeln werden auch genutzt (nach vielen Fehlversuchen nicht mehr erzwungen)
      if (attempt < 30) {
        if (relax.range) famList = famList.filter(f => f === 'bow' || f === 'spear');
        if (relax.weapon) famList = famList.filter(f => f !== 'caster' && !weaponOK(V, primary, secondary, f));
        if (relax.urn) famList = famList.filter(f => f !== 'caster');
      }
      if (firstMotor && firstMotor.fam) famList = famList.filter(f => firstMotor.fam === 'weapon' ? f !== 'caster' : f === firstMotor.fam);
      if (E) famList = famList.filter(f => gearOK(E, f, relax));   // Elite-Angriff bestimmt die Waffe
      if (!famList.length) continue;
      const martialPrim = primary === 1 || primary === 7;
      fam = pickW(rng, famList, f => (NATURAL[primary].includes(f) ? lerp(7, 0.7, tw) : (f === 'caster' ? lerp(1.2, 1, tw) : (martialPrim || (firstMotor && firstMotor.fam === 'weapon') ? lerp(1, 2, tw) : 1)))
        * (relax.weapon && !weaponOK(V, primary, secondary, f) ? 4 : 1) * (relax.range && (f === 'bow' || f === 'spear') ? 2.5 : 1) * (relax.urn && f !== 'caster' ? 1.5 : 1));
    }
    if (role === 'tank' && !MELEE.has(fam)) role = 'dmg';

    let pool = buildPool(V, primary, secondary, fam, relax);
    if (opt.filter) pool = pool.filter(s => s === V.charm || s === E || opt.filter(s));   // freigeschaltete Skills, Kampagnen
    if (E && !pool.includes(E)) continue;
    const inPool = new Set(pool.map(s => s.id));
    const ctx = {primary, secondary, fam, mode, lateWeird: weird >= 9, relax};

    // Motoren festlegen
    const motors = [];
    if (firstMotor) { if (!motorFeasible(firstMotor, pool, ctx)) continue; motors.push(firstMotor); }
    else if (E) {
      // Motoren, in denen der gewählte Elite mitspielt, haben Vorrang
      const ok = MOTORS.filter(m => motorFeasible(m, pool, ctx) && motorHit(m, E, ctx));
      if (ok.length && rng() < 0.85) motors.push(pickW(rng, ok, m => motorWeight(m, tw) + 0.2));
    }
    else if (!core && rng() < lerp(TUN.anyMotor[0], TUN.anyMotor[1], tw)) {
      const ok = MOTORS.filter(m => motorFeasible(m, pool, ctx));
      if (ok.length) motors.push(pickW(rng, ok, m => motorWeight(m, tw)));
    }
    if (motors.length && rng() < lerp(TUN.secondMotor[0], TUN.secondMotor[1], tw)) {
      const ok = MOTORS.filter(m => !motors.includes(m) && motorFeasible(m, pool, ctx));
      if (ok.length) motors.push(pickW(rng, ok, m => motorWeight(m, tw)));
    }
    const motorTag = s => motors.some(m => motorHit(m, s, ctx));

    const bar = [];
    if (E) bar.push(E);
    if (core) {
      let ok = true;
      for (const n of core.must || []) { const s = V.byName.get(n); if (s && inPool.has(s.id)) bar.push(s); else ok = false; }
      for (const [names, k] of core.one || []) {
        const cand = names.map(n => V.byName.get(n)).filter(s => s && inPool.has(s.id) && !bar.includes(s) && !(s.e && bar.some(b => b.e)));
        if (cand.length < k) { ok = false; break; }
        for (let i = 0; i < k; i++) bar.push(cand.splice(Math.floor(rng() * cand.length), 1)[0]);
      }
      if (ok && core.secSpells) {
        const cand = pool.filter(s => s.p === secondary && s.tags.has('spell') && s.tags.has('dmg') && (s.act || 0) >= core.secSpells.minAct && !s.e && !bar.includes(s));
        if (cand.length < core.secSpells.k) ok = false;
        else for (let i = 0; i < core.secSpells.k; i++) bar.push(cand.splice(Math.floor(rng() * cand.length), 1)[0]);
      }
      if (!ok || bar.filter(s => s.e).length > 1) { if (attempt > 5) core = null; continue; }
    }

    // Attributlinien – Motor-Skills ziehen ihre Attribute mit
    const q = quotas(role);
    const secPrim = PRIMARY_ATTR[secondary];
    const attrScore = {};
    for (const s of pool) {
      if (s.a < 0 || s.a >= 900) continue;
      let fb = motorTag(s) ? 3 : 0;
      if (core) for (const f of [...(core.favor || []), ...Object.keys(core.minTag || {})]) if (s.tags.has(f)) fb += core.minTag && core.minTag[f] ? 6 : 2.5;
      attrScore[s.a] = (attrScore[s.a] || 0) + roleGain(s, counts([]), q) + (s.tags.has('attack') ? 1.5 : 0) + s.m * lerp(1.5, -0.5, tw) + primBenefit(s, primary, mode) * 0.8 + fb;
    }
    const attrs = Object.keys(attrScore).map(Number).filter(a => attrScore[a] > 0 && a !== secPrim);
    if (!attrs.length) continue;
    const own = new Set(V.attrsByProf[primary] || []);
    const profW = a => own.has(a) ? lerp(8, 1, tw) : 1;
    const expo = lerp(2.2, 0.8, tw);
    const chosen = [];
    const coreAttrs = [];
    for (const s of bar) if (s.a >= 0 && s.a < 900 && s.a !== secPrim && !coreAttrs.includes(s.a)) coreAttrs.push(s.a);
    const wa = WEAPON_ATTR[fam];
    if (core && wa !== undefined && attrs.includes(wa) && !core.auto) chosen.push(wa);
    for (const a of coreAttrs) if (chosen.length < 3 && !chosen.includes(a)) chosen.push(a);
    if (!chosen.length) {
      const ownAttrs = attrs.filter(a => own.has(a));
      if (wa !== undefined && attrs.includes(wa) && rng() < lerp(0.92, 0.55, tw)) chosen.push(wa);
      else if (weird <= 3 && ownAttrs.length) chosen.push(pickW(rng, ownAttrs, a => Math.pow(attrScore[a], expo)));
      else chosen.push(pickW(rng, attrs, a => Math.pow(attrScore[a], expo) * profW(a) * (a === PRIMARY_ATTR[primary] ? lerp(1.4, 1, tw) : 1)));
    }
    const rest = () => attrs.filter(a => !chosen.includes(a));
    if (chosen.length < 2 && rest().length) chosen.push(pickW(rng, rest(), a => Math.pow(attrScore[a], expo) * profW(a)));
    if (chosen.length < 3 && rest().length && rng() < (motors.length ? 0.6 : 0.45)) chosen.push(pickW(rng, rest(), a => Math.pow(attrScore[a], expo * 0.8)));
    while (relax.lines && chosen.length < 4 && rest().length) chosen.push(pickW(rng, rest(), a => Math.pow(attrScore[a], expo * 0.8)));
    // Waffen-Build: Das Waffenattribut der getragenen Waffe bekommt immer eine Linie (Schaden hängt daran)
    const autoWeapon = core && core.auto;
    if (wa !== undefined && !autoWeapon && !chosen.includes(wa) && accessible(V, primary, secondary).has(wa)) {
      if (chosen.length < (relax.lines ? 4 : 3)) chosen.splice(1, 0, wa); else chosen[chosen.length - 1] = wa;
    }
    const PA = PRIMARY_ATTR[primary];
    // v6: Niedrige Weirdness – das Primärattribut bekommt eine eigene Linie, wenn es dafür Skills gibt
    if (weird <= 4 && attrs.includes(PA) && !chosen.includes(PA) && !(core && core.auto)) {
      if (chosen.length < 3) chosen.push(PA);
      else { const k = chosen.map((a, i) => [a, i]).reverse().find(([a]) => a !== wa); if (k) chosen[k[1]] = PA; }
    }
    const attrW = {}; chosen.forEach((a, i) => attrW[a] = [1, 0.62, 0.35, 0.3][i] ?? 0.3);

    const usable = pool.filter(s => s.a < 0 || s.a >= 900 || attrW[s.a] !== undefined || s.a === PA || (relax.secprim && s.a === secPrim));
    // Motoren, die mit den gewählten Attributlinien nicht laufen können, fallen weg (erzwungener Motor → neuer Versuch)
    for (let i = motors.length - 1; i >= 0; i--) if (!motorFeasible(motors[i], usable, ctx)) { if (motors[i] === firstMotor) { motors.length = 0; break; } motors.splice(i, 1); }
    if (firstMotor && !motors.length) continue;
    if (relax.urn && attempt < 30 && !usable.some(s => s.t === 25)) continue;
    const provCache = {};
    const provided = p => provCache[p] ?? (provCache[p] = usable.some(x => producesFor(x, {p})));
    const theme = opt.theme || null;
    const T = lerp(0.55, 1.4, tw);
    const favor = core ? core.favor || [] : [];

    let penLen = -1, penBase = 0;
    const score = (s, c) => {
      const syn = synergy(s, bar, theme);
      const edge = edgeScore(s, bar, tw);
      const inMotor = motorTag(s);
      let v = roleGain(s, c, q) + syn;
      const aw = s.a >= 0 && s.a < 900 ? (attrW[s.a] ?? (s.a === PA ? 0.5 : 0.2)) : 0.45;
      v *= 0.55 + aw;
      v += edge * TUN.edgeBonus;
      if (inMotor) v += TUN.motorBonus * (motors.some(m => motorIsPayoff(m, s)) && !bar.some(b => motors.some(m => motorIsPayoff(m, b))) ? 1.4 : 1);
      // Meta nur, wenn der Skill Glied einer Synergie ist
      const isLink = inMotor || edge > 0.4 || syn >= 1.5;
      v += s.m * (isLink ? TUN.metaLink : lerp(TUN.metaFiller[0], TUN.metaFiller[1], tw)) + (1 - s.m) * lerp(0, 0.6, tw);
      v += primBenefit(s, primary, mode) * lerp(0.9, 2.2, tw);
      if (s.p === secondary) v += lerp(0, 1.6, tw) + (weird >= 6 && bar.filter(b => b.p === secondary).length < 2 ? 2 : 0);
      // v6: Zweitprofession nicht übernehmen lassen – ab 4 Skills wird jeder weitere teurer, die Primärprofession behält ihren Kern
      const secN = bar.filter(b => b.p === secondary).length, priN = bar.filter(b => b.p === primary).length;
      if (s.p === secondary && secN >= 4) v -= 1.5 * (secN - 3);
      if (s.p === primary && weird >= 6 && weird <= 9 && priN < 3) v += 1.2;
      // v7: Weirdness 10 – fremde Skills, die vom eigenen Primärattribut leben, sind willkommen
      if (weird >= 10 && s.p !== primary && primBenefit(s, primary, mode) >= 0.8) v += 0.8;
      // v6: Auf niedriger Weirdness das Primärattribut der Klasse wirklich nutzen
      if (weird <= 4 && s.a === PA) v += 1.5;
      if (s.t === 25 && fam !== 'caster' && !relax.urn) v -= supply('needs_item', bar) >= 2 ? 0 : 4;
      if (relax.roles) v -= roleGain(s, c, q) * 0.6;
      // Full Bravery: gelockerte Regeln auch nutzen
      if (relax.range && (fam === 'bow' || fam === 'spear') && s.tags.has('closerange') && !bar.some(b => b.tags.has('closerange'))) v += 3;
      if (relax.urn && s.t === 25 && fam !== 'caster' && !bar.some(b => b.t === 25)) v += 4;
      if (relax.weapon && fam !== 'caster' && s.tags.has('attack') && WEAPON_MASTERY.has(s.a) && s.a !== WEAPON_ATTR[fam]) v += 1.5;
      if (relax.secprim && s.p === secondary && s.a === PRIMARY_ATTR[secondary] && !bar.some(b => b.a === s.a)) v += 3;
      if (relax.energy && s.en >= 15) v += 0.8;
      if (relax.payoff && needsOf(s, bar).length) v += 0.8;
      v += funScore(s, bar, fam, motors) * lerp(0.4, 1, tw);
      // Anti-Synergien (Zustandsmodell): Zuwachs an Konflikten kostet; Full Bravery "Selbstsabotage" sucht genau einen
      if (bar.length && (isConflictSource(s) || bar.some(isConflictSource))) {
        if (penLen !== bar.length) { penBase = conflictPenalty(bar); penLen = bar.length; }
        const delta = conflictPenalty(bar.concat([s])) - penBase;
        if (relax.sabotage) { if (penBase < CONFLICT_SHOW && delta >= CONFLICT_SHOW) v += 2.5; }
        else v -= delta * TUN.conflict * lerp(1.8, 0.9, tw);
      }
      if (fam !== 'caster' && s.tags.has('attack')) v += c.attack < 3 ? (core && core.auto ? -1 : 1.6) : (c.attack < 5 ? 0 : -2.5);
      if (fam !== 'caster' && s.tags.has('needs_attack')) v += 1;
      if (s.tags.has('rez') && mode === 'pve') v += c.rez ? -3 : (opt.needRez ? 3 : -0.8);
      if (s.rp) v -= 1.2 + 1.0 * bar.filter(b => b.rp).length;
      for (const f of favor) if (s.tags.has(f)) v += 1.8;
      if (core && core.minTag) for (const [tg, n] of Object.entries(core.minTag)) if (s.tags.has(tg) && supply(tg, bar) < n) v += 9;
      if (core && core.castTime && s.tags.has('spell') && s.p !== 5 && s.act >= core.castTime) v += 3;
      for (const m of motors) if (m.stack && s.tags.has(m.stack) && supply(m.stack, bar) < m.min) v += 4.5;
      for (const m of motors) if (!m.stack && !motorRealized(m, bar, ctx) && motorHit(m, s, ctx)) v += 1.5;
      if (opt.extra) for (const x of opt.extra) if (s.tags.has(x) && !bar.some(b => b.tags.has(x))) v += 3.5;
      const sw = TUN.skillWeights[s.n.en]; if (sw !== undefined) v += Math.log(Math.max(0.05, sw)) * 2;
      // Helden-KI: Skills, die Helden laut Wiki nicht (sinnvoll) einsetzen, nur noch auf hoher Weirdness
      if (opt.heroAI && s.tags.has('hero_bad')) v -= lerp(7, 3, tw);
      // Nutznießer, der ohne Auslöser tot wäre: ohne erreichbare Quelle praktisch ausgeschlossen
      if (!relax.payoff && !core) for (const n of needsOf(s, bar)) {
        if (n.hard || n.have > 0 || SOFT_NEEDS.has(n.k)) continue;
        if (s.e || s.tags.has('strict') || bar.some(b => b.tags.has(n.k))) v -= provided(n.p) ? 1.5 : 8;
      }
      return Math.exp(v / T);
    };

    // Motor-Nutznießer als Anker setzen (der Rest wächst drumherum)
    const anchors = new Set();
    for (const m of motors) {
      if (bar.length >= 3) break;
      const pay = usable.filter(s => !bar.includes(s) && (motorIsPayoff(m, s) || (m.special === 'longcast' && motorHit(m, s, ctx))) && !(s.e && bar.some(b => b.e)) && !needsOf(s, []).some(n => n.hard));
      if (pay.length) { const a = pickW(rng, pay, s => score(s, counts(bar))); bar.push(a); anchors.add(a.id); }
    }

    // Full Bravery: je gelockerter Regel ein Skill, der sie auch ausreizt
    const brave = f => { const c = usable.filter(s => !bar.includes(s) && !s.e && f(s) && !needsOf(s, []).some(n => n.hard)); if (c.length) bar.push(pickW(rng, c, s => score(s, counts(bar)))); };
    if (relax.range && (fam === 'bow' || fam === 'spear') && !bar.some(s => s.tags.has('closerange'))) brave(s => s.tags.has('closerange'));
    if (relax.urn && fam !== 'caster') brave(s => s.t === 25);
    if (relax.secprim) brave(s => s.p === secondary && s.a === secPrim);
    if (relax.lines && chosen.length === 4) for (const a of chosen.slice(1)) if (!bar.some(s => s.a === a)) brave(s => s.a === a);
    if (relax.energy) brave(s => s.en >= 15);
    if (relax.payoff) brave(s => needsOf(s, []).some(n => !n.hard && !SOFT_NEEDS.has(n.k)));
    if (relax.sabotage) brave(s => isConflictSource(s));

    if (!bar.some(s => s.e)) {
      const elites = usable.filter(s => s.e && !bar.includes(s) && !needsOf(s, []).some(n => n.hard));
      if (!elites.length) continue;
      bar.push(pickW(rng, elites, s => score(s, counts(bar))));
    }

    while (bar.length < 8) {
      const c = counts(bar);
      const cap = (CASTER_PRIMARY.has(primary) ? 1.7 : 1.15) + 0.45 * c.energy + (primary === 6 ? 0.3 : 0) + (relax.energy ? 2 : 0);
      const upkeep = bar.reduce((u, b) => u + Math.abs(b.up || 0), 0);
      const openHard = unmet(bar).filter(u => u.hard);
      const slotsLeft = 8 - bar.length;
      let cand = usable.filter(s => {
        if (s.e || bar.some(b => b.id === s.id || b.n.en === s.n.en)) return false;
        if (s.rp && bar.filter(b => b.rp).length >= 2) return false;
        if (s.ad && bar.filter(b => b.ad).length >= (bar.some(b => b.tags.has('adr_gain')) ? 4 : 3)) return false;
        if (s.ad && fam === 'caster' && !bar.some(b => b.tags.has('adr_gain')) && !s.tags.has('adr_gain')) return false;
        if (s.fam === 'pet' && !bar.some(b => b.tags.has('pet'))) return false;
        if (s.t === 25 && fam !== 'caster' && weird < 9 && !relax.urn) return false; // Urne/Asche legt die Waffe ab
        if (energyLoad(bar.concat([s]), primary) > cap + 0.25 && !s.tags.has('energy')) return false;
        if (s.up && upkeep + Math.abs(s.up) > (relax.energy ? 5 : 3)) return false;
        if (mode === 'pvp' && (s.tags.has('rez') || (s.tags.has('corpse') && !s.tags.has('dmg')))) return false;
        const hardNew = needsOf(s, bar).filter(n => n.hard && n.have < n.thr);
        if (hardNew.length && slotsLeft - 1 < hardNew.length + openHard.length) return false;
        return true;
      });
      if (openHard.length && slotsLeft <= openHard.length + 1) {
        const prod = cand.filter(s => openHard.some(u => producesFor(s, u)));
        if (prod.length) cand = prod;
      } else if (!relax.payoff && !core) {
        // Auslöser nachziehen, solange noch Platz ist
        const open = openNeeds(bar, motors, ctx, anchors);
        if (open.length && slotsLeft <= open.length + 2) {
          const prod = cand.filter(s => open.some(f => f(s)));
          if (prod.length) cand = prod;
        }
      }
      if (!cand.length) break;
      const pick = pickW(rng, cand, s => score(s, c));
      bar.push(pick);
      if (pick.fam === 'pet' && !bar.some(b => b.tags.has('pet')) && V.charm && bar.length < 8) bar.push(V.charm);
    }
    if (bar.length < 8) continue;
    bar.length = 8;

    // Auslöser-Prüfung: geplanter Motor muss laufen, kein Nutznießer ganz ohne Quelle
    if (!relax.payoff && !core) {
      const um = motors.filter(m => !motorRealized(m, bar, ctx)), dp = deadPayoffs(bar, anchors);
      if (um.length || dp.length) { if (opt._dbg) { um.forEach(m => opt._dbg['motor:' + m.id] = (opt._dbg['motor:' + m.id] || 0) + 1); dp.forEach(d => opt._dbg['dead:' + d.k] = (opt._dbg['dead:' + d.k] || 0) + 1); } continue; }
    }
    const build = finalize({mode, weird, role, primary, secondary, fam, attrs: chosen, bar, theme, seed: opt.seed, core, relax, bravery, attempt, picked: E ? E.id : undefined,
      motors: motors.filter(m => motorRealized(m, bar, ctx)), motorsPlanned: motors.map(m => m.id)});
    const issues = validate(build);
    if (!issues.hard.length && quotaOK(build)) return build;
  }
  if (core && !opt._retry) return genBuild(Object.assign({}, opt, {cores: false, _retry: true}));
  if (opt.primary && !opt.fixedPrimary && !opt._retry2) return genBuild(Object.assign({}, opt, {primary: undefined, _retry2: true}));
  return null;
}

// Sichtbare Verbindungen einer fertigen Leiste (für Karte und Visualisierung)
function linksOf(bar) {
  const out = [], seen = new Set();
  for (const s of bar) {
    for (const n of needsOf(s, bar)) {
      if (n.have < 1) continue;
      const p = bar.find(b => b !== s && producesFor(b, n));
      if (!p) continue;
      const key = p.id + '>' + s.id; if (seen.has(key)) continue; seen.add(key);
      out.push({from: p, to: s, kind: n.k});
    }
    const m = EDGE_MAP.get(s.n.en);
    if (m) for (const b of bar) if (b.id > s.id && m.has(b.n.en)) { const key = s.id + '~' + b.id; if (!seen.has(key)) { seen.add(key); out.push({from: s, to: b, kind: 'edge'}); } }
  }
  return out;
}

function quotaOK(b) {
  const c = counts(b.bar); const q = quotas(b.role);
  // v6: ab Weirdness 6 trägt die Primärprofession mindestens 3 Skills (Stufe 10: 2) – keine reine Zweitprofessions-Leiste
  const priN = b.bar.filter(s => s.p === b.primary).length;
  if (!(b.core && b.core.auto) && priN < (b.core ? 2 : b.weird <= 4 ? 4 : b.weird >= 10 ? 0 : 3)) return false;
  // v7: Weirdness 10 – nur 0–1 Skills der Primärprofession, wenn das Primärattribut trotzdem trägt (Rang ≥ 9 und spürbarer Nutzen)
  if (b.weird >= 10 && !b.core && priN < 2) {
    const PA = PRIMARY_ATTR[b.primary], r = (b.attributes.find(([a]) => a === PA) || [0, 0])[1];
    const ben = b.bar.reduce((t, s) => t + primBenefit(s, b.primary, b.mode), 0) + (b.primary === 6 ? 0.8 : 0) + (b.primary === 4 && b.mode === 'pve' ? 1.5 : 0);
    if (r < 9 || ben < 2.5) return false;
  }
  // v6: Niedrige Weirdness – das Primärattribut der Klasse liegt nie brach (aktiv genutzt oder passiv mit echtem Nutzen)
  if (b.weird <= 4 && !b.core && !b.attributes.some(([a, r]) => a === PRIMARY_ATTR[b.primary] && r >= 8)) return false;
  if (b.relax && b.relax.roles) return !(b.weird >= 6 && !b.core && b.bar.filter(s => s.p === b.secondary).length < 2) && c.attack >= (b.fam !== 'caster' && !(b.core && b.core.auto) ? 2 : 0);
  const relax = b.core ? 1 : 0;
  const min = {dmg: q.dmg ? Math.max(b.role === 'duel' ? 2 : 1, q.dmg - 2 - relax) : 0, heal: q.heal ? q.heal - 1 : 0, prot: q.prot ? q.prot - 1 : 0,
    util: q.util ? q.util - 1 : 0, defense: q.defense ? 1 : 0, sustain: q.sustain && !relax ? 1 : 0};
  for (const k in min) if (c[k] < min[k]) return false;
  if (b.weird >= 6 && !b.core && b.bar.filter(s => s.p === b.secondary).length < 2) return false;
  const needAtt = b.core && b.core.auto ? 0 : (b.fam !== 'caster' ? ((b.role === 'dmg' || b.role === 'tank' || b.role === 'duel') && !b.core ? 3 : 2) : 0);
  return c.attack >= needAtt;
}

// ---------- Attributpunkte ----------
// 200 Punkte: aktive Linien nach Skill-Anzahl, Primärattribut passiv nach Nutzen für diese Leiste.
function allocate(b) {
  const V = view(b.mode), relax = b.relax || {};
  const PA = PRIMARY_ATTR[b.primary], SP = PRIMARY_ATTR[b.secondary];
  const acc = accessible(V, b.primary, b.secondary);
  // Linien nur für Attribute, die die Leiste nutzt, die Waffe braucht oder die als Primärattribut etwas bringen
  const cnt = {};
  for (const s of b.bar) if (s.a >= 0 && s.a < 900 && s.a !== SP && acc.has(s.a)) cnt[s.a] = (cnt[s.a] || 0) + 1 + (s.e ? 1 : 0);
  const wa = b.fam !== 'caster' && !(b.core && b.core.auto) ? WEAPON_ATTR[b.fam] : undefined;
  const lines = [];
  // Das Primärattribut zählt nie als eine der drei Linien (es wirkt immer, auch passiv)
  for (const a of Object.keys(cnt).map(Number)) lines.push({a, w: cnt[a], active: a !== PA, min: a === PA ? 3 : 0});
  if (wa !== undefined && acc.has(wa)) {
    const l = lines.find(x => x.a === wa);
    if (l) { l.w += 1.2; l.min = 9; l.active = true; } else lines.push({a: wa, w: 1.2, active: true, min: 9, weapon: true});
  }
  let benefit = b.bar.reduce((t, s) => t + primBenefit(s, b.primary, b.mode), 0);
  if (b.primary === 4 && b.mode === 'pve') benefit += 1.5;
  if (b.primary === 6) benefit += 0.8;
  const pl = lines.find(l => l.a === PA);
  // v6: Niedrige Weirdness – Primärattribut nie brachliegen lassen, wenn es allgemein hilft (Energiespeicherung, Seelensammlung in PvE)
  const alwaysUseful = b.primary === 6 || (b.primary === 4 && b.mode === 'pve');
  if (pl) { pl.w += benefit * 0.7; if (b.weird <= 4) pl.min = Math.max(pl.min || 0, 8); }
  else if (b.weird <= 4 && (alwaysUseful || benefit >= 1)) lines.push({a: PA, w: Math.max(1.2, benefit * 0.7), active: false, min: 8});
  else if (benefit >= (b.weird <= 4 ? 1.5 : 2)) lines.push({a: PA, w: benefit * 0.7, active: false, min: 0});
  if (!lines.length) return {ranks: [], points: 0, passive: [], weaponAttr: null};
  // höchstens 3 (bzw. 4) aktive Linien: schwächste aktive Linie ohne Waffenbezug fällt weg
  const maxActive = relax.lines ? 4 : 3;
  lines.sort((x, y) => y.w - x.w);
  while (lines.filter(l => l.active).length > maxActive) {
    const drop = lines.filter(l => l.active && !l.min).pop(); if (!drop) break; lines.splice(lines.indexOf(drop), 1);
  }
  const f = r => r - 0.025 * r * r;
  let best = null;
  const others = lines.slice(1);
  const rec = (i, ranks, cost) => {
    if (cost > 200) return;
    if (i === others.length) {
      const v = others.reduce((t, l, k) => t + l.w * f(ranks[k]), 0);
      if (!best || v > best.v) best = {v, ranks: ranks.slice()};
      return;
    }
    for (let r = Math.max(others[i].active ? 3 : 0, others[i].min || 0); r <= 12; r++) { ranks.push(r); rec(i + 1, ranks, cost + COST[r]); ranks.pop(); }
  };
  rec(0, [], COST[12]);
  const out = [[lines[0].a, 12]];
  others.forEach((l, k) => { if (best && best.ranks[k] > 0) out.push([l.a, best.ranks[k]]); });
  return {ranks: out, points: out.reduce((t, [, r]) => t + COST[r], 0), passive: lines.filter(l => !l.active).map(l => l.a),
    weaponAttr: wa !== undefined && out.some(([a]) => a === wa) ? wa : null};
}

function finalize(b) {
  const alloc = allocate(b);
  b.attributes = alloc.ranks; b.points = alloc.points; b.passive = alloc.passive.filter(a => alloc.ranks.some(([x]) => x === a));
  b.weaponAttr = alloc.weaponAttr;
  const order = new Map(alloc.ranks.map(([a], i) => [a, i]));
  b.bar.sort((x, y) => (y.e - x.e) || ((order.get(x.a) ?? 9) - (order.get(y.a) ?? 9)) || (x.id - y.id));
  b.code = encodeTemplate(b.primary, b.secondary, alloc.ranks, b.bar.map(s => s.id));
  b.effective = {};
  alloc.ranks.forEach(([a, r], i) => { b.effective[a] = r + (i === 0 ? 4 : i === 1 ? 1 : 0); });
  b.primaryRank = b.effective[PRIMARY_ATTR[b.primary]] || 0;
  b.links = linksOf(b.bar);
  b.conflicts = conflictsOf(b.bar).filter(c => c.sev === 'hard' || c.w >= CONFLICT_SHOW);
  b.name = nameBuild(b);
  b.braveUsed = braveUsed(b);
  return b;
}

function validate(b) {
  const hard = [], soft = [];
  if (new Set(b.bar.map(s => s.id)).size !== 8) hard.push('doppelte Skills');
  if (b.bar.filter(s => s.e).length > 1) hard.push('mehr als ein Elite');
  const relax = b.relax || {};
  if (b.attributes.filter(([a]) => a !== PRIMARY_ATTR[b.primary]).length > (relax.lines ? 4 : 3)) hard.push('zu viele aktive Attributlinien');
  const V = view(b.mode);
  if (!weaponOK(V, b.primary, b.secondary, b.fam, relax) && !(b.core && b.core.auto)) hard.push('Waffenattribut nicht verfügbar: ' + b.fam);
  if (b.fam !== 'caster' && !relax.weapon && !(b.core && b.core.auto) && !b.weaponAttr) hard.push('Waffenattribut ohne Punkte');
  const used = new Set(b.bar.map(s => s.a));
  for (const [a] of b.attributes) if (!used.has(a) && a !== b.weaponAttr && a !== PRIMARY_ATTR[b.primary]) hard.push('Attribut ohne Nutzen: ' + a);
  if (b.points > 200) hard.push('Attributpunkte > 200');
  for (const s of b.bar) {
    if (s.p && s.p !== b.primary && s.p !== b.secondary) hard.push('fremde Profession: ' + s.n.en);
    if (s.p === b.secondary && s.a === PRIMARY_ATTR[b.secondary] && !relax.secprim) hard.push('Primärattribut der Zweitprofession: ' + s.n.en);
    if (s.a >= 0 && s.a < 900 && !b.attributes.some(([a]) => a === s.a)) soft.push('Attribut ohne Punkte: ' + s.n.en);
    if (!gearOK(s, b.fam, relax)) hard.push('Ausrüstung passt nicht: ' + s.n.en);
    if (b.mode === 'pvp' && s.rp) hard.push('PvE-Skill im PvP: ' + s.n.en);
    if (s.fam === 'pet' && !b.bar.some(x => x.tags.has('pet'))) hard.push('Tierangriff ohne Tier');
    if (s.ad && b.fam === 'caster' && !b.bar.some(x => x.tags.has('adr_gain'))) hard.push('Adrenalin ohne Quelle: ' + s.n.en);
    if (s.t === 25 && b.fam !== 'caster' && !relax.urn && b.bar.filter(x => x.tags.has('needs_item')).length < 2) hard.push('Gegenstandszauber ohne Nutzen im Waffen-Build: ' + s.n.en);
  }
  for (const u of unmet(b.bar)) (u.hard ? hard : soft).push((u.hard ? 'Kombokette fehlt: ' : 'Synergie fehlt: ') + u.s.n.en);
  for (const c of conflictsOf(b.bar)) if (c.sev === 'hard') (relax.sabotage ? soft : hard).push('Konflikt: ' + c.s.n.en + ' ↔ ' + c.with.map(x => x.n.en).join(', '));
  if (b.bar.filter(s => s.rp).length > 2) soft.push('mehr als 2 PvE-Skills');
  return {hard, soft};
}

// Welche gelockerten Regeln hat dieser Build tatsächlich ausgereizt?
function braveUsed(b) {
  const V = view(b.mode), c = counts(b.bar), used = [];
  const cap = (CASTER_PRIMARY.has(b.primary) ? 1.7 : 1.15) + 0.45 * c.energy + (b.primary === 6 ? 0.3 : 0);
  for (const id of b.bravery || []) {
    let u = false;
    if (id === 'range') u = (b.fam === 'bow' || b.fam === 'spear') && b.bar.some(s => s.tags.has('closerange'));
    if (id === 'weapon') u = b.fam !== 'caster' && (!weaponOK(V, b.primary, b.secondary, b.fam) || b.bar.some(s => s.tags.has('attack') && WEAPON_MASTERY.has(s.a) && s.a !== WEAPON_ATTR[b.fam]));
    if (id === 'urn') u = b.fam !== 'caster' && b.bar.some(s => s.t === 25);
    if (id === 'lines') u = b.attributes.filter(([a]) => a !== PRIMARY_ATTR[b.primary]).length > 3;
    if (id === 'energy') u = energyLoad(b.bar, b.primary) > cap + 0.25 || b.bar.reduce((t, s) => t + Math.abs(s.up || 0), 0) > 3;
    if (id === 'payoff') u = deadPayoffs(b.bar).length > 0;
    if (id === 'roles') u = !quotaOK(Object.assign({}, b, {relax: {}}));
    if (id === 'secprim') u = b.bar.some(s => s.p === b.secondary && s.a === PRIMARY_ATTR[b.secondary]);
    if (id === 'sabotage') u = conflictsOf(b.bar).some(c => c.sev === 'hard' || c.w >= CONFLICT_SHOW);
    if (u) used.push(id);
  }
  return used;
}

// ---------- Punkte (Logbuch) ----------
// Punkte = Basis je Art × (1 + 0,08 je Weirdness-Stufe über 1) × (1 + 0,25 je wirksamer Full-Bravery-Regel); gescheitert = 0.
// Teams: Mittelwert über die Mitglieder.
const POINTS_BASE = {nm: 10, hm: 20, vq: 40};
function braveMult(b) {
  const ms = b.members ? b.members : [b];
  const w = ms.reduce((t, m) => t + (m.weird || 1), 0) / ms.length;
  const used = ms.reduce((t, m) => t + ((m.braveUsed || []).length), 0) / ms.length;
  return Math.round((1 + 0.08 * (w - 1)) * (1 + 0.25 * used) * 100) / 100;
}
function points(kind, b, ok) { return ok === false ? 0 : Math.round((POINTS_BASE[kind] || 0) * braveMult(b)); }

// ---------- Build-Namen (Community-Jargon, in DE und EN gleich) ----------
// Zusammengesetzt aus Motto (Motor), Stil (Waffe/Touch) und Klasse – keine festen Namen für feste Leisten.
const SHORT = {1:'War', 2:'Ranger', 3:'Monk', 4:'Necro', 5:'Mes', 6:'Ele', 7:'Sin', 8:'Rit', 9:'Para', 10:'Derv'};
const WEAPON_WORD = {axe:'Axe', sword:'Sword', hammer:'Hammer', dagger:'Dagger', scythe:'Scythe', spear:'Spear', bow:'Bow'};
const MOTOR_EPI = {burning:'Burning', wounds:'Bleeding', cripple:'Crippling', weakness:'Weakening', cracked:'Armor-Cracking', conds:'Condition',
  hexes:'Hex', kd:'KD', selfcond:'Masochist', selfkd:'Drunken', dervish:'Enchant-Eating', enchcount:'Enchant-Stacking', signets:'Signet',
  shouts:'Shouting', weaponspell:'Weapon-Spell', items:'Bundle', spirits:'Spirit', creatures:'Minion', waterhex:'Frosty', overcast:'Overcast',
  health:'Beefy', lowhp:'Daredevil', bigenergy:'Big-Energy', crit:'Crit', adrenaline:'Adrenal', combo:'Combo', attune:'Attuned', gapmelee:'Leaping',
  touch:'Touch', longcast:'Fast-Cast', teleport:'Blinking', aoe:'AoE', interrupt:'Interrupt', edenial:'E-Denial', halfrange:'Dagger-Tossing', primexploit:'Loophole'};
const MOTOR_SUFFIX = {burning:'on Fire', wounds:'of Open Wounds', cripple:'of Limping Foes', weakness:'of Feeble Foes', cracked:'of Cracked Armor',
  conds:'of Ailments', hexes:'of Hexes', kd:'of Knockdowns', selfcond:'in Pain', selfkd:'Who Meant to Do That', dervish:'of Fleeting Blessings',
  enchcount:'of Many Enchantments', signets:'of Many Signets', shouts:'of Loud Noises', weaponspell:'with Spirit Weapons', items:'with Baggage',
  spirits:'and Friends', creatures:'and Minions', waterhex:'on Ice', overcast:'on the Edge', health:'with Big Health', lowhp:'on the Brink', bigenergy:'with a Big Tank',
  crit:'of Crits', adrenaline:'on Adrenaline', combo:'of Combos', attune:'in Tune', gapmelee:'in Your Face', touch:'with Grabby Hands',
  longcast:'in No Time', teleport:'on the Move', aoe:'of Area Damage', interrupt:'of Interruptions', edenial:'of Empty Bars',
  halfrange:'of Flying Daggers', primexploit:'of Borrowed Power'};
const ATTR_EPI = {0:'Fast-Cast', 1:'Illusion', 2:'Domination', 3:'Inspiration', 4:'Blood', 5:'Death', 6:'Soul', 7:'Curse', 8:'Air', 9:'Earth',
  10:'Fire', 11:'Water', 12:'Energy', 13:'Heal', 14:'Smite', 15:'Prot', 16:'Boon', 17:'Strength', 21:'Tactics', 22:'Beast', 23:'Expertise',
  24:'Wilderness', 25:'Marksman', 30:'Deadly', 31:'Shadow', 32:'Communing', 33:'Resto', 34:'Channeling', 35:'Crit', 36:'Spawning',
  38:'Command', 39:'Motivation', 40:'Leadership', 42:'Wind', 43:'Earth', 44:'Mystic'};
const ROLE_EPI = {heal:'Heal', prot:'Prot', support:'Support', tank:'Tank'};
function styleOf(b) {
  const p = b.primary, f = b.fam, W = WEAPON_WORD[f];
  const touch = (b.motors || []).some(m => m.id === 'touch') || b.bar.filter(s => s.tags.has('touch')).length >= 3;
  if (touch && p === 2) return {nick: 'Touch Ranger', eat: 'touch'};
  if (touch && f === 'caster') return [4, 5, 6].includes(p) ? {nick: 'Touch Mage', eat: 'touch'} : {style: 'Touch', eat: 'touch'};
  if (f === 'caster') {
    if (p === 4 && ((b.motors || []).some(m => m.id === 'creatures') || b.bar.filter(s => s.tags.has('minion')).length >= 3)) return {nick: 'Minion Master', eat: 'creatures'};
    if (p === 8 && ((b.motors || []).some(m => m.id === 'spirits') || b.bar.filter(s => s.tags.has('spirit')).length >= 3)) return {nick: 'Spirit Spammer', eat: 'spirits'};
    if (p === 6 && (b.motors || []).some(m => m.id === 'aoe')) return {nick: 'Nuker', eat: 'aoe', attr: true};
    if (p === 1) return {nick: 'Wand Warrior'};
    if (p === 2) return {nick: 'Bowless Ranger'};
    return [7, 9, 10].includes(p) ? {style: 'Caster'} : {};
  }
  if (NATURAL[p].includes(f)) return p === 1 ? {style: W} : {};
  if (p === 3 && f === 'hammer') return {nick: 'Bonk Monk'};
  if (p === 6 && MELEE.has(f)) return {nick: 'Melee Ele', eat: 'gapmelee'};
  if (p === 5 && MELEE.has(f)) return {nick: 'Melee Mesmer', eat: 'gapmelee'};
  if (p === 4 && f === 'scythe') return {nick: 'Grim Reaper'};
  if (p === 4 && (f === 'sword' || f === 'axe' || f === 'hammer')) return {nick: 'Death Knight'};
  return {style: W};
}
// ---------- Kult-Namen: Meme, Popkultur, GW-Insider (DE und EN gleich). Erste passende Regel gewinnt. ----------
const hasN = (b, n) => b.bar.some(s => s.n.en === n);
const nT = (b, t) => b.bar.filter(s => s.tags.has(t)).length;
const nA = (b, a) => b.bar.filter(s => s.a === a).length;
const MEME = [
  ['Task Failed Successfully', b => (b.braveUsed || []).includes('sabotage')],
  ['Mending Whammo', b => b.primary === 1 && hasN(b, 'Mending')],
  ['Splinter Barrage', b => hasN(b, 'Splinter Weapon') && hasN(b, 'Barrage')],
  ['Permasin', b => b.primary === 7 && hasN(b, 'Shadow Form')],
  ['Obby {c}', b => hasN(b, 'Obsidian Flesh')],
  ['Bear Necessities {c}', b => hasN(b, 'Ursan Blessing')],
  ['Lord of the Rituals', b => hasN(b, 'Ritual Lord')],
  ["Don't Panic {c}", b => hasN(b, 'Panic')],
  ['Healing Signet Enjoyer', b => b.primary === 1 && hasN(b, 'Healing Signet')],
  ['Smite Club', b => b.primary === 3 && nA(b, 14) >= 4],
  ['Nothing Personnel {c}', b => nT(b, 'gapclose') >= 3],
  ['Neo {c}', b => hasN(b, '"Dodge This!"')],
  ['Gru {c}', b => nT(b, 'minion') >= 3],
  ['Ghostbuster {c}', b => nT(b, 'spirit') >= 4],
  ['Team Edward {c}', b => b.bar.filter(s => /Vampiric|Blood Drinker/.test(s.n.en)).length >= 2],
  ['Blood for the Blood God', b => nT(b, 'sacrifice') >= 3 || nA(b, 4) >= 5],
  ['Flesh Wound {c}', b => (b.motors || []).some(m => m.id === 'lowhp') || nT(b, 'needs_lowhp') >= 2],
  ['This Is Fine {c}', b => nT(b, 'c_burning') >= 3],
  ['Unlimited Power {c}', b => nA(b, 8) >= 4],
  ['Let It Go {c}', b => nA(b, 11) >= 4],
  ['Rock and Stone {c}', b => nA(b, 9) >= 4],
  ['Spin to Win', b => b.primary === 10 && b.fam === 'scythe' && b.bar.filter(s => s.tags.has('attack') && s.tags.has('aoe')).length >= 2],
  ['This Is Sparta', b => b.primary === 9 && b.fam === 'spear' && nT(b, 'shoutchant') >= 3],
  ['Hammer Time', b => b.fam === 'hammer' && nT(b, 'kd') >= 3],
  ["It's a Trap {c}", b => nT(b, 'trap') >= 3],
  ["Gotta Charm 'Em All", b => nT(b, 'pet') >= 2 && nA(b, 22) >= 4],
  ['Indiana Jones {c}', b => b.bar.filter(s => s.t === 25).length >= 2],
  ['Leeroy {c}', b => MELEE.has(b.fam) && nT(b, 'shout') >= 4],
  ['My Precious {c}', b => nT(b, 'signet') >= 5],
  ['Pocket Sand {c}', b => nT(b, 'c_blind') >= 2],
  ['Kneecapper {c}', b => nT(b, 'c_cripple') >= 3],
  ['Paper Cuts {c}', b => nT(b, 'c_bleeding') >= 3],
  ['Plague Doctor {c}', b => nT(b, 'c_disease') >= 1 && nT(b, 'cond') >= 4],
  ['Gotta Go Fast {c}', b => nT(b, 'speed') >= 3],
  ['Galaxy Brain {c}', b => nT(b, 'interrupt') >= 4],
  ['Skill Issue {c}', b => nT(b, 'edenial') >= 3],
  ['Hex Appeal {c}', b => nT(b, 'hex') >= 5],
  ['Cleanse Machine {c}', b => nT(b, 'rm_cond') >= 3],
  ['Overclocked {c}', b => nT(b, 'overcast') + nT(b, 'needs_overcast') >= 3],
  ['Unga Bunga {c}', b => MELEE.has(b.fam) && nT(b, 'attack') >= 6],
  ['Monster Energy {c}', b => nT(b, 'energy') >= 5],
];
const MEME_SPECIAL = 10;   // die ersten 10 Regeln hängen an bestimmten Skills
const MEME_SET = new Set(MEME.flatMap(([n]) => n.includes('{c}') ? Object.values(SHORT).map(c => n.replace('{c}', c)) : [n]));
const isMemeName = n => MEME_SET.has(n);
function memeName(b) {
  const i = MEME.findIndex(([, f]) => { try { return f(b); } catch (e) { return false; } });
  if (i < 0) return null;
  const hit = MEME[i];
  // stabil je Leiste; Kult-Namen sollen etwas Besonderes bleiben: Skill-Klassiker (vorne in der Liste) fast immer, Tag-Schwellen seltener
  const h = b.bar.reduce((t, s) => (t * 31 + s.id) % 1000, 7) / 1000, tw = (b.weird - 1) / 9;
  if (h > (i < MEME_SPECIAL ? lerp(0.6, 1, tw) : lerp(0.18, 0.6, tw))) return null;
  return hit[0].replace('{c}', SHORT[b.primary]);
}
// Team-Namen: Community-Klassiker und Popkultur, sonst nach Größe
const THEME_TEAM = {burning: 'This Is Fine', bleeding: 'Paper Cuts', hex: 'Hex Appeal', cond: 'Plague Inc.', kd: 'Floor Inspectors',
  interrupt: 'Interruptus', edenial: 'Skill Issue', spirit: 'Ghostbusters', shout: 'Leeroy & Friends', ench: 'Glitter Squad'};
function nameTeam(team) {
  const ms = team.members, P = p => ms.filter(m => m.primary === p).length, with_ = n => ms.filter(m => hasN(m, n)).length;
  let n = null;
  if (ms.filter(m => (m.braveUsed || []).includes('sabotage')).length >= 2) n = 'Suicide Squad';
  else if (P(5) >= 3) n = 'Mesmerway';
  else if (with_('Discord') >= 2) n = 'Discordway';
  else if (with_('Ursan Blessing') >= 3) n = 'Ursanway';
  else if (ms.length >= 6 && new Set(ms.map(m => m.primary)).size === ms.length) n = 'Avengers Assemble';
  else if (team.theme) n = THEME_TEAM[team.theme.id] || null;
  else if (ms.length >= 6 && !ms.some(m => m.primary === 3)) n = 'Monk-Free Zone';
  team.name = n || {4: 'Fantastic Four', 6: 'Six Pack', 8: "Ocean's Eight"}[team.size] || null;
  return team.name;
}
function nameBuild(b) {
  const meme = memeName(b); if (meme) return meme;
  const st = styleOf(b), ms = (b.motors || []).filter(m => m.id !== st.eat);
  const PA = PRIMARY_ATTR[b.primary];
  const lines = (b.attributes || []).map(([a]) => a).filter(a => a !== b.weaponAttr);
  const topAttr = lines.find(a => a !== PA) ?? lines[0];
  let epi = ms.length ? MOTOR_EPI[ms[0].id] : null;
  let style = st.style;
  if (!epi && (b.role === 'heal' || b.role === 'prot')) epi = ROLE_EPI[b.role];
  if (!epi && !st.nick && !style && b.fam !== 'caster') style = WEAPON_WORD[b.fam];   // "Bow Ranger", "Dagger Sin"
  if (!epi && (st.attr || style === 'Caster' || style === 'Touch' || (!st.nick && !style)) && topAttr !== undefined && topAttr !== PA) epi = ATTR_EPI[topAttr] || null;
  if (!epi && ROLE_EPI[b.role]) epi = ROLE_EPI[b.role];
  if (!epi && !st.nick && !style) epi = ATTR_EPI[topAttr] || null;
  const core = st.nick || [style, SHORT[b.primary]].filter(Boolean).join(' ');
  const suffix = b.weird >= 7 && ms.length > 1 ? MOTOR_SUFFIX[ms[1].id] : null;
  return [epi && !core.startsWith(epi) ? epi : null, core, suffix].filter(Boolean).join(' ');
}

// ---------- Vorlagencode ----------
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function encodeTemplate(p1, p2, ranks, skillIds) {
  const bits = [];
  const put = (v, n) => { for (let i = 0; i < n; i++) bits.push((v >>> i) & 1); };
  put(14, 4); put(0, 4); put(0, 2); put(p1, 4); put(p2, 4);
  put(ranks.length, 4);
  const ab = Math.max(4, Math.ceil(Math.log2(Math.max(0, ...ranks.map(r => r[0])) + 1))); put(ab - 4, 4);
  for (const [a, r] of ranks) { put(a, ab); put(r, 4); }
  const sb = Math.max(8, Math.ceil(Math.log2(Math.max(...skillIds) + 1))); put(sb - 8, 4);
  for (const id of skillIds) put(id, sb);
  let out = '';
  for (let i = 0; i < bits.length; i += 6) { let v = 0; for (let j = 0; j < 6; j++) v |= (bits[i + j] || 0) << j; out += B64[v]; }
  return out;
}
function decodeTemplate(code) {
  const bits = [];
  for (const ch of code) { const v = B64.indexOf(ch); for (let j = 0; j < 6; j++) bits.push((v >> j) & 1); }
  let pos = 0; const get = n => { let v = 0; for (let i = 0; i < n; i++) v |= bits[pos++] << i; return v; };
  if (get(4) !== 14 || get(4) !== 0) throw new Error('kein Skill-Template');
  const pb = get(2) * 2 + 4; const p1 = get(pb), p2 = get(pb);
  const na = get(4), ab = get(4) + 4; const ranks = [];
  for (let i = 0; i < na; i++) ranks.push([get(ab), get(4)]);
  const sb = get(4) + 8; const skills = []; for (let i = 0; i < 8; i++) skills.push(get(sb));
  return {p1, p2, ranks, skills};
}

// ---------- Teams (PvE): du + Helden ----------
// 31 Helden laut Guild Wars Wiki „Hero“ (Stand 10/2026). Razah kann die Profession wechseln (Joker). rf = nur im Reforged-Modus.
const HEROES = [
  {id: 'koss', n: 'Koss', p: 1}, {id: 'goren', n: 'Goren', p: 1}, {id: 'jora', n: 'Jora', p: 1}, {id: 'devona', n: 'Devona', p: 1, rf: true},
  {id: 'jin', n: 'Acolyte Jin', p: 2}, {id: 'margrid', n: 'Margrid the Sly', p: 2}, {id: 'pyre', n: 'Pyre Fierceshot', p: 2},
  {id: 'dunkoro', n: 'Dunkoro', p: 3}, {id: 'tahlkora', n: 'Tahlkora', p: 3}, {id: 'ogden', n: 'Ogden Stonehealer', p: 3},
  {id: 'mow', n: 'Master of Whispers', p: 4}, {id: 'livia', n: 'Livia', p: 4}, {id: 'olias', n: 'Olias', p: 4},
  {id: 'norgu', n: 'Norgu', p: 5}, {id: 'gwen', n: 'Gwen', p: 5}, {id: 'althea', n: 'Ghost of Althea', p: 5, rf: true},
  {id: 'sousuke', n: 'Acolyte Sousuke', p: 6}, {id: 'zhed', n: 'Zhed Shadowhoof', p: 6}, {id: 'vekk', n: 'Vekk', p: 6},
  {id: 'anton', n: 'Anton', p: 7}, {id: 'zenmai', n: 'Zenmai', p: 7}, {id: 'miku', n: 'Miku', p: 7},
  {id: 'razah', n: 'Razah', p: 8, flex: true}, {id: 'xandra', n: 'Xandra', p: 8}, {id: 'zeiri', n: 'Zei Ri', p: 8},
  {id: 'morgahn', n: 'General Morgahn', p: 9}, {id: 'hayda', n: 'Hayda', p: 9}, {id: 'keiran', n: 'Keiran Thackeray', p: 9},
  {id: 'melonni', n: 'Melonni', p: 10}, {id: 'kahmu', n: 'Kahmu', p: 10}, {id: 'mox', n: 'M.O.X.', p: 10},
];
const HERO_BY_ID = Object.fromEntries(HEROES.map(h => [h.id, h]));
// Leitplanken: Heiler und Prot nur Mönch oder Ritualist, Tank nur Nahkämpfer mit Rüstung/Schild (Krieger, Assassine, Paragon, Derwisch)
const ROLE_OK = {heal: [3, 8], prot: [3, 8], tank: [1, 10, 9, 7]};
// Guild Wars Wiki „Hero“: Helden nutzen nur auf dem Account freigeschaltete Skills und keine PvE-only-Skills.
// Zusätzliche Sperren (falls je nötig): GW_WIKI.heroBan
const HERO_BAN = new Set((root.GW_WIKI && root.GW_WIKI.heroBan) || []);
function teamRoles(size, rng) {
  const f = (a) => a[Math.floor(rng() * a.length)];
  if (size === 4) return ['heal', f(['prot','support']), 'dmg', f(['dmg','tank'])];
  if (size === 6) return ['heal', f(['heal','prot']), f(['prot','support']), 'dmg', 'dmg', f(['dmg','tank'])];
  return ['heal', 'heal', 'prot', f(['support','prot']), 'dmg', 'dmg', f(['dmg','support']), f(['tank','dmg'])];
}
// Plätze: 0 = du (Profession fest oder Zufall), danach die Helden in Wahl-Reihenfolge; leere Plätze füllt der Würfel
function teamSlots(size, opt, rng, needHeal) {
  const chosen = (opt.heroes || []).map(id => HERO_BY_ID[id]).filter(Boolean).filter((h, i, a) => a.indexOf(h) === i).slice(0, size - 1);
  const pool = HEROES.filter(h => !chosen.includes(h) && (opt.reforged !== false || !h.rf) && (!opt.profOk || h.flex || opt.profOk.has(h.p)));
  const rolled = [];
  // Der Würfel füllt zuerst so viele Mönche/Ritualisten auf, wie Heiler- und Prot-Rollen gebraucht werden
  const canHeal = h => h.flex || ROLE_OK.heal.includes(h.p);
  let have = chosen.filter(canHeal).length + (!opt.you || ROLE_OK.heal.includes(opt.you) ? 1 : 0);
  while (have < (needHeal || 0) && chosen.length + rolled.length < size - 1) {
    const hp = pool.filter(h => !h.flex && canHeal(h)); if (!hp.length) break;
    const h = hp[Math.floor(rng() * hp.length)]; pool.splice(pool.indexOf(h), 1); rolled.push(h); have++;
  }
  while (chosen.length + rolled.length < size - 1 && pool.length) rolled.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return [{kind: 'you', p: opt.you || null}].concat(chosen.map(h => ({kind: 'hero', hero: h, p: h.flex ? null : h.p})),
    rolled.map(h => ({kind: 'hero', hero: h, p: h.flex ? null : h.p, rolled: true})));
}
// Rollen auf Plätze verteilen – erst Heiler/Prot, dann Tank, dann der Rest. Freie Plätze (du mit Zufall, Razah) wählen passend.
function assignRoles(slots, roles, rng, weird) {
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const free = new Set(slots.map((_, i) => i)), out = slots.map(() => null), warn = [];
  const take = (role, preferFixed) => {
    const ok = ROLE_OK[role];
    let cand = shuffle([...free].filter(i => !ok || slots[i].p === null || ok.includes(slots[i].p)));
    if (preferFixed) cand.sort((a, b) => (slots[a].p === null) - (slots[b].p === null));   // feste Mönche/Ritualisten zuerst
    if (role === 'heal') cand.sort((a, b) => (slots[b].p === 3) - (slots[a].p === 3));
    if (!cand.length) return false;
    const i = cand[0]; free.delete(i);
    let p = slots[i].p;
    if (p === null) p = ok ? ok[Math.floor(rng() * ok.length)] : pickW(rng, [1,2,3,4,5,6,7,8,9,10], q => Math.pow(AFF[q][role], lerp(1.6, 0.4, (weird - 1) / 9)));
    out[i] = {role, p}; return true;
  };
  const order = ['heal', 'prot', 'tank', 'support', 'dmg'];
  const sorted = roles.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b));
  for (const r of sorted) {
    if (take(r, true)) continue;
    if (r === 'heal') warn.push('noheal');
    else if (r === 'prot') warn.push('noprot');
    take(r === 'tank' ? 'dmg' : 'support', false) || take('dmg', false);
  }
  return {assign: out, warn: [...new Set(warn)]};
}
function heroFilter(filter) {
  return s => !s.rp && !HERO_BAN.has(s.n.en) && (!filter || filter(s));
}
function memberBuild(team, slot, a, rng, extra) {
  const base = {mode: 'pve', weird: team.weird, role: a.role, primary: a.p, fixedPrimary: !!a.p, theme: team.theme, bravery: team.bravery,
    filter: slot.kind === 'hero' ? heroFilter(team.filter) : slot.kind === 'you' && team.youFilter ? team.youFilter : team.filter, heroAI: slot.kind === 'hero', cores: team.cores};
  let b = null;
  for (let k = 0; k < 8 && !b; k++) b = genBuild(Object.assign({}, base, extra || {}, {seed: Math.floor(rng() * 2 ** 32)}));
  if (!b) b = genBuild(Object.assign({}, base, {theme: null, seed: Math.floor(rng() * 2 ** 32)}));
  if (!b) b = genBuild(Object.assign({}, base, {theme: null, role: 'dmg', seed: Math.floor(rng() * 2 ** 32)}));
  // Eigener Charakter mit zu wenig gelernten Skills: auf den Team-Pool (alle deine Charaktere) ausweichen
  if (!b && slot.kind === 'you' && team.youFilter) { b = memberBuild(Object.assign({}, team, {youFilter: null}), slot, a, rng, extra); if (b) b.poolFallback = true; }
  if (b) b.slot = slot;
  return b;
}
function genTeam(opt) {
  const size = opt.size || 8, weird = opt.weird || 5;
  const rng = rngFrom(opt.seed || (Math.random() * 2 ** 32));
  const theme = weird >= 4 && rng() < 0.75 ? THEMES[Math.floor(rng() * THEMES.length)] : null;
  const team = {size, weird, theme, bravery: opt.bravery || 0, members: [], filter: opt.filter || null, youFilter: opt.youFilter || null, cores: opt.cores, destiny: opt.destiny || null};
  // Skill-Basis: Professionen mit zu wenigen freigeschalteten Skills kommen nicht als Zufalls-Helden
  let profOk = null;
  if (opt.filter) { const n = {}; for (const s of view('pve').skills) if (s.p && opt.filter(s)) n[s.p] = (n[s.p] || 0) + 1; profOk = new Set([1,2,3,4,5,6,7,8,9,10].filter(p => (n[p] || 0) >= 10)); }
  const roles = teamRoles(size, rng);
  const slots = teamSlots(size, Object.assign({}, opt, {profOk}), rng, roles.filter(r => r === 'heal' || r === 'prot').length);
  const {assign, warn} = assignRoles(slots, roles, rng, weird);
  team.warn = warn; team.swapped = [];
  slots.forEach((slot, i) => {
    let b = memberBuild(team, slot, assign[i], rng, {needRez: i < 3});
    if (!b && slot.kind === 'hero') {
      // Held lässt sich mit der Skill-Basis nicht bauen → Ersatz-Held, dessen Profession die Rolle tragen kann
      const used = new Set(slots.filter(x => x.hero).map(x => x.hero.id)), ok = ROLE_OK[assign[i].role];
      const alt = HEROES.filter(h => !used.has(h.id) && !h.flex && (!profOk || profOk.has(h.p)) && (!ok || ok.includes(h.p)) && (opt.reforged !== false || !h.rf));
      for (let k = 0; k < 3 && !b && alt.length; k++) {
        const h = alt.splice(Math.floor(rng() * alt.length), 1)[0], ns = {kind: 'hero', hero: h, p: h.p, rolled: true};
        b = memberBuild(team, ns, {role: assign[i].role, p: h.p}, rng, {needRez: i < 3});
        if (b) { team.swapped.push([slot.hero.id, h.id]); slots[i] = ns; }
      }
    }
    if (!b && slot.kind === 'you') b = memberBuild(team, {kind: 'you', p: null}, {role: assign[i].role, p: undefined}, rng, {});
    if (b) team.members.push(b);
  });
  fixTeam(team, rng);
  nameTeam(team);
  return team;
}
function teamCheck(team) {
  const all = team.members.flatMap(m => m.bar);
  const has = t => all.filter(s => s.tags.has(t)).length;
  const miss = [];
  if (!has('rm_cond')) miss.push('rm_cond');
  if (!has('rm_hex')) miss.push('rm_hex');
  if (has('rez') < Math.min(2, team.size / 4 + 0.5 | 0)) miss.push('rez');
  if (!team.members.some(m => m.role === 'heal')) miss.push('heal');
  return miss;
}
function fixTeam(team, rng) {
  for (let round = 0; round < 6; round++) {
    const miss = teamCheck(team);
    if (!miss.length) return;
    const idx = team.members.findIndex((m, i) => ['heal','support','prot'].includes(m.role) && (round + i) % 2 === 0);
    const i = idx >= 0 ? idx : 0, m = team.members[i];
    team.members[i] = memberBuild(team, m.slot || {kind: 'you'}, {role: m.role, p: m.primary}, rng, {needRez: miss.includes('rez'), extra: miss}) || m;
  }
}
// Einzelnes Mitglied neu würfeln: Helden behalten ihre Profession (Razah und du dürfen wechseln, aber nur innerhalb der Rollen-Leitplanken)
function rerollMember(team, i, keepProfession) {
  const m = team.members[i], slot = m.slot || {kind: 'you'};
  let p = m.primary;
  if (!keepProfession && slot.p === null) { const ok = ROLE_OK[m.role] || [1,2,3,4,5,6,7,8,9,10]; p = ok[Math.floor(Math.random() * ok.length)]; }
  const others = team.members.filter((_, j) => j !== i).flatMap(x => x.bar);
  const needRez = others.filter(s => s.tags.has('rez')).length < 2;
  let best = null;
  for (let k = 0; k < 12; k++) {
    const b = memberBuild(team, slot, {role: m.role, p}, rngFrom(Math.floor(Math.random() * 2 ** 32)), {needRez});
    if (!b) continue;
    best = b;
    if (!teamCheck(Object.assign({}, team, {members: team.members.map((x, j) => j === i ? b : x)})).length) break;
  }
  if (best) team.members[i] = best;
  return team;
}

root.GWGen = {genBuild, genTeam, motorWeight, nameTeam, isMemeName, MEME, HEROES, HERO_BY_ID, ROLE_OK, assignRoles, teamSlots, rerollMember, validate, teamCheck, encodeTemplate, decodeTemplate, view, rngFrom,
  setEdgeConfig, braveMult, points, POINTS_BASE, THEMES, CORES, MOTORS, BRAVERY, conflictsOf, conflictPenalty, CONFLICT_RULES, DIS_NAME, EDGE_MAP, PVX_EDGES, isConflictSource, nameBuild, deadPayoffs, accessible, weaponOK, WEAPON_ATTR, motorRealized, MOTOR_BY_ID, EDGES, TUN, SYN, PRIMARY_ATTR, primBenefit, counts, unmet, effCost, linksOf, motorHit, motorFeasible, buildPool};
})(typeof window !== 'undefined' ? window : globalThis);

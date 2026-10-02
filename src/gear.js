/* Waffen-Sets: zwei Sets pro Build (wie die Waffenslots im Spiel).
 * Grundlage: bekanntes GW1-Upgrade-System (Präfix, Suffix, Inschrift). Upgrade-Namen englisch, Details ohne Gewähr.
 */
(function (root) {
'use strict';
const W = {
  axe:{de:'Axt',en:'Axe',attr:18,h:1}, sword:{de:'Schwert',en:'Sword',attr:20,h:1}, hammer:{de:'Hammer',en:'Hammer',attr:19,h:2},
  dagger:{de:'Dolche',en:'Daggers',attr:29,h:2}, scythe:{de:'Sense',en:'Scythe',attr:41,h:2}, spear:{de:'Speer',en:'Spear',attr:37,h:1}, bow:{de:'Bogen',en:'Bow',attr:25,h:2},
};
const SHIELD_ATTR = [17, 21, 38, 39]; // Stärke, Taktik, Befehlsgewalt, Motivation
const ELEM = {fire:['Fiery','Feuer','fire'], cold:['Icy','Kälte','cold'], lightning:['Shocking','Blitz','lightning'], earth:['Ebon','Erde','earth']};
const PART = {axe:{de:'Axtkopf',en:'axe haft'}, sword:{de:'Schwertheft',en:'sword hilt'}, hammer:{de:'Hammerkopf',en:'hammer haft'}, dagger:{de:'Dolchgriff',en:'dagger tang'},
  scythe:{de:'Sensenschaft',en:'scythe snathe'}, spear:{de:'Speerspitze',en:'spearhead'}, bow:{de:'Bogensehne',en:'bow string'}};

function gearSets(b, L) {
  const N = root.GWDATA.names, an = a => (N.attribute[a] ? N.attribute[a][L] : '?');
  const tg = t => b.bar.filter(s => s.tags.has(t)).length;
  const has = n => b.bar.some(s => s.n.en === n);
  const attrs = b.attributes.map(([a]) => a);
  const de = L === 'de';
  const sets = [];
  const spells = b.bar.filter(s => s.tags.has('spell'));
  const coreAttr = b.attributes[0] ? b.attributes[0][0] : null;
  // häufigstes Zauber-Attribut (für Zauber-Set / Fokus)
  const spellAttr = (() => { const c = {}; for (const s of spells) if (s.a >= 0 && s.a < 900) c[s.a] = (c[s.a] || 0) + 1; const e = Object.entries(c).sort((x, y) => y[1] - x[1])[0]; return e ? +e[0] : coreAttr; })();

  if (b.fam !== 'caster') {
    const w = W[b.fam], items = [];
    const illus = has('Illusionary Weaponry');
    let weapon = w[L];
    if (b.fam === 'bow') weapon = tg('interrupt') >= 2 ? (de ? 'Kurzbogen (schnelle Pfeile für Unterbrechungen)' : 'Shortbow (fast arrows for interrupts)') : (de ? 'Flachbogen (solide Reichweite)' : 'Flatbow (solid range)');
    let req = attrs.includes(w.attr) ? (de ? `Anforderung ${an(w.attr)}` : `requirement ${an(w.attr)}`)
      : illus ? (de ? 'Anforderung egal – „Illusion der Waffen“ ersetzt den Waffenschaden' : 'requirement irrelevant – Illusionary Weaponry replaces weapon damage')
      : (de ? `keine Punkte in ${an(w.attr)}: niedrige Anforderung wählen, sonst weniger Schaden` : `no points in ${an(w.attr)}: pick a low requirement, else less damage`);
    items.push([de ? 'Waffe' : 'Weapon', `${weapon} · ${req}`]);
    // Präfix
    const el = b.bar.map(s => [...s.tags].find(x => x.startsWith('elem:'))).find(Boolean);
    let pre;
    if (illus) pre = [de ? 'beliebig' : 'any', de ? '„Illusion der Waffen“ ersetzt Waffenschaden und Trefferwirkung' : 'Illusionary Weaponry replaces weapon damage and on-hit effects'];
    else if (el) { const e = ELEM[el.slice(5)]; pre = [`${e[0]}“ (${PART[b.fam][L]})`, de ? `macht die Waffe zur ${e[1]}waffe – nötig für ${b.bar.find(s => s.tags.has('elem_weapon')).n[L]}` : `turns it into a ${e[2]} weapon – required for ${b.bar.find(s => s.tags.has('elem_weapon')).n.en}`]; }
    else if (tg('c_bleeding') >= 2) pre = ['Barbed', de ? 'Blutung hält 33 % länger' : 'Bleeding lasts 33% longer'];
    else if (tg('c_cripple') >= 2) pre = ['Crippling', de ? 'Verkrüppelung hält 33 % länger' : 'Cripple lasts 33% longer'];
    else if (tg('c_poison') >= 2) pre = ['Poisonous', de ? 'Vergiftung hält 33 % länger' : 'Poison lasts 33% longer'];
    else if (tg('c_daze') >= 1 && b.fam === 'bow') pre = ['Silencing', de ? 'Benommenheit hält 33 % länger' : 'Daze lasts 33% longer'];
    else if (tg('adrenal') >= 3) pre = ['Furious', de ? 'Chance auf doppeltes Adrenalin' : 'chance for double adrenaline'];
    else if (b.bar.filter(s => s.tags.has('attack') && s.en).length >= 3 || b.primary === 7) pre = ['Zealous', de ? '+1 Energie pro Treffer, -1 Energieregeneration' : '+1 energy per hit, -1 energy regeneration'];
    else if (tg('heal_self') + tg('defense') < 2) pre = ['Vampiric', de ? 'Lebensraub pro Treffer, -1 Lebensregeneration' : 'life steal per hit, -1 health regeneration'];
    else pre = ['Sundering', de ? 'Chance auf Rüstungsdurchdringung' : 'chance for armor penetration'];
    items.push([de ? 'Präfix' : 'Prefix', `„${pre[0].replace(/“ \(/, '“ (')}${pre[0].includes('“') ? '' : '“'} – ${pre[1]}`]);
    // Leisten, die von wenig eigenen Lebenspunkten leben (Grenth's Balance, Shroud of Distress …): kein +LP, Boni unter 50 % (Wiki: Inscription)
    const lowHp = tg('needs_lowhp') >= 1;
    const suf = lowHp ? ['of Defense', de ? '+5 Rüstung – schützt, ohne die Lebenspunkte anzuheben' : '+5 armor – protection without raising your health']
      : tg('self_ench') >= 2 ? ['of Enchanting', de ? 'eigene Verzauberungen halten 20 % länger' : 'your enchantments last 20% longer']
      : ['of Fortitude', de ? '+30 maximale Lebenspunkte' : '+30 maximum health'];
    items.push([de ? 'Suffix' : 'Suffix', `„${suf[0]}“ – ${suf[1]}`]);
    const ins = lowHp ? ['Vengeance is Mine', de ? '+10…20 % Schaden unter 50 % Lebenspunkten' : '+10…20% damage while below 50% health']
      : tg('stance') >= 2 ? ['Dance with Death', de ? '+15 % Schaden in einer Haltung' : '+15% damage while in a stance']
      : tg('self_ench') >= 1 ? ['Guided by Fate', de ? '+15 % Schaden solange verzaubert' : '+15% damage while enchanted']
      : tg('needs_hex') >= 1 || tg('hex') >= 2 ? ['Too Much Information', de ? '+15 % Schaden gegen verhexte Gegner' : '+15% damage vs hexed foes']
      : ['Strength and Honor', de ? '+15 % Schaden über 50 % Lebenspunkten' : '+15% damage while above 50% health'];
    items.push([de ? 'Inschrift' : 'Inscription', `„${ins[0]}“ – ${ins[1]}`]);
    if (w.h === 1) {
      const sa = SHIELD_ATTR.find(a => attrs.includes(a));
      items.push([de ? 'Zweithand' : 'Off-hand', sa !== undefined ? (de ? `Schild, Anforderung ${an(sa)}` : `Shield, requirement ${an(sa)}`)
        : lowHp ? (de ? 'Schild mit „Down But Not Out“ (+5…10 Rüstung unter 50 % LP) statt +LP' : 'Shield with "Down But Not Out" (+5…10 armor below 50% health) instead of +health')
        : (de ? 'Schild (ohne Punkte in Stärke/Taktik/Befehl/Motivation nur Grundrüstung) oder +LP-Schild' : 'Shield (without Strength/Tactics/Command/Motivation only base armor) or a +health shield')]);
    } else items.push([de ? 'Zweithand' : 'Off-hand', b.fam === 'dagger' ? (de ? 'zweiter Dolch (Dolche werden paarweise geführt)' : 'second dagger (daggers come as a pair)') : (de ? '– (Zweihandwaffe)' : '– (two-handed)')]);
    sets.push({title: de ? 'Set 1 · Kampf' : 'Set 1 · Combat', items});
    // Set 2: Zauber-Set, wenn viele Zauber; sonst Verteidigung / Alternative
    if (spells.length >= 3 && spellAttr !== null) {
      sets.push({title: de ? 'Set 2 · Zaubern' : 'Set 2 · Casting', items: [
        [de ? 'Waffe' : 'Weapon', de ? `Zauberstab + Fokus in ${an(spellAttr)} („40/40“: 20 % schneller wirken und aufladen)` : `Wand + focus in ${an(spellAttr)} ("40/40": 20% faster casting and recharge)`],
        [de ? 'Einsatz' : 'Use', de ? `vor Zauberketten wechseln (${spells.length} Zauber in der Leiste), danach zurück zur Waffe` : `swap before spell chains (${spells.length} spells on the bar), then back to the weapon`]]});
    } else if (el) {
      sets.push({title: de ? 'Set 2 · Ausweich-Element' : 'Set 2 · Backup element', items: [[de ? 'Waffe' : 'Weapon',
        de ? `gleiche Waffe mit anderem Elementschaden – gegen Gegner, die ${ELEM[el.slice(5)][1]} widerstehen` : `same weapon with another element – against foes resistant to ${ELEM[el.slice(5)][2]}`]]});
    } else {
      sets.push({title: de ? 'Set 2 · Verteidigung' : 'Set 2 · Defense', items: [[de ? 'Waffe' : 'Weapon',
        w.h === 1 ? (de ? `${w.de} + Schild mit Rüstung gegen die häufigste Schadensart des Gebiets` : `${w.en} + shield with armor vs the area's main damage type`)
                  : (de ? `${w[L]} „of Defense“ (+5 Rüstung) – wechseln, wenn du fokussiert wirst` : `${w[L]} "of Defense" (+5 armor) – swap when focused`)]]});
    }
  } else {
    const items = [];
    const melee = tg('closerange') >= 2;
    const itemsSpells = b.bar.filter(s => s.t === 25);
    const lowHp = tg('needs_lowhp') >= 1;
    const main = spellAttr !== null ? spellAttr : coreAttr;
    if (b.role === 'heal' || b.role === 'prot') {
      items.push([de ? 'Waffe' : 'Weapon', de ? `Zauberstab + Fokus in ${an(main)} („40/40“: 20 % schneller wirken und aufladen)` : `Wand + focus in ${an(main)} ("40/40": 20% faster casting and recharge)`]);
      items.push([de ? 'Inschrift' : 'Inscription', de ? 'Zauberstab: „Aptitude not Attitude“ (schneller wirken) · Fokus: „Forget Me Not“ (schneller aufladen)' : 'Wand: "Aptitude not Attitude" (faster casting) · focus: "Forget Me Not" (faster recharge)']);
    } else if (lowHp) {
      items.push([de ? 'Waffe' : 'Weapon', de ? `Zauberstab + Fokus in ${an(main)}, ohne +LP – die Leiste lebt von wenig Lebenspunkten` : `Wand + focus in ${an(main)}, no +health – the bar feeds on low health`]);
      items.push([de ? 'Inschrift' : 'Inscription', de ? '„Don\'t call it a comeback!“ (+2…7 Energie unter 50 % LP) auf dem Zauberstab' : '"Don\'t call it a comeback!" (+2…7 energy below 50% health) on the wand']);
    } else if (melee) {
      items.push([de ? 'Waffe' : 'Weapon', de ? `Zauberstab + Fokus mit Lebenspunkten, Attribut ${an(main)} – du stehst im Nahkampf` : `Wand + focus with health, attribute ${an(main)} – you stand in melee`]);
      items.push([de ? 'Inschrift' : 'Inscription', de ? '„Hale and Hearty“ (+1…5 Energie über 50 % LP) auf dem Zauberstab' : '"Hale and Hearty" (+1…5 energy above 50% health) on the wand']);
    } else {
      items.push([de ? 'Waffe' : 'Weapon', de ? `Stab in ${an(main)} (+Energie) oder Zauberstab + Fokus („40/40“)` : `Staff in ${an(main)} (+energy) or wand + focus ("40/40")`]);
      items.push([de ? 'Präfix/Suffix' : 'Prefix/suffix', de ? '„Insightful“ (+Energie) · „of Enchanting“ bei vielen eigenen Verzauberungen, sonst „of Mastery“ (+1 Attribut, Chance)' : '"Insightful" (+energy) · "of Enchanting" with many own enchantments, else "of Mastery" (+1 attribute, chance)']);
    }
    if (itemsSpells.length) items.push([de ? 'Hinweis' : 'Note', de ? `${itemsSpells.map(s => s.n.de).join(', ')}: Waffe wird abgelegt, solange du den Gegenstand trägst` : `${itemsSpells.map(s => s.n.en).join(', ')}: your weapon is stowed while you carry the item`]);
    sets.push({title: de ? 'Set 1 · Zaubern' : 'Set 1 · Casting', items});
    const sa = SHIELD_ATTR.find(a => attrs.includes(a));
    sets.push({title: de ? 'Set 2 · Verteidigung' : 'Set 2 · Defense', items: [[de ? 'Waffe' : 'Weapon',
      de ? `Zauberstab + Schild${sa !== undefined ? ` (Anforderung ${an(sa)})` : lowHp ? ' mit Rüstung statt +LP' : ' mit +LP'} – wechseln, wenn du fokussiert wirst` : `Wand + shield${sa !== undefined ? ` (requirement ${an(sa)})` : lowHp ? ' with armor instead of +health' : ' with +health'} – swap when focused`]]});
  }
  return sets;
}
root.GWGear = {gearSets};
})(typeof window !== 'undefined' ? window : globalThis);

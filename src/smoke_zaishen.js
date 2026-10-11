// Browser-Test Zaishen Bravery (Briefing B): ein Wurf pro Tag für alle, Wechsel 16:00 UTC, fester Pool, Link, Logbuch, Erfolge, Countdown.
// Die Uhr wird pro Browser-Kontext per addInitScript eingefroren (Date.now überschrieben).
// Aufruf: NODE_PATH=$(npm root -g) node src/smoke_zaishen.js
let chromium;
try { ({chromium} = require('playwright')); } catch (e) { console.log('Playwright fehlt – Test übersprungen.'); process.exit(0); }
const path = require('path');
const U = 'file://' + path.join(__dirname, '..', 'docs', 'index.html');
let fail = 0;
const check = (ok, msg) => { console.log((ok ? 'OK   ' : 'FAIL ') + msg); if (!ok) fail++; };
const KEY = 'gw1ub_store_v1', DAY = 864e5;
const utc = (y, m, d, h, mi, s = 0) => Date.UTC(y, m - 1, d, h, mi, s);
const dayOf = t => Math.floor((t - 16 * 3600e3) / DAY);
const params = h => Object.fromEntries(new URLSearchParams(h.replace(/^#/, '')));

(async () => {
  const browser = await chromium.launch();
  const errs = [];
  // Neuer Browser-Kontext mit eingefrorener Uhr und (optional) vorbelegtem Speicher; der Speicher wird nur gesetzt, wenn er noch leer ist
  async function open(t, store, vp) {
    const ctx = await browser.newContext({viewport: vp || {width: 1280, height: 900}});
    await ctx.addInitScript(([t, key, store]) => { Date.now = () => t; try { if (store && !localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(store)); } catch (e) {} }, [t, KEY, store || null]);   // try/catch: about:blank hat keinen Speicher
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(e.message)); page.on('dialog', d => d.accept());
    await page.goto(U); await page.waitForTimeout(250);
    return {ctx, page};
  }
  const roll = async page => { await page.click('#v-hub [data-zai]'); await page.waitForTimeout(700); };
  const state = page => page.evaluate(() => ({hash: location.hash, codes: [...document.querySelectorAll('#out [data-copy]')].map(b => b.dataset.copy),
    dt: (document.querySelector('#out .fate .dt') || {}).textContent || '', dk: (document.querySelector('#out .fate .dk') || {}).textContent || '',
    bar: (document.querySelector('#buildbar .crumb') || {}).textContent || '', snap: !!document.querySelector('.card.snap'),
    reroll: document.querySelectorAll('#bb-roll, #bb-change, #out [data-act]').length}));
  const store = page => page.evaluate(k => JSON.parse(localStorage.getItem(k) || '{}'), KEY);

  const T0 = utc(2026, 10, 11, 21, 19), D0 = dayOf(T0);   // Sonntag 11.10.2026, 21:19 UTC → Zaishen-Tag „2026-10-11“
  const other = {v: 1, base: 'mine', unlocked: [1, 2, 3], camps: [1], log: [], links: {core: false, pvx: false, cores: false, custom: []}, reforged: false, heroes: [], ach: {}, lang: 'en'};

  // 1) Zwei Browser mit sehr verschiedenen Einstellungen: gleicher Tageswurf
  const A = await open(T0), B = await open(T0, other);
  await roll(A.page); await roll(B.page);
  const sa = await state(A.page), sb = await state(B.page), pa = params(sa.hash), pb = params(sb.hash);
  check(sa.codes.length === +pa.s && sa.codes.join('.') === sb.codes.join('.'), 'Gleiche ' + sa.codes.length + ' Vorlagencodes (Teamgröße des Orts) trotz anderer Basis/Kampagnen/Verbindungen/Reforged');
  check(sa.dt && sa.dt === sb.dt, 'Gleicher Ort: ' + sa.dt.replace(/\s+/g, ' ').trim());
  check(pa.seed === pb.seed && pa.s === pb.s && pa.z === String(D0) && pb.z === String(D0) && pa.d === '1', 'Link: gleicher Seed und Teamgröße, z=Tagesnummer, d=1');
  check(!/[#&](f|fh|x|k|rf)=/.test(sa.hash), 'Link trägt keinen Pool, keine Verbindungs-Flags');
  check(/Zaishen Bravery/.test(sa.dk) && /2026-10-11/.test(sa.dk), 'Banner: „' + sa.dk.replace(/\s+/g, ' ').trim() + '“');
  check(/Zaishen Bravery/.test(sa.bar) && /W10/.test(sa.bar) && /Bravery 2/.test(sa.bar), 'Kopfzeile Sonntag: W10 + Bravery 2 (' + sa.bar.replace(/\s+/g, ' ') + ')');
  check(sa.reroll === 0, 'Kein „Neu würfeln“, „Ändern“ oder Einzel-Reroll im Zaishen-Wurf');
  await A.page.evaluate(() => document.activeElement && document.activeElement.blur()); await A.page.keyboard.press(' '); await A.page.waitForTimeout(300);
  const sa2 = await state(A.page);
  check(sa2.hash === sa.hash && /same roll for everyone/.test(await A.page.textContent('#toast')), 'Leertaste würfelt nicht neu, Hinweis erscheint');

  // 2) Wechsel 16:00 UTC
  const t1 = utc(2026, 10, 11, 15, 59), t2 = utc(2026, 10, 11, 16, 1), t3 = utc(2026, 10, 12, 15, 59), t4 = utc(2026, 10, 12, 16, 1);
  const seen = [];
  for (const t of [t1, t2, t3, t4]) { const c = await open(t); await roll(c.page); const s = await state(c.page); seen.push({s, p: params(s.hash)}); await c.ctx.close(); }
  const key = x => x.p.z + '|' + x.p.seed + '|' + x.s.codes.join('.');
  check(key(seen[0]) !== key(seen[1]), '15:59 und 16:01 UTC: verschiedene Würfe (z ' + seen[0].p.z + ' → ' + seen[1].p.z + ')');
  check(key(seen[1]) === key(seen[2]), '16:01 und nächster Tag 15:59: gleicher Wurf');
  check(key(seen[2]) !== key(seen[3]), 'Nächster Tag 15:59 und 16:01: verschiedene Würfe');
  check(/W9/.test(seen[0].s.bar) && /Bravery 1/.test(seen[0].s.bar), 'Samstag (Tag bis 16:00): W9 + Bravery 1');
  check(/W4/.test(seen[3].s.bar) && !/Bravery \d/.test(seen[3].s.bar), 'Montag: W4, keine Bravery (' + seen[3].s.bar.replace(/\s+/g, ' ') + ')');

  // Wochentage: Mo 4 · Di 5 · Mi 6 · Do 7 · Fr 8 · Sa 9 + B1 · So 10 + B2 (Hub-Karte, ohne zu würfeln)
  const want = [[12, 4, 0], [13, 5, 0], [14, 6, 0], [15, 7, 0], [16, 8, 0], [17, 9, 1], [18, 10, 2]];
  let wk = true; const wkTxt = [];
  for (const [d, w, b] of want) {
    const c = await open(utc(2026, 10, d, 17, 0)); const z = await c.page.textContent('#v-hub .zai-card .zs');
    const ok = new RegExp('Weirdness ' + w + '(?!\\d)').test(z) && (b ? new RegExp('Bravery ' + b).test(z) : !/Bravery/.test(z)); wk = wk && ok; wkTxt.push(d + ':' + z.replace(/.*Weirdness/, 'W').replace(/\s+/g, ' ')); await c.ctx.close();
  }
  check(wk, 'Wochentags-Tabelle auf der Hub-Karte (' + wkTxt.join(' | ') + ')');

  // 3) Geteilter Link: Empfänger an einem anderen Tag und mit anderen Einstellungen sieht denselben Wurf mit Banner
  const shared = sa.hash, C = await open(utc(2026, 10, 20, 9, 0), other);
  await C.page.goto('about:blank'); await C.page.goto(U + shared); await C.page.waitForTimeout(700);
  const sc = await state(C.page);
  check(sc.codes.join('.') === sa.codes.join('.') && !sc.snap, 'Geteilter Link: gleicher Wurf beim Empfänger (anderer Tag, andere Einstellungen), kein Schnappschuss');
  check(/Zaishen Bravery/.test(sc.dk) && /2026-10-11/.test(sc.dk) && sc.dt === sa.dt, 'Empfänger sieht Zaishen-Banner mit dem Datum des Wurfs und denselben Ort');
  check(params(sc.hash).z === String(D0) && sc.reroll === 0, 'z bleibt beim Neu-Schreiben des Links erhalten; auch hier kein Neuwurf');
  await C.ctx.close();

  // Andere Version: Schnappschuss trägt das Zaishen-Banner mit Datum
  const D = await open(utc(2026, 10, 20, 9, 0));
  const other8 = await D.page.evaluate(() => GWGen.genBuild({mode: 'pve', weird: 5, seed: 999}).code);   // gültiger Code einer anderen Leiste → Link weicht ab → Schnappschuss
  const old = shared.replace(/gv=[^&]+/, 'gv=deadbeef').replace(/t=[^&]+/, 't=' + encodeURIComponent(other8));
  await D.page.goto('about:blank'); await D.page.goto(U + old);
  await D.page.waitForTimeout(600);
  const sd = await D.page.evaluate(() => ({snap: !!document.querySelector('.card.snap'), zai: (document.querySelector('.fate.zai .dk') || {}).textContent || ''}));
  check(sd.snap && /Zaishen Bravery/.test(sd.zai) && /2026-10-11/.test(sd.zai), 'Schnappschuss (andere Version): Zaishen-Banner mit Datum');
  await D.ctx.close();

  // 4) Logbuch, „heute geschafft“, Erfolg
  await A.page.click('#out [data-log="team"]'); await A.page.waitForTimeout(250);
  const pre = await A.page.inputValue('#dl-target');
  check(pre && /Zaishen/.test(await A.page.textContent('#dl-body .form h3')), 'Logbuch-Formular: Ort vorbelegt („' + pre + '“), Zaishen-Etikett');
  await A.page.click('#dl-save'); await A.page.waitForTimeout(300);
  const st1 = await store(A.page);
  check(st1.log.length === 1 && st1.log[0].zaishen === D0 && st1.log[0].ok === true && st1.log[0].build.zaishen === undefined, 'Eintrag trägt zaishen=' + D0);
  check(!!(st1.ach && st1.ach.zinit), 'Erfolg „Zaishen Initiate“ freigeschaltet');
  await A.page.keyboard.press('Escape'); await A.page.click('#homebtn'); await A.page.waitForTimeout(250);
  const hub = await A.page.evaluate(() => ({done: (document.querySelector('.zai-card .zdone') || {}).textContent || '', btn: (document.querySelector('.zai-card [data-zai]') || {}).textContent || ''}));
  check(/done today/.test(hub.done) && /View roll/.test(hub.btn), 'Hub: „' + hub.done + '“, Knopf „' + hub.btn + '“');
  await A.page.evaluate(() => { location.hash = '#/log'; }); await A.page.waitForTimeout(250);
  check(await A.page.evaluate(() => /Zaishen/.test(document.querySelector('#pl-body .lent .lm').innerHTML)), 'Logbuch-Seite: Eintrag als Zaishen markiert');
  await A.page.click('#pg-log [data-lload]'); await A.page.waitForTimeout(700);
  const sl = await state(A.page);
  check(/Zaishen Bravery/.test(sl.dk) && params(sl.hash).z === String(D0) && sl.codes.join('.') === sa.codes.join('.'), 'Eintrag laden: derselbe Zaishen-Wurf mit Banner');

  // Dein letzter Build: Zaishen-Wurf wird erkannt und lässt sich wieder öffnen
  await A.page.click('#homebtn'); await A.page.waitForTimeout(250);
  const lb = await A.page.evaluate(() => (document.querySelector('.cont.lastb') || {}).textContent || '');
  check(/Zaishen Bravery/.test(lb) && /W10/.test(lb), 'Hub „Dein letzter Build“: ' + lb.replace(/\s+/g, ' ').trim());
  await A.page.click('[data-lastb]'); await A.page.waitForTimeout(700);
  const sl2 = await state(A.page);
  check(/Zaishen Bravery/.test(sl2.dk) && sl2.reroll === 0 && sl2.codes.join('.') === sa.codes.join('.'), 'Letzten Build öffnen: wieder der feste Zaishen-Wurf');

  // Hilfe-Knopf auf der Hub-Karte erklärt, startet aber keinen Wurf
  const H = await open(T0);
  await H.page.click('#v-hub .zai-card .hlp'); await H.page.waitForTimeout(150);
  const hp = await H.page.evaluate(() => ({txt: document.querySelector('#help-pop').textContent, vis: !document.querySelector('#help-pop').hidden, hub: !document.querySelector('#v-hub').hidden}));
  check(hp.vis && hp.hub && /16:00 UTC/.test(hp.txt) && /all skills/.test(hp.txt), 'Hilfe der Hub-Karte: 16:00 UTC, alle Skills; Hub bleibt stehen');
  await H.ctx.close();

  // Gescheitert → „heute versucht“, Erfolg „Initiate“ zählt trotzdem (erster Zaishen-Eintrag)
  const F = await open(T0); await roll(F.page);
  await F.page.click('#out [data-log="team"]'); await F.page.waitForTimeout(200); await F.page.click('#dl-body [data-ok="0"]'); await F.page.waitForTimeout(100); await F.page.click('#dl-save'); await F.page.waitForTimeout(250);
  await F.page.keyboard.press('Escape'); await F.page.click('#homebtn'); await F.page.waitForTimeout(250);
  const stF = await store(F.page), hubF = await F.page.textContent('.zai-card .zf');
  check(/tried today/.test(hubF) && !/done today/.test(hubF) && stF.ach.zinit, 'Gescheitert: „heute versucht“, kein Haken; Initiate trotzdem frei');
  check(!stF.ach.zreg && !stF.ach.zstreak, 'Gescheiterter Wurf zählt nicht für Regular/Streak');

  // Wechsel in einen eigenen Modus: kein z, wieder würfelbar
  await F.page.click('#v-hub [data-flow="pve"][data-size="4"]'); await F.page.waitForTimeout(200); await F.page.click('#ov-go'); await F.page.waitForTimeout(700);
  const sn = await state(F.page);
  check(!/[#&]z=/.test(sn.hash) && sn.reroll > 0 && !/Zaishen/.test(sn.bar), 'Eigener Modus danach: kein z im Link, Neu würfeln wieder da');
  await F.ctx.close();

  // Erfolge Regular (7 verschiedene Tage, aber nie 3 in Folge) und Streak (3 Tage in Folge)
  const entry = (d, ok = true) => ({id: 'seed' + d, ts: '2026-10-0' + (1 + (d % 8)) + 'T10:00:00.000Z', target: 'Test', kind: 'nm', ok, note: '', pts: 10, mult: 1, zaishen: d, build: {team: false, name: 'x', code: '', weird: 5}});
  const withLog = (days, ach) => Object.assign({}, other, {base: 'all', links: {core: true, pvx: true, cores: true, custom: []}, reforged: true, log: days.map(d => entry(d)), ach: ach || {}});
  const doLog = async c => { await roll(c.page); await c.page.click('#out [data-log="team"]'); await c.page.waitForTimeout(200); await c.page.click('#dl-save'); await c.page.waitForTimeout(300); return store(c.page); };
  const R = await open(T0, withLog([D0 - 11, D0 - 9, D0 - 7, D0 - 5, D0 - 3, D0 - 1]));
  const sR = await doLog(R);
  check(sR.ach.zreg && !sR.ach.zstreak, 'Erfolg „Zaishen Regular“ bei 7 Tagen (nie 3 in Folge → kein Streak)');
  await R.ctx.close();
  const S = await open(T0, withLog([D0 - 2, D0 - 1]));
  const sS = await doLog(S);
  check(sS.ach.zstreak && !sS.ach.zreg, 'Erfolg „Zaishen Streak“ bei 3 Tagen in Folge (nur 3 Tage → kein Regular)');
  await S.ctx.close();
  const S2 = await open(T0, withLog([D0 - 3, D0 - 1]));
  check(!(await doLog(S2)).ach.zstreak, 'Lücke in der Serie (D-3, D-1, D) → kein Streak');
  await S2.ctx.close();

  // 5) Countdown (± 1 min) und Sprache
  const cd = async (t, st) => { const c = await open(t, st); const x = await c.page.textContent('#zai-cd'); await c.ctx.close(); return x; };
  check(await cd(utc(2026, 10, 11, 10, 48)) === 'new roll in 5 h 12 min', 'Countdown EN 10:48 UTC → 5 h 12 min');
  check(await cd(utc(2026, 10, 11, 10, 48), Object.assign({}, other, {lang: 'de'})) === 'neuer Wurf in 5 h 12 min', 'Countdown DE 10:48 UTC → 5 h 12 min');
  check(await cd(utc(2026, 10, 11, 15, 59, 30)) === 'new roll in 1 min', 'Countdown 15:59:30 → 1 min');
  check(await cd(utc(2026, 10, 11, 16, 0)) === 'new roll in 24 h 0 min', 'Countdown 16:00:00 → neuer Tag, 24 h');

  // Layout: Handy ohne seitliches Scrollen (Hub-Karte und Wurf)
  const M = await open(T0, null, {width: 390, height: 800});
  const w1 = await M.page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await roll(M.page);
  const w2 = await M.page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(w1 <= 0 && w2 <= 0, '390 px: kein seitliches Scrollen (Hub ' + w1 + ', Wurf ' + w2 + ')');
  await M.ctx.close();

  await A.ctx.close(); await B.ctx.close(); await browser.close();
  check(!errs.length, 'keine JS-Fehler ' + errs.join(' | '));
  console.log(fail ? fail + ' FEHLER' : 'ALLE ZAISHEN-TESTS OK'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

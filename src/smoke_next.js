// Browser-Test „Next Level“ Paket A: stabile Links (Version + Vorlagencodes, Schnappschuss), Teilen, Hilfe-Knöpfe,
// Full-Bravery-Stufenschalter, Experimental-Etiketten, Feedback-Link.
// Aufruf: NODE_PATH=$(npm root -g) node src/smoke_next.js
let chromium;
try { ({chromium} = require('playwright')); } catch (e) { console.log('Playwright fehlt – Test übersprungen.'); process.exit(0); }
const path = require('path');
const U = 'file://' + path.join(__dirname, '..', 'docs', 'index.html');
let fail = 0;
const check = (ok, msg) => { console.log((ok ? 'OK   ' : 'FAIL ') + msg); if (!ok) fail++; };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('dialog', d => d.accept());
  const wait = ms => page.waitForTimeout(ms);
  const codes = p => p.evaluate(() => [...document.querySelectorAll('#out [data-copy]')].map(b => b.dataset.copy));
  const params = p => p.evaluate(() => Object.fromEntries(new URLSearchParams(location.hash.slice(1))));
  await page.goto(U); await page.evaluate(() => localStorage.clear()); await page.goto(U + '#/'); await page.reload(); await wait(300);

  // Hub: Etiketten, Hilfe in der Modus-Kachel öffnet nicht den Modus, Feedback-Link
  const hub = await page.evaluate(() => ({xp: document.querySelectorAll('#v-hub .mode .xp').length, fb: [...document.querySelectorAll('#foot a')].map(a => a.href).find(h => /issues/.test(h)) || ''}));
  check(hub.xp === 2 && /krvtt\/gw1-ultimate-bravery\/issues\/new/.test(hub.fb), 'Hub: 2 Experimental-Etiketten, Feedback-Link in der Fußzeile');
  await page.click('#v-hub .mode[data-flow="pvp"] .hlp'); await wait(150);
  const pop = await page.evaluate(() => ({vis: !document.querySelector('#help-pop').hidden, txt: document.querySelector('#help-pop').textContent, dlg: document.querySelector('#dlg-class').open}));
  check(pop.vis && /1v1/.test(pop.txt) && !pop.dlg, 'Hilfe in der PvP-Kachel: Erklärung, Modus startet nicht');
  await page.mouse.click(5, 5); await wait(100);
  check(await page.evaluate(() => document.querySelector('#help-pop').hidden), 'Hilfe schließt bei Klick daneben');

  // Klassen-Overlay: Hilfe im Dialog, Bravery-Stufen
  await page.click('#v-hub [data-size="1"]'); await wait(200);
  await page.click('#dlg-class .bravef .hlp'); await wait(150);
  const p2 = await page.evaluate(() => { const h = document.querySelector('#help-pop'); const r = h.getBoundingClientRect(); return {vis: !h.hidden, inDlg: !!h.closest('dialog'), txt: h.textContent, w: r.width}; });
  check(p2.vis && p2.inDlg && /Full Bravery/.test(p2.txt) && p2.w > 100, 'Hilfe im Klassen-Overlay sichtbar (liegt im Dialog)');
  await page.click('#dlg-class .bravef .hlp'); await wait(100);
  check(await page.evaluate(() => document.querySelector('#help-pop').hidden), 'Zweiter Klick schließt die Hilfe');
  check(await page.evaluate(() => document.querySelectorAll('#ov-b [data-bv]').length === 4 && /No rules off/.test(document.querySelector('#ov-bt').textContent)), 'Bravery: Stufen 0–3 mit Erklärung');
  await page.click('#ov-b [data-bv="2"]'); await wait(80);
  check(/2 random build rule/.test(await page.textContent('#ov-bt')), 'Bravery 2: Erklärung passt sich an');
  await page.click('#dc-body [data-cls="6"]'); await wait(80);
  check(await page.evaluate(() => document.querySelector('#ov-b .on').dataset.bv === '2'), 'Klassenwahl behält die Bravery-Stufe');
  await page.click('#ov-go'); await wait(500);
  const crumb = await page.textContent('#buildbar .crumb');
  check(/Bravery 2/.test(crumb), 'Wurf mit Bravery 2 ' + crumb.replace(/\s+/g, ' '));
  check(await page.evaluate(() => document.querySelectorAll('#out .card .hlp').length >= 3), 'Karte: Hilfe-Knöpfe an Weirdness, Multiplikator, Vorlagencode');

  // Link: Version + Codes; gleicher Build beim Empfänger
  const pr = await params(page), mine = await codes(page);
  check(pr.gv && pr.gv.length === 8 && pr.t === mine.join('.'), 'Link trägt Version (gv) und Vorlagencode (t)');
  const hash = await page.evaluate(() => location.hash);
  const ctx2 = await browser.newContext(); const q = await ctx2.newPage(); q.on('pageerror', e => errs.push(e.message));
  await q.goto(U + hash); await q.waitForTimeout(500);
  check(JSON.stringify(await codes(q)) === JSON.stringify(mine) && !(await q.evaluate(() => !!document.querySelector('.card.snap'))), 'Gleiche Version: voller Build, kein Schnappschuss');

  // Andere Version: gespeicherte Leiste wird gezeigt, nicht neu gewürfelt
  const other = await q.evaluate(() => GWGen.genBuild({mode: 'pve', weird: 5, seed: 999}).code);   // gültiger Code einer anderen Leiste
  const old = hash.replace(/gv=[^&]+/, 'gv=deadbeef').replace(/t=[^&]+/, 't=' + encodeURIComponent(other));
  await q.goto('about:blank'); await q.goto(U + old); await q.waitForTimeout(500);
  const sn = await q.evaluate(() => ({snap: !!document.querySelector('.card.snap'), txt: document.querySelector('.snap-n')?.textContent || '', tiles: document.querySelectorAll('.card.snap .mini .tile').length, h: location.hash}));
  check(sn.snap && /older version/.test(sn.txt) && sn.tiles === 8, 'Ältere Version: Schnappschuss mit 8 Skills und Hinweis');
  check(JSON.stringify(await codes(q)) === JSON.stringify([other]) && /gv=deadbeef/.test(sn.h), 'Schnappschuss behält Code und Version im Link');
  await q.click('[data-snap="regen"]'); await q.waitForTimeout(400);
  const rg = await q.evaluate(() => ({snap: !!document.querySelector('.card.snap'), h: location.hash}));
  check(!rg.snap && !/gv=deadbeef/.test(rg.h) && JSON.stringify(await codes(q)) === JSON.stringify(mine), 'Neu würfeln mit aktueller Version: voller Build, Link aktualisiert');

  // Team: Mitglied neu würfeln -> Link enthält neue Codes, Empfänger sieht genau diese (Schnappschuss)
  await page.goto(U + '#/'); await wait(300);
  await page.click('#v-hub [data-size="4"]'); await wait(200); await page.click('#ov-go'); await wait(900);
  await page.click('#out [data-act="reroll"][data-i="2"]'); await wait(500);
  const tc = await codes(page), th = await page.evaluate(() => location.hash);
  check((await params(page)).t === tc.join('.'), 'Team: Neu würfeln eines Mitglieds aktualisiert den Link');
  await q.goto('about:blank'); await q.goto(U + th); await q.waitForTimeout(900);
  const ts = await q.evaluate(() => ({snap: !!document.querySelector('.card.snap'), n: document.querySelectorAll('.snap-m').length, txt: document.querySelector('.snap-n')?.textContent || ''}));
  check(ts.snap && ts.n === 4 && /changed after rolling/.test(ts.txt) && JSON.stringify(await codes(q)) === JSON.stringify(tc), 'Team-Link nach Neu-Würfeln: Empfänger sieht exakt die 4 Leisten');
  await ctx2.close();

  // Teilen am Desktop: Link wird kopiert
  await page.click('#bb-share'); await wait(200);
  check(/copied|kopiert/i.test(await page.textContent('#toast')), 'Teilen am Desktop kopiert den Link');

  // Handy-Breite: Kopfzeile passt, Hilfe bleibt im Bild
  await page.setViewportSize({width: 390, height: 844}); await wait(200);
  const mob = await page.evaluate(() => ({sw: document.documentElement.scrollWidth, share: document.querySelector('#bb-share').getBoundingClientRect().width}));
  check(mob.sw <= 392 && mob.share > 0, `390 px: kein seitliches Scrollen (${mob.sw}), Teilen sichtbar`);
  await page.click('#out .hlp:visible >> nth=0'); await wait(150);
  const pr2 = await page.evaluate(() => { const r = document.querySelector('#help-pop').getBoundingClientRect(); return {l: r.left, r: r.right}; });
  check(pr2.l >= 0 && pr2.r <= 390, 'Hilfe-Blase bleibt auf dem Handy im Bild');

  check(!errs.length, 'keine JS-Fehler ' + errs.join(' | '));
  await browser.close();
  console.log(fail ? fail + ' FEHLER' : 'ALLE NEXT-TESTS OK'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

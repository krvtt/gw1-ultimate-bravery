// Browser-Test v7: Hub, Overlays (Klasse, Signature, 1 aus 3), Destiny, Teams, Unterseiten, Speicher, Sprache, Mobil.
// Aufruf: NODE_PATH=$(npm root -g) node src/smoke_app.js
let chromium;
try { ({chromium} = require('playwright')); } catch (e) { console.log('Playwright fehlt – App-Test übersprungen.'); process.exit(0); }
const path = require('path'), fs = require('fs'), os = require('os'), DIST = path.join(__dirname, '..', 'docs');
const U = 'file://' + path.join(DIST, 'index.html');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, acceptDownloads: true});
  let fail = 0;
  const check = (ok, msg) => { console.log((ok ? 'OK   ' : 'FAIL ') + msg); if (!ok) fail++; };
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND/.test(m.text())) errs.push(m.text()); });
  page.on('dialog', d => d.accept());
  const wait = ms => page.waitForTimeout(ms);
  const vis = sel => page.evaluate(s => { const e = document.querySelector(s); return !!e && !e.hidden && !e.closest('[hidden]'); }, sel);
  const hub = async () => { await page.goto(U + '#/'); await page.reload(); await wait(400); };

  await page.goto(U); await page.evaluate(() => localStorage.clear()); await hub();
  const h = await page.evaluate(() => ({modes: document.querySelectorAll('#v-hub .mode').length, lang: document.documentElement.lang, h1: document.querySelector('.brand h1').innerText,
    links: document.querySelectorAll('#v-hub .links a').length, title: document.title}));
  check(h.modes === 6 && h.lang === 'en' && /Zaishen Ultimate Bravery/.test(h.h1) && h.links === 4 && /Hero's Handbook/.test(h.title), 'Hub: 6 Modi, Englisch, Titel, 4 Links');

  // PvE 6 mit Helden
  await page.click('#v-hub [data-size="6"]'); await wait(200);
  check(await page.evaluate(() => document.querySelector('#dlg-class').open && !document.querySelector('#dlg-heroes').hidden), 'PvE 6: Klassen-Overlay mit Heldenwahl');
  await page.click('#dc-body [data-cls="5"]');
  for (const id of ['dunkoro', 'koss']) await page.click(`#dlg-heroes [data-hero="${id}"]`);
  await page.fill('#ov-w', '7'); await page.dispatchEvent('#ov-w', 'input');
  await page.click('#ov-b [data-bv="1"]');
  await page.click('#ov-go'); await wait(900);
  let r = await page.evaluate(() => ({rows: document.querySelectorAll('#out .mrow').length, crumb: document.querySelector('.crumb').innerText.replace(/\s+/g, ' '),
    who: [...document.querySelectorAll('#out .mrow .who')].map(x => x.innerText.trim()), roles: [...document.querySelectorAll('#out .mrow')].map(c => [c.querySelector('.p1').innerText, c.querySelector('.sub b').innerText]),
    hash: location.hash, tiles: document.querySelectorAll('#out .mrow .bar .sk').length}));
  check(r.rows === 6 && r.tiles === 48 && /Mesmer/.test(r.crumb) && /W7/.test(r.crumb) && /Bravery 1/.test(r.crumb) && /^YOU/i.test(r.who[0]) && /DUNKORO/i.test(r.who[1]), `Team: 6 Zeilen à 8 Skills, Kopfzeile „${r.crumb}“`);
  check(r.roles.filter(([, ro]) => /Healer|Prot/.test(ro)).every(([p]) => /Monk|Ritualist/.test(p)), 'Heiler/Prot nur Mönch/Ritualist: ' + r.roles.map(x => x.join('/')).join(', '));
  check(await page.evaluate(() => [...document.querySelectorAll('#out .mrow details')].every(d => !d.open)), 'Team-Details eingeklappt');
  const names1 = await page.evaluate(() => [...document.querySelectorAll('#out .bname')].map(x => x.innerText).join('|'));
  await page.reload(); await wait(800);
  check(await page.evaluate(() => [...document.querySelectorAll('#out .bname')].map(x => x.innerText).join('|')) === names1, 'Link reproduziert das Team');
  await page.keyboard.press('Space'); await wait(800);
  check(await page.evaluate(() => location.hash) !== r.hash, 'Leertaste würfelt neu');
  await page.goBack(); await wait(300);
  check(await vis('#v-hub'), 'Zurück führt zum Hub');

  // Destiny
  await page.click('#v-hub [data-flow="destiny"]'); await wait(200);
  check(await page.evaluate(() => document.querySelector('#dlg-heroes').hidden), 'Destiny: keine Heldenwahl (Würfel)');
  await page.click('#dc-body [data-cls="3"]'); await page.click('#ov-go'); await wait(900);
  const fate = await page.evaluate(() => document.querySelector('.fate') ? document.querySelector('.fate').innerText.replace(/\s+/g, ' ') : '');
  check(/Mission|Vanquish/.test(fate) && /Party of [468]/.test(fate), 'Schicksal: ' + fate.slice(0, 110));
  await page.click('.banner [data-log="team"]'); await wait(200);
  const pre = await page.evaluate(() => ({t: document.querySelector('#dl-target').value, strips: document.querySelectorAll('#dlg-log .strip').length}));
  check(pre.t.length > 2 && pre.strips >= 4, `Logbuch vorbefüllt (${pre.t}) mit ${pre.strips} Leisten`);
  await page.click('#dl-save'); await wait(300);
  check(/Achievement unlocked/.test(await page.innerText('#toast')), 'Erfolg-Toast');
  await page.click('#dlg-log [data-close]');

  // Pick 1 of 3 (Krieger)
  await hub(); await page.click('#v-hub [data-flow="pick3"]'); await page.click('#dc-body [data-cls="1"]'); await page.click('#ov-go'); await wait(300);
  const three = await page.evaluate(() => [...document.querySelectorAll('#dp-body .opt .m')].map(x => x.innerText));
  check(three.length === 3 && three.every(x => /Warrior/.test(x)), 'Pick 1 of 3: drei Krieger-Elites');
  await page.click('#dp-body .opt >> nth=2'); await wait(800);
  check(/Picked core/.test(await page.innerText('#out')), 'Gewählter Elite auf der Karte');

  // Signature: deutsch und englisch
  await hub(); await page.click('#v-hub [data-flow="sig"]'); await page.click('#dc-body [data-cls="0"]'); await page.click('#ov-go'); await wait(300);
  await page.fill('#ps-q', 'ätherwunder'); await wait(150);
  const de = await page.evaluate(() => [...document.querySelectorAll('#ps-res .sopt b')].map(x => x.innerText));
  await page.fill('#ps-q', 'ether prod'); await wait(150);
  const en = await page.evaluate(() => [...document.querySelectorAll('#ps-res .sopt b')].map(x => x.innerText));
  check(de.includes('Ether Prodigy') && en.includes('Ether Prodigy'), `Signature-Suche DE + EN (${de.join(',')} / ${en.join(',')})`);
  await page.click('#ps-res .sopt >> nth=0'); await wait(800);
  check(/Ether Prodigy/.test(await page.innerText('.crumb')), 'Signature in der Kopfzeile');

  // PvP + Random
  await hub(); await page.click('#v-hub [data-flow="pvp"]'); await page.click('#ov-go'); await wait(800);
  check(/PvP/.test(await page.innerText('#out .card .sub')), 'PvP 1v1 Build');
  await hub(); await page.click('#v-hub [data-flow="random"]'); await wait(1000);
  check(await page.evaluate(() => document.querySelectorAll('#out .sk').length >= 8), 'Random würfelt direkt');

  // Account: Kampagnen begrenzen Destiny
  await page.goto(U + '#/account'); await wait(400);
  check(await vis('#dlg-skills') && await vis('#dlg-links') && await vis('#dlg-backup') && await vis('#acc-rexp'), 'Account: Skill-Basis, Verbindungen, Backup, Bewertungen');
  await page.click('#dlg-skills [data-camp="2"]'); await page.click('#dlg-skills [data-camp="4"]'); await wait(100);
  let bad = 0;
  for (let i = 0; i < 12; i++) {
    await hub(); await page.click('#v-hub [data-flow="destiny"]'); await page.click('#ov-go'); await wait(500);
    const t = await page.evaluate(() => document.querySelector('.fate') ? document.querySelector('.fate').innerText : '');
    if (/Factions|Eye of the North/.test(t)) bad++;
  }
  check(!bad, `Ohne Factions/EotN keine Orte daraus (${bad} Treffer in 12 Würfen)`);
  // Verbindung mit deutschem Namen
  await page.goto(U + '#/account'); await wait(300);
  await page.fill('#dk-a', 'Feuerball'); await page.fill('#dk-b', 'Meteor'); await page.click('#dk-add'); await wait(100);
  check(await page.evaluate(() => JSON.parse(localStorage.getItem('gw1ub_store_v1')).links.custom.length === 1), 'Eigene Verbindung mit deutschem Namen');
  // Backup rund
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#db-save')]);
  const bpath = path.join(os.tmpdir(), 'gw1-v7-backup.json'); fs.copyFileSync(await dl.path(), bpath);
  await page.evaluate(() => localStorage.clear()); await page.reload(); await wait(300);
  await page.setInputFiles('#bfile', bpath); await wait(400);
  const st2 = await page.evaluate(() => JSON.parse(localStorage.getItem('gw1ub_store_v1')));
  check(st2.log.length === 1 && st2.links.custom.length === 1 && !st2.camps.includes(2), 'Backup gespeichert und geladen (Logbuch, Verbindungen, Kampagnen)');

  // Titel, Logbuch, How-to, About
  await page.goto(U + '#/titles'); await wait(300);
  check(await page.evaluate(() => document.querySelectorAll('#dt-body .ach').length >= 30 && document.querySelectorAll('#dt-body .ach.on').length >= 2), 'Titelseite mit Erfolgen');
  await page.goto(U + '#/log'); await wait(300);
  check(await page.evaluate(() => document.querySelectorAll('#pl-body .lent').length === 1 && document.querySelectorAll('#pl-body .mini .tile').length >= 32), 'Logbuch mit Klassenkombi und Icon-Leisten');
  await page.goto(U + '#/howto'); await wait(200);
  check(/Full Bravery/.test(await page.innerText('#ph-body')) && /without guarantee/.test(await page.innerText('#ph-body')), 'How to play mit Mechaniken und Hinweisen');
  await page.goto(U + '#/about'); await wait(200);
  check(/GNU FDL/.test(await page.innerText('#pb-body')) && /1319/.test(await page.innerText('#pb-body')), 'About mit Quellen und Lizenzen');

  // leere Skill-Basis → Hinweis mit Weg zum Account
  await page.goto(U + '#/account'); await wait(300); await page.click('#dlg-skills [data-base="mine"]');
  await hub(); await page.click('#v-hub [data-size="1"]'); await page.click('#ov-go'); await wait(800);
  check(/No bar could be built/.test(await page.innerText('#out')), 'Leere Skill-Basis → Hinweis');
  await page.click('#out [data-dlg="dlg-skills"]'); await wait(300);
  check(await vis('#pg-account'), 'Hinweis-Knopf führt zum Account');
  await page.click('#dlg-skills [data-base="all"]');

  // Sprache bleibt
  await hub(); await page.click('#lang [data-v="de"]'); await wait(200); await page.reload(); await wait(400);
  check(/Wähle, wie mutig/.test(await page.innerText('#v-hub')), 'Deutsch bleibt nach Neuladen');

  // Mobil
  await page.setViewportSize({width: 390, height: 844});
  for (const [u, act] of [['#/', null], ['#/account', null], ['#/log', null], ['#/', 'class']]) {
    await page.goto(U + u); await wait(300);
    if (act) { await page.click('#v-hub [data-size="8"]'); await wait(200); }
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(ov <= 0, `390px ${u}${act ? ' + Overlay' : ''}: kein seitliches Scrollen (${ov})`);
    if (act) await page.keyboard.press('Escape');
  }
  check(!errs.length, 'keine JS-Fehler ' + errs.join(' | '));
  await browser.close();
  console.log(fail ? `${fail} FEHLER` : 'ALLE APP-TESTS OK');
  process.exit(fail ? 1 : 0);
})();

// Browser-Test Beta-Release: Charakter-Import (GWToolbox++), Schalter, Charakterwahl, geteilte Links exakt,
// letzter Build, Backup-Erinnerung, Sprache, Web-App (Manifest, Service Worker, offline).
// Aufruf: NODE_PATH=$(npm root -g) node src/smoke_release.js
let chromium;
try { ({chromium} = require('playwright')); } catch (e) { console.log('Playwright fehlt – Release-Test übersprungen.'); process.exit(0); }
const path = require('path'), fs = require('fs'), os = require('os'), http = require('http');
const DOCS = path.join(__dirname, '..', 'docs'), U = 'file://' + path.join(DOCS, 'index.html');
const D = JSON.parse(fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8').match(/window\.GWDATA=(\{.*?\});\s*<\/script>/s)[1].replace(/<\\\//g, '</'));
let fail = 0;
const check = (ok, msg) => { console.log((ok ? 'OK   ' : 'FAIL ') + msg); if (!ok) fail++; };

// Toolbox-Datei nachbauen: Mesmer mit allen Mesmer- und 30 allgemeinen Skills, Mönch mit Mönch-Skills, PvP-Charakter
function bits(ids) { const w = []; for (const id of ids) { const i = id >> 5; while (w.length <= i) w.push(0); w[i] = (w[i] | (1 << (id & 31))) >>> 0; } return w; }
const ofP = p => D.skills.filter(s => s.p === p).map(s => s.id);
const mesmer = ofP(5).concat(ofP(0).slice(0, 30), ofP(4).slice(0, 25)), monk = ofP(3).concat(ofP(0).slice(0, 10), ofP(1).slice(0, 20)), rookie = ofP(7).slice(0, 12);
const tb = {'Mira Mesmerelda': {profession: 5, account: 'x', is_pvp: false, is_pre_searing: false, skills: bits(mesmer), mission: [1, 2]},
  'Brother Heal': {profession: 3, account: 'x', is_pvp: false, is_pre_searing: false, skills: bits(monk)},
  'Fresh Rookie': {profession: 7, account: 'x', is_pvp: false, is_pre_searing: false, skills: bits(rookie)},
  'Arena Guy': {profession: 1, account: 'x', is_pvp: true, is_pre_searing: false, skills: bits(ofP(1))}, '': {skills: []}};
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gwub-'));
const tbPath = path.join(tmp, 'character_completion.json'); fs.writeFileSync(tbPath, JSON.stringify(tb, null, 1));
const iniPath = path.join(tmp, 'character_completion.ini'); fs.writeFileSync(iniPath, '[Mira]\nskills_length=1\n');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, acceptDownloads: true});
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('dialog', d => d.accept());
  const wait = ms => page.waitForTimeout(ms);
  const codes = p => p.evaluate(() => [...document.querySelectorAll('#out [data-copy]')].map(b => b.dataset.copy));
  const skillsOf = (p, code) => p.evaluate(c => GWGen.decodeTemplate(c).skills.filter(Boolean), code);

  await page.goto(U); await page.evaluate(() => localStorage.clear()); await page.goto(U + '#/account'); await page.reload(); await wait(300);
  check(await page.evaluate(() => /GWToolbox/.test(document.querySelector('#dch-title').textContent) && document.querySelectorAll('#dch-body ol.steps li').length === 3), 'Account: Charakter-Panel mit Anleitung');
  await page.setInputFiles('#tbfile', iniPath); await wait(300);
  check(await page.evaluate(() => /\.ini|Toolbox/.test(document.querySelector('#toast').textContent)), 'Import: altes .ini-Format wird erkannt');
  await page.setInputFiles('#tbfile', tbPath); await wait(400);
  const st = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('gw1ub_store_v1')); return {n: d.chars.length, base: d.base, on: d.chars.map(c => c.on), cnt: d.chars.map(c => c.s.length)}; });
  check(st.n === 4 && st.base === 'chars' && st.on.join() === 'true,true,true,false', 'Import: 4 Charaktere, Basis = Charaktere, PvP-Charakter aus ' + JSON.stringify(st));
  check(st.cnt[0] === new Set(mesmer).size && st.cnt[1] === new Set(monk).size, 'Import: gelernte Skills korrekt aus dem Bitfeld gelesen');
  check(await page.evaluate(() => document.querySelectorAll('#dch-body tbody tr').length === 4), 'Account: Charakterliste angezeigt');

  // Hub-Schalter
  await page.goto(U + '#/'); await wait(300);
  const sw = await page.evaluate(() => [...document.querySelectorAll('.basesw button')].map(b => b.textContent + (b.classList.contains('on') ? '*' : '')));
  check(/characters · 3\*/.test(sw[0]) && /blank/i.test(sw[1]), 'Hub: Schalter „Use my characters · 3“ aktiv ' + JSON.stringify(sw));
  await page.click('.basesw [data-hb="all"]'); await wait(100);
  check(await page.evaluate(() => JSON.parse(localStorage.getItem('gw1ub_store_v1')).base === 'all'), 'Hub: „Start blank“ schaltet auf alle Skills');
  await page.click('.basesw [data-hb="mine"]'); await wait(100);

  // Solo mit Charakter: Leiste nur aus seinen Skills
  await page.click('#v-hub [data-size="1"]'); await wait(200);
  check(await page.evaluate(() => document.querySelectorAll('#dc-body .chr').length === 3), 'Klassen-Overlay: 3 eigene Charaktere');
  await page.fill('#ov-w', '8'); await page.dispatchEvent('#ov-w', 'input');
  await page.click('#dc-body [data-char="0"]'); await wait(100);
  const ov = await page.evaluate(() => ({cls: document.querySelector('#dc-body .cls.on')?.dataset.cls, chr: document.querySelector('#dc-body .chr.on b')?.textContent, w: document.querySelector('#ov-w').value}));
  check(ov.cls === '5' && ov.chr === 'Mira Mesmerelda' && ov.w === '8', 'Charakterwahl setzt Mesmer, Regler bleibt erhalten ' + JSON.stringify(ov));
  await page.click('#ov-go'); await wait(500);
  const allowed = new Set(mesmer);
  let okBars = 0, n = 0;
  for (let k = 0; k < 6; k++) {
    const cs = await codes(page); const sk = await skillsOf(page, cs[0]); n++; if (sk.every(id => allowed.has(id))) okBars++;
    if (k === 0) {
      const crumb = await page.evaluate(() => document.querySelector('#buildbar .crumb').textContent);
      check(/Mira Mesmerelda/.test(crumb), 'Kopfzeile zeigt den Charakter');
    }
    await page.click('#bb-roll'); await wait(250);
  }
  check(okBars === n, `Solo: ${okBars}/${n} Leisten nur aus Miras gelernten Skills`);

  // Geteilter Link: anderer Browser ohne Einstellungen -> identischer Build
  const hash = await page.evaluate(() => location.hash), mine = await codes(page);
  check(/[&#]f=/.test(hash) && !/Mira/.test(decodeURIComponent(hash)), 'Link enthält den Pool, aber keinen Charakternamen');
  const ctx2 = await browser.newContext(); const p2 = await ctx2.newPage(); const e2 = []; p2.on('pageerror', e => e2.push(e.message));
  await p2.goto(U + hash); await p2.waitForTimeout(500);
  check(JSON.stringify(await codes(p2)) === JSON.stringify(mine), 'Link: gleicher Build in frischem Browser');
  // Empfänger mit eingeschränkter Skill-Basis und anderer Sprache bekommt trotzdem denselben Build
  await p2.evaluate(() => localStorage.setItem('gw1ub_store_v1', JSON.stringify({v: 1, base: 'mine', unlocked: [1, 2, 3], camps: [0, 1], log: [], lang: 'de', links: {core: false, pvx: true, cores: true, custom: []}})));
  await p2.goto('about:blank'); await p2.goto(U + hash); await p2.waitForTimeout(500);
  check(JSON.stringify(await codes(p2)) === JSON.stringify(mine), 'Link: gleicher Build trotz anderer Basis, Kampagnen und Verbindungen beim Empfänger');
  check(await p2.evaluate(() => document.documentElement.lang) === 'de', 'Link: Empfänger behält seine Sprache (de statt en)');

  // Team mit Charakter: du nur Mönch-Skills, Helden aus der Vereinigung
  await page.goto(U + '#/'); await wait(300);
  await page.click('#v-hub [data-size="4"]'); await wait(200);
  await page.click('#dc-body [data-char="1"]'); await wait(100); await page.click('#ov-go'); await wait(900);
  const tc = await codes(page), union = new Set(mesmer.concat(monk, rookie));
  const you = await skillsOf(page, tc[0]), heroOk = [];
  for (const c of tc.slice(1)) heroOk.push((await skillsOf(page, c)).every(id => union.has(id)));
  check(tc.length === 4 && you.every(id => new Set(monk).has(id)), 'Team: deine Leiste nur aus Bruder Heals Skills');
  check(heroOk.every(Boolean), 'Team: Helden nur aus Skills deiner Charaktere');
  const thash = await page.evaluate(() => location.hash);
  check(/[&#]fh=/.test(thash), 'Team-Link trägt getrennten Helden-Pool');
  await p2.goto('about:blank'); await p2.goto(U + thash); await p2.waitForTimeout(900);
  check(JSON.stringify(await codes(p2)) === JSON.stringify(tc), 'Team-Link: gleiches Team beim Empfänger');
  await ctx2.close();

  // Charakter mit zu wenigen Skills: Build kommt trotzdem, mit Hinweis
  await page.goto(U + '#/'); await wait(300);
  await page.click('#v-hub [data-size="1"]'); await wait(200);
  await page.click('#dc-body [data-char="2"]'); await wait(100); await page.click('#ov-go'); await wait(150);
  const fbToast = await page.evaluate(() => document.querySelector('#toast').textContent);
  await wait(500);
  const rc = await codes(page);
  check(rc.length === 1 && /too few|zu wenige/i.test(fbToast), 'Zu wenige Skills: Ausweich-Pool mit Hinweis ' + JSON.stringify(fbToast.slice(0, 60)));
  // Team zurück auf Bruder Heal für den Letzter-Build-Test
  await page.goto(U + thash); await wait(900);

  // Letzter Build auf dem Hub
  await page.goto(U); await wait(300);
  check(await page.evaluate(() => !!document.querySelector('.cont.lastb')), 'Hub: Karte „letzter Build“');
  await page.click('[data-lastb]'); await wait(900);
  check(JSON.stringify(await codes(page)) === JSON.stringify(tc), 'Letzter Build öffnet exakt denselben Build');

  // Backup-Erinnerung ab 5 ungesicherten Logbuch-Einträgen
  await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('gw1ub_store_v1'));
    for (let i = 0; i < 5; i++) d.log.push({id: 'x' + i, ts: new Date().toISOString(), target: 'Test', kind: 'nm', ok: true, pts: 10, mult: 1, build: {name: 'T', code: '', hash: ''}});
    localStorage.setItem('gw1ub_store_v1', JSON.stringify(d)); });
  await page.goto(U + '#/'); await page.reload(); await wait(300);
  check(await page.evaluate(() => !!document.querySelector('.cont.nag')), 'Hub: Backup-Erinnerung bei 5 Einträgen');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-nag]')]);
  const bk = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  check(bk.store.chars.length === 4 && !(await page.evaluate(() => !!document.querySelector('.cont.nag'))), 'Backup enthält Charaktere, Erinnerung verschwindet');

  // Charaktere entfernen
  await page.goto(U + '#/account'); await wait(300); await page.click('#dch-clr'); await wait(200);
  check(await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('gw1ub_store_v1')); return d.chars.length === 0 && d.base === 'all'; }), 'Charaktere entfernen: Basis zurück auf alle');
  check(!errs.length, 'keine JS-Fehler ' + errs.join(' | '));
  await ctx.close();

  // Web-App über einen lokalen Webserver: Manifest, Service Worker, offline neu laden
  const types = {'.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'};
  const srv = http.createServer((q, r) => { let f = path.join(DOCS, decodeURIComponent(q.url.split('?')[0]).replace(/^\/gw\//, '/')); if (f.endsWith('/')) f += 'index.html';
    if (!f.startsWith(DOCS) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(r); });
  await new Promise(ok => srv.listen(0, ok)); const base = `http://localhost:${srv.address().port}/gw/`;
  const ctx3 = await browser.newContext(); const p3 = await ctx3.newPage(); const e3 = []; p3.on('pageerror', e => e3.push(e.message));
  await p3.goto(base); await p3.waitForTimeout(400);
  const man = await p3.evaluate(async () => { const r = await fetch(document.querySelector('link[rel=manifest]').href); return r.json(); });
  check(man.start_url === './' && man.display === 'standalone' && man.icons.length === 3, 'Manifest: Start, Standalone, Icons');
  await p3.evaluate(() => navigator.serviceWorker.ready); await p3.reload(); await p3.waitForTimeout(500);
  check(await p3.evaluate(() => !!navigator.serviceWorker.controller), 'Service Worker steuert die Seite');
  await p3.goto(base + '#m=pve&s=1&w=5&seed=77'); await p3.waitForTimeout(600);
  const icons = await p3.evaluate(() => [...document.querySelectorAll('#out .tile img')].length);
  await ctx3.setOffline(true);
  await p3.goto(base + '#/'); await p3.reload(); await p3.waitForTimeout(800);
  check(await p3.evaluate(() => document.querySelectorAll('#v-hub .mode').length === 6), 'Offline: App startet aus dem Speicher');
  await p3.goto(base + '#m=pve&s=1&w=5&seed=77'); await p3.waitForTimeout(600);
  const offIcons = await p3.evaluate(() => [...document.querySelectorAll('#out .tile img')].filter(i => i.complete && i.naturalWidth > 0).length);
  check(icons > 0 && offIcons === icons, `Offline: bereits gesehene Icons bleiben da (${offIcons}/${icons})`);
  await p3.goto(base + 'knowledge.html'); await p3.waitForTimeout(800);
  check(await p3.evaluate(() => /Knowledge Base/.test(document.title + document.body.innerText.slice(0, 400))), 'Offline: Knowledge Base erreichbar');
  check(!e3.length, 'Web-App: keine JS-Fehler ' + e3.join(' | '));
  await ctx3.close(); srv.close();
  await browser.close();
  fs.rmSync(tmp, {recursive: true, force: true});
  console.log(fail ? fail + ' FEHLER' : 'ALLE RELEASE-TESTS OK'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

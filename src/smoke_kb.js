// Rauchtest im echten Browser (Chromium/Playwright): Knowledge Base + Tool laden, JS-Fehler, Überlauf, Kerninhalte.
// Aufruf: NODE_PATH=$(npm root -g) node src/smoke_kb.js   (ohne Playwright wird der Test übersprungen)
let chromium;
try { ({chromium} = require('playwright')); } catch (e) { console.log('Playwright fehlt – Browser-Rauchtest übersprungen.'); process.exit(0); }
const path = require('path'), DIST = path.join(__dirname, '..', 'docs');
(async () => {
  const browser = await chromium.launch();
  let fail = 0;
  const check = (ok, msg) => { console.log((ok ? 'OK   ' : 'FAIL ') + msg); if (!ok) fail++; };
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    const page = await browser.newPage({viewport: {width: w, height: h}});
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND/.test(m.text())) errs.push(m.text()); });
    await page.goto('file://' + path.join(DIST, 'knowledge.html'));
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({
      over: document.documentElement.scrollWidth - innerWidth,
      steps: document.querySelectorAll('#flow .step').length, nodes: document.querySelectorAll('#net .node').length,
      res: document.querySelectorAll('#res .res').length, card: document.querySelector('#skillcard h4')?.textContent,
      rules: document.querySelectorAll('#rules .rule').length, gloss: document.querySelectorAll('#gloss .term').length,
      quotes: document.querySelectorAll('#gloss blockquote').length, srcs: document.querySelectorAll('#srcs .panel').length,
    }));
    await page.fill('#q', 'hamstring'); await page.waitForTimeout(150);
    await page.click('#res .res'); await page.waitForTimeout(150);
    const ham = await page.evaluate(() => document.querySelector('#skillcard').innerText);
    check(!errs.length, `${w}px: keine JS-Fehler ${errs.join(' | ')}`);
    check(r.over <= 0, `${w}px: kein seitliches Scrollen (${r.over})`);
    check(r.steps === 12 && r.nodes >= 30 && r.rules >= 19 && r.gloss >= 40 && r.quotes >= 40 && r.srcs === 4, `${w}px: Abschnitte vollständig ${JSON.stringify(r)}`);
    check(r.card === "Grenth's Balance", `${w}px: Start-Karte Grenth's Balance`);
    check(/Causes Crippled/i.test(ham) && /Acquisition/i.test(ham),`${w}px: Suche + Skill-Karte (Hamstring verursacht Crippled)`);
    await page.close();
  }
  const page = await browser.newPage({viewport: {width: 1280, height: 900}});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.join(DIST, 'index.html') + '#m=pve&s=1&w=7&b=1&seed=36');
  await page.waitForTimeout(700);
  const t = await page.evaluate(() => ({conf: document.querySelector('.conflict')?.innerText || '', src: document.querySelector('#srcstate')?.textContent || '',
    kb: document.querySelector('#kblink')?.getAttribute('href')}));
  await page.hover('.sk'); await page.waitForTimeout(200);
  const tip = await page.evaluate(() => document.querySelector('#tip').innerText);
  check(!errs.length, 'Tool: keine JS-Fehler ' + errs.join(' | '));
  check(/Selbstsabotage|Self-sabotage/.test(t.conf), 'Tool: Selbstsabotage-Zeile auf der Karte');
  check(/Wiki 20\d\d-/.test(t.src) && t.kb === 'knowledge.html', 'Tool: Wiki-Stand + Link zur Knowledge Base');
  check(/Fundort|Source/.test(tip), 'Tool: Tooltip mit Fundort');
  await browser.close();
  console.log(fail ? fail + ' FEHLER' : 'ALLE BROWSER-TESTS OK');
  process.exit(fail ? 1 : 0);
})();

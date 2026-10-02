"""Bündelt Daten, Generator und Oberfläche in eigenständige HTML-Dateien.

docs/  = Webseite für GitHub Pages (Web-App): index.html (Tool), knowledge.html (Knowledge Base),
         manifest.webmanifest, sw.js (Offline-Speicher), App-Icons, icons/ (Skill-Icons).
dist/  = lokale Kopie zum Offline-Öffnen ohne Webserver (nicht im Repo).
"""
import hashlib
import json
import pathlib
import shutil

here = pathlib.Path(__file__).parent
root = here.parent
docs = root / 'docs'
dist = root / 'dist'
rd = lambda n: (here / n).read_text() if (here / n).exists() else ''

data = rd('data.js').replace('</', '<\\/').replace('const GWDATA=', 'window.GWDATA=')
gen, cores, gear, app, wiki, kbdata, kb = rd('generator.js'), rd('cores.js'), rd('gear.js'), rd('app.js'), rd('wiki.js'), rd('kb_data.js'), rd('kb.js')
app_html = rd('app.html').replace('/*DATA*/', data).replace('/*CORES*/', cores).replace('/*GEN*/', gen).replace('/*GEAR*/', gear) \
    .replace('/*WIKI*/', wiki).replace('/*APP*/', app)
kb_html = rd('kb.html').replace('/*DATA*/', data).replace('/*CORES*/', cores).replace('/*GEN*/', gen).replace('/*WIKI*/', wiki) \
    .replace('/*KBDATA*/', kbdata).replace('/*KB*/', kb)

PWA = '\n'.join([
    '<link rel="manifest" href="manifest.webmanifest">',
    '<meta name="theme-color" content="#0d0b09">',
    '<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">',
    '<link rel="apple-touch-icon" href="apple-touch-icon.png">',
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-status-bar-style" content="black">',
    '<meta name="apple-mobile-web-app-title" content="Bravery">',
    '<meta name="description" content="Random off-meta builds for Guild Wars 1 that still work – solo, hero teams and 1v1 PvP.">',
])

docs.mkdir(exist_ok=True)
(docs / 'index.html').write_text(app_html.replace('<!--PWA-->', PWA))
(docs / 'knowledge.html').write_text(kb_html)
# Alte Dateinamen leiten weiter (inkl. Build-Link nach dem #)
for old, new in (('gw1-bravery.html', 'index.html'), ('gw1-bravery-knowledge.html', 'knowledge.html')):
    (docs / old).write_text('<!doctype html><meta charset="utf-8"><title>Zaishen Ultimate Bravery</title>'
                            '<script>location.replace("' + new + '"+location.hash)</script><a href="' + new + '">Zaishen Ultimate Bravery</a>\n')
(docs / '.nojekyll').write_text('')
shutil.copyfile(here / 'app-icon.svg', docs / 'app-icon.svg')

# Skill-Icons: docs/icons ist der Bestand im Repo; ein neuer Skriptlauf (dist/icons) ergänzt ihn
for extra in ('icons', 'icons-hd', 'fundorte.js'):
    s = dist / extra
    if s.is_dir():
        shutil.copytree(s, docs / extra, dirs_exist_ok=True)
    elif s.exists():
        shutil.copyfile(s, docs / extra)

manifest = {
    'name': "Zaishen Ultimate Bravery – The Versatile Hero's Handbook", 'short_name': 'Bravery',
    'description': 'Random off-meta builds for Guild Wars 1 that still work.',
    'start_url': './', 'scope': './', 'display': 'standalone', 'orientation': 'any',
    'background_color': '#0d0b09', 'theme_color': '#0d0b09',
    'icons': [{'src': 'app-icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
              {'src': 'app-icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
              {'src': 'app-icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}],
}
(docs / 'manifest.webmanifest').write_text(json.dumps(manifest, ensure_ascii=False, indent=1))

# Service Worker: Seiten zuerst aus dem Netz (Updates kommen sofort an), offline aus dem Speicher; Icons einmal laden, dann lokal
shell = ['./', 'index.html', 'knowledge.html', 'manifest.webmanifest', 'app-icon-192.png', 'app-icon-512.png', 'apple-touch-icon.png', 'favicon-32.png']
version = hashlib.sha256((app_html + kb_html).encode('utf-8')).hexdigest()[:12]
sw = """// Generiert von src/build.py – nicht von Hand ändern
const V = 'gwub-%s', ICONS = 'gwub-icons', SHELL = %s;
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== ICONS).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
function netAndStore(req) {
  return fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); } return r; });
}
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (/\\/icons(-hd)?\\//.test(u.pathname)) {
    e.respondWith(caches.open(ICONS).then(c => c.match(r).then(m => m || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }))));
    return;
  }
  // Netz zuerst; nach 6 s ohne Antwort (oder offline) die gespeicherte Fassung, sonst weiter aufs Netz warten
  e.respondWith((async () => {
    const net = netAndStore(r);
    try { return await Promise.race([net, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 6000))]); }
    catch (err) {
      const m = await caches.match(r, {ignoreSearch: true}) || (r.mode === 'navigate' ? await caches.match('index.html') : undefined);
      return m || net;
    }
  })());
});
""" % (version, json.dumps(shell))
(docs / 'sw.js').write_text(sw)
print(docs / 'index.html', round(len(app_html) / 1024), 'KB ·', 'knowledge.html', round(len(kb_html) / 1024), 'KB · sw', version)

# Lokale Offline-Kopie (ohne Web-App-Teile): dist/gw1-bravery.html + dist/knowledge.html
if dist.is_dir():
    (dist / 'gw1-bravery.html').write_text(app_html.replace('<!--PWA-->', ''))
    (dist / 'knowledge.html').write_text(kb_html.replace('href="index.html"', 'href="gw1-bravery.html"'))
    for old in ('gw1-bravery-knowledge.html', 'gw1-bravery-logik.html'):
        if (dist / old).exists():
            (dist / old).unlink()
    print(dist, 'aktualisiert (lokale Kopie)')

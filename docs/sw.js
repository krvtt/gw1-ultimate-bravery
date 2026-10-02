// Generiert von src/build.py – nicht von Hand ändern
const V = 'gwub-f81ec6ce55be', ICONS = 'gwub-icons', SHELL = ["./", "index.html", "knowledge.html", "manifest.webmanifest", "app-icon-192.png", "app-icon-512.png", "apple-touch-icon.png", "favicon-32.png"];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== ICONS).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
function netAndStore(req) {
  return fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); } return r; });
}
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (/\/icons(-hd)?\//.test(u.pathname)) {
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

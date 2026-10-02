"""Testet tools/fundorte_abrufen.py gegen ein simuliertes MediaWiki (kein Internet nötig).

Aufruf: python3 src/test_fundorte.py
Prüft: Fortsetzungen (Kategorien), Weiterleitungen, Normalisierung, fehlende Seiten, PvP-Seiten,
429 + maxlag, Kategorien-Obergrenze, PvX-Vorlagen-Kategorien, Icons (fremder Host, Weiterleitung auf
fremden Host, Nicht-Bild, 404), Fortsetzen nach Abbruch, fundorte.js-Format, Bericht und ZIP.
"""
import importlib.util
import json
import pathlib
import shutil
import sys
import tempfile
import threading
import urllib.parse
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCRIPT = ROOT / 'tools' / 'fundorte_abrufen.py'
HTML = ROOT / 'docs' / 'index.html'

STATE = {'hits': 0, 'first429': True, 'maxlag': True, 'fail_after': None, 'parse': 0}
MISSING = {'Mark of Insecurity', 'Fragility (PvP)'}           # fehlen im Wiki
REDIRECT = {'"Fear Me!"': 'Fear Me (skill)'}                  # Weiterleitung
CATS_PER_PAGE = 12                                           # erzwingt clcontinue (50*12 > 500)
BAD_ICON = {'File:Empathy.jpg': 'foreign', 'File:Mantra of Resolve.jpg': 'redirect',
            'File:Shatter Delusions.jpg': 'notimage', 'File:Fragility.jpg': '404'}


def norm(t):
    t = t.replace('_', ' ').strip()
    return t[:1].upper() + t[1:]


def wikitext(title):
    if title.startswith('Build:'):
        return ('{{pvxbig|[build prof=W/E name="X" AxeMastery=12+1+1 Strength=12][Eviscerate][Body Blow]'
                '[Disrupting Chop][Shock][/build]}}\n{{Rating|great}}\n== Usage ==\nText')
    return ('{{Skill infobox|campaign=Nightfall}}\n== Acquisition ==\n* [[Chimor the Lightblooded|Chimor]] in '
            '{{Location|Jahai}}\n** Signet of Capture\n== Notes ==\n* Note for ' + title +
            ' <b>bold</b> &lt;script&gt;alert(1)&lt;/script&gt;\n* second note\n== Related skills ==\n* x\n')


def page_obj(title, i):
    return {'pageid': 1000 + i, 'ns': 0, 'title': title}


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send_json(self, obj, code=200, headers=None):
        b = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        STATE['hits'] += 1
        u = urllib.parse.urlsplit(self.path)
        q = dict(urllib.parse.parse_qsl(u.query))
        if STATE['fail_after'] is not None and STATE['hits'] > STATE['fail_after']:
            self.send_response(500)
            self.end_headers()
            return
        if u.path.startswith('/images/'):
            name = u.path.rsplit('/', 1)[-1]
            if name == 'redirect.jpg':
                self.send_response(302)
                self.send_header('Location', 'http://evil.example.com/x.jpg')
                self.end_headers()
                return
            if name == 'notimage.jpg':
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'<html>nope</html>')
                return
            self.send_response(200)
            self.send_header('Content-Type', 'image/jpeg')
            self.end_headers()
            self.wfile.write(b'\xff\xd8\xff\xe0' + b'0' * 200)
            return
        if STATE['first429']:
            STATE['first429'] = False
            return self.send_json({}, 429, {'Retry-After': '1'})
        if STATE['maxlag'] and q.get('action') == 'query':
            STATE['maxlag'] = False
            return self.send_json({'error': {'code': 'maxlag', 'info': 'lag'}})
        pvx = u.path.startswith('/pvx')
        if q.get('action') == 'parse':
            STATE['parse'] += 1
            return self.send_json({'parse': {'title': q['page'], 'text':
                '<div><h2>Effects</h2><p>Text of ' + q['page'] + '</p><script>x()</script>'
                '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>'
                '<ul><li>one</li><li>two</li></ul></div>'}})
        if q.get('meta') == 'siteinfo':
            return self.send_json({'query': {'namespaces': {'0': {'id': 0, 'name': ''},
                                                            '100': {'id': 100, 'name': 'Build', 'canonical': 'Build'}}}})
        if q.get('list') == 'allpages':
            start = int(q.get('apcontinue', 0))
            items = [{'ns': 100, 'title': 'Build:W/E Test ' + str(i)} for i in range(start, min(start + 500, 1200))]
            res = {'query': {'allpages': items}}
            if start + 500 < 1200:
                res['continue'] = {'apcontinue': str(start + 500), 'continue': '-||'}
            return self.send_json(res)
        if q.get('list') == 'categorymembers':
            cat = q['cmtitle']
            n = {'Category:Game mechanics': 152, 'Category:Conditions': 11, 'Category:Attributes': 400}.get(cat, 0)
            start = int(q.get('cmcontinue', 0))
            names = (['Creature types X'] if cat == 'Category:Game mechanics' else []) + \
                    [cat.split(':')[1] + ' page ' + str(i) for i in range(n)]
            items = [{'ns': 0, 'title': t} for t in names[start:start + 500]]
            res = {'query': {'categorymembers': items}}
            if start + 500 < len(names):
                res['continue'] = {'cmcontinue': str(start + 500), 'continue': '-||'}
            return self.send_json(res)
        if q.get('action') == 'query' and 'titles' in q:
            titles = q['titles'].split('|')
            normalized, redirects, pages, finals = [], [], [], []
            for t in titles:
                n = norm(t)
                if n != t:
                    normalized.append({'from': t, 'to': n})
                if n in REDIRECT:
                    redirects.append({'from': n, 'to': REDIRECT[n]})
                    n = REDIRECT[n]
                # wie im echten Wiki: Dateiseiten der Skill-Icons leiten auf den Skill-Artikel weiter
                if q.get('prop') == 'imageinfo' and q.get('redirects') == '1' and n.startswith('File:'):
                    to = n[5:].rsplit('.', 1)[0]
                    redirects.append({'from': n, 'to': to})
                    n = to
                finals.append(n)
            finals = list(dict.fromkeys(finals))
            cont = q.get('clcontinue')
            ci, cj = (int(x) for x in cont.split('|')) if cont else (0, 0)
            budget = 500
            next_cont = None
            for i, t in enumerate(finals):
                missing = t in MISSING or (q.get('prop') == 'imageinfo' and BAD_ICON.get(t) == '404')
                p = page_obj(t, i)
                if missing:
                    p['missing'] = True
                    if not cont:
                        pages.append(p)
                    continue
                if 'revisions' in q.get('prop', '') and not cont:
                    p['revisions'] = [{'revid': 1, 'timestamp': '2026-01-01T00:00:00Z',
                                       'slots': {'main': {'content': wikitext(t)}}}]
                if 'categories' in q.get('prop', '') and i >= ci and next_cont is None:
                    names = ['Cat ' + str(k) for k in range(CATS_PER_PAGE)]
                    if t.startswith('Build:'):
                        names = ['Great working builds', 'Meta builds'] + names[:10]
                    start = cj if i == ci else 0
                    take = names[start:start + budget]
                    budget -= len(take)
                    p['categories'] = [{'ns': 14, 'title': 'Category:' + c} for c in take]
                    if start + len(take) < len(names):
                        next_cont = str(i) + '|' + str(start + len(take))
                if q.get('prop') == 'imageinfo' and t.startswith('File:'):
                    kind = BAD_ICON.get(t)
                    url = {'foreign': 'https://evil.example.com/x.jpg',
                           'redirect': BASE + '/images/redirect.jpg',
                           'notimage': BASE + '/images/notimage.jpg'}.get(kind, BASE + '/images/' + str(i) + '.jpg')
                    p['imageinfo'] = [{'url': url, 'size': 250, 'mime': 'image/jpeg'}]
                if not cont or 'categories' in p:
                    pages.append(p)
            res = {'query': {'normalized': normalized, 'redirects': redirects, 'pages': pages}}
            if next_cont:
                res['continue'] = {'clcontinue': next_cont, 'continue': '||'}
            return self.send_json(res)
        self.send_json({'error': {'code': 'badrequest', 'info': self.path}})


def load_module(tmp):
    spec = importlib.util.spec_from_file_location('fa', SCRIPT)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    m.WIKI_API = BASE + '/api.php'
    m.WIKI = BASE
    m.PVX_API = BASE + '/pvx/api.php'
    m.ALLOWED_HOSTS = {'127.0.0.1'}
    m.ALLOWED_SCHEMES = {'http'}
    m.PAUSE = 0
    m.HERE, m.OUT, m.CACHE, m.ZIP = tmp, tmp / 'gw1-wissen', tmp / 'gw1-wissen' / '.cache', tmp / 'gw1-wissenspaket.zip'
    m.time.sleep = lambda s: None       # Wartezeiten im Test überspringen
    return m


def check(cond, msg):
    print(('OK   ' if cond else 'FAIL ') + msg)
    if not cond:
        check.failed += 1


check.failed = 0

if __name__ == '__main__':
    srv = ThreadingHTTPServer(('127.0.0.1', 0), H)
    BASE = 'http://127.0.0.1:' + str(srv.server_address[1])
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    tmp = pathlib.Path(tempfile.mkdtemp())
    shutil.copy(HTML, tmp / 'gw1-bravery.html')

    # Lauf 1: bricht mitten im Skill-Schritt ab (Server liefert nur noch 500)
    STATE['fail_after'] = 12
    m = load_module(tmp)
    sys.argv = ['x', '--pvx', '--icons']
    rc = m.main()
    check(rc == 1, 'Abbruch bei Serverfehlern -> Exit 1, Zwischenspeicher bleibt')
    cached = len(list((tmp / 'gw1-wissen' / '.cache').glob('*.json')))
    check(cached >= 8, 'Zwischenspeicher enthält bereits geladene Antworten (%d)' % cached)

    # Lauf 2: setzt fort
    STATE['fail_after'] = None
    hits_before = STATE['hits']
    m = load_module(tmp)
    rc = m.main()
    check(rc == 0, 'zweiter Lauf erfolgreich')
    skills = json.loads((tmp / 'gw1-wissen' / 'skills.json').read_text())
    mech = json.loads((tmp / 'gw1-wissen' / 'mechanik.json').read_text())
    pvx = json.loads((tmp / 'gw1-wissen' / 'pvx.json').read_text())
    rep = (tmp / 'gw1-wissen' / 'bericht.txt').read_text()
    fund_js = (tmp / 'fundorte.js').read_text()
    fund = json.loads(fund_js[len('window.GW_SOURCES='):].rstrip().rstrip(';'))

    check(len(skills) == 1319, 'alle 1319 Skills im Paket')
    full = [s for s in skills.values() if s.get('wikitext')]
    check(len(full) == 1318, 'Wikitext für alle außer der fehlenden Seite (%d)' % len(full))
    check(all(len(s.get('categories') or []) == CATS_PER_PAGE for s in full),
          'Kategorien über Fortsetzung vollständig (je %d)' % CATS_PER_PAGE)
    fear = next(s for s in skills.values() if s['en'] == '"Fear Me!"')
    check(fear.get('title') == 'Fear Me (skill)' and fear.get('wikitext'), 'Weiterleitung korrekt zugeordnet')
    pv = [s['pvp'] for s in skills.values() if 'pvp' in s]
    check(len(pv) == 186 and sum(1 for p in pv if p.get('wikitext')) == 185, 'PvP-Seiten: 185 von 186')
    check('Mark of Insecurity' in rep and 'Fragility (PvP)' in rep, 'fehlende Seiten im Bericht')
    check('Creature types X' not in mech, 'Kreatur-Seiten ausgelassen')
    check('Category:Attributes: übersprungen' in rep, 'zu große Kategorie übersprungen und berichtet')
    check(any(t.startswith('Conditions page') for t in mech), 'Kategorie-Mitglieder geladen')
    t0 = mech['Burning']['text']
    check('x()' not in t0 and '| A | B' in t0 and '• one' in t0 and '## Effects' in t0, 'gerenderter Text sauber')
    check(len(pvx) == 1200 and all('Meta builds' in p['categories'] for p in pvx),
          'PvX: 1200 Seiten, Vorlagen-Kategorien erfasst')
    check(pvx[0]['builds'][0].startswith('[build prof=W/E'), 'PvX-Skillleiste extrahiert')
    ic = {k: v.get('icon') for k, v in fund.items() if v.get('icon')}
    check(len(ic) == 1315, 'Icons: 1315 geladen, 4 Problemfälle ausgelassen (%d)' % len(ic))
    check('evil.example.com' in rep, 'fremder Host blockiert und berichtet')
    files = list((tmp / 'icons').iterdir())
    check(all(f.read_bytes()[:2] == b'\xff\xd8' for f in files), 'nur echte Bilddateien gespeichert (%d)' % len(files))
    one = next(v for v in fund.values() if v.get('lines'))
    check(one['lines'][0].startswith('• Chimor in Jahai') and one['page'].startswith(BASE + '/wiki/'),
          'fundorte.js: Fundort-Zeilen im alten Format')
    check(any('<script>' in n for n in one['notes']), 'Notizen enthalten Roh-HTML als Text (App escaped es)')
    check(not (tmp / 'gw1-wissen' / '.cache').exists(), 'Zwischenspeicher nach Erfolg gelöscht')
    with zipfile.ZipFile(tmp / 'gw1-wissenspaket.zip') as z:
        names = sorted(z.namelist())
    check(names == ['gw1-wissen/bericht.txt', 'gw1-wissen/mechanik.json', 'gw1-wissen/orte.json', 'gw1-wissen/orte_seiten.json', 'gw1-wissen/pvx.json',
                    'gw1-wissen/skills.json'], 'ZIP-Inhalt: ' + ', '.join(names))
    orte = json.loads((tmp / 'gw1-wissen' / 'orte.json').read_text())
    check(len(mech) <= STATE['parse'] <= len(mech) + len(orte), 'jede Mechanik-/Orte-Seite einmal gerendert (%d)' % STATE['parse'])
    check('Vanquisher' in orte and orte['Vanquisher'].get('text'), 'Orte-Seiten geladen (%d)' % len(orte))

    # Schnellmodus --nur-orte: keine Skill-Seiten, nur Orte
    hits0 = STATE['hits']
    m = load_module(tmp)
    sys.argv = ['x', '--nur-orte']
    rc = m.main()
    check(rc == 0 and STATE['hits'] - hits0 <= 40, '--nur-orte: schnell, %d Anfragen' % (STATE['hits'] - hits0))
    check('Orte-Seiten' in (tmp / 'gw1-wissen' / 'bericht.txt').read_text(), '--nur-orte: Bericht')
    # Schnellmodus --nur-icons: fundorte.js nur mit Icons
    (tmp / 'fundorte.js').unlink()
    m = load_module(tmp)
    sys.argv = ['x', '--nur-icons']
    rc = m.main()
    fj = json.loads((tmp / 'fundorte.js').read_text()[len('window.GW_SOURCES='):].rstrip().rstrip(';'))
    check(rc == 0 and len(fj) >= 1300 and all(set(v) <= {'icon', 'lines', 'notes'} and not v.get('lines') for v in fj.values()),
          '--nur-icons: fundorte.js nur mit Icon-Pfaden (%d)' % len(fj))
    # Nachlieferung (v2.2): Icons + Orte + Helden + Ausrüstung, ZIP nur mit Neuem + icons/ + fundorte.js
    hits0 = STATE['hits']
    m = load_module(tmp)
    sys.argv = ['x', '--nachlieferung']
    rc = m.main()
    with zipfile.ZipFile(tmp / 'gw1-wissenspaket.zip') as z:
        names = z.namelist()
    wj = [n for n in names if n.startswith('gw1-wissen/')]
    ic = [n for n in names if n.startswith('icons/')]
    check(rc == 0 and sorted(wj) == ['gw1-wissen/ausruestung.json', 'gw1-wissen/bericht.txt', 'gw1-wissen/helden.json',
                                     'gw1-wissen/orte.json', 'gw1-wissen/orte_seiten.json'] and len(ic) >= 1300 and 'fundorte.js' in names,
          '--nachlieferung: ZIP nur mit neuen Dateien (%s) + %d Icons + fundorte.js' % (', '.join(wj), len(ic)))
    hd = json.loads((tmp / 'gw1-wissen' / 'helden.json').read_text())
    au = json.loads((tmp / 'gw1-wissen' / 'ausruestung.json').read_text())
    check('List of hero-vetted skills' in hd and hd['List of hero-vetted skills'].get('text') and 'Zealous' in au,
          '--nachlieferung: Helden- (%d) und Ausrüstungs-Seiten (%d) gerendert' % (len(hd), len(au)))
    bt = (tmp / 'gw1-wissen' / 'bericht.txt').read_text()
    check('Helden-Seiten' in bt and 'Ausrüstungs-Seiten' in bt and 'Icons:' in bt, '--nachlieferung: Bericht vollständig')
    check(STATE['hits'] - hits0 < 1500, '--nachlieferung: %d Anfragen (Icons aus Zwischenspeicher/Ordner)' % (STATE['hits'] - hits0))

    # HD-Icons (v2.6): eigener Ordner, ZIP nur mit Liste
    m = load_module(tmp)
    sys.argv = ['x', '--icons-hd']
    rc = m.main()
    hd = json.loads((tmp / 'gw1-wissen' / 'icons_hd.json').read_text())
    with zipfile.ZipFile(tmp / 'gw1-wissenspaket.zip') as z:
        names = z.namelist()
    check(rc == 0 and len(hd) >= 1300 and (tmp / 'icons-hd').is_dir() and not any(n.startswith('icons-hd/') for n in names) and 'gw1-wissen/icons_hd.json' in names,
          '--icons-hd: %d HD-Icons im Ordner, ZIP nur mit Liste' % len(hd))

    # Sicherheit: fremde Hosts/Schemata werden vor jeder Anfrage blockiert
    m2 = load_module(tmp)
    m2.ALLOWED_HOSTS, m2.ALLOWED_SCHEMES = {'wiki.guildwars.com', 'gwpvx.fandom.com'}, {'https'}
    for bad in ['http://wiki.guildwars.com/api.php', 'https://evil.com/api.php', 'file:///etc/passwd',
                'https://wiki.guildwars.com.evil.com/x']:
        try:
            m2.check_url(bad)
            check(False, 'blockiert: ' + bad)
        except m2.BlockedHost:
            check(True, 'blockiert: ' + bad)
    m2.check_url('https://wiki.guildwars.com/api.php')
    m2.check_url('https://gwpvx.fandom.com/api.php')
    check(True, 'erlaubt: die beiden Wiki-Hosts')

    print('\nBericht:\n' + rep[:1500])
    print('ZIP %.2f MB | Anfragen gesamt %d' % ((tmp / 'gw1-wissenspaket.zip').stat().st_size / 1e6, STATE['hits']))
    shutil.rmtree(tmp)
    srv.shutdown()
    print('\n' + ('ALLE TESTS OK' if not check.failed else str(check.failed) + ' FEHLER'))
    sys.exit(1 if check.failed else 0)

#!/usr/bin/env python3
"""GW1 Ultimate Bravery – Wissenspaket aus dem Guild Wars Wiki (optional PvXwiki) holen.

Aufruf im Terminal, im Ordner mit gw1-bravery.html:
    python3 fundorte_abrufen.py            Skills (PvE + PvP) und Mechanik-Seiten     ca. 10–15 min
    python3 fundorte_abrufen.py --pvx      zusätzlich PvX-Builds (empfohlen)          + ca. 10–30 min
    python3 fundorte_abrufen.py --icons    zusätzlich Skill-Icons nach ./icons/       + ca. 25 min
    python3 fundorte_abrufen.py --nur-icons   NUR die Icons (+ fundorte.js mit Icon-Pfaden)  ca. 25 min
    python3 fundorte_abrufen.py --nur-orte    NUR Missions- und Vanquish-Listen fürs Logbuch  < 1 min
    python3 fundorte_abrufen.py --icons-hd   hochauflösende Skill-Icons nach ./icons-hd/ (Wiki: „<Skill> (large).jpg“)
                                              ZIP enthält nur die Liste, die Bilder bleiben im Ordner (zu groß für den Chat)
    python3 fundorte_abrufen.py --nachlieferung   Icons + Orte (inkl. Gruppengröße je Gebiet) + Helden-Regeln
                                              + Ausrüstung   ca. 25–30 min
                                              (für Tool v6: alles, was nach dem ersten Paket noch fehlt)
    (Optionen lassen sich kombinieren, z. B. --pvx --icons oder --nur-orte --nur-icons)

Ergebnis:
    gw1-wissenspaket.zip   an Claude schicken (Wiki-Rohtexte, Kategorien, Mechanik-Seiten, PvX, Bericht)
                           bei --nachlieferung/--nur-…: nur die neuen Dateien (+ icons/), klein genug für den Chat
    fundorte.js            für die App (Fundorte und Wiki-Notizen im Tooltip, ggf. Icons)

Sicherheit:
    - nur Python-Standardbibliothek, es wird nichts installiert
    - nur HTTPS zu wiki.guildwars.com und gwpvx.fandom.com; Weiterleitungen und
      Bild-Adressen werden gegen diese Liste geprüft, alles andere wird blockiert
    - Zertifikate werden geprüft (die Prüfung wird nie abgeschaltet)
    - kein Login, keine persönlichen Daten; schreibt nur in diesen Ordner
    - Größenlimit je Antwort, Icons nur als echte JPEG/PNG/GIF-Dateien
    - höflich: höchstens 1 Anfrage pro Sekunde, wartet, wenn das Wiki ausgelastet ist
Abbruch mit Ctrl+C ist ungefährlich: erneut starten setzt aus dem Zwischenspeicher fort.
"""
import datetime
import hashlib
import html
import json
import pathlib
import re
import shutil
import socket
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from html.parser import HTMLParser

VERSION = '2.7'
WIKI = 'https://wiki.guildwars.com'
WIKI_API = WIKI + '/api.php'
PVX_API = 'https://gwpvx.fandom.com/api.php'
ALLOWED_HOSTS = {'wiki.guildwars.com', 'gwpvx.fandom.com'}
ALLOWED_SCHEMES = {'https'}
UA = 'GW1-Ultimate-Bravery-Wissenspaket/' + VERSION + ' (private non-commercial fan tool; one-off import, max 1 req/s)'
PAUSE = 1.0                      # Sekunden zwischen zwei Anfragen an denselben Host
BATCH = 50                       # Seiten je API-Anfrage (Obergrenze für normale Nutzer)
MAX_JSON = 40 * 1024 * 1024      # Größenlimit einer API-Antwort
MAX_ICON = 300 * 1024            # Größenlimit eines Icons
MAX_ICON_HD = 2 * 1024 * 1024    # Größenlimit eines hochauflösenden Icons
MAX_CATEGORY = 300               # größere Kategorien werden übersprungen (Schutz vor Ausufern)
MAX_MECH = 900                   # Obergrenze Mechanik-Seiten
MAX_PVX = 40000                  # Obergrenze PvX-Seiten
ZIP_WARN_MB = 28                 # Upload-Grenze im Chat liegt bei ca. 30 MB

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / 'gw1-wissen'
CACHE = OUT / '.cache'
ZIP = HERE / 'gw1-wissenspaket.zip'

# Mechanik-Seiten: ganze Kategorien (nur Artikel, keine Unterkategorien) …
MECH_CATEGORIES = [
    'Category:Game mechanics', 'Category:Skill types', 'Category:Damage types', 'Category:Range types',
    'Category:Interrupt', 'Category:Conditions', 'Category:Attributes',
]
# … und einzelne Seiten. Titel, die es im Wiki nicht gibt, landen nur im Bericht.
MECH_PAGES = [
    # Zustände und Effekte
    'Condition', 'Bleeding', 'Blind', 'Burning', 'Cracked Armor', 'Crippled', 'Dazed', 'Deep Wound', 'Disease',
    'Poison', 'Weakness', 'Hex', 'Enchantment', 'Stance', 'Effect', 'Environment effect',
    'Condition removal', 'Hex removal', 'Enchantment removal',
    # Kernmechaniken
    'Energy', 'Energy regeneration', 'Energy management', 'Health', 'Health regeneration', 'Health degeneration',
    'Armor', 'Armor penetration', 'Damage', 'Critical hit', 'Life stealing', 'Health sacrifice', 'Overcast',
    'Exhaustion', 'Adrenaline', 'Knockdown', 'Interrupt', 'Shadow Step', 'Teleport', 'Aftercast',
    'Activation time', 'Recharge time', 'Attack speed', 'Movement speed', 'Resurrection', 'Death penalty',
    'Morale boost', 'Aggro', 'Area of effect', 'Range', 'Projectile', 'Block', 'Evade', 'Skill disable',
    'Corpse', 'Exploitation', 'Party-wide', 'Summoning sickness',
    # Skill-Typen
    'Skill', 'Skill type', 'Elite skill', 'PvE-only skill', 'PvP version', 'Attack skill', 'Melee attack',
    'Ranged attack', 'Axe attack', 'Sword attack', 'Hammer attack', 'Dagger attack', 'Lead attack',
    'Off-hand attack', 'Dual attack', 'Scythe attack', 'Spear attack', 'Bow attack', 'Pet attack',
    'Touch skill', 'Spell', 'Hex spell', 'Enchantment spell', 'Item spell', 'Weapon spell', 'Ward spell',
    'Well spell', 'Glyph', 'Signet', 'Shout', 'Chant', 'Echo', 'Preparation', 'Trap', 'Ritual',
    'Binding ritual', 'Nature ritual', 'Spirit', 'Minion', 'Form', 'Flash enchantment', 'Meditation', 'Mantra',
    'Skill combo', 'Pet',
    # Attribute
    'Attribute', 'Attribute point', 'Primary attribute', 'Strength', 'Expertise', 'Divine Favor',
    'Soul Reaping', 'Fast Casting', 'Energy Storage', 'Critical Strikes', 'Spawning Power', 'Leadership',
    'Mysticism',
    # Waffen und Ausrüstung
    'Weapon', 'Requirement', 'Martial weapon', 'Spellcasting weapon', 'Axe', 'Sword', 'Hammer', 'Dagger',
    'Scythe', 'Spear', 'Bow', 'Staff', 'Wand', 'Focus item', 'Shield', 'Off-hand', 'Weapon upgrade',
    'Inscription', 'Rune', 'Insignia', 'Headgear', 'Weapon swap',
    # PvE-Titel (bestimmen die Stärke der PvE-Skills), Helden, Vorlagen
    'Title', 'Sunspear rank', 'Lightbringer rank', 'Asura rank', 'Deldrimor rank', 'Ebon Vanguard rank',
    'Norn rank', 'Kurzick rank', 'Luxon rank', 'Allegiance rank', 'Hero', 'Henchman', 'Skill template format',
    'Template',
]
# Unterkategorien von "Game mechanics", die nicht gebraucht werden
SKIP_TITLE_RE = re.compile(r'^(Creature|Location|Portal)', re.I)


class Fatal(Exception):
    """Abbruch mit verständlicher Meldung (Zwischenspeicher bleibt erhalten)."""


class ApiError(Exception):
    pass


class BlockedHost(Exception):
    pass


CERT_HINT = (
    'Zertifikatsprüfung fehlgeschlagen (CERTIFICATE_VERIFY_FAILED).\n'
    'Auf dem Mac mit Python von python.org: im Finder Programme > Python 3.x öffnen und\n'
    '"Install Certificates.command" doppelklicken, danach das Skript erneut starten.\n'
    'Die Prüfung bitte NICHT abschalten.'
)


def log(msg=''):
    print(msg, flush=True)


# ---------------------------------------------------------------- HTTP (abgesichert)

def check_url(url):
    u = urllib.parse.urlsplit(url)
    if u.scheme not in ALLOWED_SCHEMES or (u.hostname or '').lower() not in ALLOWED_HOSTS:
        raise BlockedHost(url)


class _SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        check_url(urllib.parse.urljoin(req.full_url, newurl))
        return super().redirect_request(req, fp, code, msg, headers, newurl)


OPENER = urllib.request.build_opener(
    _SafeRedirect(), urllib.request.HTTPSHandler(context=ssl.create_default_context()))
_last_request = {}


def _throttle(host):
    wait = _last_request.get(host, 0) + PAUSE - time.monotonic()
    if wait > 0:
        time.sleep(wait)
    _last_request[host] = time.monotonic()


def _retry_after(headers, default):
    try:
        return max(1, min(120, int(headers.get('Retry-After'))))
    except (TypeError, ValueError):
        return default


def fetch(url, limit):
    """Lädt eine Adresse (nur erlaubte Hosts), höchstens `limit` Bytes. Gibt Bytes zurück, bei 404 None."""
    check_url(url)
    host = urllib.parse.urlsplit(url).hostname
    for attempt in range(6):
        _throttle(host)
        req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Encoding': 'identity'})
        try:
            with OPENER.open(req, timeout=60) as r:
                data = r.read(limit + 1)
            if len(data) > limit:
                raise Fatal('Antwort größer als erlaubt (' + str(limit // 1024) + ' KB): ' + url[:100])
            return data
        except BlockedHost:
            raise
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code in (429, 500, 502, 503, 504):
                wait = _retry_after(e.headers, 10 * (attempt + 1))
                log('  ' + host + ' ausgelastet (HTTP ' + str(e.code) + '), warte ' + str(wait) + ' s …')
                time.sleep(wait)
                continue
            if e.code == 403:
                raise Fatal('Zugriff verweigert (HTTP 403) von ' + host + '. Möglicherweise blockiert das Wiki '
                            'automatische Abrufe. Bitte Screenshot dieser Meldung an Claude schicken.')
            raise Fatal('HTTP ' + str(e.code) + ' von ' + host + ': ' + url[:100])
        except ssl.SSLCertVerificationError:
            raise Fatal(CERT_HINT)
        except (urllib.error.URLError, socket.timeout, ConnectionError) as e:
            if isinstance(getattr(e, 'reason', None), ssl.SSLCertVerificationError):
                raise Fatal(CERT_HINT)
            wait = 5 * (attempt + 1)
            log('  Verbindungsproblem (' + str(getattr(e, 'reason', e)) + '), neuer Versuch in ' + str(wait) + ' s')
            time.sleep(wait)
    raise Fatal(host + ' ist nach mehreren Versuchen nicht erreichbar. Internet prüfen und später erneut starten.')


WARNINGS = []


def api(base, params):
    """MediaWiki-API-Aufruf mit Zwischenspeicher (für Fortsetzen nach Abbruch)."""
    params = dict(params, format='json', formatversion='2')
    if base == WIKI_API:
        params.setdefault('maxlag', '5')
    url = base + '?' + urllib.parse.urlencode(sorted(params.items()))
    key = CACHE / (hashlib.sha256(url.encode('utf-8')).hexdigest()[:40] + '.json')
    if key.exists():
        try:
            return json.loads(key.read_text(encoding='utf-8'))
        except ValueError:
            pass
    for attempt in range(6):
        raw = fetch(url, MAX_JSON)
        if raw is None:
            raise Fatal('API nicht gefunden (404): ' + base)
        try:
            res = json.loads(raw.decode('utf-8'))
        except ValueError:
            raise Fatal('Unerwartete Antwort (kein JSON) von ' + base + ' – evtl. eine Schutz- oder Captcha-Seite. '
                        'Bitte Screenshot an Claude schicken.')
        err = res.get('error')
        if err and err.get('code') == 'maxlag':
            time.sleep(5 * (attempt + 1))
            continue
        if err:
            raise ApiError(str(err.get('code')) + ': ' + str(err.get('info')))
        for w in (res.get('warnings') or {}).values():
            text = str(w.get('warnings', w) if isinstance(w, dict) else w)[:300]
            if text not in WARNINGS:
                WARNINGS.append(text)
        key.write_text(json.dumps(res, ensure_ascii=False), encoding='utf-8')
        return res
    raise Fatal('Wiki dauerhaft ausgelastet (maxlag). Bitte später erneut starten.')


# ---------------------------------------------------------------- Abfragen

PAGE_PROPS = {'prop': 'revisions|categories', 'rvprop': 'content|ids|timestamp', 'rvslots': 'main',
              'cllimit': 'max', 'clshow': '!hidden'}


def query_pages(base, titles, extra, label, follow=True):
    """Holt Seiten in 50er-Blöcken inkl. Fortsetzungen. Liefert {angefragter Titel: Seite oder None}.
    follow=False: Weiterleitungen nicht folgen (Bilddateien: die Dateiseite leitet oft auf den Skill-Artikel weiter,
    die Bildinfo hängt aber an der Datei selbst)."""
    titles = list(dict.fromkeys(titles))
    result = {}
    for i in range(0, len(titles), BATCH):
        chunk = titles[i:i + BATCH]
        pages, norm, redir, cont = {}, {}, {}, {}
        while True:
            params = dict(extra, action='query', titles='|'.join(chunk))
            if follow:
                params['redirects'] = '1'
            params.update(cont)
            q = api(base, params)
            data = q.get('query', {})
            for n in data.get('normalized', []):
                norm[n['from']] = n['to']
            for r in data.get('redirects', []):
                redir[r['from']] = r['to']
            for p in data.get('pages', []):
                cur = pages.setdefault(p['title'], {'title': p['title']})
                if (p.get('missing') and not p.get('imageinfo')) or p.get('invalid'):
                    cur['missing'] = True
                if p.get('revisions'):
                    rv = p['revisions'][0]
                    cur['revid'] = rv.get('revid')
                    cur['timestamp'] = rv.get('timestamp')
                    cur['wikitext'] = (rv.get('slots') or {}).get('main', {}).get('content', rv.get('content'))
                if 'categories' in p:
                    cats = cur.setdefault('categories', [])
                    cats += [c['title'].split(':', 1)[-1] for c in p['categories'] if c.get('title')]
                if p.get('imageinfo'):
                    cur['imageinfo'] = p['imageinfo']
            if 'continue' not in q:
                break
            cont = q['continue']
        for t in chunk:
            n = norm.get(t, t)
            p = pages.get(redir.get(n, n))
            result[t] = p if p and not p.get('missing') else None
        log('  ' + label + ': ' + str(min(i + BATCH, len(titles))) + '/' + str(len(titles)))
    return result


def category_members(cat):
    """Artikel (Namensraum 0) einer Kategorie. None, wenn zu groß."""
    out, cont = [], {}
    while True:
        params = {'action': 'query', 'list': 'categorymembers', 'cmtitle': cat, 'cmnamespace': '0',
                  'cmtype': 'page', 'cmlimit': '500'}
        params.update(cont)
        res = api(WIKI_API, params)
        out += [m['title'] for m in res.get('query', {}).get('categorymembers', [])]
        if len(out) > MAX_CATEGORY:
            return None
        if 'continue' not in res:
            return out
        cont = res['continue']


class _Text(HTMLParser):
    """Gerendertes Wiki-HTML → lesbarer Text (Tabellenzellen mit |)."""
    BLOCK = {'p', 'div', 'br', 'li', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dd', 'dt', 'table', 'ul', 'ol'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.skip += 1
        elif tag in ('td', 'th'):
            self.out.append(' | ')
        elif tag in self.BLOCK:
            self.out.append('\n')
            if tag == 'li':
                self.out.append('• ')
            elif tag in ('h2', 'h3', 'h4'):
                self.out.append('## ')

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip = max(0, self.skip - 1)
        elif tag in self.BLOCK:
            self.out.append('\n')

    def handle_data(self, data):
        if not self.skip:
            self.out.append(data)


def html_to_text(src):
    p = _Text()
    p.feed(src)
    p.close()
    t = re.sub(r'[ \t]+', ' ', ''.join(p.out))
    t = re.sub(r' *\n *', '\n', t)
    return re.sub(r'\n{3,}', '\n\n', t).strip()


def parse_text(title):
    res = api(WIKI_API, {'action': 'parse', 'page': title, 'prop': 'text', 'redirects': '1',
                         'disableeditsection': '1', 'disablelimitreport': '1'})
    return html_to_text((res.get('parse') or {}).get('text') or '')


# ---------------------------------------------------------------- Auswertung für die App (fundorte.js)

def clean(line):
    """Wiki-Markup einer Zeile in lesbaren Text umwandeln."""
    s = re.sub(r'\{\{[^{}]*\|([^{}|]+)\}\}', r'\1', line)       # {{vorlage|text}} -> text
    s = re.sub(r'\{\{([^{}|]+)\}\}', r'\1', s)
    s = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]+)\]\]', r'\1', s)      # [[Ziel|Text]] -> Text
    s = re.sub(r"'''?|<[^>]+>", '', s)
    s = html.unescape(s).strip()
    depth = len(re.match(r'^\**', s).group(0))
    s = s.lstrip('*: ').strip()
    return ('  ' * max(0, depth - 1) + ('• ' if depth else '') + s) if s else ''


def section(wikitext, name, limit):
    m = re.search(r'==\s*' + name + r'\s*==(.*?)(?:\n==[^=]|\Z)', wikitext, re.S)
    if not m:
        return []
    lines = [clean(x) for x in m.group(1).splitlines()]
    return [x for x in lines if x and not x.startswith(('{|', '|', '!'))][:limit]


def wiki_url(title):
    return WIKI + '/wiki/' + urllib.parse.quote(title.replace(' ', '_'))


# ---------------------------------------------------------------- Schritte

def load_skills():
    cands = [HERE / 'gw1-bravery.html', HERE / 'index.html', HERE.parent / 'docs' / 'index.html']
    f = next((c for c in cands if c.exists()), None)
    if not f:
        raise Fatal('gw1-bravery.html nicht gefunden. Skript und gw1-bravery.html (oder index.html) in denselben Ordner legen '
                    '– oder das Skript im Ordner tools/ des Repos starten.')
    m = re.search(r'window\.GWDATA=(\{.*?\});\s*</script>', f.read_text(encoding='utf-8'), re.S)
    if not m:
        raise Fatal('gw1-bravery.html hat ein unerwartetes Format (Skilldaten nicht gefunden).')
    data = json.loads(m.group(1).replace('<\\/', '</'))
    skills = [{'id': s['id'], 'en': s['n']['en'], 'de': s['n'].get('de'),
               'pvp_id': (s.get('pvp') or {}).get('id')} for s in data['skills']]
    return skills, data.get('v')


def step_skills(skills, rep):
    log('\n[1] Skill-Seiten (PvE und PvP) …')
    titles = [s['en'] for s in skills] + [s['en'] + ' (PvP)' for s in skills if s['pvp_id']]
    pages = query_pages(WIKI_API, titles, PAGE_PROPS, 'Skills')
    out, fund = {}, {}
    for s in skills:
        p = pages.get(s['en'])
        e = {'en': s['en'], 'de': s['de']}
        if p:
            e.update({k: p.get(k) for k in ('title', 'revid', 'timestamp', 'categories', 'wikitext')})
            if p.get('wikitext'):
                fund[s['id']] = {'lines': section(p['wikitext'], 'Acquisition', 14),
                                 'notes': section(p['wikitext'], 'Notes', 10), 'page': wiki_url(p['title'])}
        else:
            rep['skills_fehlen'].append(s['en'])
        if s['pvp_id']:
            pp = pages.get(s['en'] + ' (PvP)')
            e['pvp'] = {'id': s['pvp_id']}
            if pp:
                e['pvp'].update({k: pp.get(k) for k in ('title', 'revid', 'timestamp', 'categories', 'wikitext')})
            else:
                e['pvp']['fehlt'] = True
                rep['pvp_fehlen'].append(s['en'] + ' (PvP)')
        out[str(s['id'])] = e
    write_json('skills.json', out)
    rep['skills'] = (len(skills) - len(rep['skills_fehlen']), len(skills))
    rep['pvp'] = (sum(1 for s in skills if s['pvp_id']) - len(rep['pvp_fehlen']), sum(1 for s in skills if s['pvp_id']))
    rep['fundorte'] = sum(1 for v in fund.values() if v['lines'])
    return fund


def step_mechanics(rep):
    log('\n[2] Mechanik-Seiten …')
    titles = list(MECH_PAGES)
    for cat in MECH_CATEGORIES:
        members = category_members(cat)
        if members is None:
            rep['kategorien'].append(cat + ': übersprungen (mehr als ' + str(MAX_CATEGORY) + ' Seiten)')
        elif not members:
            rep['kategorien'].append(cat + ': leer oder nicht vorhanden')
        else:
            rep['kategorien'].append(cat + ': ' + str(len(members)) + ' Seiten')
            titles += [t for t in members if not SKIP_TITLE_RE.match(t)]
    titles = list(dict.fromkeys(titles))[:MAX_MECH]
    pages = query_pages(WIKI_API, titles, PAGE_PROPS, 'Mechanik')
    out = {}
    for t in titles:
        p = pages.get(t)
        if not p:
            rep['mechanik_fehlen'].append(t)
            continue
        if p['title'] in out:
            out[p['title']]['angefragt'].append(t)
            continue
        out[p['title']] = {'angefragt': [t], 'revid': p.get('revid'), 'timestamp': p.get('timestamp'),
                           'categories': p.get('categories'), 'url': wiki_url(p['title']), 'wikitext': p.get('wikitext')}
    log('  Gerenderte Fassung (für Listen aus Vorlagen) …')
    for i, t in enumerate(out, 1):
        try:
            out[t]['text'] = parse_text(t)
        except ApiError as e:
            out[t]['text'] = None
            rep['fehler'].append('parse ' + t + ': ' + str(e))
        if i % 25 == 0 or i == len(out):
            log('  Mechanik gerendert: ' + str(i) + '/' + str(len(out)))
    write_json('mechanik.json', out)
    rep['mechanik'] = (len(out), len(titles))


BUILD_RE = re.compile(r'\[build\b[^\]]*\].*?\[/build\]', re.S | re.I)


def step_pvx(rep):
    log('\n[3] PvX-Builds …')
    info = api(PVX_API, {'action': 'query', 'meta': 'siteinfo', 'siprop': 'namespaces'})
    ns = next((v['id'] for v in info.get('query', {}).get('namespaces', {}).values()
               if v.get('name') == 'Build' or v.get('canonical') == 'Build'), None)
    if ns is None:
        rep['fehler'].append('PvX: Namensraum "Build" nicht gefunden – übersprungen')
        return
    titles, cont = [], {}
    while len(titles) < MAX_PVX:
        params = {'action': 'query', 'list': 'allpages', 'apnamespace': str(ns),
                  'apfilterredir': 'nonredirects', 'aplimit': '500'}
        params.update(cont)
        res = api(PVX_API, params)
        titles += [p['title'] for p in res.get('query', {}).get('allpages', [])]
        log('  PvX-Liste: ' + str(len(titles)))
        if 'continue' not in res:
            break
        cont = res['continue']
    pages = query_pages(PVX_API, titles[:MAX_PVX], PAGE_PROPS, 'PvX')
    out, cats = [], {}
    for t in titles[:MAX_PVX]:
        p = pages.get(t)
        if not p or not p.get('wikitext'):
            continue
        builds = BUILD_RE.findall(p['wikitext'])
        if not builds:
            continue
        out.append({'title': p['title'], 'timestamp': p.get('timestamp'),
                    'categories': p.get('categories') or [], 'builds': builds[:20]})
        for c in p.get('categories') or []:
            cats[c] = cats.get(c, 0) + 1
    write_json('pvx.json', out)
    rep['pvx'] = (len(out), len(titles))
    rep['pvx_kategorien'] = sorted(cats.items(), key=lambda kv: -kv[1])[:25]


def step_icons(skills, fund, rep):
    log('\n[4] Icons …')
    folder = HERE / 'icons'
    folder.mkdir(exist_ok=True)
    files = {}
    for s in skills:
        files.setdefault('File:' + s['en'] + '.jpg', s['id'])
        if '"' in s['en']:
            files.setdefault('File:' + s['en'].replace('"', '') + '.jpg', s['id'])
    pages = query_pages(WIKI_API, list(files), {'prop': 'imageinfo', 'iiprop': 'url|size|mime'}, 'Icon-Adressen', follow=False)
    done, blocked = set(), set()
    for title, sid in files.items():
        p = pages.get(title)
        if sid in done or not p or not p.get('imageinfo'):
            continue
        ii = p['imageinfo'][0]
        ext = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif'}.get(ii.get('mime'))
        url = ii.get('url') or ''
        if url.startswith('//'):
            url = 'https:' + url
        elif url.startswith('http://') and 'http' not in ALLOWED_SCHEMES:
            url = 'https://' + url[7:]
        if not ext or (ii.get('size') or 0) > MAX_ICON:
            continue
        dst = folder / (str(sid) + ext)
        if not dst.exists():
            try:
                data = fetch(url, MAX_ICON)
            except BlockedHost:
                blocked.add(urllib.parse.urlsplit(url).hostname or url[:60])
                continue
            if not data or not data.startswith((b'\xff\xd8', b'\x89PNG', b'GIF8')):
                continue
            dst.write_bytes(data)
        fund.setdefault(sid, {'lines': [], 'notes': []})['icon'] = 'icons/' + dst.name
        done.add(sid)
        if len(done) % 100 == 0:
            log('  Icons: ' + str(len(done)))
    rep['icons'] = (len(done), len(skills))
    if blocked:
        rep['fehler'].append('Icons von fremden Hosts blockiert: ' + ', '.join(sorted(blocked)))


def step_icons_hd(skills, rep):
    """Hochauflösende Icons: das Wiki führt sie als „<Skill> (large).jpg“ (Galerie „Gallery of high resolution skill icons“)."""
    log('\n[4b] Hochauflösende Icons …')
    folder = HERE / 'icons-hd'
    folder.mkdir(exist_ok=True)
    files = {}
    for s in skills:
        for name in dict.fromkeys([s['en'], s['en'].replace('"', '')]):
            for ext in ('.jpg', '.png'):
                files.setdefault('File:' + name + ' (large)' + ext, s['id'])
    pages = query_pages(WIKI_API, list(files), {'prop': 'imageinfo', 'iiprop': 'url|size|mime'}, 'HD-Icon-Adressen', follow=False)
    done, blocked = {}, set()
    for title, sid in files.items():
        p = pages.get(title)
        if sid in done or not p or not p.get('imageinfo'):
            continue
        ii = p['imageinfo'][0]
        ext = {'image/jpeg': '.jpg', 'image/png': '.png'}.get(ii.get('mime'))
        url = ii.get('url') or ''
        if url.startswith('//'):
            url = 'https:' + url
        if not ext or (ii.get('size') or 0) > MAX_ICON_HD:
            continue
        dst = folder / (str(sid) + ext)
        if not dst.exists():
            try:
                data = fetch(url, MAX_ICON_HD)
            except BlockedHost:
                blocked.add(urllib.parse.urlsplit(url).hostname or url[:60])
                continue
            if not data or not data.startswith((b'\xff\xd8', b'\x89PNG')):
                continue
            dst.write_bytes(data)
        done[sid] = dst.name
        if len(done) % 100 == 0:
            log('  HD-Icons: ' + str(len(done)))
    write_json('icons_hd.json', done)
    rep['icons_hd'] = (len(done), len(skills))
    if blocked:
        rep['fehler'].append('HD-Icons von fremden Hosts blockiert: ' + ', '.join(sorted(blocked)))


# Missionen und vanquishbare Gebiete (für das Logbuch). Seitentitel laut Guild Wars Wiki (Stand 10/2026).
ORTE_PAGES = ['Vanquisher', 'Tyrian Vanquisher', 'Canthan Vanquisher', 'Elonian Vanquisher', 'Legendary Vanquisher',
              'List of Prophecies missions and primary quests', 'List of Factions missions and primary quests',
              'List of Nightfall missions and primary quests', 'List of Eye of the North primary quests', 'Mission', 'Hard mode']


# Helden: welche Skills Helden nicht nutzen können bzw. wie die KI sie einsetzt (für Team-Builds aus Helden).
# Mehrere mögliche Titel – was es nicht gibt, steht nur im Bericht.
HELDEN_PAGES = ['List of hero-vetted skills', 'Hero behavior', 'Hero AI', 'Hero skill bar', 'Hero', 'Henchman',
                'Hero (title)', 'Party', 'Flag']
# Ausrüstung: Prüfung der Waffen-Vorschläge (Präfixe/Suffixe, Inschriften, Schilde, Fokusse) und der PvE-Titel-Skills
AUSRUESTUNG_PAGES = ['Weapon upgrade', 'Weapon upgrades', 'Upgrade component', 'Prefix', 'Suffix', 'Inscription',
                     'Barbed', 'Crippling', 'Poisonous', 'Silencing', 'Sundering', 'Furious', 'Vampiric', 'Zealous',
                     'Ebon', 'Fiery', 'Icy', 'Shocking', 'Heavy', 'Of Fortitude', 'Of Defense', 'Of Enchanting',
                     'Of Shelter', 'Of Warding', 'Of Slaying', 'Of Memory', 'Of Quickening', 'Of Aptitude',
                     'Shield', 'Focus item', 'Staff', 'Wand', 'Off-hand', 'PvE-only skill', 'PvE-only skills',
                     'PvE skill', 'Title', 'Signet of Capture']


def step_pages(nr, label, titles, fname, key, rep):
    """Einzelne Wiki-Seiten holen und gerendert ablegen (Orte, Helden, Ausrüstung)."""
    log('\n[' + nr + '] ' + label + ' …')
    pages = query_pages(WIKI_API, titles, PAGE_PROPS, label)
    out = {}
    for t in titles:
        p = pages.get(t)
        if not p:
            rep['fehler'].append(label + ': Seite nicht gefunden (unkritisch): ' + t)
            continue
        if p['title'] in out:
            continue
        e = {'title': p['title'], 'angefragt': t, 'revid': p.get('revid'), 'timestamp': p.get('timestamp'),
             'categories': p.get('categories'), 'url': wiki_url(p['title']), 'wikitext': p.get('wikitext')}
        try:
            e['text'] = parse_text(p['title'])
        except ApiError as err:
            rep['fehler'].append('parse ' + t + ': ' + str(err))
        out[p['title']] = e
    write_json(fname, out)
    rep[key] = (len(out), len(titles))


MAX_ORTE_LINKS = 1200            # Obergrenze verlinkter Gebiets-/Missionsseiten
LINK_RE = re.compile(r'\[\[([^\]|#\n]+)')


def step_orte(rep):
    step_pages('5', 'Missionen und Vanquish-Gebiete', ORTE_PAGES, 'orte.json', 'orte', rep)
    # v2.3: verlinkte Gebiete und Missionen einzeln holen – ihre Infobox enthält Gruppengröße, Region und Kampagne
    # (für „Roll your destiny“). Nur Links aus Tabellen- und Listenzeilen, ohne Namensräume.
    try:
        listen = json.loads((OUT / 'orte.json').read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return
    links, quelle = [], {}
    for t, e in listen.items():
        for line in (e.get('wikitext') or '').splitlines():
            if not line.lstrip().startswith(('|', '*', '#', '!')):
                continue
            for m in LINK_RE.findall(line):
                m = m.strip()
                if not m or ':' in m or m in listen:
                    continue
                if m not in quelle:
                    links.append(m)
                quelle.setdefault(m, []).append(t)
    # v2.5: vanquishbare Gebiete stehen gerendert in der Kill-Tabelle (Vorlage), Missionen als „N. Name“ in den Listen
    gebiete, missionen = [], []
    for t, e in listen.items():
        if t == 'Vanquisher':
            gebiete = [a for _, _, a in parse_vq_areas(e.get('text') or '')]
        elif t.startswith('List of'):
            missionen += [m for _, m in parse_missions(e.get('text') or '')]
    rolle = {}
    for a in gebiete:
        rolle.setdefault(a, 'gebiet')
    for m in missionen:
        for v in (m, m + ' (mission)', m + ' (outpost)'):
            rolle.setdefault(v, 'mission')
    links = list(dict.fromkeys([x for x in rolle] + links))[:MAX_ORTE_LINKS]
    log('\n[5b] Gebiete, Missionen und verlinkte Seiten (' + str(len(links)) + ') …')
    pages = query_pages(WIKI_API, links, PAGE_PROPS, 'Gebiete')
    out = {}
    for t in links:
        p = pages.get(t)
        if not p or p['title'] in out:
            continue
        wt = p.get('wikitext') or ''
        out[p['title']] = {'angefragt': t, 'rolle': rolle.get(t, 'link'), 'aus': quelle.get(t, [])[:6], 'categories': p.get('categories'),
                           'timestamp': p.get('timestamp'), 'infobox': wt[:5000]}
    # Ausgänge der Gebiete (Außenposten) holen: deren Infobox enthält die Gruppengröße
    exits = []
    for t, e in out.items():
        if e['rolle'] != 'gebiet':
            continue
        m = re.search(r'\|\s*exits\s*=([^\n]*)', e['infobox'])
        for x in LINK_RE.findall(m.group(1) if m else ''):
            x = x.strip()
            if x and ':' not in x and x not in out and x not in exits:
                exits.append(x)
    if exits:
        log('  Ausgänge (Außenposten): ' + str(len(exits)))
        pages = query_pages(WIKI_API, exits[:MAX_ORTE_LINKS], PAGE_PROPS, 'Außenposten')
        for t in exits[:MAX_ORTE_LINKS]:
            p = pages.get(t)
            if p and p['title'] not in out:
                out[p['title']] = {'angefragt': t, 'rolle': 'ausgang', 'categories': p.get('categories'),
                                   'timestamp': p.get('timestamp'), 'infobox': (p.get('wikitext') or '')[:5000]}
    write_json('orte_seiten.json', out)
    rep['orte_seiten'] = (len(out), len(links) + len(exits))
    rep['orte_gebiete'] = (sum(1 for e in out.values() if e['rolle'] == 'gebiet'), len(gebiete))
    rep['orte_missionen'] = (len(set(missionen)), sum(1 for e in out.values() if e['rolle'] == 'mission'))


CAMPAIGN_HEADS = ('Prophecies', 'Beyond', 'Factions', 'Nightfall', 'Eye of the North')


def parse_vq_areas(text):
    """Gerenderte Kill-Tabelle der Seite „Vanquisher“ → [(Kampagne, Region, Gebiet)]."""
    i = text.find('## Explorable area kill counts')
    j = text.find('## Larger party sizes', i + 1)
    if i < 0:
        return []
    # Jede Tabellenzelle steht als „| Text“ auf eigener Zeile; eine Zeile = Region, Gebiet, Ø, Min, Max, Notiz
    camp, out, cells = None, [], []
    for line in text[i:j if j > 0 else None].splitlines():
        line = line.strip()
        if line.startswith('## '):
            h = line[3:].strip()
            if h in CAMPAIGN_HEADS and h != 'Beyond':
                camp = h
            continue
        if line.startswith('|'):
            cells.append((camp, line[1:].strip()))
    k = 0
    while k + 4 < len(cells):
        c = [x for _, x in cells[k:k + 5]]
        if c[2].isdigit() and c[3].isdigit() and c[4].isdigit() and not c[0].isdigit():
            out.append((cells[k][0], c[0], c[1]))
            k += 5
        else:
            k += 1
    return [o for o in out if o[0]]


def parse_missions(text):
    """Gerenderte Missionsliste → [(Region, Mission)] aus Zeilen „N. Name“."""
    region, out = None, []
    for line in text.splitlines():
        line = line.strip()
        if line.startswith('## '):
            region = line[3:].strip()
            continue
        m = re.match(r'^\d+[a-z]?\.\s+(.+)$', line)
        if m and region and not region.startswith(('Contents', 'Notes', 'Trivia', 'References')):
            name = re.sub(r'\s*\((Required|Kurzick|Luxon)[^)]*\)\s*$', '', m.group(1)).strip()
            if (region, name) not in out:
                out.append((region, name))
    return out


WRITTEN = []


def write_json(name, obj):
    (OUT / name).write_text(json.dumps(obj, ensure_ascii=False, indent=0), encoding='utf-8')
    WRITTEN.append(name)


def write_report(rep, dver, opts, started):
    L = ['GW1 Ultimate Bravery – Wissenspaket',
         'Skript-Version: ' + VERSION + ' | Datenstand Tool: ' + str(dver) + ' | Python ' + sys.version.split()[0],
         'Abgerufen: ' + started + ' bis ' + datetime.datetime.now().strftime('%Y-%m-%d %H:%M'),
         'Optionen: ' + (' '.join(sorted(opts)) or '–'), '']
    if 'skills' in rep:
        L += ['Skills (PvE): %d von %d gefunden' % rep['skills'], 'Skills (PvP-Seiten): %d von %d gefunden' % rep['pvp'],
              'Skills mit Fundort: %d' % rep['fundorte']]
    if 'orte' in rep:
        L.append('Orte-Seiten (Missionen/Vanquish): %d verschiedene Seiten aus %d Titeln (Weiterleitungen zusammengefasst)' % rep['orte'])
    if 'orte_seiten' in rep:
        L.append('Gebiets-/Missions-/Außenpostenseiten: %d verschiedene Seiten aus %d Titeln' % rep['orte_seiten'])
    if 'orte_gebiete' in rep:
        L.append('Vanquish-Gebiete: %d Seiten geladen von %d in der Kill-Tabelle' % rep['orte_gebiete'])
    if 'orte_missionen' in rep:
        L.append('Missionen: %d in den Listen, %d Seiten (Varianten „(mission)“/„(outpost)“) geladen' % rep['orte_missionen'])
    if 'mechanik' in rep:
        L.append('Mechanik-Seiten: %d gefunden (%d angefragt)' % rep['mechanik'])
    if 'pvx' in rep:
        L.append('PvX: %d Seiten mit Skillleisten (%d Build-Seiten)' % rep['pvx'])
    if 'helden' in rep:
        L.append('Helden-Seiten: %d verschiedene Seiten aus %d Titeln (fehlende Titel unter „Fehler“)' % rep['helden'])
    if 'ausruestung' in rep:
        L.append('Ausrüstungs-Seiten: %d verschiedene Seiten aus %d Titeln (fehlende Titel unter „Fehler“)' % rep['ausruestung'])
    if 'icons' in rep:
        L.append('Icons: %d von %d' % rep['icons'])
    if 'icons_hd' in rep:
        L.append('HD-Icons: %d von %d (Ordner icons-hd/, nicht im ZIP)' % rep['icons_hd'])
    blocks = [('Fehlende Skill-Seiten', rep['skills_fehlen']), ('Fehlende PvP-Seiten', rep['pvp_fehlen']),
              ('Nicht gefundene Mechanik-Seiten (unkritisch)', rep['mechanik_fehlen']),
              ('Kategorien', rep['kategorien']),
              ('PvX-Kategorien (Top 25)', [c + ': ' + str(n) for c, n in rep.get('pvx_kategorien', [])]),
              ('Fehler', rep['fehler']), ('API-Hinweise', WARNINGS[:30])]
    for head, items in blocks:
        if items:
            L += ['', head + ' (' + str(len(items)) + '):'] + ['  ' + str(x) for x in items]
    (OUT / 'bericht.txt').write_text('\n'.join(L) + '\n', encoding='utf-8')
    return L


def make_zip(only_new=False, icons=False):
    """Packt das Wissenspaket. only_new: nur die in diesem Lauf geschriebenen Dateien (alte große Dateien bleiben draußen)."""
    keep = set(WRITTEN) | {'bericht.txt'}
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in sorted(OUT.iterdir()):
            if f.is_file() and (not only_new or f.name in keep):
                z.write(f, 'gw1-wissen/' + f.name)
        if icons:
            folder = HERE / 'icons'
            for f in sorted(folder.glob('*')) if folder.is_dir() else []:
                if f.is_file() and f.suffix in ('.jpg', '.png', '.gif'):
                    z.write(f, 'icons/' + f.name, compress_type=zipfile.ZIP_STORED)
            if (HERE / 'fundorte.js').exists():
                z.write(HERE / 'fundorte.js', 'fundorte.js')
    return ZIP.stat().st_size / 1024 / 1024


def main():
    opts = set(sys.argv[1:])
    if '--nachlieferung' in opts:
        opts |= {'--nur-icons', '--nur-orte', '--nur-helden', '--nur-ausruestung'}
    if opts - {'--pvx', '--icons', '--nur-icons', '--nur-orte', '--nur-helden', '--nur-ausruestung', '--nachlieferung', '--icons-hd'}:
        print(__doc__)
        return 0 if opts & {'-h', '--help', '--hilfe'} else 2
    started = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    log('GW1 Bravery – Wissenspaket v' + VERSION + ' (' + (' '.join(sorted(opts)) or 'Standard') + ')')
    OUT.mkdir(exist_ok=True)
    CACHE.mkdir(exist_ok=True)
    rep = {'skills_fehlen': [], 'pvp_fehlen': [], 'mechanik_fehlen': [], 'kategorien': [], 'fehler': []}
    try:
        skills, dver = load_skills()
        log(str(len(skills)) + ' Skills im Tool, davon ' + str(sum(1 for s in skills if s['pvp_id'])) + ' mit PvP-Version.')
        only = opts & {'--nur-icons', '--nur-orte', '--nur-helden', '--nur-ausruestung', '--icons-hd'}   # Schnellmodus: nur Teile
        fund = {}
        if not only:
            fund = step_skills(skills, rep)
            step_mechanics(rep)
            if '--pvx' in opts:
                try:
                    step_pvx(rep)
                except (Fatal, ApiError, BlockedHost) as e:
                    rep['fehler'].append('PvX abgebrochen: ' + str(e))
                    log('  PvX abgebrochen: ' + str(e) + ' (Rest läuft weiter)')
        if not only or '--nur-orte' in opts:
            step_orte(rep)
        if '--nur-helden' in opts:
            step_pages('6', 'Helden', HELDEN_PAGES, 'helden.json', 'helden', rep)
        if '--nur-ausruestung' in opts:
            step_pages('7', 'Ausrüstung', AUSRUESTUNG_PAGES, 'ausruestung.json', 'ausruestung', rep)
        if '--icons' in opts or '--nur-icons' in opts:
            step_icons(skills, fund, rep)
        if '--icons-hd' in opts:
            step_icons_hd(skills, rep)
        if fund:   # fundorte.js nur schreiben, wenn es etwas zu schreiben gibt (bei --nur-icons: nur die Icons)
            (HERE / 'fundorte.js').write_text('window.GW_SOURCES=' + json.dumps(fund, ensure_ascii=False) + ';\n',
                                               encoding='utf-8')
        lines = write_report(rep, dver, opts, started)
        mb = make_zip(only_new=bool(only), icons=bool(only) and '--nur-icons' in opts)
    except KeyboardInterrupt:
        log('\nAbgebrochen. Erneut starten setzt aus dem Zwischenspeicher fort.')
        return 130
    except (Fatal, ApiError, BlockedHost) as e:
        log('\nFEHLER: ' + str(e))
        log('Bereits geladene Daten bleiben im Zwischenspeicher; erneut starten setzt fort.')
        return 1
    shutil.rmtree(CACHE, ignore_errors=True)
    summary = lines[5:lines.index('', 5)] if '' in lines[5:] else lines[5:]
    log('\n' + '\n'.join(summary))
    log('\nFertig. Bitte an Claude schicken: ' + ZIP.name + ' (' + ('%.1f' % mb) + ' MB)')
    if mb > ZIP_WARN_MB:
        log('Achtung: größer als ' + str(ZIP_WARN_MB) + ' MB – falls der Upload scheitert, Claude Bescheid geben.')
    if only and '--nur-icons' in opts:
        log('Icons liegen im Ordner icons/ neben gw1-bravery.html – Seite neu laden, dann erscheinen sie auf den Skill-Kacheln.')
    else:
        log('fundorte.js liegt neben gw1-bravery.html – Seite neu laden, dann zeigen die Tooltips Fundorte.')
    return 0


if __name__ == '__main__':
    sys.exit(main())

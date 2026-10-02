"""Liest das Wissenspaket (gw1-wissen/*.json, erzeugt von dist/fundorte_abrufen.py) und
liefert je Skill strukturierte Wiki-Fakten: Infobox-Felder, Abschnitte, Kategorien.

Nur Standardbibliothek. Wird von build_data.py genutzt.
"""
import html
import json
import pathlib
import re

WIKI = 'https://wiki.guildwars.com/wiki/'


def load(path):
    p = pathlib.Path(path)
    if not (p / 'skills.json').exists():
        return None
    k = {'skills': json.loads((p / 'skills.json').read_text(encoding='utf-8'))}
    for name in ('mechanik', 'pvx', 'orte', 'orte_seiten', 'helden', 'ausruestung'):
        f = p / (name + '.json')
        k[name] = json.loads(f.read_text(encoding='utf-8')) if f.exists() else None
    rep = p / 'bericht.txt'
    k['bericht'] = rep.read_text(encoding='utf-8') if rep.exists() else ''
    return k


def infobox(wikitext):
    """Felder der Skill-Infobox als dict (Listenfelder causes1.. → Liste)."""
    m = re.search(r'\{\{Skill infobox(.*?)\n\}\}', wikitext or '', re.S)
    if not m:
        return {}
    out = {}
    for line in re.split(r'\n\s*\|', '\n' + m.group(1)):
        if '=' not in line:
            continue
        k, v = line.split('=', 1)
        k, v = k.strip().lower(), v.strip()
        if not v or v.startswith('|'):
            continue
        base = re.sub(r'\d+$', '', k)
        base = {'casues': 'causes', 'remvoes': 'removes', 'reqyires': 'requires', 'targert': 'target'}.get(base, base)
        if base in ('causes', 'removes', 'requires', 'prevents'):
            out.setdefault(base, []).append(v.lower())
        else:
            out[base] = v
    return out


def section(wikitext, name):
    m = re.search(r'\n==\s*' + name + r'\s*==(.*?)(?=\n==[^=]|\Z)', wikitext or '', re.S | re.I)
    return m.group(1) if m else ''


def clean(s):
    """Wiki-Markup → Klartext (für Tooltips und Doku)."""
    s = re.sub(r'<ref[^>]*>.*?</ref>|<ref[^>]*/>', '', s, flags=re.S)
    s = re.sub(r'\{\{gr2?\|([^|}]*)\|([^|}]*)(\|[^}]*)?\}\}', r'\1…\2', s)
    s = re.sub(r'\{\{(?:skill icon|skill link|sic|s|q|location|npc|item|monster)\|([^|}]+)[^}]*\}\}', r'\1', s, flags=re.I)
    s = re.sub(r'\{\{(?:gray|grey)\|([^}]*)\}\}', r'\1', s, flags=re.I)
    s = re.sub(r'\{\{[^{}]*\}\}', '', s)
    s = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]+)\]\]', r'\1', s)
    s = re.sub(r'\[https?://\S+ ([^\]]+)\]', r'\1', s)
    s = re.sub(r"'''?|<[^>]+>", '', s)
    return html.unescape(s).strip()


def bullets(text, limit=12, maxlen=320):
    """Aufzählung (* / **) → Liste sauberer Zeilen, Einrückung als '  '."""
    out = []
    for line in (text or '').splitlines():
        st = line.strip()
        if not st or st.startswith(('{|', '|', '!', '[[Category', '{{Skill change', '[[de:', '__')):
            continue
        depth = len(re.match(r'^[*#:]*', st).group(0))
        c = clean(st.lstrip('*#: '))
        if not c or re.match(r'^(Category|de):', c):
            continue
        if len(c) > maxlen:
            c = c[:maxlen - 1].rsplit(' ', 1)[0] + '…'
        out.append(('  ' * max(0, depth - 1)) + c)
        if len(out) >= limit:
            break
    return out


# ---------------------------------------------------------------- PvX: Leisten, Meta-Wert, gemessene Paare

PVX_PAGE_W = [  # (Kategorie-Teilstring, Gewicht) – höchstes zutreffendes Gewicht zählt
    ('Great working', 1.0), ('Good working', 0.7), ('Meta working', 1.0), ('Provisional', 0.25),
    ('Testing', 0.15), ('Trial', 0.1), ('Untested', 0.15),
]
PVP_CATS = ('PvP', 'GvG', 'RA', 'HA', 'AB', 'FA', 'JQ', 'TA', 'Codex', 'Costume Brawl')
PVE_CATS = ('PvE', 'Hero', 'Farming', 'Running', 'Dungeon', 'Quest', 'SC')


def norm_name(x):
    x = re.sub(r'@\d+$', '', x.strip())
    x = re.sub(r'\s*\((luxon|kurzick|pvp|pve)\)$', '', x, flags=re.I)
    return x.replace('"', '').strip().lower()


def pvx_bars(pages, known):
    """Alle Leisten aus PvX-Seiten: [{'page', 'skills': [ids], 'w', 'pve', 'pvp', 'meta'}]. known: norm_name → id."""
    out = []
    for p in pages or []:
        cats = p.get('categories') or []
        w = max([wv for key, wv in PVX_PAGE_W if any(key in c for c in cats)] + [0.2])
        meta = any(c in ('Meta', 'Meta builds') or c.startswith('Meta working') for c in cats)
        pvp = any(any(k in c for k in PVP_CATS) for c in cats)
        pve = any(any(k in c for k in PVE_CATS) for c in cats) or not pvp
        for block in p.get('builds') or []:
            cur = []
            for tok in re.findall(r'\[([^\[\]]+)\]', block):
                if tok.lower().startswith('build ') or tok.strip() == '/build':
                    if len(cur) >= 6:
                        out.append({'page': p['title'], 'skills': cur, 'w': w, 'pve': pve, 'pvp': pvp, 'meta': meta})
                    cur = []
                    continue
                sid = known.get(norm_name(tok))
                if sid is not None and sid not in cur:
                    cur.append(sid)
            if len(cur) >= 6:
                out.append({'page': p['title'], 'skills': cur, 'w': w, 'pve': pve, 'pvp': pvp, 'meta': meta})
    return out


def pvx_usage(bars, mode):
    """Gewichtete Nutzung je Skill in funktionierenden Leisten eines Modus (Meta-Seiten doppelt)."""
    use, tot = {}, 0.0
    for b in bars:
        if not b[mode]:
            continue
        w = b['w'] * (2 if b['meta'] else 1)
        tot += w
        for s in b['skills']:
            use[s] = use.get(s, 0) + w
    return use, tot


def pvx_pairs(bars, min_count=3, min_lift=2.5, max_share=0.12):
    """Gemessene Paare: Skills, die in funktionierenden Leisten auffällig oft zusammen stehen (Lift)."""
    good = [b for b in bars if b['w'] >= 0.7]
    n = len(good)
    single, pair = {}, {}
    for b in good:
        ss = sorted(set(b['skills']))
        for s in ss:
            single[s] = single.get(s, 0) + 1
        for i in range(len(ss)):
            for j in range(i + 1, len(ss)):
                k = (ss[i], ss[j])
                pair[k] = pair.get(k, 0) + 1
    out = []
    for (a, b), c in pair.items():
        if c < min_count or single[a] / n > max_share or single[b] / n > max_share:
            continue
        lift = c * n / (single[a] * single[b])
        if lift >= min_lift:
            out.append((a, b, c, round(lift, 1)))
    out.sort(key=lambda x: (-x[2] * min(x[3], 20)))
    return out, n


def wiki_quote(text, title, maxlen=420):
    """Kernaussage einer Mechanik-Seite: bevorzugt die Beschreibung aus dem Spiel, sonst der erste echte Absatz."""
    t = text or ''
    m = re.search(r'\u201c\s*(.+?)\s*\u2014 (?:in-game description|Tablet of Wisdom)', t, re.S)
    if m:
        q = re.sub(r'\s*\n\s*', ' ', m.group(1)).strip(' \u201c\u201d')
        return (q[:maxlen - 1].rsplit(' ', 1)[0] + '\u2026') if len(q) > maxlen else q, 'in-game'
    for para in re.split(r'\n\s*\n', t):
        p = re.sub(r'\s*\n\s*', ' ', para).strip()
        if p.startswith(('Condition. ', 'Condition.')) and len(p) > 20:
            return p.replace('Condition. ', '', 1), 'in-game'
        if len(p) < 60 or p.startswith(('\u2022', '|', '##', '\u201c', 'The visual effect', 'This article', 'Warning', 'For ', 'Main article',
                                        'See also', 'Not to be confused')) or 'Contents' in p or '(click to view)' in p:
            continue
        p = re.sub(r'^(Skill type|Skill Type)\. ', '', p)
        return (p[:maxlen - 1].rsplit(' ', 1)[0] + '\u2026') if len(p) > maxlen else p, 'wiki'
    return '', ''


def skill_facts(entry):
    """Kompakte Wiki-Fakten eines Skills (PvE-Seite, optional PvP-Seite)."""
    w = entry.get('wikitext') or ''
    ib = infobox(w)
    cats = entry.get('categories') or []
    f = {
        'title': entry.get('title'), 'rev': entry.get('revid'), 'ts': (entry.get('timestamp') or '')[:10],
        'causes': ib.get('causes', []), 'removes': ib.get('removes', []), 'requires': ib.get('requires', []) + ([ib['requires'].lower()] if isinstance(ib.get('requires'), str) else []),
        'target': (ib.get('target') or '').lower().strip('}'), 'aoe': (ib.get('aoe') or ib.get('pbaoe') or '').lower(),
        'range': (ib.get('range') or '').lower(), 'wtype': ib.get('type', ''),
        'desc': clean(ib.get('description', '')), 'concise': clean(ib.get('concise description', '')),
        'acq': bullets(section(w, 'Acquisition'), 14),
        'notes': bullets(section(w, 'Notes') or section(w, 'Note'), 12),
        'hero': bullets(section(w, 'Hero Usage'), 6),
        'related': [clean(x) for x in re.findall(r'\{\{skill icon\|([^}|]+)', section(w, 'Related skills'))][:24],
        'bug': 'Bugs' in cats, 'anomaly': 'Anomalies' in cats, 'hero_vetted': 'Hero-vetted skills' in cats,
        'cats': [c for c in cats if c.startswith(('Skills that', 'Skills with', 'Condition removing', 'Hex spell removing',
                                                  'Enchantment removing', 'Stance removing', 'Armor-ignoring', 'Sacrifice'))],
    }
    if isinstance(ib.get('requires'), list):
        pass
    if entry.get('pvp') and entry['pvp'].get('wikitext'):
        pw = entry['pvp']['wikitext']
        pib = infobox(pw)
        f['pvp'] = {'title': entry['pvp'].get('title'), 'rev': entry['pvp'].get('revid'),
                    'causes': pib.get('causes', []), 'removes': pib.get('removes', []),
                    'desc': clean(pib.get('description', '')), 'notes': bullets(section(pw, 'Notes'), 6)}
    return f


# ---------------------------------------------------------------- Orte (Roll your destiny)
CAMP_ID = {'Prophecies': 1, 'Factions': 2, 'Nightfall': 3, 'Eye of the North': 4}
# Rückfall je Region, wenn keine Außenposten-Seite mit Gruppengröße vorliegt (UNVERIFIZIERT, wird als geschätzt markiert)
REGION_SZ = {'Ascalon': 4, 'Northern Shiverpeaks': 6, 'Kryta': 6, 'Maguuma Jungle': 6, 'Crystal Desert': 6,
             'Southern Shiverpeaks': 8, 'Ring of Fire Islands': 8, 'Shing Jea Island': 4, 'Kaineng City': 6,
             'Echovald Forest': 8, 'The Jade Sea': 8, 'Istan': 4, 'Kourna': 6, 'Vabbi': 8, 'The Desolation': 8,
             'Realm of Torment': 8, 'Far Shiverpeaks': 8, 'Charr Homelands': 8, 'Tarnished Coast': 8}


def vq_areas(text):
    """Gerenderte Kill-Tabelle der Seite „Vanquisher“ → [(Kampagne, Region, Gebiet, Ø Gegner)]."""
    i = text.find('## Explorable area kill counts')
    j = text.find('## Larger party sizes', i + 1)
    if i < 0:
        return []
    camp, cells, out = None, [], []
    for line in text[i:j if j > 0 else None].splitlines():
        line = line.strip()
        if line.startswith('## '):
            h = line[3:].strip()
            if h in CAMP_ID:
                camp = h
            continue
        if line.startswith('|'):
            cells.append((camp, line[1:].strip()))
    k = 0
    while k + 4 < len(cells):
        c = [x for _, x in cells[k:k + 5]]
        if c[2].isdigit() and c[3].isdigit() and c[4].isdigit() and not c[0].isdigit() and cells[k][0]:
            out.append((cells[k][0], c[0], c[1], int(c[2])))
            k += 5
        else:
            k += 1
    return out


def mission_list(text):
    """Gerenderte Missionsliste → [(Region, Mission)] aus Zeilen „N. Name“ (auch 9a./10b.)."""
    region, out = None, []
    for line in text.splitlines():
        line = line.strip()
        if line.startswith('## '):
            region = line[3:].strip()
            continue
        m = re.match(r'^\d+[a-z]?\.\s+(.+)$', line)
        if m and region and region in REGION_SZ:
            name = re.sub(r'\s*\((Required|Kurzick|Luxon)[^)]*\)\s*$', '', m.group(1)).strip()
            if (region, name) not in out:
                out.append((region, name))
    return out


def _partysize(ib):
    m = re.search(r'\|\s*partysize\s*=\s*(\d+)', ib or '')
    return int(m.group(1)) if m else None


def _field(ib, name):
    m = re.search(r'\|\s*' + name + r'\s*=\s*([^\n|]+)', ib or '')
    return m.group(1).strip() if m else ''


def _outpost_size(ib):
    """Gruppengröße eines Außenpostens: Feld „partysize“; fehlt es, gilt die Vorlagen-Voreinstellung 8.
    (Gestützt auf die Wiki-Daten: in Istan haben nur Beknur Harbor und Blacktide Den kein Feld – genau die beiden 8er-Ausnahmen.)"""
    t = _field(ib, 'type').lower()
    if 'Location infobox' not in (ib or '')[:600] or not any(x in t for x in ('outpost', 'town', 'city')):
        return None
    return _partysize(ib) or 8


def orte_list(k):
    """Vanquish-Gebiete und Missionen mit Kampagne, Region und Gruppengröße.
    Missionen: Größe ihres Missions-Außenpostens. Gebiete: größter Außenposten unter den Ausgängen (sonst zwei Schritte weiter).
    Ohne Treffer: Regions-Rückfall (est=1, UNVERIFIZIERT)."""
    orte, seiten = k.get('orte') or {}, k.get('orte_seiten') or {}
    if not orte:
        return []
    by = {}
    for t, e in seiten.items():
        by[t] = e
        if e.get('angefragt'):
            by.setdefault(e['angefragt'], e)
    ib = lambda t: (by.get(t) or {}).get('infobox') or ''
    def exits(t):
        m = re.search(r'\|\s*exits\s*=([^\n]*)', ib(t))
        return [x.split('|')[0].strip() for x in re.findall(r'\[\[([^\]]+)\]\]', m.group(1) if m else '')]
    def area_size(t):
        seen, frontier = {t}, [t]
        for _ in range(2):
            nxt, sizes = [], []
            for x in frontier:
                for y in exits(x):
                    if y in seen:
                        continue
                    seen.add(y)
                    sz = _outpost_size(ib(y))
                    if sz:
                        sizes.append(sz)
                    else:
                        nxt.append(y)
            sizes = [z for z in sizes if 2 <= z <= 8]
            if sizes:
                return max(sizes)
            frontier = nxt
        return None
    out = []
    for camp, region, area, kills in vq_areas((orte.get('Vanquisher') or {}).get('text') or ''):
        sz = area_size(area)
        out.append({'n': area, 'k': 'a', 'vq': 1, 'c': CAMP_ID[camp], 'r': region, 'kills': kills,
                    'sz': sz or REGION_SZ.get(region, 8), **({} if sz else {'est': 1})})
    for t, e in orte.items():
        if not t.startswith('List of'):
            continue
        c = next((v for kname, v in CAMP_ID.items() if kname in t), None)
        for region, name in mission_list(e.get('text') or ''):
            if any(o['n'] == name and o['k'] == 'm' for o in out):
                continue
            sz = None
            for v in (name + ' (outpost)', name + ' (mission)', name):
                sz = _outpost_size(ib(v))
                if sz:
                    break
            sz = sz if sz and 2 <= sz <= 8 else None
            out.append({'n': name, 'k': 'm', 'c': c, 'r': region, 'sz': sz or REGION_SZ.get(region, 8), **({} if sz else {'est': 1})})
    return out

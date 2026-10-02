"""Baut die kompakte Skill-Datenbank (data.js) fuer den GW1-Randomizer.

Quelle: build-wars/gw-skilldata (MIT; Beschreibungen aus GWW/GuildWiki, GFDL / CC BY-NC-SA).
Tags werden regelbasiert aus den englischen Beschreibungen abgeleitet und durch
manuelle Korrekturen (OVERRIDES) ergaenzt.
"""
import json, re, sys, collections, pathlib

import wiki_knowledge as wk

HERE = pathlib.Path(__file__).parent
SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.')
OUT = HERE / 'data.js'
OUT_JSON = HERE / 'data.json'
# Wissenspaket (tools/fundorte_abrufen.py) – optional zweites Argument, sonst ../wissen/gw1-wissen
WISSEN = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else HERE.parent / 'wissen' / 'gw1-wissen'
K = wk.load(WISSEN)
WIKI_OUT = HERE / 'wiki.js'
REVIEW = HERE.parent / 'review'

sd = json.load(open(SRC / 'data/json-full/skilldata.json'))['skilldata']
EN = json.load(open(SRC / 'data/json-full/skilldesc-en.json'))['skilldesc']
DE = json.load(open(SRC / 'data/json-full/skilldesc-de.json'))['skilldesc']
NAMES = json.load(open(pathlib.Path(__file__).parent / 'names.json'))

# --- Waffenfamilien je Skill-Typ ------------------------------------------
WEAPON_BY_TYPE = {
    2: 'bow', 3: 'melee', 4: 'axe', 5: 'dagger', 6: 'dagger', 7: 'dagger', 35: 'dagger',
    8: 'hammer', 9: 'scythe', 10: 'sword', 11: 'pet', 12: 'spear', 31: 'ranged', 34: 'any',
}
ATTACK_TYPES = set(WEAPON_BY_TYPE)
HEX_TYPES = {24, 41}
ENCH_TYPES = {23, 33, 37, 40}
SPIRIT_TYPES = {18, 19}

CONDS = {  # v6: auch Verbformen (blinds, cripples, weakens …), Groß-/Kleinschreibung egal
    'bleeding': r'\bBleeding\b|\bbleeds?\b', 'burning': r'\bBurning\b|\bsets? (?:\w+ ){0,3}on fire|catch(?:es)? fire',
    'poison': r'\bPoison(?:ed|s)?\b', 'cripple': r'\bCrippl(?:ed|es|e|ing)\b', 'blind': r'\bBlind(?:ed|s|ness)?\b',
    'daze': r'\bDaze[ds]?\b', 'deepwound': r'\bDeep Wound\b', 'disease': r'\bDisease[ds]?\b',
    'weakness': r'\bWeakness\b|\bWeaken(?:ed|s)?\b', 'crackedarmor': r'\bCracked Armor\b',
}
HEAL_RE = r'\bheal(?:s|ed|ing)?\b|gains? \d+(\.\.\.\d+)? health|\+\d+(\.\.\.\d+)? health regeneration'
KD_NEED_RE = (r'knocked[- ]down (foe|target|creature|ally|enemy)|(who|that) (is|are|was|were) knocked[- ]down'
              r'|(foe|target|ally|foes) (is|are|was|were) knocked[- ]down\s*[,]|against (a |any )?knocked[- ]down'
              r'|if (target |that |the |a |any )?(foe|target|ally|adjacent foes?)? ?(is|was|are|were) knocked[- ]down'
              r'|for each knocked[- ]down|while .{0,20}knocked[- ]down')
KD_DO_RE = (r'(foe|target|foes|it|they|and|also|you) (is|are|will be|be) knocked down(?!\s*[,.]?\s*(you|this|that|deal|strike|take|it))'
            r'|knocks? (\w+ ){0,3}(down|foes? down)|knocking (\w+ ){0,3}down|knocked down for \d|cause[sd]? (a )?knock-?down'
            r'|is knocked down\.$|are knocked down\.$')


def cond_role(sen, m):
    """Rolle eines Zustandswortes im Satz: 'apply' (Wirkung auf Gegner), 'self' (auf dich), 'need' (Bedingung) oder None.
    Reihenfolge: Adjektiv ("Burning foes") → Dauer direkt dahinter → Bedingungs-Marker → Verb + Dauer → Selbst."""
    before, after = sen[:m.start()].lower(), sen[m.end():].lower()
    if re.search(r'(immune to|relieved of|cured of|\blose|\bloses|removes?|transfer)\s+(\w+ ){0,2}$', before):
        return None
    if re.fullmatch(r'(poisons|cripples|blinds|weakens|bleeds|dazes|diseases)', m.group(0).lower()):   # Verb: "Poisons target foe"
        return 'self' if re.search(r'\byou\s*$', before) else 'apply'
    selfish = re.search(r'\byou (are|become|begin|suffer|also)( also)?( from)?( suffer)?( from)?( a| an)?\s*$', before) \
        or (re.search(r'\byou (are|become|begin|suffer)[^.,]{0,25}$', before) and not re.search(r'foe|target|ally', before[-30:]))
    if re.match(r'^\s+(foes?|targets?|creatures?|enemy|enemies)\b', after):
        return 'need'
    if re.match(r'^[^.;,]{0,40}?\b(for )?(\d+(\.\.\.\d+)?|an additional \d+(\.\.\.\d+)?) seconds?', after):
        return 'self' if selfish else 'apply'
    if re.search(r'(suffering from|affected by|is|are|was|were|has|have|had|with|if|while|for each|against|already)\s+(a |an )?$', before):
        return 'need'
    if re.search(r'(inflicts?|causes?|applies|apply|suffers? from|also suffers? from|becomes?|begins?|sets?)\s+(\w+ ){0,2}(a |an )?$', before) \
            and re.match(r'^[^.;]{0,70}?\bfor \d', after):
        return 'self' if selfish else 'apply'
    if selfish:
        return 'self'
    return 'need' if is_conditional(sen, m.start()) else None


def sentences(txt):
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', txt) if s.strip()]

COND_CLAUSE = re.compile(r'^(If|While|Whenever|When|For each|Each|Unless)\b|\b(if|while|unless|for each|whenever)\b[^,]*$', re.I)

def is_conditional(sentence, idx):
    """Liegt die Fundstelle idx in einem Bedingungsnebensatz (If ... ,)?"""
    head = sentence[:idx]
    m = list(re.finditer(r'\b(If|if|While|while|for each|For each|unless|Unless|is not)\b', head))
    if not m:
        return False
    last = m[-1].end()
    return ',' not in head[last:]  # noch im selben Nebensatz

def tag_skill(desc, s):
    t = set()
    typ = s['type']
    body = re.sub(r'^(Elite )?[A-Z][\w\- ]*?\.\s', '', desc, count=1)  # Typ-Praefix entfernen
    sents = sentences(body)
    low = body.lower()

    if typ in ATTACK_TYPES:
        t.add('attack'); t.add('dmg')
    if typ in HEX_TYPES:
        t.add('hex')
    if typ in ENCH_TYPES:
        t.add('ench')
    if typ in SPIRIT_TYPES or re.search(r'[Cc]reate a level \d+(\.\.\.\d+)? [Ss]pirit', body):
        t.add('spirit')
    if typ in (20,):
        t.add('shout')
    if typ in (13, 14):
        t.add('chant')
    if typ == 29:
        t.add('stance')
    if typ in (21, 42):
        t.add('signet')
    if typ == 17:
        t.add('prep')
    if typ == 27:
        t.add('weaponspell')
    if typ == 28:
        t.add('well')
    if typ == 30:
        t.add('trap')
    if typ == 15:
        t.add('form')

    for sen in sents:
        sl = sen.lower()
        allyish = bool(re.search(r'\ball(y|ies)\b|party|members|other ally', sl))
        if re.search(r'minions?', sl) and re.search(r'heal|health', sl):
            t.add('needs_minion'); continue
        selfish = bool(re.search(r'\byou(rself)?\b', sl))
        foeish = 'foe' in sl

        # Heilung (v6: "\bheal" traf auch "Health" – jetzt nur echte Heil-Wörter)
        if re.search(HEAL_RE, sl) and 'degeneration' not in sl.replace('regeneration', ''):
            hm = re.search(HEAL_RE, sl)
            if not is_conditional(sen, hm.start()):
                if allyish and re.search(r'party|all allies|allies in|members|each ally|nearby allies|adjacent allies', sl):
                    t.add('heal_party'); t.add('heal')
                elif allyish:
                    t.add('heal_other'); t.add('heal')
                elif selfish and not foeish:
                    t.add('heal_self')
                elif selfish:
                    t.add('heal_self')
        if re.search(r'\bsteal', sl) and 'health' in sl:
            t.add('heal_self'); t.add('dmg')

        # Schutz / Verteidigung
        if re.search(r'block|\+\d+(\.\.\.\d+)? armor|less damage|damage reduction|reduced by|cannot lose more than|no more than \d|takes? \d+(\.\.\.\d+)?% less|reduce[sd]? .{0,30}damage|cannot be (hit|killed|damaged)|immune', sl) \
                and not re.search(r'-\d+ armor|foe.{0,40}(\+\d+ armor)', sl):
            if allyish:
                t.add('prot')
            elif selfish:
                t.add('defense')
        if re.search(r'damage you (take|receive)|you take .{0,20}less|you cannot|you have \d+(\.\.\.\d+)?% chance to block|you block', sl):
            t.add('defense')
        if re.search(r'knocked down', sl) and re.search(r'cannot be knocked down', sl):
            t.add('stability')

        # Schaden
        dm = re.search(r'\d+(\.\.\.\d+)?%? (\w+ )?damage', sl)
        if dm and (foeish or re.search(r'strike|struck|deal|inflict|explod|hit|lightning|fire|cold|earth|holy|shadow|chaos', sl)) \
                and not re.search(r'you take|less damage|damage reduction|reduce|reduced|you would take|you receive|ally takes|allies take|sacrific', sl):
            t.add('dmg')
            if re.search(r'adjacent|nearby foes|in the area|all foes|in earshot|surrounding|foes near|area|foes in', sl):
                t.add('aoe')
        if 'health degeneration' in sl and foeish:
            t.add('dmg'); t.add('degen')
        if re.search(r'armor penetration|ignores armor', sl):
            t.add('armorpen')

        # Zustaende (v6: Wirkung vs. Bedingung sauber getrennt; "your target is Crippled for 3 seconds" ist Wirkung)
        if not re.search(r'(remov\w*|cure[sd]?|\blose)[^.]{0,30}(conditions?|bleeding|burning|poison|crippl|blind|daze|deep wound|disease|weakness|cracked armor)', sl):
            for c, pat in CONDS.items():
                for m in re.finditer(pat, sen, re.I):
                    kind = cond_role(sen, m)
                    if kind == 'need':
                        t.add('needs_' + c)
                    elif kind == 'self':
                        t.add('selfcond')
                    elif kind == 'apply' or foeish or 'target' in sl or 'struck' in sl or typ in ATTACK_TYPES or 'foes' in sl:
                        t.add('c_' + c); t.add('cond')
                        if c == 'cripple':
                            t.add('snare')
        if re.search(r'suffering from a condition|for each condition|conditioned|has a condition|is suffering from', sl) and not re.search(r'remov|\byou (are|have)|while conditioned|on you', sl):
            t.add('needs_cond')

        # Entfernen
        if re.search(r'\bfoes?(?: you hit| struck| hit)? loses? (all|\d+|one|a) conditions?', sl):
            t.add('rm_foe_cond')   # nimmt Gegnern Zustände – beißt sich mit eigenen Zustands-Builds
        elif re.search(r'remov\w* .{0,25}condition|conditions? (is|are) removed|cure|loses? (all|\d+|one|a) conditions?|condition.{0,20}(end|removed)', sl):
            t.add('rm_cond')
        if re.search(r'remov\w* .{0,25}hex|hex(es)? (is|are) removed|lose (all|\d+|one|a) hex', sl) and not re.search(r'you lose', sl):
            t.add('rm_hex')
        if (re.search(r'remov\w* .{0,25}enchantment|enchantment.{0,20}(is|are) removed|strip', sl) and foeish) \
                or re.search(r'(foe|foes|target)[^.]{0,40}\blos(e|es) (\d+(\.\.\.\d+)?|one|an|all|1|2) (of (its|their) )?enchantments?|takes? (\d+|one|an) enchantments? from (target|that|a) foe', sl):
            t.add('rm_ench')

        # Kontrolle
        if re.search(r'interrupt', sl) and not re.search(r'cannot be interrupted|not interrupted|if .{0,30}interrupted', sl):
            t.add('interrupt')
        # Knockdown (v6: "if that foe is hexed, that foe is knocked down" ist Wirkung, "a knocked-down foe" Bedingung)
        if re.search(r'knock', sl) and 'cannot be knocked down' not in sl:
            if re.search(KD_NEED_RE, sl):
                t.add('needs_kd')
            if re.search(KD_DO_RE, sl) and not re.search(r'knocks? you down|you are (also )?knocked', sl):
                t.add('kd')
        if re.search(r'moves? \d+(\.\.\.\d+)?% slower|movement .{0,20}slower', sl) and (foeish or 'target' in sl):
            t.add('snare')
        if re.search(r'\b(move|moves|run|runs) \d+(\.\.\.\d+)?% faster', sl) and not re.search(r'foes? (move|moves)', sl):
            t.add('speed')

        # Energie
        if re.search(r'(you|your) .{0,30}gain \d+(\.\.\.\d+)? energy|you gain .{0,20}energy|steal \d+(\.\.\.\d+)? energy|energy (is )?(returned|refunded)|\+\d+ energy regeneration|gain energy|gain \d+(\.\.\.\d+)? energy', sl) \
                and not re.search(r'foe gains|foes gain', sl):
            if allyish and not selfish:
                t.add('energy_ally')
            else:
                t.add('energy')
        if re.search(r'loses? \d+(\.\.\.\d+)? energy|lose all energy|energy degeneration', sl) and foeish:
            t.add('edenial')

        # Sonstiges
        if re.search(r'resurrect', sl):
            t.add('rez')
        if re.search(r'animate|minion', sl) and not re.search(r'your minions', sl) or re.search(r'^exploit .{0,20}corpse.{0,40}animate', sl):
            if re.search(r'animate', sl):
                t.add('minion')
        if re.search(r'your minions|minions? (gain|have|attack)', sl):
            t.add('needs_minion')
        if re.search(r'corpse', sl):
            t.add('corpse')
        if re.search(r'(target|that|struck) foe is hexed|hexed (foe|target)|for each hex|if .{0,30}hexed|while .{0,20}hexed|foes? (who|that) (is|are) hexed', sl) and not re.search(r'remov', sl):
            t.add('needs_hex')
        if re.search(r'(while|if) you are enchanted|for each enchantment on you|you have an enchantment|if you are not enchanted|enchantment on you', sl):
            t.add('needs_ench')
        if re.search(r'your (next|\d+ next) attack|your attacks|while attacking|whenever you attack|you attack|your arrows|your spear|your scythe|you hit|you strike|attack skills?', sl) and typ not in ATTACK_TYPES:
            t.add('needs_attack')
        if re.search(r'(near|within .{0,15}of|for each) (a |an |your )?spirit|spirits? (within|near)|your spirits', sl) and typ not in SPIRIT_TYPES:
            t.add('needs_spirit')
        if re.search(r'strikes? of adrenaline|gain \d+(\.\.\.\d+)? adrenaline|adrenaline', sl) and re.search(r'gain|gains', sl) and not s['adrenaline']:
            t.add('adr_gain')
        if re.search(r'party|all allies|allies in earshot|nearby allies|each ally|members', sl) and not re.search(r'heal', sl) and typ in (13, 14, 20, 21, 36, 18, 19):
            t.add('partybuff')
        if re.search(r'(you|target ally).{0,40}(attack|attacks) .{0,20}(faster|\d+% faster)|\+\d+(\.\.\.\d+)? (damage|fire damage|cold damage|lightning damage)|deal[s]? \+\d|attack speed', sl) and typ not in ATTACK_TYPES:
            t.add('attackbuff')
        if re.search(r'this skill has half the normal recharge|skills recharge|recharges? \d+% faster|recharge instantly', sl):
            t.add('recharge')

    if s['adrenaline']:
        t.add('adrenal')
    if s['sacrifice']:
        t.add('sacrifice')
    if s['upkeep']:
        t.add('maintained')
    # Waffenbindung
    w = WEAPON_BY_TYPE.get(typ)
    wreq = None
    m = re.search(r"(?:while|if|unless)[^.]{0,30}?(?:wielding|holding|have|using)[^.]{0,6}?(?:an? |your )?(axe|sword|hammer|scythe|spear|bow|daggers?)|with (?:your|a) (axe|sword|hammer|scythe|spear|bow|daggers?)|(arrows)", low)
    if m and typ not in ATTACK_TYPES and not re.search(r'non-dagger', low):
        word = next(g for g in m.groups() if g)
        wreq = {'daggers': 'dagger', 'arrows': 'bow'}.get(word, word)
    return t, w, wreq



SPELL_TYPES = {22, 23, 24, 25, 26, 27, 28, 33, 37, 39, 40, 41}
ATTR_BY_NAME = {'Air Magic': 8, 'Earth Magic': 9, 'Fire Magic': 10, 'Water Magic': 11}


def state_tags(low):
    """Zustandsmodell (v6): was ein Skill über den eigenen Zustand braucht, erzeugt oder zerstört.
    Grundlage für Anti-Synergien im Generator (conflictsOf)."""
    m = set()
    # Lebenspunkte: Richtung des Vergleichs (du vs. Ziel)
    want = set()
    for mm in re.finditer(r"([\w' ]{0,30}?)\b(has|have|had|with) (more|less) health than (you|target foe|that foe|your target|the target|target|your pet|that ally|target ally)\b", low):
        subj, cmp_, obj = mm.group(1), mm.group(3), mm.group(4)
        rest = low[mm.end():].split('.')[0]
        if re.search(r'\byou (lose|suffer|take)|(foe|that foe|target) gains', rest):   # Strafklausel, kein Wunsch
            continue
        if re.search(r'\byou\s*$', subj):
            want.add('high' if cmp_ == 'more' else 'low')
        elif obj == 'you':
            want.add('low' if cmp_ == 'more' else 'high')
    if re.search(r'(if|while) (you are|your health is) below \d+%(?![^.]*\bends\b)', low):
        want.add('low')
    if re.search(r'(if|while) (you are|your health is) above \d+%(?![^.]*\byou (begin|suffer|lose))', low):
        want.add('high')
    if len(want) == 1:
        m.add('needs_morehp' if 'high' in want else 'needs_lowhp')
    if re.search(r'ends if your health (drops|falls|is) below|if your health is below \d+%[^.]*\bends\b', low):
        m.add('hp_keep_high')
    # eigene Lebenspunkte senken (Opfern, Selbstschaden)
    if re.search(r'you (lose|take|suffer) \d+(\.\.\.\d+)? (health|damage)|sacrifices? \d+(\.\.\.\d+)?% (of your )?(maximum )?health'
                 r'|you sacrifice|attacks sacrifice|lose \d+ health for each|you lose \d+(\.\.\.\d+)? health', low):
        m.add('lowhp_src')
    # Effekte, die unter bestimmten Umständen enden
    if re.search(r'ends if you (become (hexed or )?enchanted|are enchanted)', low): m.add('ends_on_ench')
    if re.search(r'ends if you cast another enchantment', low): m.add('ends_on_otherench')
    if re.search(r'ends (if|when) you (successfully )?(hit with an attack|attack|hit)\b', low): m.add('ends_on_attack')
    if re.search(r'ends if you use any non-adrenal skills?', low): m.add('ends_on_nonadrenal')
    if re.search(r'ends if you use an adrenal skill', low): m.add('ends_on_adrenal')
    if re.search(r'ends if you use an attack skill', low): m.add('ends_on_attackskill')
    if re.search(r'ends if you cast a non-hex', low): m.add('ends_on_nonhex')
    if re.search(r'ends if you move\b', low): m.add('ends_on_move')
    # eigene Ressourcen wegwerfen / sich selbst beschneiden
    if re.search(r'(^|\. )(you )?lose all (your )?adrenaline|\byou lose all adrenaline|ends, you lose all adrenaline', low): m.add('adr_dump')
    if re.search(r'(^|\. )(you )?lose all (your )?energy|\byou lose all (adrenaline and all )?energy|causes you to lose all energy', low): m.add('e_dump')
    if re.search(r'you cannot cast spells', low): m.add('no_spells')
    # eigene Skill-Gruppen sperren (mit Dauer)
    for mm in re.finditer(r'(?:all (?:of )?)?your ([\w\- ,]{0,40}?) (?:is|are) disabled for (\d+)(?:\.\.\.(\d+))? seconds?', low):
        if re.search(r'if (it|this attack|\w+ shot) misses[^.]*$', low[:mm.start()]):
            continue   # nur bei Fehlschuss (Oath Shot)
        grp, a = mm.group(1), int(mm.group(2))
        sec = round((a + int(mm.group(3) or a)) / 2)
        groups = []
        if 'non-attack' in grp: groups = ['nonattack']
        elif 'non-assassin' in grp: groups = ['nonA']
        elif 'non-mesmer' in grp: groups = ['nonMe']
        elif 'non-spear' in grp or 'non-dagger' in grp: groups = []      # nur fremde Waffen-Angriffe
        elif 'attack' in grp: groups = ['attack']
        elif 'healing prayers' in grp: groups = ['attr13']
        elif 'spell' in grp: groups = ['spell']
        elif 'signet' in grp: groups = ['signet']
        elif 'stance' in grp or 'enchantment' in grp:
            groups = [g for g, w in (('stance', 'stance'), ('ench', 'enchantment')) if w in grp]
        elif re.search(r'\bskills\b', grp): groups = ['all']
        for g in groups:
            m.add('dis:%s:%d' % (g, sec))
    # Zustände von sich selbst entfernen (beißt sich mit Selbstquälerei)
    if re.search(r'remove (a |one |all |\d+ )?(\w+ )?conditions? from (yourself|you)\b|\byou lose (all|\d+|one|a) conditions?'
                 r'|conditions? (on you|you are suffering from) (is|are) removed|you are cured|you are relieved of'
                 r'|whenever you receive a condition, that condition is transferred|you transfer [^.]{0,20}conditions? to', low):
        m.add('rm_cond_self')
    return m


def mech_tags(desc, s, t):
    """Zweite Analyse-Ebene: Mechanik-Familien und harte Abhängigkeiten (aus der Durchsicht aller Skills)."""
    m = set()
    typ, low = s['type'], desc.lower()
    first = re.split(r'(?<=\.)\s', re.sub(r'^(Elite )?[A-Z][\w\- ]*?\.\s', '', desc, count=1))[0].lower()
    # Assassinen-Kombokette
    if typ == 5 or re.search(r'counts as a lead attack', low): m.add('lead')
    if typ == 6 or re.search(r'counts as an off-hand attack', low): m.add('offhand')
    if typ == 7: m.add('dual')
    mm = re.search(r'must follow an? (lead|off-hand|dual) attack', low)
    if mm: m.add('req_' + {'lead': 'lead', 'off-hand': 'offhand', 'dual': 'dual'}[mm.group(1)])
    if re.search(r'must strike a hexed foe', low): m.add('needs_hex')
    # Skill-Klassen, die Primärattribute betreffen
    if typ in (38, 39, 40, 41, 42): m.add('touch')
    if typ in (18, 19, 32, 36): m.add('ritual')
    if typ in (13, 20): m.add('shoutchant')
    if typ in SPELL_TYPES: m.add('spell')
    if typ == 25: m.add('item')
    if typ == 27: m.add('weaponspell')
    # Selbst-Verzauberungen vs. Verbündete
    if typ in (23, 33, 37) and not re.search(r'target (other )?ally|party members|enchants all|allies|cannot self-target|target touched|target and adjacent allies', first):
        m.add('self_ench')
        if s['profession'] == 10: m.add('dench')
    # Derwisch-Verzauberungen entfernen / Verlust auslösen
    if re.search(r'(remove|lose)s? (1|one) (of your )?dervish enchantment|removes a dervish enchantment', low): m.add('rm_dench')
    if re.search(r'whenever you lose a dervish enchantment|when you lose a dervish enchantment|whenever an enchantment on you ends|when this enchantment ends prematurely|renewal: whenever an enchantment on you ends', low): m.add('on_dench_loss')
    # Zählt eigene Verzauberungen / braucht Verzauberung
    if re.search(r'for each enchantment on you|if you are enchanted|while (you are )?enchanted|unless you are enchanted|fails if you are not enchanted|each additional enchantment', low): m.add('needs_selfench')
    # Waffenzauber / Gegenstände / Geister / Kreaturen
    if re.search(r'under (the effects of )?a weapon spell|under a weapon spell', low): m.add('needs_wpnspell')
    if re.search(r'holding an item|holding a bundle', low): m.add('needs_item')
    if re.search(r'earshot of (a|any) spirit|within earshot of any spirits|near a spirit|spirits? (you control|within earshot)|each nearby allied spirit|the spirit (nearest|closest) you|recharging binding rituals|target (touched )?allied spirit', low): m.add('needs_spirit')
    if re.search(r'creates? (a|two|3) level|animates? a level|summons? a level', low): m.add('creature')
    if re.search(r'whenever you create a creature|summoned creature you control', low): m.add('needs_creature')
    if re.search(r'undead servant|your minions|servants', low) and not re.search(r'hostile undead', low): m.add('needs_minion')
    # Signets / Schreie & Anfeuerungen / Haltungen zählen
    if re.search(r'for each signet|signets? you have equipped|each signet|your signets|you use a signet|next signet|signets you', low): m.add('needs_signets')
    if re.search(r'(shout|chant) (or|and) (shout|chant)', low) and re.search(r'under the effects|ends on|next shout|you use|last .{0,10}longer', low): m.add('needs_shoutchant')
    if re.search(r'if you are in a stance|your stances', low): m.add('needs_stance')
    # Eigene Zustände, eigenes Niederwerfen
    if re.search(r'you (begin|are also|are|suffer from|become) (bleeding|burning|poisoned|diseased|weakened|dazed|blind|crippled)|you bleed|you suffer from burning|you and all adjacent foes are afflicted|you begin burning|you are also poisoned', low): m.add('selfcond')
    if re.search(r'you are (also )?knocked[- ]down', low) and not re.search(r'if you are knocked', low): m.add('selfkd'); m.add('selfcond')
    if re.search(r'whenever you suffer from a new condition|whenever you gain a condition|from yourself to|for each condition on you|if you have a condition|while conditioned|each hex or condition on you|each condition and hex on you', low): m.add('needs_selfcond')
    if re.search(r'if you are knocked[- ]down', low): m.add('needs_selfkd')
    # Verhexungs-Stapel, Wasser-Verhexungen
    if s['attribute'] == 11 and typ in (24, 41): m.add('waterhex')
    if re.search(r'hexed with water magic|water magic hex', low): m.add('needs_waterhex')
    if s['profession'] == 5 and typ in (24, 41): m.add('mesmerhex')
    if re.search(r'mesmer hex|2 or more hexes|another hex|another mesmer hex', low): m.add('needs_hexes')
    # Einstimmungen und Glyphen
    am = re.search(r'each time you use (air|earth|fire|water) magic', low)
    if am: m.add('attune:' + str(ATTR_BY_NAME[am.group(1).title() + ' Magic']))
    if re.search(r'elemental spells|air, fire, water, and earth magic', low) and typ in (23,): m.add('needs_elespells')
    if typ == 16 or re.search(r'your next (\d+(\.\.\.\d+)? )?(non-illusion )?spells?\b|each time you cast a spell|whenever you cast a spell|spells you cast|your spells', low): m.add('needs_spells')
    # Überanstrengung (Overcast, Reforged)
    # Produzent = Skill verursacht selbst Überanstrengung; Nutznießer wie "Zweite Chance" (zahlt pro Punkt aus) sind keine Quelle
    if (s['overcast'] and not re.search(r'restricted by overcast', low)) or re.search(r'you are overcast by|continuously gain overcast', low): m.add('overcast')
    if re.search(r'if (you are )?overcast|strikes nearby instead of adjacent if overcast|if overcast|restricted by overcast', low): m.add('needs_overcast')
    if re.search(r'restricted by overcast', low): m.add('strict')  # wirkungslos ohne Quelle
    # Energie-/Lebensvorrat als Waffe
    if re.search(r'more energy than target foe|for each point of energy you have|ranks of energy storage|energy storage', low): m.add('needs_bigenergy')
    m |= state_tags(low)
    if re.search(r'\+\d+(\.\.\.\d+)? maximum health|maximum health (for you|is increased)|max health|you have \+\d+(\.\.\.\d+)? (maximum )?health', low) and not re.search(r'target (other )?ally|allies', first): m.add('maxhp')
    # Kritische Treffer
    if re.search(r'chance (of|to land|of landing) a critical hit|always a critical hit|automatic critical hit|critical hit rate|chance to critical', low): m.add('crit')
    if re.search(r'(if|when|whenever) you (land|score) a critical hit|critical hits? (heal|remove)|every time you land a critical hit|whenever your arrows critical|with a critical hit', low): m.add('needs_crit')
    # Waffen- und Schildbedingungen
    if re.search(r'(wielding|using|have) a shield', low): m.add('needs_shield')
    if re.search(r'your melee attacks|in melee|melee attacks (neither|are)|with melee', low) and not re.search(r'target ally|allies|foes who hit', first): m.add('melee_only')
    if re.search(r'non-dagger weapon', low): m.add('nondagger')
    em = re.search(r"wielding an? (fire|cold|lightning|earth) weapon|unless your weapon deals (lightning|fire|cold|earth) damage", low)
    if em: m.add('elem_weapon'); m.add('elem:' + (em.group(1) or em.group(2)))
    if re.search(r'shadow step|teleport|instantly move to your target', low): m.add('gapclose')
    if re.search(r'exploits? (a fresh|all) corpses?|exploit a random corpse', low): m.add('corpse')
    # Reichweite: Wirkung um dich selbst (Punkt-Flächenschaden) bzw. Berührung
    if typ in (38, 39, 40, 41, 42): m.add('closerange')
    for sen in re.split(r'(?<=\.)\s', low):
        if typ in ATTACK_TYPES or typ == 30:
            break
        if re.search(r"adjacent to you|foes near you\b|around you|all nearby foes|all adjacent foes|foes adjacent|nearby foes (are struck|take)|to all foes adjacent", sen) and not re.search(r"target|that foe|this foe|these foes|hexed foe|ally", sen):
            m.add('closerange'); break
    # Anti-Synergien v6: eigene Skill-Gruppen sperren -> dis:<gruppe>:<sekunden> (siehe state_tags)
    if re.search(r'lose all enchantments|you lose all (of your )?enchantments', low):
        m.add('needs_selfench' if re.search(r'for each (\w+ )?(enchantment|one) (lost|removed)|for each enchantment', low) else 'anti:selfench')
    return m

# --- Wiki-Abgleich (v6): strukturierte Infobox-Felder ergänzen unsere Regex-Tags --------------
WIKI_COND = {'burning': 'burning', 'bleeding': 'bleeding', 'poison': 'poison', 'crippled': 'cripple', 'blind': 'blind',
             'dazed': 'daze', 'deep wound': 'deepwound', 'disease': 'disease', 'weakness': 'weakness',
             'cracked armor': 'crackedarmor'}
HEAL_CAUSES = {'healing', 'health gain', 'life stealing', 'health regeneration'}
ALLY_TARGETS = ('allies', 'other allies', 'allies or foes', 'party')


def wiki_fix(t, desc, f, name, log, s):
    """Wiki-Fakten → sichere Ergänzungen/Korrekturen; jede Änderung landet im Review-Protokoll."""
    low = desc.lower()
    causes, removes, target = set(f.get('causes', [])), set(f.get('removes', [])), f.get('target', '')

    def add(tag, why):
        if tag not in t:
            t.add(tag); log.append((name, '+' + tag, why))

    def drop(tag, why):
        if tag in t:
            t.discard(tag); log.append((name, '−' + tag, why))

    for wc, c in WIKI_COND.items():
        if wc not in causes or 'c_' + c in t:
            continue
        for sen in sentences(desc):
            mm = re.search(CONDS[c], sen, re.I)
            if not mm:
                continue
            role, sl = cond_role(sen, mm), sen.lower()
            if role in ('self', 'need'):
                continue
            if re.search(r'foe|target|struck|hit|attack|arrows|adjacent|nearby|in the area|creatures|enemies|party member', sl):
                add('c_' + c, 'Wiki: causes ' + wc); add('cond', 'Wiki: causes ' + wc)
                if c == 'cripple':
                    add('snare', 'Crippled = langsamer')
                break
    if 'knockdown' in causes and 'kd' not in t and 'needs_kd' not in t and re.search(r'knock', low) \
            and not re.search(r'you are (also )?knocked|knocks you', low):
        add('kd', 'Wiki: causes Knockdown')
    if 'interrupt' in causes and 'interrupt' not in t and 'interrupt' in low:
        add('interrupt', 'Wiki: causes Interrupt')
    if 'shadow step' in causes and 'gapclose' not in t:
        add('gapclose', 'Wiki: causes Shadow Step')
    if 'increased movement speed' in causes and 'speed' not in t and re.search(r'\byou (move|run)|party|allies', low):
        add('speed', 'Wiki: causes Increased Movement Speed')
    if 'decreased movement speed' in causes and 'snare' not in t and re.search(r'foe|target', low):
        add('snare', 'Wiki: causes Decreased Movement Speed')
    if 'increased maximum health' in causes and 'maxhp' not in t and re.search(r'\byou have \+|\byou gain \+|your maximum health', low):
        add('maxhp', 'Wiki: causes Increased Maximum Health')
    if 'adrenaline gain' in causes and 'adr_gain' not in t and not s['adrenaline'] and re.search(r'\byou gain', low):
        add('adr_gain', 'Wiki: causes Adrenaline Gain')
    if 'minion' in causes and 'minion' not in t and re.search(r'animate|create|summon', low):
        add('minion', 'Wiki: causes Minion')
    if 'exploits corpse' in causes and 'corpse' not in t:
        add('corpse', 'Wiki: exploits corpse')
    if 'energy gain' in causes and 'energy' not in t and 'energy_ally' not in t:
        if re.search(r'\byou (gain|steal)[^.]{0,50}energy|energy is (returned|refunded)', low):
            add('energy', 'Wiki: causes Energy Gain')
        elif re.search(r'(allies|party members|ally)[^.]{0,40}gains? \d', low):
            add('energy_ally', 'Wiki: causes Energy Gain (Verbündete)')
    if 'energy loss' in causes and 'edenial' not in t and re.search(r'(foe|foes|target)[^.]{0,40}los(e|es) (all|\d+(\.\.\.\d+)?) energy', low):
        add('edenial', 'Wiki: causes Energy Loss (Gegner)')
    # Heilung: fehlende Heil-Tags ergänzen, falsche Selbstheilung entfernen
    if causes & HEAL_CAUSES and not (t & {'heal_self', 'heal_other', 'heal_party'}):
        if target in ALLY_TARGETS or re.search(r'target (other )?ally|party members|allies', low):
            add('heal_other', 'Wiki: Healing für Verbündete'); add('heal', 'Wiki: Healing')
        elif re.search(r'\byou (are healed|gain [^.]{0,30}health)|\bsteal', low):
            add('heal_self', 'Wiki: Healing/Health Gain für dich')
    if 'heal_self' in t and not (causes & HEAL_CAUSES) and not re.search(
            r'\byou (are|will be) healed|you gain \d+(\.\.\.\d+)? health|\bsteal|health regeneration|you gain [^.]{0,20}health', low):
        drop('heal_self', 'Wiki kennt keine Heilung, Beschreibung auch nicht')
    # Entfernen
    if 'condition' in removes:
        if target in ALLY_TARGETS or re.search(r'(target|other) (other )?ally|party|allies', low):
            add('rm_cond', 'Wiki: removes Condition (Verbündete)')
        elif target == 'self' or re.search(r'yourself|from you\b|\byou lose', low):
            add('rm_cond_self', 'Wiki: removes Condition (du)')
    if 'hex spell' in removes and 'rm_hex' not in t and (target in ALLY_TARGETS or re.search(r'(target|other) (other )?ally|party|allies', low)):
        add('rm_hex', 'Wiki: removes Hex (Verbündete)')
    if 'enchantment' in removes and 'rm_ench' not in t and (target in ('foes', 'foe') or re.search(r'(foe|foes|target foe)[^.]{0,40}(lose|loses|remove)', low)) \
            and not re.search(r'dervish enchantment', low):
        add('rm_ench', 'Wiki: removes Enchantment (Gegner)')


def wiki_residuals(skills_by_id, facts):
    """Nach allen Korrekturen verbleibende Abweichungen Wiki ↔ Tags (für die Review-Liste)."""
    res = []
    for sid, f in facts.items():
        s = skills_by_id.get(sid)
        if not s:
            continue
        g, causes = set(s['g']), set(f['causes'])
        for wc, c in WIKI_COND.items():
            if wc in causes and 'c_' + c not in g and 'selfcond' not in g:
                res.append((s['n']['en'], 'Wiki: causes %s – bei uns weder Wirkung noch Selbst-Zustand' % wc))
            if 'c_' + c in g and wc not in causes:
                res.append((s['n']['en'], 'Wir: verursacht %s – Wiki listet es nicht' % wc))
        if 'knockdown' in causes and 'kd' not in g and 'needs_kd' not in g and 'selfkd' not in g:
            res.append((s['n']['en'], 'Wiki: causes Knockdown – bei uns nicht erkannt'))
        if 'condition' in f['removes'] and not (g & {'rm_cond', 'rm_cond_self'}):
            res.append((s['n']['en'], 'Wiki: removes Condition (%s) – bei uns nicht erkannt' % (f['target'] or '–')))
    return sorted(res)


# --- manuelle Korrekturen (Name -> +tags / -tags) --------------------------
OVERRIDES = {
    'Healing Breeze': '+heal_other', 'Mending': '+heal_other', 'Healing Seed': '+heal_party',
    'Protective Spirit': '+prot', 'Spirit Bond': '+prot +heal_other', 'Guardian': '+prot', 'Aegis': '+prot',
    'Shield of Absorption': '+prot', 'Protective Bond': '+prot', 'Life Barrier': '+prot', 'Reversal of Fortune': '+prot',
    'Shielding Hands': '+prot', 'Shield of Deflection': '+prot', 'Shelter': '+prot', 'Union': '+prot', 'Displacement': '+prot',
    'Soothing Memories': '+heal_other', 'Spirit Light': '+heal_other', 'Mend Body and Soul': '+heal_other +rm_cond',
    'Signet of Spirits': '+spirit +dmg', 'Bloodsong': '+spirit +dmg +heal_self', 'Pain': '+spirit +dmg', 'Anguish': '+spirit +dmg',
    'Charm Animal': '+pet -defense', 'Protective Spirit': '+prot -heal -heal_other', 'Comfort Animal': '+pet', 'Heal as One': '+pet', 'Air Attunement': '+attune:8', 'Elemental Attunement': '+needs_elespells', 'Master of Magic': '+needs_elespells', 'Glyph of Elemental Power': '+needs_elespells', 'Glyph of Lesser Energy': '+energy', 'Ether Renewal': '+energy +heal_self',
    'Aura of Restoration': '+heal_self', 'Obsidian Flesh': '+defense', 'Shadow Form': '+defense', 'Mist Form': '+defense',
    'Shroud of Distress': '+defense', 'Critical Defenses': '+defense', 'Dark Escape': '+defense',
    '"I Am Unstoppable!"': '+stability +defense', 'Dolyak Signet': '+stability +defense', 'Balanced Stance': '+stability',
    'Troll Unguent': '+heal_self', 'Healing Signet': '+heal_self', 'Mystic Regeneration': '+heal_self', 'Signet of Devotion': '+heal_other',
    'Resurrection Signet': '+rez', 'Sunspear Rebirth Signet': '+rez', 'Glimmer of Light': '+heal_other',
    'Zealous Renewal': '+energy', 'Mystic Sweep': '+dmg +aoe', 'Eremite\'s Attack': '+aoe', 'Death Blossom': '+aoe',
    'Energy Surge': '+dmg +edenial', 'Mistrust': '+dmg', 'Cry of Frustration': '+dmg +interrupt', 'Mind Wrack': '+dmg +edenial',
    'Spiteful Spirit': '+dmg', 'Empathy': '+dmg', 'Backfire': '+dmg', 'Ineptitude': '+dmg +c_blind', 'Clumsiness': '+dmg',
    'Barbs': '+dmg', 'Mark of Pain': '+dmg', 'Epidemic': '+cond', 'Plague Signet': '+rm_cond',
    'Energizing Wind': '+energy', 'Song of Concentration': '+partybuff', 'Aggressive Refrain': '+attackbuff',
    'Frenzy': '+attackbuff', 'Flail': '+attackbuff', 'Critical Eye': '+energy', 'Critical Agility': '+attackbuff +defense',
    'Arcane Echo': '+recharge', 'Arcane Mimicry': '+recharge', 'Glyph of Sacrifice': '+recharge',
    'Signet of Capture': '-all', 'Ursan Blessing': '+form +dmg +defense',
    # nachgezogene Funktions-Tags fuer Skills, die die Regeln nicht erkennen
    'Blood is Power': '+energy_ally', 'Guilt': '+edenial +interrupt', 'Shame': '+edenial', 'Glyph of Energy': '+energy',
    'Glyph of Essence': '+energy', 'Glyph of Renewal': '+recharge', 'Glyph of Elemental Power': '+dmg', 'Armor of Earth': '+defense',
    'Winnowing': '+partybuff +attackbuff', 'Muddy Terrain': '+snare', 'Conflagration': '+attackbuff', 'Winter': '+utility',
    'Fertile Season': '+partybuff', "Nature's Renewal": '+rm_hex +rm_ench', "Serpent's Quickness": '+recharge',
    "Otyugh's Cry": '+pet', 'Imagined Burden': '+snare', 'Crippling Anguish': '+snare +dmg', 'Signet of Humility': '+control',
    'Blackout': '+control', 'Diversion': '+control', 'Hex Breaker': '+defense', 'Ignorance': '+control', 'Arcane Thievery': '+control',
    'Shadow of Fear': '+control', 'Rigor Mortis': '+control', 'Spell Breaker': '+prot', 'Pacifism': '+control', 'Amity': '+control',
    'Retribution': '+prot', 'Holy Wrath': '+dmg', 'Scourge Sacrifice': '+dmg', 'Martyr': '+rm_cond', 'Divine Spirit': '+energy',
    "Warrior's Cunning": '+attackbuff', 'Call of Protection': '+pet', 'Antidote Signet': '+rm_cond', 'Wail of Doom': '+control',
    'Gaze of Contempt': '+rm_ench', 'Aura of Displacement': '+speed', 'Mark of Death': '+control', 'Shroud of Silence': '+control',
    'Arcane Languor': '+control', 'Run as One': '+speed', 'Mirrored Stance': '+defense', "Lyssa's Balance": '+rm_ench',
    'Signet of Disenchantment': '+rm_ench', 'Recall': '+speed', 'Sharpen Daggers': '+c_bleeding +cond', 'Shadow Shroud': '+defense',
    'Auspicious Incantation': '+energy', 'Shatter Storm': '+rm_ench', 'Envenom Enchantments': '+rm_ench', 'Icy Shackles': '+snare',
    'Way of the Fox': '+defense', "Death's Charge": '+heal_self +speed', 'Spell Shield': '+defense', 'Lacerate': '+c_bleeding +cond',
    'Way of the Empty Palm': '+attackbuff', 'Famine': '+dmg', 'Dark Apostasy': '+rm_ench', "Locust's Fury": '+dmg',
    'Spirit Walk': '+speed', 'Dash': '+speed', 'Dark Prison': '+snare', 'Spoil Victor': '+dmg', 'Taste of Pain': '+heal_self',
    'Air of Enchantment': '+energy_ally', 'Healing Ring': '+heal_party +heal', 'Soothing': '+control', 'Extend Conditions': '+cond',
    'Signet of Lost Souls': '+energy +heal_self', 'Reversal of Damage': '+prot', 'Toxicity': '+dmg', 'Quicksand': '+dmg',
    'Blazing Finale': '+c_burning +cond', 'Burning Refrain': '+c_burning +cond', 'Purifying Finale': '+rm_cond', '"Make Haste!"': '+speed',
    'Hidden Caltrops': '+snare +c_cripple +cond', 'Assault Enchantments': '+rm_ench', 'Shadow Prison': '+snare', 'Holy Haste': '+utility',
    'Signet of Removal': '+rm_cond +rm_hex', "Wielder's Remedy": '+rm_cond', 'Recovery': '+rm_cond', 'Energizing Finale': '+energy_ally',
    '"Can\'t Touch This!"': '+prot', 'Selfless Spirit': '+prot', 'Spotless Mind': '+rm_hex', 'Spotless Soul': '+rm_hex',
    'Hasty Refrain': '+speed', 'Agony': '+dmg', 'Summon Mursaat': '+dmg', 'Summon Ruby Djinn': '+dmg', 'Summon Ice Imp': '+dmg',
    'Summon Naga Shaman': '+dmg', 'Ebon Battle Standard of Wisdom': '+energy_ally', 'Ebon Vanguard Assassin Support': '+dmg',
    'Heroic Refrain': '+partybuff', 'Winds': '+defense', 'Symbolic Celerity': '+recharge', 'Mantra of Concentration': '+defense',
    'Mantra of Persistence': '+defense', 'Mantra of Inscriptions': '+recharge', 'Echo': '+recharge', 'Master of Magic': '+dmg',
    'Ritual Lord': '+recharge', 'Attuned Was Songkai': '+energy', 'Draw Spirit': '+heal_self', 'Dulled Weapon': '+control',
    'Meekness': '+control', 'Doom': '+dmg', 'Hypochondria': '+cond', 'Symbols of Inspiration': '+energy', 'Healer\'s Boon': '+heal',
    'Smiter\'s Boon': '+energy', 'Natural Temper': '+energy', 'Renewing Memories': '+energy', 'Vocal Was Sogolon': '+partybuff',
    'Sum of All Fears': '+control', 'Companionship': '+heal_self', 'Smoke Powder Defense': '+prot', 'Intensity': '+dmg',
    'Atrophy': '+control', 'Air of Superiority': '+energy', 'Tryptophan Signet': '+snare',
}

# grob kuratierte Meta-Skills (PvE/PvP-Klassiker) - steuern den Weirdness-Regler
META = set('''Hundred Blades|Eviscerate|Executioner's Strike|Frenzy|Flail|Bull's Strike|Hammer Bash|Crushing Blow|Earth Shaker|Devastating Hammer|Dismember|Gash|Sever Artery|Final Thrust|Pure Strike|Jaizhenju Strike|Silverwing Slash|Primal Rage|Dragon Slash|Shield Bash|Healing Signet|Dolyak Signet|"For Great Justice!"|"Shields Up!"|"Watch Yourself!"|Enraging Charge|Soldier's Fury|Splinter Weapon|Barrage|Savage Shot|Distracting Shot|Poison Arrow|Troll Unguent|Throw Dirt|Winnowing|Edge of Extinction|Pain|Favorable Winds|Frozen Soil|Burning Arrow|Apply Poison|Dual Shot|Magebane Shot|Charm Animal|Comfort Animal|Muddy Terrain|Word of Healing|Healing Burst|Patient Spirit|Dwayna's Kiss|Mending|Protective Spirit|Spirit Bond|Guardian|Aegis|Shield of Absorption|Protective Bond|Life Barrier|Mend Condition|Holy Veil|Remove Hex|Smite Hex|Infuse Health|Heal Party|Healing Breeze|Blessed Signet|Zealot's Fire|Ray of Judgment|Balthazar's Spirit|Unyielding Aura|Light of Deliverance|Word of Censure|Signet of Devotion|Reversal of Fortune|Shielding Hands|Glimmer of Light|Vigorous Spirit|Rebirth|Restore Life|Orison of Healing|Animate Bone Minions|Animate Bone Fiend|Animate Bone Horror|Blood of the Master|Death Nova|Jagged Bones|Dark Aura|Spiteful Spirit|Mark of Pain|Barbs|Faintheartedness|Enfeebling Blood|Signet of Lost Souls|Blood is Power|Vampiric Gaze|Offering of Blood|Plague Signet|Epidemic|Well of the Profane|Order of Pain|Soul Barbs|Masochism|Deathly Swarm|Rotting Flesh|Well of Suffering|Energy Surge|Mistrust|Cry of Frustration|Power Drain|Energy Burn|Mind Wrack|Panic|Ineptitude|Clumsiness|Empathy|Backfire|Shatter Enchantment|Shatter Delusions|Arcane Echo|Unnatural Signet|Wastrel's Worry|Wastrel's Demise|Keystone Signet|Symbolic Celerity|Imagined Burden|Visions of Regret|Psychic Instability|Searing Flames|Glowing Gaze|Savannah Heat|Fire Storm|Meteor Shower|Glyph of Lesser Energy|Glyph of Energy|Aura of Restoration|Ether Renewal|Lightning Orb|Chain Lightning|Lightning Surge|Blinding Surge|Invoke Lightning|Shell Shock|Obsidian Flesh|Stoneflesh Aura|Armor of Earth|Ward Against Melee|Ward Against Foes|Glyph of Elemental Power|Mind Burn|Mind Shock|Ice Spikes|Deep Freeze|Shatterstone|Ether Prodigy|Arcane Mimicry|Death Blossom|Jagged Strike|Fox Fangs|Critical Eye|Critical Defenses|Twisting Fangs|Black Lotus Strike|Golden Fang Strike|Unsuspecting Strike|Shadow Form|Shroud of Distress|Dark Escape|Way of the Empty Palm|Moebius Strike|Siphon Strength|Dark Prison|Shadow Prison|Assassin's Promise|Shadow Refuge|Deadly Paradox|Palm Strike|Beguiling Haze|Entangling Asp|Assault Enchantments|Signet of Spirits|Bloodsong|Anguish|Ancestor's Rage|Mend Body and Soul|Spirit Light|Spirit Transfer|Soothing Memories|Protective Was Kaolai|Life|Recuperation|Shelter|Union|Displacement|Mighty Was Vorizun|Weapon of Remedy|Xinrae's Weapon|Spirit's Gift|Resilient Weapon|Earthbind|Attuned Was Songkai|Boon of Creation|Explosive Growth|Ritual Lord|Destruction|Spirit Siphon|Caretaker's Charge|Painful Bond|"Incoming!"|"Fall Back!"|Anthem of Flame|Anthem of Fury|Aggressive Refrain|Song of Concentration|"Stand Your Ground!"|"They're on Fire!"|Angelic Bond|Cruel Spear|Stunning Strike|Barbed Spear|Vicious Attack|Spear of Lightning|Wild Throw|Soldier's Defense|Leader's Comfort|Lyric of Purification|Signet of Aggression|Ballad of Restoration|Chorus of Restoration|Energizing Finale|Song of Power|Mending Refrain|Burning Refrain|Hexbreaker Aria|Defensive Anthem|Avatar of Balthazar|Avatar of Melandru|Avatar of Grenth|Avatar of Lyssa|Vow of Silence|Mystic Sweep|Eremite's Attack|Wounding Strike|Victorious Sweep|Zealous Renewal|Mystic Regeneration|Heart of Fury|Sand Shards|Staggering Force|Aura of Thorns|Mirage Cloak|Conviction|Grenth's Aura|Ebon Dust Aura|Pious Assault|Reap Impurities|Chilling Victory|Radiant Scythe|Aura of Holy Might|Eternal Aura|Vow of Revolution|Mystic Vigor|Arcane Zeal|Dwayna's Touch|Imbue Health|Intimidating Aura|Watchful Intervention|Fleeting Stability|Veil of Thorns|Mystic Corruption|"I Am Unstoppable!"|Ebon Battle Standard of Honor|Ebon Battle Standard of Wisdom|Ebon Battle Standard of Courage|Great Dwarf Weapon|Pain Inverter|Mindbender|Technobabble|Asuran Scan|"Finish Him!"|"Save Yourselves!"|"There's Nothing to Fear!"|Ursan Blessing|Mental Block|Air of Superiority|Drunken Master|Ebon Escape|"By Ural's Hammer!"|Summon Ruby Djinn|Summon Ice Imp|Resurrection Signet|Heroic Refrain|Seven Weapons Stance|"Together as One!"|Weapons of Three Forges|Soul Taker|Time Ward|Shadow Theft|Judgment Strike|Over the Limit|Cry of Pain|Necrosis|Seed of Life|Intensity|Never Rampage Alone|Vampirism|Critical Agility|Whirlwind Attack|Spear of Fury|Triple Shot|"Save Yourselves!"|Summon Spirits|Selfless Spirit|Elemental Lord|Signet of Corruption|Ether Nightmare|Shadow Sanctuary'''.split('|'))


def build():
    skills = []
    seen_rp = {}
    for sid, s in sorted(sd.items(), key=lambda kv: int(kv[0])):
        sid = int(sid)
        if sid < 1 or s['is_pvp']:
            continue
        e, g = EN.get(str(sid)), DE.get(str(sid))
        if not e or not g:
            continue
        name = e['name']
        if name == 'Signet of Capture':
            continue
        if s['is_rp']:
            if name in seen_rp:  # Kurzick/Luxon-Duplikate zusammenfassen
                skills[seen_rp[name]]['alt'].append(sid)
                continue
        t, w, wreq = tag_skill(e['description'], s)
        t |= mech_tags(e['description'], s, t)
        f = FACTS.get(sid)
        if f:
            wiki_fix(t, e['description'], f, name, LOG, s)
            # Helden-KI: Wiki-Abschnitt „Hero Usage“ sagt, dass Helden den Skill nicht (sinnvoll) nutzen
            if f.get('hero') and HERO_BAD_RE.search(' '.join(f['hero'])):
                t.add('hero_bad')
        ov = OVERRIDES.get(name, '')
        for tok in ov.split():
            (t.add if tok[0] == '+' else t.discard)(tok[1:])
        finish_tags(t)
        rec = {
            'id': sid, 'p': s['profession'], 'a': s['attribute'], 't': s['type'], 'c': s['campaign'],
            'e': int(s['is_elite']), 'rp': int(s['is_rp']),
            'en': s['energy'], 'up': s['upkeep'], 'act': s['activation'], 'ac': s['aftercast'],
            'rc': s['recharge'], 'ad': s['adrenaline'], 'sac': s['sacrifice'], 'oc': s['overcast'],
            'n': {'en': name, 'de': g['name']}, 'd': {'en': e['description'], 'de': g['description']},
            'g': sorted(t), 'w': w, 'wr': wreq, 'm': 0, 'mp': 0, 'alt': [],
            'src': None,  # Fundorte stehen in wiki.js (GW_WIKI), nicht mehr hier
        }
        if s['pvp_split'] and s['split_id'] and str(s['split_id']) in sd:
            pv = sd[str(s['split_id'])]
            pe, pg = EN.get(str(s['split_id'])), DE.get(str(s['split_id']))
            if pe and pg:
                pt, pw, pwr = tag_skill(pe['description'], pv)
                pt |= mech_tags(pe['description'], pv, pt)
                if f and f.get('pvp'):
                    wiki_fix(pt, pe['description'], dict(f, causes=f['pvp']['causes'], removes=f['pvp']['removes']), name + ' (PvP)', LOG, pv)
                for tok in ov.split():
                    (pt.add if tok[0] == '+' else pt.discard)(tok[1:])
                finish_tags(pt)
                rec['pvp'] = {'id': s['split_id'], 'en': pv['energy'], 'up': pv['upkeep'], 'act': pv['activation'],
                              'ac': pv['aftercast'], 'rc': pv['recharge'], 'ad': pv['adrenaline'], 'sac': pv['sacrifice'],
                              'oc': pv['overcast'], 'd': {'en': pe['description'], 'de': pg['description']}, 'g': sorted(pt)}
        if s['is_rp']:
            seen_rp[name] = len(skills)
        skills.append(rec)

    by_id = {s['id']: s for s in skills}
    pvx = apply_pvx(skills)
    meta = {
        'attribute': NAMES['attribute'], 'profession': NAMES['profession'], 'type': NAMES['type'],
        'campaign': NAMES['campaign'],
    }
    data = {'v': 6, 'source': 'build-wars/gw-skilldata + Guild Wars Wiki + PvXwiki', 'skills': skills, 'names': meta,
            'pvxEdges': pvx['edges']}
    OUT_JSON.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
    OUT.write_text('const GWDATA=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    if K:
        write_wiki_js(skills, pvx)
        write_review(skills, by_id, pvx)
        write_kb_js(skills, by_id, pvx)
    # Statistik
    c = collections.Counter(tag for s in skills for tag in s['g'])
    print(len(skills), 'Skills;', sum(1 for s in skills if 'pvp' in s), 'mit PvP-Version;',
          sum(1 for s in skills if s['m'] >= 0.5), 'Meta PvE (m>=0.5);', sum(1 for s in skills if s['mp'] >= 0.5), 'Meta PvP')
    print(' '.join(f'{k}:{v}' for k, v in c.most_common()))
    untagged = [s['n']['en'] for s in skills if not (set(s['g']) - NONFUNC)]
    print('ohne Funktions-Tag:', len(untagged), '| Wiki-Korrekturen:', len(LOG), '| PvX-Kanten:', len(pvx['edges']))
    return skills, untagged


NONFUNC = {'ench', 'hex', 'stance', 'signet', 'shout', 'chant', 'spirit', 'prep', 'maintained', 'sacrifice', 'adrenal',
           'weaponspell', 'well', 'trap', 'form', 'lowhp_src'}
FACTS = {int(k): wk.skill_facts(v) for k, v in K['skills'].items()} if K else {}
LOG = []


HERO_BAD_RE = re.compile(r"(?i)(never use this skill unless forced|unable to use this skill effectively|do(?:es)? not use this skill effectively|will not use this skill on their own|will never use this skill\.)")


def finish_tags(t):
    if 'sacrifice' in t:
        t.add('lowhp_src')
    if 'c_cripple' in t:
        t.add('snare')
    if not (t - NONFUNC):
        t.add('utility')


# --- PvX: Meta-Wert je Skill und Modus, gemessene Synergie-Paare -----------------------------
def apply_pvx(skills):
    out = {'edges': [], 'bars': 0, 'pairs': [], 'use': {}, 'good': 0}
    for s in skills:  # Sockel aus der alten Handliste, falls kein PvX-Paket vorliegt
        s['m'] = s['mp'] = 0.3 if s['n']['en'] in META else 0
    if not K or not K.get('pvx'):
        for s in skills:
            s['m'] = s['mp'] = int(s['n']['en'] in META)
        return out
    known = {}
    for s in skills:
        known[wk.norm_name(s['n']['en'])] = s['id']
        for a in s['alt']:
            known.setdefault(wk.norm_name(s['n']['en']), s['id'])
    bars = wk.pvx_bars(K['pvx'], known)
    out['bars'] = len(bars)
    for mode, key in (('pve', 'm'), ('pvp', 'mp')):
        use, tot = wk.pvx_usage(bars, mode)
        out['use'][mode] = {k: v / tot for k, v in use.items()}
        for s in skills:
            share = use.get(s['id'], 0) / tot if tot else 0
            mv = min(1.0, share / 0.035) ** 0.7 if share else 0
            mv = mv if mv >= 0.1 else 0
            s[key] = round(min(1.0, mv + (0.3 if s['n']['en'] in META else 0)), 2)
    pairs, n = wk.pvx_pairs(bars)
    out['pairs'], out['good'] = pairs, n
    by_id = {s['id']: s for s in skills}
    import math
    for a, b, cnt, lift in pairs:
        if cnt < 5 or lift < 4:
            continue
        w = round(min(2.0, 0.6 + math.log(lift) / 3), 2)
        out['edges'].append([by_id[a]['n']['en'], by_id[b]['n']['en'], w, cnt])
        if len(out['edges']) >= 300:
            break
    return out


# --- wiki.js: Wissen für Oberfläche und Wissens-Doku ---------------------------------------
def write_wiki_js(skills, pvx):
    ws = {}
    for s in skills:
        f = FACTS.get(s['id'])
        if not f:
            continue
        e = {'u': wk.WIKI + (f['title'] or s['n']['en']).replace(' ', '_'), 'r': f['ts'],
             'acq': f['acq'][:10], 'notes': f['notes'][:8]}
        if f['hero']:
            e['hero'] = f['hero'][:3]
        fl = [k for k in ('bug', 'anomaly') if f[k]]
        if fl:
            e['fl'] = fl
        if f['related']:
            e['rel'] = f['related'][:12]
        ws[s['id']] = e
    use = {m: {k: round(v, 4) for k, v in pvx['use'].get(m, {}).items() if v >= 0.002} for m in ('pve', 'pvp')}
    payload = {'v': 6, 'fetched': K['bericht'].split('Abgerufen: ')[1].split(' bis')[0] if 'Abgerufen: ' in K['bericht'] else '',
               'skills': ws, 'pvx': {'bars': pvx['bars'], 'good': pvx['good'], 'use': use}}
    # Icons: liegen als docs/icons/<ID>.jpg neben der HTML (Bestand im Repo; ein neuer Skriptlauf landet in dist/icons)
    R = pathlib.Path(__file__).resolve().parent.parent
    icset = set()
    for icdir in (R / 'docs' / 'icons', R / 'dist' / 'icons'):
        if icdir.is_dir():
            icset |= {int(f.stem) for f in icdir.glob('*.jpg') if f.stem.isdigit()}
    if icset:
        payload['ic'] = sorted(icset)
        print('Icons: %d (docs/icons, dist/icons)' % len(icset))
    # Hochauflösende Icons (optional, Skript --icons-hd): Liste aus dem Wissenspaket oder Ordner dist/icons-hd
    hd = {}
    hdj = pathlib.Path(__file__).resolve().parent.parent / 'wissen' / 'gw1-wissen' / 'icons_hd.json'
    hdd = pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'icons-hd'
    if not hdd.is_dir():
        hdd = pathlib.Path(__file__).resolve().parent.parent / 'docs' / 'icons-hd'
    if hdj.exists():
        hd = {int(k): v for k, v in json.loads(hdj.read_text(encoding='utf-8')).items()}
    elif hdd.is_dir():
        hd = {int(f.stem): f.name for f in hdd.iterdir() if f.stem.isdigit() and f.suffix in ('.jpg', '.png')}
    if hd:
        payload['ichd'] = {str(k): v for k, v in sorted(hd.items())}
        print('HD-Icons: %d' % len(hd))
    orte = wk.orte_list(K)
    if orte:
        payload['orte'] = orte
        est = sum(1 for o in orte if o.get('est'))
        print('Orte: %d Vanquish-Gebiete, %d Missionen, Gruppengröße geschätzt bei %d' % (
            sum(1 for o in orte if o['k'] == 'a'), sum(1 for o in orte if o['k'] == 'm'), est))
    js = 'window.GW_WIKI=' + json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';\n'
    # Fundorte/Notizen liest app.js direkt aus GW_WIKI; fundorte.js (Skript, optional) ergänzt nur Icons
    WIKI_OUT.write_text(js.replace('</', '<\\/'), encoding='utf-8')


# --- Knowledge Base (englisch): Glossar mit Wiki-Zitaten, Herkunft der Tags, Kennzahlen ----------
GLOSS = [  # (Wiki-Seite, Kategorie, wie der Generator es nutzt)
    ('Bleeding', 'Conditions', 'Enabler for the engine "Bleeding & deep wound"; several attacks pay off against bleeding foes.'),
    ('Burning', 'Conditions', 'Enabler for the engine "Burning".'),
    ('Crippled', 'Conditions', 'Enabler for the engine "Cripple"; also counts as a snare (control).'),
    ('Deep Wound', 'Conditions', 'Enabler for the engine "Bleeding & deep wound".'),
    ('Weakness', 'Conditions', 'Enabler for the engine "Weakness".'),
    ('Cracked Armor', 'Conditions', 'Enabler for the engine "Cracked armor".'),
    ('Poison', 'Conditions', 'Feeds "Condition stacking".'),
    ('Disease', 'Conditions', 'Feeds "Condition stacking".'),
    ('Blind', 'Conditions', 'Counts as control for role quotas.'),
    ('Dazed', 'Conditions', 'A few skills pay off against dazed foes.'),
    ('Strength', 'Primary attributes', 'Warrior primary: attack skills are valued higher (armor penetration).'),
    ('Expertise', 'Primary attributes', 'Ranger primary: attacks, touch skills, rituals and Ranger skills count ~40% cheaper in the energy budget.'),
    ('Divine Favor', 'Primary attributes', 'Monk primary: Monk healing, protection and removal spells are favoured.'),
    ('Soul Reaping', 'Primary attributes', 'Necromancer primary: in PvE, AoE damage and minion skills are favoured (more deaths, more energy).'),
    ('Fast Casting', 'Primary attributes', 'Mesmer primary: long non-Mesmer spells get faster – basis of the engine "Long casts, half time".'),
    ('Energy Storage', 'Primary attributes', 'Elementalist primary: skills that scale with your energy pool and expensive spells are favoured.'),
    ('Critical Strikes', 'Primary attributes', 'Assassin primary: attacks and critical-hit payoffs are favoured.'),
    ('Spawning Power', 'Primary attributes', 'Ritualist primary: spirits, minions, creatures and weapon spells are favoured.'),
    ('Leadership', 'Primary attributes', 'Paragon primary: shouts and chants are favoured (energy per ally affected).'),
    ('Mysticism', 'Primary attributes', 'Dervish primary: Dervish enchantments count cheaper in the energy budget.'),
    ('Health', 'Core mechanics', 'Two opposite engines: "Big health bar" (more health than the target) and "Living on the edge" (low health). Mixing them is friction.'),
    ('Sacrifice', 'Core mechanics', 'Lowers your own health: enabler for "Living on the edge", friction with skills that need high health.'),
    ('Adrenaline', 'Core mechanics', 'Adrenal skills need attacks or adrenaline sources; "lose all adrenaline" skills are friction with other adrenal skills.'),
    ('Overcast', 'Core mechanics', 'Engine "Overcast": payoffs need at least one overcast source on the bar.'),
    ('Enchantment spell', 'Core mechanics', 'Self-enchantments feed "Enchantment stack"; "lose all enchantments" and "ends if you are enchanted" are friction.'),
    ('Hex spell', 'Core mechanics', 'Engine "Hex stacking"; hexes also enable "hexed foe" payoffs.'),
    ('Stance', 'Core mechanics', 'Stances that end when you attack, use adrenal skills or attack skills are friction in matching bars.'),
    ('Shout', 'Core mechanics', 'Engine "Under shouts" (with chants); Paragons profit via Leadership.'),
    ('Chant', 'Core mechanics', 'Counted together with shouts.'),
    ('Knock down', 'Core mechanics', 'Engine "KD chain"; "Meant to do that" wants you to fall – stability on the same bar is friction.'),
    ('Interrupt', 'Core mechanics', 'Stack engine "Interrupts" (at least 3 on the bar).'),
    ('Shadow step', 'Core mechanics', 'Engines "Teleport troll" and "Caster with a weapon".'),
    ('Lead attack', 'Core mechanics', 'Hard rule: the Assassin combo chain must be complete (lead → off-hand → dual).'),
    ('Off-hand attack', 'Core mechanics', 'Part of the Assassin combo chain.'),
    ('Dual attack', 'Core mechanics', 'Finisher of the Assassin combo chain.'),
    ('Critical hit', 'Core mechanics', 'Engine "Crits".'),
    ('Life stealing', 'Core mechanics', 'Counts as self-healing (sustain).'),
    ('Item spell', 'Core mechanics', 'Bundles stow your weapon: only on casters, except with Full Bravery or real payoff at weirdness 9+.'),
    ('Weapon spell', 'Core mechanics', 'Engine "Weapon spells".'),
    ('Spirit', 'Core mechanics', 'Engine "Spirit spam".'),
    ('Minion', 'Core mechanics', 'Engine "Minion master".'),
    ('Inscription', 'Gear', 'Used for the weapon-set hints, e.g. "Vengeance is Mine" for low-health bars instead of +health.'),
]


def write_kb_js(skills, by_id, pvx):
    M = K.get('mechanik') or {}
    gloss = []
    for title, cat, note in GLOSS:
        e = M.get(title)
        q, kind = wk.wiki_quote(e.get('text'), title) if e else ('', '')
        gloss.append({'t': title, 'c': cat, 'q': q, 'k': kind, 'n': note, 'u': wk.WIKI + title.replace(' ', '_'),
                      'r': (e or {}).get('timestamp', '')[:10]})
    prov = {}
    for name, change, why in LOG:
        base = name[:-6] if name.endswith(' (PvP)') else name
        prov.setdefault(base, {}).setdefault('w', []).append([change, why, name.endswith(' (PvP)')])
    for name, ov in OVERRIDES.items():
        prov.setdefault(name, {})['o'] = ov.split()
    res = {}
    for name, why in wiki_residuals(by_id, FACTS):
        res.setdefault(name, []).append(why)
    commit = ''
    try:
        import subprocess
        commit = subprocess.run(['git', '-C', str(SRC), 'log', '-1', '--format=%cs'], capture_output=True, text=True, timeout=10).stdout.strip()
    except Exception:  # noqa: BLE001
        pass
    pairs = [[by_id[a]['n']['en'], by_id[b]['n']['en'], c, l] for a, b, c, l in pvx['pairs'][:120]]
    payload = {'gloss': gloss, 'prov': prov, 'res': res, 'pairs': pairs,
               'stats': {'skills': len(skills), 'pvp': sum(1 for s in skills if 'pvp' in s), 'wikiSkillPages': len(FACTS),
                         'mechPages': len(M), 'pvxBars': pvx['bars'], 'pvxGood': pvx['good'], 'pvxEdges': len(pvx['edges']),
                         'wikiFixes': len(LOG), 'overrides': len(OVERRIDES), 'residuals': sum(len(v) for v in res.values()),
                         'skilldata': commit}}
    js = 'window.GW_KB=' + json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';\n'
    (HERE / 'kb_data.js').write_text(js.replace('</', '<\\/'), encoding='utf-8')


# --- Review-Protokoll ---------------------------------------------------------
def write_review(skills, by_id, pvx):
    REVIEW.mkdir(exist_ok=True)
    L = ['# Mechanik-Abgleich v6 (automatisch erzeugt von build_data.py)', '',
         'Quelle: Wissenspaket (Guild Wars Wiki, PvXwiki), abgerufen ' + (K['bericht'].split('Abgerufen: ')[1].split(' bis')[0] if 'Abgerufen: ' in K['bericht'] else '?') + '.', '',
         '## 1. Automatische Korrekturen aus dem Wiki (%d)' % len(LOG), '',
         '| Skill | Änderung | Grund |', '|---|---|---|']
    L += ['| %s | `%s` | %s |' % (n, c, w) for n, c, w in LOG]
    res = wiki_residuals(by_id, FACTS)
    L += ['', '## 2. Offene Abweichungen – UNVERIFIZIERT, bitte mit Spielerfahrung prüfen (%d)' % len(res), '',
          'Meist Formulierungsfragen (Wirkung nur unter Bedingung, Zustand auf Verbündeten statt Gegner). '
          'Korrektur bei Bedarf über OVERRIDES in build_data.py.', '']
    L += ['- **%s**: %s' % r for r in res]
    L += ['', '## 3. Zustands-Tags (Anti-Synergien)', '']
    for tag, label in [('needs_lowhp', 'will wenig eigene LP'), ('needs_morehp', 'will mehr LP als das Ziel'),
                       ('hp_keep_high', 'endet unter 50 % LP'), ('lowhp_src', 'senkt eigene LP (Opfern/Selbstschaden)'),
                       ('ends_on_ench', 'endet, wenn du verzaubert wirst'), ('ends_on_attack', 'endet bei Angriff/Treffer'),
                       ('ends_on_nonadrenal', 'endet bei Nicht-Adrenalin-Skill'), ('ends_on_adrenal', 'endet bei Adrenalin-Skill'),
                       ('ends_on_attackskill', 'endet bei Angriffs-Skill'), ('ends_on_nonhex', 'endet bei Nicht-Verhexung'),
                       ('ends_on_otherench', 'endet bei weiterer Verzauberung'), ('ends_on_move', 'endet bei Bewegung'),
                       ('adr_dump', 'verliert alles Adrenalin'), ('e_dump', 'verliert alle Energie'), ('no_spells', 'kann keine Zauber wirken'),
                       ('rm_cond_self', 'entfernt eigene Zustände'), ('stability', 'kann nicht niedergeworfen werden')]:
        names = sorted(s['n']['en'] for s in skills if tag in s['g'])
        L.append('- **%s** `%s` (%d): %s' % (label, tag, len(names), ', '.join(names)))
    dis = sorted((s['n']['en'], t) for s in skills for t in s['g'] if t.startswith('dis:'))
    L.append('- **sperrt eigene Skill-Gruppen** `dis:<gruppe>:<sek>` (%d): %s' % (len(dis), ', '.join('%s (%s)' % (n, t[4:]) for n, t in dis)))
    # Meta
    L += ['', '## 4. Meta-Wert aus PvX (%d Leisten, davon %d Great/Good)' % (pvx['bars'], pvx['good']), '',
          'm = min(1, (Anteil/3,5 %)^0,7) + 0,3 Sockel für die alte Handliste; getrennt für PvE (`m`) und PvP (`mp`).', '']
    up = sorted((s for s in skills if s['m'] >= 0.5 and s['n']['en'] not in META), key=lambda s: -s['m'])
    down = sorted((s for s in skills if s['n']['en'] in META and s['m'] < 0.35 and s['mp'] < 0.35), key=lambda s: s['n']['en'])
    L.append('- **Neu als Meta erkannt (PvE, m ≥ 0,5)** (%d): %s' % (len(up), ', '.join('%s %.2f' % (s['n']['en'], s['m']) for s in up)))
    L.append('- **Alte Handliste, in PvX kaum genutzt** (%d): %s' % (len(down), ', '.join(s['n']['en'] for s in down)))
    L += ['', '## 5. Gemessene Paare aus PvX (Top 60 von %d, als Kanten übernommen: %d)' % (len(pvx['pairs']), len(pvx['edges'])), '']
    L += ['- %s + %s: %d× gemeinsam, Lift %.1f' % (by_id[a]['n']['en'], by_id[b]['n']['en'], c, l) for a, b, c, l in pvx['pairs'][:60]]
    (REVIEW / 'mechanik-abgleich.md').write_text('\n'.join(L) + '\n', encoding='utf-8')


if __name__ == '__main__':
    sk, un = build()
    if '--untagged' in sys.argv:
        print(un)

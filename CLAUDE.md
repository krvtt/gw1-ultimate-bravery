# CLAUDE.md – Arbeitsanleitung für Claude

Zaishen Ultimate Bravery: Web-Tool für zufällige, aber spielbare Off-Meta-Builds in Guild Wars 1 (Solo, Helden-Teams 4/6/8, PvP 1v1). Live: https://krvtt.github.io/gw1-ultimate-bravery/ (GitHub Pages aus `docs/`, Branch `main`).

**Arbeitssprache mit Georg: Deutsch.** Oberfläche: Englisch (Standard) und Deutsch. Code-Kommentare deutsch.
**Aufgaben und Reihenfolge:** `dev/ROADMAP.md` (einzige Aufgabenliste). Aufgaben-Briefings: `dev/briefs/`. Entscheidungen und Verlauf: Projekt-Dokument „GW1-Bravery-Uebergabe.md“ im claude.ai-Projekt.

## Erst lesen, dann ändern
1. `git pull --rebase` (es kann parallel gearbeitet worden sein).
2. `python3 src/build.py` – erzeugt `docs/index.html`, `docs/knowledge.html`, `docs/sw.js`, `docs/manifest.webmanifest`. **`docs/*.html` und `docs/sw.js` nie von Hand ändern.**
3. Tests laufen lassen (siehe unten). Erst grün, dann ändern.

## Aufbau
| Pfad | Inhalt |
|---|---|
| `src/app.html` | Gerüst + CSS der App; Platzhalter `/*DATA*/ /*CORES*/ /*GEN*/ /*GEAR*/ /*WIKI*/ /*APP*/`, `<!--PWA-->` |
| `src/app.js` | Oberfläche (eine IIFE, ~1.600 Zeilen). Blöcke von oben: Einstellungen/Link, Würfeln, Karten, Tooltips, Skill-Pool + Link-Kodierung, Logbuch, Helden/Destiny/Titel (TX3), Hub/Abläufe/Overlays (TX4), Charaktere/letzter Build/Backup/Web-App (TX5), Hilfe/Teilen/Schnappschuss (HELP) |
| `src/generator.js` | Kern: Motoren (Engines), Kanten, Regeln, Anti-Synergien, Teams, Vorlagencode. Export `window.GWGen` |
| `src/gear.js`, `src/cores.js` | Waffen-Sets; frühere Spaß-Kerne |
| `src/kb.html`, `src/kb.js` | Knowledge Base (englisch) |
| `src/data.js`, `src/wiki.js`, `src/kb_data.js` | **generiert** von `src/build_data.py` (braucht gw-skilldata + `wissen/`, beides nicht im Repo) – nicht von Hand ändern |
| `src/build.py` | bündelt alles, berechnet Generator-Version `GW_GV` und Service-Worker-Version |
| `tools/fundorte_abrufen.py` | Wiki-Abruf (läuft bei Georg auf dem Mac, nicht hier) |
| `docs/` | Webseite (generiert) + `docs/icons/` (Skill-Icons, Bestand) |
| `dev/` | Roadmap, Briefings, Doku für Folge-Chats |

## Tests
```
cd <repo> && python3 src/build.py
node src/test_addons.js && node src/test_rules.js && node src/test_team.js && node src/test_conflicts.js
node src/smoke_ui.js > /dev/null && echo ui-ok
python3 src/test_fundorte.py
export NODE_PATH=$(npm root -g)      # Playwright + Chromium sind vorinstalliert, nie "playwright install"
node src/smoke_app.js && node src/smoke_kb.js && node src/smoke_release.js && node src/smoke_next.js
```
Langsam (nur bei Generator-Änderungen): `node src/test_gen.js 2000`, `node src/test_organic.js 1500`. Bei 2 CPU-Kernen höchstens 2 Tests parallel.
Neue Funktion = neuer oder erweiterter Browser-Test (Muster: `src/smoke_next.js`). Web-App/Offline nur über lokalen Webserver testbar (Muster: Ende von `src/smoke_release.js`).

## Veröffentlichen
- Kleine Korrekturen/Tuning: bauen, alle Tests grün, committen, `git push` auf `main` → GitHub Pages ist nach 1–3 min live, die App lädt die neue Version beim nächsten Öffnen.
- Größere Änderungen (neue Oberfläche, neue Modi): erst `docs/index.html` als Vorschau an Georg schicken (läuft lokal per Doppelklick), nach seinem Go pushen.
- Kaputt? `git revert <commit>` + push.
- Commit-Nachricht: kurz, englisch; Attribution laut System-Hinweis der Sitzung. Keine privaten E-Mail-Adressen.
- Nach dem Push `dev/ROADMAP.md` (Status) und `CHANGELOG.md` aktualisieren.

## Regeln, die nie brechen dürfen
- **Links reproduzieren exakt.** Ein Build wird aus Seed + Einstellungen neu gewürfelt. Alles, was das Ergebnis beeinflusst, steht im Link: Pool `f`/`fh` (Bitfeld über `VB.skills`), `x` (Verbindungs-Flags), `k` (eigene Kanten), `rf`, `h` (Helden), `e` (Elite), `d` (Destiny). Dazu `gv` (Generator-Version) und `t` (Vorlagencodes, `.`-getrennt). Weicht das Neu-Gewürfelte von `t` ab (andere Version oder nachträglich geändert), zeigt die App einen **Schnappschuss** aus den Codes. Neue Einflussgrößen → in `linkParams()`/`linkSpec()` aufnehmen und testen.
- Charakternamen und andere persönliche Daten nie in Links, nie auf Server. Alles bleibt im `localStorage` (`gw1ub_store_v1`) bzw. im Backup.
- Kein Tracking, keine Analytics, keine Server-Abhängigkeit, keine externen Skripte/Fonts (läuft offline).
- Wiki-Schutz nie umgehen (kein falscher User-Agent, keine Umwege, wenn das Wiki 403 liefert).
- Skill-, Attribut-, Waffen- und Professionsnamen nur aus den Skilldaten (`s.n.en` / `s.n.de`), nie aus dem Kopf; deutsche Namen erst recht nicht. Rollen im Community-Jargon (Damage, Healer, Prot, Support, Tank, Caster). Build-Namen DE und EN gleich.
- Unsichere Spielmechanik in Texten und Doku als UNVERIFIZIERT kennzeichnen.
- `window.GWDATA={…};</script>` muss so in `docs/index.html` stehen (Abruf-Skript und Tests lesen es per Regex).

## Bausteine, die man wiederverwenden sollte
- Texte: `t()` (Tabelle `T`), `t2`…`t5` (Tabellen `TX2`…`TX5`, je `en`/`de`). Neue Texte in die passende Tabelle, immer beide Sprachen.
- Hilfe: `hlp('key')` erzeugt einen ?-Knopf; Text in `HELP.en/de`. Funktioniert auch in Dialogen und in klickbaren Kacheln.
- Etikett: `xpBadge()` für experimentelle Funktionen.
- Teilen: `shareLink()`; Kopieren: `copy(text, toastText)`; Hinweis: `toast()`.
- Skill-Pool: `pools()` → `{p, h}` (Sets oder `null` = alle); `asFilter(set)`; nie direkt `Store.d.base` auswerten.
- Speicher: `Store.d` + `Store.save()`; neue Felder in `Store.def()` vorbelegen, alte Backups müssen weiter laden.
- Generator-Analyse: `GWGen.conflictsOf`, `motorRealized`, `linksOf`, `unmet`, `deadPayoffs`, `validate`, `primBenefit`, `decodeTemplate`, `encodeTemplate`, `view('pve'|'pvp')`.

## Bekannte Stolperfallen
- Playwright: `page.goto` mit anderem Hash lädt nicht neu → `page.reload()` oder über `about:blank` gehen.
- Offene `<dialog>` liegen in der obersten Ebene: schwebende Elemente in den Dialog hängen (siehe `showHelp`).
- Service Worker nur auf http(s) mit Manifest; im `file://`-Test ist er aus.
- Leinwand (Canvas) mit Icons ist unter `file://` „verunreinigt“ → Export-Funktionen über lokalen Webserver testen.
- Umgebung: kein `rsync`; `gh api` nur eingeschränkt; Wiki und Fandom aus der Shell gesperrt.

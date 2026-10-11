# Roadmap

Einzige Aufgabenliste des Projekts. Status: **offen** · **läuft** · **erledigt** · **geparkt**. Aufwand = reine Arbeitszeit eines Chats.

## Vor dem Reddit-Post
| ID | Aufgabe | Modell | Aufwand | Status | Hängt ab von |
|---|---|---|---|---|---|
| A | Fundament: stabile Links (Version + Codes, Schnappschuss), Teilen-Knopf, Hilfe-Knöpfe, Full-Bravery-Stufenschalter, Experimental-Etiketten, Feedback-Link, Issue-Vorlagen, `CLAUDE.md`, dieser Ordner | Opus | 2,5 h | erledigt (Beta 2) | – |
| B | Zaishen Bravery: ein Team-Wurf pro Tag für alle, Wechsel 16:00 UTC → `briefs/B-zaishen-bravery.md` | Sonnet | 1,5 h | offen | A |
| C | Export-Karte: Build als Bild mit Vorschau, Download/Teilen → `briefs/C-export-card.md` | Sonnet | 2 h | offen | A (nach B) |
| D | Rate my bar: eigene Leiste analysieren → `briefs/D-rate-my-bar.md` | Opus | 2,5–3 h | offen | A (nach C) |
| T1 | Hilfe-Texte DE/EN gegenlesen → `briefs/T-texts.md` | Haiku | 0,5 h | offen | A |
| T2 | Patch Notes Beta 2 für Tester | Haiku | 0,3 h | offen | A |
| T3 | Reddit-Post-Entwurf (EN) mit Bildern aus C | Haiku | 0,5 h | offen | B, C, D |
| G1 | Georg: Charakter-Import mit echter `character_completion.json` testen | – | 10 min | offen | – |
| G2 | Georg: ArenaNet Content Terms of Use lesen (arena.net/en/legal/content-terms-of-use) | – | 10 min | offen | – |
| G3 | Georg: Regeln von r/GuildWars zu Eigenwerbung/Tools lesen; Zeitpunkt festlegen | – | 10 min | offen | – |

## Nach dem ersten Feedback
| ID | Aufgabe | Modell | Aufwand | Status |
|---|---|---|---|---|
| E | Oberfläche aufräumen: „Weiter“ und „letzter Build“ zu einer Karte; Solo-Karte mit einklappbaren Details wie im Team; kurzer Einstieg für Neue; einheitliche Icons und Abstände; Kontrast hell/dunkel | Sonnet | 2–3 h | offen |
| F | Bewertungen der Tester → `tuning.js` bzw. Gewichte im Generator (erhöht Generator-Version → alte Links zeigen Schnappschuss) | Opus | 2 h | offen |
| H | HD-Icons: Plan in der Übergabe (Wiki-Sperre prüfen, Lauf `--icons-hd`, auf 128 px rechnen, Stichprobe, dann committen) | Sonnet | 1 h | offen (wartet auf Georgs Lauf) |
| M | Mechanik-Abgleich: 8 offene Abweichungen (Datei `review/mechanik-abgleich.md`, nicht im Repo – liegt im Projekt-ZIP) | Opus + Georg | 1 h | offen |
| R | „Advanced“: einzelne Regeln aus dem Full-Bravery-Topf ausschließen (experimental) | Sonnet | 1 h | offen |
| K | Heldenauswahl aus der Toolbox-Datei vorbelegen (Feld `heroes`; Helden-IDs UNVERIFIZIERT, erst mit echter Datei prüfen) | Sonnet | 1 h | offen (nach G1) |

## Später / geparkt
| Aufgabe | Status | Grund |
|---|---|---|
| Deutsche Ortsnamen | geparkt | keine Quelle (Wiki nur englisch) |
| Feuerpfeil-Kombo organisch; seltene Bravery-Regeln („Nutznießer ohne Auslöser“, „Energie egal“) öfter wirksam | später | Opus, nach F |
| Bestenliste / gemeinsame Bewertungen | geparkt | braucht Server |

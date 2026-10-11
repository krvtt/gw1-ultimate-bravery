# dev/ – Arbeitsordner für Folge-Chats

Hier liegt alles, was ein neuer Chat braucht, um eine Aufgabe ohne Vorwissen sauber umzusetzen.

| Datei | Zweck |
|---|---|
| `ROADMAP.md` | **Die eine Aufgabenliste** mit Status, Modell-Empfehlung und Aufwand |
| `briefs/B-zaishen-bravery.md` | Täglicher Wurf für alle (Sonnet) |
| `briefs/C-export-card.md` | Build als Bild mit Vorschau (Sonnet) |
| `briefs/D-rate-my-bar.md` | Eigene Leiste analysieren (Opus) |
| `briefs/T-texts.md` | Texte: Hilfe prüfen, Patch Notes, Reddit-Post (Haiku) |
| `../CLAUDE.md` | Technische Arbeitsanleitung (Aufbau, Tests, Regeln) – wird in jeder Sitzung automatisch geladen |

## Welches Modell wofür
| Modell | Geeignet für | Nicht für |
|---|---|---|
| **Opus** | Generator, Analyse, Link-Format, Tuning aus Bewertungen, Mechanik-Fragen, alles mit unklarer Lösung | Fleißarbeit nach fertigem Plan (zu teuer) |
| **Sonnet** | Features nach einem Briefing, Oberfläche, Tests schreiben | Änderungen an den Würfel-Regeln ohne Briefing |
| **Haiku** | Texte: Übersetzung, Konsistenz, Patch Notes, Posts, Issue-Zusammenfassungen | Code in `app.js` oder `generator.js` (große Dateien, viele Abhängigkeiten) |

## So startest du einen Chat
Im claude.ai-Projekt „GW Bravery“ einen neuen Chat öffnen, Modell wählen, dann:

> Projekt GW1 Ultimate Bravery. Bitte Repo krvtt/gw1-ultimate-bravery anhängen und klonen, `CLAUDE.md` lesen und `dev/briefs/<DATEI>.md` umsetzen. Erst Plan und Zeitschätzung, dann auf mein Go bauen.

## Regeln für parallele Arbeit
- **Immer nur ein Feature-Chat zur Zeit** ändert `src/app.js` oder `src/generator.js`. Reihenfolge laut `ROADMAP.md`.
- Text-Chats (Haiku) dürfen parallel laufen: Sie schreiben nur Markdown unter `dev/texts/`, ein Feature-Chat übernimmt die Texte danach in den Code.
- Jeder Chat: vor Beginn `git pull --rebase`, vor dem Push alle Tests, nach dem Push Status in `ROADMAP.md` und Eintrag in `CHANGELOG.md`.
- Größere Oberflächen-Änderungen erst als Vorschau-Datei an Georg, dann pushen.

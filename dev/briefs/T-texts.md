# Briefing T – Texte (Haiku)

**Modell:** Haiku · **Aufwand:** je 20–30 min · **Darf parallel zu Feature-Chats laufen** · Ergebnis nur als Markdown unter `dev/texts/` (kein Code ändern). Ein Feature-Chat übernimmt die Texte danach.

Grundlage für alle Texte: `README.md`, `CHANGELOG.md`, `CLAUDE.md` und die Texttabellen in `src/app.js` (`T`, `TX2` … `TX5`, `HELP`). **Nichts erfinden:** Nur Funktionen beschreiben, die im CHANGELOG stehen. Skill-, Attribut- und Professionsnamen nur so, wie sie in `src/data.js` stehen.

## T1 – Hilfe-Texte gegenlesen → `dev/texts/T1-hilfe-review.md`
- Alle Einträge in `HELP.en` und `HELP.de` prüfen: gleicher Inhalt in beiden Sprachen, kurz (max. 3 Sätze), keine Fachbegriffe ohne Erklärung, Community-Jargon für Rollen (Damage, Healer, Prot, Support, Tank).
- Ausgabe als Tabelle: Schlüssel · Sprache · alt · Vorschlag · Grund. Nur echte Verbesserungen, keine Geschmacksänderungen.

## T2 – Patch Notes Beta 2 → `dev/texts/T2-patchnotes-beta2.md`
- Für Tester, EN und DE, je max. 120 Wörter, Stichpunkte. Aus `CHANGELOG.md` (Abschnitt Beta 2).
- Wichtig für Tester: alte Links zeigen nach Updates die gespeicherten Leisten; „experimental“ heißt „Feedback erwünscht“; Feedback-Link.

## T3 – Reddit-Post (r/GuildWars) → `dev/texts/T3-reddit-post.md`
- Erst wenn B, C und D erledigt sind.
- 3 Titel-Vorschläge (max. 80 Zeichen, kein Clickbait), Text max. 200 Wörter, Englisch.
- Inhalt: was das Tool ist (Ultimate-Bravery-Idee für GW1), wie man es nutzt (Link, Handy-App), Zaishen Bravery als Mitmach-Aufhänger, was experimentell ist, Feedback-Link, Hinweis „inoffizielles Fan-Projekt, nicht verbunden mit ArenaNet“, kein Tracking.
- Liste der Bilder, die dazugehören (aus der Export-Karte).
- Hinweis an Georg: Subreddit-Regeln vorher selbst lesen (ROADMAP G3).

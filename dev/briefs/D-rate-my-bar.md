# Briefing D – Rate my bar

**Modell:** Opus · **Aufwand:** ca. 2,5–3 h · **Voraussetzung:** A erledigt, C gepusht · **Danach:** ROADMAP-Status, CHANGELOG, Vorschau an Georg, dann Push

## Ziel
Spieler fügen den Vorlagencode ihrer eigenen Leiste ein (oder einen Build-Link) und bekommen eine ehrliche Analyse mit derselben Logik, mit der der Generator baut: Worum dreht sich die Leiste, was greift ineinander, wo bremst sie sich, wie Off-Meta ist sie? Dazu ein Knopf „Bravery-Remix“: würfelt eine Variante um denselben Elite.

## Erlebnis
- Startseite: Link „Rate my bar“ (in der Linkleiste oder als Modus-Kachel – im Plan begründen). Eigene Unterseite `#/rate`.
- Eingabefeld (Code oder Link), Umschalter PvE/PvP, Knopf „Analysieren“. Ergebnis als Karte:
  1. Klassen, die 8 Skills (Kacheln mit Tooltips wie gewohnt), Attribute.
  2. **Engines:** erkannte Motoren mit den tragenden Skills (Auslöser → Nutznießer).
  3. **Synergien:** Paare aus Basis-, PvX- und eigenen Verbindungen.
  4. **Reibung:** Konflikte (wie auf den Karten), inkl. „tote Nutznießer“ ohne Auslöser.
  5. **Regel-Check:** harte Probleme (zwei Elites, Waffe ohne Attribut, zu viele Attributlinien, Punkte in ungenutzten Linien) und weiche Hinweise.
  6. **Off-Meta-Grad:** Schätzung auf der Weirdness-Skala 1–10 aus den Meta-Werten (`s.m` / `s.mp`) und dem Anteil fremder Skills; als Balken mit Text, ausdrücklich „Schätzung“.
  7. Primärprofession: wie viele Skills, Rang des Primärattributs, Nutzen (`primBenefit`).
- Kein Punkte-Urteil („7/10“) – lieber konkrete Befunde. Ton: freundlich-ehrlich, kein Spott.
- „Bravery-Remix“: `genBuild` mit `elite` = Elite der Leiste, gleicher Primärprofession, Weirdness aus der Schätzung; öffnet als normaler Build (Link funktioniert).
- Teilen: Link `#/rate?c=<code>` öffnet direkt die Analyse.

## Technische Anker
- **Analyse in den Generator legen** (`src/generator.js`), z. B. `analyzeBar({mode, primary, secondary, ranks, skills})` → strukturiertes Ergebnis (keine HTML-Strings). Export über `GWGen`.
- Vorhandene Bausteine: `decodeTemplate`, `view(mode)` (`byId`), `conflictsOf(bar)`, `deadPayoffs`, `unmet(bar)`, `motorRealized`, `MOTORS`, `motorHit`, `linksOf`, `EDGE_MAP`, `validate(b)` (erwartet ein Build-Objekt – Felder ggf. aus der Leiste ableiten: Waffenfamilie aus Angriffs-Skills, `weaponAttr`, `attributes`, `points`), `primBenefit`, `PRIMARY_ATTR`, `WEAPON_ATTR`.
- Attributpunkte aus Rängen berechnen (Kostentabelle steht im Generator); effektive Ränge ohne Runen.
- Oberfläche in `src/app.js`: neue Seite in `PAGES`, Texte in einer neuen Tabelle oder `TX5` (en/de), Hilfe-Knöpfe `hlp()` für jede Rubrik.
- PvP-Umschalter nutzt `view('pvp')` (PvP-Werte der Skills).

## Akzeptanzkriterien
1. 200 vom Generator erzeugte Leisten (Weirdness 1–10): keine harten Regelverstöße gemeldet; erkannte Engines enthalten den Motor, mit dem gewürfelt wurde (≥ 90 %).
2. Konstruierte Fehlerfälle werden erkannt: zwei Elites; Nutznießer ohne Auslöser; Attributlinie ohne Skills; Waffen-Angriffe ohne Waffenattribut.
3. Off-Meta-Schätzung korreliert mit der Weirdness, mit der gewürfelt wurde (Rangkorrelation ≥ 0,6 über 500 Leisten). Ergebnis im Test ausgeben.
4. Ungültiger Code → verständliche Meldung, kein Absturz.
5. Remix erzeugt einen Build mit demselben Elite.
6. Neue Tests: `src/test_rate.js` (Node, Analyse) und `src/smoke_rate.js` (Browser). Alle bestehenden Tests grün.

## Risiken
- Motoren sind für das Bauen gedacht, nicht für das Erkennen: Schwellen können zu streng sein → Kriterium 1 zeigt es; lieber „schwach erkannt“ als falsch.
- Keine neuen Mechanik-Behauptungen: Texte nur aus vorhandenen Tags und Regeln. Unsicheres als „vermutlich“ formulieren.

## Nicht Teil der Aufgabe
Verbesserungsvorschläge Skill für Skill („tausche X gegen Y“) – das wäre ein eigenes Feature.

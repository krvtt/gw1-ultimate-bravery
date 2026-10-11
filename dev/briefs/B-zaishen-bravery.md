# Briefing B – Zaishen Bravery (täglicher Wurf für alle)

**Modell:** Sonnet · **Aufwand:** ca. 1,5 h · **Voraussetzung:** Paket A (erledigt) · **Danach:** ROADMAP-Status, CHANGELOG, Push

## Ziel
Jeden Tag gibt es genau einen Wurf, der für alle Spieler weltweit gleich ist: Ort (Mission oder Vanquish), Teamgröße, Helden und alle Leisten. Die Community kann im Reddit-Thread vergleichen, wer es geschafft hat. Name: **Zaishen Bravery** (DE und EN gleich).

## Erlebnis
- Startseite: oben eine eigene Karte „Zaishen Bravery“ mit dem Ort von heute, Weirdness/Bravery des Tages und „neuer Wurf in 5 h 12 min“. Knopf „Heute würfeln“. Hat man den heutigen Wurf schon ins Logbuch eingetragen: Haken „heute geschafft“.
- Build-Seite: Banner wie bei Destiny, zusätzlich „Zaishen Bravery · <Datum>“. Teilen-Link zeigt beim Empfänger denselben Wurf mit Banner.
- Logbuch: Eintrag ist als Zaishen markiert; neue Erfolge.
- Hilfe-Knopf `hlp('zaishen')`: „Ein Wurf pro Tag für alle. Wechsel um 16:00 UTC, zusammen mit den Zaishen-Quests im Spiel. Immer mit allen Skills, damit alle dasselbe bekommen.“ (EN + DE in `HELP`).

## Regeln (entschieden)
- **Wechsel 16:00 UTC** – zur selben Zeit wie die täglichen Zaishen-Quests im Spiel (Guild Wars Wiki, „Zaishen Challenge Quest“: „given out daily at 16:00 UTC“).
- Tagesnummer: `day = Math.floor((Date.now() - 16 * 3600e3) / 864e5)`; Datum fürs Banner = UTC-Datum von `day`.
- Seed aus der Tagesnummer, unabhängig von allem Lokalen: z. B. `seed = G.rngFrom(day * 2654435761 >>> 0)() * 2 ** 32 >>> 0`.
- **Ignoriert alle lokalen Einstellungen:** Skill-Pool = alle Skills, alle Kampagnen, Standard-Verbindungen, Reforged an. Umsetzung: vor dem Würfeln `st.link = {p: null, h: null, e: {core: true, pvx: true, custom: []}, cores: true, rf: true}` setzen und `roll(true)` mit dem Tages-Seed – dann gilt automatisch die Link-Logik.
- Ort: `rollDestiny(seed)` – **aber** `destinyPlaces()` filtert nach `Store.d.camps`. Für Zaishen einen Parameter ergänzen, der alle Kampagnen nimmt.
- Weirdness und Bravery nach Wochentag (UTC, Vorschlag): Mo 4 · Di 5 · Mi 6 · Do 7 · Fr 8 · Sa 9 + Bravery 1 · So 10 + Bravery 2. Helden: vom Würfel (wie Destiny).
- Kein eigener Punkte-Multiplikator (Punkte-Formel bleibt).
- Link: zusätzlich `z=<day>` (nur Anzeige/Logbuch, beeinflusst das Würfeln nicht). Muss beim Neu-Schreiben des Links erhalten bleiben.

## Technische Anker (`src/app.js`)
- `roll()`, `writeHash()`, `readHash()`, `linkParams()` – Link-Logik; `st.link` für feste Pools.
- `rollDestiny(seed)`, `destinyPlaces(kind)`, `destinyBanner(tm)` – Destiny.
- `renderHub()` + `hubExtraClick(e)` – Startseite; `flowLabel()`, `MODE_ICON`.
- Logbuch: `RENDER['dlg-log']`, `facts(b)`, `Store.d.log` (Einträge bekommen `zaishen: day`).
- Erfolge: `ACH`, `checkAch()` – im vorhandenen Format ergänzen: „Zaishen Initiate“ (erster Zaishen-Eintrag), „Zaishen Regular“ (7 verschiedene Tage), „Zaishen Streak“ (3 Tage in Folge). Namen DE und EN gleich.
- Texte: neue Schlüssel in `TX5` (en/de), Hilfe in `HELP`.

## Akzeptanzkriterien
1. Zwei Browser mit unterschiedlichen Einstellungen (Basis „meine Charaktere“, Kampagnen aus, Verbindungen aus) bekommen am selben Tag dieselben Vorlagencodes und denselben Ort.
2. Um 15:59 UTC und 16:01 UTC unterschiedliche Würfe; 16:01 und am nächsten Tag 15:59 gleicher Wurf.
3. Geteilter Zaishen-Link zeigt beim Empfänger denselben Wurf mit Zaishen-Banner.
4. Logbuch-Eintrag trägt `zaishen`; Hub zeigt danach „heute geschafft“; Erfolg „Zaishen Initiate“ wird freigeschaltet.
5. Countdown stimmt (± 1 min) und läuft in der Sprache des Nutzers.
6. Alle bestehenden Tests grün; neuer Test `src/smoke_zaishen.js` (Zeit per `page.addInitScript` festsetzen, `Date.now` überschreiben).

## Nicht Teil der Aufgabe
Bestenliste, Server, Benachrichtigungen, wöchentliche Herausforderung.

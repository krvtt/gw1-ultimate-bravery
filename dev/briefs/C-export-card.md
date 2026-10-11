# Briefing C – Export-Karte mit Vorschau

**Modell:** Sonnet · **Aufwand:** ca. 2 h · **Voraussetzung:** A erledigt, B gepusht · **Danach:** ROADMAP-Status, CHANGELOG, Vorschau an Georg, dann Push

## Ziel
Jeder Build (Solo, Team, Schnappschuss) lässt sich als Bild exportieren – für Reddit, Discord oder WhatsApp. Erst eine Vorschau, dann Download oder Teilen.

## Erlebnis
- Knopf „Bild“ (Icon) in der Kopfzeile der Build-Seite neben „Teilen“.
- Dialog mit Vorschau (das fertige Bild), darunter: „Herunterladen (PNG)“, auf dem Handy zusätzlich „Teilen“ (System-Teilen-Menü mit Datei), wenn `navigator.canShare({files})` es erlaubt.
- Bild 1200 × 630 (passt für Reddit/Discord-Vorschauen), dunkles Design wie die App.

## Inhalt des Bildes
- Solo: Build-Name groß, Primär/Sekundär in Klassenfarben, Rolle, Waffe; 8 Skill-Icons mit Namen darunter (Sprache des Nutzers); Attribute mit Rängen; Weirdness, Full-Bravery-Regeln, Multiplikator; Vorlagencode; unten klein „krvtt.github.io/gw1-ultimate-bravery“ und „Zaishen Ultimate Bravery“.
- Team (4/6/8): je Mitglied eine Zeile mit Name/Held, Klassenkürzeln, 8 kleinen Icons; oben Team-Name und ggf. Destiny/Zaishen-Ort.
- Schnappschuss: wie Solo/Team, aber aus den Vorlagencodes (Klassen, Icons, Attribute).
- Fehlt ein Icon: Kachel in Klassenfarbe mit Initialen (wie in der App).
- Kein QR-Code, keine externen Bibliotheken, keine externen Schriften.

## Technische Anker
- Zeichnen mit `<canvas>` (2D), Ausgabe mit `canvas.toBlob('image/png')`.
- Daten: `current` (`kind` = `solo` | `team` | `snap`), Skills über `VB.byId`, Namen `s.n[st.lang]`, Icons über `SRC[id].icon` (Pfad `icons/<id>.jpg`), Klassenfarben aus den CSS-Variablen (`getComputedStyle(document.documentElement).getPropertyValue('--W')` usw., Kürzel in `AB`).
- 10 Icons sind 64×128 (zwei übereinander) → nur das obere Quadrat zeichnen (`drawImage` mit Quellausschnitt 0,0,64,64).
- Icons vorher laden (`new Image()`, `await img.decode()`); Fehler → Initialen.
- **Unter `file://` ist die Leinwand mit Icons „verunreinigt“** (`toBlob` wirft SecurityError). Dann ohne Icons zeichnen und Hinweis zeigen. Testen über lokalen Webserver (Muster: Ende von `src/smoke_release.js`).
- Download: vorhandene Funktion `download()` arbeitet mit Text – für Blobs `URL.createObjectURL` + `<a download>`.
- Texte in `TX5` (en/de); Dateiname `zaishen-bravery-<name>.png`.

## Akzeptanzkriterien
1. Solo, Team 8 und Schnappschuss erzeugen je ein PNG 1200×630, nicht leer (Pixel-Stichprobe ≠ Hintergrund an Icon-Positionen).
2. Vorschau erscheint in < 1 s auf einem Mittelklasse-Rechner.
3. Download liefert Datei mit sinnvollem Namen; auf dem Handy erscheint „Teilen“ nur, wenn Datei-Teilen unterstützt ist.
4. Unter `file://` kein Absturz: Bild ohne Icons + Hinweis.
5. 390 px breit: Dialog passt ohne seitliches Scrollen.
6. Neuer Test `src/smoke_export.js` (lokaler Webserver), alle bestehenden Tests grün.

## Nicht Teil der Aufgabe
Hochladen zu Imgur/Reddit, eigene Bildgrößen, Animation.

# Projektregeln — All In One Website

## Pflicht-Skills: Automatische Aktivierung

Die folgenden Skills werden **automatisch** ausgeführt. Kein User-Prompt nötig.

---

### Vor jeder Implementierung → `/validate-requirements`

**Trigger:** Wenn der User eine neue Funktion, ein Feature oder eine Änderung anfordert — BEVOR Code geschrieben wird.

Ausnahmen: Reine Tippfehler-Korrekturen, Umbenennung einzelner Variablen, minimale Textänderungen.

---

### Nach jeder Code-Änderung → `/security-check` + `/best-practices` + `/clean-code`

**Trigger:** Direkt nachdem Code geschrieben oder geändert wurde (Write, Edit, Bash mit Codeänderung).

Reihenfolge: security-check → best-practices → clean-code

Wenn `/security-check` BLOCK zurückgibt: **Stoppe sofort.** Behebe die Kritischen Befunde, bevor best-practices oder clean-code ausgeführt werden.

---

### Nach abgeschlossener Implementierung → `/verify-implementation`

**Trigger:** Wenn eine Implementierungsaufgabe als abgeschlossen gilt — bevor dem User "fertig" gemeldet wird.

Wenn `/verify-implementation` UNVOLLSTÄNDIG oder FEHLERHAFT zurückgibt: Behebe die identifizierten Lücken, melde nicht fertig.

---

## Projektstack

- **Frontend:** Vanilla JS, HTML, CSS (teilweise React-Komponenten)
- **Backend:** Node.js / Express
- **Datenbank:** PostgreSQL
- **Auth:** Eigene Session/Login-Logik
- **Riot API:** Konfiguration in `riot-api-config.js` (nicht ins Repo!)

## Sensible Dateien (nie ins Repo)

- `riot-api-config.js` — API-Keys für Riot Games
- `.env` — Umgebungsvariablen
- `*.local.json` — lokale Konfiguration
- Datenbankpasswörter

Diese sind in `.gitignore` definiert — bei jeder Änderung prüfen ob neue sensible Dateien entstanden sind.

## Commit-Konvention

```
feat: kurze Beschreibung
fix: kurze Beschreibung
refactor: kurze Beschreibung
```

Keine Co-Author Attribution in Commits.

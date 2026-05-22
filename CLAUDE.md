# Projektregeln — All In One Website

@.claude/CODEMAP.md

## ⛔ ZWINGENDE PFLICHT-PIPELINE — auch in NEUEN Chats

> Diese Pipeline läuft AUTOMATISCH bei jeder nicht-trivialen Aufgabe.
> Sie gilt OHNE Erinnerung durch den User. Sie gilt in JEDEM Chat ab dem ersten Prompt.
> Die Hook-Reminder im Terminal sind eine Pflicht-Signalisierung — kein Vorschlag.

**Vollständige Pipeline — alle 11 Skills in fester Reihenfolge:**

```
PHASE 0 — KONTEXT-HYGIENE (bedingt — nur bei vollem Kontext oder neuer Aufgabe in langer Session)
  [–] /context-manager        → Kontext analysieren, Relevantes isolieren, Rauschen markieren
       └─ ÜBERSPRINGEN wenn:  frische Session (< 3 Austausche) ODER TRIVIAL-Prompt

PHASE 1 — ANALYSE (vor dem ersten Code)
  [0] /prompt-refine          → Typ/Komplexität/Modell klassifizieren
       └─ TRIVIAL/QUESTION?   → direkt erledigen, Pipeline-Ende
  [1] /plausibility-check     → Dateipfade, Architektur, Abhängigkeiten prüfen
  [2] /validate-requirements  → Klarheit, Sinnhaftigkeit, Scope, Risiko prüfen
       └─ KLÄREN/AUFTEILEN?  → erst User-Antwort abwarten, dann weiter
  [3] /task-breakdown         → Anforderung in atomare Tasks zerlegen

PHASE 2 — IMPLEMENTIERUNG
  Tasks #1 … #N der Reihe nach (oder parallel wenn möglich) umsetzen

PHASE 3 — QUALITÄTS-GATES (nach JEDER Code-Änderung, je als Fix-Loop)
  [4] /security-check         → OWASP Top 10, Secrets, Injection
       └─ Findings?           → sofort beheben → erneut prüfen → bis PASS
  [5] /dsgvo-check            → DSGVO/GDPR, PII, Betroffenenrechte (Pipeline-Modus)
       └─ Findings?           → sofort beheben → erneut prüfen → bis PASS
  [6] /best-practices         → API, DB, Frontend — Muster und Konventionen
       └─ Findings?           → sofort beheben → erneut prüfen → bis PASS
  [7] /clean-code             → Benennung, Funktionsgröße, Nesting, Duplikate
       └─ Findings?           → sofort beheben → erneut prüfen → bis CLEAN

PHASE 4 — ABSCHLUSS (einmalig, vor Fertig-Meldung)
  [8] /verify-implementation  → Anforderung vs. Umsetzung vollständig prüfen
       └─ Lücken?             → sofort schließen → erneut prüfen → bis VOLLSTÄNDIG
  [9] /update-codemap         → CODEMAP.md einmalig synchronisieren
```

**Wenn du diese Pipeline überspringst, hast du gegen die Projekt-Regeln verstoßen.**

---

### Skill-Ausführung — Visuelle Darstellung

Jeder Skill zeigt beim Start und Abschluss einen sichtbaren Block im Chat:

```
╔══════════════════════════════════════════╗
║  🔍  /skill-name  läuft...              ║
╚══════════════════════════════════════════╝
```

```
╔══════════════════════════════════════════╗
║  ✅  /skill-name  abgeschlossen         ║
╚══════════════════════════════════════════╝
```

---

### REGEL –1 — `/context-manager` (bedingt, vor allem anderen)

**Wann:** Bedingt — läuft **vor** `/prompt-refine`, wenn mindestens eine der folgenden Bedingungen zutrifft:
- Session hat bereits ≥ 3 Tool-Austausche (Kontext wächst)
- User startet eine neue, unabhängige Aufgabe nach bereits abgeschlossener Arbeit
- Expliziter Aufruf: `/context-manager`

**Überspringen wenn:** Erste Nachricht in einer frischen Session oder Prompt wird als TRIVIAL klassifiziert.

**Was passiert:** Lade `.claude/skills/context-manager.md`. Inventarisiere aktiven vs. passiven Kontext, bestimme relevante Dateien (Kern + Abhängigkeiten), extrahiere aktive Constraints, markiere Rauschen. Gib Kontext-Status aus (FRISCH / GEORDNET / VOLL / KRITISCH). Bei KRITISCH: Kompakt-Digest ausgeben + `/compact` empfehlen.

---

### REGEL 0 — `/prompt-refine` (immer zuerst)

**Wann:** Allererster Schritt — bei jedem nicht-leeren User-Prompt, immer.

**Was passiert:** Lade `.claude/skills/prompt-refine.md`. Klassifiziere Typ (TRIVIAL / QUESTION / CODING_SIMPLE / CODING_COMPLEX / MAINTENANCE), Komplexität (XS–L) und empfehle Modell (Haiku / Sonnet). Forme den Roh-Prompt in einen strukturierten Agent-Prompt um.

Bei TRIVIAL oder QUESTION: direkt erledigen, Pipeline-Ende — keine weiteren Skills.

---

### REGEL 1 — `/plausibility-check` (nach prompt-refine)

**Wann:** Vor jeder nicht-trivialen Aufgabe — bevor irgendetwas implementiert wird.

**Was passiert:** Lade `.claude/skills/plausibility-check.md`. Schnellcheck (60 Sekunden): Existieren die Dateien? Passt der Ansatz zum Stack? Sind Abhängigkeiten vorhanden?

---

### REGEL 2 — `/validate-requirements` (nach plausibility-check)

**Wann:** Jede nicht-triviale Aufgabe — direkt nach `/plausibility-check`, vor dem Task-Plan.

**Was passiert:** Lade `.claude/skills/validate-requirements.md`. Prüfe 5 Dimensionen: Klarheit, Sinnhaftigkeit, Scope, Abhängigkeiten, Risiko. Empfehle: UMSETZEN / KLÄREN / AUFTEILEN / ALTERNATIVER ANSATZ.

Bei KLÄREN: stelle genau eine gezielte Frage und warte auf Antwort.

---

### REGEL 3 — `/task-breakdown` (nach validate-requirements)

**Wann:** Jede nicht-triviale Aufgabe — direkt nach `/validate-requirements`, vor dem ersten Code.

**Was passiert:** Lade `.claude/skills/task-breakdown.md`. Zerlege in atomare Tasks (je ≤ M = <1h), erkenne Abhängigkeiten und Parallelisierbarkeit, lege Reihenfolge fest.

---

### REGEL 4 — Qualitäts-Gates nach JEDER Code-Änderung

**Wann:** Unmittelbar nach jedem Write, Edit oder Bash-Befehl der Code verändert.

**Prinzip: Jeder Check läuft in einer Fix-Loop bis er PASS ist.**

```
Für jeden Check gilt:
  1. Check ausführen
  2. Findings gefunden?
     JA  → alle Findings sofort im Code beheben → zurück zu 1
     NEIN → weiter zum nächsten Check
```

Reihenfolge:

1. Skill `/security-check` laden und ausführen
   - BLOCK oder WARN gefunden → Findings sofort beheben → `/security-check` erneut ausführen → wiederholen bis PASS
2. Skill `/dsgvo-check` laden und ausführen (Pipeline-Modus: nur geänderte Dateien)
   - BLOCK oder WARN gefunden → Findings sofort beheben → `/dsgvo-check` erneut ausführen → wiederholen bis PASS
3. Skill `/best-practices` laden und ausführen
   - NEEDS_WORK → Verstöße sofort beheben → `/best-practices` erneut ausführen → wiederholen bis PASS
4. Skill `/clean-code` laden und ausführen
   - NEEDS_REFACTOR → Findings sofort beheben → `/clean-code` erneut ausführen → wiederholen bis CLEAN

**Kein Check gilt als abgeschlossen bevor er PASS/CLEAN zurückgibt.**
**Der User muss dafür nichts erneut aufrufen — das läuft vollautomatisch.**

---

### REGEL 5 — Abschluss: `/verify-implementation` → `/update-codemap`

**Wann:** Wenn alle Tasks implementiert und die Qualitäts-Gates bestanden sind — VOR der Abschlussmeldung an den User.

**Was passiert:**
1. Skill `/verify-implementation` laden und ausführen — prüft Anforderung vs. Umsetzung vollständig.
   - UNVOLLSTÄNDIG oder FEHLERHAFT → Lücken sofort schließen → `/verify-implementation` erneut ausführen → wiederholen bis VOLLSTÄNDIG.
2. Erst wenn VOLLSTÄNDIG: Skill `/update-codemap` laden und ausführen — synchronisiert CODEMAP.md einmalig.

`/update-codemap` läuft **nur einmal am Ende** — nicht nach jeder Einzel-Änderung.

---

### Skills laden

Die Skill-Dateien liegen in `.claude/skills/`. Inhalt vor Ausführung lesen:

| Skill | Datei | Phase |
|---|---|---|
| `/context-manager` | `.claude/skills/context-manager.md` | Kontext [–] (bedingt) |
| `/prompt-refine` | `.claude/skills/prompt-refine.md` | Analyse [0] |
| `/plausibility-check` | `.claude/skills/plausibility-check.md` | Analyse [1] |
| `/validate-requirements` | `.claude/skills/validate-requirements.md` | Analyse [2] |
| `/task-breakdown` | `.claude/skills/task-breakdown.md` | Analyse [3] |
| `/security-check` | `.claude/skills/security-check.md` | Qualität [4] |
| `/dsgvo-check` | `.claude/skills/dsgvo-check.md` | Qualität [5] |
| `/best-practices` | `.claude/skills/best-practices.md` | Qualität [6] |
| `/clean-code` | `.claude/skills/clean-code.md` | Qualität [7] |
| `/verify-implementation` | `.claude/skills/verify-implementation.md` | Abschluss [8] |
| `/update-codemap` | `.claude/skills/update-codemap.md` | Abschluss [9] |

---

## Projektstack

- **Frontend:** Vanilla JSX + React 18 UMD + Babel Standalone (kein Build-Step)
- **Backend:** Bun + Hono 4 (TypeScript), Port 3001
- **Datenbank:** PostgreSQL — Zugriff nur via `server/db.ts`
- **Auth:** JWT + bcryptjs (server), sessionStorage (client)
- **Riot API:** `riot-api-config.js` (nicht ins Repo!) — Dev-Key läuft täglich ab

## Datei-Struktur (Kurzreferenz)

```
shared/          → core.jsx, tweaks-panel.jsx
login/           → login.jsx
dashboard/       → dashboard.jsx
about-me/        → about-me.jsx, about_me.html
ai-chat/         → ai-chat.jsx
get-gapped/      → gapped.html, gapped-app.jsx, gapped-riot.jsx, ...
server/          → index.ts, db.ts, routes/auth.ts, routes/fitness.ts, routes/app-data.ts
```

Vollständige Datei-Übersicht: siehe CODEMAP.md (oben eingebunden).

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

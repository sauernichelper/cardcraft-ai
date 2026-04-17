Kurzbeschreibung
Eine Web-App, die aus Vorlesungsfolien, PDFs oder eigenen Notizen automatisch lernbare Karteikarten erstellt und diese mit Spaced Repetition abfragt. Im Prinzip eine Mischung aus Anki, PDF-Analyse und KI-Lernassistent.
Kernidee
Du lädst Lernmaterial hoch, die App erkennt die wichtigsten Inhalte und macht daraus:
klassische Frage-Antwort-Karten
Definitionskarten
Verständnisfragen
Wiederholungspläne nach Lernstand
Zusätzlich kann die KI schwache Themen erkennen und gezielt neue Karten oder Zusammenfassungen erzeugen.
MVP
Für eine erste Version würde ich nur diese Funktionen bauen:
PDF oder Text hochladen
Text in Abschnitte zerlegen
KI erstellt daraus Karteikarten
Karten speichern, bearbeiten, löschen
Lernmodus mit Wusste ich / Wusste ich nicht
Einfacher Spaced-Repetition-Algorithmus
Damit hast du schon ein echtes nutzbares Produkt.
Spätere Features
Danach könntest du erweitern um:
Import/Export für Anki
Tags pro Fach und Vorlesung
“Nur klausurrelevante Karten”
Zusammenfassungen pro Kapitel
Erkennung von schlechten oder doppelten Karten
Statistiken zu Lernfortschritt
Bild-/Diagramm-bezogene Karten
Lokales LLM statt Cloud-API
Technische Bausteine
Ein sinnvoller Stack wäre:
Frontend: Next.js
Backend: Next.js API oder Express/Nest
DB: PostgreSQL
ORM: Prisma
Auth: NextAuth oder Clerk
Dateiuploads: local/S3
KI: OpenAI API oder lokal mit Ollama
PDF Parsing: pdf-parse / PyMuPDF je nach Backend
Logik der App
Der Flow wäre ungefähr so:
Nutzer lädt PDF hoch
Text wird extrahiert
Text wird in sinnvolle Lernabschnitte zerlegt
KI bekommt einen Prompt wie:
„Erstelle präzise, prüfungsrelevante Karteikarten nur aus diesem Abschnitt“
Karten landen in Review
Nutzer prüft und verbessert
Karten gehen ins Deck
Lernalgorithmus plant Wiederholungen
Schwierige Stellen
Die eigentliche Schwierigkeit ist nicht das UI, sondern:
gute Textextraktion aus PDFs
saubere Prompts
keine halluzinierten Karten
sinnvolle Chunking-Strategie
gute Lernlogik statt nur stumpfes Abfragen
Warum das Projekt gut ist
Das Projekt zeigt, dass du:
KI praktisch einbinden kannst
ein echtes Problem löst
produktorientiert denken kannst
mit Uploads, Datenbank, API und UI umgehen kannst
nicht nur ein Demo-Projekt baust, sondern ein Werkzeug
Gute erste Version
Ich würde es so klein schneiden:
Version 1
Text einfügen
KI erzeugt Karten
Karten manuell bestätigen
Lernmodus
Version 2
PDF Upload
Decks und Tags
Spaced Repetition
Version 3
Anki Export
Statistiken
bessere KI-Qualitätskontrolle
Eine mögliche Projektformulierung
Ein KI-gestütztes Lernsystem, das Vorlesungsmaterial automatisch in qualitativ hochwertige Karteikarten umwandelt und mithilfe von Spaced Repetition die langfristige Wiederholung optimiert.
Bitte verwende zum coden AUSSCHLIEßLICH CODEX, schreibe KEINEN code selbst. Du bist der Orchestrator, der Projektmanager, du lenkst codex in die richtige Richtung!
gerne auch zwischendurch Committen, dafür kannst du gerne ein neues repository für das Projekt erstellen, einen GitHub token hast du ja, damit ich nachvollziehen kann was wann wie passiert ist.
Als Projektmanager kümmere dich bitte um alles, den scope des Projektes hast du ja. arbeite durch bis du fertig bist, dann melde dich bei mir!

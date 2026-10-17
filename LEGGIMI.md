# 🐾 Animali di casa — come metterla online

## 1. Il foglio Google (5 minuti, dal PC)
1. Crea un nuovo foglio Google e chiamalo **Animali di casa**.
2. Menu **Estensioni → Apps Script**. Cancella tutto e incolla il contenuto di **Codice.gs**.
3. In alto cambia `CODICE_FAMIGLIA = 'cambiami'` con un codice vostro (es. `jenny-junny-24`). Salva.
4. Scegli la funzione **setup** dal menu a tendina e premi **Esegui** → autorizza col tuo account.
   Si creano i fogli **Animali** (con Jenny e Junny già dentro) e **Registro**, più la cartella Drive "Animali di casa - Foto".
5. **Esegui il deployment → Nuovo deployment → App web**
   - Esegui come: **Me**
   - Chi può accedere: **Chiunque**
   - Copia l'URL che finisce con **/exec**.

> "Chiunque" serve solo perché l'app possa parlare col foglio: senza il codice famiglia lo script non restituisce niente. Il foglio e le foto restano privati sul tuo Drive.

## 2. L'app su GitHub Pages (come Mezzi e Palestra)
1. Apri **index.html**, riga `const API_URL = 'INCOLLA_QUI_URL_APPS_SCRIPT';` → incolla lì l'URL /exec.
2. Crea il repository **Animali** e carica: `index.html`, `manifest.json`, `sw.js`, `icon.svg`, `icon-192.png`, `icon-512.png`.
3. Settings → Pages → branch `main` → Save.
   Il link sarà: `https://fedethe7-dot.github.io/Animali/`

## 3. Il link per il gruppo WhatsApp
- **Più sicuro:** manda il link normale e dite a voce il codice famiglia. Al primo accesso ognuno lo scrive e sceglie chi è (Federico / Mamma / Sorella).
- **Più comodo:** `https://fedethe7-dot.github.io/Animali/#k=IL-VOSTRO-CODICE` → entra direttamente, bisogna solo scegliere chi si è. Ma chi riceve il link inoltrato entra anche lui.

Dal telefono: menu del browser → **Aggiungi a schermata Home** → diventa un'app con l'icona.

## Se cambi qualcosa nello script
Esegui il deployment → **Gestisci deployment → ✏️ → Versione: Nuova** → Esegui il deployment. Così l'URL resta lo stesso.

## Cosa c'è dentro
- Home a finestrelle: foto, età, data di nascita, ultimo peso, badge se c'è qualcosa in scadenza.
- Scheda animale: età reale, età "umana" (tabella veterinaria per taglia, non il vecchio ×7), compleanno, andamento peso, scadenze, registro, dati del veterinario con chiamata diretta.
- Registra: visita, vaccino, antiparassitario, sverminazione, farmaco, analisi, peso, toelettatura, intervento… anche per entrambi i cani insieme, con prossima scadenza proposta (vaccino 1 anno, antiparassitario 1 mese, sverminazione 3 mesi) e foto di ricette/referti.
- Ogni riga del foglio dice chi l'ha inserita. Puoi correggere anche direttamente dal foglio: l'app legge sempre lì.

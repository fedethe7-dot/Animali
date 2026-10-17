/**
 * ANIMALI DI CASA — backend Google Apps Script
 * Collega l'app al foglio Google "Animali di casa".
 *
 * 1) Cambia CODICE_FAMIGLIA qui sotto (lo darai a mamma e sorella).
 * 2) Esegui una volta la funzione "setup".
 * 3) Distribuisci come App web: Esegui come "Me", Accesso "Chiunque".
 */

const CODICE_FAMIGLIA = 'cambiami';          // <-- cambialo!
const NOME_CARTELLA_FOTO = 'Animali di casa - Foto';

const CAMPI_ANIMALI = [
  ['id', 'ID'], ['nome', 'Nome'], ['specie', 'Specie'], ['razza', 'Razza'],
  ['taglia', 'Taglia'], ['sesso', 'Sesso'], ['nascita', 'Data di nascita', 'd'],
  ['colore', 'Colore'], ['microchip', 'Microchip'], ['sterilizzato', 'Sterilizzato'],
  ['veterinario', 'Veterinario'], ['telVet', 'Tel. veterinario'],
  ['foto', 'Foto ID'], ['note', 'Note'], ['archiviato', 'Archiviato'],
  ['aggiornato', 'Aggiornato', 'dt']
];

const CAMPI_REGISTRO = [
  ['id', 'ID'], ['animaleId', 'Animale ID'], ['animale', 'Animale'],
  ['data', 'Data', 'd'], ['tipo', 'Tipo'], ['descrizione', 'Descrizione'],
  ['peso', 'Peso (kg)', 'n'], ['costo', 'Costo (€)', 'n'],
  ['scadenza', 'Prossima scadenza', 'd'], ['chi', 'Inserito da'],
  ['foto', 'Foto ID'], ['note', 'Note'], ['creato', 'Creato', 'dt']
];

/* ---------- SETUP (da eseguire una volta) ---------- */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const animali = preparaFoglio_(ss, 'Animali', CAMPI_ANIMALI, '#f4a261');
  preparaFoglio_(ss, 'Registro', CAMPI_REGISTRO, '#2a9d8f');

  if (animali.getLastRow() < 2) {
    salva_('Animali', CAMPI_ANIMALI, { nome: 'Jenny', specie: 'Cane', taglia: 'Media', archiviato: 'No' });
    salva_('Animali', CAMPI_ANIMALI, { nome: 'Junny', specie: 'Cane', taglia: 'Media', archiviato: 'No' });
  }
  cartellaFoto_();
  const def = ss.getSheetByName('Foglio1') || ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 2) ss.deleteSheet(def);
  Logger.log('Fatto! Fogli pronti e cartella foto creata su Drive.');
}

function preparaFoglio_(ss, nome, campi, colore) {
  let sh = ss.getSheetByName(nome);
  if (!sh) sh = ss.insertSheet(nome);
  if (sh.getLastRow() === 0) {
    const h = campi.map(c => c[1]);
    sh.getRange(1, 1, 1, h.length).setValues([h])
      .setFontWeight('bold').setBackground(colore).setFontColor('#ffffff');
    sh.setFrozenRows(1);
    campi.forEach((c, i) => {
      if (c[2] === 'd') sh.getRange(2, i + 1, 999, 1).setNumberFormat('dd/MM/yyyy');
      if (c[2] === 'dt') sh.getRange(2, i + 1, 999, 1).setNumberFormat('dd/MM/yyyy HH:mm');
    });
    sh.autoResizeColumns(1, h.length);
  }
  return sh;
}

function cartellaFoto_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('CARTELLA_FOTO');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder(NOME_CARTELLA_FOTO);
  p.setProperty('CARTELLA_FOTO', f.getId());
  return f;
}

/* ---------- API ---------- */
function doGet(e) {
  return gestisci_(e.parameter || {});
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) {}
  return gestisci_(body);
}

function gestisci_(r) {
  try {
    if (String(r.k || '') !== CODICE_FAMIGLIA) return json_({ ok: false, errore: 'codice' });
    switch (r.action) {
      case 'dati':
        return json_({ ok: true, animali: leggi_('Animali', CAMPI_ANIMALI), registro: leggi_('Registro', CAMPI_REGISTRO) });
      case 'foto':
        return json_({ ok: true, b64: Utilities.base64Encode(DriveApp.getFileById(r.id).getBlob().getBytes()) });
      default:
        return scrittura_(r);
    }
  } catch (err) {
    return json_({ ok: false, errore: String(err.message || err) });
  }
}

function scrittura_(r) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    switch (r.action) {
      case 'salvaAnimale': {
        const a = r.animale;
        a.aggiornato = new Date();
        if (!a.archiviato) a.archiviato = 'No';
        return json_({ ok: true, id: salva_('Animali', CAMPI_ANIMALI, a) });
      }
      case 'archiviaAnimale':
        return json_({ ok: true, id: salva_('Animali', CAMPI_ANIMALI, { id: r.id, archiviato: 'Sì', aggiornato: new Date() }, true) });
      case 'salvaEventi': {
        const ids = r.eventi.map(ev => {
          if (!ev.id) ev.creato = new Date();
          return salva_('Registro', CAMPI_REGISTRO, ev);
        });
        return json_({ ok: true, ids: ids });
      }
      case 'eliminaEvento':
        elimina_('Registro', r.id);
        return json_({ ok: true });
      case 'caricaFoto': {
        const blob = Utilities.newBlob(Utilities.base64Decode(r.b64), 'image/jpeg', (r.nome || 'foto') + '_' + Date.now() + '.jpg');
        const f = cartellaFoto_().createFile(blob);
        return json_({ ok: true, id: f.getId() });
      }
      default:
        return json_({ ok: false, errore: 'azione sconosciuta' });
    }
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Foglio ---------- */
function foglio_(nome) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nome);
  if (!sh) throw new Error('Manca il foglio "' + nome + '": esegui setup');
  return sh;
}

function leggi_(nome, campi) {
  const v = foglio_(nome).getDataRange().getValues();
  const h = v.shift().map(String);
  const tz = Session.getScriptTimeZone();
  const iId = h.indexOf('ID');
  return v.filter(r => r[iId] !== '').map(r => {
    const o = {};
    campi.forEach(c => {
      const i = h.indexOf(c[1]);
      let x = i >= 0 ? r[i] : '';
      if (x instanceof Date) x = Utilities.formatDate(x, tz, c[2] === 'dt' ? "yyyy-MM-dd'T'HH:mm" : 'yyyy-MM-dd');
      o[c[0]] = x;
    });
    return o;
  });
}

function versoCella_(x, tipo) {
  if (x === undefined || x === null || x === '') return '';
  if (tipo === 'd' && typeof x === 'string') {
    const m = x.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : x;
  }
  if (tipo === 'n') {
    const n = parseFloat(String(x).replace(',', '.'));
    return isNaN(n) ? '' : n;
  }
  return x;
}

/** Inserisce o aggiorna una riga per ID. parziale = tocca solo i campi passati. */
function salva_(nome, campi, obj, parziale) {
  const sh = foglio_(nome);
  const v = sh.getDataRange().getValues();
  const h = v[0].map(String);
  const iId = h.indexOf('ID');
  let riga = -1;
  if (obj.id) {
    for (let i = 1; i < v.length; i++) if (String(v[i][iId]) === String(obj.id)) { riga = i; break; }
  } else {
    obj.id = Utilities.getUuid().slice(0, 8);
  }
  const vecchia = riga > 0 ? v[riga] : null;
  const nuova = h.map((head, ci) => {
    const c = campi.find(x => x[1] === head);
    if (!c || (parziale && !(c[0] in obj))) return vecchia ? vecchia[ci] : '';
    if (!(c[0] in obj) && vecchia) return vecchia[ci];
    return versoCella_(obj[c[0]], c[2]);
  });
  if (riga > 0) sh.getRange(riga + 1, 1, 1, nuova.length).setValues([nuova]);
  else sh.appendRow(nuova);
  return obj.id;
}

function elimina_(nome, id) {
  const sh = foglio_(nome);
  const v = sh.getDataRange().getValues();
  const iId = v[0].map(String).indexOf('ID');
  for (let i = v.length - 1; i >= 1; i--) if (String(v[i][iId]) === String(id)) sh.deleteRow(i + 1);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

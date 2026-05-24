/**
 * SISTEM MANAJEMEN ABSENSI MAHASANTRI - GOOGLE APPS SCRIPT BACKEND
 * 
 * CARA DEPLOY:
 * 1. Buka Google Sheets baru.
 * 2. Buat sheet/tab dengan nama berikut:
 *    - USERS
 *    - MAHASANTRI
 *    - PENGAJAR
 *    - MATAKULIAH
 *    - KELAS
 *    - JADWAL
 *    - ABSENSI
 *    - NILAI
 * 3. Isi header (baris 1) di Sheet masing-masing sebagai berikut:
 *    - USERS: id, nama, email, password, role, status
 *      (Lalu tambahkan 1 baris untuk admin: id: 1, nama: Admin, email: admin@admin.com, password: password123, role: admin, status: aktif)
 *    - MAHASANTRI: id, nim, nama, jenis_kelamin, program, kelas, status
 *    - PENGAJAR: id, nama, jabatan, status
 *    - MATAKULIAH: id, kode, nama_mk, program, kelas, pengajar
 *    - KELAS: id, program, nama_kelas
 *    - JADWAL: id, hari, jam_ke, jam_mulai, jam_berakhir, program, kelas, nama_mk, pengajar
 *    - ABSENSI: id, tanggal, jam_ke, program, kelas, mahasiswa_id, status, pembahasan, timestamp
 *    - NILAI: id, mahasiswa_id, program, kelas, nama_mk, presensi, tugas, uts, uas, total, tahun_akademik, semester
 * 4. Klik menu Extensions (Ekstensi) > Apps Script.
 * 5. Hapus script bawaan, lalu copy-paste semua kode di bawah ini.
 * 6. Klik tombol Deploy > New deployment (Penerapan baru).
 * 7. Pilih tipe "Web app".
 * 8. Execute as: "Me" (Diri Anda).
 * 9. Who has access: "Anyone" (Siapa saja).
 * 10. Klik Deploy, berikan akses (Authorize), lalu copy "Web app URL".
 * 11. Masukkan URL tersebut ke .env frontend project Anda (VITE_APPS_SCRIPT_URL).
 */

// GANTI DENGAN ID SPREADSHEET ANDA (Ambil dari URL Spreadsheet)
// Contoh URL: https://docs.google.com/spreadsheets/d/1XyZ_abcdefghijk/edit
// ID-nya adalah: 1XyZ_abcdefghijk
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";

function getSpreadsheet() {
  if (SPREADSHEET_ID === "YOUR_SPREADSHEET_ID_HERE") {
    // Jika belum diganti ID-nya, ambil spreadsheet aktif (jika script di-bind dengan sheet)
    return SpreadsheetApp.getActiveSpreadsheet();
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

const SHEET_SCHEMAS = {
  'USERS': ['id', 'nama', 'email', 'password', 'role', 'status'],
  'MAHASANTRI': ['id', 'nim', 'nama', 'jenis_kelamin', 'kelas', 'semester', 'status'],
  'PENGAJAR': ['id', 'nama', 'mapel', 'status'],
  'MATAKULIAH': ['id', 'kode', 'nama_mk', 'program', 'kelas', 'pengajar'],
  'KELAS': ['id', 'program', 'nama_kelas'],
  'JADWAL': ['id', 'hari', 'jam_ke', 'jam_mulai', 'jam_berakhir', 'program', 'kelas', 'nama_mk', 'pengajar'],
  'ABSENSI': ['id', 'tanggal', 'jam_ke', 'program', 'kelas', 'nama_mk', 'mahasiswa_id', 'status', 'pembahasan', 'timestamp'],
  'NILAI': ['id', 'mahasiswa_id', 'program', 'kelas', 'nama_mk', 'presensi', 'tugas', 'uts', 'uas', 'total', 'tahun_akademik', 'semester']
};

function getSheetCaseInsensitive(ss, name) {
  const sheets = ss.getSheets();
  const targetLower = name.toLowerCase().trim();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().toLowerCase().trim() === targetLower) {
      return sheets[i];
    }
  }
  return null;
}

function cleanupEmptyRows(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  const headers = data[0];
  const normalizedHeaders = headers.map(h => h ? h.toString().toLowerCase().trim() : '');
  const idIndex = normalizedHeaders.indexOf('id');
  
  const rangesToDelete = []; // Array of {start: rowNum, count: num}
  let currentStart = -1;
  let currentCount = 0;
  
  for (let i = data.length - 1; i >= 1; i--) {
    let isRowEmpty = true;
    for (let j = 0; j < headers.length; j++) {
      if (j !== idIndex) {
        const val = data[i][j];
        if (val !== "" && val !== null && val !== undefined) {
          isRowEmpty = false;
          break;
        }
      }
    }
    
    if (isRowEmpty) {
      const rowNum = i + 1;
      if (currentStart === -1) {
        currentStart = rowNum;
        currentCount = 1;
      } else if (rowNum === currentStart - 1) {
        currentStart = rowNum;
        currentCount++;
      } else {
        rangesToDelete.push({ start: currentStart, count: currentCount });
        currentStart = rowNum;
        currentCount = 1;
      }
    } else {
      if (currentStart !== -1) {
        rangesToDelete.push({ start: currentStart, count: currentCount });
        currentStart = -1;
        currentCount = 0;
      }
    }
  }
  
  if (currentStart !== -1) {
    rangesToDelete.push({ start: currentStart, count: currentCount });
  }
  
  if (rangesToDelete.length > 0) {
    // Delete ranges from bottom to top to preserve correct row indexing
    rangesToDelete.forEach(range => {
      sheet.deleteRows(range.start, range.count);
    });
    SpreadsheetApp.flush();
  }
}

function ensureSheetHeaders(sheetName) {
  const ss = getSpreadsheet();
  let sheet = getSheetCaseInsensitive(ss, sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  const expectedCols = SHEET_SCHEMAS[sheetName] || [];
  if (expectedCols.length === 0) return sheet;
  
  let lastCol = sheet.getLastColumn();
  let headers = [];
  if (lastCol > 0) {
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }
  
  let normalizedHeaders = headers.map(h => h ? h.toString().toLowerCase().trim() : '');
  let added = false;
  
  expectedCols.forEach(col => {
    let index = normalizedHeaders.indexOf(col.toLowerCase().trim());
    if (index === -1) {
      let currentLastCol = sheet.getLastColumn();
      if (currentLastCol === 0) {
        sheet.getRange(1, 1).setValue(col);
      } else {
        sheet.getRange(1, currentLastCol + 1).setValue(col);
      }
      added = true;
    }
  });
  
  if (added) {
    SpreadsheetApp.flush();
  }
  
  // Clean up any empty/ghost rows containing only automatic ID or blank entries
  cleanupEmptyRows(sheet);
  
  return sheet;
}

// ------------------- RESPONSE HELPER -------------------
function successResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}

// ------------------- HANDLE GET REQUEST -------------------
function doGet(e) {
  const action = e.parameter.action;
  if (!action) return errorResponse("Action parameter is required");

  try {
    switch (action) {
      case 'getMahasantri':
        return successResponse(getData('MAHASANTRI'));
      case 'getPengajar':
        return successResponse(getData('PENGAJAR'));
      case 'getMatakuliah':
        return successResponse(getData('MATAKULIAH'));
      case 'getKelas':
        return successResponse(getData('KELAS'));
      case 'getJadwal':
        return successResponse(getData('JADWAL'));
      case 'getAbsensi':
        return successResponse(getData('ABSENSI'));
      case 'getNilai':
        return successResponse(getData('NILAI'));
      default:
        return errorResponse("Unknown action");
    }
  } catch (error) {
    return errorResponse(error.toString());
  }
}

// ------------------- HANDLE POST REQUEST -------------------
function doPost(e) {
  // CORS Preflight handling is usually automatic in Apps script if configured as Anyone.
  // But due to Apps Script nature, we accept JSON payload as string.
  let body = {};
  
  if (e.postData && e.postData.contents) {
    try {
      body = JSON.parse(e.postData.contents);
    } catch(err) {
      return errorResponse("Invalid JSON payload");
    }
  } else {
    return errorResponse("No payload provided");
  }

  const action = body.action || e.parameter.action;
  
  if (!action) {
    return errorResponse("Action not specified. Received body: " + JSON.stringify(body) + ", Parameter: " + JSON.stringify(e.parameter));
  }
  
  try {
    switch (action) {
      case 'login':
        return login(body.email, body.password);
      case 'addMahasantri':
        return addData('MAHASANTRI', body.data);
      case 'updateMahasantri':
        return updateData('MAHASANTRI', body.id, body.data);
      case 'deleteMahasantri':
        return deleteData('MAHASANTRI', body.id);
        
      case 'addPengajar':
        return addData('PENGAJAR', body.data);
      case 'updatePengajar':
        return updateData('PENGAJAR', body.id, body.data);
      case 'deletePengajar':
        return deleteData('PENGAJAR', body.id);
        
      case 'addMatakuliah':
        return addData('MATAKULIAH', body.data);
      case 'updateMatakuliah':
        return updateData('MATAKULIAH', body.id, body.data);
      case 'deleteMatakuliah':
        return deleteData('MATAKULIAH', body.id);
        
      case 'addKelas':
        return addData('KELAS', body.data);
      case 'updateKelas':
        return updateData('KELAS', body.id, body.data);
      case 'deleteKelas':
        return deleteData('KELAS', body.id);
        
      case 'bulkAddMahasantri':
        return bulkAddData('MAHASANTRI', body.data);
      case 'bulkAddPengajar':
        return bulkAddData('PENGAJAR', body.data);
      case 'bulkAddMatakuliah':
        return bulkAddData('MATAKULIAH', body.data);

      case 'addJadwal':
        return addData('JADWAL', body.data);
      case 'updateJadwal':
        return updateData('JADWAL', body.id, body.data);
      case 'deleteJadwal':
        return deleteData('JADWAL', body.id);
        
      case 'saveAbsensi':
        return saveAbsensiBatch(body.data);
      case 'updateAbsensi':
        return updateData('ABSENSI', body.id, body.data);
      case 'deleteAbsensi':
        return deleteData('ABSENSI', body.id);
        
      case 'saveNilai':
        return upsertNilai(body);
        
      default:
        return errorResponse("Unknown POST action");
    }
  } catch (error) {
    return errorResponse(error.toString());
  }
}

// ------------------- CORE FUNCTIONS -------------------

function login(email, password) {
  const users = getData('USERS');
  const checkEmail = email ? email.toString().toLowerCase().trim() : '';
  const checkPassword = password ? password.toString() : '';

  const user = users.find(u => {
    const uEmail = u.email ? u.email.toString().toLowerCase().trim() : '';
    const uPassword = u.password ? u.password.toString() : '';
    return uEmail === checkEmail && uPassword === checkPassword;
  });
  
  if (user) {
    // Remove password from response for security
    delete user.password;
    const status = user.status ? user.status.toString().toLowerCase().trim() : 'aktif';
    if (status !== 'active' && status !== 'aktif') return errorResponse("Account is not active (" + status + ")");
    
    // Dynamically retrieve mahasantri profile details if the role is mahasantri
    if (user.role === 'mahasantri') {
      const mahasantris = getData('MAHASANTRI');
      const mRecord = mahasantris.find(m => 
        m.nama && m.nama.toString().toLowerCase().trim() === user.nama.toString().toLowerCase().trim()
      );
      if (mRecord) {
        user.nim = mRecord.nim ? mRecord.nim.toString() : '';
        user.kelas = mRecord.kelas ? mRecord.kelas.toString() : '';
        user.semester = mRecord.semester ? mRecord.semester.toString() : '';
        
        // Find program from KELAS sheet
        const kelasList = getData('KELAS');
        const kRecord = kelasList.find(k => 
          k.nama_kelas && k.nama_kelas.toString().toLowerCase().trim() === user.kelas.toLowerCase().trim()
        );
        if (kRecord) {
          user.program = kRecord.program ? kRecord.program.toString() : '';
        } else {
          user.program = '';
        }
      }
    }
    
    return successResponse({ user });
  }
  return errorResponse("Invalid email or password");
}

function getData(sheetName) {
  const sheet = ensureSheetHeaders(sheetName);
  const rawData = sheet.getDataRange().getValues();
  if (rawData.length <= 1) return []; // Only headers or empty
  
  const headers = rawData[0].map(h => h ? h.toString().toLowerCase().trim() : '');
  const idIndex = headers.indexOf('id');
  const items = [];
  
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    
    // Check if row is completely empty
    let isRowEmpty = true;
    for (let j = 0; j < row.length; j++) {
      if (row[j] !== "" && row[j] !== null && row[j] !== undefined) {
        isRowEmpty = false;
        break;
      }
    }
    if (isRowEmpty) continue; // Skip completely empty rows
    
    const item = {};
    for (let j = 0; j < headers.length; j++) {
      item[headers[j]] = row[j] !== undefined ? row[j] : null;
    }
    
    // Auto-generate missing IDs for manual sheet entries (only if has actual body content)
    if (idIndex !== -1 && (!item.id || item.id.toString().trim() === '')) {
      const newId = generateId();
      item.id = newId;
      sheet.getRange(i + 1, idIndex + 1).setValue(newId);
    }
    
    items.push(item);
  }
  
  return items;
}

function addData(sheetName, item) {
  const sheet = ensureSheetHeaders(sheetName);
  const headers = sheet.getDataRange().getValues()[0];
  const normalizedHeaders = headers.map(h => h ? h.toString().toLowerCase().trim() : '');
  
  // Create id
  item.id = generateId();
  item.createdAt = new Date().toISOString();
  
  const newRow = [];
  for (let j = 0; j < headers.length; j++) {
    const headerName = normalizedHeaders[j];
    newRow.push(item[headerName] !== undefined ? item[headerName] : "");
  }
  
  sheet.appendRow(newRow);
  return successResponse({ id: item.id, message: "Created successfully" });
}

function bulkAddData(sheetName, items) {
  const sheet = ensureSheetHeaders(sheetName);
  const headers = sheet.getDataRange().getValues()[0];
  const normalizedHeaders = headers.map(h => h ? h.toString().toLowerCase().trim() : '');
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return errorResponse("No data provided");
  }

  const newRows = [];
  const timestamp = new Date().toISOString();
  
  items.forEach(item => {
    item.id = generateId();
    item.createdAt = timestamp;
    
    const row = [];
    for (let j = 0; j < headers.length; j++) {
      const headerName = normalizedHeaders[j];
      row.push(item[headerName] !== undefined ? item[headerName] : "");
    }
    newRows.push(row);
  });
  
  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
  
  return successResponse({ message: `${newRows.length} items created successfully` });
}

function updateData(sheetName, id, updatedItem) {
  const sheet = ensureSheetHeaders(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const normalizedHeaders = headers.map(h => h ? h.toString().toLowerCase().trim() : '');
  const idIndex = normalizedHeaders.indexOf('id');
  
  if (idIndex === -1) return errorResponse("ID column not found in " + sheetName);
  
  for (let i = 1; i < data.length; i++) {
    const rowId = data[i][idIndex];
    if (rowId == id) { 
      for (let j = 0; j < headers.length; j++) {
        const headerName = normalizedHeaders[j];
        if (updatedItem.hasOwnProperty(headerName) && headerName !== 'id') {
          sheet.getRange(i + 1, j + 1).setValue(updatedItem[headerName] !== undefined ? updatedItem[headerName] : "");
        }
      }
      return successResponse({ message: "Updated successfully" });
    }
  }
  return errorResponse("Data not found");
}

function deleteData(sheetName, id) {
  const sheet = ensureSheetHeaders(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const normalizedHeaders = headers.map(h => h ? h.toString().toLowerCase().trim() : '');
  const idIndex = normalizedHeaders.indexOf('id');
  
  if (idIndex === -1) return errorResponse("ID column not found in " + sheetName);
  
  for (let i = 1; i < data.length; i++) {
    const rowId = data[i][idIndex];
    if (rowId == id) {
      sheet.deleteRow(i + 1);
      return successResponse({ message: "Deleted successfully" });
    }
  }
  return errorResponse("Data not found");
}

function saveAbsensiBatch(absensiArr) {
  const sheet = ensureSheetHeaders('ABSENSI');
  const headers = sheet.getDataRange().getValues()[0];
  const normalizedHeaders = headers.map(h => h ? h.toString().toLowerCase().trim() : '');
  
  const newRows = [];
  const timestamp = new Date().toISOString();
  
  absensiArr.forEach(item => {
    item.id = generateId();
    item.timestamp = timestamp;
    
    const row = [];
    for (let j = 0; j < headers.length; j++) {
      const headerName = normalizedHeaders[j];
      row.push(item[headerName] !== undefined ? item[headerName] : "");
    }
    newRows.push(row);
  });
  
  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
  
  return successResponse({ message: "Absensi saved successfully" });
}

function upsertNilai(item) {
  const sheet = ensureSheetHeaders('NILAI');
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return errorResponse("Sheet NILAI is empty or uninitialized");
  
  const headers = data[0];
  const normalizedHeaders = headers.map(h => h ? h.toString().toLowerCase().trim() : '');
  
  const idxMhs = normalizedHeaders.indexOf('mahasiswa_id');
  const idxMk = normalizedHeaders.indexOf('nama_mk');
  const idxKelas = normalizedHeaders.indexOf('kelas');
  
  if (idxMhs === -1 || idxMk === -1 || idxKelas === -1) {
    return errorResponse("Missing required columns in NILAI sheet for upsert matching");
  }
  
  let foundRowIndex = -1;
  // Start from 1 to skip headers
  for (let i = 1; i < data.length; i++) {
    let mhsId = data[i][idxMhs];
    let mk = data[i][idxMk];
    let kelas = data[i][idxKelas];
    
    if (mhsId == item.mahasiswa_id && mk == item.nama_mk && kelas == item.kelas) {
      foundRowIndex = i;
      break;
    }
  }
  
  if (foundRowIndex > -1) {
    // Update existing row
    for (let j = 0; j < headers.length; j++) {
      const headerName = normalizedHeaders[j];
      // update only provided fields except id
      if (item.hasOwnProperty(headerName) && headerName !== 'id') {
        sheet.getRange(foundRowIndex + 1, j + 1).setValue(item[headerName] !== undefined ? item[headerName] : "");
      }
    }
    return successResponse({ message: "Nilai updated successfully" });
  } else {
    // Add new row
    item.id = generateId();
    const newRow = [];
    for (let j = 0; j < headers.length; j++) {
      const headerName = normalizedHeaders[j];
      newRow.push(item[headerName] !== undefined ? item[headerName] : "");
    }
    sheet.appendRow(newRow);
    return successResponse({ id: item.id, message: "Nilai created successfully" });
  }
}

function generateId() {
  return Utilities.getUuid();
}

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
const SPREADSHEET_ID = "1BvRKRLSqp0B1o2dvJeDLXlEeBgyuxSVIYFRaZqSJMaE";

function getSpreadsheet() {
  if (SPREADSHEET_ID === "YOUR_SPREADSHEET_ID_HERE") {
    // Jika belum diganti ID-nya, ambil spreadsheet aktif (jika script di-bind dengan sheet)
    return SpreadsheetApp.getActiveSpreadsheet();
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

const SHEET_SCHEMAS = {
  'USERS': ['id', 'nama', 'username', 'password', 'role', 'status'],
  'MAHASANTRI': ['id', 'nim', 'nama', 'jenis_kelamin', 'kelas', 'semester', 'status'],
  'PENGAJAR': ['id', 'nama', 'mapel', 'status'],
  'MATAKULIAH': ['id', 'kode', 'nama_mk', 'program', 'kelas', 'pengajar'],
  'KELAS': ['id', 'program', 'nama_kelas'],
  'JADWAL': ['id', 'hari', 'jam_ke', 'jam_mulai', 'jam_berakhir', 'program', 'kelas', 'nama_mk', 'pengajar', 'lokasi', 'deskripsi'],
  'ABSENSI': ['id', 'tanggal', 'jam_ke', 'program', 'kelas', 'nama_mk', 'mahasiswa_id', 'status', 'pembahasan', 'timestamp'],
  'ABSENSI_PENGAJAR': ['id', 'pengajar_id', 'tanggal', 'waktu_datang', 'waktu_pulang', 'lokasi_datang', 'lokasi_pulang', 'alasan_pulang_awal', 'alasan_terlambat'],
  'NILAI': ['id', 'nim', 'nama', 'program', 'kelas', 'nama_mk', 'presensi', 'tugas', 'uts', 'uas', 'total', 'tahun_akademik_data', 'semester_data'],
  'PENGUMUMAN': ['id', 'kategori', 'judul', 'tanggal', 'isi_lengkap', 'penting', 'file_path'],
  'DOKUMEN': ['id', 'nama', 'file_path']
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
      case 'getAbsensiPengajar':
        return successResponse(getData('ABSENSI_PENGAJAR'));
      case 'getNilai':
        return successResponse(getData('NILAI'));
      case 'getPengumuman':
        return successResponse(getData('PENGUMUMAN'));
      case 'getDokumen':
        return successResponse(getData('DOKUMEN'));
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
        return login(body.username || body.email, body.password);
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
        
      case 'saveAbsensiPengajar':
        return upsertAbsensiPengajar(body);
        
      case 'saveNilai':
        return upsertNilai(body);
      case 'deleteNilai':
        return deleteData('NILAI', body.id);
        
      case 'addPengumuman':
        return addData('PENGUMUMAN', body.data);
      case 'updatePengumuman':
        return updateData('PENGUMUMAN', body.id, body.data);
      case 'deletePengumuman':
        return deleteData('PENGUMUMAN', body.id);
        
      case 'addDokumen':
        return addData('DOKUMEN', body.data);
      case 'updateDokumen':
        return updateData('DOKUMEN', body.id, body.data);
      case 'deleteDokumen':
        return deleteData('DOKUMEN', body.id);
        
      default:
        return errorResponse("Unknown POST action");
    }
  } catch (error) {
    return errorResponse(error.toString());
  }
}

// ------------------- CORE FUNCTIONS -------------------

function login(usernameOrEmail, password) {
  const users = getData('USERS');
  const checkUsername = usernameOrEmail ? usernameOrEmail.toString().toLowerCase().trim() : '';
  const checkPassword = password ? password.toString() : '';

  const user = users.find(u => {
    // Check both u.username and u.email to support seamless transition if they haven't updated sheet headers
    const uUsername = (u.username || u.email || '').toString().toLowerCase().trim();
    const uPassword = u.password ? u.password.toString() : '';
    return uUsername === checkUsername && uPassword === checkPassword;
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
  
  // Normalize fields and ensure we map legacy variations to the new scheme
  if (item.mahasiswa_id && !item.nim) {
    item.nim = item.mahasiswa_id;
  }
  if (item.nama_mahasiswa && !item.nama) {
    item.nama = item.nama_mahasiswa;
  }
  if (item.nama && !item.nama_mahasiswa) {
    item.nama_mahasiswa = item.nama;
  }
  
  if (item.tahun_akademik && !item.tahun_akademik_data) {
    item.tahun_akademik_data = item.tahun_akademik;
  }
  if (item.semester && !item.semester_data) {
    item.semester_data = item.semester;
  }
  
  // Robust index detection for finding rows
  let idxNim = -1;
  let idxNama = -1;
  let idxMk = -1;
  let idxId = -1;
  for (let j = 0; j < headers.length; j++) {
    const h = normalizedHeaders[j];
    if (h === 'id') idxId = j;
    else if (h === 'nim' || h === 'mahasiswa_id' || h === 'mahasiswa id' || h === 'mahasiswaid') idxNim = j;
    else if (h === 'nama' || h === 'nama_mahasiswa' || h === 'mahasiswa_nama' || h === 'nama mahasiswa' || h === 'namamahasiswa') idxNama = j;
    else if (h === 'nama_mk' || h === 'nama mk' || h === 'matakuliah' || h === 'mata kuliah' || h === 'namamk') idxMk = j;
  }
  
  let foundRowIndex = -1;
  
  // Search by ID first if provided
  if (idxId !== -1 && item.id) {
    const itemIdStr = item.id.toString().trim().toLowerCase();
    for (let i = 1; i < data.length; i++) {
      const cellId = data[i][idxId];
      if (cellId !== null && cellId !== undefined) {
        const cellIdStr = cellId.toString().trim().toLowerCase();
        if (cellIdStr === itemIdStr) {
          foundRowIndex = i;
          break;
        }
      }
    }
  }
  
  // Fallback to match by NIM/Nama + MK if ID not found or not provided
  if (foundRowIndex === -1) {
    if ((idxNim !== -1 || idxNama !== -1) && idxMk !== -1) {
      for (let i = 1; i < data.length; i++) {
        let nim = idxNim !== -1 ? data[i][idxNim] : null;
        let nama = idxNama !== -1 ? data[i][idxNama] : null;
        let mk = data[i][idxMk];
        
        let studentMatch = false;
        
        let strNim = nim !== null && nim !== undefined ? nim.toString().trim().toLowerCase() : "";
        let strNama = nama !== null && nama !== undefined ? nama.toString().trim().toLowerCase() : "";
        let strMk = mk !== null && mk !== undefined ? mk.toString().trim().toLowerCase() : "";
        
        let itemNim = item.nim !== null && item.nim !== undefined ? item.nim.toString().trim().toLowerCase() : "";
        let itemNama = item.nama !== null && item.nama !== undefined ? item.nama.toString().trim().toLowerCase() : "";
        let itemNamaMhs = item.nama_mahasiswa !== null && item.nama_mahasiswa !== undefined ? item.nama_mahasiswa.toString().trim().toLowerCase() : "";
        let itemMk = item.nama_mk !== null && item.nama_mk !== undefined ? item.nama_mk.toString().trim().toLowerCase() : "";
        
        if (itemNim && strNim && strNim === itemNim) {
          studentMatch = true;
        } else if (itemNama && strNama && strNama === itemNama) {
          studentMatch = true;
        } else if (itemNamaMhs && strNama && strNama === itemNamaMhs) {
          studentMatch = true;
        }
        
        if (studentMatch && strMk && itemMk && strMk === itemMk) {
          foundRowIndex = i;
          break;
        }
      }
    }
  }
  
  // List of restricted columns that must be completely untouched to preserve Google Sheets automatic formulas
  const restrictedKeys = [
    'mahasiswa_id', 'mahasiswa id', 'mahasiswaid',
    'tahun_akademik', 'tahun akademik', 'tahunakademik',
    'semester',
    'total',
    'am',
    'm',
    'hm',
    'nim'
  ];

  // Completely delete legacy/restricted properties to prevent writing them to columns
  // or interfering with Google Sheets array formulas
  for (let k = 0; k < restrictedKeys.length; k++) {
    delete item[restrictedKeys[k]];
  }

  if (foundRowIndex > -1) {
    // Update existing row
    for (let j = 0; j < headers.length; j++) {
      const headerName = normalizedHeaders[j];
      if (headerName === 'id' || restrictedKeys.indexOf(headerName) !== -1) {
        continue;
      }
      if (headerName in item) {
        let val = item[headerName];
        sheet.getRange(foundRowIndex + 1, j + 1).setValue(val !== undefined && val !== null ? val : "");
      }
    }
    return successResponse({ id: data[foundRowIndex][idxId] || item.id, message: "Nilai updated successfully" });
  } else {
    // Add new row
    if (!item.id) {
      item.id = generateId();
    }
    const newRowIndex = sheet.getLastRow() + 1;
    // We write cell-by-cell only for permitted columns, keeping restricted columns completely empty/untouched
    for (let j = 0; j < headers.length; j++) {
      const headerName = normalizedHeaders[j];
      if (headerName === 'id') {
        sheet.getRange(newRowIndex, j + 1).setValue(item.id);
        continue;
      }
      if (restrictedKeys.indexOf(headerName) !== -1) {
        continue; // Do NOT write anything at all to this column cell, keeping it completely untouched for array formulas
      }
      if (headerName in item) {
        let val = item[headerName];
        sheet.getRange(newRowIndex, j + 1).setValue(val !== undefined && val !== null ? val : "");
      }
    }
    return successResponse({ id: item.id, message: "Nilai created successfully" });
  }
}

function upsertAbsensiPengajar(item) {
  const sheet = ensureSheetHeaders('ABSENSI_PENGAJAR');
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return errorResponse("Sheet ABSENSI_PENGAJAR is empty");
  
  const headers = data[0];
  const normalizedHeaders = headers.map(h => h ? h.toString().toLowerCase().trim() : '');
  
  const idxPengajar = normalizedHeaders.indexOf('pengajar_id');
  const idxTanggal = normalizedHeaders.indexOf('tanggal');
  
  if (idxPengajar === -1 || idxTanggal === -1) {
    return errorResponse("Missing required columns in ABSENSI_PENGAJAR sheet");
  }
  
  let foundRowIndex = -1;
  // Start from 1 to skip headers
  for (let i = 1; i < data.length; i++) {
    let pId = data[i][idxPengajar];
    let tgl = data[i][idxTanggal];
    
    // Normalize date from Google Sheets to string if it's a Date object
    let tglStr = tgl;
    if (tgl instanceof Date) {
       // Extract YYYY-MM-DD
       const yyyy = tgl.getFullYear();
       const mm = String(tgl.getMonth() + 1).padStart(2, '0');
       const dd = String(tgl.getDate()).padStart(2, '0');
       tglStr = `${yyyy}-${mm}-${dd}`;
    }
    
    if (pId == item.pengajar_id && tglStr == item.tanggal) {
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
    return successResponse({ message: "Absensi pengajar updated successfully" });
  } else {
    // Add new row
    item.id = generateId();
    const newRow = [];
    for (let j = 0; j < headers.length; j++) {
      const headerName = normalizedHeaders[j];
      newRow.push(item[headerName] !== undefined ? item[headerName] : "");
    }
    sheet.appendRow(newRow);
    return successResponse({ id: item.id, message: "Absensi pengajar created successfully" });
  }
}

function generateId() {
  return Utilities.getUuid();
}

// ------------------- HANDLE AUTO ID DI GOOGLE SHEETS -------------------
// Fungsi ini akan berjalan otomatis setiap kali Anda mengetik di Spreadsheet (tanpa melalui aplikasi)
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();
  
  const range = e.range;
  const rowStart = range.getRow();
  const rowEnd = rowStart + range.getNumRows() - 1;
  const colStart = range.getColumn();
  
  // Jika yang diedit adalah baris header (baris 1) atau kolom ID (kolom 1), abaikan
  if (rowStart === 1 || colStart === 1) return;
  
  for (let r = Math.max(2, rowStart); r <= rowEnd; r++) {
    const idRange = sheet.getRange(r, 1);
    
    // Cek sel yang baru saja diedit di baris ini
    const editedCell = sheet.getRange(r, colStart).getValue();
    
    // Jika sel yang diedit memiliki isi, dan ID di baris itu  masih kosong
    if (editedCell && editedCell.toString().trim() !== '' && !idRange.getValue()) {
      let newId = generateId();
      idRange.setValue(newId);
    }
  }
}

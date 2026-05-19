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
 * 3. Isi header (baris 1) di Sheet masing-masing sebagai berikut:
 *    - USERS: id, nama, email, password, role, status
 *      (Lalu tambahkan 1 baris untuk admin: id: 1, nama: Admin, email: admin@admin.com, password: password123, role: admin, status: aktif)
 *    - MAHASANTRI: id, nim, nama, jenis_kelamin, program, kelas, status
 *    - PENGAJAR: id, nama, jabatan, status
 *    - MATAKULIAH: id, kode, nama_mk, program, kelas, pengajar
 *    - KELAS: id, program, nama_kelas
 *    - JADWAL: id, hari, jam_ke, jam_mulai, jam_berakhir, program, kelas, nama_mk, pengajar
 *    - ABSENSI: id, tanggal, jam_ke, program, kelas, mahasiswa_id, status, timestamp
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
  const checkEmail = email ? email.toString().trim() : '';
  const checkPassword = password ? password.toString() : '';

  const user = users.find(u => {
    const uEmail = u.email ? u.email.toString().trim() : '';
    const uPassword = u.password ? u.password.toString() : '';
    return uEmail === checkEmail && uPassword === checkPassword;
  });
  
  if (user) {
    // Remove password from response for security
    delete user.password;
    const status = user.status ? user.status.toString().toLowerCase().trim() : 'aktif';
    if (status !== 'active' && status !== 'aktif') return errorResponse("Account is not active (" + status + ")");
    return successResponse({ user });
  }
  return errorResponse("Invalid email or password");
}

function getData(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet " + sheetName + " not found");
  
  const rawData = sheet.getDataRange().getValues();
  if (rawData.length <= 1) return []; // Only headers or empty
  
  const headers = rawData[0].map(h => h ? h.toString().toLowerCase().trim() : '');
  const idIndex = headers.indexOf('id');
  const items = [];
  
  let hasMissingIds = false;
  
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    const item = {};
    for (let j = 0; j < headers.length; j++) {
      item[headers[j]] = row[j] !== undefined ? row[j] : null;
    }
    
    // Auto-generate missing IDs for manual sheet entries
    if (idIndex !== -1 && (!item.id || item.id.toString().trim() === '')) {
      const newId = generateId();
      item.id = newId;
      rawData[i][idIndex] = newId;
      hasMissingIds = true;
    }
    
    items.push(item);
  }
  
  if (hasMissingIds && idIndex !== -1) {
    const idsColumnValues = [];
    for (let i = 1; i < rawData.length; i++) {
      idsColumnValues.push([rawData[i][idIndex]]);
    }
    sheet.getRange(2, idIndex + 1, idsColumnValues.length, 1).setValues(idsColumnValues);
  }
  
  return items;
}

function addData(sheetName, item) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const headers = sheet.getDataRange().getValues()[0];
  
  // Create id
  item.id = generateId();
  item.createdAt = new Date().toISOString();
  
  const newRow = [];
  for (let j = 0; j < headers.length; j++) {
    newRow.push(item[headers[j]] || "");
  }
  
  sheet.appendRow(newRow);
  return successResponse({ id: item.id, message: "Created successfully" });
}

function bulkAddData(sheetName, items) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const headers = sheet.getDataRange().getValues()[0];
  
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
      row.push(item[headers[j]] || "");
    }
    newRows.push(row);
  });
  
  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
  
  return successResponse({ message: `${newRows.length} items created successfully` });
}

function updateData(sheetName, id, updatedItem) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
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
          sheet.getRange(i + 1, j + 1).setValue(updatedItem[headerName]);
        }
      }
      return successResponse({ message: "Updated successfully" });
    }
  }
  return errorResponse("Data not found");
}

function deleteData(sheetName, id) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
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
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('ABSENSI');
  const headers = sheet.getDataRange().getValues()[0];
  
  const newRows = [];
  const timestamp = new Date().toISOString();
  
  absensiArr.forEach(item => {
    item.id = generateId();
    item.timestamp = timestamp;
    
    const row = [];
    for (let j = 0; j < headers.length; j++) {
      row.push(item[headers[j]] || "");
    }
    newRows.push(row);
  });
  
  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
  
  return successResponse({ message: "Absensi saved successfully" });
}

function generateId() {
  return Utilities.getUuid();
}

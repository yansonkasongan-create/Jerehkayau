/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileSpreadsheet, FolderKanban, Code, ListOrdered, Clipboard,
  Check, FileText, ChevronRight, HelpCircle, ArrowRight
} from 'lucide-react';

export default function AppsScriptExporter() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Trigger copy state feedback
  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Google Apps Script source Code.gs
  const appsScriptCodeGs = `/**
 * @license
 * Silsilah Keluarga - Google Apps Script Backend (Code.gs)
 * Menghubungkan Google Sheets sebagai Database & Google Drive untuk Foto
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEET_NAME = 'DataKeluarga';
const FOLDER_FOTO_ID = 'GANTI_DENGAN_ID_FOLDER_DRIVE_ANDA_DI_SINI'; // Ganti dengan ID Folder Google Drive Anda!

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Silsilah Keluarga')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 1. Ambil seluruh data keluarga besar dari Google Sheet
function getFamilyData() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      return [];
    }
    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // Pisahkan baris pertama (Header)
    
    return data.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return obj;
    });
  } catch (err) {
    Logger.log("Error mengambil data: " + err.toString());
    return [];
  }
}

// 2. Simpan atau Tambahkan anggota silsilah keluarga baru
function saveMember(formData) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    let fotoUrl = "";

    // Upload Foto Profil jika dilampirkan oleh pengguna
    if (formData.fotoFile && formData.fotoFile.length > 0) {
      if (FOLDER_FOTO_ID !== 'GANTI_DENGAN_ID_FOLDER_DRIVE_ANDA_DI_SINI') {
        const folder = DriveApp.getFolderById(FOLDER_FOTO_ID);
        const blob = Utilities.newBlob(
          Utilities.base64Decode(formData.fotoFile.split(",")[1]), 
          formData.fotoType, 
          formData.nama.replace(/\\s+/g, '_') + "_foto"
        );
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fotoUrl = file.getUrl();
      }
    }

    const newId = "ID-" + new Date().getTime();
    sheet.appendRow([
      newId,
      formData.nama,
      formData.gender,
      formData.parentId || "",
      formData.spouseId || "",
      formData.tglLahir || "",
      fotoUrl,
      formData.tempatLahir || "",
      formData.pekerjaan || "",
      formData.catatan || ""
    ]);
    
    return "Berhasil mendokumentasikan " + formData.nama;
  } catch (err) {
    return "Error menyimpan data: " + err.toString();
  }
}

// 3. Hapus data anggota silsilah dari Google Sheets
function deleteMember(id) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return "Data berhasil dihapus dari silsilah";
      }
    }
    return "Data tidak ditemukan.";
  } catch (err) {
    return "Error menghapus: " + err.toString();
  }
}
`;

  // HTML index file with embedded CSS/JS and recursive Google OrgChart visualization
  const appsScriptIndexHtml = `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <title>Silsilah Keluarga - Apps Script</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://www.gstatic.com/charts/loader.js"></script>
  <style>
    :root {
      --bg-cream: #FFFDD0;
      --deep-purple: #4B0082;
      --accent-soft: #F5F5DC;
    }
    body { 
      background-color: var(--bg-cream); 
      color: #333; 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    }
    .navbar { 
      background-color: var(--deep-purple) !important; 
    }
    .nav-link, .navbar-brand { 
      color: white !important; 
    }
    .card { 
      border-radius: 15px; 
      border: none; 
      box-shadow: 0 4px 8px rgba(0,0,0,0.06); 
    }
    .btn-primary { 
      background-color: var(--deep-purple); 
      border: none; 
    }
    .btn-primary:hover {
      background-color: #3b0066;
    }
    #tree_canvas { 
      width: 100%; 
      min-height: 500px; 
      overflow-x: auto; 
      padding: 20px; 
      display: flex;
      justify-content: center;
    }
    /* Kustomisasi Visual Google Charts OrgChart */
    .google-visualization-orgchart-node {
      border: 2px solid var(--deep-purple) !important;
      background: white !important;
      border-radius: 12px !important;
      box-shadow: 2px 2px 8px rgba(0,0,0,0.08) !important;
      padding: 10px 15px !important;
      font-family: inherit !important;
    }
    .member-img { 
      width: 44px; 
      height: 44px; 
      border-radius: 50%; 
      object-fit: cover; 
      margin-bottom: 5px;
      border: 1.5px solid var(--deep-purple);
    }
    .hidden { 
      display: none; 
    }
  </style>
</head>
<body>

<nav class="navbar navbar-expand-lg mb-4">
  <div class="container">
    <a class="navbar-brand" href="#">🌳 Silsilah Keluarga</a>
    <div class="navbar-nav ms-auto">
      <a class="nav-link" href="#" onclick="showPage('dashboard')">Beranda</a>
      <a class="nav-link" href="#" onclick="showPage('tree')">Pohon Visual</a>
      <a class="nav-link" href="#" onclick="showPage('admin')">Manajemen Data</a>
    </div>
  </div>
</nav>

<div class="container pb-5">
  
  <!-- DASHBOARD -->
  <div id="page-dashboard">
    <div class="row text-center my-4">
      <div class="col-md-6 mb-3">
        <div class="card p-4">
          <h3>Total Anggota Silsilah</h3>
          <h1 id="count-member" class="display-3 font-weight-bold" style="color:var(--deep-purple);">0</h1>
          <p class="text-muted mb-0">Anggota Keluarga Terdaftar</p>
        </div>
      </div>
      <div class="col-md-6 mb-3 flex-column d-flex justify-content-center">
        <div class="card p-4 h-100 justify-content-center align-items-center">
          <h5 class="mb-3">Kelola Database Keluarga Anda</h5>
          <button class="btn btn-primary btn-lg w-100" onclick="showPage('admin')">+ Tambah Anggota Baru</button>
          <button class="btn btn-outline-secondary btn-md w-100 mt-2" onclick="showPage('tree')">Buka Pohon Visual 🌳</button>
        </div>
      </div>
    </div>
  </div>

  <!-- POHON VISUAL (Google OrgChart) -->
  <div id="page-tree" class="hidden">
    <div class="card p-4">
      <h4 class="text-center mb-4" style="color:var(--deep-purple);">Mendokumentasikan Garis Keturunan</h4>
      <div id="tree_canvas"></div>
    </div>
  </div>

  <!-- ADMIN / INPUT FORM -->
  <div id="page-admin" class="hidden">
    <div class="row">
      <div class="col-md-4">
        <div class="card p-3 mb-4">
          <h5 class="mb-3">Input Anggota Silsilah Baru</h5>
          <form id="memberForm">
            <div class="mb-2">
              <label class="form-label font-weight-bold text-muted small">Nama Sesuai KTP / Nama Panggilan</label>
              <input type="text" name="nama" class="form-control" required>
            </div>
            <div class="mb-2">
              <label class="form-label font-weight-bold text-muted small">Gender</label>
              <select name="gender" class="form-control">
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label font-weight-bold text-muted small">Orang Tua (Ayah / Ibu)</label>
              <select name="parentId" id="parentSelect" class="form-control">
                <option value="">-- Tanpa Orang Tua --</option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label font-weight-bold text-muted small">Pasangan (Suami / Istri)</label>
              <select name="spouseId" id="spouseSelect" class="form-control">
                <option value="">-- Tanpa Pasangan --</option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label font-weight-bold text-muted small">Tanggal Lahir</label>
              <input type="date" name="tglLahir" class="form-control">
            </div>
            <div class="mb-2">
              <label class="form-label font-weight-bold text-muted small">Foto Profil (Optional)</label>
              <input type="file" id="fotoFile" class="form-control" accept="image/*">
            </div>
            <button type="submit" class="btn btn-primary w-100 mt-3">Simpan Anggota Baru</button>
          </form>
        </div>
      </div>
      
      <div class="col-md-8">
        <div class="card p-3">
          <h5 class="mb-3">Daftar Anggota Keluarga Besar</h5>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Gender</th>
                  <th>Tanggal Lahir</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody id="memberList"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

</div>

<script>
  google.charts.load('current', {packages:["orgchart"]});

  function showPage(pageId) {
    ['dashboard', 'tree', 'admin'].forEach(p => {
      document.getElementById('page-' + p).classList.add('hidden');
    });
    document.getElementById('page-' + pageId).classList.remove('hidden');
    
    if (pageId === 'tree') drawChart();
    if (pageId === 'admin' || pageId === 'dashboard') loadData();
  }

  function loadData() {
    google.script.run.withSuccessHandler(function(data) {
      document.getElementById('count-member').innerText = data.length;
      
      const parentSelect = document.getElementById('parentSelect');
      const spouseSelect = document.getElementById('spouseSelect');
      const memberList = document.getElementById('memberList');
      
      parentSelect.innerHTML = '<option value="">-- Tanpa Orang Tua --</option>';
      spouseSelect.innerHTML = '<option value="">-- Tanpa Pasangan --</option>';
      memberList.innerHTML = '';

      data.forEach(m => {
        let opt = '<option value="' + m.ID + '">' + m.Nama + ' (' + m.Gender + ')</option>';
        parentSelect.innerHTML += opt;
        spouseSelect.innerHTML += opt;
        
        memberList.innerHTML += '<tr>' +
          '<td>' + m.Nama + '</td>' +
          '<td>' + (m.Gender === 'L' ? 'Laki-Laki' : 'Perempuan') + '</td>' +
          '<td>' + (m.TglLahir || '-') + '</td>' +
          '<td><button onclick="deleteM(\'' + m.ID + '\')" class="btn btn-danger btn-sm">Hapus</button></td>' +
        '</tr>';
      });
      window.familyData = data;
    }).getFamilyData();
  }

  function deleteM(id) {
    if (confirm('Hapus anggota ini dari silsilah keluarga?')) {
      google.script.run.withSuccessHandler(() => loadData()).deleteMember(id);
    }
  }

  document.getElementById('memberForm').onsubmit = function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('fotoFile');
    const formData = {
      nama: this.nama.value,
      gender: this.gender.value,
      parentId: this.parentId.value,
      spouseId: this.spouseId.value,
      tglLahir: this.tglLahir.value
    };

    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = function(e) {
        formData.fotoFile = e.target.result;
        formData.fotoType = file.type;
        google.script.run.withSuccessHandler(res => {
          alert(res);
          document.getElementById('memberForm').reset();
          loadData();
        }).saveMember(formData);
      };
      reader.readAsDataURL(file);
    } else {
      google.script.run.withSuccessHandler(res => {
        alert(res);
        document.getElementById('memberForm').reset();
        loadData();
      }).saveMember(formData);
    }
  };

  function drawChart() {
    google.script.run.withSuccessHandler(function(data) {
      const chartData = new google.visualization.DataTable();
      chartData.addColumn('string', 'Entity');
      chartData.addColumn('string', 'Parent');
      chartData.addColumn('string', 'ToolTip');

      const rows = data.map(m => {
        let outputCard = '';
        if (m.FotoID && m.FotoID.length > 0) {
          outputCard += '<img src="' + m.FotoID + '" class="member-img"><br>';
        }
        outputCard += '<div style="color:var(--deep-purple); font-weight:bold">' + m.Nama + '</div>';
        if (m.TglLahir) {
          outputCard += '<div class="small text-muted">' + m.TglLahir.slice(0, 4) + '</div>';
        }
        return [
          { v: m.ID, f: outputCard },
          m.ParentID || '',
          m.Nama
        ];
      });

      chartData.addRows(rows);
      const chart = new google.visualization.OrgChart(document.getElementById('tree_canvas'));
      chart.draw(chartData, {allowHtml:true, size:'medium'});
    }).getFamilyData();
  }

  window.onload = loadData;
</script>
</body>
</html>
`;

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Code className="w-5 h-5 text-purple-600" /> 
          Google Apps Script Silsilah Exporter
        </h3>
        <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
          Gunakan kode sumber di bawah ini untuk merilis WebApp Silsilah Keluarga milik Anda sendiri di Google Workspace Cloud secara gratis. Data silsilah akan disimpan di **Google Sheets**, dan gambar foto profil tersimpan di **Google Drive** Anda!
        </p>
      </div>

      {/* Steps Visual Guidance timeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-[#FAF6EE] border border-[#f3ebde] p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
              1
            </span>
            <h5 className="text-xs font-bold text-slate-800">Persiapkan Spreadsheet</h5>
          </div>
          <p className="text-[11px] text-stone-500 leading-normal font-sans">
            Buat spreadsheet baru di Google Sheets bernama <strong>DB_Silsilah</strong>. Ubah nama sheet pertama Anda menjadi <strong>DataKeluarga</strong>.
          </p>
        </div>

        <div className="bg-[#FAF6EE] border border-[#f3ebde] p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
              2
            </span>
            <h5 className="text-xs font-bold text-slate-800">Ketik Judul Kolom</h5>
          </div>
          <p className="text-[11px] text-stone-500 leading-normal font-sans">
            Di baris pertama (Kolom A-J), buat judul kolom persis: 
            <span className="block mt-1 font-mono text-[9px] bg-white p-1 rounded border border-stone-200 truncate font-semibold">
              ID | Nama | Gender | ParentID | SpouseID | TglLahir | FotoID | TempatLahir | Pekerjaan | Catatan
            </span>
          </p>
        </div>

        <div className="bg-[#FAF6EE] border border-[#f3ebde] p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
              3
            </span>
            <h5 className="text-xs font-bold text-slate-800">Folder Google Drive</h5>
          </div>
          <p className="text-[11px] text-stone-500 leading-normal font-sans">
            Buat folder baru bernama <strong>Foto_Silsilah</strong> di Google Drive Anda. Jadikan aksesnya <em>Siapa saja dengan link dapat melihat</em>, lalu salin ID Foldernya.
          </p>
        </div>

        <div className="bg-[#FAF6EE] border border-[#f3ebde] p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
              4
            </span>
            <h5 className="text-xs font-bold text-slate-800">Buka Apps Script</h5>
          </div>
          <p className="text-[11px] text-stone-500 leading-normal font-sans">
            Di Google Sheets Anda, klik <strong>Extensions</strong> &gt; <strong>Apps Script</strong>. Tempel kode di bawah, ganti ID Folder Drive Anda, lalu klik <strong>Deploy</strong>!
          </p>
        </div>

      </div>

      {/* Code snippets view selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Code.gs Codeblock */}
        <div className="bg-stone-900 rounded-2xl overflow-hidden shadow-lg flex flex-col h-[550px]">
          <div className="bg-stone-800 px-4 py-3 flex items-center justify-between text-stone-300 border-b border-stone-700 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Code className="w-4 h-4 text-purple-400" /> Code.gs (Script Backend)
            </div>
            
            <button
              onClick={() => handleCopy(appsScriptCodeGs, 'gs')}
              className="text-[11px] font-bold px-2.5 py-1 rounded bg-stone-700 hover:bg-stone-600 text-white flex items-center gap-1 transition"
            >
              {copiedSection === 'gs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
              {copiedSection === 'gs' ? 'Tersalin!' : 'Salin Kode'}
            </button>
          </div>

          <div className="flex-1 p-4 overflow-auto font-mono text-[10.5px] text-stone-100 select-all leading-normal whitespace-pre">
            {appsScriptCodeGs}
          </div>
        </div>

        {/* Index.html Codeblock */}
        <div className="bg-stone-900 rounded-2xl overflow-hidden shadow-lg flex flex-col h-[550px]">
          <div className="bg-stone-800 px-4 py-3 flex items-center justify-between text-stone-300 border-b border-stone-700 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold">
              <FileText className="w-4 h-4 text-orange-400" /> Index.html (Tampilan Frontend)
            </div>
            
            <button
              onClick={() => handleCopy(appsScriptIndexHtml, 'html')}
              className="text-[11px] font-bold px-2.5 py-1 rounded bg-stone-700 hover:bg-stone-600 text-white flex items-center gap-1 transition"
            >
              {copiedSection === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
              {copiedSection === 'html' ? 'Tersalin!' : 'Salin Kode'}
            </button>
          </div>

          <div className="flex-1 p-4 overflow-auto font-mono text-[10.5px] text-stone-100 select-all leading-normal whitespace-pre">
            {appsScriptIndexHtml}
          </div>
        </div>

      </div>

    </div>
  );
}

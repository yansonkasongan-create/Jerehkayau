/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, Pencil, Trash2, Search, User, UserPlus, FileUp, 
  Sparkles, Check, AlertCircle, RefreshCw, X, Download
} from 'lucide-react';
import { FamilyMember } from '../types';
import { checkCircularReference, calculateAge } from '../utils';
import { jsPDF } from 'jspdf';

interface AdminPanelProps {
  members: FamilyMember[];
  onSaveMember: (member: FamilyMember) => void;
  onDeleteMember: (id: string) => void;
  formPreload: {
    relativeId?: string;
    relationType?: 'child' | 'spouse';
  } | null;
  onClearPreload: () => void;
}

export default function AdminPanel({
  members,
  onSaveMember,
  onDeleteMember,
  formPreload,
  onClearPreload
}: AdminPanelProps) {
  
  // States of Admin
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [parentId, setParentId] = useState('');
  const [spouseId, setSpouseId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [occupation, setOccupation] = useState('');
  const [isDeceased, setIsDeceased] = useState(false);
  const [deathDate, setDeathDate] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Image upload handler
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Error/Success state feedbacks
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Selectable lists for Form
  const memberMap = useMemo(() => {
    const map = new Map<string, FamilyMember>();
    members.forEach(m => map.set(m.id, m));
    return map;
  }, [members]);

  // List of potential parents (all members as parent options)
  const parentOptions = useMemo(() => {
    return members
      .filter(m => m.id !== editingId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, editingId]);

  // List of potential spouses
  const spouseOptions = useMemo(() => {
    return members
      .filter(m => {
        // cannot marry self
        if (m.id === editingId) return false;
        // opposites usually, but we keep it open, but we exclude already married folks except if current edit spouse
        if (m.spouseId && m.spouseId !== editingId) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, editingId]);

  // Pre-set avatar selections
  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', // Women
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', // Men
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', // Girl
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', // Boy
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200', // Woman 2
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200'  // Man 2
  ];

  // Handle setting preload fields dynamically
  React.useEffect(() => {
    if (formPreload) {
      handleResetForm();
      const relative = members.find(m => m.id === formPreload.relativeId);
      if (relative) {
        if (formPreload.relationType === 'child') {
          // Add relative as parent
          setParentId(relative.id);
          // Set baby/youth occupation or blank
          setOccupation('Pelajar/Anak');
          // Match surname or similar if male parent
          if (relative.gender === 'L') {
            const relativeLastName = relative.name.split(' ').pop();
            if (relativeLastName && !relativeLastName.includes('.') && relativeLastName.length > 2) {
              setName(relativeLastName); // hint lastName
            }
          }
        } else if (formPreload.relationType === 'spouse') {
          // Add relative as spouse
          setSpouseId(relative.id);
          setGender(relative.gender === 'L' ? 'P' : 'L'); // opposite gender suggest
        }
        setSuccessMsg(`Form dipersiapkan: Hubungan "${formPreload.relationType === 'child' ? 'Anak dari' : 'Pasangan dari'}" ${relative.name}`);
        onClearPreload();
      }
    }
  }, [formPreload, members, onClearPreload]);

  // Handle Edit Action
  const handleEditClick = (member: FamilyMember) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setEditingId(member.id);
    setName(member.name);
    setGender(member.gender);
    setParentId(member.parentId || '');
    setSpouseId(member.spouseId || '');
    setBirthDate(member.birthDate || '');
    setBirthPlace(member.birthPlace || '');
    setOccupation(member.occupation || '');
    setIsDeceased(!!member.isDeceased);
    setDeathDate(member.deathDate || '');
    setNotes(member.notes || '');
    setPhotoUrl(member.photoUrl || '');
  };

  // Reset helper
  const handleResetForm = () => {
    setEditingId(null);
    setName('');
    setGender('L');
    setParentId('');
    setSpouseId('');
    setBirthDate('');
    setBirthPlace('');
    setOccupation('');
    setIsDeceased(false);
    setDeathDate('');
    setNotes('');
    setPhotoUrl('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Profile File Base64 photo loader converter
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Form Submit Execution
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Nama lengkap harus diisi!');
      return;
    }

    // Circularity check
    if (parentId && editingId) {
      const isCircular = checkCircularReference(members, editingId, parentId);
      if (isCircular) {
        setErrorMsg('Error: Hubungan silsilah tidak valid! Tidak boleh ada hubungan silsilah melingkar (Anak tidak bisa menjadi orang tua dari keturunannya sendiri).');
        return;
      }
    }

    // Spouse circularity check (cannot marry self)
    if (spouseId && spouseId === editingId) {
      setErrorMsg('Error: Hubungan silsilah tidak valid! Anggota tidak bisa menikah dengan dirinya sendiri.');
      return;
    }

    const memberToSave: FamilyMember = {
      id: editingId || `m-${Date.now()}`,
      name: name.trim(),
      gender,
      parentId: parentId || undefined,
      spouseId: spouseId || undefined,
      birthDate: birthDate || undefined,
      birthPlace: birthPlace || undefined,
      occupation: occupation || undefined,
      isDeceased: isDeceased || undefined,
      deathDate: isDeceased && deathDate ? deathDate : undefined,
      notes: notes || undefined,
      photoUrl: photoUrl || undefined
    };

    onSaveMember(memberToSave);
    setSuccessMsg(editingId ? 'Data berhasil diperbarui!' : 'Keluarga baru berhasil ditambahkan!');
    handleResetForm();
  };

  // Programmatic high-quality PDF text-drawn compiler with pagination support and header titles (Judul Header PDF)
  const exportListToPDF = async () => {
    setIsExporting(true);
    try {
      // Small artificial delay for visual responsiveness on click
      await new Promise(resolve => setTimeout(resolve, 100));

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      let currentY = 15;

      // 1. ADD BEAUTIFUL CUSTOM HEADER TITLE
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(75, 0, 130); // Deep Violet/Purple
      doc.text('DAFTAR ANGGOTA KELUARGA BESAR', 14, currentY);
      currentY += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(`Aplikasi Silsilah Keluarga • Total Terdaftar: ${members.length} Anggota • Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, currentY);
      currentY += 5;

      // Elegant thick purple line divider
      doc.setDrawColor(75, 0, 130);
      doc.setLineWidth(0.4);
      doc.line(14, currentY, pageWidth - 14, currentY);
      currentY += 8;

      // Draw Table Header Bar
      doc.setFillColor(243, 241, 248); // Pale high-contrast violet accent
      doc.rect(14, currentY - 5, pageWidth - 28, 7, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 0, 130);
      
      doc.text('NO', 16, currentY);
      doc.text('NAMA ANGGOTA', 25, currentY);
      doc.text('GENDER', 78, currentY);
      doc.text('LAHIR & USIA', 105, currentY);
      doc.text('STATUS & HUBUNGAN KELUARGA', 142, currentY);
      
      // Divider below header
      doc.setDrawColor(180, 180, 190);
      doc.setLineWidth(0.25);
      doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
      
      currentY += 8;

      // Walk through each and every family member in our list
      filteredMembers.forEach((m, idx) => {
        // Handle automated pagination wrapping
        if (currentY > pageHeight - 18) {
          doc.addPage();
          currentY = 15;
          
          // Page header repeat with continuation note
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(75, 0, 130);
          doc.text('DAFTAR ANGGOTA KELUARGA (Lanjutan)', 14, currentY);
          currentY += 6;
          
          // Table header repeat
          doc.setFillColor(243, 241, 248);
          doc.rect(14, currentY - 5, pageWidth - 28, 7, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(75, 0, 130);
          
          doc.text('NO', 16, currentY);
          doc.text('NAMA ANGGOTA', 25, currentY);
          doc.text('GENDER', 78, currentY);
          doc.text('LAHIR & USIA', 105, currentY);
          doc.text('STATUS & HUBUNGAN KELUARGA', 142, currentY);
          
          doc.setDrawColor(180, 180, 190);
          doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
          
          currentY += 8;
        }

        // Alternating soft backgrounds for supreme ledger legibility
        if (idx % 2 === 1) {
          doc.setFillColor(252, 252, 254);
          doc.rect(14, currentY - 5, pageWidth - 28, 7, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(80, 80, 80);

        // # Numbering column
        doc.text((idx + 1).toString(), 16, currentY);

        // Name column + "Alm." note for deceased ancestors
        const mName = m.isDeceased ? `${m.name} (Alm.)` : m.name;
        const displayName = mName.length > 28 ? mName.substring(0, 25) + '...' : mName;
        doc.setFont('helvetica', m.isDeceased ? 'italic' : 'bold');
        doc.setTextColor(m.isDeceased ? 120 : 50);
        doc.text(displayName, 25, currentY);

        // Gender column
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(m.gender === 'L' ? 'Laki-laki' : 'Perempuan', 78, currentY);

        // Birthplace & Age calculations
        const age = calculateAge(m.birthDate);
        const birthDetails = m.birthDate 
          ? `${m.birthDate} (${age > 0 ? `${age} th` : 'Anak/Bayi'})` 
          : '-';
        const displayBirth = birthDetails.length > 21 ? birthDetails.substring(0, 18) + '...' : birthDetails;
        doc.text(displayBirth, 105, currentY);

        // Spouse / children connections summary column
        const spouse = m.spouseId ? memberMap.get(m.spouseId) : null;
        const parent = m.parentId ? memberMap.get(m.parentId) : null;
        
        let relString = '';
        if (spouse && parent) {
          relString = `Menikah dg: ${spouse.name.split(' ')[0]} | Anak dari: ${parent.name.split(' ')[0]}`;
        } else if (spouse) {
          relString = `Menikah dg: ${spouse.name}`;
        } else if (parent) {
          relString = `Anak dari: ${parent.name}`;
        } else {
          relString = 'Kepala Relasi (Akar leluhur)';
        }
        
        // Truncate to avoid overflow
        const displayRel = relString.length > 34 ? relString.substring(0, 31) + '...' : relString;
        doc.text(displayRel, 142, currentY);

        // Subtle thin row separator line
        doc.setDrawColor(245, 245, 245);
        doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);

        currentY += 7.2;
      });

      // Write footer on every page
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(150, 150, 150);
        doc.text(`Halaman ${i} dari ${totalPages} • Silsilah Keluarga Besar`, 14, pageHeight - 8);
        doc.text('Dokumen Silsilah Resmi hasil cetak sistem • Ekspor PDF Digital', pageWidth - 100, pageHeight - 8);
      }

      doc.save('Daftar_Keluarga_Besar.pdf');
    } catch (err) {
      console.error('Failed to export list to PDF:', err);
      alert('Terjadi kesalahan saat memproses data keluarga ke dalam format PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  // Table filtering lists
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const parent = m.parentId ? memberMap.get(m.parentId) : null;
      const spouse = m.spouseId ? memberMap.get(m.spouseId) : null;

      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        (m.birthPlace && m.birthPlace.toLowerCase().includes(q)) ||
        (m.occupation && m.occupation.toLowerCase().includes(q)) ||
        (parent && parent.name.toLowerCase().includes(q)) ||
        (spouse && spouse.name.toLowerCase().includes(q))
      );
    });
  }, [members, searchQuery, memberMap]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Search and Table - Left List Section (8 cols) */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        
        {/* Table Management Board Summary header */}
        <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-none">Daftar Keluarga Besar</h3>
            <p className="text-[11px] text-stone-500 mt-1 leading-none">
              Tercatat <strong className="text-purple-700">{filteredMembers.length}</strong> dari {members.length} total anggota silsilah keluarga.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {/* Download PDF button */}
            <button
              onClick={exportListToPDF}
              disabled={isExporting}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition shadow-sm cursor-pointer w-full sm:w-auto justify-center
                ${isExporting
                  ? 'bg-stone-100 text-stone-400 border-stone-200'
                  : 'bg-indigo-650 hover:bg-indigo-700 text-white border-indigo-750'
                }`}
              title="Unduh Daftar Anggota Keluarga Besar (PDF)"
            >
              <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-spin' : ''}`} />
              {isExporting ? 'Memproses...' : 'Unduh Daftar (PDF)'}
            </button>

            {/* Dynamic search block picker */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                placeholder="Cari nama, tempat lahir atau pekerjaan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-sans text-slate-700 placeholder-stone-400 bg-stone-50 border border-stone-200 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 rounded-xl pl-9 pr-4 py-2"
              />
            </div>
          </div>
        </div>

        {/* Database List Data Table */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex-1 mini-height-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-100 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Anggota</th>
                  <th className="p-4">Gender</th>
                  <th className="p-4">Kelahiran (Umur)</th>
                  <th className="p-4">Keluarga</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((m) => {
                    const spouse = m.spouseId ? memberMap.get(m.spouseId) : null;
                    const parent = m.parentId ? memberMap.get(m.parentId) : null;
                    const age = calculateAge(m.birthDate);

                    return (
                      <tr key={m.id} className="hover:bg-purple-50/10 transition group">
                        
                        {/* Member avatar + name block */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {m.photoUrl ? (
                              <img 
                                src={m.photoUrl} 
                                alt={m.name} 
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-xl object-cover shrink-0 border border-purple-100"
                              />
                            ) : (
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border
                                ${m.gender === 'L' ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                {m.name[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h5 className="font-bold text-slate-800 leading-snug group-hover:text-purple-700 break-words flex items-center gap-1">
                                {m.name} 
                                {m.isDeceased && <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-normal shrink-0">Alm.</span>}
                              </h5>
                              <p className="text-[10px] text-stone-400 font-sans mt-0.5 max-w-[150px] truncate">
                                {m.occupation || 'Hubungan Keluarga'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Gender column */}
                        <td className="p-4">
                          <span className={`inline-block py-0.5 px-2 rounded-full font-bold text-[9px] uppercase border
                            ${m.gender === 'L' 
                              ? 'bg-sky-50 text-sky-700 border-sky-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                            {m.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </span>
                        </td>

                        {/* Birth info column */}
                        <td className="p-4 font-sans text-stone-600">
                          {m.birthDate ? (
                            <div>
                              <div className="font-semibold text-slate-700">{m.birthDate}</div>
                              <div className="text-[10px] text-stone-450 mt-0.5">
                                {age > 0 ? `${age} Tahun` : 'Baru Lahir'} • {m.birthPlace || 'Lokal'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic">Kosong</span>
                          )}
                        </td>

                        {/* Spouses / Parents badges indicators */}
                        <td className="p-4">
                          <div className="space-y-1 text-[10px]">
                            {spouse && (
                              <div className="flex items-center gap-1.5 text-rose-700">
                                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full shrink-0" />
                                <span className="text-stone-500">Nikah:</span>
                                <span className="font-semibold truncate max-w-[120px]">{spouse.name}</span>
                              </div>
                            )}
                            {parent && (
                              <div className="flex items-center gap-1.5 text-blue-750">
                                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full shrink-0" />
                                <span className="text-stone-500">Ortu:</span>
                                <span className="font-semibold truncate max-w-[120px]">{parent.name}</span>
                              </div>
                            )}
                            {!parent && !spouse && (
                              <span className="text-stone-400 italic font-medium">Akar (Root)</span>
                            )}
                          </div>
                        </td>

                        {/* Actions block */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleEditClick(m)}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg border border-transparent hover:border-purple-100 transition shadow-sm"
                              title="Edit Data"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus ${m.name} dari silsilah keluarga? Hubungan pasangan atau keturunannya mungkin perlu disesuaikan kembali.`)) {
                                  onDeleteMember(m.id);
                                  setSuccessMsg('Data berhasil dihapus dari silsilah!');
                                }
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition shadow-sm"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-stone-400">
                      <AlertCircle className="w-10 h-10 text-stone-200 mx-auto mb-2" />
                      <p className="text-xs">Tidak ditemukan kecocokan untuk penelusuran "{searchQuery}".</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Editor Form Right Sidebar (4 cols) */}
      <div className="lg:col-span-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm sticky top-4">
          
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-purple-900 leading-none">
              <UserPlus className="w-4 h-4 text-purple-600" />
              {editingId ? 'Edit Anggota Silsilah' : 'Tambah Anggota Silsilah'}
            </h4>
            {editingId && (
              <button 
                onClick={handleResetForm}
                className="text-stone-400 hover:text-stone-700 bg-stone-50 border border-stone-200 p-1 rounded-lg"
                title="Batal Edit / Reset"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <p className="leading-snug">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-800 p-2.5 rounded-xl flex items-center gap-1.5 text-xs">
              <Check className="w-4 h-4 text-emerald-600" />
              <p className="font-semibold leading-none">{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 pb-2 text-xs">
            
            {/* Input Name */}
            <div>
              <label className="block text-[10px] font-bold text-stone-450 uppercase mb-1">Nama Lengkap *</label>
              <input 
                type="text"
                placeholder="cth: Ir. Slamet Wardoyo, M.T."
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs text-slate-700 bg-stone-50/50 border border-stone-200 focus:outline-none focus:border-purple-400 rounded-lg p-2"
              />
            </div>

            {/* Input Gender */}
            <div>
              <label className="block text-[10px] font-bold text-stone-450 uppercase mb-1">Gender *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('L')}
                  className={`py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition
                    ${gender === 'L' 
                      ? 'bg-sky-50 text-sky-800 border-sky-300 ring-2 ring-sky-100' 
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
                >
                  <User className="w-3.5 h-3.5 text-sky-500" /> Laki-laki
                </button>
                <button
                  type="button"
                  onClick={() => setGender('P')}
                  className={`py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition
                    ${gender === 'P' 
                      ? 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-100' 
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
                >
                  <User className="w-3.5 h-3.5 text-rose-500" /> Perempuan
                </button>
              </div>
            </div>

            {/* Input Parents Linkage */}
            <div>
              <label className="block text-[10px] font-bold text-stone-450 uppercase mb-1">Hubungan Orang Tua (Ayah / Ibu)</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full text-xs text-slate-700 bg-stone-50/50 border border-stone-200 focus:outline-none focus:border-purple-400 rounded-lg p-2 outline-none"
              >
                <option value="">-- Tanpa Hubungan Orang Tua (Akar Utama) --</option>
                {parentOptions.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.gender})
                  </option>
                ))}
              </select>
              <p className="text-[9px] text-stone-420 mt-1 italic leading-tight">
                Anak otomatis mewarisi relasi pasangan/ibu tirinya berkat joint-couple layout.
              </p>
            </div>

            {/* Input Spouses Linkage */}
            <div>
              <label className="block text-[10px] font-bold text-stone-450 uppercase mb-1">Pasangan (Suami / Istri)</label>
              <select
                value={spouseId}
                onChange={(e) => setSpouseId(e.target.value)}
                className="w-full text-xs text-slate-700 bg-stone-50/50 border border-stone-200 focus:outline-none focus:border-purple-400 rounded-lg p-2 outline-none"
              >
                <option value="">-- Tanpa Pasangan --</option>
                {spouseOptions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.gender})
                  </option>
                ))}
              </select>
            </div>

            {/* Grid kelahirans */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-stone-455 uppercase mb-1">Tgl Lahir</label>
                <input 
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full text-xs text-slate-700 bg-stone-50/50 border border-stone-200 focus:outline-none rounded-lg p-1.5 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-455 uppercase mb-1">Tempat Lahir</label>
                <input 
                  type="text"
                  placeholder="Yogya, Semarang"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  className="w-full text-xs text-slate-700 bg-stone-50/50 border border-stone-200 focus:outline-none rounded-lg p-1.5 whitespace-nowrap"
                />
              </div>
            </div>

            {/* Pekerjaan */}
            <div>
              <label className="block text-[10px] font-bold text-stone-450 uppercase mb-1">Pekerjaan</label>
              <input 
                type="text"
                placeholder="Software Engineer, Guru, Mahasiswa"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full text-xs text-slate-700 bg-stone-50/50 border border-stone-200 focus:outline-none rounded-lg p-2"
              />
            </div>

            {/* Is Deceased status selection */}
            <div className="border border-stone-100 p-2.5 rounded-lg bg-stone-50/30">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={isDeceased}
                  onChange={(e) => setIsDeceased(e.target.checked)}
                  className="w-3.5 h-3.5 accent-purple-600 rounded"
                />
                <span className="font-bold text-[10.5px] text-slate-700">Anggota sudah Wafat (Almarhum/ah)</span>
              </label>
              
              {isDeceased && (
                <div className="mt-2 text-[10px] animate-fade-in space-y-1.5">
                  <label className="block text-stone-450 font-semibold mb-0.5">Sebutkan Tanggal Wafat (Optional)</label>
                  <input 
                    type="date"
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.target.value)}
                    className="w-full text-xs text-slate-700 bg-white border border-stone-200 focus:outline-none rounded-lg p-1"
                  />
                </div>
              )}
            </div>

            {/* Profile Picture Uploader */}
            <div>
              <label className="block text-[10px] font-bold text-stone-450 uppercase mb-1">Foto Profil / Avatar</label>
              
              <div className="space-y-2">
                {/* Visual view existing picture */}
                {photoUrl && (
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-100 p-2 rounded-lg relative">
                    <img src={photoUrl} alt="Avatar preview" referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-cover border border-purple-200 shadow-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-stone-500 font-semibold truncate leading-tight">Foto Terisi</p>
                      <button 
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="text-[9px] text-red-500 font-bold hover:underline"
                      >
                        Hapus Foto
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload or Choose file */}
                <div className="grid grid-cols-2 gap-1.5 text-center text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    className="flex flex-col items-center justify-center p-2.5 border-dashed border border-stone-200 rounded-lg hover:bg-stone-50 hover:border-purple-300 text-stone-500 hover:text-purple-700 transition cursor-pointer font-semibold shrink-0"
                  >
                    <FileUp className="w-4 h-4 mb-1 text-stone-400" />
                    <span>Upload Foto</span>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*" 
                      className="hidden" 
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // pick random avatar preset
                      const randUrl = presetAvatars[Math.floor(Math.random() * presetAvatars.length)];
                      setPhotoUrl(randUrl);
                    }}
                    className="flex flex-col items-center justify-center p-2.5 border-dashed border border-stone-200 rounded-lg hover:bg-stone-50 hover:border-purple-300 text-stone-500 hover:text-purple-700 transition font-semibold"
                  >
                    <Sparkles className="w-4 h-4 mb-0.5 text-yellow-500" />
                    <span>Gunakan Demo</span>
                    <span className="text-[8px] text-stone-400 font-normal">Avatar Premium</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Input Notes */}
            <div>
              <label className="block text-[10px] font-bold text-stone-450 uppercase mb-1">Catatan Tambahan</label>
              <textarea 
                rows={2}
                placeholder="Rincian biografi singkat, riwayat sekolah, hobi, nomor telepon, dll..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs text-slate-700 bg-stone-50/50 border border-stone-200 focus:outline-none rounded-lg p-2 font-sans"
              />
            </div>

            {/* Button Save */}
            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 text-white rounded-xl text-xs font-bold shadow-md hover:from-purple-900 hover:to-indigo-900 transition mt-4 shrink-0 flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {editingId ? 'Simpan Perubahan' : 'Simpan Anggota Baru'}
            </button>

          </form>
        </div>
      </div>

    </div>
  );
}

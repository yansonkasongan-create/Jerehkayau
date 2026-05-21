/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Users, Pencil, Trash2, Calendar, MapPin, Briefcase, 
  ChevronRight, ZoomIn, ZoomOut, RotateCcw, Heart, User, 
  Baby, Sparkles, AlertCircle, ChevronDown, ChevronUp, ArrowRight,
  Download
} from 'lucide-react';
import { FamilyMember } from '../types';
import { calculateAge } from '../utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface FamilyTreeProps {
  members: FamilyMember[];
  onSelectMember: (member: FamilyMember) => void;
  onAddRelative: (member: FamilyMember, relationType: 'child' | 'spouse') => void;
  selectedMemberId?: string;
}

export default function FamilyTree({ 
  members, 
  onSelectMember, 
  onAddRelative,
  selectedMemberId 
}: FamilyTreeProps) {
  // Navigation & Tree Roots
  const [rootId, setRootId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  // Download PDF as requested
  const handleDownloadPDF = async () => {
    if (!activeRoot) return;
    setIsExporting(true);
    
    try {
      const element = document.getElementById('family-tree-capture');
      if (element) {
        // Temporarily reset zoom to scale 1 to prevent rendering crops
        const prevTransform = element.style.transform;
        const prevTransition = element.style.transition;
        
        element.style.transform = 'scale(1)';
        element.style.transition = 'none';
        
        // Let layout adjust for scale(1) before snapping
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const canvas = await html2canvas(element, {
          useCORS: true,
          scale: 2, // Retain sharp details
          backgroundColor: '#FAF6EE'
        });
        
        // Restore previous zoom settings
        element.style.transform = prevTransform;
        element.style.transition = prevTransition;
        
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        const activeRootName = activeRoot.name;
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();
        
        // ADD BEAUTIFUL HEADER TITLE
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(75, 0, 130); // Deep Violet
        doc.text('VISUALISASI SILSILAH POHON KELUARGA', 15, 14);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(110, 110, 110);
        doc.text(`Akar Leluhur: ${activeRootName} • Tercatat: ${members.length} Anggota • Diunduh: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 15, 20);
        
        // Horizontal divider line
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.4);
        doc.line(15, 23, pdfWidth - 15, 23);
        
        // Layout sizing positioning
        const margin = 15;
        const contentWidth = pdfWidth - (margin * 2);
        const contentHeight = pdfHeight - 40;
        
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let finalWidth = imgWidth;
        let finalHeight = imgHeight;
        
        if (finalHeight > contentHeight) {
          finalHeight = contentHeight;
          finalWidth = (canvas.width * finalHeight) / canvas.height;
        }
        
        const xOffset = margin + (contentWidth - finalWidth) / 2;
        const yOffset = 26;
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
        
        // Add footer notes
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Aplikasi Silsilah Keluarga • Diunduh Otomatis Gratis', 15, pdfHeight - 8);
        doc.text(`Dicetak pukul ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`, pdfWidth - 65, pdfHeight - 8);
        
        doc.save(`Silsilah_Keluarga_${activeRootName.replace(/\s+/g, '_')}.pdf`);
      }
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert('Ada kesalahan saat memproses pohon keluarga ke format PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  // Set default root to the oldest member without parents
  const defaultRoot = useMemo(() => {
    if (members.length === 0) return null;
    const roots = members.filter(m => !m.parentId);
    if (roots.length === 0) return members[0];
    
    // Sort by birth year (oldest first)
    return roots.sort((a, b) => {
      const yearA = a.birthDate ? new Date(a.birthDate).getFullYear() : 9999;
      const yearB = b.birthDate ? new Date(b.birthDate).getFullYear() : 9999;
      return yearA - yearB;
    })[0];
  }, [members]);

  const activeRoot = useMemo(() => {
    if (rootId) {
      const found = members.find(m => m.id === rootId);
      if (found) return found;
    }
    return defaultRoot;
  }, [rootId, defaultRoot, members]);

  // Handle Collapsing Nodes
  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newCollapsed = new Set(collapsedNodes);
    if (newCollapsed.has(id)) {
      newCollapsed.delete(id);
    } else {
      newCollapsed.add(id);
    }
    setCollapsedNodes(newCollapsed);
  };

  // Zoom Handlers
  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 1.5));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => {
    setScale(1);
    setRootId(null);
  };

  // Build members indexed map
  const memberMap = useMemo(() => {
    const map = new Map<string, FamilyMember>();
    members.forEach(m => map.set(m.id, m));
    return map;
  }, [members]);

  // Helper to generate initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(n => !n.startsWith('H.') && !n.startsWith('Hj.') && !n.includes('.') && n.length > 0)
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase() || name[0]?.toUpperCase() || 'K';
  };

  // Mini Avatar rendering
  const renderAvatar = (member: FamilyMember, size: 'md' | 'sm' = 'md') => {
    const genderBg = member.gender === 'L' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800';
    const borderCol = member.isDeceased 
      ? 'border-gray-300 contrast-50' 
      : member.gender === 'L' 
        ? 'border-sky-300' 
        : 'border-rose-300';
        
    const dim = size === 'md' ? 'w-12 h-12 text-sm' : 'w-8 h-8 text-xs';

    if (member.photoUrl) {
      return (
        <img 
          src={member.photoUrl} 
          alt={member.name} 
          referrerPolicy="no-referrer"
          className={`${dim} rounded-full object-cover border-2 ${borderCol} shadow-sm`}
        />
      );
    }

    return (
      <div className={`${dim} rounded-full flex items-center justify-center font-medium border-2 ${borderCol} ${genderBg} shadow-sm`}>
        {getInitials(member.name)}
      </div>
    );
  };

  // Render a single couple union or individual
  const renderNodeCouple = (member: FamilyMember) => {
    const spouse = member.spouseId ? memberMap.get(member.spouseId) : null;
    const isMainSelected = selectedMemberId === member.id;
    const isSpouseSelected = spouse && selectedMemberId === spouse.id;

    const mainAge = calculateAge(member.birthDate);
    const spouseAge = spouse ? calculateAge(spouse.birthDate) : 0;

    return (
      <div className="flex flex-row items-center justify-center gap-1 sm:gap-2">
        {/* Main Member Card */}
        <motion.div
           layout
           onClick={() => onSelectMember(member)}
           className={`relative cursor-pointer p-3 rounded-xl bg-white border shadow-md transition-all duration-300 w-44 text-left hover:scale-105 hover:shadow-lg
             ${isMainSelected 
               ? 'ring-4 ring-indigo-500 border-indigo-500 bg-indigo-50/10' 
               : member.isDeceased 
                 ? 'border-dashed border-gray-300' 
                 : 'border-slate-100'
             }`}
        >
          {member.isDeceased && (
            <span className="absolute top-1 right-2 text-[9px] bg-slate-200 text-slate-700 px-1 rounded font-medium">
              Alm.
            </span>
          )}
          <div className="flex items-center gap-2">
            {renderAvatar(member, 'sm')}
            <div className="min-w-0 flex-1">
              <h6 className="text-[12px] font-bold text-slate-800 line-clamp-1 group-hover:text-violet-900 leading-tight">
                {member.name}
              </h6>
              <p className="text-[10px] text-slate-500 leading-none mt-1">
                {member.birthDate ? new Date(member.birthDate).getFullYear() : 'Tgl Lahir?'}
                {mainAge > 0 && ` (${mainAge} th)`}
              </p>
              {member.occupation && (
                <p className="text-[9px] text-slate-400 truncate mt-0.5 max-w-[100px]">
                  {member.occupation}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Spouse Link & Spouse Card */}
        {spouse && (
          <>
            <div className="w-4 h-[2px] bg-purple-300 flex items-center justify-center relative">
              <Heart className="w-3 h-3 text-red-400 absolute fill-red-400" />
            </div>

            <motion.div
               layout
               onClick={() => onSelectMember(spouse)}
               className={`relative cursor-pointer p-3 rounded-xl bg-white border shadow-md transition-all duration-300 w-44 text-left hover:scale-105 hover:shadow-lg
                 ${isSpouseSelected 
                   ? 'ring-4 ring-indigo-500 border-indigo-500 bg-indigo-50/10' 
                   : spouse.isDeceased 
                     ? 'border-dashed border-gray-300' 
                     : 'border-slate-100'
                 }`}
            >
              {spouse.isDeceased && (
                <span className="absolute top-1 right-2 text-[9px] bg-slate-200 text-slate-700 px-1 rounded font-medium">
                  Alm.
                </span>
              )}
              <div className="flex items-center gap-2">
                {renderAvatar(spouse, 'sm')}
                <div className="min-w-0 flex-1">
                  <h6 className="text-[12px] font-bold text-slate-800 line-clamp-1 group-hover:text-rose-900 leading-tight">
                    {spouse.name}
                  </h6>
                  <p className="text-[10px] text-slate-500 leading-none mt-1">
                    {spouse.birthDate ? new Date(spouse.birthDate).getFullYear() : 'Tgl Lahir?'}
                    {spouseAge > 0 && ` (${spouseAge} th)`}
                  </p>
                  {spouse.occupation && (
                    <p className="text-[9px] text-slate-400 truncate mt-0.5 max-w-[100px]">
                      {spouse.occupation}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    );
  };

  // Find children of a couple (either spouse is the parent)
  const getChildrenOfCouple = (parent: FamilyMember) => {
    return members.filter(m => m.parentId === parent.id || (parent.spouseId && m.parentId === parent.spouseId));
  };

  // Recursive Tree Rendering Card Component
  const renderTreeBranch = (node: FamilyMember) => {
    const children = getChildrenOfCouple(node);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedNodes.has(node.id);

    return (
      <div className="flex flex-col items-center">
        {/* The Node Couple / Individual Card Container */}
        <div className="relative flex flex-col items-center">
          {renderNodeCouple(node)}

          {/* Expand/Collapse Toggle Button */}
          {hasChildren && (
            <button
              onClick={(e) => toggleCollapse(node.id, e)}
              className="absolute -bottom-3 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-purple-200 bg-white shadow-sm hover:bg-purple-50 transition-all text-purple-600 outline-none"
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Children Rows */}
        {hasChildren && !isCollapsed && (
          <div className="pt-6 relative flex flex-col items-center">
            {/* Horizontal branch connection lines */}
            {children.length > 1 && (
              <div className="absolute top-0 h-[2px] bg-purple-300" 
                   style={{ 
                     width: `calc(100% - ${100 / children.length}% - 8px)`,
                     left: `${50 / children.length}%`
                   }} 
              />
            )}
            {/* Vertical connector from parent union to horizontal bar */}
            <div className="absolute -top-[24px] w-[2px] h-[24px] bg-purple-300" />

            <div className="flex flex-row items-start justify-center gap-8 relative">
              {children.map((child) => {
                // Determine if this is a secondary parent of its own sub-branch
                // To avoid drawing duplicates, we only render the child once, even if they have spouse.
                // Their spouse is rendered side-by-side inside renderNodeCouple.
                // Skip if this child is already listed as a spouse of someone else rendered at the root level, 
                // but usually, parents are root, and spouses are linked.
                return (
                  <div key={child.id} className="relative flex flex-col items-center">
                    {/* Vertical line entry to child */}
                    <div className="absolute -top-[24px] w-[2px] h-[24px] bg-purple-300" />
                    {renderTreeBranch(child)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Selected details sidebar
  const selectedMember = useMemo(() => {
    return members.find(m => m.id === selectedMemberId);
  }, [selectedMemberId, members]);

  // Family details relationships (father, mother, spouse, children)
  const relationships = useMemo(() => {
    if (!selectedMember) return null;
    
    // Find spouse
    const spouse = selectedMember.spouseId ? memberMap.get(selectedMember.spouseId) : null;
    
    // Find parent (mother or father)
    const parentPrimary = selectedMember.parentId ? memberMap.get(selectedMember.parentId) : null;
    const parentSecondary = parentPrimary?.spouseId ? memberMap.get(parentPrimary.spouseId) : null;
    
    let father: FamilyMember | null = null;
    let mother: FamilyMember | null = null;

    if (parentPrimary) {
      if (parentPrimary.gender === 'L') father = parentPrimary;
      else mother = parentPrimary;
    }
    if (parentSecondary) {
      if (parentSecondary.gender === 'L') father = parentSecondary;
      else mother = parentSecondary;
    }

    // Find children
    const children = getChildrenOfCouple(selectedMember);

    // Brothers and Sisters (Siblings)
    const siblings = selectedMember.parentId 
      ? members.filter(m => m.id !== selectedMember.id && (m.parentId === selectedMember.parentId || (parentPrimary?.spouseId && m.parentId === parentPrimary.spouseId)))
      : [];

    return { father, mother, spouse, children, siblings };
  }, [selectedMember, members, memberMap]);

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[600px] border border-stone-200 rounded-2xl overflow-hidden bg-stone-50">
      
      {/* Dynamic Visual Tree Board */}
      <div className="flex-1 relative overflow-auto p-4 flex flex-col min-h-[500px]" id="tree-container">
        
        {/* Navigation / Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white/80 backdrop-blur-md p-3 rounded-xl border border-stone-100 shadow-sm z-30 mb-4 sticky top-0">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 leading-none">
              <Users className="w-4 h-4 text-purple-600" /> 
              Visual Silsilah Keluarga
            </h4>
            <p className="text-[11px] text-stone-500 mt-1 leading-none">
              Akar: <strong className="text-purple-700">{activeRoot?.name || 'Grand Ancestor'}</strong>
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 self-center">
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition border cursor-pointer
                ${isExporting
                  ? 'bg-stone-150 text-stone-400 border-stone-200'
                  : 'bg-purple-800 text-white border-purple-900 hover:bg-purple-900 shadow-sm'
                }`}
              title="Unduh Pohon Silsilah (PDF)"
            >
              <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-spin' : ''}`} />
              {isExporting ? 'Memproses...' : 'Unduh PDF'}
            </button>
            <div className="h-6 w-[1px] bg-stone-200" />
            {rootId && (
              <button 
                onClick={() => setRootId(null)}
                className="btn-stone flex items-center gap-1 text-[11px] px-2 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg font-medium transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Back to Root
              </button>
            )}
            <div className="h-6 w-[1px] bg-stone-200" />
            <button 
              onClick={zoomOut}
              className="p-1.5 hover:bg-stone-100 border border-stone-200 text-slate-600 rounded-lg bg-white transition shadow-sm"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium text-stone-500 px-1 select-none">
              {Math.round(scale * 100)}%
            </span>
            <button 
              onClick={zoomIn}
              className="p-1.5 hover:bg-stone-100 border border-stone-200 text-slate-600 rounded-lg bg-white transition shadow-sm"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              onClick={resetZoom}
              className="p-1.5 hover:bg-stone-100 border border-stone-200 text-slate-600 rounded-lg bg-white transition shadow-sm"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Zooming Tree Panel */}
        <div className="flex-1 flex items-center justify-center p-8 bg-[#FAF6EE] border border-stone-100 rounded-xl overflow-auto select-none">
          {activeRoot ? (
            <div 
              id="family-tree-capture"
              style={{ 
                transform: `scale(${scale})`, 
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease'
              }}
              className="py-12 px-6 flex items-start justify-center min-w-max bg-[#FAF6EE]"
            >
              {renderTreeBranch(activeRoot)}
            </div>
          ) : (
            <div className="text-center p-8 text-stone-400">
              <AlertCircle className="w-12 h-12 text-stone-300 mx-auto mb-2" />
              <p className="text-sm">Belum ada data keluarga. Tambahkan anggota pertama di manajemen data.</p>
            </div>
          )}
        </div>

        {/* Help Tip Overlay */}
        <div className="absolute bottom-6 left-6 z-20 hidden md:flex items-center gap-2 bg-white/90 backdrop-blur border border-stone-200/60 rounded-full px-3 py-1 text-[11px] text-stone-500 shadow-sm leading-none select-none">
          <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
          <span>Klik salah satu anggota keluarga untuk melihat rincian silsilah lengkap di panel sebelah kanan.</span>
        </div>
      </div>

      {/* Info Panel Profile Side-Card */}
      <AnimatePresence mode="wait">
        {selectedMember ? (
          <motion.div 
            key={selectedMember.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-stone-200 bg-white p-6 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-6">
              {/* Profile Header Header */}
              <div className="flex items-start gap-4 pb-4 border-b border-stone-100">
                {selectedMember.photoUrl ? (
                  <img 
                    src={selectedMember.photoUrl} 
                    alt={selectedMember.name} 
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border-4 border-purple-50 shadow-md ring-1 ring-purple-100"
                  />
                ) : (
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-lg border-4 border-purple-50 shadow-md ring-1 ring-purple-100 
                    ${selectedMember.gender === 'L' ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'}`}>
                    {getInitials(selectedMember.name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className={`inline-block text-[10px] uppercase font-bold py-0.5 px-2 rounded-full mb-1 border
                    ${selectedMember.gender === 'L' 
                      ? 'bg-sky-50 text-sky-700 border-sky-100' 
                      : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                    {selectedMember.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                  <h3 className="text-base font-bold text-slate-800 leading-snug break-words">
                    {selectedMember.name}
                  </h3>
                  {selectedMember.isDeceased && (
                    <span className="inline-block mt-1 text-[10px] text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded font-semibold scale-95 origin-left">
                      Almarhum/ah
                    </span>
                  )}
                </div>
              </div>

              {/* General Metadata */}
              <div className="space-y-2 text-xs">
                {/* Birthdate & Birthplace */}
                <div className="flex items-center gap-2.5 text-slate-600">
                  <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-700 block text-[11px] leading-tight text-stone-400">TANGGAL LAHIR</span>
                    {selectedMember.birthDate 
                      ? `${new Date(selectedMember.birthDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} (${calculateAge(selectedMember.birthDate)} Tahun)`
                      : 'Belum diisi'}
                  </div>
                </div>

                {selectedMember.birthPlace && (
                  <div className="flex items-center gap-2.5 text-slate-600 pt-1.5">
                    <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-700 block text-[11px] leading-tight text-stone-400">TEMPAT LAHIR</span>
                      {selectedMember.birthPlace}
                    </div>
                  </div>
                )}

                {selectedMember.occupation && (
                  <div className="flex items-center gap-2.5 text-slate-600 pt-1.5">
                    <Briefcase className="w-4 h-4 text-stone-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-700 block text-[11px] leading-tight text-stone-400">PEKERJAAN</span>
                      {selectedMember.occupation}
                    </div>
                  </div>
                )}
              </div>

              {/* Bio Notes */}
              {selectedMember.notes && (
                <div className="bg-stone-50 border border-stone-200/60 p-3 rounded-xl text-xs text-stone-600">
                  <span className="font-bold text-[10px] text-stone-400 uppercase tracking-widest block mb-1">Catatan</span>
                  <p className="italic leading-relaxed">{selectedMember.notes}</p>
                </div>
              )}

              {/* Visual Pedigree Relations Lists */}
              {relationships && (
                <div className="border-t border-stone-100 pt-4 space-y-3.5">
                  <h4 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">Hubungan Keluarga</h4>
                  
                  {/* Husband / Wife */}
                  {relationships.spouse && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-red-50/40 border border-red-100 text-xs">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500 fill-red-500 shrink-0" />
                        <span className="text-slate-600">Pasangan:</span>
                        <strong className="text-slate-800 truncate max-w-[130px]">{relationships.spouse.name}</strong>
                      </div>
                      <button 
                        onClick={() => onSelectMember(relationships.spouse!)}
                        className="text-purple-600 hover:text-purple-800 text-[10px] font-semibold flex items-center"
                      >
                        Lihat <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                      </button>
                    </div>
                  )}

                  {/* Father Code */}
                  {relationships.father && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50/30 border border-sky-100/80 text-xs">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-sky-500 shrink-0" />
                        <span className="text-slate-600">Ayah:</span>
                        <strong className="text-slate-800 truncate max-w-[130px]">{relationships.father.name}</strong>
                      </div>
                      <button 
                        onClick={() => onSelectMember(relationships.father!)}
                        className="text-purple-600 hover:text-purple-800 text-[10px] font-semibold flex items-center"
                      >
                        Lihat <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                      </button>
                    </div>
                  )}

                  {/* Mother Code */}
                  {relationships.mother && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/30 border border-rose-100/80 text-xs">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="text-slate-600">Ibu:</span>
                        <strong className="text-slate-800 truncate max-w-[130px]">{relationships.mother.name}</strong>
                      </div>
                      <button 
                        onClick={() => onSelectMember(relationships.mother!)}
                        className="text-purple-600 hover:text-purple-800 text-[10px] font-semibold flex items-center"
                      >
                        Lihat <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                      </button>
                    </div>
                  )}

                  {/* Children count */}
                  {relationships.children.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
                        <Baby className="w-3.5 h-3.5" /> Anak-anak ({relationships.children.length})
                      </div>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1 border border-stone-100/60 p-1.5 rounded-lg bg-stone-50/40">
                        {relationships.children.map(ch => (
                          <div 
                            key={ch.id} 
                            onClick={() => onSelectMember(ch)}
                            className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-stone-100 text-[11px] leading-tight"
                          >
                            <span className="truncate max-w-[170px] text-slate-700 font-medium">{ch.name}</span>
                            <span className="text-purple-600 font-semibold text-[10px]">Lihat</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Siblings Count */}
                  {relationships.siblings.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] font-bold text-stone-400">
                        Saudara Kandung ({relationships.siblings.length})
                      </div>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1 border border-stone-100/60 p-1.5 rounded-lg bg-stone-50/40">
                        {relationships.siblings.map(sib => (
                          <div 
                            key={sib.id} 
                            onClick={() => onSelectMember(sib)}
                            className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-stone-100 text-[11px] leading-tight"
                          >
                            <span className="truncate max-w-[170px] text-slate-700 font-medium">{sib.name}</span>
                            <span className="text-purple-600 font-semibold text-[10px]">Lihat</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Action Shortcuts footer */}
            <div className="mt-8 border-t border-stone-100 pt-4 flex flex-col gap-2">
              <button
                onClick={() => setRootId(selectedMember.id)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition"
              >
                <Users className="w-3.5 h-3.5" /> Jadikan Fokus Silsilah
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAddRelative(selectedMember, 'child')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-stone-100 text-slate-700 rounded-lg text-[11px] font-medium hover:bg-stone-200 hover:text-slate-800 transition"
                >
                  <Plus className="w-3 h-3 text-purple-600" /> Tambah Anak
                </button>
                <button
                  onClick={() => onAddRelative(selectedMember, 'spouse')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-stone-100 text-slate-700 rounded-lg text-[11px] font-medium hover:bg-stone-200 hover:text-slate-800 transition"
                  disabled={!!selectedMember.spouseId}
                  title={selectedMember.spouseId ? 'Sudah memiliki pasangan' : 'Tambah pasangan baru'}
                >
                  <Plus className="w-3 h-3 text-purple-600" /> + Pasangan
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-stone-200 bg-white p-6 shadow-xl flex flex-col justify-center items-center text-center">
            <div className="space-y-2 max-w-xs">
              <Users className="w-12 h-12 text-stone-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Detail Anggota Silsilah</h4>
              <p className="text-xs text-stone-500">
                Pilih salah satu anggota silsilah keluarga di pohon interaktif untuk memuat profil lengkap, hubungan keluarga, silsilah keturunan, dan meluncurkan relasi dinamis.
              </p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

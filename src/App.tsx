/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, Users, Settings, Code, FileSpreadsheet, Share2, 
  HelpCircle, Sparkles, BookOpen, Clock, Heart, Download
} from 'lucide-react';
import { FamilyMember } from './types';
import { initialFamilyData } from './data/initialData';

// Subcomponents
import Dashboard from './components/Dashboard';
import FamilyTree from './components/FamilyTree';
import AdminPanel from './components/AdminPanel';
import AppsScriptExporter from './components/AppsScriptExporter';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tree' | 'admin' | 'exporter'>('dashboard');
  
  // Database state in-memory persisted to localStorage
  const [members, setMembers] = useState<FamilyMember[]>([]);

  // Selected member for detail visual highlight in Tree
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(undefined);

  // Intent form preloads
  const [formPreload, setFormPreload] = useState<{
    relativeId: string;
    relationType: 'child' | 'spouse';
  } | null>(null);

  // Initialize and load base data on startup
  useEffect(() => {
    const localData = localStorage.getItem('silsilah_keluarga_data');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMembers(parsed);
          // Set patriarch/root selected on first render if available
          const patriarch = parsed.find(m => !m.parentId);
          if (patriarch) setSelectedMemberId(patriarch.id);
          return;
        }
      } catch (err) {
        console.error('Failed to parse localStorage family tree, setting mock data...', err);
      }
    }
    
    // Fallback/First load with Wardoyo family tree demo
    setMembers(initialFamilyData);
    localStorage.setItem('silsilah_keluarga_data', JSON.stringify(initialFamilyData));
    const patriarch = initialFamilyData.find(m => !m.parentId);
    if (patriarch) setSelectedMemberId(patriarch.id);
  }, []);

  // Save changes to database
  const saveMembersList = (updatedMembers: FamilyMember[]) => {
    setMembers(updatedMembers);
    localStorage.setItem('silsilah_keluarga_data', JSON.stringify(updatedMembers));
  };

  // 1. ADD / EDIT CRUD action
  const handleSaveMember = (savedMember: FamilyMember) => {
    const existsIndex = members.findIndex(m => m.id === savedMember.id);
    let updated = [...members];

    if (existsIndex >= 0) {
      // update
      const previousMember = members[existsIndex];
      updated[existsIndex] = savedMember;

      // Symmetrical spouse update
      // If we are setting this member's spouse to spouseId, update that spouse's spouseId to this member's ID
      if (savedMember.spouseId) {
        const spouseIndex = updated.findIndex(m => m.id === savedMember.spouseId);
        if (spouseIndex >= 0) {
          updated[spouseIndex] = { ...updated[spouseIndex], spouseId: savedMember.id };
        }
      } else if (previousMember.spouseId) {
        // if we removed a spouse, remove the reference on the previous spouse as well
        const prevSpouseIdx = updated.findIndex(m => m.id === previousMember.spouseId);
        if (prevSpouseIdx >= 0) {
          updated[prevSpouseIdx] = { ...updated[prevSpouseIdx], spouseId: undefined };
        }
      }
    } else {
      // insert new
      updated.push(savedMember);

      // Symmetrical spouse update
      if (savedMember.spouseId) {
        const spouseIndex = updated.findIndex(m => m.id === savedMember.spouseId);
        if (spouseIndex >= 0) {
          updated[spouseIndex] = { ...updated[spouseIndex], spouseId: savedMember.id };
        }
      }
    }

    saveMembersList(updated);
    
    // Automatically select the saved member
    setSelectedMemberId(savedMember.id);
  };

  // 2. DELETE CRUD action
  const handleDeleteMember = (memberId: string) => {
    let updated = members.filter(m => m.id !== memberId);

    // Clean references
    updated = updated.map(m => {
      let copy = { ...m };
      if (copy.parentId === memberId) delete copy.parentId;
      if (copy.spouseId === memberId) delete copy.spouseId;
      return copy;
    });

    saveMembersList(updated);
    
    if (selectedMemberId === memberId) {
      setSelectedMemberId(updated[0]?.id);
    }
  };

  // 3. Tree detailed panel quick-add relative triggers
  const handleAddRelativeTrigger = (relative: FamilyMember, relationType: 'child' | 'spouse') => {
    setFormPreload({
      relativeId: relative.id,
      relationType
    });
    // Navigate straight to the admin form panel
    setActiveTab('admin');
  };

  // 4. Quick navigation jumping to member highlighted
  const handleSelectAndNavigateToTree = (member: FamilyMember) => {
    setSelectedMemberId(member.id);
    setActiveTab('tree');
  };

  // Fully reset silsilah back to initial demo data
  const handleResetToDemo = () => {
    if (window.confirm('Reset seluruh silsilah keluarga kembali ke data demo Keluarga Wardoyo (4 Generasi)? Perubahan Anda saat ini akan ditimpa.')) {
      saveMembersList(initialFamilyData);
      const patriarch = initialFamilyData.find(m => !m.parentId);
      if (patriarch) setSelectedMemberId(patriarch.id);
      setActiveTab('dashboard');
    }
  };

  // Backup exporter as JSON file download
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(members, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "silsilah_keluarga_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="applet-viewport" className="min-h-screen bg-[#FAF6EE] text-slate-800 flex flex-col font-sans transition-all duration-300">
      
      {/* Top Beautiful Navigation Header Bar */}
      <header id="applet-header" className="bg-white/80 backdrop-blur-md border-b border-stone-250 sticky top-0 z-50 shadow-sm px-6 py-4 flex items-center justify-between">
        
        {/* Brand logo block */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-755 text-white flex items-center justify-center shadow-lg bg-gradient-to-tr from-purple-800 to-indigo-700">
            <span className="text-xl animate-pulse">🌳</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-800 flex items-center gap-1">
              Silsilah Keluarga
            </h1>
            <p className="text-[10px] text-stone-400 font-medium">
              Aplikasi Dokumentasi & Visualisasi Silsilah Interaktif
            </p>
          </div>
        </div>

        {/* Tab switcher buttons bar */}
        <nav className="flex items-center gap-1 bg-stone-100 p-1.5 rounded-xl border border-stone-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition
              ${activeTab === 'dashboard' 
                ? 'bg-purple-800 text-white shadow' 
                : 'text-slate-650 hover:bg-stone-50 hover:text-slate-800'}`}
          >
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition
              ${activeTab === 'tree' 
                ? 'bg-purple-800 text-white shadow' 
                : 'text-slate-650 hover:bg-stone-50 hover:text-slate-800'}`}
          >
            <Users className="w-3.5 h-3.5" /> Pohon Visual
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition
              ${activeTab === 'admin' 
                ? 'bg-purple-800 text-white shadow' 
                : 'text-slate-650 hover:bg-stone-50 hover:text-slate-800'}`}
          >
            <Settings className="w-3.5 h-3.5" /> Kelola Data
          </button>

          <button
            onClick={() => setActiveTab('exporter')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition
              ${activeTab === 'exporter' 
                ? 'bg-purple-800 text-white shadow' 
                : 'text-slate-650 hover:bg-stone-50 hover:text-slate-800'}`}
            title="Google Apps Script Exporter"
          >
            <Code className="w-3.5 h-3.5" /> Apps Script Exporter
          </button>
        </nav>

        {/* Action utility header items (Reset Demo / Backup export) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportJSON}
            className="p-2 hover:bg-stone-50 border border-stone-200 rounded-xl text-slate-600 transition"
            title="Download Backup Database (.json)"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetToDemo}
            className="text-[11px] font-bold px-3 py-2 bg-[#FAF6EE] text-purple-800 hover:bg-purple-100 border border-purple-200 rounded-xl transition"
            title="Reset data kembali ke Keluarga Wardoyo"
          >
            Reset Demo
          </button>
        </div>

      </header>

      {/* Main Content Area Panel Wrapper */}
      <main id="applet-main" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-20">
        
        {/* Render Tab Views smoothly */}
        <div className="animate-fade-in">
          {activeTab === 'dashboard' && (
            <Dashboard 
              members={members}
              onNavigateToTab={setActiveTab}
              onSelectAndNavigate={handleSelectAndNavigateToTree}
              onQuickAdd={() => setActiveTab('admin')}
            />
          )}

          {activeTab === 'tree' && (
            <FamilyTree 
              members={members}
              onSelectMember={(m) => setSelectedMemberId(m.id)}
              onAddRelative={handleAddRelativeTrigger}
              selectedMemberId={selectedMemberId}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPanel 
              members={members}
              onSaveMember={handleSaveMember}
              onDeleteMember={handleDeleteMember}
              formPreload={formPreload}
              onClearPreload={() => setFormPreload(null)}
            />
          )}

          {activeTab === 'exporter' && (
            <AppsScriptExporter />
          )}
        </div>

      </main>

      {/* Humble visual footer credit */}
      <footer className="py-4 text-center border-t border-stone-200 bg-white text-[11px] text-stone-400 font-sans leading-none select-none mt-auto">
        <span>Silsilah Keluarga v1.0.0 • Diuji Menggunakan React + Tailwind CSS</span>
      </footer>

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  Users, Layers, Award, Sparkles, Plus, Calendar, ArrowRight,
  TrendingUp, UserCheck, UserX, Gift, Clock, Download, FileSpreadsheet
} from 'lucide-react';
import { FamilyMember, FamilyStats } from '../types';
import { calculateFamilyStats, getUpcomingBirthdays } from '../utils';

interface DashboardProps {
  members: FamilyMember[];
  onNavigateToTab: (tab: 'tree' | 'admin' | 'exporter') => void;
  onSelectAndNavigate: (member: FamilyMember) => void;
  onQuickAdd: () => void;
}

export default function Dashboard({
  members,
  onNavigateToTab,
  onSelectAndNavigate,
  onQuickAdd
}: DashboardProps) {
  
  // Calculate Family Statistics
  const stats = useMemo(() => {
    return calculateFamilyStats(members);
  }, [members]);

  // Identify Upcoming Birthdays (within 30 days)
  const birthdays = useMemo(() => {
    return getUpcomingBirthdays(members);
  }, [members]);

  // Gender Percentages
  const malePercent = stats.totalMembers > 0 ? Math.round((stats.maleCount / stats.totalMembers) * 100) : 0;
  const femalePercent = stats.totalMembers > 0 ? Math.round((stats.femaleCount / stats.totalMembers) * 100) : 0;

  // Newest added members (last 3 members based on last indexed elements)
  const recentAdditions = useMemo(() => {
    return [...members].slice(-4).reverse();
  }, [members]);

  return (
    <div className="space-y-6">
      
      {/* Short Summary Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        
        {/* Total Members */}
        <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-400 block font-medium uppercase tracking-wider">Total Anggota</span>
            <div className="flex items-baseline gap-1">
              <h2 className="text-2xl font-bold font-sans text-slate-800">{stats.totalMembers}</h2>
              <span className="text-[10px] text-stone-500 font-medium">jiwa</span>
            </div>
            <p className="text-[10px] text-emerald-600 mt-0.5 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Aktif di silsilah
            </p>
          </div>
        </div>

        {/* Total Generations */}
        <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-400 block font-medium uppercase tracking-wider">Hubungan Generasi</span>
            <div className="flex items-baseline gap-1">
              <h2 className="text-2xl font-bold font-sans text-slate-800">{stats.totalGenerations}</h2>
              <span className="text-[10px] text-stone-500 font-medium">tingkat</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-none">
              Dari leluhur ke cicit
            </p>
          </div>
        </div>

        {/* Gender Breakdown Stats */}
        <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <span className="text-xs text-stone-400 block font-medium uppercase tracking-wider">Sebaran Gender</span>
            <div className="flex items-center gap-3 mt-1 justify-between text-xs font-semibold text-slate-700 leading-none">
              <span>L: {stats.maleCount} ({malePercent}%)</span>
              <span>P: {stats.femaleCount} ({femalePercent}%)</span>
            </div>
            {/* Split Progressbar */}
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1.5 flex">
              <div style={{ width: `${malePercent}%` }} className="bg-sky-400 h-full" />
              <div style={{ width: `${femalePercent}%` }} className="bg-rose-400 h-full" />
            </div>
          </div>
        </div>

        {/* Live vs Deceased counts */}
        <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-stone-100 text-stone-700 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <span className="text-xs text-stone-400 block font-medium uppercase tracking-wider">Status Hidup / Alm.</span>
            <div className="flex items-center justify-between text-xs mt-1.5">
              <span className="flex items-center gap-1 text-slate-600 font-medium font-mono text-[11px]">
                <UserCheck className="w-3 h-3 text-emerald-500" /> Hidup: {stats.livingCount}
              </span>
              <span className="flex items-center gap-1 text-slate-400 font-medium font-mono text-[11px]">
                <UserX className="w-3 h-3 text-stone-400" /> Alm: {stats.deceasedCount}
              </span>
            </div>
            {/* Flat distribution bar */}
            <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden mt-1.5">
              <div 
                style={{ width: `${stats.totalMembers > 0 ? (stats.livingCount / stats.totalMembers) * 100 : 0}%` }} 
                className="bg-emerald-400 h-full" 
              />
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid Content Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Shortcut action banners and birthday widgets */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Quick Action Welcome Callout */}
          <div className="relative bg-gradient-to-r from-violet-900 to-purple-800 text-white p-6 rounded-3xl overflow-hidden shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left z-10">
              <span className="inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                Dunia Silsilah & Silsilah Anda
              </span>
              <h2 className="text-lg md:text-xl font-bold font-sans tracking-tight">
                Dokumentasikan Garis Keturunan Keluarga Besar
              </h2>
              <p className="text-xs text-purple-200 max-w-md leading-relaxed font-sans font-normal">
                Gunakan aplikasi web interaktif ini untuk menyimpan database keluarga Anda, melihat visual pohon silsilah, dan mengekspor kode siap pasang untuk Google Apps Script Anda.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2.5 shrink-0 w-full md:w-auto z-10">
              <button
                onClick={onQuickAdd}
                className="flex items-center justify-center gap-1.5 bg-white text-purple-900 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-stone-50 transition"
              >
                <Plus className="w-4 h-4 text-purple-700" /> Anggota Baru
              </button>
              <button
                onClick={() => onNavigateToTab('tree')}
                className="flex items-center justify-center gap-1.5 bg-purple-700/60 border border-purple-400/40 text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-purple-700 transition"
              >
                Lihat Pohon <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Ambient Background Bubbles */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-32 -mt-32" />
            <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-purple-500/10 rounded-full blur-xl -ml-16 -mb-16" />
          </div>

          {/* Silsilah Generational Distribution and Recent Additions list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Generational Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1 text-indigo-800 leading-none">
                  <Layers className="w-4 h-4" /> Sebaran Anggota per Generasi
                </h4>
                <p className="text-[11px] text-stone-500 mb-4 font-sans">
                  Grafik tingkat silsilah keturunan terdaftar mulai dari Kakek/Nenek (tingkat 1).
                </p>
              </div>

              <div className="space-y-2">
                {stats.ageDistribution.map((gen) => (
                  <div key={gen.generationIndex} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                      <span>Generasi {gen.generationIndex}</span>
                      <strong className="text-indigo-700">{gen.count} Orang</strong>
                    </div>
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${stats.totalMembers > 0 ? (gen.count / stats.totalMembers) * 100 : 0}%` }} 
                        className="bg-indigo-500 h-full rounded-full" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Additions List */}
            <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-orange-850 leading-none">
                <Clock className="w-4 h-4 text-orange-500" /> Penambahan Terbaru
              </h4>
              <p className="text-[11px] text-stone-500 mb-3.5 font-sans">
                Anggota keluarga yang baru saja didokumentasikan di database.
              </p>

              <div className="divide-y divide-stone-100">
                {recentAdditions.map((m) => (
                  <div 
                    key={m.id} 
                    onClick={() => onSelectAndNavigate(m)}
                    className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0 cursor-pointer group hover:bg-stone-50/50 rounded-lg px-1"
                  >
                    <div className={`w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0
                      ${m.gender === 'L' ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'}`}>
                      {m.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h6 className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight group-hover:text-purple-700">
                        {m.name}
                      </h6>
                      <p className="text-[9px] text-stone-400 mt-0.5">
                        {m.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • {m.occupation || 'Hubungan Keluarga'}
                      </p>
                    </div>
                    <span className="text-[9px] bg-stone-100 group-hover:bg-purple-100 text-stone-500 group-hover:text-purple-700 px-2 py-0.5 rounded font-semibold transition">
                      Profil
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Upcoming Birthdays List */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Birthdays Panel Section */}
          <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex flex-col h-full min-h-[300px]">
            <div className="border-b border-stone-100 pb-3 mb-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-purple-900 leading-none">
                <Gift className="w-4 h-4 text-purple-600 animate-bounce" /> Ulang Tahun Mendatang
              </h4>
              <p className="text-[11px] text-stone-500 mt-1 leading-normal font-sans">
                Anggota keluarga yang berulang tahun dalam waktu dekat (30 hari berikutnya).
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {birthdays.length > 0 ? (
                birthdays.map((alert) => (
                  <div 
                    key={alert.member.id}
                    onClick={() => onSelectAndNavigate(alert.member)}
                    className="flex justify-between items-center p-2.5 rounded-xl border border-stone-100 bg-stone-50/20 hover:bg-purple-50/20 hover:border-purple-100 cursor-pointer group transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h6 className="text-[11.5px] font-bold text-slate-800 leading-tight truncate group-hover:text-purple-700">
                          {alert.member.name}
                        </h6>
                        <p className="text-[9.5px] text-stone-400 mt-0.5">
                          Ultah ke-{alert.turningAge} • {alert.member.birthDate ? new Date(alert.member.birthDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded-full leading-none
                        ${alert.daysRemaining === 0 
                          ? 'bg-red-500 text-white animate-pulse' 
                          : alert.daysRemaining <= 7 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-stone-100 text-stone-600'}`}>
                        {alert.daysRemaining === 0 ? 'Hari ini! 🎉' : `${alert.daysRemaining} hari lagi`}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-stone-400 flex flex-col justify-center items-center">
                  <Gift className="w-10 h-10 text-stone-200 mb-2" />
                  <p className="text-xs">Tidak ada ulang tahun dalam 30 hari ke depan.</p>
                </div>
              )}
            </div>

            {/* Small statistics note */}
            <div className="border-t border-stone-100 pt-3 mt-4 text-[10px] text-stone-400 font-sans italic flex items-center gap-1 select-none">
              <Clock className="w-3.5 h-3.5 text-stone-300" />
              <span>Diperbarui secara real-time berdasarkan waktu sistem.</span>
            </div>
          </div>

        </div>

      </div>

      {/* Guide Banner: Quick export option */}
      <div className="bg-[#FAF6EE] border border-[#f3ebde] rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="flex gap-3 items-start">
          <div className="p-2 bg-[#F5EFEB] text-purple-800 border border-[#e8dfcf] rounded-xl shrink-0 mt-0.5">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-purple-950 font-sans leading-tight">Miliki Aplikasi ini di Google Cloud / Apps Script Anda sendiri?</h5>
            <p className="text-[11px] text-stone-500 mt-1 max-w-xl font-sans">
              Anda menginginkan silsilah ini sinkron dengan **Google Sheets** dan mengunggah gambar ke **Google Drive**? Kami telah menyediakan generator Kode Apps Script sekali klik di tab Exporter!
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateToTab('exporter')}
          className="flex items-center gap-1.5 px-3.5 py-2 hover:bg-purple-900 bg-purple-750 text-white border border-purple-800 rounded-xl text-xs font-semibold shrink-0 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Buka Apps Script Exporter
        </button>
      </div>

    </div>
  );
}

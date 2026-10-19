import React from 'react';
import {
  Mic2,
  Sparkles,
  Cloud,
  History,
  MessageSquare,
  Globe2,
  User,
  Sliders,
  Radio,
} from 'lucide-react';
import { UserProfile } from '../types';
import { Logo } from './Logo';

interface Props {
  activeTab: 'single' | 'dialogue' | 'history';
  setActiveTab: (tab: 'single' | 'dialogue' | 'history') => void;
  lang: 'km' | 'en';
  setLang: (lang: 'km' | 'en') => void;
  user: UserProfile;
  onOpenUserModal: () => void;
  historyCount: number;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  user,
  onOpenUserModal,
  historyCount,
}) => {
  const isKm = lang === 'km';

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Logo size={42} glow={true} className="hover:scale-105 transition-transform duration-300" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                  KhmerVoice <span className="text-amber-400">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Gemini 3.8 Flash TTS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {isKm
                  ? 'ប្រព័ន្ធបំប្លែងអត្ថបទទៅជាសំឡេង AI គុណភាពខ្ពស់'
                  : 'Ultra High-Definition AI Speech Synthesis'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'single'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Mic2 className="w-3.5 h-3.5" />
              <span>{isKm ? 'ស្ទូឌីយោទូទៅ' : 'Studio TTS'}</span>
            </button>

            <button
              onClick={() => setActiveTab('dialogue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'dialogue'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isKm ? 'កិច្ចសន្ទនា ២នាក់' : 'Dialogue'}</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition relative ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{isKm ? 'ប្រវត្តិការងារ' : 'Library'}</span>
              {historyCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-500/30 text-indigo-200">
                  {historyCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Utilities: Cloud Status, Language Switch, User Account */}
          <div className="flex items-center gap-2.5">
            {/* Cloud speed tag */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Cloud className="w-3 h-3" />
              <span>{isKm ? 'Cloud AI លឿនរហ័ស' : 'Cloud Engine Active'}</span>
            </div>

            {/* Language Toggle */}
            <button
              onClick={() => setLang(isKm ? 'en' : 'km')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition"
              title="Change Language"
            >
              <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold uppercase">{isKm ? 'KM' : 'EN'}</span>
            </button>

            {/* User Account Trigger */}
            <button
              onClick={onOpenUserModal}
              className="flex items-center gap-2 p-1.5 pl-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-left transition group"
            >
              <div className="hidden md:block">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition">
                  {user.name}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">PRO</div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 p-0.5">
                <div className="w-full h-full rounded-[6px] bg-slate-950 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {user.name.slice(0, 2)}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

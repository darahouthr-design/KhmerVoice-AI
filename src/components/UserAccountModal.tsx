import React, { useState } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  HardDrive,
  BarChart3,
  Sparkles,
  Calendar,
  X,
  Edit2,
  Check,
  Cloud,
  LogOut,
  Layers,
} from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  historyCount: number;
  lang: 'km' | 'en';
}

export const UserAccountModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  historyCount,
  lang,
}) => {
  if (!isOpen) return null;

  const isKm = lang === 'km';
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);
  const [emailInput, setEmailInput] = useState(user.email);

  const handleSave = () => {
    onUpdateUser({ name: nameInput, email: emailInput });
    setIsEditing(false);
  };

  const storagePercent = Math.min(100, (user.cloudStorageUsedMb / user.cloudStorageLimitMb) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isKm ? 'គណនីអ្នកប្រើប្រាស់ & Cloud Storage' : 'User Account & Cloud Space'}
              </h3>
              <p className="text-xs text-slate-400">
                {isKm ? 'ប្រវត្តិការងារ និងស្ថិតិត្រូវបានភ្ជាប់ជាមួយគណនីរបស់អ្នក' : 'Your workspace history & voice synthesis statistics'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="mt-5 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/30">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-lg font-bold text-white uppercase">
                  {user.name.slice(0, 2)}
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" title="Active Cloud Session" />
            </div>

            <div>
              {isEditing ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="px-2 py-1 text-xs bg-slate-950 border border-indigo-500/50 rounded text-white focus:outline-none"
                    placeholder="ឈ្មោះអ្នកប្រើ"
                  />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="px-2 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-slate-300 focus:outline-none block"
                    placeholder="អ៊ីមែល"
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{user.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      PRO
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>{user.email}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            {isEditing ? (
              <button
                onClick={handleSave}
                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow"
              >
                <Check className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
                title={isKm ? 'កែប្រែគណនី' : 'Edit profile'}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Cloud Storage Usage */}
        <div className="mt-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <HardDrive className="w-4 h-4 text-sky-400" />
              {isKm ? 'ទំហំ Cloud Storage' : 'Cloud Storage Allocation'}
            </span>
            <span className="font-mono text-xs text-sky-400">
              {user.cloudStorageUsedMb.toFixed(1)} MB / {user.cloudStorageLimitMb} MB ({storagePercent.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
            <span>{isKm ? 'ប្រព័ន្ធ Cloud ល្បឿនលឿន' : 'Ultra-fast Cloud Cache'}</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Cloud className="w-3 h-3" />
              {isKm ? 'ធ្វើសមកាលកម្មរួចរាល់' : 'Synced'}
            </span>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center">
            <div className="text-lg font-bold text-indigo-400 font-mono">
              {historyCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isKm ? 'ឯកសារសំឡេង' : 'Saved Clips'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center">
            <div className="text-lg font-bold text-sky-400 font-mono">
              {(user.totalCharactersGenerated / 1000).toFixed(1)}k
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isKm ? 'តួអក្សរបំប្លែង' : 'Chars Processed'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center">
            <div className="text-lg font-bold text-pink-400 font-mono">
              {Math.round(user.totalAudioGeneratedSeconds / 60)}m
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isKm ? 'នាទីសំឡេង' : 'Minutes of Speech'}
            </div>
          </div>
        </div>

        {/* Plan Features */}
        <div className="mt-4 p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-300 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {isKm ? 'អត្ថប្រយោជន៍គម្រោង Pro Cloud' : 'Pro Cloud Subscription'}
          </div>
          <ul className="space-y-1 text-slate-300 text-[11px]">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {isKm ? 'ម៉ូឌែល Gemini 3.8 Flash TTS ល្បឿនលឿនបំផុត' : 'Gemini 3.8 Flash TTS Flagship Audio Model'}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {isKm ? 'ទាញយកមិនកំណត់ជាទម្រង់ MP3 & WAV (24kHz 16-bit)' : 'Unlimited MP3 & Studio WAV 24kHz Lossless Downloads'}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {isKm ? 'មុខងារកែសម្រួល Pitch, Speed, Equalizer & Reverb' : 'Full DSP Equalizer, Reverb & Live Pitch Modulation'}
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end mt-5 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            {isKm ? 'បិទ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

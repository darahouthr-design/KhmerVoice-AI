import React from 'react';
import { Sliders, Volume2, Music, Waves, RefreshCw, X, Sparkles, Check } from 'lucide-react';
import { AudioEffects } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  effects: AudioEffects;
  onUpdateEffects: (effects: Partial<AudioEffects>) => void;
  onResetEffects: () => void;
  lang: 'km' | 'en';
}

export const AudioEffectsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  effects,
  onUpdateEffects,
  onResetEffects,
  lang,
}) => {
  if (!isOpen) return null;

  const isKm = lang === 'km';

  const applyPreset = (preset: {
    playbackRate?: number;
    pitchSemiTones?: number;
    bassGain?: number;
    trebleGain?: number;
    reverbAmount?: number;
    volume?: number;
  }) => {
    onUpdateEffects(preset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {isKm ? 'ស្ទូឌីយោកែសម្រួលសំឡេង (Audio Tuning Lab)' : 'Studio Audio Tuning Lab'}
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Live DSP
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isKm
                  ? 'កែប្រែស្ទីលសំឡេង Pitch, Speed, Bass, Treble & Reverb ភ្លាមៗ'
                  : 'Real-time pitch shift, tempo, equalizer, and room acoustics'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Style Presets */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {isKm ? 'កំណត់ជាមុនរហ័ស (Quick Presets)' : 'Quick Acoustic Presets'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() =>
                applyPreset({ playbackRate: 1.0, pitchSemiTones: 0, bassGain: 0, trebleGain: 0, reverbAmount: 0 })
              }
              className="p-2 text-left rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 transition"
            >
              <div className="font-semibold text-indigo-400">ធម្មជាតិ (Default)</div>
              <div className="text-[10px] text-slate-400">សំឡេងដើមធម្មតា</div>
            </button>
            <button
              onClick={() =>
                applyPreset({ playbackRate: 0.95, pitchSemiTones: -3, bassGain: 8, trebleGain: 2, reverbAmount: 0.1 })
              }
              className="p-2 text-left rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 transition"
            >
              <div className="font-semibold text-sky-400">វិទ្យុ/ធ្ងន់ (Deep Radio)</div>
              <div className="text-[10px] text-slate-400">សំឡេងធ្ងន់ បាសមាំ</div>
            </button>
            <button
              onClick={() =>
                applyPreset({ playbackRate: 1.05, pitchSemiTones: 3, bassGain: -2, trebleGain: 6, reverbAmount: 0.05 })
              }
              className="p-2 text-left rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 transition"
            >
              <div className="font-semibold text-pink-400">ស្រទន់/ខ្ពស់ (Anime/High)</div>
              <div className="text-[10px] text-slate-400">សំឡេងស្រួយខ្ពស់</div>
            </button>
            <button
              onClick={() =>
                applyPreset({ playbackRate: 1.0, pitchSemiTones: 0, bassGain: 4, trebleGain: 4, reverbAmount: 0.4 })
              }
              className="p-2 text-left rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 transition"
            >
              <div className="font-semibold text-emerald-400">សាលប្រជុំ (Hall Room)</div>
              <div className="text-[10px] text-slate-400">សំឡេងបន្លឺបន្ទរ</div>
            </button>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="mt-5 space-y-4">
          {/* Pitch Shift */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-200 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Music className="w-4 h-4 text-indigo-400" />
                {isKm ? 'កម្រិតតុងសំឡេង (Pitch Shift)' : 'Pitch Shift'}
              </span>
              <span className="font-mono text-indigo-400">
                {effects.pitchSemiTones > 0 ? `+${effects.pitchSemiTones}` : effects.pitchSemiTones} st
              </span>
            </div>
            <input
              type="range"
              min={-12}
              max={12}
              step={1}
              value={effects.pitchSemiTones}
              onChange={(e) => onUpdateEffects({ pitchSemiTones: parseInt(e.target.value, 10) })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>-12 st (ជ្រៅ/ធ្ងន់)</span>
              <span>0 (ដើម)</span>
              <span>+12 st (ខ្ពស់/ស្រួយ)</span>
            </div>
          </div>

          {/* Speed / Rate */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-200 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-sky-400" />
                {isKm ? 'ល្បឿននៃការអាន (Playback Speed)' : 'Playback Speed'}
              </span>
              <span className="font-mono text-sky-400">{effects.playbackRate}x</span>
            </div>
            <div className="flex gap-2 mb-2">
              {[0.75, 0.9, 1.0, 1.15, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => onUpdateEffects({ playbackRate: rate })}
                  className={`flex-1 py-1 text-xs rounded-md border transition ${
                    effects.playbackRate === rate
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.05}
              value={effects.playbackRate}
              onChange={(e) => onUpdateEffects({ playbackRate: parseFloat(e.target.value) })}
              className="w-full accent-sky-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Equalizer (Bass & Treble) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Bass */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs font-medium text-slate-200 mb-1">
                <span>{isKm ? 'សម្លេងបាស (Bass Boost)' : 'Bass Boost'}</span>
                <span className="font-mono text-amber-400">{effects.bassGain > 0 ? `+${effects.bassGain}` : effects.bassGain} dB</span>
              </div>
              <input
                type="range"
                min={-8}
                max={14}
                step={1}
                value={effects.bassGain}
                onChange={(e) => onUpdateEffects({ bassGain: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Treble / Vocal Clarity */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs font-medium text-slate-200 mb-1">
                <span>{isKm ? 'ភាពច្បាស់ (Vocal Clarity)' : 'Treble Clarity'}</span>
                <span className="font-mono text-pink-400">{effects.trebleGain > 0 ? `+${effects.trebleGain}` : effects.trebleGain} dB</span>
              </div>
              <input
                type="range"
                min={-8}
                max={14}
                step={1}
                value={effects.trebleGain}
                onChange={(e) => onUpdateEffects({ trebleGain: parseInt(e.target.value, 10) })}
                className="w-full accent-pink-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Studio Reverb & Master Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Reverb */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs font-medium text-slate-200 mb-1">
                <span>{isKm ? 'បន្ទរស្ទូឌីយោ (Room Reverb)' : 'Studio Reverb'}</span>
                <span className="font-mono text-emerald-400">{Math.round(effects.reverbAmount * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={effects.reverbAmount}
                onChange={(e) => onUpdateEffects({ reverbAmount: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Volume Booster */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs font-medium text-slate-200 mb-1">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  {isKm ? 'កម្រិតសម្លេង (Volume Gain)' : 'Master Gain'}
                </span>
                <span className="font-mono text-indigo-400">{Math.round(effects.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={2.0}
                step={0.05}
                value={effects.volume}
                onChange={(e) => onUpdateEffects({ volume: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={onResetEffects}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {isKm ? 'កំណត់ឡើងវិញ (Reset)' : 'Reset All'}
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 transition"
          >
            <Check className="w-4 h-4" />
            {isKm ? 'អនុវត្ត & រួចរាល់' : 'Apply & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  Sliders,
  Volume2,
  VolumeX,
  FileAudio,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { formatSeconds } from '../utils/downloader';
import { AudioEffects, HistoryItem } from '../types';

interface Props {
  item: HistoryItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  effects: AudioEffects;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onOpenEffectsModal: () => void;
  onDownload: (format: 'mp3' | 'wav') => void;
  onUpdateEffects: (effects: Partial<AudioEffects>) => void;
  lang: 'km' | 'en';
}

export const AudioPlayerBar: React.FC<Props> = ({
  item,
  isPlaying,
  currentTime,
  duration,
  effects,
  onPlay,
  onPause,
  onSeek,
  onOpenEffectsModal,
  onDownload,
  onUpdateEffects,
  lang,
}) => {
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1.0);

  if (!item) return null;

  const isKm = lang === 'km';
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek(val);
  };

  const toggleMute = () => {
    if (isMuted) {
      onUpdateEffects({ volume: prevVolume || 1.0 });
      setIsMuted(false);
    } else {
      setPrevVolume(effects.volume);
      onUpdateEffects({ volume: 0 });
      setIsMuted(true);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Progress scrub bar */}
        <div className="relative group w-full flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400 min-w-9 text-right">
            {formatSeconds(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.05}
              value={currentTime}
              onChange={handleSliderChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
            />
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 rounded-lg pointer-events-none opacity-80"
              style={{ width: `${progressPercent}%`, height: '6px' }}
            />
          </div>
          <span className="text-[11px] font-mono text-slate-400 min-w-9">
            {formatSeconds(duration)}
          </span>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Audio Metadata Info */}
          <div className="flex items-center gap-3 min-w-0 max-w-xs sm:max-w-md">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
              <FileAudio className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate">
                  {item.voiceName} ({item.language.toUpperCase()})
                </span>
                <span className="px-1.5 py-0.2 text-[10px] rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">
                {item.text}
              </p>
            </div>
          </div>

          {/* Main playback buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onSeek(Math.max(0, currentTime - 5))}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={isKm ? 'ថយក្រោយ ៥ វិនាទី' : 'Rewind 5s'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={isPlaying ? onPause : onPlay}
              className="w-11 h-11 rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105 active:scale-95"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              onClick={() => onSeek(Math.min(duration, currentTime + 5))}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={isKm ? 'ទៅមុខ ៥ វិនាទី' : 'Forward 5s'}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Action buttons: Effects, Speed, Volume & Download */}
          <div className="flex items-center gap-2">
            {/* Live Effects Tuning Lab */}
            <button
              onClick={onOpenEffectsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition group"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-45 transition-transform" />
              <span className="hidden sm:inline">
                {isKm ? 'កែសំឡេង (Tuning)' : 'Audio Tuning'}
              </span>
              {(effects.pitchSemiTones !== 0 || effects.bassGain !== 0 || effects.reverbAmount > 0) && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
            </button>

            {/* Speed quick cycle */}
            <button
              onClick={() => {
                const nextRates = [1.0, 1.25, 1.5, 0.75];
                const currentIndex = nextRates.indexOf(effects.playbackRate);
                const nextRate = nextRates[(currentIndex + 1) % nextRates.length];
                onUpdateEffects({ playbackRate: nextRate });
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-sky-400 transition"
            >
              {effects.playbackRate}x
            </button>

            {/* Mute button */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              {isMuted || effects.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Download MP3 / WAV Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-emerald-500/20 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isKm ? 'ទាញយក' : 'Download'}</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {showDownloadMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      onDownload('mp3');
                      setShowDownloadMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-slate-200 hover:bg-slate-800 hover:text-white transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-400">MP3</span>
                      <span>{isKm ? 'ទំហំតូច ច្បាស់ល្អ' : 'Universal'}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Standard
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      onDownload('wav');
                      setShowDownloadMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-slate-200 hover:bg-slate-800 hover:text-white transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sky-400">WAV</span>
                      <span>{isKm ? 'គុណភាពស្ទូឌីយោ' : 'Studio Lossless'}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                      24kHz
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

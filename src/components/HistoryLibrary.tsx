import React, { useState } from 'react';
import {
  History,
  Search,
  Star,
  Trash2,
  Download,
  Play,
  Pause,
  FileAudio,
  Calendar,
  Clock,
  HardDrive,
  Filter,
  Share2,
  Upload,
  Layers,
  Sparkles,
} from 'lucide-react';
import { HistoryItem } from '../types';
import { formatSeconds, formatBytes, downloadAudioFile } from '../utils/downloader';

interface Props {
  history: HistoryItem[];
  onPlayItem: (item: HistoryItem) => void;
  onPauseItem: () => void;
  isPlaying: boolean;
  activeItem: HistoryItem | null;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
  onImportHistory: (items: HistoryItem[]) => void;
  lang: 'km' | 'en';
}

export const HistoryLibrary: React.FC<Props> = ({
  history,
  onPlayItem,
  onPauseItem,
  isPlaying,
  activeItem,
  onToggleFavorite,
  onDeleteItem,
  onClearHistory,
  onImportHistory,
  lang,
}) => {
  const isKm = lang === 'km';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavoriteOnly, setFilterFavoriteOnly] = useState(false);
  const [filterLanguage, setFilterLanguage] = useState<string>('all');

  const filteredItems = history.filter((item) => {
    const matchesSearch =
      item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.voiceName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFav = filterFavoriteOnly ? item.isFavorite : true;
    const matchesLang = filterLanguage === 'all' ? true : item.language === filterLanguage;
    return matchesSearch && matchesFav && matchesLang;
  });

  const totalDuration = history.reduce((acc, cur) => acc + (cur.durationSeconds || 0), 0);
  const totalBytes = history.reduce((acc, cur) => acc + (cur.fileSizeBytes || 0), 0);

  const handleExportBackup = () => {
    const jsonStr = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khmervoice_history_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportHistory(parsed);
        }
      } catch (err) {
        alert(isKm ? 'ឯកសារ JSON មិនត្រឹមត្រូវ' : 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">
              {isKm ? 'ចំនួនសំឡេងសរុប' : 'Total Synthesized'}
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {history.length} {isKm ? 'ឯកសារ' : 'tracks'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">
              {isKm ? 'រយៈពេលសំឡេងសរុប' : 'Total Duration'}
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {formatSeconds(totalDuration)}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">
              {isKm ? 'ទំហំ Cloud Storage ប្រើប្រាស់' : 'Storage Consumed'}
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {formatBytes(totalBytes)}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isKm ? 'ស្វែងរកតាមពាក្យ ឬឈ្មោះសំឡេង...' : 'Search by text or voice...'
            }
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filters and Backups */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setFilterFavoriteOnly(!filterFavoriteOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition ${
              filterFavoriteOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterFavoriteOnly ? 'fill-amber-400' : ''}`} />
            <span>{isKm ? 'ចំណូលចិត្ត' : 'Favorites'}</span>
          </button>

          {/* Export JSON backup */}
          <button
            onClick={handleExportBackup}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition disabled:opacity-40"
            title={isKm ? 'ទាញយកទិន្នន័យបម្រុង' : 'Export JSON Backup'}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isKm ? 'បម្រុងទុក' : 'Backup'}</span>
          </button>

          {/* Import JSON */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isKm ? 'នាំចូល' : 'Import'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          {/* Clear history */}
          {history.length > 0 && (
            <button
              onClick={() => {
                if (
                  confirm(
                    isKm
                      ? 'តើអ្នកពិតជាចង់លុបប្រវត្តិការងារទាំងអស់មែនទេ?'
                      : 'Are you sure you want to clear your entire history?'
                  )
                ) {
                  onClearHistory();
                }
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/40 border border-slate-700 hover:border-red-800 text-slate-400 hover:text-red-400 transition"
              title={isKm ? 'លុបទាំងអស់' : 'Clear All'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* History Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center mb-3">
            <FileAudio className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {isKm ? 'មិនទាន់មានប្រវត្តិការងារនៅឡើយទេ' : 'No audio history yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {isKm
              ? 'សំឡេងដែលអ្នកបានបំប្លែងតាម Cloud AI នឹងត្រូវបានរក្សាទុកដោយស្វ័យប្រវត្តិនៅទីនេះ'
              : 'Every audio track you generate will be automatically cached and saved here with instant MP3/WAV export.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isCurrentlyPlaying = isPlaying && activeItem?.id === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrentlyPlaying
                    ? 'bg-slate-900 border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-xl'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Play button and Text info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <button
                      onClick={() => {
                        if (isCurrentlyPlaying) {
                          onPauseItem();
                        } else {
                          onPlayItem(item);
                        }
                      }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform hover:scale-105 active:scale-95 ${
                        isCurrentlyPlaying
                          ? 'bg-indigo-600 text-white shadow-indigo-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white">
                          {item.voiceName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                          {item.language}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatSeconds(item.durationSeconds)}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {item.mode === 'dialogue' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Dialogue
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 font-sans line-clamp-2 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions: Favorite, MP3, WAV, Delete */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                      title={isKm ? 'ចំណូលចិត្ត' : 'Favorite'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          item.isFavorite
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-500'
                        }`}
                      />
                    </button>

                    {/* Download MP3 */}
                    <button
                      onClick={() =>
                        downloadAudioFile(
                          item.mp3Base64,
                          `khmervoice_${item.voiceName}_${item.id.slice(-4)}`,
                          'mp3'
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition"
                      title="Download MP3"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>MP3</span>
                    </button>

                    {/* Download WAV */}
                    <button
                      onClick={() =>
                        downloadAudioFile(
                          item.wavBase64,
                          `khmervoice_${item.voiceName}_${item.id.slice(-4)}`,
                          'wav'
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-bold transition"
                      title="Download Lossless WAV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>WAV</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                      title={isKm ? 'លុប' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SingleSpeakerStudio } from './components/SingleSpeakerStudio';
import { DialogueStudio } from './components/DialogueStudio';
import { HistoryLibrary } from './components/HistoryLibrary';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { AudioEffectsModal } from './components/AudioEffectsModal';
import { UserAccountModal } from './components/UserAccountModal';
import { HistoryItem, UserProfile, AudioEffects } from './types';
import { DEFAULT_USER } from './data/voicesAndLanguages';
import { globalAudioEngine } from './utils/audioEngine';
import { downloadAudioFile } from './utils/downloader';
import {
  getAllHistoryItems,
  saveHistoryItem,
  saveMultipleHistoryItems,
  deleteHistoryItem,
  clearAllHistory,
  cleanupBloatedLocalStorage,
} from './utils/historyStorage';

const INITIAL_EFFECTS: AudioEffects = {
  playbackRate: 1.0,
  pitchSemiTones: 0,
  bassGain: 0,
  trebleGain: 0,
  reverbAmount: 0,
  volume: 1.0,
};

export default function App() {
  const [lang, setLang] = useState<'km' | 'en'>('km');
  const [activeTab, setActiveTab] = useState<'single' | 'dialogue' | 'history'>('single');

  // User Profile State
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('khmervoice_user');
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  // History State backed by IndexedDB (no 5MB localStorage limits)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState<boolean>(false);

  // Active Audio State
  const [activeItem, setActiveItem] = useState<HistoryItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Audio Effects State
  const [effects, setEffects] = useState<AudioEffects>(INITIAL_EFFECTS);
  const [isEffectsModalOpen, setIsEffectsModalOpen] = useState<boolean>(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);

  // Clean up legacy bloated localStorage and load from IndexedDB
  useEffect(() => {
    cleanupBloatedLocalStorage();

    const loadHistory = async () => {
      try {
        const storedItems = await getAllHistoryItems();
        setHistory(storedItems);
      } catch (err) {
        console.error('Failed to load history items:', err);
      } finally {
        setIsHistoryLoaded(true);
      }
    };

    loadHistory();
  }, []);

  // Sync user profile to localStorage safely (no large audio binaries)
  useEffect(() => {
    try {
      localStorage.setItem('khmervoice_user', JSON.stringify(user));
    } catch (err) {
      console.warn('Could not save user profile to localStorage:', err);
    }
  }, [user]);

  // Connect AudioEngine callbacks
  useEffect(() => {
    globalAudioEngine.onTimeUpdate((cur, dur) => {
      setCurrentTime(cur);
      setDuration(dur);
    });

    globalAudioEngine.onEnded(() => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
  }, []);

  const handlePlayItem = async (item: HistoryItem) => {
    try {
      setActiveItem(item);
      const audioToLoad = item.wavBase64 || item.mp3Base64;
      const dur = await globalAudioEngine.loadFromBase64(audioToLoad, 'audio/wav');
      setDuration(dur);
      globalAudioEngine.applyEffects(effects);
      globalAudioEngine.play(0);
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to play audio item:', err);
    }
  };

  const handlePauseItem = () => {
    globalAudioEngine.pause();
    setIsPlaying(false);
  };

  const handleSeek = (time: number) => {
    globalAudioEngine.seek(time);
    setCurrentTime(time);
  };

  const handleUpdateEffects = (updated: Partial<AudioEffects>) => {
    const next = { ...effects, ...updated };
    setEffects(next);
    globalAudioEngine.applyEffects(updated);
  };

  const handleResetEffects = () => {
    setEffects(INITIAL_EFFECTS);
    globalAudioEngine.applyEffects(INITIAL_EFFECTS);
  };

  const handleGenerateSuccess = async (newItem: HistoryItem) => {
    setHistory((prev) => [newItem, ...prev]);

    // Persist to IndexedDB
    await saveHistoryItem(newItem);

    // Update user stats and storage consumption
    const charsAdded = newItem.text.length;
    const durationAdded = newItem.durationSeconds;
    const mbAdded = newItem.fileSizeBytes / (1024 * 1024);

    setUser((prev) => ({
      ...prev,
      totalCharactersGenerated: prev.totalCharactersGenerated + charsAdded,
      totalAudioGeneratedSeconds: prev.totalAudioGeneratedSeconds + durationAdded,
      cloudStorageUsedMb: Math.min(
        prev.cloudStorageLimitMb,
        Number((prev.cloudStorageUsedMb + mbAdded).toFixed(2))
      ),
    }));
  };

  const handleToggleFavorite = async (id: string) => {
    const targetItem = history.find((item) => item.id === id);
    if (targetItem) {
      const updatedItem = { ...targetItem, isFavorite: !targetItem.isFavorite };
      setHistory((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );
      await saveHistoryItem(updatedItem);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    await deleteHistoryItem(id);

    if (activeItem?.id === id) {
      globalAudioEngine.stop();
      setIsPlaying(false);
      setActiveItem(null);
    }
  };

  const handleClearHistory = async () => {
    setHistory([]);
    await clearAllHistory();
    globalAudioEngine.stop();
    setIsPlaying(false);
    setActiveItem(null);
  };

  const handleImportHistory = async (imported: HistoryItem[]) => {
    setHistory((prev) => [...imported, ...prev]);
    await saveMultipleHistoryItems(imported);
  };

  const handleDownloadActive = (format: 'mp3' | 'wav') => {
    if (!activeItem) return;
    const data = format === 'mp3' ? activeItem.mp3Base64 : activeItem.wavBase64;
    downloadAudioFile(data, `khmervoice_${activeItem.voiceName}`, format);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        user={user}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        historyCount={history.length}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'single' && (
          <SingleSpeakerStudio
            onGenerateSuccess={handleGenerateSuccess}
            lang={lang}
            onOpenEffectsModal={() => setIsEffectsModalOpen(true)}
            currentEffects={effects}
            isPlaying={isPlaying}
            activeItem={activeItem}
            onPlayItem={handlePlayItem}
            onPauseItem={handlePauseItem}
          />
        )}

        {activeTab === 'dialogue' && (
          <DialogueStudio
            onGenerateSuccess={handleGenerateSuccess}
            lang={lang}
            onOpenEffectsModal={() => setIsEffectsModalOpen(true)}
            isPlaying={isPlaying}
            activeItem={activeItem}
            onPlayItem={handlePlayItem}
            onPauseItem={handlePauseItem}
          />
        )}

        {activeTab === 'history' && (
          <HistoryLibrary
            history={history}
            onPlayItem={handlePlayItem}
            onPauseItem={handlePauseItem}
            isPlaying={isPlaying}
            activeItem={activeItem}
            onToggleFavorite={handleToggleFavorite}
            onDeleteItem={handleDeleteItem}
            onClearHistory={handleClearHistory}
            onImportHistory={handleImportHistory}
            lang={lang}
          />
        )}
      </main>

      {/* Sticky Bottom Audio Player Bar */}
      <AudioPlayerBar
        item={activeItem}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        effects={effects}
        onPlay={() => {
          if (activeItem) {
            globalAudioEngine.play();
            setIsPlaying(true);
          }
        }}
        onPause={handlePauseItem}
        onSeek={handleSeek}
        onOpenEffectsModal={() => setIsEffectsModalOpen(true)}
        onDownload={handleDownloadActive}
        onUpdateEffects={handleUpdateEffects}
        lang={lang}
      />

      {/* Studio DSP Audio Tuning Modal */}
      <AudioEffectsModal
        isOpen={isEffectsModalOpen}
        onClose={() => setIsEffectsModalOpen(false)}
        effects={effects}
        onUpdateEffects={handleUpdateEffects}
        onResetEffects={handleResetEffects}
        lang={lang}
      />

      {/* User Account & Cloud Quota Modal */}
      <UserAccountModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={user}
        onUpdateUser={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
        historyCount={history.length}
        lang={lang}
      />
    </div>
  );
}

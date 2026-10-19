import React, { useState } from 'react';
import {
  Mic,
  Sparkles,
  Play,
  RotateCcw,
  Download,
  Copy,
  Trash2,
  FileText,
  Sliders,
  Check,
  ChevronDown,
  Volume2,
  Clock,
  Zap,
  Globe2,
} from 'lucide-react';
import { VOICES, LANGUAGES, STYLE_PRESETS } from '../data/voicesAndLanguages';
import { VoiceId, HistoryItem, AudioEffects } from '../types';
import { AudioVisualizer } from './AudioVisualizer';
import { downloadAudioFile } from '../utils/downloader';
import { synthesizeOfflineVoiceAudio } from '../utils/localSpeechSynthesizer';

interface Props {
  onGenerateSuccess: (item: HistoryItem) => void;
  lang: 'km' | 'en';
  onOpenEffectsModal: () => void;
  currentEffects: AudioEffects;
  isPlaying: boolean;
  activeItem: HistoryItem | null;
  onPlayItem: (item: HistoryItem) => void;
  onPauseItem: () => void;
}

export const SingleSpeakerStudio: React.FC<Props> = ({
  onGenerateSuccess,
  lang,
  onOpenEffectsModal,
  currentEffects,
  isPlaying,
  activeItem,
  onPlayItem,
  onPauseItem,
}) => {
  const isKm = lang === 'km';

  // Form States
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>('km');
  const [selectedVoiceId, setSelectedVoiceId] = useState<VoiceId>('Kore');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('formal');
  const [customStyleText, setCustomStyleText] = useState<string>('');
  const [inputText, setInputText] = useState<string>(
    LANGUAGES[0].samplePhrases[0].text
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastGeneratedItem, setLastGeneratedItem] = useState<HistoryItem | null>(null);
  const [preferredFormat, setPreferredFormat] = useState<'mp3' | 'wav'>('mp3');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState<boolean>(false);
  const [cloudLatencyMs, setCloudLatencyMs] = useState<number | null>(null);

  const selectedLanguage =
    LANGUAGES.find((l) => l.code === selectedLanguageCode) || LANGUAGES[0];
  const selectedVoice =
    VOICES.find((v) => v.id === selectedVoiceId) || VOICES[0];
  const selectedStylePreset =
    STYLE_PRESETS.find((s) => s.id === selectedStyleId) || STYLE_PRESETS[0];

  // Estimated duration: ~15 characters per second for Khmer / ~18 cps for English
  const charCount = inputText.trim().length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.max(1, Math.round(charCount / (selectedLanguageCode === 'km' ? 14 : 17)));

  const handleLanguageChange = (code: string) => {
    setSelectedLanguageCode(code);
    setShowLanguageDropdown(false);
    const targetLang = LANGUAGES.find((l) => l.code === code);
    if (targetLang && targetLang.samplePhrases.length > 0) {
      setInputText(targetLang.samplePhrases[0].text);
    }
  };

  const [engineMode, setEngineMode] = useState<'cloud' | 'huggingface'>('cloud');
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setErrorMessage(isKm ? 'សូមបញ្ចូលអត្ថបទជាមុនសិន' : 'Please input some text first');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    const startTime = Date.now();

    const finalStyle = customStyleText.trim()
      ? customStyleText.trim()
      : selectedStylePreset.promptStyle;

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          voiceName: selectedVoiceId,
          language: selectedLanguageCode,
          style: finalStyle,
          mode: 'single',
          engine: engineMode === 'huggingface' ? 'huggingface' : 'gemini',
          speakingRate: 1.0,
        }),
      });

      const data = await response.json();
      const elapsed = Date.now() - startTime;
      setCloudLatencyMs(elapsed);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'TTS generation failed');
      }

      // If server rescued with Hugging Face due to temporary quota, notify user without changing their selected button
      if (data.switchedToHuggingFace) {
        setQuotaNotice(
          isKm
            ? 'Gemini API បានដល់កំណត់កូតា (Rate Limit) បណ្តោះអាសន្ន។ ប្រព័ន្ធបានសង្គ្រោះផលិតសំឡេងតាម Hugging Face API ដោយជោគជ័យ!'
            : 'Gemini API reached rate limit for this request. Rescued with Hugging Face API successfully!'
        );
      }

      const newItem: HistoryItem = {
        id: `tts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        text: inputText.trim(),
        voiceName: data.voiceName || selectedVoiceId,
        language: selectedLanguageCode,
        style: finalStyle,
        durationSeconds: data.durationSeconds || estimatedSeconds,
        wavBase64: data.wavBase64,
        mp3Base64: data.mp3Base64,
        fileSizeBytes: data.wavSize || Math.round(data.wavBase64.length * 0.75),
        createdAt: new Date().toISOString(),
        mode: 'single',
      };

      setLastGeneratedItem(newItem);
      onGenerateSuccess(newItem);
      onPlayItem(newItem);
    } catch (err: any) {
      console.error('Error generating audio:', err);

      // If error occurs, try fallback to Hugging Face API directly
      if (engineMode === 'cloud') {
        console.warn('Attempting client direct fallback to Hugging Face API...');
        try {
          const hfFallbackRes = await fetch('/api/tts/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: inputText.trim(),
              voiceName: selectedVoiceId,
              language: selectedLanguageCode,
              style: finalStyle,
              mode: 'single',
              engine: 'huggingface',
              speakingRate: 1.0,
            }),
          });

          const hfData = await hfFallbackRes.json();
          if (hfFallbackRes.ok && hfData.success) {
            setQuotaNotice(
              isKm
                ? 'Gemini API បានដល់កំណត់កូតា (Rate Limit) បណ្តោះអាសន្ន។ ប្រព័ន្ធបានសង្គ្រោះផលិតសំឡេងតាម Hugging Face API ដោយជោគជ័យ!'
                : 'Gemini API Rate Limit reached. Rescued with Hugging Face API successfully!'
            );

            const fallbackItem: HistoryItem = {
              id: `tts_hf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              text: inputText.trim(),
              voiceName: `${selectedVoiceId} (Hugging Face)`,
              language: selectedLanguageCode,
              style: finalStyle,
              durationSeconds: hfData.durationSeconds || estimatedSeconds,
              wavBase64: hfData.wavBase64,
              mp3Base64: hfData.mp3Base64,
              fileSizeBytes: hfData.wavSize || Math.round(hfData.wavBase64.length * 0.75),
              createdAt: new Date().toISOString(),
              mode: 'single',
            };

            setLastGeneratedItem(fallbackItem);
            onGenerateSuccess(fallbackItem);
            onPlayItem(fallbackItem);
            return;
          }
        } catch (hfErr) {
          console.error('Hugging Face fallback also failed:', hfErr);
        }
      }

      setErrorMessage(
        err.message ||
          (isKm
            ? 'មានកំហុសក្នុងការបង្កើតសំឡេង សូមព្យាយាមម្តងទៀត'
            : 'Error generating audio. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner / Cloud Spec Highlight */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-800/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <Zap className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                {isKm
                  ? 'បច្ចេកវិទ្យា Cloud AI សំឡេងកម្រិតស្ទូឌីយោ'
                  : 'Cloud-Powered Neural Speech Engine'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {engineMode === 'huggingface' ? 'Hugging Face MMS-TTS' : 'gemini-3.8-flash-tts'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isKm
                ? 'សំឡេងធម្មជាតិ គាំទ្រភាសាខ្មែរយ៉ាងច្បាស់លាស់ ដំណើរការលើ Cloud លឿនរហ័ស និងទាញយកជា MP3/WAV'
                : 'Native Khmer & multi-language high-fidelity speech synthesis with instant MP3/WAV export'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Engine Selector */}
          <div className="flex items-center rounded-xl bg-slate-900/90 p-1 border border-slate-700/80">
            <button
              type="button"
              onClick={() => setEngineMode('cloud')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                engineMode === 'cloud'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cloud Gemini 3.8
            </button>
            <button
              type="button"
              onClick={() => setEngineMode('huggingface')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                engineMode === 'huggingface'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🤗 Hugging Face AI
            </button>
          </div>

          {cloudLatencyMs && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs shrink-0 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{(cloudLatencyMs / 1000).toFixed(2)}s latency</span>
            </div>
          )}
        </div>
      </div>

      {/* Quota Notice Banner if limit was reached */}
      {quotaNotice && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 shadow-lg flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-300">
                {isKm ? 'ដំណឹងអំពីកូតា Gemini Cloud TTS (Notice)' : 'Gemini Cloud Quota Info'}
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5 leading-relaxed">
                {quotaNotice}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setQuotaNotice(null)}
            className="text-amber-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-amber-900/40"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Text Input & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            {/* Header: Language & Sample Presets */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              {/* Language Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-white transition"
                >
                  <span className="text-base">{selectedLanguage.flag}</span>
                  <span>{isKm ? selectedLanguage.nameKh : selectedLanguage.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showLanguageDropdown && (
                  <div className="absolute left-0 top-full mt-1.5 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 max-h-72 overflow-y-auto">
                    {LANGUAGES.map((langOpt) => (
                      <button
                        key={langOpt.code}
                        type="button"
                        onClick={() => handleLanguageChange(langOpt.code)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition ${
                          selectedLanguageCode === langOpt.code
                            ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="text-base">{langOpt.flag}</span>
                        <span>{isKm ? langOpt.nameKh : langOpt.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sample Prompts Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  {isKm ? 'គំរូអត្ថបទ:' : 'Samples:'}
                </span>
                {selectedLanguage.samplePhrases.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(sample.text)}
                    className="px-2 py-0.5 text-[11px] rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 hover:text-indigo-300 border border-slate-700 text-slate-300 transition"
                  >
                    {isKm ? sample.titleKh : sample.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
                placeholder={
                  isKm
                    ? 'សូមវាយបញ្ចូល ឬចម្លងអត្ថបទដែលអ្នកចង់បំប្លែងទៅជាសំឡេងនៅទីនេះ...'
                    : 'Type or paste the text you want to synthesize into speech here...'
                }
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y transition font-sans leading-relaxed"
              />
            </div>

            {/* Textarea Utilities (Character counter, Clear, Paste) */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <strong className="text-slate-200 font-mono">{charCount}</strong> {isKm ? 'តួអក្សរ' : 'chars'}
                </span>
                <span className="text-slate-600">•</span>
                <span>
                  <strong className="text-slate-200 font-mono">{wordCount}</strong> {isKm ? 'ពាក្យ' : 'words'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-indigo-400">
                  <Clock className="w-3.5 h-3.5" />
                  ~{estimatedSeconds}s {isKm ? 'ប្រហែល' : 'est'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setInputText(text);
                    } catch (e) {
                      // Fallback
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px]"
                >
                  <Copy className="w-3 h-3" />
                  {isKm ? 'បិទភ្ជាប់ (Paste)' : 'Paste'}
                </button>
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition flex items-center gap-1 text-[11px]"
                  title="Clear"
                >
                  <Trash2 className="w-3 h-3" />
                  {isKm ? 'លុប' : 'Clear'}
                </button>
              </div>
            </div>

            {/* Voice Style Presets */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  {isKm ? 'ស្ទីលសម្លេង & អារម្មណ៍ (Voice Tone & Style)' : 'Voice Style & Emotion'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedStylePreset.labelKh}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STYLE_PRESETS.map((preset) => {
                  const isSelected = selectedStyleId === preset.id && !customStyleText;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedStyleId(preset.id);
                        setCustomStyleText('');
                      }}
                      className={`p-2.5 text-left rounded-xl border transition ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-semibold flex items-center justify-between">
                        <span>{isKm ? preset.labelKh : preset.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                        {isKm ? preset.descriptionKh : preset.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Voice Style input */}
              <div className="mt-2.5">
                <input
                  type="text"
                  value={customStyleText}
                  onChange={(e) => setCustomStyleText(e.target.value)}
                  placeholder={
                    isKm
                      ? 'ឬកំណត់ស្ទីលផ្ទាល់ខ្លួន (ឧទាហរណ៍៖ សំឡេងរំភើប, សំឡេងខ្សឹបផ្អែមល្ហែម, ...)'
                      : 'Or enter custom voice style (e.g., Excited tech host, sweet whisper...)'
                  }
                  className="w-full px-3 py-1.5 text-xs bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center justify-between">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-red-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Actions: Generate Button & Format Select */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{isKm ? 'ទម្រង់ឯកសារ:' : 'Format:'}</span>
                <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreferredFormat('mp3')}
                    className={`px-2.5 py-1 text-xs rounded-md font-bold transition ${
                      preferredFormat === 'mp3'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    MP3
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredFormat('wav')}
                    className={`px-2.5 py-1 text-xs rounded-md font-bold transition ${
                      preferredFormat === 'wav'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    WAV
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onOpenEffectsModal}
                  className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition"
                  title="Audio Tuning"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">{isKm ? 'កែសំឡេង' : 'Effects'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isKm ? 'កំពុងផលិតសំឡេង...' : 'Synthesizing...'}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>{isKm ? 'បំលែងទៅជាសំឡេង' : 'Generate Speech'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Voice Selection & Real-time Visualizer (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Voices Selection List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                {isKm ? 'ជ្រើសរើសសំឡេង AI (Gemini Voices)' : 'Select AI Voice'}
              </h3>
              <span className="text-[11px] text-slate-400">
                {VOICES.length} {isKm ? 'សំឡេង' : 'Voices'}
              </span>
            </div>

            <div className="space-y-2.5">
              {VOICES.map((voice) => {
                const isSelected = selectedVoiceId === voice.id;
                return (
                  <div
                    key={voice.id}
                    onClick={() => setSelectedVoiceId(voice.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${voice.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-md`}
                        >
                          {voice.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {voice.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {voice.gender === 'female' ? (isKm ? 'ស្រី' : 'Female') : (isKm ? 'ប្រុស' : 'Male')}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {voice.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-indigo-300/80 mt-0.5">
                            {isKm ? voice.toneKh : voice.tone}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 pl-12 line-clamp-2">
                      {isKm ? voice.descriptionKh : voice.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generated Audio Card & Waveform Visualizer */}
          {lastGeneratedItem && (
            <div className="bg-slate-900/90 border border-indigo-800/50 rounded-2xl p-5 shadow-2xl space-y-3 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  {isKm ? 'សំឡេងផលិតរួចរាល់' : 'Audio Synthesized'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {lastGeneratedItem.durationSeconds}s • {preferredFormat.toUpperCase()}
                </span>
              </div>

              {/* Dynamic Neon Waveform Visualizer */}
              <AudioVisualizer
                isPlaying={isPlaying && activeItem?.id === lastGeneratedItem.id}
                className="w-full h-16"
              />

              {/* Quick Play & Instant Download */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isPlaying && activeItem?.id === lastGeneratedItem.id) {
                      onPauseItem();
                    } else {
                      onPlayItem(lastGeneratedItem);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 transition"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>
                    {isPlaying && activeItem?.id === lastGeneratedItem.id
                      ? (isKm ? 'ផ្អាក (Pause)' : 'Pause')
                      : (isKm ? 'ស្តាប់ភ្លាមៗ (Play)' : 'Play Now')}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadAudioFile(
                        lastGeneratedItem.mp3Base64,
                        `khmervoice_${lastGeneratedItem.voiceName}`,
                        'mp3'
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition"
                    title="Download MP3"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>MP3</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      downloadAudioFile(
                        lastGeneratedItem.wavBase64,
                        `khmervoice_${lastGeneratedItem.voiceName}`,
                        'wav'
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/40 text-xs font-bold transition"
                    title="Download Studio WAV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>WAV</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

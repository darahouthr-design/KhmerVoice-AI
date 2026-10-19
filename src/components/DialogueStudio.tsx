import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Play,
  Download,
  Plus,
  Trash2,
  Users,
  Mic,
  Sliders,
  Check,
  ChevronDown,
} from 'lucide-react';
import { VOICES } from '../data/voicesAndLanguages';
import { VoiceId, HistoryItem, AudioEffects } from '../types';
import { AudioVisualizer } from './AudioVisualizer';
import { downloadAudioFile } from '../utils/downloader';
import { synthesizeOfflineVoiceAudio } from '../utils/localSpeechSynthesizer';

interface DialogueLine {
  id: string;
  speaker: 'Speaker 1' | 'Speaker 2';
  text: string;
  style: string;
}

interface Props {
  onGenerateSuccess: (item: HistoryItem) => void;
  lang: 'km' | 'en';
  onOpenEffectsModal: () => void;
  isPlaying: boolean;
  activeItem: HistoryItem | null;
  onPlayItem: (item: HistoryItem) => void;
  onPauseItem: () => void;
}

export const DialogueStudio: React.FC<Props> = ({
  onGenerateSuccess,
  lang,
  onOpenEffectsModal,
  isPlaying,
  activeItem,
  onPlayItem,
  onPauseItem,
}) => {
  const isKm = lang === 'km';

  const [speaker1Name, setSpeaker1Name] = useState<string>('Dara');
  const [speaker1Voice, setSpeaker1Voice] = useState<VoiceId>('Puck');
  const [speaker2Name, setSpeaker2Name] = useState<string>('Bopha');
  const [speaker2Voice, setSpeaker2Voice] = useState<VoiceId>('Kore');

  const [lines, setLines] = useState<DialogueLine[]>([
    {
      id: '1',
      speaker: 'Speaker 1',
      text: 'សួស្តីបូផា! <breath> តើអ្នកបានសាកល្បងប្រព័ន្ធបំប្លែងសំឡេង AI ជំនាន់ចុងក្រោយហើយឬនៅ?',
      style: 'Enthusiastic and friendly greeting',
    },
    {
      id: '2',
      speaker: 'Speaker 2',
      text: 'ចាសតារា! |mhm| ខ្ញុំបានសាកល្បងរួចហើយ សំឡេងចេញមកធម្មជាតិ និងពីរោះខ្លាំងណាស់!',
      style: 'Delighted and expressive reply',
    },
    {
      id: '3',
      speaker: 'Speaker 1',
      text: 'ពិតជាអស្ចារ្យមែន! <laugh> យើងអាចទាញយកជា MP3 ឬ WAV ភ្លាមៗតែម្តង។',
      style: 'Cheerful excitement',
    },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastGeneratedItem, setLastGeneratedItem] = useState<HistoryItem | null>(null);

  const addLine = (speaker: 'Speaker 1' | 'Speaker 2') => {
    setLines([
      ...lines,
      {
        id: Date.now().toString(),
        speaker,
        text: '',
        style: speaker === 'Speaker 1' ? 'Natural conversational' : 'Engaging reply',
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  const updateLineText = (id: string, text: string) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, text } : l)));
  };

  const insertBurst = (id: string, burst: string) => {
    setLines(
      lines.map((l) =>
        l.id === id ? { ...l, text: l.text ? `${l.text} ${burst}` : burst } : l
      )
    );
  };

  const handleGenerateDialogue = async () => {
    const validLines = lines.filter((l) => l.text.trim().length > 0);
    if (validLines.length < 2) {
      setErrorMessage(
        isKm
          ? 'សូមបញ្ចូលកិច្ចសន្ទនាយ៉ាងហោចណាស់ ២ បន្ទាត់'
          : 'Please enter at least 2 dialogue turns'
      );
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const dialogueParts = validLines.map((l) => ({
      speaker: l.speaker === 'Speaker 1' ? speaker1Name : speaker2Name,
      voiceName: l.speaker === 'Speaker 1' ? speaker1Voice : speaker2Voice,
      text: l.text.trim(),
      style: l.style,
    }));

    const combinedText = dialogueParts
      .map((p) => `${p.speaker}: ${p.text}`)
      .join('\n');

    try {

      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'dialogue',
          text: combinedText,
          voiceName: speaker1Voice,
          language: 'km',
          dialogueParts,
        }),
      });

      const data = await response.json();
      if (response.status === 429 || data.quotaExceeded) {
        // Fallback to local audio synthesis
        const offlineAudio = await synthesizeOfflineVoiceAudio(
          combinedText,
          speaker1Voice,
          'km'
        );

        const fallbackItem: HistoryItem = {
          id: `dlg_fallback_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          text: combinedText,
          voiceName: `${speaker1Name} & ${speaker2Name} (Neural)`,
          language: 'km',
          style: 'Dual-Speaker Dialogue (Neural)',
          durationSeconds: offlineAudio.durationSeconds,
          wavBase64: offlineAudio.wavBase64,
          mp3Base64: offlineAudio.mp3Base64,
          fileSizeBytes: Math.round(offlineAudio.wavBase64.length * 0.75),
          createdAt: new Date().toISOString(),
          mode: 'dialogue',
          speakers: dialogueParts,
        };

        setLastGeneratedItem(fallbackItem);
        onGenerateSuccess(fallbackItem);
        onPlayItem(fallbackItem);
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Dual-speaker generation failed');
      }

      const newItem: HistoryItem = {
        id: `dlg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        text: combinedText,
        voiceName: `${speaker1Name} (${speaker1Voice}) & ${speaker2Name} (${speaker2Voice})`,
        language: 'km',
        style: 'Dual-Speaker Dialogue with Backchanneling',
        durationSeconds: data.durationSeconds || Math.round(combinedText.length / 15),
        wavBase64: data.wavBase64,
        mp3Base64: data.mp3Base64,
        fileSizeBytes: data.wavSize || Math.round(data.wavBase64.length * 0.75),
        createdAt: new Date().toISOString(),
        mode: 'dialogue',
        speakers: dialogueParts,
      };

      setLastGeneratedItem(newItem);
      onGenerateSuccess(newItem);
      onPlayItem(newItem);
    } catch (err: any) {
      console.error('Error generating dialogue audio:', err);
      if (err?.message?.includes('429') || err?.message?.includes('quota') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
        try {
          const offlineAudio = await synthesizeOfflineVoiceAudio(
            combinedText,
            speaker1Voice,
            'km'
          );

          const fallbackItem: HistoryItem = {
            id: `dlg_fallback_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            text: combinedText,
            voiceName: `${speaker1Name} & ${speaker2Name} (Neural)`,
            language: 'km',
            style: 'Dual-Speaker Dialogue (Neural)',
            durationSeconds: offlineAudio.durationSeconds,
            wavBase64: offlineAudio.wavBase64,
            mp3Base64: offlineAudio.mp3Base64,
            fileSizeBytes: Math.round(offlineAudio.wavBase64.length * 0.75),
            createdAt: new Date().toISOString(),
            mode: 'dialogue',
            speakers: dialogueParts,
          };

          setLastGeneratedItem(fallbackItem);
          onGenerateSuccess(fallbackItem);
          onPlayItem(fallbackItem);
        } catch (offlineErr: any) {
          setErrorMessage(offlineErr.message || 'Error generating dialogue audio.');
        }
      } else {
        setErrorMessage(err.message || 'Error generating dialogue audio.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Intro Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-800/40 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                {isKm
                  ? 'ស្ទូឌីយោកិច្ចសន្ទនា ២ នាក់ (Multi-Speaker Dialogue)'
                  : 'Multi-Speaker Dialogue Studio'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                gemini-3.8-flash-tts
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isKm
                ? 'បង្កើតការសន្ទនាបែបធម្មជាតិរវាងតួអង្គ ២ នាក់ ដោយរួមបញ្ចូលសំឡេងដកដង្ហើម <breath> សើច <laugh> និងការឆ្លើយតប |mhm|'
                : 'Direct two unique voices in a single audio track with vocal bursts and natural conversational pacing.'}
            </p>
          </div>
        </div>
      </div>

      {/* Speakers Setup Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Speaker 1 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              {isKm ? 'តួអង្គទី ១ (Speaker 1)' : 'Speaker 1'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {isKm ? 'ឈ្មោះតួអង្គ' : 'Character Name'}
              </label>
              <input
                type="text"
                value={speaker1Name}
                onChange={(e) => setSpeaker1Name(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {isKm ? 'ជ្រើសរើសសំឡេង' : 'Voice Persona'}
              </label>
              <select
                value={speaker1Voice}
                onChange={(e) => setSpeaker1Voice(e.target.value as VoiceId)}
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Speaker 2 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              {isKm ? 'តួអង្គទី ២ (Speaker 2)' : 'Speaker 2'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {isKm ? 'ឈ្មោះតួអង្គ' : 'Character Name'}
              </label>
              <input
                type="text"
                value={speaker2Name}
                onChange={(e) => setSpeaker2Name(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {isKm ? 'ជ្រើសរើសសំឡេង' : 'Voice Persona'}
              </label>
              <select
                value={speaker2Voice}
                onChange={(e) => setSpeaker2Voice(e.target.value as VoiceId)}
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-pink-500"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Screenplay Dialogue Lines */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            {isKm ? 'អត្ថបទសន្ទនា (Script)' : 'Dialogue Script'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => addLine('Speaker 1')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/40 transition"
            >
              <Plus className="w-3 h-3" />
              {speaker1Name}
            </button>
            <button
              onClick={() => addLine('Speaker 2')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-pink-600/20 text-pink-300 border border-pink-500/30 hover:bg-pink-600/40 transition"
            >
              <Plus className="w-3 h-3" />
              {speaker2Name}
            </button>
          </div>
        </div>

        {/* Lines list */}
        <div className="space-y-3">
          {lines.map((line, index) => {
            const isSp1 = line.speaker === 'Speaker 1';
            const speakerName = isSp1 ? speaker1Name : speaker2Name;

            return (
              <div
                key={line.id}
                className={`p-3.5 rounded-xl border transition ${
                  isSp1
                    ? 'bg-slate-950/60 border-indigo-900/50'
                    : 'bg-slate-950/60 border-pink-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        isSp1
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                      }`}
                    >
                      {speakerName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Vocal Burst Helper Tags */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      {isKm ? 'បន្ថែមសំឡេង:' : 'Insert burst:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => insertBurst(line.id, '<breath>')}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      title="Add breath"
                    >
                      &lt;breath&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => insertBurst(line.id, '<laugh>')}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      title="Add laugh"
                    >
                      &lt;laugh&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => insertBurst(line.id, '|mhm|')}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      title="Add backchannel"
                    >
                      |mhm|
                    </button>

                    {lines.length > 2 && (
                      <button
                        onClick={() => removeLine(line.id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={line.text}
                  onChange={(e) => updateLineText(line.id, e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 resize-none font-sans"
                  placeholder={
                    isKm
                      ? `បញ្ចូលពាក្យសម្តីរបស់ ${speakerName}...`
                      : `Enter what ${speakerName} says...`
                  }
                />
              </div>
            );
          })}
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Generate CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {lines.length} {isKm ? 'បន្ទាត់សន្ទនា' : 'turns'}
          </div>

          <button
            onClick={handleGenerateDialogue}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-500/25 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isKm ? 'កំពុងផលិតកិច្ចសន្ទនា...' : 'Synthesizing Dialogue...'}</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>{isKm ? 'ផលិតកិច្ចសន្ទនា (Generate Dialogue)' : 'Synthesize Dialogue'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Result */}
      {lastGeneratedItem && (
        <div className="bg-slate-900/90 border border-purple-800/50 rounded-2xl p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {isKm ? 'កិច្ចសន្ទនាផលិតរួចរាល់' : 'Dialogue Synthesized'}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {lastGeneratedItem.durationSeconds}s
            </span>
          </div>

          <AudioVisualizer
            isPlaying={isPlaying && activeItem?.id === lastGeneratedItem.id}
            className="w-full h-16"
          />

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                if (isPlaying && activeItem?.id === lastGeneratedItem.id) {
                  onPauseItem();
                } else {
                  onPlayItem(lastGeneratedItem);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isKm ? 'ស្តាប់ភ្លាមៗ (Play)' : 'Play Dialogue'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  downloadAudioFile(
                    lastGeneratedItem.mp3Base64,
                    `dialogue_${speaker1Name}_${speaker2Name}`,
                    'mp3'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>MP3</span>
              </button>

              <button
                onClick={() =>
                  downloadAudioFile(
                    lastGeneratedItem.wavBase64,
                    `dialogue_${speaker1Name}_${speaker2Name}`,
                    'wav'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/40 text-xs font-bold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>WAV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

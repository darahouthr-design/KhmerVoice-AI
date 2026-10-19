export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  plan: string;
  cloudStorageLimitMb: number;
  cloudStorageUsedMb: number;
  totalCharactersGenerated: number;
  totalAudioGeneratedSeconds: number;
  joinedDate: string;
}

export type VoiceId = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export interface VoiceOption {
  id: VoiceId;
  name: string;
  nameKh: string;
  gender: 'female' | 'male';
  tone: string;
  toneKh: string;
  description: string;
  descriptionKh: string;
  avatarColor: string;
  badge: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nameKh: string;
  flag: string;
  samplePhrases: { title: string; titleKh: string; text: string }[];
}

export interface SpeechStylePreset {
  id: string;
  label: string;
  labelKh: string;
  description: string;
  descriptionKh: string;
  promptStyle: string;
  iconName: string;
}

export interface HistoryItem {
  id: string;
  text: string;
  voiceName: VoiceId | string;
  language: string;
  style: string;
  durationSeconds: number;
  wavBase64: string;
  mp3Base64: string;
  fileSizeBytes: number;
  createdAt: string;
  isFavorite?: boolean;
  mode?: 'single' | 'dialogue';
  speakers?: { speaker: string; voiceName: string; text: string }[];
}

export interface AudioEffects {
  playbackRate: number; // 0.5 - 2.0
  pitchSemiTones: number; // -12 to +12
  bassGain: number; // -10dB to +15dB
  trebleGain: number; // -10dB to +15dB
  reverbAmount: number; // 0 to 1 (wet mix)
  volume: number; // 0 to 2 (gain)
}

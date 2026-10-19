import { VoiceOption, LanguageOption, SpeechStylePreset } from '../types';

export const VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore (កូរ៉េ)',
    nameKh: 'សំឡេងនារី Kore',
    gender: 'female',
    tone: 'Warm, Balanced & Natural',
    toneKh: 'ស្រទន់ រលូន និងច្បាស់ល្អ',
    description: 'Perfect for narration, audiobooks, formal announcements, and podcasts.',
    descriptionKh: 'ស័ក្តិសមបំផុតសម្រាប់និទានរឿង អានសៀវភៅ ព័ត៌មាន និងសេចក្តីប្រកាស។',
    avatarColor: 'from-rose-500 to-pink-600',
    badge: 'ពេញនិយម',
  },
  {
    id: 'Puck',
    name: 'Puck (ផាក)',
    nameKh: 'សំឡេងបុរស Puck',
    gender: 'male',
    tone: 'Youthful, Energetic & Friendly',
    toneKh: 'រស់រវើក ក្មេងខ្ចី និងរួសរាយ',
    description: 'Dynamic tone great for commercials, educational videos, and YouTube content.',
    descriptionKh: 'សំឡេងរស់រវើក ល្អឥតខ្ចោះសម្រាប់វីដេអូបង្រៀន ការផ្សាយពាណិជ្ជកម្ម និង TikTok/YouTube។',
    avatarColor: 'from-amber-500 to-orange-600',
    badge: 'ថាមពលខ្ពស់',
  },
  {
    id: 'Charon',
    name: 'Charon (ឆារ៉ុន)',
    nameKh: 'សំឡេងបុរស Charon',
    gender: 'male',
    tone: 'Deep, Authoritative & Resonant',
    toneKh: 'ធ្ងន់ មាំទាំ និងមានអំណាច',
    description: 'Commanding low pitch, ideal for documentary narration, trailers, and news.',
    descriptionKh: 'សំឡេងធ្ងន់មានអំណាច ល្អសម្រាប់ភាពយន្តឯកសារ ព័ត៌មានទាន់ហេតុការណ៍ និងភាពយន្ត។',
    avatarColor: 'from-indigo-600 to-purple-800',
    badge: 'មាំទាំ',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir (ហ្វេនរីរ)',
    nameKh: 'សំឡេងបុរស Fenrir',
    gender: 'male',
    tone: 'Crisp, Confident & Articulate',
    toneKh: 'ច្បាស់ ប្រកបដោយភាពជឿជាក់',
    description: 'Crisp articulation suited for tutorials, presentations, and technical reading.',
    descriptionKh: 'សំឡេងច្បាស់ល្អ ល្អសម្រាប់បទបង្ហាញ សិក្ខាសាលា និងការណែនាំបច្ចេកទេស។',
    avatarColor: 'from-cyan-500 to-blue-600',
    badge: 'ច្បាស់លាស់',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr (ហ្សេហ្វៀរ)',
    nameKh: 'សំឡេងនារី Zephyr',
    gender: 'female',
    tone: 'Gentle, Soothing & Serene',
    toneKh: 'ស្រាលស្រទន់ និងស្ងប់ស្ងាត់',
    description: 'Soft and peaceful tone ideal for meditation, bedtime stories, and relaxation.',
    descriptionKh: 'សំឡេងស្រាលស្រទន់ ស្ងប់អារម្មណ៍ ល្អសម្រាប់សមាធិ រឿងនិទានមុនគេង និងការបន្ធូរអារម្មណ៍។',
    avatarColor: 'from-emerald-500 to-teal-600',
    badge: 'ស្ងប់ចិត្ត',
  },
];

export const LANGUAGES: LanguageOption[] = [
  {
    code: 'km',
    name: 'Khmer (Cambodia)',
    nameKh: 'ភាសាខ្មែរ (កម្ពុជា)',
    flag: '🇰🇭',
    samplePhrases: [
      {
        title: 'ស្វាគមន៍ & ព័ត៌មាន',
        titleKh: 'ស្វាគមន៍ & ព័ត៌មាន',
        text: 'សូមស្វាគមន៍មកកាន់ប្រព័ន្ធបំប្លែងអត្ថបទទៅជាសំឡេង AI ជំនាន់ចុងក្រោយ។ បច្ចេកវិទ្យានេះជួយសម្រួលដល់ការផលិតសំឡេងបានយ៉ាងឆាប់រហ័ស និងមានគុណភាពខ្ពស់។',
      },
      {
        title: 'ព័ត៌មានបច្ចេកវិទ្យា',
        titleKh: 'ព័ត៌មានបច្ចេកវិទ្យា',
        text: 'បច្ចេកវិទ្យាបញ្ញាសិប្បនិម្មិតកំពុងរីកចម្រើនយ៉ាងលឿននៅក្នុងប្រទេសកម្ពុជា ជួយលើកកម្ពស់វិស័យអប់រំ សេដ្ឋកិច្ចឌីជីថល និងការបង្កើតមាតិកាប្រកបដោយភាពច្នៃប្រឌិត។',
      },
      {
        title: 'និទានរឿង & កម្សាន្ត',
        titleKh: 'និទានរឿង & កម្សាន្ត',
        text: 'កាលពីព្រេងនាយ មានភូមិតូចមួយស្ថិតនៅជើងភ្នំខៀវស្រងាត់។ អ្នកភូមិទាំងអស់រស់នៅប្រកបដោយភាពកក់ក្តៅ សាមគ្គីភាព និងក្តីស្រឡាញ់ចំពោះធម្មជាតិ។',
      },
      {
        title: 'ផ្សាយពាណិជ្ជកម្ម',
        titleKh: 'ផ្សាយពាណិជ្ជកម្ម',
        text: 'កម្មវិធីប្រូម៉ូសិនពិសេសមិនធ្លាប់មាន! បញ្ចុះតម្លៃរហូតដល់ហាសិបភាគរយ សម្រាប់អតិថិជនដំបូងចំនួនមួយរយនាក់។ កុំឲ្យឱកាសមាសនេះកន្លងផុតទៅ!',
      },
    ],
  },
  {
    code: 'en',
    name: 'English (United States)',
    nameKh: 'ភាសាអង់គ្លេស (English)',
    flag: '🇺🇸',
    samplePhrases: [
      {
        title: 'AI Announcement',
        titleKh: 'ការប្រកាស AI',
        text: 'Welcome to the cutting-edge AI speech synthesis studio. Convert any text into lifelike speech with ultra-low latency and crystal-clear acoustic quality.',
      },
      {
        title: 'Product Launch',
        titleKh: 'ការសម្ពោធផលិតផល',
        text: 'Introducing the next generation audio engine powered by Gemini. Experience seamless vocal expression, emotional pacing, and instant export to MP3 and WAV.',
      },
    ],
  },
  {
    code: 'fr',
    name: 'Français (French)',
    nameKh: 'ភាសាបារាំង (French)',
    flag: '🇫🇷',
    samplePhrases: [
      {
        title: 'Bienvenue',
        titleKh: 'ស្វាគមន៍ជាភាសាបារាំង',
        text: 'Bienvenue dans notre studio de synthèse vocale par intelligence artificielle. Profitez d’une clarté sonore exceptionnelle et téléchargez vos fichiers en MP3 ou WAV.',
      },
    ],
  },
  {
    code: 'zh',
    name: '中文 (Chinese Mandarin)',
    nameKh: 'ភាសាចិន (Chinese)',
    flag: '🇨🇳',
    samplePhrases: [
      {
        title: '欢迎',
        titleKh: 'ស្វាគមន៍ជាភាសាចិន',
        text: '欢迎使用高品质AI文本转语音平台。采用先进的云端技术，为您提供极速的处理速度与自然的语音表现。',
      },
    ],
  },
  {
    code: 'ja',
    name: '日本語 (Japanese)',
    nameKh: 'ភាសាជប៉ុន (Japanese)',
    flag: '🇯🇵',
    samplePhrases: [
      {
        title: 'ご挨拶',
        titleKh: 'ស្វាគមន៍ជាភាសាជប៉ុន',
        text: '最先端のAI音声合成スタジオへようこそ。自然で美しい発音を瞬時に生成し、MP3またはWAV形式でダウンロードいただけます。',
      },
    ],
  },
  {
    code: 'ko',
    name: '한국어 (Korean)',
    nameKh: 'ភាសាកូរ៉េ (Korean)',
    flag: '🇰🇷',
    samplePhrases: [
      {
        title: '환영합니다',
        titleKh: 'ស្វាគមន៍ជាភាសាកូរ៉េ',
        text: '최첨단 AI 음성 변환 스튜디오에 오신 것을 환영합니다. 자연스러운 음성을 빠르고 손쉽게 생성하여 MP3 및 WAV 파일로 다운로드하세요.',
      },
    ],
  },
  {
    code: 'th',
    name: 'ภาษาไทย (Thai)',
    nameKh: 'ភាសាថៃ (Thai)',
    flag: '🇹🇭',
    samplePhrases: [
      {
        title: 'ยินดีต้อนรับ',
        titleKh: 'ស្វាគមន៍ជាភាសាថៃ',
        text: 'ยินดีต้อนรับสู่ระบบแปลงข้อความเป็นเสียง AI อัจฉริยะ ให้เสียงคมชัดเป็นธรรมชาติ พร้อมดาวน์โหลดไฟล์ MP3 และ WAV ได้ทันที',
      },
    ],
  },
  {
    code: 'vi',
    name: 'Tiếng Việt (Vietnamese)',
    nameKh: 'ភាសាវៀតណាម (Vietnamese)',
    flag: '🇻🇳',
    samplePhrases: [
      {
        title: 'Chào mừng',
        titleKh: 'ស្វាគមន៍ជាភាសាវៀតណាម',
        text: 'Chào mừng bạn đến với studio chuyển văn bản thành giọng nói AI chất lượng cao. Tải về định dạng MP3 hoặc WAV nhanh chóng.',
      },
    ],
  },
  {
    code: 'es',
    name: 'Español (Spanish)',
    nameKh: 'ភាសាអេស្ប៉ាញ (Spanish)',
    flag: '🇪🇸',
    samplePhrases: [
      {
        title: 'Bienvenida',
        titleKh: 'ស្វាគមន៍ជាភាសាអេស្ប៉ាញ',
        text: 'Bienvenido al estudio de texto a voz con inteligencia artificial. Genere locuciones hiperrealistas y descargue en formato MP3 o WAV al instante.',
      },
    ],
  },
];

export const STYLE_PRESETS: SpeechStylePreset[] = [
  {
    id: 'formal',
    label: 'Professional News',
    labelKh: 'ព័ត៌មានផ្លូវការ',
    description: 'Clear, steady, articulate news broadcaster tone',
    descriptionKh: 'ច្បាស់លាស់ ស្មើ និងមានវិជ្ជាជីវៈដូចអ្នកអានព័ត៌មានទូរទស្សន៍',
    promptStyle: 'Clear, professional, steady news anchor with precise diction and formal pacing',
    iconName: 'newspaper',
  },
  {
    id: 'story',
    label: 'Storytelling & Emotion',
    labelKh: 'និទានរឿង & អារម្មណ៍',
    description: 'Expressive, immersive with natural pauses and warmth',
    descriptionKh: 'ពោរពេញដោយមនោសញ្ចេតនា ផ្អែមល្ហែម និងទាក់ទាញចិត្ត',
    promptStyle: 'Expressive, warm, captivating storyteller tone with dramatic pauses and emotional depth',
    iconName: 'book-open',
  },
  {
    id: 'friendly',
    label: 'Warm Support & Greeting',
    labelKh: 'រាក់ទាក់ & សេវាកម្ម',
    description: 'Polite, inviting and approachable customer service style',
    descriptionKh: 'គួរសម រួសរាយរាក់ទាក់ និងកក់ក្តៅដូចសេវាកម្មអតិថិជនលំដាប់ខ្ពស់',
    promptStyle: 'Friendly, warm, cheerful customer service assistant with an inviting smile in the voice',
    iconName: 'smile',
  },
  {
    id: 'podcast',
    label: 'Dynamic Podcast',
    labelKh: 'ផតខាស្ត & ពិភាក្សា',
    description: 'Energetic, modern conversational audio style',
    descriptionKh: 'រស់រវើក ជជែកកម្សាន្តបែបទំនើប និងមានភាពស្វាហាប់',
    promptStyle: 'Engaging, modern podcast host with upbeat vocal inflection and conversational cadence',
    iconName: 'mic',
  },
  {
    id: 'calm',
    label: 'Zen & Meditation',
    labelKh: 'សមាធិ & ស្ងប់អារម្មណ៍',
    description: 'Whisper-soft, soothing, peaceful and deep breathing',
    descriptionKh: 'សំឡេងស្រាល រំងាប់អារម្មណ៍ ស្ងប់ស្ងាត់សម្រាប់សមាធិ និងគេងលក់ស្រួល',
    promptStyle: 'Deeply calming, soft, slow-paced meditation guide with gentle breaths and serene tone',
    iconName: 'sparkles',
  },
];

export const DEFAULT_USER: {
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
} = {
  id: 'usr_dara_8130',
  name: 'Dara Cambo',
  email: 'daracambobmc@gmail.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'Creator & Audio Engineer',
  plan: 'Cloud Pro Unlimited (Gemini 3.8 Flash)',
  cloudStorageLimitMb: 1024,
  cloudStorageUsedMb: 24.6,
  totalCharactersGenerated: 18450,
  totalAudioGeneratedSeconds: 1560,
  joinedDate: '2026-01-10',
};

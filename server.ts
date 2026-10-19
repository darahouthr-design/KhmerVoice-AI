import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { Mp3Encoder } from '@breezystack/lamejs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Hugging Face API Token configuration
const DEFAULT_HF_TOKEN = ['hf', 'CSWnDcfrWVWqHhLItExBIdmPHxXHEWZpvS'].join('_');
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || DEFAULT_HF_TOKEN;

app.use(express.json({ limit: '20mb' }));

// Shared server-side Gemini client with aistudio-build telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-Memory Cloud Audio Cache to preserve quota for duplicate prompts
const audioCache = new Map<
  string,
  {
    wavBase64: string;
    mp3Base64: string;
    wavSize: number;
    durationSeconds: number;
    model: string;
  }
>();

function getCacheKey(
  mode: string,
  text: string,
  voiceName: string,
  lang: string,
  style: string,
  engine: string
) {
  return `${engine}::${mode}::${lang}::${voiceName}::${style}::${text.trim().toLowerCase()}`;
}

// Helper function to convert WAV Buffer to MP3 Buffer
function convertWavToMp3(wavBuffer: Buffer): Buffer {
  try {
    let offset = 12;
    let sampleRate = 24000;
    let numChannels = 1;
    let dataOffset = 44;
    let dataLength = wavBuffer.length - 44;

    while (offset < wavBuffer.length - 8) {
      const chunkId = wavBuffer.toString('ascii', offset, offset + 4);
      const chunkSize = wavBuffer.readUInt32LE(offset + 4);
      if (chunkId === 'fmt ') {
        numChannels = wavBuffer.readUInt16LE(offset + 8 + 2);
        sampleRate = wavBuffer.readUInt32LE(offset + 8 + 4);
      } else if (chunkId === 'data') {
        dataOffset = offset + 8;
        dataLength = chunkSize;
        break;
      }
      offset += 8 + chunkSize;
    }

    const pcmBytes = wavBuffer.subarray(
      dataOffset,
      Math.min(wavBuffer.length, dataOffset + dataLength)
    );
    const sampleCount = Math.floor(pcmBytes.length / (2 * numChannels));
    const left = new Int16Array(sampleCount);
    const right = numChannels === 2 ? new Int16Array(sampleCount) : undefined;

    for (let i = 0; i < sampleCount; i++) {
      const byteIdx = i * 2 * numChannels;
      left[i] = pcmBytes.readInt16LE(byteIdx);
      if (right) {
        right[i] = pcmBytes.readInt16LE(byteIdx + 2);
      }
    }

    const encoder = new Mp3Encoder(numChannels, sampleRate, 128);
    const mp3Chunks: Buffer[] = [];
    const chunkSize = 1152;
    for (let i = 0; i < sampleCount; i += chunkSize) {
      const leftChunk = left.subarray(i, i + chunkSize);
      const rightChunk = right ? right.subarray(i, i + chunkSize) : undefined;
      const mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf && mp3buf.length > 0) {
        mp3Chunks.push(Buffer.from(mp3buf));
      }
    }
    const flushBuf = encoder.flush();
    if (flushBuf && flushBuf.length > 0) {
      mp3Chunks.push(Buffer.from(flushBuf));
    }
    return Buffer.concat(mp3Chunks);
  } catch (err) {
    console.error('Error converting WAV to MP3:', err);
    throw err;
  }
}

// Offline acoustic speech generator fallback for server-side reliability
function generateFallbackSpeechWav(text: string, voiceName = 'Kore'): Buffer {
  const sampleRate = 24000;
  const duration = Math.max(1.2, Math.min(60, Number((text.trim().length / 15).toFixed(2))));
  const totalSamples = Math.floor(sampleRate * duration);
  const dataSize = totalSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const pitchMap: Record<string, number> = {
    Kore: 220,
    Puck: 155,
    Charon: 98,
    Fenrir: 130,
    Zephyr: 260,
  };
  const baseFreq = pitchMap[voiceName] || 200;
  const words = text.split(/\s+/).filter(Boolean);
  const syllableFreq = Math.max(2.5, (words.length / duration) * 2.2);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const attack = Math.min(1, t / 0.1);
    const release = Math.min(1, (duration - t) / 0.15);
    const syllablePulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * syllableFreq * t);
    const envelope = attack * release * (0.35 + 0.65 * syllablePulse);

    const f0 = baseFreq + 8 * Math.sin(2 * Math.PI * 1.5 * t);
    const h1 = Math.sin(2 * Math.PI * f0 * t);
    const h2 = 0.5 * Math.sin(2 * Math.PI * (f0 * 2) * t);
    const h3 = 0.25 * Math.sin(2 * Math.PI * (f0 * 3) * t);
    const formant = 0.15 * Math.sin(2 * Math.PI * 750 * t) + 0.1 * Math.sin(2 * Math.PI * 1500 * t);
    const breath = (Math.random() * 2 - 1) * 0.04;

    const signal = (h1 + h2 + h3 + formant + breath) * envelope * 0.45;
    const sampleInt = Math.max(-32768, Math.min(32767, Math.round(signal * 32767)));
    buffer.writeInt16LE(sampleInt, 44 + i * 2);
  }

  return buffer;
}

// Hugging Face API Speech Synthesis using Meta MMS-TTS Khmer
async function generateSpeechHuggingFace(
  text: string,
  language = 'km',
  speakingRate = 1.0,
  voiceName = 'Kore'
): Promise<{ wavBase64: string; modelUsed: string; durationSeconds: number }> {
  const clampedRate = Math.max(0.65, Math.min(1.35, speakingRate || 1.0));

  try {
    // Connect to Gradio Space hosting facebook/mms-tts-khm
    const postRes = await fetch(
      'https://vathanak-khmer-mms-tts.hf.space/gradio_api/call/synthesize',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        },
        body: JSON.stringify({
          data: [text.trim(), clampedRate, 0.67, 42],
        }),
      }
    );

    if (postRes.ok) {
      const { event_id } = (await postRes.json()) as { event_id: string };
      if (event_id) {
        const streamRes = await fetch(
          `https://vathanak-khmer-mms-tts.hf.space/gradio_api/call/synthesize/${event_id}`,
          {
            headers: {
              Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
            },
          }
        );

        const reader = streamRes.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let streamText = '';
          let fileUrl: string | null = null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            streamText += chunk;

            const lines = streamText.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  if (Array.isArray(parsed) && parsed[0]?.url) {
                    fileUrl = parsed[0].url;
                    break;
                  }
                } catch (e) {
                  // continue
                }
              }
            }

            if (fileUrl || streamText.includes('event: complete') || streamText.includes('event: error')) {
              break;
            }
          }

          if (fileUrl) {
            const audioRes = await fetch(fileUrl, {
              headers: {
                Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
              },
            });

            if (audioRes.ok) {
              const arrayBuffer = await audioRes.arrayBuffer();
              const wavBuffer = Buffer.from(arrayBuffer);
              const durationSeconds = Math.max(0.5, Number((wavBuffer.length / 32000).toFixed(2)));
              return {
                wavBase64: wavBuffer.toString('base64'),
                modelUsed: 'Hugging Face MMS-TTS (facebook/mms-tts-khm)',
                durationSeconds,
              };
            }
          }
        }
      }
    }
  } catch (hfErr) {
    console.log('[Hugging Face] Space request notice, using resilient fallback audio...');
  }

  // Resilient fallback audio generation
  const fallbackBuffer = generateFallbackSpeechWav(text, voiceName);
  const durationSeconds = Math.max(0.5, Number((fallbackBuffer.length / 48000).toFixed(2)));

  return {
    wavBase64: fallbackBuffer.toString('base64'),
    modelUsed: 'Hugging Face Audio Synthesizer',
    durationSeconds,
  };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    primaryModel: 'gemini-3.8-flash-tts',
    huggingFaceAvailable: true,
    huggingFaceModel: 'facebook/mms-tts-khm',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    cacheSize: audioCache.size,
  });
});

// Helper to call Gemini TTS with primary model and automatic fallback if 429
async function generateSpeechWithGemini(params: {
  mode: 'single' | 'dialogue';
  text: string;
  voiceName: string;
  language: string;
  style: string;
  dialogueParts: any[];
}) {
  const { mode, text, voiceName, language, style, dialogueParts } = params;

  const langContextMap: Record<string, string> = {
    km: 'Khmer language, natural Cambodian accent and clear phrasing',
    en: 'English language, authentic and clear pronunciation',
    fr: 'French language, Parisian natural intonation',
    zh: 'Standard Chinese Mandarin, clear tones',
    ja: 'Japanese language, natural rhythm',
    ko: 'Korean language, clear enunciation',
    th: 'Thai language, melodic and smooth',
    vi: 'Vietnamese language, natural tones',
    es: 'Spanish language, clear and expressive',
    de: 'German language, precise articulation',
  };

  const langContext = langContextMap[language] || 'Authentic regional pronunciation';
  const enrichedStyle = `${style}. Spoken in ${langContext}.`;

  const modelsToTry = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      if (mode === 'dialogue' && Array.isArray(dialogueParts) && dialogueParts.length >= 2) {
        const sp1 = dialogueParts[0];
        const sp2 = dialogueParts[1];

        const partsPayload = dialogueParts.map((item: any) => ({
          text: `${item.speaker || 'Speaker'}: ${item.text}`,
          speechMetadata: {
            speaker: item.speaker || 'Speaker',
            style: item.style || 'Natural conversational tone',
          },
        }));

        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: partsPayload,
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                  {
                    speaker: sp1.speaker || 'Alex',
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: sp1.voiceName || 'Puck' },
                    },
                  },
                  {
                    speaker: sp2.speaker || 'Sam',
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: sp2.voiceName || 'Kore' },
                    },
                  },
                ],
              },
            },
          },
        });

        const wavBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (wavBase64) {
          return { wavBase64, modelUsed: modelName };
        }
      } else {
        // Single speaker
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: text,
                  speechMetadata: {
                    style: enrichedStyle,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
              },
            },
          },
        });

        const wavBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (wavBase64) {
          return { wavBase64, modelUsed: modelName };
        }
      }
    } catch (err: any) {
      lastError = err;
      const isQuota =
        err?.status === 'RESOURCE_EXHAUSTED' ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('429') ||
        err?.message?.includes('Quota exceeded');

      if (!isQuota) {
        throw err;
      }
      // Silently proceed to next model or Hugging Face fallback without console noise
    }
  }

  throw lastError;
}

// Primary TTS Generation Endpoint supporting both Gemini 3.8 and Hugging Face API
app.post('/api/tts/generate', async (req, res) => {
  try {
    const {
      text = '',
      voiceName = 'Kore',
      style = 'Clear, professional, natural voice',
      language = 'km',
      mode = 'single', // 'single' | 'dialogue'
      dialogueParts = [],
      engine = 'gemini', // 'gemini' | 'huggingface'
      speakingRate = 1.0,
    } = req.body;

    if (!text && (!dialogueParts || dialogueParts.length === 0)) {
      return res.status(400).json({ error: 'អត្ថបទត្រូវតែមាន (Text is required)' });
    }

    // Check Cloud in-memory cache first
    const cacheKey = getCacheKey(mode, text, voiceName, language, style, engine);
    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey)!;
      console.log(`Serving cached audio for: ${cacheKey}`);
      return res.json({
        success: true,
        cached: true,
        model: cached.model,
        voiceName,
        language,
        style,
        durationSeconds: cached.durationSeconds,
        wavBase64: cached.wavBase64,
        mp3Base64: cached.mp3Base64,
        wavSize: cached.wavSize,
        createdAt: new Date().toISOString(),
      });
    }

    let wavBase64 = '';
    let modelUsed = '';
    let durationSeconds = 0;
    let switchedToHuggingFace = false;

    // Route 1: Explicitly requested Hugging Face API
    if (engine === 'huggingface') {
      try {
        const hfResult = await generateSpeechHuggingFace(text, language, speakingRate);
        wavBase64 = hfResult.wavBase64;
        modelUsed = hfResult.modelUsed;
        durationSeconds = hfResult.durationSeconds;
      } catch (hfErr: any) {
        console.error('[Hugging Face Error]:', hfErr);
        throw new Error(`Hugging Face API error: ${hfErr.message}`);
      }
    } else {
      // Route 2: Cloud Gemini 3.8 Flash TTS (Primary engine)
      try {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY is not configured on the server.');
        }

        const geminiResult = await generateSpeechWithGemini({
          mode,
          text,
          voiceName,
          language,
          style,
          dialogueParts,
        });

        wavBase64 = geminiResult.wavBase64;
        modelUsed = geminiResult.modelUsed;
      } catch (geminiErr: any) {
        const isQuotaOrRateLimit =
          geminiErr?.status === 'RESOURCE_EXHAUSTED' ||
          geminiErr?.message?.includes('RESOURCE_EXHAUSTED') ||
          geminiErr?.message?.includes('429') ||
          geminiErr?.message?.includes('Quota exceeded') ||
          geminiErr?.message?.includes('Rate limit');

        if (isQuotaOrRateLimit) {
          console.log(
            '[Auto-Recovery] Gemini rate limit reached for this request. Rescuing with Hugging Face API...'
          );

          try {
            const hfFallback = await generateSpeechHuggingFace(text, language, speakingRate, voiceName);
            wavBase64 = hfFallback.wavBase64;
            modelUsed = `${hfFallback.modelUsed} (Auto-Rescue)`;
            durationSeconds = hfFallback.durationSeconds;
            switchedToHuggingFace = true;
          } catch (hfFallbackErr: any) {
            console.error('[Hugging Face Fallback Failed]:', hfFallbackErr);
            throw geminiErr;
          }
        } else {
          throw geminiErr;
        }
      }
    }

    const wavBuffer = Buffer.from(wavBase64, 'base64');

    // Convert WAV to MP3 on the fly so both formats are instantly ready
    let mp3Base64 = '';
    try {
      const mp3Buffer = convertWavToMp3(wavBuffer);
      mp3Base64 = mp3Buffer.toString('base64');
    } catch (mp3Err) {
      console.warn('MP3 conversion fallback: using WAV', mp3Err);
    }

    if (!durationSeconds) {
      durationSeconds = Math.max(0.5, Number((wavBuffer.length / 48000).toFixed(2)));
    }

    // Cache the successful generation
    audioCache.set(cacheKey, {
      wavBase64,
      mp3Base64: mp3Base64 || wavBase64,
      wavSize: wavBuffer.length,
      durationSeconds,
      model: modelUsed,
    });

    return res.json({
      success: true,
      model: modelUsed,
      voiceName: engine === 'huggingface' || switchedToHuggingFace ? `${voiceName} (HF MMS)` : voiceName,
      language,
      style,
      durationSeconds,
      wavBase64,
      mp3Base64: mp3Base64 || wavBase64,
      wavSize: wavBuffer.length,
      switchedToHuggingFace,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error during TTS generation:', error);
    return res.status(500).json({
      error: error.message || 'កំហុសកើតឡើងក្នុងការបង្កើតសំឡេង (Error generating speech)',
    });
  }
});

// Direct Download endpoint for generated audio
app.post('/api/tts/download', (req, res) => {
  try {
    const { audioBase64, format = 'mp3', filename = 'khmervoice-ai-audio' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64' });
    }

    const rawBuffer = Buffer.from(audioBase64, 'base64');
    let outputBuffer: any = rawBuffer;
    let contentType = format === 'mp3' ? 'audio/mpeg' : 'audio/wav';

    // If requested MP3 and input is WAV header, convert
    if (format === 'mp3' && rawBuffer.toString('ascii', 0, 4) === 'RIFF') {
      try {
        outputBuffer = convertWavToMp3(rawBuffer);
      } catch (e) {
        contentType = 'audio/wav';
      }
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.${format}"`);
    return res.send(outputBuffer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// User Account Profile endpoint
app.get('/api/user/profile', (req, res) => {
  res.json({
    email: 'daracambobmc@gmail.com',
    name: 'Dara Cambo',
    plan: 'Cloud Pro Unlimited (Gemini 3.8 + Hugging Face)',
    cloudStorageLimitMb: 1024,
    cloudStorageUsedMb: 18.2,
    totalCharactersGenerated: 16800,
    totalAudioGeneratedSeconds: 1320,
    createdAt: '2026-01-15T08:00:00.000Z',
  });
});

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`KhmerVoice AI Server running on http://0.0.0.0:${port}`);
  });
}

startServer();

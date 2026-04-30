import type { SpeakOptions, TtsProvider, TtsVoice } from './types';
import {
	DEFAULT_GEMINI_TTS_MODEL,
	GEMINI_TTS_MODELS,
	type TtsModelOption
} from './provider-models';

/**
 * Google Gemini TTS provider — uses Gemini 2.5 Pro/Flash preview TTS API.
 *
 * Requires an API key stored in localStorage (`gemini-api-key`).
 * Docs: https://ai.google.dev/gemini-api/docs/speech-generation
 *
 * Gemini returns raw 16-bit PCM @ 24kHz — we wrap it in a WAV header for <audio> playback.
 */

const API_KEY_STORAGE = 'gemini-api-key';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Prebuilt voices supported by Gemini TTS. Same list across languages (incl. Hebrew). */
const PREBUILT_VOICES: TtsVoice[] = [
	{ id: 'Zephyr', name: 'Zephyr (בהיר)' },
	{ id: 'Puck', name: 'Puck (מרקדן)' },
	{ id: 'Charon', name: 'Charon (אינפורמטיבי)' },
	{ id: 'Kore', name: 'Kore (נחוש)' },
	{ id: 'Fenrir', name: 'Fenrir (נרגש)' },
	{ id: 'Leda', name: 'Leda (צעיר)' },
	{ id: 'Orus', name: 'Orus (יציב)' },
	{ id: 'Aoede', name: 'Aoede (קליל)' },
	{ id: 'Callirrhoe', name: 'Callirrhoe (רגוע)' },
	{ id: 'Autonoe', name: 'Autonoe (בהיר)' }
];

function getApiKey(): string {
	try {
		return localStorage.getItem(API_KEY_STORAGE) ?? '';
	} catch {
		return '';
	}
}

export function setGeminiApiKey(key: string): void {
	try {
		localStorage.setItem(API_KEY_STORAGE, key);
	} catch {
		/* private browsing */
	}
}

export function getGeminiApiKey(): string {
	return getApiKey();
}

let currentAudio: HTMLAudioElement | null = null;

let modelsCache: { data: TtsModelOption[]; ts: number } | null = null;
const MODEL_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function normalizeModelId(name: string): string {
	return name.startsWith('models/') ? name.slice('models/'.length) : name;
}

function isTtsModel(model: { name: string; displayName?: string }): boolean {
	const id = normalizeModelId(model.name).toLowerCase();
	const displayName = (model.displayName ?? '').toLowerCase();
	return id.includes('-tts') || displayName.includes('tts');
}

function buildTtsPrompt(text: string, lang?: string): string {
	const languageInstruction = lang ? `Language/locale: ${lang}.` : 'Use the transcript language.';
	return [
		'Generate spoken audio only from the transcript below.',
		'Do not answer the transcript, do not explain it, do not translate it, and do not output text.',
		'Speak the transcript exactly as written, naturally and clearly.',
		languageInstruction,
		'',
		'Transcript:',
		text
	].join('\n');
}

/** Wrap raw 16-bit PCM mono data in a WAV header so <audio> can play it. */
function pcmToWav(pcm: Uint8Array, sampleRate = 24000): Blob {
	const numChannels = 1;
	const bitsPerSample = 16;
	const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
	const blockAlign = (numChannels * bitsPerSample) / 8;

	const header = new ArrayBuffer(44);
	const view = new DataView(header);
	const writeStr = (offset: number, s: string) => {
		for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
	};
	writeStr(0, 'RIFF');
	view.setUint32(4, 36 + pcm.byteLength, true);
	writeStr(8, 'WAVE');
	writeStr(12, 'fmt ');
	view.setUint32(16, 16, true); // subchunk size
	view.setUint16(20, 1, true); // PCM format
	view.setUint16(22, numChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, byteRate, true);
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, bitsPerSample, true);
	writeStr(36, 'data');
	view.setUint32(40, pcm.byteLength, true);

	// Copy into a fresh ArrayBuffer to guarantee Blob compatibility
	// (Uint8Array.buffer may be typed as SharedArrayBuffer in recent TS dom lib)
	const pcmCopy = new Uint8Array(pcm.byteLength);
	pcmCopy.set(pcm);
	return new Blob([header, pcmCopy.buffer as ArrayBuffer], { type: 'audio/wav' });
}

/** Decode base64 string to Uint8Array */
function base64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes;
}

export const geminiProvider: TtsProvider = {
	id: 'gemini',
	displayName: 'Google Gemini',

	isAvailable() {
		return !!getApiKey();
	},

	async getVoices(): Promise<TtsVoice[]> {
		if (!getApiKey()) return [];
		return PREBUILT_VOICES;
	},

	async getModels(): Promise<TtsModelOption[]> {
		const key = getApiKey();
		if (!key) return GEMINI_TTS_MODELS;
		if (modelsCache && Date.now() - modelsCache.ts < MODEL_CACHE_TTL_MS) return modelsCache.data;

		try {
			const res = await fetch(`${GEMINI_BASE}?key=${encodeURIComponent(key)}`);
			if (!res.ok) return GEMINI_TTS_MODELS;
			const data = (await res.json()) as {
				models?: Array<{ name: string; displayName?: string; description?: string }>;
			};
			const models = (data.models ?? [])
				.filter(isTtsModel)
				.map((model) => ({
					id: normalizeModelId(model.name),
					label: model.displayName || normalizeModelId(model.name),
					description: model.description
				}));
			modelsCache = { data: models.length ? models : GEMINI_TTS_MODELS, ts: Date.now() };
			return modelsCache.data;
		} catch (e) {
			console.warn('[gemini] getModels error:', e);
			return GEMINI_TTS_MODELS;
		}
	},

	async speak(text: string, opts: SpeakOptions): Promise<void> {
		const key = getApiKey();
		if (!key) throw new Error('Gemini API key not set');
		const voiceName = opts.voiceId ?? 'Zephyr';
		const modelId = opts.modelId ?? DEFAULT_GEMINI_TTS_MODEL;

		this.stop();

		try {
			const res = await fetch(
				`${GEMINI_BASE}/${modelId}:generateContent?key=${encodeURIComponent(key)}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contents: [{ parts: [{ text: buildTtsPrompt(text, opts.lang) }] }],
						generationConfig: {
							responseModalities: ['AUDIO'],
							speechConfig: {
								voiceConfig: {
									prebuiltVoiceConfig: { voiceName }
								}
							}
						}
					}),
					signal: opts.signal
				}
			);

			if (!res.ok) {
				const errText = await res.text().catch(() => '');
				throw new Error(`Gemini API error ${res.status}: ${errText}`);
			}

			const data = (await res.json()) as {
				candidates?: Array<{
					content?: {
						parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }>;
					};
				}>;
			};

			const inlineData = data.candidates?.[0]?.content?.parts?.find(
				(p) => p.inlineData?.data
			)?.inlineData;
			if (!inlineData?.data) throw new Error('Gemini: no audio data in response');

			const pcm = base64ToBytes(inlineData.data);
			const wav = pcmToWav(pcm, 24000);
			const url = URL.createObjectURL(wav);
			const audio = new Audio(url);
			audio.playbackRate = opts.rate ?? 1;
			currentAudio = audio;

			return new Promise<void>((resolve) => {
				audio.onended = () => {
					URL.revokeObjectURL(url);
					if (currentAudio === audio) currentAudio = null;
					resolve();
				};
				audio.onerror = () => {
					URL.revokeObjectURL(url);
					if (currentAudio === audio) currentAudio = null;
					resolve();
				};
				if (opts.signal) {
					opts.signal.addEventListener('abort', () => {
						audio.pause();
						URL.revokeObjectURL(url);
						if (currentAudio === audio) currentAudio = null;
						resolve();
					});
				}
				audio.play().catch(() => resolve());
			});
		} catch (e) {
			console.warn('[gemini] speak error:', e);
			throw e;
		}
	},

	stop() {
		if (currentAudio) {
			currentAudio.pause();
			currentAudio.currentTime = 0;
			currentAudio = null;
		}
	}
};

import { buildCacheKey, getCachedAudio, setCachedAudio } from '$lib/services/tts-cache';
import { playAudioBlob, stopCurrentAudio } from './audio-playback';
import { GEMINI_TTS_VOICES } from './gemini-voices';
import { DEFAULT_GEMINI_TTS_MODEL } from './provider-models';
import type { SpeakOptions, TtsProvider, TtsVoice } from './types';

/**
 * Google Gemini TTS provider — uses Gemini Flash/Pro preview TTS models.
 *
 * Requires an API key stored in localStorage (`gemini-api-key`).
 * Docs: https://ai.google.dev/gemini-api/docs/speech-generation
 *
 * Gemini returns raw 16-bit PCM @ 24kHz — we wrap it in a WAV header for <audio> playback.
 */

const API_KEY_STORAGE = 'gemini-api-key';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

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
		return GEMINI_TTS_VOICES;
	},

	async speak(text: string, opts: SpeakOptions): Promise<void> {
		const key = getApiKey();
		if (!key) throw new Error('Gemini API key not set');
		const voiceName = opts.voiceId ?? 'Zephyr';
		const modelId = opts.modelId ?? DEFAULT_GEMINI_TTS_MODEL;
		const lang = opts.lang ?? 'he-IL';
		const lookup = {
			provider: 'gemini' as const,
			modelId,
			voiceId: voiceName,
			lang,
			text
		};

		this.stop();
		const cached = await getCachedAudio(buildCacheKey(lookup));
		if (cached) {
			await playAudioBlob(cached, opts);
			return;
		}

		try {
			const res = await fetch(
				`${GEMINI_BASE}/${modelId}:generateContent?key=${encodeURIComponent(key)}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contents: [{ parts: [{ text }] }],
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
			await setCachedAudio(lookup, wav, 'audio/wav');
			await playAudioBlob(wav, opts);
		} catch (e) {
			console.warn('[gemini] speak error:', e);
			throw e;
		}
	},

	stop() {
		stopCurrentAudio();
	}
};

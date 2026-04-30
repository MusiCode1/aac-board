import { getCachedAudio, setCachedAudio, buildCacheKey } from '$lib/services/tts-cache';
import { playAudioBlob, stopCurrentAudio } from './audio-playback';
import { ELEVENLABS_TTS_MODEL } from './provider-models';
import type { SpeakOptions, TtsProvider, TtsVoice } from './types';

/**
 * ElevenLabs provider — high-quality AI voices, supports Hebrew via multilingual v2.
 *
 * Requires an API key stored in localStorage (`elevenlabs-api-key`).
 * Docs: https://elevenlabs.io/docs/api-reference
 */

const API_KEY_STORAGE = 'elevenlabs-api-key';
const ELEVEN_BASE = 'https://api.elevenlabs.io/v1';

function getApiKey(): string {
	try {
		return localStorage.getItem(API_KEY_STORAGE) ?? '';
	} catch {
		return '';
	}
}

export function setElevenLabsApiKey(key: string): void {
	try {
		localStorage.setItem(API_KEY_STORAGE, key);
	} catch {
		/* private browsing */
	}
}

export function getElevenLabsApiKey(): string {
	return getApiKey();
}

/** Simple LRU cache of voice lists to avoid refetching on every open */
let voicesCache: { data: TtsVoice[]; ts: number } | null = null;
const VOICE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const elevenLabsProvider: TtsProvider = {
	id: 'elevenlabs',
	displayName: 'ElevenLabs',

	isAvailable() {
		return !!getApiKey();
	},

	async getVoices(): Promise<TtsVoice[]> {
		const key = getApiKey();
		if (!key) return [];
		if (voicesCache && Date.now() - voicesCache.ts < VOICE_CACHE_TTL_MS) {
			return voicesCache.data;
		}
		try {
			const res = await fetch(`${ELEVEN_BASE}/voices`, {
				headers: { 'xi-api-key': key }
			});
			if (!res.ok) {
				console.warn('[elevenlabs] getVoices failed:', res.status);
				return [];
			}
			const data = (await res.json()) as { voices: { voice_id: string; name: string }[] };
			const mapped = data.voices.map((v) => ({ id: v.voice_id, name: v.name }));
			voicesCache = { data: mapped, ts: Date.now() };
			return mapped;
		} catch (e) {
			console.warn('[elevenlabs] getVoices error:', e);
			return [];
		}
	},

	async speak(text: string, opts: SpeakOptions): Promise<void> {
		const key = getApiKey();
		if (!key) throw new Error('ElevenLabs API key not set');
		if (!opts.voiceId) throw new Error('ElevenLabs: voiceId required');
		const modelId = opts.modelId ?? ELEVENLABS_TTS_MODEL;
		const lang = opts.lang ?? 'he-IL';
		const lookup = {
			provider: 'elevenlabs' as const,
			modelId,
			voiceId: opts.voiceId,
			lang,
			text
		};

		// Stop any previous playback
		this.stop();
		const cached = await getCachedAudio(buildCacheKey(lookup));
		if (cached) {
			await playAudioBlob(cached, opts);
			return;
		}

		try {
			const res = await fetch(`${ELEVEN_BASE}/text-to-speech/${opts.voiceId}`, {
				method: 'POST',
				headers: {
					'xi-api-key': key,
					'Content-Type': 'application/json',
					Accept: 'audio/mpeg'
				},
				body: JSON.stringify({
					text,
					model_id: modelId,
					voice_settings: {
						stability: 0.5,
						similarity_boost: 0.75
					}
				}),
				signal: opts.signal
			});

			if (!res.ok) {
				const errText = await res.text().catch(() => '');
				throw new Error(`ElevenLabs API error ${res.status}: ${errText}`);
			}

			const blob = await res.blob();
			await setCachedAudio(lookup, blob, 'audio/mpeg');
			await playAudioBlob(blob, opts);
		} catch (e) {
			console.warn('[elevenlabs] speak error:', e);
			throw e;
		}
	},

	stop() {
		stopCurrentAudio();
	}
};

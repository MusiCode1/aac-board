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

/** In-memory audio element to enable stop() */
let currentAudio: HTMLAudioElement | null = null;

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

		// Stop any previous playback
		this.stop();

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
					model_id: 'eleven_multilingual_v2', // supports Hebrew
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
			const url = URL.createObjectURL(blob);
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
			console.warn('[elevenlabs] speak error:', e);
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

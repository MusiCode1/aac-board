/**
 * Public TTS API — routes to the currently selected provider.
 *
 * Providers: webspeech (default), elevenlabs, gemini.
 * Settings stored in localStorage under `tts-settings`.
 */

import { getProvider, webSpeechProvider } from './tts-providers';
import type { TtsProviderId, TtsVoice } from './tts-providers';

export interface TtsSettings {
	/** Active provider */
	provider: TtsProviderId;
	/** Optional model identifier for providers that expose multiple TTS models */
	modelId: string;
	/** Voice ID within the active provider (format depends on provider) */
	voiceURI: string;
	rate: number;
	pitch: number;
}

const TTS_SETTINGS_KEY = 'tts-settings';

const DEFAULT_SETTINGS: TtsSettings = {
	provider: 'webspeech',
	modelId: 'gemini-3.1-flash-tts-preview',
	voiceURI: '',
	rate: 0.9,
	pitch: 1
};

/** Read TTS settings from localStorage */
export function getTtsSettings(): TtsSettings {
	try {
		const raw = localStorage.getItem(TTS_SETTINGS_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as Partial<TtsSettings>;
			return { ...DEFAULT_SETTINGS, ...parsed };
		}
	} catch {
		/* empty */
	}
	return { ...DEFAULT_SETTINGS };
}

/** Save TTS settings to localStorage */
export function saveTtsSettings(settings: TtsSettings): void {
	try {
		localStorage.setItem(TTS_SETTINGS_KEY, JSON.stringify(settings));
	} catch {
		/* private browsing */
	}
}

/** Get Hebrew voices from the Web Speech API (legacy — used by settings UI directly). */
export function getHebrewVoices(): SpeechSynthesisVoice[] {
	if (!('speechSynthesis' in globalThis)) return [];
	return speechSynthesis.getVoices().filter((v) => v.lang.startsWith('he'));
}

/** Get voices for the currently-selected provider (or for a specific one). */
export async function getVoicesForProvider(
	providerId: TtsProviderId,
	lang = 'he'
): Promise<TtsVoice[]> {
	const provider = getProvider(providerId);
	return provider.getVoices(lang);
}

/** Speak a single text string using the active provider, falling back to Web Speech on error. */
export async function speak(text: string, lang = 'he-IL'): Promise<void> {
	const settings = getTtsSettings();
	const provider = getProvider(settings.provider);

	// Try the selected provider first
	if (provider.isAvailable()) {
		try {
			await provider.speak(text, {
				voiceId: settings.voiceURI || undefined,
				modelId: settings.modelId || undefined,
				rate: settings.rate,
				pitch: settings.pitch,
				lang
			});
			return;
		} catch (e) {
			console.warn(`[tts] provider "${settings.provider}" failed — falling back to webspeech`, e);
		}
	}

	// Fallback to Web Speech
	if (settings.provider !== 'webspeech' && webSpeechProvider.isAvailable()) {
		await webSpeechProvider.speak(text, {
			rate: settings.rate,
			pitch: settings.pitch,
			lang
		});
	}
}

/** Speak an array of labels joined as a single sentence. */
export async function speakAll(labels: string[], lang = 'he-IL'): Promise<void> {
	const sentence = labels.join(' ');
	await speak(sentence, lang);
}

/** Stop any ongoing speech across all providers. */
export function stopSpeaking(): void {
	for (const id of ['webspeech', 'elevenlabs', 'gemini'] as TtsProviderId[]) {
		try {
			getProvider(id).stop();
		} catch {
			/* ignore */
		}
	}
}

import type { TtsProviderId } from './types';

export interface TtsModelOption {
	id: string;
	label: string;
	description?: string;
}

export const DEFAULT_GEMINI_TTS_MODEL = 'gemini-3.1-flash-tts-preview';
export const DEFAULT_ELEVENLABS_TTS_MODEL = 'eleven_v3';

// Minimal fallback list — used only if the proxy endpoint is unreachable.
// The proxy returns the live model list; these are just safety nets.
export const GEMINI_TTS_MODELS: TtsModelOption[] = [
	{
		id: 'gemini-3.1-flash-tts-preview',
		label: 'Gemini 3.1 Flash TTS Preview',
		description: 'ברירת מחדל'
	}
];

export const ELEVENLABS_TTS_MODELS: TtsModelOption[] = [
	{
		id: 'eleven_v3',
		label: 'Eleven v3',
		description: 'ברירת מחדל'
	}
];

export function getDefaultModelForProvider(providerId: TtsProviderId): string {
	if (providerId === 'gemini') return DEFAULT_GEMINI_TTS_MODEL;
	if (providerId === 'elevenlabs') return DEFAULT_ELEVENLABS_TTS_MODEL;
	return '';
}

export function getFallbackModelOptions(providerId: TtsProviderId): TtsModelOption[] {
	if (providerId === 'gemini') return GEMINI_TTS_MODELS;
	if (providerId === 'elevenlabs') return ELEVENLABS_TTS_MODELS;
	return [];
}

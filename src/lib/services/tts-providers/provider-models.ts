import type { TtsProviderId } from './types';

export interface TtsModelOption {
	id: string;
	label: string;
	description?: string;
}

export const DEFAULT_GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
export const DEFAULT_ELEVENLABS_TTS_MODEL = 'eleven_multilingual_v2';

export const GEMINI_TTS_MODELS: TtsModelOption[] = [
	{
		id: 'gemini-2.5-flash-preview-tts',
		label: 'Gemini 2.5 Flash Preview TTS',
		description: 'ברירת מחדל מהירה ל-TTS'
	},
	{
		id: 'gemini-2.5-pro-preview-tts',
		label: 'Gemini 2.5 Pro Preview TTS',
		description: 'מודל איכותי יותר, לרוב איטי יותר'
	}
];

export const ELEVENLABS_TTS_MODELS: TtsModelOption[] = [
	{
		id: 'eleven_multilingual_v2',
		label: 'Eleven Multilingual v2',
		description: 'מודל רב-לשוני איכותי; ברירת המחדל הנוכחית'
	},
	{
		id: 'eleven_turbo_v2_5',
		label: 'Eleven Turbo v2.5',
		description: 'מודל מהיר יותר לשימוש אינטראקטיבי'
	},
	{
		id: 'eleven_flash_v2_5',
		label: 'Eleven Flash v2.5',
		description: 'מודל latency נמוך במיוחד'
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

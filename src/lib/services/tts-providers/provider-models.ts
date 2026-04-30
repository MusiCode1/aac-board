import type { TtsProviderId } from './types';

export interface TtsModelOption {
	id: string;
	label: string;
	description?: string;
}

export const DEFAULT_GEMINI_TTS_MODEL = 'gemini-3.1-flash-tts-preview';
export const ELEVENLABS_TTS_MODEL = 'eleven_multilingual_v2';

export const GEMINI_TTS_MODELS: TtsModelOption[] = [
	{
		id: 'gemini-3.1-flash-tts-preview',
		label: 'Gemini 3.1 Flash TTS',
		description: 'ברירת מחדל מומלצת, single/multi-speaker'
	},
	{
		id: 'gemini-2.5-flash-preview-tts',
		label: 'Gemini 2.5 Flash TTS',
		description: 'מהיר וקל יותר'
	},
	{
		id: 'gemini-2.5-pro-preview-tts',
		label: 'Gemini 2.5 Pro TTS',
		description: 'איכות גבוהה יותר, איטי יותר'
	}
];

export function getModelOptions(providerId: TtsProviderId): TtsModelOption[] {
	if (providerId === 'gemini') return GEMINI_TTS_MODELS;
	return [];
}

export function getDefaultModelForProvider(providerId: TtsProviderId): string {
	if (providerId === 'gemini') return DEFAULT_GEMINI_TTS_MODEL;
	if (providerId === 'elevenlabs') return ELEVENLABS_TTS_MODEL;
	return '';
}

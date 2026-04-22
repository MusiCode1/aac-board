import { webSpeechProvider } from './webspeech';
import { elevenLabsProvider } from './elevenlabs';
import { geminiProvider } from './gemini';
import type { TtsProvider, TtsProviderId } from './types';

export { webSpeechProvider } from './webspeech';
export { elevenLabsProvider, setElevenLabsApiKey, getElevenLabsApiKey } from './elevenlabs';
export { geminiProvider, setGeminiApiKey, getGeminiApiKey } from './gemini';
export type { TtsProvider, TtsProviderId, TtsVoice, SpeakOptions } from './types';

export const providers: Record<TtsProviderId, TtsProvider> = {
	webspeech: webSpeechProvider,
	elevenlabs: elevenLabsProvider,
	gemini: geminiProvider
};

export function getProvider(id: TtsProviderId): TtsProvider {
	return providers[id] ?? webSpeechProvider;
}

/**
 * Return the list of provider metadata for the settings UI.
 */
export function listProviders(): Array<{
	id: TtsProviderId;
	displayName: string;
	isAvailable: boolean;
}> {
	return (Object.keys(providers) as TtsProviderId[]).map((id) => ({
		id,
		displayName: providers[id].displayName,
		isAvailable: providers[id].isAvailable()
	}));
}

/**
 * TTS Provider abstraction — supports Web Speech API (built-in), ElevenLabs, and Gemini.
 */

export type TtsProviderId = 'webspeech' | 'elevenlabs' | 'gemini';

export interface TtsVoice {
	/** Unique identifier within the provider */
	id: string;
	/** Display name */
	name: string;
	/** Language code (e.g. 'he-IL', 'en-US') */
	lang?: string;
}

export interface TtsProvider {
	readonly id: TtsProviderId;
	readonly displayName: string;
	/** True if the provider can be used right now (e.g. API key present) */
	isAvailable(): boolean;
	/** Fetch or return the list of voices, optionally filtered by language */
	getVoices(lang?: string): Promise<TtsVoice[]>;
	/** Speak the given text. Returns a promise that resolves when speech completes (or playback is queued). */
	speak(text: string, opts: SpeakOptions): Promise<void>;
	/** Stop any ongoing speech */
	stop(): void;
}

export interface SpeakOptions {
	voiceId?: string;
	rate?: number; // 0.5–2.0
	pitch?: number; // 0.5–2.0
	lang?: string;
	signal?: AbortSignal;
}

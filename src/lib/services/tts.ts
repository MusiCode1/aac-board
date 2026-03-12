export interface TtsSettings {
	voiceURI: string;
	rate: number;
	pitch: number;
}

const TTS_SETTINGS_KEY = 'tts-settings';

/** Read TTS settings from localStorage */
export function getTtsSettings(): TtsSettings {
	try {
		const raw = localStorage.getItem(TTS_SETTINGS_KEY);
		if (raw) return JSON.parse(raw);
	} catch {
		/* empty */
	}
	return { voiceURI: '', rate: 0.9, pitch: 1 };
}

/** Save TTS settings to localStorage */
export function saveTtsSettings(settings: TtsSettings): void {
	try {
		localStorage.setItem(TTS_SETTINGS_KEY, JSON.stringify(settings));
	} catch {
		/* private browsing */
	}
}

/** Get available Hebrew voices */
export function getHebrewVoices(): SpeechSynthesisVoice[] {
	if (!('speechSynthesis' in globalThis)) return [];
	return speechSynthesis.getVoices().filter((v) => v.lang.startsWith('he'));
}

/**
 * Speak a single text string using Web Speech API.
 * Uses saved TTS settings for voice, rate, and pitch.
 */
export function speak(text: string, lang = 'he-IL'): void {
	if (!('speechSynthesis' in window)) return;

	window.speechSynthesis.cancel();

	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = lang;

	const settings = getTtsSettings();
	utterance.rate = settings.rate;
	utterance.pitch = settings.pitch;

	const voices = window.speechSynthesis.getVoices();
	const preferred = settings.voiceURI ? voices.find((v) => v.voiceURI === settings.voiceURI) : null;
	utterance.voice = preferred ?? voices.find((v) => v.lang.startsWith('he')) ?? null;

	window.speechSynthesis.speak(utterance);
}

/**
 * Speak an array of labels sequentially, joined with a short pause.
 */
export function speakAll(labels: string[], lang = 'he-IL'): void {
	const sentence = labels.join(' ');
	speak(sentence, lang);
}

/**
 * Stop any ongoing speech.
 */
export function stopSpeaking(): void {
	if ('speechSynthesis' in window) {
		window.speechSynthesis.cancel();
	}
}

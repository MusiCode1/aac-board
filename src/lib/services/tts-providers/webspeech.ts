import type { SpeakOptions, TtsProvider, TtsVoice } from './types';

/**
 * Web Speech API provider — uses the browser's built-in speechSynthesis.
 * Always available (fallback provider).
 */
export const webSpeechProvider: TtsProvider = {
	id: 'webspeech',
	displayName: 'Web Speech (דפדפן)',

	isAvailable() {
		return typeof window !== 'undefined' && 'speechSynthesis' in window;
	},

	async getVoices(lang?: string): Promise<TtsVoice[]> {
		if (!this.isAvailable()) return [];
		const sysVoices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
			const existing = window.speechSynthesis.getVoices();
			if (existing.length > 0) {
				resolve(existing);
				return;
			}
			const handler = () => {
				window.speechSynthesis.removeEventListener('voiceschanged', handler);
				resolve(window.speechSynthesis.getVoices());
			};
			window.speechSynthesis.addEventListener('voiceschanged', handler);
			// Fallback timeout — on some browsers the event never fires
			setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500);
		});
		const filtered = lang
			? sysVoices.filter((v) => v.lang.startsWith(lang.slice(0, 2)))
			: sysVoices;
		return filtered.map((v) => ({ id: v.voiceURI, name: v.name, lang: v.lang }));
	},

	async speak(text: string, opts: SpeakOptions): Promise<void> {
		if (!this.isAvailable()) return;
		window.speechSynthesis.cancel();
		return new Promise<void>((resolve) => {
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.lang = opts.lang ?? 'he-IL';
			utterance.rate = opts.rate ?? 0.9;
			utterance.pitch = opts.pitch ?? 1;
			const voices = window.speechSynthesis.getVoices();
			const preferred = opts.voiceId ? voices.find((v) => v.voiceURI === opts.voiceId) : null;
			utterance.voice = preferred ?? voices.find((v) => v.lang.startsWith('he')) ?? null;
			utterance.onend = () => resolve();
			utterance.onerror = () => resolve();
			if (opts.signal) {
				opts.signal.addEventListener('abort', () => {
					window.speechSynthesis.cancel();
					resolve();
				});
			}
			window.speechSynthesis.speak(utterance);
		});
	},

	stop() {
		if (this.isAvailable()) window.speechSynthesis.cancel();
	}
};

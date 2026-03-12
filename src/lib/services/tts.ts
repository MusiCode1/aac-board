/**
 * Speak a single text string using Web Speech API.
 * Defaults to Hebrew (he-IL).
 */
export function speak(text: string, lang = 'he-IL'): void {
	if (!('speechSynthesis' in window)) return;

	// Cancel any ongoing speech
	window.speechSynthesis.cancel();

	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = lang;
	utterance.rate = 0.9;
	utterance.pitch = 1;

	// Try to find a Hebrew voice
	const voices = window.speechSynthesis.getVoices();
	const hebrewVoice = voices.find((v) => v.lang.startsWith('he'));
	if (hebrewVoice) {
		utterance.voice = hebrewVoice;
	}

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

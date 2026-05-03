const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Build the TTS prompt that instructs Gemini to speak the text verbatim. */
function buildTtsPrompt(text: string, lang?: string): string {
	const languageInstruction = lang
		? `Language/locale: ${lang}.`
		: 'Use the transcript language.';
	return [
		'Generate spoken audio only from the transcript below.',
		'Do not answer the transcript, do not explain it, do not translate it, and do not output text.',
		'Speak the transcript exactly as written, naturally and clearly.',
		languageInstruction,
		'',
		'Transcript:',
		text
	].join('\n');
}

/**
 * Wrap raw 16-bit PCM mono data in a 44-byte WAV header.
 * Matches the client-side pcmToWav() in src/lib/services/tts-providers/gemini.ts.
 */
function pcmToWav(pcm: Uint8Array, sampleRate = 24000): ArrayBuffer {
	const numChannels = 1;
	const bitsPerSample = 16;
	const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
	const blockAlign = (numChannels * bitsPerSample) / 8;

	const header = new ArrayBuffer(44);
	const view = new DataView(header);

	const writeStr = (offset: number, s: string): void => {
		for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
	};

	writeStr(0, 'RIFF');
	view.setUint32(4, 36 + pcm.byteLength, true); // chunk size
	writeStr(8, 'WAVE');
	writeStr(12, 'fmt ');
	view.setUint32(16, 16, true); // subchunk1 size (PCM)
	view.setUint16(20, 1, true); // audio format: PCM
	view.setUint16(22, numChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, byteRate, true);
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, bitsPerSample, true);
	writeStr(36, 'data');
	view.setUint32(40, pcm.byteLength, true);

	const result = new Uint8Array(44 + pcm.byteLength);
	result.set(new Uint8Array(header), 0);
	result.set(pcm, 44);
	return result.buffer as ArrayBuffer;
}

/** Decode a base64 string to a Uint8Array (works in the Workers runtime). */
function base64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes;
}

interface GeminiResponse {
	candidates?: Array<{
		content?: {
			parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }>;
		};
	}>;
}

/**
 * Call the Gemini generateContent API for TTS and return a WAV ArrayBuffer.
 * Gemini returns raw 16-bit PCM @ 24 kHz; we prepend a WAV header before storing.
 *
 * @throws Error with a descriptive message on non-2xx responses or missing audio data.
 */
export async function fetchGemini(
	text: string,
	voiceId: string,
	modelId: string,
	apiKey: string,
	lang?: string
): Promise<ArrayBuffer> {
	const url = `${GEMINI_BASE}/${encodeURIComponent(modelId)}:generateContent?key=${apiKey}`;

	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			contents: [{ parts: [{ text: buildTtsPrompt(text, lang) }] }],
			generationConfig: {
				responseModalities: ['AUDIO'],
				speechConfig: {
					voiceConfig: {
						prebuiltVoiceConfig: { voiceName: voiceId }
					}
				}
			}
		})
	});

	if (!res.ok) {
		const errText = await res.text().catch(() => '');
		throw new Error(`Gemini API error ${res.status}: ${errText}`);
	}

	const data = (await res.json()) as GeminiResponse;

	const inlineData = data.candidates?.[0]?.content?.parts?.find(
		(p) => p.inlineData?.data
	)?.inlineData;

	if (!inlineData?.data) {
		throw new Error('Gemini: no audio data in response');
	}

	const pcm = base64ToBytes(inlineData.data);
	return pcmToWav(pcm, 24000);
}

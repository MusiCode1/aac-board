const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1/text-to-speech';

/**
 * Call the ElevenLabs TTS API and return the raw audio/mpeg ArrayBuffer.
 *
 * @throws Error with a descriptive message on non-2xx responses.
 */
export async function fetchElevenLabs(
	text: string,
	voiceId: string,
	modelId: string,
	apiKey: string
): Promise<ArrayBuffer> {
	const res = await fetch(`${ELEVENLABS_BASE}/${encodeURIComponent(voiceId)}`, {
		method: 'POST',
		headers: {
			'xi-api-key': apiKey,
			'Content-Type': 'application/json',
			Accept: 'audio/mpeg'
		},
		body: JSON.stringify({
			text,
			model_id: modelId,
			voice_settings: { stability: 0.5, similarity_boost: 0.75 }
		})
	});

	if (!res.ok) {
		const errText = await res.text().catch(() => '');
		throw new Error(`ElevenLabs API error ${res.status}: ${errText}`);
	}

	return res.arrayBuffer();
}

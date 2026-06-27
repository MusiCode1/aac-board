/**
 * Compute a deterministic 16-hex-char hash for a TTS request.
 *
 * Must stay in sync with the client-side implementation at
 * src/lib/services/cache/hash.ts in the monorepo root.
 *
 * Algorithm: SHA-256 of `${provider}|${voiceId}|${modelId}|${text.trim().normalize("NFC")}`
 * Returns the first 8 bytes as 16 lowercase hex characters.
 */
export async function ttsHash(
	provider: string,
	voiceId: string,
	modelId: string,
	text: string
): Promise<string> {
	const normalized = [provider, voiceId, modelId, text.trim().normalize('NFC')].join('|');
	const buf = new TextEncoder().encode(normalized);
	const digest = await crypto.subtle.digest('SHA-256', buf);
	return Array.from(new Uint8Array(digest))
		.slice(0, 8)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

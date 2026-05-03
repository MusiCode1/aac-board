import type { TtsRequest } from '$lib/types/api';

/**
 * Compute a deterministic 16-hex-char hash for a TtsRequest.
 *
 * The same algorithm must be used in the proxy Worker (proxy/src/domain/hash.ts).
 * Fields: provider | voiceId | modelId | text.trim().normalize('NFC')
 */
export async function ttsHash(req: TtsRequest): Promise<string> {
	const normalized = [
		req.provider,
		req.voiceId,
		req.modelId,
		req.text.trim().normalize('NFC')
	].join('|');
	const buf = new TextEncoder().encode(normalized);
	const digest = await crypto.subtle.digest('SHA-256', buf);
	return Array.from(new Uint8Array(digest))
		.slice(0, 8)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

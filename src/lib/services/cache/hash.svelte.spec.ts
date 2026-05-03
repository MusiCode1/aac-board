import { describe, it, expect } from 'vitest';
import { ttsHash } from './hash';
import type { TtsRequest } from '$lib/types/api';

const BASE_REQ: TtsRequest = {
	text: 'שלום',
	provider: 'gemini',
	voiceId: 'Zephyr',
	modelId: 'gemini-2.0-flash-preview-tts'
};

describe('ttsHash', () => {
	it('B1 — same request produces the same hash', async () => {
		const h1 = await ttsHash(BASE_REQ);
		const h2 = await ttsHash({ ...BASE_REQ });
		expect(h1).toBe(h2);
	});

	it('B2 — different text produces a different hash', async () => {
		const h1 = await ttsHash(BASE_REQ);
		const h2 = await ttsHash({ ...BASE_REQ, text: 'עולם' });
		expect(h1).not.toBe(h2);
	});

	it('B3 — different voiceId produces a different hash', async () => {
		const h1 = await ttsHash(BASE_REQ);
		const h2 = await ttsHash({ ...BASE_REQ, voiceId: 'Kore' });
		expect(h1).not.toBe(h2);
	});

	it('B4 — text with surrounding whitespace equals trimmed text', async () => {
		const h1 = await ttsHash({ ...BASE_REQ, text: 'שלום' });
		const h2 = await ttsHash({ ...BASE_REQ, text: '  שלום  ' });
		expect(h1).toBe(h2);
	});

	it('B5 — hash is always exactly 16 hex characters', async () => {
		const inputs: TtsRequest[] = [
			BASE_REQ,
			{ ...BASE_REQ, text: 'a' },
			{ ...BASE_REQ, text: 'longer text here with more words' },
			{ ...BASE_REQ, provider: 'elevenlabs', voiceId: 'voice-123' }
		];
		for (const req of inputs) {
			const h = await ttsHash(req);
			expect(h).toMatch(/^[0-9a-f]{16}$/);
		}
	});

	/**
	 * B6 — cross-process determinism vector.
	 *
	 * MUST match the matching test in tts-proxy-worker/test/domain/hash.spec.ts.
	 * If you change the algorithm, you MUST update both vectors and accept that
	 * all existing client+server cache entries are orphaned.
	 */
	it('B6 — known vector matches the proxy worker', async () => {
		const h = await ttsHash(BASE_REQ);
		expect(h).toBe('97451da3cada04a0');
	});
});

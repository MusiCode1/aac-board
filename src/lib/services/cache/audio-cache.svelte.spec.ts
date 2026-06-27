import { describe, it, expect, vi } from 'vitest';
import { createStore, get } from 'idb-keyval';
import { getOrCreateAudio } from './audio-cache';
import { ttsHash } from './hash';
import type { TtsRequest } from '$lib/types/api';

// Use a real browser IDB store with a unique name per test-run for isolation.
function freshStore() {
	return createStore(`test-audio-${Date.now()}-${Math.random()}`, 'keyval');
}

const BASE_REQ: TtsRequest = {
	text: 'שלום',
	provider: 'gemini',
	voiceId: 'Zephyr',
	modelId: 'gemini-2.0-flash-preview-tts'
};

const MOCK_HASH = 'abcdef1234567890';
const MOCK_BLOB = new Blob(['fake-audio-data'], { type: 'audio/wav' });

/** Build a fake fetch that handles POST /v1/tts and GET /v1/tts/:hash */
function makeFetch(opts?: { postFails?: boolean; getFails?: boolean; cached?: boolean }) {
	return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input.toString();
		const method = init?.method?.toUpperCase() ?? 'GET';

		if (method === 'POST' && url.endsWith('/v1/tts')) {
			if (opts?.postFails) {
				return new Response('origin error', { status: 502 });
			}
			return new Response(
				JSON.stringify({
					hash: MOCK_HASH,
					mimeType: 'audio/wav',
					cached: opts?.cached ?? false
				}),
				{ status: 200, headers: { 'Content-Type': 'application/json' } }
			);
		}

		if (method === 'GET' && url.includes('/v1/tts/') && !url.endsWith('/v1/tts')) {
			if (opts?.getFails) {
				return new Response('not found', { status: 404 });
			}
			return new Response(MOCK_BLOB, {
				status: 200,
				headers: { 'Content-Type': 'audio/wav' }
			});
		}

		throw new Error(`Unexpected fetch: ${method} ${url}`);
	});
}

describe('getOrCreateAudio', () => {
	it('C1 — cache miss: POSTs to proxy, GETs blob, returns Blob and saves to IDB', async () => {
		const store = freshStore();
		const fetchMock = makeFetch();

		const result = await getOrCreateAudio(BASE_REQ, {
			fetch: fetchMock,
			proxyUrl: 'http://proxy',
			store
		});

		expect(result).toBeInstanceOf(Blob);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock.mock.calls[0][0]).toContain('/v1/tts');
		expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
		// Second call is GET /v1/tts/:hash
		const getUrl = String(fetchMock.mock.calls[1][0]);
		expect(getUrl).toMatch(/\/v1\/tts\/[0-9a-f]{16}$/);

		// Blob must be persisted in IDB under the locally-computed hash
		const hash = await ttsHash(BASE_REQ);
		const saved = await get<Blob>(`audio:${hash}`, store);
		expect(saved).toBeInstanceOf(Blob);
	});

	it('C2 — cache hit: second call with same req skips fetch', async () => {
		const store = freshStore();
		const fetchMock = makeFetch();

		await getOrCreateAudio(BASE_REQ, { fetch: fetchMock, proxyUrl: 'http://proxy', store });
		fetchMock.mockClear();

		const result = await getOrCreateAudio(BASE_REQ, {
			fetch: fetchMock,
			proxyUrl: 'http://proxy',
			store
		});

		expect(result).toBeInstanceOf(Blob);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('C3 — different text triggers a new fetch', async () => {
		const store = freshStore();
		const fetchMock = makeFetch();

		await getOrCreateAudio(BASE_REQ, { fetch: fetchMock, proxyUrl: 'http://proxy', store });
		fetchMock.mockClear();

		await getOrCreateAudio(
			{ ...BASE_REQ, text: 'עולם' },
			{ fetch: fetchMock, proxyUrl: 'http://proxy', store }
		);

		expect(fetchMock).toHaveBeenCalled();
	});

	it('C4 — POST error: throws and does not update IDB', async () => {
		const store = freshStore();
		const fetchMock = makeFetch({ postFails: true });

		await expect(
			getOrCreateAudio(BASE_REQ, { fetch: fetchMock, proxyUrl: 'http://proxy', store })
		).rejects.toThrow();

		// IDB must remain empty
		const hash = await ttsHash(BASE_REQ);
		const saved = await get<Blob>(`audio:${hash}`, store);
		expect(saved).toBeUndefined();
	});

	it('C5 — GET error after successful POST: throws and does not update IDB', async () => {
		const store = freshStore();
		const fetchMock = makeFetch({ getFails: true });

		await expect(
			getOrCreateAudio(BASE_REQ, { fetch: fetchMock, proxyUrl: 'http://proxy', store })
		).rejects.toThrow();

		const hash = await ttsHash(BASE_REQ);
		const saved = await get<Blob>(`audio:${hash}`, store);
		expect(saved).toBeUndefined();
	});

	it('C6 — cached:true in proxy response does not change client behavior', async () => {
		const store = freshStore();
		const fetchMock = makeFetch({ cached: true });

		const result = await getOrCreateAudio(BASE_REQ, {
			fetch: fetchMock,
			proxyUrl: 'http://proxy',
			store
		});

		expect(result).toBeInstanceOf(Blob);
		// Second call should still use IDB, not fetch
		fetchMock.mockClear();
		const result2 = await getOrCreateAudio(BASE_REQ, {
			fetch: fetchMock,
			proxyUrl: 'http://proxy',
			store
		});
		expect(result2).toBeInstanceOf(Blob);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

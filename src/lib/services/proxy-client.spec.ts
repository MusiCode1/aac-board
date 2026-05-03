import { describe, it, expect, vi } from 'vitest';
import { postTtsRequest, getTtsBlob } from './proxy-client';
import type { TtsRequest } from '$lib/types/api';

const BASE_REQ: TtsRequest = {
	text: 'שלום',
	provider: 'gemini',
	voiceId: 'Zephyr',
	modelId: 'gemini-2.0-flash-preview-tts'
};

const PROXY = 'http://proxy';

describe('postTtsRequest', () => {
	it('D1 — builds correct URL and returns TtsResponse', async () => {
		const fetchMock = vi.fn(async () =>
			new Response(
				JSON.stringify({ hash: 'aabbccdd11223344', mimeType: 'audio/wav', cached: false }),
				{ status: 200, headers: { 'Content-Type': 'application/json' } }
			)
		);

		const result = await postTtsRequest(BASE_REQ, { fetch: fetchMock, proxyUrl: PROXY });

		expect(fetchMock).toHaveBeenCalledOnce();
		const [url, init] = fetchMock.mock.calls[0];
		expect(String(url)).toBe('http://proxy/v1/tts');
		expect(init?.method).toBe('POST');
		expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
		expect(JSON.parse(String(init?.body))).toEqual(BASE_REQ);

		expect(result).toEqual({ hash: 'aabbccdd11223344', mimeType: 'audio/wav', cached: false });
	});

	it('D3 — HTTP 4xx throws ProxyError with correct code', async () => {
		const fetchMock = vi.fn(async () =>
			new Response(
				JSON.stringify({ error: 'bad request', code: 'invalid_request' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			)
		);

		await expect(
			postTtsRequest(BASE_REQ, { fetch: fetchMock, proxyUrl: PROXY })
		).rejects.toMatchObject({ code: 'invalid_request' });
	});

	it('D3 — HTTP 5xx throws ProxyError with internal code when body not parseable', async () => {
		const fetchMock = vi.fn(async () =>
			new Response('internal server error', { status: 500 })
		);

		await expect(
			postTtsRequest(BASE_REQ, { fetch: fetchMock, proxyUrl: PROXY })
		).rejects.toMatchObject({ code: 'internal' });
	});
});

describe('getTtsBlob', () => {
	it('D2 — returns Blob with correct Content-Type', async () => {
		const fakeBlob = new Blob(['audio'], { type: 'audio/wav' });
		const fetchMock = vi.fn(async () =>
			new Response(fakeBlob, { status: 200, headers: { 'Content-Type': 'audio/wav' } })
		);

		const result = await getTtsBlob('aabbccdd11223344', 'audio/wav', {
			fetch: fetchMock,
			proxyUrl: PROXY
		});

		expect(String(fetchMock.mock.calls[0][0])).toBe('http://proxy/v1/tts/aabbccdd11223344');
		expect(result).toBeInstanceOf(Blob);
		expect(result.type).toBe('audio/wav');
	});

	it('D3 — HTTP 404 throws ProxyError with not_found code', async () => {
		const fetchMock = vi.fn(async () =>
			new Response(
				JSON.stringify({ error: 'not found', code: 'not_found' }),
				{ status: 404, headers: { 'Content-Type': 'application/json' } }
			)
		);

		await expect(
			getTtsBlob('unknownhash', 'audio/wav', { fetch: fetchMock, proxyUrl: PROXY })
		).rejects.toMatchObject({ code: 'not_found' });
	});
});

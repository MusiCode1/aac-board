import type { ProxyError, TtsRequest, TtsResponse } from '$lib/types/api';

/** A thrown ProxyError carries the structured error payload from the proxy. */
export class ProxyClientError extends Error {
	readonly code: ProxyError['code'];

	constructor(message: string, code: ProxyError['code']) {
		super(message);
		this.name = 'ProxyClientError';
		this.code = code;
	}
}

type FetchDeps = {
	fetch?: typeof globalThis.fetch;
	proxyUrl?: string;
};

function getProxyUrl(): string {
	return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PROXY_URL) || '';
}

/** Parse an error response from the proxy, falling back to a generic internal error. */
async function parseProxyError(res: Response): Promise<never> {
	let code: ProxyError['code'] = 'internal';
	let message = `Proxy error ${res.status}`;
	try {
		const body = (await res.json()) as Partial<ProxyError>;
		if (body.code) code = body.code;
		if (body.error) message = body.error;
	} catch {
		/* non-JSON body — keep defaults */
	}
	throw new ProxyClientError(message, code);
}

/**
 * POST /v1/tts — ask the proxy to synthesize or serve a cached audio asset.
 * Returns the TtsResponse with hash, mimeType, and cached flag.
 */
export async function postTtsRequest(req: TtsRequest, deps?: FetchDeps): Promise<TtsResponse> {
	const fetchFn = deps?.fetch ?? globalThis.fetch;
	const proxyUrl = deps?.proxyUrl ?? getProxyUrl();

	const res = await fetchFn(`${proxyUrl}/v1/tts`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(req)
	});

	if (!res.ok) return parseProxyError(res);
	return (await res.json()) as TtsResponse;
}

/**
 * GET /v1/tts/:hash — retrieve the audio blob for a previously-synthesized asset.
 */
export async function getTtsBlob(hash: string, _mimeType: string, deps?: FetchDeps): Promise<Blob> {
	const fetchFn = deps?.fetch ?? globalThis.fetch;
	const proxyUrl = deps?.proxyUrl ?? getProxyUrl();

	const res = await fetchFn(`${proxyUrl}/v1/tts/${hash}`);

	if (!res.ok) return parseProxyError(res);
	return res.blob();
}

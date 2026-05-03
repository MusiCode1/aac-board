import { get, set, createStore } from 'idb-keyval';
import { ttsHash } from './hash';
import type { TtsRequest } from '$lib/types/api';

/** IDB store type as returned by idb-keyval's createStore */
type UseStore = ReturnType<typeof createStore>;

const AUDIO_PREFIX = 'audio:';

let _defaultStore: UseStore | undefined;

/** Returns the shared default IDB store (lazy-initialized). */
function getDefaultStore(): UseStore {
	if (!_defaultStore) {
		_defaultStore = createStore('aac-cache', 'keyval');
	}
	return _defaultStore;
}

function getProxyUrl(): string {
	return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PROXY_URL) || '';
}

/**
 * Return a cached audio Blob for the given TtsRequest, fetching from the
 * proxy and persisting to IndexedDB on a cache miss.
 *
 * L1 (IDB) hit → returns immediately without any network call.
 * L1 miss → POST /v1/tts to generate, GET /v1/tts/:hash to retrieve blob,
 *            then writes to IDB before returning.
 *
 * @param req  The TTS request to resolve.
 * @param deps Optional dependency overrides for testing (fetch, proxyUrl, store).
 */
export async function getOrCreateAudio(
	req: TtsRequest,
	deps?: {
		fetch?: typeof globalThis.fetch;
		proxyUrl?: string;
		store?: UseStore;
	}
): Promise<Blob> {
	const fetchFn = deps?.fetch ?? globalThis.fetch;
	const proxyUrl = deps?.proxyUrl ?? getProxyUrl();
	const store = deps?.store ?? getDefaultStore();

	const hash = await ttsHash(req);
	const cacheKey = AUDIO_PREFIX + hash;

	// L1 hit — return from IDB without touching the network
	const cached = await get<Blob>(cacheKey, store);
	if (cached) return cached;

	// L1 miss — ask the proxy to synthesize / retrieve from R2
	const postRes = await fetchFn(`${proxyUrl}/v1/tts`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(req)
	});

	if (!postRes.ok) {
		const errText = await postRes.text().catch(() => '');
		throw new Error(`Proxy POST /v1/tts failed ${postRes.status}: ${errText}`);
	}

	// Consume response body (informational; server hash == local hash per invariant)
	await postRes.json();

	// Retrieve the audio blob using the local hash (proxy stores it by the same hash)
	const getRes = await fetchFn(`${proxyUrl}/v1/tts/${hash}`);

	if (!getRes.ok) {
		const errText = await getRes.text().catch(() => '');
		throw new Error(`Proxy GET /v1/tts/${hash} failed ${getRes.status}: ${errText}`);
	}

	const blob = await getRes.blob();

	// Persist to IDB (L1)
	await set(cacheKey, blob, store);

	return blob;
}

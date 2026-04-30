import { createStore, del, get, keys, set } from 'idb-keyval';

const audioCacheStore = createStore('aac-board-tts-cache', 'audio');
const MAX_CACHE_BYTES = 50 * 1024 * 1024;
const MAX_CACHE_ENTRIES = 500;

export interface TtsCacheLookup {
	provider: 'gemini' | 'elevenlabs';
	modelId: string;
	voiceId: string;
	lang: string;
	text: string;
}

export interface TtsCacheEntry extends TtsCacheLookup {
	key: string;
	mimeType: string;
	blob: Blob;
	createdAt: number;
	lastAccessedAt: number;
	hitCount: number;
	sizeBytes: number;
}

function normalizeText(text: string): string {
	return text.trim().replace(/\s+/g, ' ');
}

function hashString(input: string): string {
	let hash = 5381;
	for (let i = 0; i < input.length; i++) {
		hash = (hash * 33) ^ input.charCodeAt(i);
	}
	return (hash >>> 0).toString(36);
}

export function buildCacheKey(input: TtsCacheLookup): string {
	const normalized = normalizeText(input.text);
	const payload = [input.provider, input.modelId, input.voiceId, input.lang, normalized].join('|');
	return `tts:${input.provider}:${hashString(payload)}`;
}

async function getAllCacheEntries(): Promise<TtsCacheEntry[]> {
	const cacheKeys = ((await keys(audioCacheStore)) as IDBValidKey[]).filter(
		(key): key is string => typeof key === 'string'
	);
	const entries = await Promise.all(
		cacheKeys.map((cacheKey) => get<TtsCacheEntry>(cacheKey, audioCacheStore))
	);
	return entries.filter((entry): entry is TtsCacheEntry => !!entry);
}

export async function getCachedAudio(key: string): Promise<Blob | null> {
	const entry = await get<TtsCacheEntry>(key, audioCacheStore);
	if (!entry) return null;
	entry.lastAccessedAt = Date.now();
	entry.hitCount += 1;
	await set(key, entry, audioCacheStore);
	return entry.blob;
}

export async function setCachedAudio(
	lookup: TtsCacheLookup,
	blob: Blob,
	mimeType: string
): Promise<void> {
	const key = buildCacheKey(lookup);
	const now = Date.now();
	const entry: TtsCacheEntry = {
		...lookup,
		text: normalizeText(lookup.text),
		key,
		mimeType,
		blob,
		createdAt: now,
		lastAccessedAt: now,
		hitCount: 0,
		sizeBytes: blob.size
	};
	await set(key, entry, audioCacheStore);
	await pruneCache();
}

export async function clearTtsCache(): Promise<void> {
	const cacheKeys = ((await keys(audioCacheStore)) as IDBValidKey[]).filter(
		(key): key is string => typeof key === 'string'
	);
	await Promise.all(cacheKeys.map((cacheKey) => del(cacheKey, audioCacheStore)));
}

export async function getCacheStats(): Promise<{ entries: number; totalBytes: number }> {
	const entries = await getAllCacheEntries();
	return {
		entries: entries.length,
		totalBytes: entries.reduce((sum, entry) => sum + entry.sizeBytes, 0)
	};
}

export async function pruneCache(): Promise<void> {
	const entries = await getAllCacheEntries();
	let totalBytes = entries.reduce((sum, entry) => sum + entry.sizeBytes, 0);
	let count = entries.length;
	if (totalBytes <= MAX_CACHE_BYTES && count <= MAX_CACHE_ENTRIES) return;

	const victims = [...entries].sort(
		(a, b) =>
			a.lastAccessedAt - b.lastAccessedAt || a.hitCount - b.hitCount || a.createdAt - b.createdAt
	);

	for (const victim of victims) {
		if (totalBytes <= MAX_CACHE_BYTES && count <= MAX_CACHE_ENTRIES) break;
		await del(victim.key, audioCacheStore);
		totalBytes -= victim.sizeBytes;
		count -= 1;
	}
}

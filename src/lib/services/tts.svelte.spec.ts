/**
 * Integration tests for tts.ts speak() function.
 *
 * Tests use fake fetch and a fresh IDB store per test.
 * Audio playback is suppressed via a global Audio mock.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStore, set } from 'idb-keyval';
import { ttsHash } from './cache/hash';
import type { TtsRequest } from '$lib/types/api';
import type { TtsSettings } from './tts';

// ── Audio mock ──────────────────────────────────────────────────────────────
// Replace global Audio with a no-op mock so no real audio plays in tests.
let AudioMock: ReturnType<typeof makeAudioMock>;

function makeAudioMock() {
	const instance = {
		play: vi.fn(() => Promise.resolve()),
		pause: vi.fn(),
		currentTime: 0,
		playbackRate: 1,
		onended: null as (() => void) | null,
		onerror: null as (() => void) | null
	};
	// Must use a regular function (not arrow) so it can be called with `new`.
	// Returning an object from a constructor replaces `this` with that object.
	const constructor = vi.fn(function () {
		return instance;
	});
	// Resolve the playback promise immediately by triggering onended
	instance.play.mockImplementation(function () {
		setTimeout(() => instance.onended?.(), 0);
		return Promise.resolve();
	});
	return { instance, constructor };
}

// ── IDB store ──────────────────────────────────────────────────────────────
function freshStore() {
	return createStore(`test-tts-${Date.now()}-${Math.random()}`, 'keyval');
}

// ── Fake fetch ─────────────────────────────────────────────────────────────
const FAKE_BLOB = new Blob(['audio'], { type: 'audio/wav' });
const FAKE_HASH = 'fedcba9876543210';

function makeFetch() {
	return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input.toString();
		const method = init?.method?.toUpperCase() ?? 'GET';
		if (method === 'POST' && url.endsWith('/v1/tts')) {
			return new Response(
				JSON.stringify({ hash: FAKE_HASH, mimeType: 'audio/wav', cached: false }),
				{ headers: { 'Content-Type': 'application/json' } }
			);
		}
		if (method === 'GET' && url.includes('/v1/tts/')) {
			return new Response(FAKE_BLOB, { headers: { 'Content-Type': 'audio/wav' } });
		}
		throw new Error(`Unexpected fetch: ${method} ${url}`);
	});
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const GEMINI_SETTINGS: TtsSettings = {
	provider: 'gemini',
	modelId: 'gemini-2.0-flash-preview-tts',
	voiceURI: 'Zephyr',
	rate: 1,
	pitch: 1
};

describe('speak() — E1/E2/E3', () => {
	beforeEach(() => {
		AudioMock = makeAudioMock();
		vi.stubGlobal('Audio', AudioMock.constructor);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('E2 — cache miss with gemini provider: fetches from proxy, plays audio', async () => {
		const { speak } = await import('./tts');
		const store = freshStore();
		const fetchMock = makeFetch();

		await speak('שלום', 'he-IL', {
			settings: GEMINI_SETTINGS,
			fetchFn: fetchMock,
			proxyUrl: 'http://proxy',
			store
		});

		// Should have called proxy POST and GET
		expect(fetchMock).toHaveBeenCalledTimes(2);
		// Audio should have been played
		expect(AudioMock.instance.play).toHaveBeenCalledOnce();
	});

	it('E1 — cache hit with gemini provider: skips fetch, plays audio directly', async () => {
		const { speak } = await import('./tts');
		const store = freshStore();
		const fetchMock = makeFetch();

		// Pre-populate the cache with the blob
		const req: TtsRequest = {
			text: 'שלום',
			provider: 'gemini',
			voiceId: GEMINI_SETTINGS.voiceURI,
			modelId: GEMINI_SETTINGS.modelId
		};
		const hash = await ttsHash(req);
		await set(`audio:${hash}`, FAKE_BLOB, store);

		await speak('שלום', 'he-IL', {
			settings: GEMINI_SETTINGS,
			fetchFn: fetchMock,
			proxyUrl: 'http://proxy',
			store
		});

		expect(fetchMock).not.toHaveBeenCalled();
		expect(AudioMock.instance.play).toHaveBeenCalledOnce();
	});

	it('E3 — webspeech provider: does not touch cache or proxy', async () => {
		const { speak } = await import('./tts');
		const store = freshStore();
		const fetchMock = makeFetch();

		// Stub the webspeech provider to succeed without real TTS
		vi.stubGlobal('speechSynthesis', {
			speak: vi.fn(),
			cancel: vi.fn(),
			getVoices: vi.fn(() => [])
		});
		vi.stubGlobal(
			'SpeechSynthesisUtterance',
			vi.fn(() => ({ onend: null, onerror: null }))
		);

		await speak('שלום', 'he-IL', {
			settings: { ...GEMINI_SETTINGS, provider: 'webspeech' },
			fetchFn: fetchMock,
			proxyUrl: 'http://proxy',
			store
		}).catch(() => {
			/* webspeech may fail in test env — we only care fetch wasn't called */
		});

		expect(fetchMock).not.toHaveBeenCalled();
	});
});

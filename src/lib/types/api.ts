/**
 * Shared API contracts between the client and the aac-proxy Cloudflare Worker.
 *
 * These types are the source of truth for the proxy HTTP API surface.
 * Changes here must be reflected in the proxy Worker types as well.
 */

/** TTS providers supported by the proxy (webspeech is client-only, not proxied). */
export type TtsProviderId = 'elevenlabs' | 'gemini';

/** Image sources supported by the image proxy. */
export type ImageSource = 'arasaac' | 'pcs' | 'user';

export interface TtsRequest {
	text: string;
	provider: TtsProviderId;
	voiceId: string;
	modelId: string;
	lang?: string;
}

export interface TtsResponse {
	/** 16 hex chars. Deterministic on TtsRequest fields. */
	hash: string;
	mimeType: 'audio/wav' | 'audio/mpeg';
	/** Whether the response was served from cache (informational only). */
	cached: boolean;
}

export interface VoiceItem {
	id: string;
	name: string;
	lang?: string;
}

export interface VoicesResponse {
	voices: VoiceItem[];
}

export interface ProxyError {
	error: string;
	code: 'origin_failed' | 'invalid_request' | 'unauthorized' | 'not_found' | 'internal';
}

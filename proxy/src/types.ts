/** Cloudflare Worker environment bindings for aac-proxy. */
export interface Env {
	AUDIO_CACHE: R2Bucket;
	ELEVENLABS_API_KEY: string;
	GEMINI_API_KEY: string;
}

/** TTS providers supported by the proxy. */
export type TtsProviderId = 'elevenlabs' | 'gemini';

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
	/** Whether the response was served from R2 cache. */
	cached: boolean;
}

export interface ProxyError {
	error: string;
	code: 'origin_failed' | 'invalid_request' | 'unauthorized' | 'not_found' | 'internal';
}

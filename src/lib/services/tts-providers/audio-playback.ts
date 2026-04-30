import type { SpeakOptions } from './types';

let currentAudio: HTMLAudioElement | null = null;

export function stopCurrentAudio(): void {
	if (currentAudio) {
		currentAudio.pause();
		currentAudio.currentTime = 0;
		currentAudio = null;
	}
}

export async function playAudioBlob(blob: Blob, opts: SpeakOptions): Promise<void> {
	stopCurrentAudio();
	const url = URL.createObjectURL(blob);
	const audio = new Audio(url);
	audio.playbackRate = opts.rate ?? 1;
	currentAudio = audio;

	return new Promise<void>((resolve) => {
		let cleaned = false;
		const cleanup = () => {
			if (cleaned) return;
			cleaned = true;
			URL.revokeObjectURL(url);
			if (currentAudio === audio) currentAudio = null;
			resolve();
		};
		audio.onended = cleanup;
		audio.onerror = cleanup;
		if (opts.signal) {
			opts.signal.addEventListener('abort', () => {
				audio.pause();
				cleanup();
			});
		}
		audio.play().catch(cleanup);
	});
}

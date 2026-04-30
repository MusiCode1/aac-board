import type { TtsVoice } from './types';

/**
 * Snapshot of the official Gemini TTS voices from:
 * https://ai.google.dev/gemini-api/docs/speech-generation
 * Last verified: 2026-04-22
 *
 * There does not currently appear to be a public, documented endpoint for
 * listing these voices dynamically, so we keep the list isolated here.
 */
export const GEMINI_TTS_VOICES: TtsVoice[] = [
	{ id: 'Zephyr', name: 'Zephyr (Bright)' },
	{ id: 'Puck', name: 'Puck (Upbeat)' },
	{ id: 'Charon', name: 'Charon (Informative)' },
	{ id: 'Kore', name: 'Kore (Firm)' },
	{ id: 'Fenrir', name: 'Fenrir (Excitable)' },
	{ id: 'Leda', name: 'Leda (Youthful)' },
	{ id: 'Orus', name: 'Orus (Firm)' },
	{ id: 'Aoede', name: 'Aoede (Breezy)' },
	{ id: 'Callirrhoe', name: 'Callirrhoe (Easy-going)' },
	{ id: 'Autonoe', name: 'Autonoe (Bright)' },
	{ id: 'Enceladus', name: 'Enceladus (Breathy)' },
	{ id: 'Iapetus', name: 'Iapetus (Clear)' },
	{ id: 'Umbriel', name: 'Umbriel (Easy-going)' },
	{ id: 'Algieba', name: 'Algieba (Smooth)' },
	{ id: 'Despina', name: 'Despina (Smooth)' },
	{ id: 'Erinome', name: 'Erinome (Clear)' },
	{ id: 'Algenib', name: 'Algenib (Gravelly)' },
	{ id: 'Rasalgethi', name: 'Rasalgethi (Informative)' },
	{ id: 'Laomedeia', name: 'Laomedeia (Upbeat)' },
	{ id: 'Achernar', name: 'Achernar (Soft)' },
	{ id: 'Alnilam', name: 'Alnilam (Firm)' },
	{ id: 'Schedar', name: 'Schedar (Even)' },
	{ id: 'Gacrux', name: 'Gacrux (Mature)' },
	{ id: 'Pulcherrima', name: 'Pulcherrima (Forward)' },
	{ id: 'Achird', name: 'Achird (Friendly)' },
	{ id: 'Zubenelgenubi', name: 'Zubenelgenubi (Casual)' },
	{ id: 'Vindemiatrix', name: 'Vindemiatrix (Gentle)' },
	{ id: 'Sadachbia', name: 'Sadachbia (Lively)' },
	{ id: 'Sadaltager', name: 'Sadaltager (Knowledgeable)' },
	{ id: 'Sulafat', name: 'Sulafat (Warm)' }
];

import { get, set } from 'idb-keyval';

export interface AppSettings {
	ttsVoice: string;
	ttsRate: number;
	ttsPitch: number;
	theme: 'light' | 'dark';
	tileSize: 'small' | 'medium' | 'large';
}

const SETTINGS_KEY = 'app-settings';
const TTS_LEGACY_KEY = 'tts-settings';

const DEFAULTS: AppSettings = {
	ttsVoice: '',
	ttsRate: 0.9,
	ttsPitch: 1.0,
	theme: 'light',
	tileSize: 'medium'
};

let settings = $state<AppSettings>({ ...DEFAULTS });
let initialized = $state(false);

async function persist() {
	try {
		await set(SETTINGS_KEY, $state.snapshot(settings));
	} catch {
		/* IndexedDB not available */
	}
	// Mirror theme to localStorage for anti-flash script
	try {
		localStorage.setItem('theme', settings.theme);
	} catch {
		/* private browsing */
	}
}

function applyTheme(theme: 'light' | 'dark') {
	if (typeof document === 'undefined') return;
	document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function settingsStore() {
	return {
		get settings() {
			return settings;
		},

		get initialized() {
			return initialized;
		},

		async init() {
			if (initialized) return;
			try {
				const saved = await get<AppSettings>(SETTINGS_KEY);
				if (saved) {
					settings = { ...DEFAULTS, ...saved };
				}
			} catch {
				/* IndexedDB not available */
			}

			// Migrate legacy TTS settings from localStorage (Stage 3A)
			try {
				const legacy = localStorage.getItem(TTS_LEGACY_KEY);
				if (legacy) {
					const parsed = JSON.parse(legacy);
					if (!settings.ttsVoice && parsed.voiceURI) settings.ttsVoice = parsed.voiceURI;
					if (parsed.rate) settings.ttsRate = parsed.rate;
					if (parsed.pitch) settings.ttsPitch = parsed.pitch;
					localStorage.removeItem(TTS_LEGACY_KEY);
					await persist();
				}
			} catch {
				/* ignore */
			}

			initialized = true;
			applyTheme(settings.theme);
		},

		update(updates: Partial<AppSettings>) {
			Object.assign(settings, updates);
			if (updates.theme) applyTheme(updates.theme);
			persist();
		},

		async resetToDefaults() {
			settings = { ...DEFAULTS };
			applyTheme(settings.theme);
			await persist();
		}
	};
}

import { get, set, createStore } from 'idb-keyval';

type UseStore = ReturnType<typeof createStore>;

/** IDB key that records a completed migration. */
const MIGRATION_FLAG = 'cache-proxy-migrated:v1';

/** localStorage keys that held client-side API keys before the proxy migration. */
const LEGACY_API_KEYS = ['elevenlabs-api-key', 'gemini-api-key'];

/**
 * Run the cache/proxy migration exactly once per browser.
 *
 * First run: removes API keys from localStorage (they now live in Cloudflare
 * Secrets on the proxy Worker) and sets a flag in IDB so subsequent runs are
 * no-ops.
 *
 * @param store Optional IDB store override (used in tests for isolation).
 */
export async function runMigrationOnce(store?: UseStore): Promise<void> {
	const resolvedStore = store ?? createStore('aac-cache', 'keyval');

	// Check if migration already ran
	const done = await get<boolean>(MIGRATION_FLAG, resolvedStore);
	if (done) return;

	// Remove legacy API keys from localStorage
	try {
		for (const key of LEGACY_API_KEYS) {
			localStorage.removeItem(key);
		}
	} catch {
		/* private browsing or blocked — skip gracefully */
	}

	// Mark migration as complete
	await set(MIGRATION_FLAG, true, resolvedStore);
}

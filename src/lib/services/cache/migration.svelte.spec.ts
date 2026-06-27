import { describe, it, expect, beforeEach } from 'vitest';
import { createStore, get, set } from 'idb-keyval';
import { runMigrationOnce } from './migration';

function freshStore() {
	return createStore(`test-migration-${Date.now()}-${Math.random()}`, 'keyval');
}

const MIGRATION_FLAG = 'cache-proxy-migrated:v1';

describe('runMigrationOnce', () => {
	beforeEach(() => {
		// Clear relevant localStorage keys before each test
		try {
			localStorage.removeItem('elevenlabs-api-key');
			localStorage.removeItem('gemini-api-key');
		} catch {
			/* ignore in test env */
		}
	});

	it('F1 — first run: clears API keys from localStorage and sets migration flag in IDB', async () => {
		const store = freshStore();
		localStorage.setItem('elevenlabs-api-key', 'key-abc');
		localStorage.setItem('gemini-api-key', 'key-xyz');

		await runMigrationOnce(store);

		expect(localStorage.getItem('elevenlabs-api-key')).toBeNull();
		expect(localStorage.getItem('gemini-api-key')).toBeNull();

		const flag = await get<boolean>(MIGRATION_FLAG, store);
		expect(flag).toBe(true);
	});

	it('F2 — second run: does not touch localStorage again (idempotent)', async () => {
		const store = freshStore();
		// Pre-set the migration flag (simulating a completed migration)
		await set(MIGRATION_FLAG, true, store);

		// Put keys back to verify they are NOT deleted on second run
		localStorage.setItem('elevenlabs-api-key', 'should-stay');
		localStorage.setItem('gemini-api-key', 'should-stay');

		await runMigrationOnce(store);

		// Keys should remain untouched
		expect(localStorage.getItem('elevenlabs-api-key')).toBe('should-stay');
		expect(localStorage.getItem('gemini-api-key')).toBe('should-stay');
	});
});

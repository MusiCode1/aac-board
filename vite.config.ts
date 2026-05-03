import { existsSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';

const workspaceRoot = process.cwd();
const nodeModulesPath = resolve(workspaceRoot, 'node_modules');
const realNodeModulesPath = existsSync(nodeModulesPath) ? realpathSync(nodeModulesPath) : null;
const extraFsAllow = realNodeModulesPath ? [realNodeModulesPath, dirname(realNodeModulesPath)] : [];

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	server: {
		allowedHosts: true,
		host: '::',
		fs: {
			allow: [workspaceRoot, ...extraFsAllow]
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});

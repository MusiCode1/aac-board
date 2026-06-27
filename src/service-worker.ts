/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

const CACHE = `aac-board-${version}`;
const OFFLINE = '/offline.html';

// Precache: hashed build assets + static files (includes offline.html)
const PRECACHE = [...build, ...files];

const log = (...args: unknown[]) => console.log('[SW]', ...args);

log('script evaluated, version:', version);
log('PRECACHE count:', PRECACHE.length);
log('offline.html in PRECACHE:', PRECACHE.includes(OFFLINE));

// Install: open cache and precache all known assets
self.addEventListener('install', (event) => {
	log('install — cache:', CACHE);
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(PRECACHE))
			.then(() => { log('install done, skipWaiting'); self.skipWaiting(); })
			.catch((err) => { log('install FAILED:', err); throw err; })
	);
});

// Activate: delete old caches, claim all clients immediately
self.addEventListener('activate', (event) => {
	log('activate');
	event.waitUntil(
		caches
			.keys()
			.then((keys) => {
				log('existing caches:', keys);
				return Promise.all(keys.filter((k) => k !== CACHE).map((k) => {
					log('deleting old cache:', k);
					return caches.delete(k);
				}));
			})
			.then(() => { log('activate done, claiming clients'); self.clients.claim(); })
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Only handle GET requests from the same origin
	if (request.method !== 'GET' || url.origin !== self.location.origin) return;

	// Navigation (SSR HTML pages) — network-first, cache response as side-effect,
	// fall back to any cached HTML page so SvelteKit can boot from cache offline.
	if (request.mode === 'navigate') {
		log('navigate →', url.pathname);
		event.respondWith(
			Promise.race([
				fetch(request, { redirect: 'follow' }),
				new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000))
			])
				.then(async (res) => {
					log('navigate network ok:', res.status, res.type);
					// Cache the HTML response so it's available offline
					if (res.ok && res.status === 200) {
						const cache = await caches.open(CACHE);
						cache.put(request, res.clone());
					}
					return res;
				})
				.catch(async (err) => {
					log('navigate network failed:', err?.message, '— trying cache');

					// 1. Exact URL match
					const cached = await caches.match(request);
					if (cached) { log('navigate: exact cache hit'); return cached; }

					// 2. Any previously cached HTML page — SvelteKit will client-side route
					const cache = await caches.open(CACHE);
					const keys = await cache.keys();
					const htmlKey = keys.find((k) => k.mode === 'navigate');
					if (htmlKey) {
						const shell = await cache.match(htmlKey);
						if (shell) {
							log('navigate: serving shell from', htmlKey.url);
							return new Response(shell.body, {
								status: 200,
								headers: { 'Content-Type': 'text/html;charset=utf-8' }
							});
						}
					}

					// 3. Last resort: offline page
					const offline = await caches.match(OFFLINE);
					if (offline) {
						log('navigate: serving offline.html');
						return new Response(offline.body, {
							status: 200,
							headers: { 'Content-Type': 'text/html;charset=utf-8' }
						});
					}
					log('navigate: no fallback — returning 503');
					return new Response('אופליין', { status: 503 });
				})
		);
		return;
	}

	// Precached assets (hashed JS/CSS/icons) — cache-first
	if (PRECACHE.includes(url.pathname)) {
		event.respondWith(
			caches.match(request).then((cached) => cached ?? fetch(request))
		);
	}
});

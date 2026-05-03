<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { runMigrationOnce } from '$lib/services/cache/migration';

	let { children } = $props();

	onMount(() => {
		// Remove legacy localStorage API keys on first visit after proxy migration.
		runMigrationOnce().catch((e) => console.warn('[migration] failed:', e));
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

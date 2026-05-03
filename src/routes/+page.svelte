<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { setsStore } from '$lib/stores/sets.svelte';

	const sets = setsStore();

	onMount(async () => {
		await sets.init();
		const s = sets.defaultSet;
		if (s) {
			goto(`/s/${s.id}/b/${s.homeBoardId}`, { replaceState: true });
		}
	});
</script>

<!-- Loading state while redirecting -->
<div class="loading-skeleton" aria-busy="true" aria-label="טוען...">
	<div class="skel-output"></div>
	<div class="skel-nav"></div>
	<div class="skel-grid">
		{#each Array(12) as _, i (i)}
			<div class="skel-tile"></div>
		{/each}
	</div>
</div>

<style>
	.loading-skeleton {
		display: flex;
		flex-direction: column;
		gap: 0;
		height: 100dvh;
		background: var(--bg-app, #f0f4f8);
	}

	.skel-output {
		height: 72px;
		background: linear-gradient(90deg, #eee, #f5f5f5, #eee);
		background-size: 200% 100%;
		animation: skel-shimmer 1.4s ease-in-out infinite;
		border-bottom: 2px solid #e0e0e0;
	}

	.skel-nav {
		height: 56px;
		background: linear-gradient(135deg, #90caf9, #64b5f6);
		opacity: 0.6;
	}

	.skel-grid {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
		gap: 8px;
		padding: 12px;
	}

	.skel-tile {
		aspect-ratio: 1;
		background: linear-gradient(90deg, #eee, #f5f5f5, #eee);
		background-size: 200% 100%;
		animation: skel-shimmer 1.4s ease-in-out infinite;
		border-radius: 14px;
	}

	@keyframes skel-shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>

<script lang="ts">
	import type { OutputItem } from '$lib/types/board';
	import { fly, fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	interface Props {
		items: OutputItem[];
		onclear: () => void;
		onspeakall: () => void;
		onremove: (index: number) => void;
	}

	let { items, onclear, onspeakall, onremove }: Props = $props();
</script>

<div class="output-bar" role="region" aria-label="שורת פלט">
	<div class="output-items">
		{#each items as item, i (item.id + '-' + i)}
			<button
				class="output-item"
				onclick={() => onremove(i)}
				aria-label="הסר {item.label}"
				in:fly={{ x: -30, duration: 250 }}
				out:fade={{ duration: 150 }}
				animate:flip={{ duration: 200 }}
			>
				<img src={item.image} alt={item.label} draggable="false" />
				<span>{item.label}</span>
			</button>
		{/each}
		{#if items.length === 0}
			<span class="placeholder" in:fade={{ duration: 200 }}>לחץ על אריח כדי להתחיל...</span>
		{/if}
	</div>
	<div class="output-actions">
		<button
			class="action-btn speak-btn"
			onclick={onspeakall}
			disabled={items.length === 0}
			aria-label="דבר הכל"
			title="דבר הכל"
		>
			<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
				/>
			</svg>
		</button>
		<button
			class="action-btn clear-btn"
			onclick={onclear}
			disabled={items.length === 0}
			aria-label="נקה"
			title="נקה"
		>
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
		</button>
	</div>
</div>

<style>
	.output-bar {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 16px;
		background: linear-gradient(to bottom, #ffffff, #f8f9fa);
		border-bottom: 2px solid #e0e0e0;
		min-height: 72px;
		box-shadow: 0 2px 8px rgb(0 0 0 / 0.06);
	}

	.output-items {
		flex: 1;
		display: flex;
		gap: 8px;
		overflow-x: auto;
		align-items: center;
		min-height: 52px;
		direction: rtl;
		padding: 2px;
	}

	.output-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		padding: 5px 8px;
		background: #f5f5f5;
		border: 1.5px solid #e0e0e0;
		border-radius: 10px;
		cursor: pointer;
		flex-shrink: 0;
		transition:
			background 0.15s,
			transform 0.1s,
			box-shadow 0.15s;
	}

	.output-item:hover {
		background: #ffebee;
		border-color: #ef9a9a;
		transform: translateY(-1px);
		box-shadow: 0 2px 6px rgb(0 0 0 / 0.1);
	}

	.output-item img {
		width: 36px;
		height: 36px;
		object-fit: contain;
	}

	.output-item span {
		font-size: 12px;
		font-weight: 500;
		color: #424242;
		white-space: nowrap;
	}

	.placeholder {
		color: #9e9e9e;
		font-size: 14px;
		padding: 0 8px;
	}

	.output-actions {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}

	.action-btn {
		width: 46px;
		height: 46px;
		border-radius: 50%;
		border: 2px solid #e0e0e0;
		background: #fafafa;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background 0.15s,
			transform 0.1s,
			box-shadow 0.15s;
	}

	.action-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 3px 8px rgb(0 0 0 / 0.12);
	}

	.action-btn:active:not(:disabled) {
		transform: scale(0.9);
	}

	.action-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.speak-btn {
		border-color: #1976d2;
		color: #1976d2;
	}

	.speak-btn:hover:not(:disabled) {
		background: #e3f2fd;
	}

	.clear-btn {
		border-color: #c62828;
		color: #c62828;
	}

	.clear-btn:hover:not(:disabled) {
		background: #ffebee;
	}
</style>

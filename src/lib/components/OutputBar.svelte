<script lang="ts">
	import type { OutputItem } from '$lib/types/board';

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
			<button class="output-item" onclick={() => onremove(i)} aria-label="הסר {item.label}">
				<img src={item.image} alt={item.label} draggable="false" />
				<span>{item.label}</span>
			</button>
		{/each}
		{#if items.length === 0}
			<span class="placeholder">לחץ על אריח כדי להתחיל...</span>
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
			🔊
		</button>
		<button
			class="action-btn clear-btn"
			onclick={onclear}
			disabled={items.length === 0}
			aria-label="נקה"
			title="נקה"
		>
			✕
		</button>
	</div>
</div>

<style>
	.output-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: #fff;
		border-bottom: 2px solid #e0e0e0;
		min-height: 64px;
		box-shadow: 0 2px 8px rgb(0 0 0 / 0.08);
	}

	.output-items {
		flex: 1;
		display: flex;
		gap: 6px;
		overflow-x: auto;
		align-items: center;
		min-height: 48px;
		direction: rtl;
	}

	.output-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 4px 6px;
		background: #f5f5f5;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.15s;
	}

	.output-item:hover {
		background: #eeeeee;
	}

	.output-item img {
		width: 32px;
		height: 32px;
		object-fit: contain;
	}

	.output-item span {
		font-size: 11px;
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
		gap: 6px;
		flex-shrink: 0;
	}

	.action-btn {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 2px solid #e0e0e0;
		background: #fafafa;
		cursor: pointer;
		font-size: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background 0.15s,
			transform 0.1s;
	}

	.action-btn:hover:not(:disabled) {
		background: #e3f2fd;
	}

	.action-btn:active:not(:disabled) {
		transform: scale(0.9);
	}

	.action-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.speak-btn {
		border-color: #1976d2;
	}

	.clear-btn {
		border-color: #c62828;
		color: #c62828;
		font-weight: bold;
	}
</style>

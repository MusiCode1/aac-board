<script lang="ts">
	import type { Tile } from '$lib/types/board';

	interface Props {
		tile: Tile;
		onpress: (tile: Tile) => void;
	}

	let { tile, onpress }: Props = $props();

	function handleClick() {
		onpress(tile);
	}
</script>

<button
	class="tile"
	style="--bg: {tile.backgroundColor}; --border-color: {tile.borderColor}"
	onclick={handleClick}
	aria-label={tile.label}
>
	<div class="tile-icon">
		<img src={tile.image} alt={tile.label} loading="lazy" draggable="false" />
		{#if tile.type === 'folder'}
			<span class="folder-badge">📂</span>
		{/if}
	</div>
	<span class="tile-label">{tile.label}</span>
</button>

<style>
	.tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 6px;
		background: var(--bg, #fff);
		border: 3px solid var(--border-color, #ccc);
		border-radius: 12px;
		cursor: pointer;
		transition:
			transform 0.1s ease,
			box-shadow 0.1s ease;
		box-shadow: 0 2px 6px rgb(0 0 0 / 0.12);
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		overflow: hidden;
		min-width: 0;
		min-height: 0;
	}

	.tile:active {
		transform: scale(0.93);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
	}

	.tile:focus-visible {
		outline: 3px solid #1976d2;
		outline-offset: 2px;
	}

	.tile-icon {
		position: relative;
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 0;
		width: 100%;
	}

	.tile-icon img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}

	.folder-badge {
		position: absolute;
		bottom: -2px;
		left: -2px;
		font-size: 14px;
		line-height: 1;
	}

	.tile-label {
		font-size: clamp(11px, 1.6vw, 16px);
		font-weight: 600;
		text-align: center;
		color: #212121;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}
</style>

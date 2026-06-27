<script lang="ts">
	import type { Tile } from '$lib/types/board';

	interface Props {
		tiles?: Tile[];
		emptyLabel?: string;
	}

	let { tiles = [], emptyLabel = 'לוח ריק' }: Props = $props();

	const previewTiles = $derived(tiles.slice(0, 4));
</script>

<div class="thumbnail" aria-hidden="true">
	{#if previewTiles.length > 0}
		<div class="thumbnail-grid">
			{#each Array(4) as _, index (index)}
				{@const tile = previewTiles[index]}
				<div
					class="thumbnail-cell"
					style={tile
						? `--cell-bg: ${tile.backgroundColor}; --cell-border: ${tile.borderColor};`
						: ''}
				>
					{#if tile?.image}
						<img src={tile.image} alt="" loading="lazy" />
					{:else}
						<span class="thumbnail-placeholder"></span>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="thumbnail-empty">{emptyLabel}</div>
	{/if}
</div>

<style>
	.thumbnail {
		aspect-ratio: 1;
		border-radius: 18px;
		padding: 10px;
		background:
			radial-gradient(circle at top right, rgb(255 255 255 / 0.75), transparent 40%),
			linear-gradient(160deg, rgb(255 255 255 / 0.92), rgb(236 244 255 / 0.72));
		border: 1px solid rgb(25 118 210 / 0.14);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.75),
			0 14px 30px rgb(21 101 192 / 0.12);
	}

	.thumbnail-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
		height: 100%;
	}

	.thumbnail-cell {
		overflow: hidden;
		border-radius: 12px;
		background: var(--cell-bg, rgb(245 247 250));
		border: 1px solid var(--cell-border, rgb(210 220 235));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.thumbnail-cell img {
		width: 72%;
		height: 72%;
		object-fit: contain;
		filter: drop-shadow(0 4px 8px rgb(0 0 0 / 0.12));
	}

	.thumbnail-placeholder,
	.thumbnail-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		color: rgb(79 99 124 / 0.72);
		font-size: 13px;
		font-weight: 600;
		text-align: center;
	}

	.thumbnail-empty {
		border-radius: 12px;
		background:
			linear-gradient(135deg, rgb(248 250 252), rgb(232 239 247)),
			repeating-linear-gradient(
				135deg,
				transparent,
				transparent 10px,
				rgb(255 255 255 / 0.4) 10px,
				rgb(255 255 255 / 0.4) 20px
			);
	}
</style>

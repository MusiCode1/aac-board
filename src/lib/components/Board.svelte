<script lang="ts">
	import type { Board, Tile as TileType } from '$lib/types/board';
	import Tile from './Tile.svelte';

	interface Props {
		board: Board;
		ontilepress: (tile: TileType) => void;
	}

	let { board, ontilepress }: Props = $props();
</script>

<div
	class="board-grid"
	style="--rows: {board.grid.rows}; --cols: {board.grid.columns}"
	role="grid"
	aria-label={board.name}
>
	{#each board.tiles as tile (tile.id)}
		<Tile {tile} onpress={ontilepress} />
	{/each}
</div>

<style>
	.board-grid {
		display: grid;
		grid-template-rows: repeat(var(--rows, 4), 1fr);
		grid-template-columns: repeat(var(--cols, 5), 1fr);
		gap: 8px;
		padding: 12px;
		flex: 1;
		min-height: 0;
		width: 100%;
		max-width: 100%;
		overflow: hidden;
	}
</style>

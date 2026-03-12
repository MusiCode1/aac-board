<script lang="ts">
	import { onMount } from 'svelte';
	import Board from '$lib/components/Board.svelte';
	import OutputBar from '$lib/components/OutputBar.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import TileEditor from '$lib/components/TileEditor.svelte';
	import { boardStore } from '$lib/stores/board.svelte';
	import { speak, speakAll } from '$lib/services/tts';
	import type { Tile } from '$lib/types/board';
	import { HOME_BOARD_ID } from '$lib/data/boards';

	const store = boardStore();

	let editingTile = $state<Tile | null>(null);

	onMount(() => {
		store.init();
	});

	function handleTilePress(tile: Tile) {
		if (store.editMode) {
			editingTile = tile;
			return;
		}
		if (tile.type === 'folder' && tile.loadBoard) {
			store.navigateTo(tile.loadBoard);
		} else {
			store.addToOutput(tile);
			speak(tile.label);
		}
	}

	function handleSpeakAll() {
		const labels = store.getOutputLabels();
		if (labels.length > 0) {
			speakAll(labels);
		}
	}

	function handleClear() {
		store.clearOutput();
	}

	function handleRemoveOutput(index: number) {
		store.output.splice(index, 1);
	}

	function handleTileSave(tileId: string, updates: Partial<Tile>) {
		store.updateTile(tileId, updates);
		editingTile = null;
	}

	function handleTileDelete(tileId: string) {
		store.removeTile(tileId);
		editingTile = null;
	}
</script>

<svelte:head>
	<title>לוח תקשורת AAC</title>
</svelte:head>

<div class="app-container">
	<OutputBar
		items={store.output}
		onclear={handleClear}
		onspeakall={handleSpeakAll}
		onremove={handleRemoveOutput}
	/>
	<NavBar
		boardName={store.currentBoard.name}
		canGoBack={store.canGoBack}
		isHome={store.currentBoard.id === HOME_BOARD_ID}
		breadcrumbs={store.breadcrumbs}
		editMode={store.editMode}
		onback={() => store.goBack()}
		onhome={() => store.goHome()}
		ontoggleedit={() => store.toggleEditMode()}
	/>
	<Board
		board={store.currentBoard}
		ontilepress={handleTilePress}
		direction={store.navDirection}
		editMode={store.editMode}
	/>
</div>

{#if editingTile}
	<TileEditor
		tile={editingTile}
		onsave={handleTileSave}
		ondelete={handleTileDelete}
		onclose={() => (editingTile = null)}
	/>
{/if}

<style>
	.app-container {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		width: 100vw;
		overflow: hidden;
		background: #f0f4f8;
	}
</style>

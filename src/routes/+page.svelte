<script lang="ts">
	import { onMount } from 'svelte';
	import Board from '$lib/components/Board.svelte';
	import OutputBar from '$lib/components/OutputBar.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import TileEditor from '$lib/components/TileEditor.svelte';
	import EditToolbar from '$lib/components/EditToolbar.svelte';
	import { boardStore } from '$lib/stores/board.svelte';
	import { speak, speakAll } from '$lib/services/tts';
	import { exportBoardsJSON } from '$lib/services/storage';
	import type { Tile } from '$lib/types/board';
	import { HOME_BOARD_ID } from '$lib/data/boards';

	const store = boardStore();

	let editingTile = $state<Tile | null>(null);
	let showOverflow = $state(false);

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

	function handleReorder(tiles: Tile[]) {
		store.reorderTiles(tiles);
	}

	function handleResizeGrid(rows: number, columns: number) {
		store.updateBoard(store.currentBoard.id, { grid: { rows, columns } });
	}

	function handleAddTile() {
		const newTile: Tile = {
			id: `tile-${Date.now()}`,
			label: 'חדש',
			image: 'https://static.arasaac.org/pictograms/6009/6009_300.png',
			backgroundColor: '#ffffff',
			borderColor: '#ccc',
			type: 'button'
		};
		store.addTile(newTile);
	}

	async function handleExport() {
		const json = await exportBoardsJSON();
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `aac-boards-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	let fileInput: HTMLInputElement;

	function handleImport() {
		fileInput.click();
	}

	async function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const text = await file.text();
		try {
			const boards = JSON.parse(text);
			await store.importBoards(boards);
		} catch {
			// Invalid JSON
		}
		input.value = '';
	}

	async function handleReset() {
		await store.resetToDefaults();
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
	{#if store.editMode}
		{@const maxTiles = store.currentBoard.grid.rows * store.currentBoard.grid.columns}
		{@const hiddenCount = Math.max(0, store.currentBoard.tiles.length - maxTiles)}
		<EditToolbar
			rows={store.currentBoard.grid.rows}
			columns={store.currentBoard.grid.columns}
			{hiddenCount}
			{showOverflow}
			onresizegrid={handleResizeGrid}
			onexport={handleExport}
			onimport={handleImport}
			onaddtile={handleAddTile}
			onreset={handleReset}
			ondeleteoverflow={() => store.trimTilesToGrid()}
			ontoggleoverflow={() => (showOverflow = !showOverflow)}
		/>
	{/if}
	<Board
		board={store.currentBoard}
		ontilepress={handleTilePress}
		onreorder={handleReorder}
		direction={store.navDirection}
		editMode={store.editMode}
		{showOverflow}
	/>
</div>

<input
	type="file"
	accept=".json"
	class="hidden-input"
	bind:this={fileInput}
	onchange={handleFileChange}
/>

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

	.hidden-input {
		position: absolute;
		width: 0;
		height: 0;
		opacity: 0;
		pointer-events: none;
	}
</style>

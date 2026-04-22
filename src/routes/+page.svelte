<script lang="ts">
	import { onMount } from 'svelte';
	import Board from '$lib/components/Board.svelte';
	import OutputBar from '$lib/components/OutputBar.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import TileEditor from '$lib/components/TileEditor.svelte';
	import EditToolbar from '$lib/components/EditToolbar.svelte';
	import BoardManager from '$lib/components/BoardManager.svelte';
	import { boardStore } from '$lib/stores/board.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { speak, speakAll } from '$lib/services/tts';
	import { exportBoardsJSON } from '$lib/services/storage';
	import { pictogramUrl } from '$lib/services/arasaac';
	import type { Tile } from '$lib/types/board';
	import { HOME_BOARD_ID } from '$lib/data/boards';

	const store = boardStore();
	const sStore = settingsStore();

	let editingTile = $state<Tile | null>(null);
	let showOverflow = $state(false);

	// BoardManager state
	let managerOpen = $state(false);
	let managerInitialView = $state<'list' | 'new'>('list');
	let pendingCreateResolver: ((id: string | null) => void) | null = null;

	onMount(() => {
		store.init();
		sStore.init();
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
			image: pictogramUrl(6009),
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
		if (confirm('האם למחוק את כל הלוחות המותאמים ולחזור לברירת המחדל?')) {
			await store.resetToDefaults();
		}
	}

	function openBoardManager() {
		managerInitialView = 'list';
		managerOpen = true;
	}

	function closeBoardManager() {
		managerOpen = false;
		// If there was a pending create-for-folder flow, resolve with null (cancel)
		if (pendingCreateResolver) {
			pendingCreateResolver(null);
			pendingCreateResolver = null;
		}
	}

	function handleBoardCreated(id: string) {
		if (pendingCreateResolver) {
			pendingCreateResolver(id);
			pendingCreateResolver = null;
			managerOpen = false;
		}
	}

	function requestCreateBoardForTile(): Promise<string | null> {
		return new Promise<string | null>((resolve) => {
			pendingCreateResolver = resolve;
			managerInitialView = 'new';
			managerOpen = true;
		});
	}

	const availableBoards = $derived(
		Object.values(store.allBoards).map((b) => ({ id: b.id, name: b.name }))
	);
</script>

<svelte:head>
	<title>לוח תקשורת AAC</title>
</svelte:head>

<div class="app-container">
	{#if !store.initialized}
		<div class="loading-skeleton" aria-busy="true" aria-label="טוען...">
			<div class="skel-output"></div>
			<div class="skel-nav"></div>
			<div class="skel-grid">
				{#each Array(12) as _, i (i)}
					<div class="skel-tile"></div>
				{/each}
			</div>
		</div>
	{:else}
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
				onmanageBoards={openBoardManager}
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
	{/if}
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
		{availableBoards}
		onsave={handleTileSave}
		ondelete={handleTileDelete}
		onclose={() => (editingTile = null)}
		onRequestCreateBoard={requestCreateBoardForTile}
	/>
{/if}

{#if managerOpen}
	<BoardManager
		onclose={closeBoardManager}
		initialView={managerInitialView}
		onBoardCreated={handleBoardCreated}
	/>
{/if}

<style>
	.app-container {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		width: 100vw;
		overflow: hidden;
		background: var(--bg-app, #f0f4f8);
	}

	.hidden-input {
		position: absolute;
		width: 0;
		height: 0;
		opacity: 0;
		pointer-events: none;
	}

	.loading-skeleton {
		display: flex;
		flex-direction: column;
		gap: 0;
		height: 100%;
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

<script lang="ts">
	import type { Board, Tile as TileType } from '$lib/types/board';
	import Tile from './Tile.svelte';

	interface Props {
		board: Board;
		ontilepress: (tile: TileType) => void;
		onreorder?: (tiles: TileType[]) => void;
		direction: 'forward' | 'back' | 'none';
		editMode: boolean;
		showOverflow?: boolean;
	}

	let {
		board,
		ontilepress,
		onreorder,
		direction = 'none',
		editMode = false,
		showOverflow = false
	}: Props = $props();

	let animClass = $derived(
		direction === 'back' ? 'slide-right' : direction === 'forward' ? 'slide-left' : ''
	);

	let dragFromIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	// ── Transparent 1x1 image to hide browser's default ghost ──
	let emptyImg: HTMLImageElement | undefined;
	function getEmptyImg() {
		if (!emptyImg) {
			emptyImg = new Image();
			emptyImg.src =
				'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
		}
		return emptyImg;
	}

	// ── Desktop drag (HTML5 API) ──

	function handleDragStart(index: number, e: DragEvent) {
		dragFromIndex = index;
		// Hide default browser ghost and show custom one
		e.dataTransfer?.setDragImage(getEmptyImg(), 0, 0);
		const target = (e.target as HTMLElement).closest('[data-tile-index]') as HTMLElement | null;
		if (target) {
			ghostEl = createGhost(target, e.clientX, e.clientY);
		}
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		dragOverIndex = index;
		moveGhost(e.clientX, e.clientY);
	}

	function handleDrop(index: number) {
		removeGhost();
		commitReorder(index);
	}

	function handleDragEnd() {
		removeGhost();
		dragFromIndex = null;
		dragOverIndex = null;
	}

	// ── Touch drag (long-press to start) ──

	let touchActive = $state(false);
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;
	let gridEl = $state<HTMLDivElement>();
	let ghostEl: HTMLElement | null = null;

	function createGhost(sourceBtn: HTMLElement, x: number, y: number) {
		const rect = sourceBtn.getBoundingClientRect();
		const clone = sourceBtn.cloneNode(true) as HTMLElement;
		clone.style.position = 'fixed';
		clone.style.width = rect.width + 'px';
		clone.style.height = rect.height + 'px';
		clone.style.left = x - rect.width / 2 + 'px';
		clone.style.top = y - rect.height / 2 + 'px';
		clone.style.zIndex = '9999';
		clone.style.pointerEvents = 'none';
		clone.style.opacity = '0.85';
		clone.style.transform = 'scale(1.08)';
		clone.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
		clone.style.transition = 'none';
		clone.style.animation = 'none';
		clone.classList.add('drag-ghost');
		document.body.appendChild(clone);
		return clone;
	}

	function moveGhost(x: number, y: number) {
		if (!ghostEl) return;
		const w = parseFloat(ghostEl.style.width);
		const h = parseFloat(ghostEl.style.height);
		ghostEl.style.left = x - w / 2 + 'px';
		ghostEl.style.top = y - h / 2 + 'px';
	}

	function removeGhost() {
		if (ghostEl) {
			ghostEl.remove();
			ghostEl = null;
		}
	}

	function handleTouchStart(index: number, e: TouchEvent) {
		if (!editMode) return;
		const touch = e.touches[0];
		const target = (e.target as HTMLElement).closest('[data-tile-index]') as HTMLElement | null;
		longPressTimer = setTimeout(() => {
			dragFromIndex = index;
			touchActive = true;
			if (target) {
				ghostEl = createGhost(target, touch.clientX, touch.clientY);
			}
			navigator.vibrate?.(30);
		}, 400);
	}

	function handleTouchMove(e: TouchEvent) {
		if (!touchActive || dragFromIndex === null) return;
		e.preventDefault();
		const touch = e.touches[0];
		moveGhost(touch.clientX, touch.clientY);
		const el = document.elementFromPoint(touch.clientX, touch.clientY);
		if (!el) return;
		const tileBtn = el.closest('[data-tile-index]') as HTMLElement | null;
		if (tileBtn) {
			dragOverIndex = Number(tileBtn.dataset.tileIndex);
		}
	}

	function handleTouchEnd() {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
		removeGhost();
		if (touchActive && dragOverIndex !== null) {
			commitReorder(dragOverIndex);
		} else {
			dragFromIndex = null;
			dragOverIndex = null;
		}
		touchActive = false;
	}

	// ── Shared reorder logic ──

	let gridCapacity = $derived(board.grid.rows * board.grid.columns);
	let visibleTiles = $derived(board.tiles.slice(0, gridCapacity));
	let overflowTiles = $derived(board.tiles.slice(gridCapacity));

	function commitReorder(toIndex: number) {
		if (dragFromIndex !== null && dragFromIndex !== toIndex) {
			const tiles = [...board.tiles];
			const [moved] = tiles.splice(dragFromIndex, 1);
			tiles.splice(toIndex, 0, moved);
			onreorder?.(tiles);
		}
		dragFromIndex = null;
		dragOverIndex = null;
	}
</script>

{#key board.id}
	<div
		class="board-grid {animClass}"
		class:show-overflow={showOverflow && overflowTiles.length > 0}
		style="--rows: {board.grid.rows}; --cols: {board.grid.columns}"
		role="grid"
		aria-label={board.name}
		bind:this={gridEl}
	>
		{#each visibleTiles as tile, i (tile.id)}
			<Tile
				{tile}
				index={i}
				onpress={ontilepress}
				{editMode}
				dragging={editMode && dragFromIndex === i}
				dragOver={editMode && dragOverIndex === i && dragFromIndex !== i}
				ondragstart={(e: DragEvent) => handleDragStart(i, e)}
				ondragover={(e: DragEvent) => handleDragOver(e, i)}
				ondrop={() => handleDrop(i)}
				ondragend={handleDragEnd}
				ontouchstart={(e: TouchEvent) => handleTouchStart(i, e)}
				ontouchmove={handleTouchMove}
				ontouchend={handleTouchEnd}
			/>
		{/each}
		{#if showOverflow && overflowTiles.length > 0}
			<div class="overflow-divider" style="grid-column: 1 / -1">
				<span>אריחים מוסתרים ({overflowTiles.length})</span>
			</div>
			{#each overflowTiles as tile, i (tile.id)}
				<Tile
					{tile}
					index={gridCapacity + i}
					onpress={ontilepress}
					{editMode}
					dragging={false}
					dragOver={false}
					dimmed
				/>
			{/each}
		{/if}
	</div>
{/key}

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

	.board-grid.show-overflow {
		grid-template-rows: auto;
		overflow-y: auto;
	}

	.overflow-divider {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 6px 0;
		color: #e65100;
		font-size: 13px;
		font-weight: 600;
	}

	.overflow-divider::before,
	.overflow-divider::after {
		content: '';
		flex: 1;
		height: 2px;
		background: linear-gradient(to var(--dir, right), #ff9800, transparent);
	}

	.overflow-divider::before {
		--dir: left;
	}

	/* Board transition animations */
	.board-grid.slide-left {
		animation: slide-in-left 0.3s ease-out;
	}

	.board-grid.slide-right {
		animation: slide-in-right 0.3s ease-out;
	}

	@keyframes slide-in-left {
		from {
			opacity: 0;
			transform: translateX(-30px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes slide-in-right {
		from {
			opacity: 0;
			transform: translateX(30px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>

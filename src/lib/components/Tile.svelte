<script lang="ts">
	import type { Tile } from '$lib/types/board';

	interface Props {
		tile: Tile;
		index: number;
		onpress: (tile: Tile) => void;
		onedit?: (tile: Tile) => void;
		ondelete?: (tile: Tile) => void;
		editMode: boolean;
		dragging?: boolean;
		dragOver?: boolean;
		dimmed?: boolean;
		ondragstart?: (e: DragEvent) => void;
		ondragover?: (e: DragEvent) => void;
		ondrop?: () => void;
		ondragend?: () => void;
		ontouchstart?: (e: TouchEvent) => void;
		ontouchmove?: (e: TouchEvent) => void;
		ontouchend?: () => void;
	}

	let {
		tile,
		index,
		onpress,
		onedit,
		ondelete,
		editMode = false,
		dragging = false,
		dragOver = false,
		dimmed = false,
		ondragstart,
		ondragover,
		ondrop,
		ondragend,
		ontouchstart,
		ontouchmove,
		ontouchend
	}: Props = $props();

	function handleClick() {
		// Disabled tiles are non-interactive in view mode
		if (tile.disabled && !editMode) return;
		onpress(tile);
	}

	function handleEditClick(e: MouseEvent) {
		e.stopPropagation();
		onedit?.(tile);
	}

	function handleDeleteClick(e: MouseEvent) {
		e.stopPropagation();
		ondelete?.(tile);
	}
</script>

<button
	class="tile"
	class:folder={tile.type === 'folder'}
	class:editing={editMode}
	class:dragging
	class:drag-over={dragOver}
	class:dimmed
	class:tile-disabled={tile.disabled}
	style="--bg: {tile.backgroundColor}; --border-color: {tile.borderColor}; --index: {index}"
	data-tile-index={index}
	onclick={handleClick}
	draggable={editMode}
	{ondragstart}
	{ondragover}
	{ondrop}
	{ondragend}
	{ontouchstart}
	{ontouchmove}
	{ontouchend}
	aria-label={tile.label}
>
	<div class="tile-icon">
		<img src={tile.image} alt={tile.label} loading="lazy" draggable="false" />
		{#if tile.type === 'folder'}
			<span class="folder-badge" aria-hidden="true">
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
					<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
				</svg>
			</span>
		{/if}
	</div>
	<span class="tile-label">{tile.label}</span>
	{#if editMode}
		<!--
			NOTE: nested <button> inside <button> is invalid HTML. We render
			these as <span role="button"> with click handlers + pointerdown stops.
			Pointerdown stopPropagation is important to prevent the draggable outer
			button from starting a drag when the user taps the badge.
		-->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<span
			class="tile-action tile-edit-btn"
			role="button"
			tabindex="0"
			aria-label="ערוך {tile.label}"
			title="ערוך"
			onclick={handleEditClick}
			onpointerdown={(e) => e.stopPropagation()}
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
				/>
			</svg>
		</span>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<span
			class="tile-action tile-delete-btn"
			role="button"
			tabindex="0"
			aria-label="מחק {tile.label}"
			title="מחק"
			onclick={handleDeleteClick}
			onpointerdown={(e) => e.stopPropagation()}
		>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
			>
				<line x1="6" y1="6" x2="18" y2="18" />
				<line x1="6" y1="18" x2="18" y2="6" />
			</svg>
		</span>
	{/if}
</button>

<style>
	.tile {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 6px;
		background:
			linear-gradient(0deg, var(--bg, #fff), var(--bg, #fff)) padding-box,
			linear-gradient(
					325deg,
					color-mix(in srgb, var(--border-color, #ccc), white 25%),
					color-mix(in srgb, var(--border-color, #ccc), black 20%)
				)
				border-box;
		border: 3px solid transparent;
		border-radius: 14px;
		cursor: pointer;
		box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		overflow: hidden;
		min-width: 0;
		min-height: 0;

		/* staggered entrance animation */
		opacity: 0;
		animation: tile-enter 0.35s ease-out forwards;
		animation-delay: calc(var(--index, 0) * 30ms);

		/* hover & press transitions */
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	/* subtle gradient sheen on every tile */
	.tile::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(145deg, rgb(255 255 255 / 0.25) 0%, rgb(0 0 0 / 0.06) 100%);
		border-radius: inherit;
		pointer-events: none;
		z-index: 1;
	}

	/* hover lift effect */
	.tile:hover {
		transform: translateY(-3px);
		box-shadow: 0 6px 16px rgb(0 0 0 / 0.15);
	}

	/* press feedback — shadow only, no scale/animation swap */
	.tile:active {
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.15);
	}

	.tile:focus-visible {
		outline: 3px solid #1976d2;
		outline-offset: 2px;
	}

	/* folder dashed border hint */
	.tile.folder {
		position: relative;
	}

	.tile.folder::after {
		content: '';
		position: absolute;
		inset: 2px;
		border: 1.5px dashed var(--border-color, #ccc);
		border-radius: 10px;
		pointer-events: none;
		opacity: 0.4;
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
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--border-color, #1565c0);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.25);
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

	/* drag & drop */
	.tile.dragging {
		opacity: 0.4;
		transform: scale(0.95);
	}

	.tile.drag-over {
		background:
			linear-gradient(0deg, var(--bg, #fff), var(--bg, #fff)) padding-box,
			linear-gradient(325deg, #42a5f5, #1565c0) border-box;
		box-shadow: 0 0 0 3px rgb(25 118 210 / 0.4);
		transform: scale(1.05);
	}

	/* edit mode indicator */
	.tile.editing {
		opacity: 1;
		animation: tile-wobble 1.5s ease-in-out infinite;
	}

	.tile.editing.dragging {
		opacity: 0.4;
		animation: none;
	}

	.tile.editing.drag-over {
		animation: none;
	}

	.tile.dimmed {
		opacity: 0.45;
		filter: grayscale(0.5);
	}

	.tile.tile-disabled {
		opacity: 0.35;
		filter: grayscale(0.85);
	}

	.tile.tile-disabled:hover {
		transform: none;
		box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
	}

	.tile.tile-disabled.editing {
		/* In edit mode, the tile is still interactive (for the editor), but visually muted */
		opacity: 0.6;
	}

	/* ── Edit/delete action badges (visible only in edit mode) ── */

	.tile-action {
		position: absolute;
		top: 4px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 1px 4px rgb(0 0 0 / 0.3);
		z-index: 3;
		cursor: pointer;
		color: white;
		transition:
			transform 0.1s ease,
			box-shadow 0.15s ease;
	}

	.tile-action:hover {
		transform: scale(1.15);
		box-shadow: 0 2px 6px rgb(0 0 0 / 0.4);
	}

	.tile-action:active {
		transform: scale(0.92);
	}

	.tile-action:focus-visible {
		outline: 2px solid white;
		outline-offset: 2px;
	}

	.tile-edit-btn {
		right: 4px;
		background: #e65100;
	}

	.tile-delete-btn {
		/* RTL-aware: we want this visually on the LEFT corner of the tile */
		left: 4px;
		background: #c62828;
	}

	@keyframes tile-wobble {
		0%,
		100% {
			transform: rotate(0deg);
		}
		25% {
			transform: rotate(-1deg);
		}
		75% {
			transform: rotate(1deg);
		}
	}

	/* staggered fade-in + slide-up */
	@keyframes tile-enter {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>

<script lang="ts">
	import type { Tile } from '$lib/types/board';

	interface Props {
		tile: Tile;
		onsave: (tileId: string, updates: Partial<Tile>) => void;
		ondelete: (tileId: string) => void;
		onclose: () => void;
	}

	let { tile, onsave, ondelete, onclose }: Props = $props();

	let label = $state('');
	let backgroundColor = $state('');
	let borderColor = $state('');
	let tileType = $state<'button' | 'folder'>('button');
	let loadBoard = $state('');

	$effect(() => {
		label = tile.label;
		backgroundColor = tile.backgroundColor;
		borderColor = tile.borderColor;
		tileType = tile.type;
		loadBoard = tile.loadBoard ?? '';
	});

	function handleSave() {
		const updates: Partial<Tile> = {
			label,
			backgroundColor,
			borderColor,
			type: tileType
		};
		if (tileType === 'folder' && loadBoard) {
			updates.loadBoard = loadBoard;
		}
		onsave(tile.id, updates);
	}

	function handleDelete() {
		ondelete(tile.id);
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	const presetColors = [
		'#FFF176',
		'#A5D6A7',
		'#EF9A9A',
		'#90CAF9',
		'#CE93D8',
		'#F48FB1',
		'#FFCC80',
		'#E0E0E0',
		'#80CBC4',
		'#BCAAA4'
	];
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={handleBackdropClick}>
	<div class="editor" role="dialog" aria-label="עריכת אריח">
		<header class="editor-header">
			<h2>עריכת אריח</h2>
			<button class="close-btn" onclick={onclose} aria-label="סגור">
				<svg
					width="20"
					height="20"
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
		</header>

		<div class="editor-preview">
			<div class="preview-tile" style="background: {backgroundColor}; border-color: {borderColor}">
				<img src={tile.image} alt={label} />
				<span>{label}</span>
			</div>
		</div>

		<div class="editor-fields">
			<label class="field">
				<span class="field-label">תווית</span>
				<input type="text" bind:value={label} class="field-input" />
			</label>

			<label class="field">
				<span class="field-label">סוג</span>
				<select bind:value={tileType} class="field-input">
					<option value="button">כפתור</option>
					<option value="folder">תיקייה</option>
				</select>
			</label>

			{#if tileType === 'folder'}
				<label class="field">
					<span class="field-label">מזהה לוח יעד</span>
					<input type="text" bind:value={loadBoard} class="field-input" placeholder="board-id" />
				</label>
			{/if}

			<div class="field">
				<span class="field-label">צבע רקע</span>
				<div class="color-row">
					{#each presetColors as color (color)}
						<button
							class="color-swatch"
							class:selected={backgroundColor === color}
							style="background: {color}"
							onclick={() => (backgroundColor = color)}
							aria-label="צבע {color}"
						></button>
					{/each}
					<input type="color" bind:value={backgroundColor} class="color-picker" />
				</div>
			</div>

			<div class="field">
				<span class="field-label">צבע גבול</span>
				<div class="color-row">
					<input type="color" bind:value={borderColor} class="color-picker-large" />
					<span class="color-hex">{borderColor}</span>
				</div>
			</div>
		</div>

		<footer class="editor-actions">
			<button class="btn btn-delete" onclick={handleDelete}>מחק</button>
			<div class="spacer"></div>
			<button class="btn btn-cancel" onclick={onclose}>ביטול</button>
			<button class="btn btn-save" onclick={handleSave}>שמור</button>
		</footer>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgb(0 0 0 / 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 16px;
	}

	.editor {
		background: white;
		border-radius: 16px;
		width: 100%;
		max-width: 420px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 12px 40px rgb(0 0 0 / 0.25);
		display: flex;
		flex-direction: column;
	}

	.editor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid #e0e0e0;
	}

	.editor-header h2 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		color: #212121;
	}

	.close-btn {
		width: 36px;
		height: 36px;
		border: none;
		background: #f5f5f5;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #616161;
		transition: background 0.15s;
	}

	.close-btn:hover {
		background: #e0e0e0;
	}

	.editor-preview {
		display: flex;
		justify-content: center;
		padding: 20px;
		background: #f5f5f5;
	}

	.preview-tile {
		width: 100px;
		height: 100px;
		border: 3px solid;
		border-radius: 14px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 8px;
	}

	.preview-tile img {
		width: 48px;
		height: 48px;
		object-fit: contain;
	}

	.preview-tile span {
		font-size: 13px;
		font-weight: 600;
		color: #212121;
		text-align: center;
	}

	.editor-fields {
		padding: 16px 20px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.field-label {
		font-size: 13px;
		font-weight: 600;
		color: #616161;
	}

	.field-input {
		padding: 8px 12px;
		border: 1.5px solid #e0e0e0;
		border-radius: 8px;
		font-size: 15px;
		outline: none;
		transition: border-color 0.15s;
	}

	.field-input:focus {
		border-color: #1976d2;
	}

	.color-row {
		display: flex;
		gap: 6px;
		align-items: center;
		flex-wrap: wrap;
	}

	.color-swatch {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition:
			border-color 0.15s,
			transform 0.1s;
	}

	.color-swatch:hover {
		transform: scale(1.15);
	}

	.color-swatch.selected {
		border-color: #212121;
		box-shadow: 0 0 0 2px white inset;
	}

	.color-picker {
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		padding: 0;
	}

	.color-picker-large {
		width: 36px;
		height: 36px;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		padding: 0;
	}

	.color-hex {
		font-size: 13px;
		color: #9e9e9e;
		font-family: monospace;
	}

	.editor-actions {
		display: flex;
		gap: 8px;
		padding: 16px 20px;
		border-top: 1px solid #e0e0e0;
	}

	.spacer {
		flex: 1;
	}

	.btn {
		padding: 8px 20px;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.15s,
			transform 0.1s;
	}

	.btn:active {
		transform: scale(0.95);
	}

	.btn-save {
		background: #1976d2;
		color: white;
	}

	.btn-save:hover {
		background: #1565c0;
	}

	.btn-cancel {
		background: #f5f5f5;
		color: #616161;
	}

	.btn-cancel:hover {
		background: #e0e0e0;
	}

	.btn-delete {
		background: #ffebee;
		color: #c62828;
	}

	.btn-delete:hover {
		background: #ffcdd2;
	}
</style>

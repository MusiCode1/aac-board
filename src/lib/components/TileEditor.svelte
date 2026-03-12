<script lang="ts">
	import { onMount } from 'svelte';
	import type { Tile } from '$lib/types/board';
	import { searchPictograms, type ArasaacResult } from '$lib/services/arasaac';
	import { speak, getTtsSettings, saveTtsSettings, getHebrewVoices } from '$lib/services/tts';

	interface Props {
		tile: Tile;
		onsave: (tileId: string, updates: Partial<Tile>) => void;
		ondelete: (tileId: string) => void;
		onclose: () => void;
	}

	let { tile, onsave, ondelete, onclose }: Props = $props();

	// ── Tile fields ──
	let label = $state('');
	let image = $state('');
	let backgroundColor = $state('');
	let borderColor = $state('');
	let tileType = $state<'button' | 'folder'>('button');
	let loadBoard = $state('');

	// ── Symbol search ──
	let searchQuery = $state('');
	let searchResults = $state<ArasaacResult[]>([]);
	let searching = $state(false);
	let searchTimer: ReturnType<typeof setTimeout> | null = null;
	let abortController: AbortController | null = null;

	// ── Image upload ──
	let imageInput: HTMLInputElement | undefined;
	let uploadWarning = $state('');

	// ── TTS settings ──
	let availableVoices = $state<SpeechSynthesisVoice[]>([]);
	let selectedVoiceURI = $state('');
	let ttsRate = $state(0.9);
	let ttsPitch = $state(1.0);

	$effect(() => {
		label = tile.label;
		image = tile.image;
		backgroundColor = tile.backgroundColor;
		borderColor = tile.borderColor;
		tileType = tile.type;
		loadBoard = tile.loadBoard ?? '';
		searchQuery = '';
		searchResults = [];
		uploadWarning = '';
	});

	// Debounced search
	$effect(() => {
		const query = searchQuery.trim();
		if (searchTimer) clearTimeout(searchTimer);
		if (query.length < 2) {
			searchResults = [];
			searching = false;
			return;
		}
		searching = true;
		searchTimer = setTimeout(async () => {
			if (abortController) abortController.abort();
			abortController = new AbortController();
			const results = await searchPictograms(query, 'he', abortController.signal);
			searchResults = results;
			searching = false;
		}, 300);
	});

	onMount(() => {
		const settings = getTtsSettings();
		selectedVoiceURI = settings.voiceURI;
		ttsRate = settings.rate;
		ttsPitch = settings.pitch;

		availableVoices = getHebrewVoices();
		if ('speechSynthesis' in globalThis) {
			speechSynthesis.onvoiceschanged = () => {
				availableVoices = getHebrewVoices();
			};
		}
	});

	function handleSave() {
		const updates: Partial<Tile> = {
			label,
			image,
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

	function handleImageUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		if (file.size > 500 * 1024) {
			uploadWarning = 'התמונה גדולה מ-500KB. מומלץ לבחור תמונה קטנה יותר.';
		} else {
			uploadWarning = '';
		}

		const reader = new FileReader();
		reader.onload = () => {
			image = reader.result as string;
		};
		reader.readAsDataURL(file);
		input.value = '';
	}

	function persistTts() {
		saveTtsSettings({ voiceURI: selectedVoiceURI, rate: ttsRate, pitch: ttsPitch });
	}

	function previewVoice() {
		speak('שלום, זה ניסיון קול');
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
				<img src={image} alt={label} />
				<span>{label}</span>
			</div>
		</div>

		<div class="editor-fields">
			<label class="field">
				<span class="field-label">תווית</span>
				<input type="text" bind:value={label} class="field-input" />
			</label>

			<!-- Symbol search & image upload -->
			<div class="field">
				<span class="field-label">תמונה / סמל</span>
				<div class="image-actions">
					<input
						type="text"
						bind:value={searchQuery}
						class="field-input"
						placeholder="חפש סמל..."
					/>
					<button class="btn btn-upload" onclick={() => imageInput?.click()}>העלה</button>
					<input
						type="file"
						accept="image/*"
						bind:this={imageInput}
						onchange={handleImageUpload}
						hidden
					/>
				</div>
				{#if uploadWarning}
					<span class="upload-warning">{uploadWarning}</span>
				{/if}
				{#if searching}
					<div class="search-status">מחפש...</div>
				{:else if searchQuery.trim().length >= 2 && searchResults.length === 0}
					<div class="search-status">לא נמצאו תוצאות</div>
				{/if}
				{#if searchResults.length > 0}
					<div class="symbol-grid">
						{#each searchResults.slice(0, 24) as result (result._id)}
							<button
								class="symbol-option"
								class:selected={image === result.imageUrl}
								onclick={() => (image = result.imageUrl)}
								title={result.keywords[0]?.keyword ?? ''}
							>
								<img src={result.imageUrl} alt={result.keywords[0]?.keyword ?? ''} loading="lazy" />
							</button>
						{/each}
					</div>
				{/if}
			</div>

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

			<!-- TTS settings (global) -->
			<div class="field tts-section">
				<span class="field-label">הגדרות קול</span>
				<select bind:value={selectedVoiceURI} class="field-input" onchange={persistTts}>
					<option value="">ברירת מחדל</option>
					{#each availableVoices as voice (voice.voiceURI)}
						<option value={voice.voiceURI}>{voice.name}</option>
					{/each}
				</select>
				<div class="slider-row">
					<label class="slider-field">
						<span class="slider-label">מהירות: {ttsRate.toFixed(1)}</span>
						<input
							type="range"
							min="0.5"
							max="2"
							step="0.1"
							bind:value={ttsRate}
							oninput={persistTts}
						/>
					</label>
					<label class="slider-field">
						<span class="slider-label">גובה: {ttsPitch.toFixed(1)}</span>
						<input
							type="range"
							min="0.5"
							max="2"
							step="0.1"
							bind:value={ttsPitch}
							oninput={persistTts}
						/>
					</label>
				</div>
				<button class="btn btn-preview" onclick={previewVoice}>נסה קול</button>
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

	/* ── Image search ── */

	.image-actions {
		display: flex;
		gap: 6px;
	}

	.image-actions .field-input {
		flex: 1;
	}

	.btn-upload {
		padding: 8px 14px;
		border: 1.5px solid #e0e0e0;
		border-radius: 8px;
		background: #f5f5f5;
		color: #616161;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		transition: background 0.15s;
	}

	.btn-upload:hover {
		background: #e0e0e0;
	}

	.upload-warning {
		font-size: 12px;
		color: #e65100;
	}

	.search-status {
		font-size: 13px;
		color: #9e9e9e;
		padding: 4px 0;
	}

	.symbol-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		max-height: 200px;
		overflow-y: auto;
		padding: 4px 0;
	}

	.symbol-option {
		width: 56px;
		height: 56px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		background: white;
		cursor: pointer;
		padding: 4px;
		transition:
			border-color 0.15s,
			transform 0.1s;
	}

	.symbol-option:hover {
		border-color: #90caf9;
		transform: scale(1.05);
	}

	.symbol-option.selected {
		border-color: #1976d2;
		box-shadow: 0 0 0 1px #1976d2;
	}

	.symbol-option img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	/* ── TTS settings ── */

	.tts-section {
		border-top: 1px solid #e0e0e0;
		padding-top: 14px;
	}

	.slider-row {
		display: flex;
		gap: 12px;
	}

	.slider-field {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.slider-label {
		font-size: 12px;
		color: #9e9e9e;
	}

	.slider-field input[type='range'] {
		width: 100%;
		accent-color: #1976d2;
	}

	.btn-preview {
		align-self: flex-start;
		padding: 6px 14px;
		border: 1.5px solid #e0e0e0;
		border-radius: 8px;
		background: #e3f2fd;
		color: #1565c0;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-preview:hover {
		background: #bbdefb;
	}

	/* ── Colors ── */

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

	/* ── Footer ── */

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

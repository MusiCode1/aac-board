<script lang="ts">
	import { onMount } from 'svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { boardStore } from '$lib/stores/board.svelte';
	import { speak, getHebrewVoices } from '$lib/services/tts';
	import { exportBoardsJSON } from '$lib/services/storage';

	const sStore = settingsStore();
	const bStore = boardStore();

	let availableVoices = $state<SpeechSynthesisVoice[]>([]);
	let fileInput: HTMLInputElement | undefined;

	onMount(() => {
		sStore.init();
		bStore.init();
		availableVoices = getHebrewVoices();
		if ('speechSynthesis' in globalThis) {
			speechSynthesis.onvoiceschanged = () => {
				availableVoices = getHebrewVoices();
			};
		}
	});

	function previewVoice() {
		speak('שלום, זה ניסיון קול');
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

	function handleImport() {
		fileInput?.click();
	}

	async function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const text = await file.text();
		try {
			const boards = JSON.parse(text);
			await bStore.importBoards(boards);
		} catch {
			// Invalid JSON
		}
		input.value = '';
	}

	async function handleReset() {
		if (confirm('לאפס את כל הלוחות לברירת מחדל?')) {
			await bStore.resetToDefaults();
			await sStore.resetToDefaults();
		}
	}

	const tileSizes: { value: 'small' | 'medium' | 'large'; label: string }[] = [
		{ value: 'small', label: 'קטן' },
		{ value: 'medium', label: 'בינוני' },
		{ value: 'large', label: 'גדול' }
	];
</script>

<svelte:head>
	<title>הגדרות — לוח תקשורת AAC</title>
</svelte:head>

<div class="settings-page">
	<header class="settings-header">
		<a href="/" class="back-btn" aria-label="חזרה ללוח">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
				<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
			</svg>
		</a>
		<h1>הגדרות</h1>
	</header>

	<div class="settings-content">
		<!-- TTS -->
		<section class="card">
			<h2 class="card-title">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
					/>
				</svg>
				הגדרות קול
			</h2>

			<label class="field">
				<span class="field-label">קול</span>
				<select
					class="field-input"
					value={sStore.settings.ttsVoice}
					onchange={(e) => sStore.update({ ttsVoice: (e.target as HTMLSelectElement).value })}
				>
					<option value="">ברירת מחדל</option>
					{#each availableVoices as voice (voice.voiceURI)}
						<option value={voice.voiceURI}>{voice.name}</option>
					{/each}
				</select>
			</label>

			<label class="field">
				<span class="field-label">מהירות: {sStore.settings.ttsRate.toFixed(1)}</span>
				<input
					type="range"
					min="0.5"
					max="2"
					step="0.1"
					value={sStore.settings.ttsRate}
					oninput={(e) =>
						sStore.update({ ttsRate: parseFloat((e.target as HTMLInputElement).value) })}
				/>
			</label>

			<label class="field">
				<span class="field-label">גובה קול: {sStore.settings.ttsPitch.toFixed(1)}</span>
				<input
					type="range"
					min="0.5"
					max="2"
					step="0.1"
					value={sStore.settings.ttsPitch}
					oninput={(e) =>
						sStore.update({ ttsPitch: parseFloat((e.target as HTMLInputElement).value) })}
				/>
			</label>

			<button class="btn btn-preview" onclick={previewVoice}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
					<path d="M8 5v14l11-7z" />
				</svg>
				נסה קול
			</button>
		</section>

		<!-- Display -->
		<section class="card">
			<h2 class="card-title">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"
					/>
				</svg>
				תצוגה
			</h2>

			<div class="field">
				<span class="field-label">ערכת נושא</span>
				<div class="toggle-group">
					<button
						class="toggle-btn"
						class:active={sStore.settings.theme === 'light'}
						onclick={() => sStore.update({ theme: 'light' })}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"
							/>
						</svg>
						בהיר
					</button>
					<button
						class="toggle-btn"
						class:active={sStore.settings.theme === 'dark'}
						onclick={() => sStore.update({ theme: 'dark' })}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M10 2c-1.82 0-3.53.5-5 1.35C7.99 5.08 10 8.3 10 12s-2.01 6.92-5 8.65C6.47 21.5 8.18 22 10 22c5.52 0 10-4.48 10-10S15.52 2 10 2z"
							/>
						</svg>
						כהה
					</button>
				</div>
			</div>

			<div class="field">
				<span class="field-label">גודל אריחים</span>
				<div class="toggle-group">
					{#each tileSizes as size (size.value)}
						<button
							class="toggle-btn"
							class:active={sStore.settings.tileSize === size.value}
							onclick={() => sStore.update({ tileSize: size.value })}
						>
							{size.label}
						</button>
					{/each}
				</div>
			</div>
		</section>

		<!-- Data -->
		<section class="card">
			<h2 class="card-title">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
					<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
				</svg>
				נתונים
			</h2>

			<div class="btn-row">
				<button class="btn btn-action" onclick={handleExport}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
						<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
					</svg>
					ייצוא לוחות
				</button>
				<button class="btn btn-action" onclick={handleImport}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
						<path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
					</svg>
					ייבוא לוחות
				</button>
			</div>

			<button class="btn btn-danger" onclick={handleReset}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
					/>
				</svg>
				איפוס לברירת מחדל
			</button>
		</section>
	</div>
</div>

<input
	type="file"
	accept=".json"
	class="hidden-input"
	bind:this={fileInput}
	onchange={handleFileChange}
/>

<style>
	.settings-page {
		min-height: 100dvh;
		background: var(--bg-app, #f0f4f8);
		direction: rtl;
	}

	.settings-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 20px;
		background: var(--bg-card, white);
		border-bottom: 1px solid var(--border-color, #e0e0e0);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.settings-header h1 {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		color: var(--text-primary, #212121);
	}

	.back-btn {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		background: var(--bg-card-alt, #f5f5f5);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-primary, #212121);
		text-decoration: none;
		transition: background 0.15s;
	}

	.back-btn:hover {
		background: var(--border-color, #e0e0e0);
	}

	.settings-content {
		max-width: 520px;
		margin: 0 auto;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.card {
		background: var(--bg-card, white);
		border-radius: 16px;
		padding: 20px;
		box-shadow: 0 1px 4px rgb(0 0 0 / 0.06);
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.card-title {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0;
		font-size: 16px;
		font-weight: 700;
		color: var(--text-primary, #212121);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field-label {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-secondary, #616161);
	}

	.field-input {
		padding: 8px 12px;
		border: 1.5px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		font-size: 15px;
		outline: none;
		background: var(--bg-card, white);
		color: var(--text-primary, #212121);
		transition: border-color 0.15s;
	}

	.field-input:focus {
		border-color: var(--primary, #1976d2);
	}

	input[type='range'] {
		width: 100%;
		accent-color: var(--primary, #1976d2);
	}

	.toggle-group {
		display: flex;
		gap: 6px;
	}

	.toggle-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 8px 12px;
		border: 1.5px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		background: var(--bg-card, white);
		color: var(--text-secondary, #616161);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
	}

	.toggle-btn:hover {
		background: var(--bg-card-alt, #f5f5f5);
	}

	.toggle-btn.active {
		background: var(--primary-light, #e3f2fd);
		border-color: var(--primary, #1976d2);
		color: var(--primary, #1976d2);
	}

	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 10px 16px;
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
		transform: scale(0.97);
	}

	.btn-preview {
		align-self: flex-start;
		background: var(--primary-light, #e3f2fd);
		color: var(--primary, #1976d2);
	}

	.btn-preview:hover {
		background: #bbdefb;
	}

	.btn-row {
		display: flex;
		gap: 8px;
	}

	.btn-action {
		flex: 1;
		background: var(--bg-card-alt, #f5f5f5);
		color: var(--text-primary, #212121);
	}

	.btn-action:hover {
		background: var(--border-color, #e0e0e0);
	}

	.btn-danger {
		background: #ffebee;
		color: #c62828;
	}

	.btn-danger:hover {
		background: #ffcdd2;
	}

	.hidden-input {
		position: absolute;
		width: 0;
		height: 0;
		opacity: 0;
		pointer-events: none;
	}
</style>

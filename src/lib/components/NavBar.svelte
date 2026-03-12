<script lang="ts">
	interface Props {
		boardName: string;
		canGoBack: boolean;
		isHome: boolean;
		breadcrumbs: string[];
		editMode: boolean;
		onback: () => void;
		onhome: () => void;
		ontoggleedit: () => void;
	}

	let {
		boardName,
		canGoBack,
		isHome,
		breadcrumbs = [],
		editMode = false,
		onback,
		onhome,
		ontoggleedit
	}: Props = $props();
</script>

<nav class="nav-bar" class:editing={editMode} aria-label="ניווט לוח">
	<div class="nav-actions">
		<button class="nav-btn" onclick={onhome} disabled={isHome} aria-label="בית" title="בית">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
				<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
			</svg>
		</button>
		<button class="nav-btn" onclick={onback} disabled={!canGoBack} aria-label="חזור" title="חזור">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
				<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
			</svg>
		</button>
	</div>
	<div class="nav-title-area">
		{#if breadcrumbs.length > 0}
			<div class="breadcrumbs">
				{#each breadcrumbs as crumb, i (crumb + i)}
					<span class="crumb">{crumb}</span>
					{#if i < breadcrumbs.length - 1}
						<span class="crumb-sep">‹</span>
					{/if}
				{/each}
				<span class="crumb-sep">‹</span>
			</div>
		{/if}
		<h1 class="board-title">{boardName}</h1>
	</div>
	<a class="nav-btn settings-btn" href="/settings" aria-label="הגדרות" title="הגדרות">
		<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
			<path
				d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.61 3.61 0 0112 15.6z"
			/>
		</svg>
	</a>
	<button
		class="nav-btn edit-btn"
		class:active={editMode}
		onclick={ontoggleedit}
		aria-label={editMode ? 'סיום עריכה' : 'עריכה'}
		title={editMode ? 'סיום עריכה' : 'עריכה'}
	>
		{#if editMode}
			<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
				<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
			</svg>
		{:else}
			<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
				/>
			</svg>
		{/if}
	</button>
</nav>

<style>
	.nav-bar {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 8px 16px;
		background: linear-gradient(135deg, #1565c0, #1976d2, #1e88e5);
		color: white;
		box-shadow: 0 2px 8px rgb(0 0 0 / 0.2);
		transition: background 0.3s;
	}

	.nav-bar.editing {
		background: linear-gradient(135deg, #e65100, #f57c00, #ff9800);
	}

	.nav-actions {
		display: flex;
		gap: 6px;
	}

	.nav-btn {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		border: none;
		background: rgb(255 255 255 / 0.15);
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background 0.15s,
			transform 0.1s;
		backdrop-filter: blur(4px);
	}

	.nav-btn:hover:not(:disabled) {
		background: rgb(255 255 255 / 0.3);
		transform: translateY(-1px);
	}

	.nav-btn:active:not(:disabled) {
		transform: scale(0.9);
	}

	.nav-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.edit-btn.active {
		background: rgb(255 255 255 / 0.35);
		box-shadow: 0 0 0 2px white;
	}

	.nav-title-area {
		flex: 1;
		min-width: 0;
	}

	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		opacity: 0.75;
		margin-bottom: 1px;
	}

	.crumb {
		white-space: nowrap;
	}

	.crumb-sep {
		font-size: 10px;
		opacity: 0.6;
	}

	.board-title {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>

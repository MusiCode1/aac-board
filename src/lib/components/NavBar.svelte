<script lang="ts">
	interface Props {
		boardName: string;
		canGoBack: boolean;
		isHome: boolean;
		breadcrumbs: string[];
		onback: () => void;
		onhome: () => void;
	}

	let { boardName, canGoBack, isHome, breadcrumbs = [], onback, onhome }: Props = $props();
</script>

<nav class="nav-bar" aria-label="ניווט לוח">
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

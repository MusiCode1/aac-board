<script lang="ts">
	interface Props {
		boardName: string;
		canGoBack: boolean;
		isHome: boolean;
		onback: () => void;
		onhome: () => void;
	}

	let { boardName, canGoBack, isHome, onback, onhome }: Props = $props();
</script>

<nav class="nav-bar" aria-label="ניווט לוח">
	<div class="nav-actions">
		<button class="nav-btn" onclick={onhome} disabled={isHome} aria-label="בית" title="בית">
			🏠
		</button>
		<button class="nav-btn" onclick={onback} disabled={!canGoBack} aria-label="חזור" title="חזור">
			→
		</button>
	</div>
	<h1 class="board-title">{boardName}</h1>
</nav>

<style>
	.nav-bar {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 16px;
		background: #1565c0;
		color: white;
		box-shadow: 0 2px 4px rgb(0 0 0 / 0.15);
	}

	.nav-actions {
		display: flex;
		gap: 6px;
	}

	.nav-btn {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		border: none;
		background: rgb(255 255 255 / 0.2);
		color: white;
		font-size: 20px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background 0.15s,
			transform 0.1s;
	}

	.nav-btn:hover:not(:disabled) {
		background: rgb(255 255 255 / 0.3);
	}

	.nav-btn:active:not(:disabled) {
		transform: scale(0.9);
	}

	.nav-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.board-title {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
		flex: 1;
	}
</style>

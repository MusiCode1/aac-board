<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import BoardManager from '$lib/components/BoardManager.svelte';
	import BoardThumbnail from '$lib/components/BoardThumbnail.svelte';
	import { boardStore } from '$lib/stores/board.svelte';
	import { setsStore } from '$lib/stores/sets.svelte';

	const boards = boardStore();
	const sets = setsStore();

	let managerOpen = $state(false);
	let managerInitialView = $state<'list' | 'new'>('list');

	onMount(async () => {
		if (!sets.initialized) await sets.init();
		if (!boards.initialized) await boards.init();
	});

	const setId = $derived(page.params.setId!);
	const currentSet = $derived(sets.allSets.find((set) => set.id === setId));
	const setBoards = $derived(
		Object.values(boards.allBoards)
			.filter((board) => board.setId === setId)
			.sort((a, b) => {
				if (a.id === currentSet?.homeBoardId) return -1;
				if (b.id === currentSet?.homeBoardId) return 1;
				return a.name.localeCompare(b.name, 'he');
			})
	);

	$effect(() => {
		if (sets.initialized && !currentSet) {
			goto('/sets', { replaceState: true });
		}
	});

	function openBoardManager() {
		managerInitialView = 'list';
		managerOpen = true;
	}

	function openCreateBoard() {
		managerInitialView = 'new';
		managerOpen = true;
	}

	function handleBoardCreated(boardId: string) {
		managerOpen = false;
		goto(`/s/${setId}/b/${boardId}/edit`);
	}
</script>

<svelte:head>
	<title>{currentSet?.name ?? 'אוסף'} — ניהול לוחות</title>
</svelte:head>

<div class="set-dashboard">
	{#if !sets.initialized || !boards.initialized || !currentSet}
		<div class="dashboard-skeleton" aria-busy="true" aria-label="טוען אוסף">
			<div class="skeleton-banner"></div>
			<div class="skeleton-grid">
				{#each Array(6) as _, index (index)}
					<div class="skeleton-card"></div>
				{/each}
			</div>
		</div>
	{:else}
		<header class="hero-card">
			<div class="hero-text">
				<a class="hero-eyebrow" href="/sets">כל האוספים</a>
				<h1>{currentSet.name}</h1>
				<p>
					{setBoards.length} לוחות באוסף.
					{#if currentSet.id === sets.defaultSetId}זהו האוסף שנפתח כברירת מחדל.{/if}
				</p>
			</div>
			<div class="hero-actions">
				<a class="ghost-btn" href={`/s/${setId}/b/${currentSet.homeBoardId}`}>פתח בית</a>
				<button class="ghost-btn" onclick={openBoardManager}>ניהול מלא</button>
				<button class="primary-btn" onclick={openCreateBoard}>לוח חדש</button>
			</div>
		</header>

		<section class="boards-section">
			<div class="section-heading">
				<h2>לוחות באוסף</h2>
				<span>{setBoards.length} פריטים</span>
			</div>

			<div class="board-grid">
				{#each setBoards as board (board.id)}
					{@const isHome = board.id === currentSet.homeBoardId}
					<article class="board-card" data-board-id={board.id}>
						<button class="board-card-main" onclick={() => goto(`/s/${setId}/b/${board.id}`)}>
							<BoardThumbnail tiles={board.tiles} />
							<div class="board-copy">
								<div class="board-title-row">
									<h3>{board.name}</h3>
									{#if isHome}<span class="home-pill">בית</span>{/if}
								</div>
								<p>{board.grid.rows}×{board.grid.columns} · {board.tiles.length} אריחים</p>
							</div>
						</button>
						<div class="board-card-actions">
							<a class="mini-btn" href={`/s/${setId}/b/${board.id}`}>פתח</a>
							<a class="mini-btn mini-btn-accent" href={`/s/${setId}/b/${board.id}/edit`}>ערוך</a>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/if}
</div>

{#if managerOpen && currentSet}
	<BoardManager
		onclose={() => (managerOpen = false)}
		initialView={managerInitialView}
		onBoardCreated={handleBoardCreated}
		onNavigateToBoard={(boardId) => goto(`/s/${setId}/b/${boardId}`)}
		{setId}
		homeBoardId={currentSet.homeBoardId}
	/>
{/if}

<style>
	.set-dashboard {
		min-height: 100dvh;
		padding: 24px;
		background:
			radial-gradient(circle at top left, rgb(144 202 249 / 0.3), transparent 28%),
			radial-gradient(circle at top right, rgb(255 224 178 / 0.5), transparent 24%),
			linear-gradient(180deg, rgb(245 249 255), rgb(235 242 250));
	}

	.hero-card,
	.board-card,
	.skeleton-card {
		border-radius: 28px;
		background: rgb(255 255 255 / 0.82);
		backdrop-filter: blur(16px);
		border: 1px solid rgb(255 255 255 / 0.7);
		box-shadow: 0 28px 70px rgb(15 23 42 / 0.1);
	}

	.hero-card {
		display: flex;
		justify-content: space-between;
		gap: 24px;
		padding: 28px;
		margin-bottom: 24px;
	}

	.hero-text {
		max-width: 540px;
	}

	.hero-eyebrow {
		display: inline-flex;
		margin-bottom: 10px;
		color: #0d47a1;
		font-size: 13px;
		font-weight: 700;
		text-decoration: none;
	}

	.hero-text h1 {
		margin: 0;
		font-size: clamp(2rem, 4vw, 3rem);
		line-height: 1;
		color: #10233e;
	}

	.hero-text p {
		margin: 12px 0 0;
		font-size: 15px;
		line-height: 1.7;
		color: #41556f;
	}

	.hero-actions {
		display: flex;
		align-items: flex-start;
		justify-content: flex-end;
		gap: 10px;
		flex-wrap: wrap;
	}

	.primary-btn,
	.ghost-btn,
	.mini-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		padding: 11px 18px;
		font-size: 14px;
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
		transition:
			transform 0.14s,
			box-shadow 0.14s,
			background 0.14s;
	}

	.primary-btn {
		border: none;
		background: linear-gradient(135deg, #1565c0, #1e88e5);
		color: white;
		box-shadow: 0 14px 24px rgb(21 101 192 / 0.24);
	}

	.ghost-btn,
	.mini-btn {
		border: 1px solid rgb(21 101 192 / 0.16);
		background: rgb(255 255 255 / 0.75);
		color: #0f2c53;
	}

	.mini-btn {
		padding: 9px 14px;
		font-size: 13px;
	}

	.mini-btn-accent {
		background: rgb(227 242 253);
	}

	.primary-btn:hover,
	.ghost-btn:hover,
	.mini-btn:hover,
	.board-card-main:hover {
		transform: translateY(-1px);
	}

	.boards-section {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.section-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 12px;
	}

	.section-heading h2 {
		margin: 0;
		font-size: 1.35rem;
		color: #10233e;
	}

	.section-heading span {
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #5d7290;
	}

	.board-grid,
	.skeleton-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 18px;
	}

	.board-card {
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.board-card-main {
		display: flex;
		flex-direction: column;
		gap: 14px;
		border: none;
		background: transparent;
		padding: 0;
		text-align: right;
		cursor: pointer;
	}

	.board-copy h3 {
		margin: 0;
		font-size: 1.05rem;
		color: #10233e;
	}

	.board-copy p {
		margin: 6px 0 0;
		font-size: 14px;
		color: #58708f;
	}

	.board-title-row,
	.board-card-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		flex-wrap: wrap;
	}

	.home-pill {
		display: inline-flex;
		align-items: center;
		padding: 5px 10px;
		border-radius: 999px;
		background: rgb(21 101 192 / 0.1);
		color: #0d47a1;
		font-size: 12px;
		font-weight: 700;
	}

	.dashboard-skeleton {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.skeleton-banner,
	.skeleton-card {
		background: linear-gradient(
			90deg,
			rgb(255 255 255 / 0.85),
			rgb(243 247 253),
			rgb(255 255 255 / 0.85)
		);
		background-size: 200% 100%;
		animation: shimmer 1.3s linear infinite;
	}

	.skeleton-banner {
		height: 168px;
		border-radius: 28px;
	}

	.skeleton-card {
		aspect-ratio: 0.92;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}

		100% {
			background-position: -200% 0;
		}
	}

	@media (max-width: 720px) {
		.set-dashboard {
			padding: 16px;
		}

		.hero-card {
			flex-direction: column;
			padding: 22px;
		}

		.hero-actions {
			justify-content: stretch;
		}

		.primary-btn,
		.ghost-btn {
			flex: 1 1 160px;
		}
	}
</style>

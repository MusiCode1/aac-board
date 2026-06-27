<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import BoardThumbnail from '$lib/components/BoardThumbnail.svelte';
	import { boardStore } from '$lib/stores/board.svelte';
	import { setsStore } from '$lib/stores/sets.svelte';

	const boards = boardStore();
	const sets = setsStore();

	type ModalMode = 'new' | 'edit';

	let modalOpen = $state(false);
	let modalMode = $state<ModalMode>('new');
	let editingSetId = $state('');
	let formName = $state('');
	let formHomeBoardId = $state('');
	let pendingDeleteSetId = $state('');

	onMount(async () => {
		if (!sets.initialized) await sets.init();
		if (!boards.initialized) await boards.init();
	});

	const setStats = $derived(
		sets.allSets
			.map((set) => {
				const setBoards = Object.values(boards.allBoards).filter((board) => board.setId === set.id);
				const homeBoard = setBoards.find((board) => board.id === set.homeBoardId);
				return {
					set,
					boards: setBoards,
					homeBoard
				};
			})
			.sort((a, b) => {
				if (a.set.id === sets.defaultSetId) return -1;
				if (b.set.id === sets.defaultSetId) return 1;
				return a.set.name.localeCompare(b.set.name, 'he');
			})
	);

	const editableBoards = $derived(
		Object.values(boards.allBoards)
			.filter((board) => board.setId === editingSetId)
			.sort((a, b) => a.name.localeCompare(b.name, 'he'))
	);

	function openNewModal() {
		modalMode = 'new';
		editingSetId = '';
		formName = '';
		formHomeBoardId = '';
		modalOpen = true;
	}

	function openEditModal(setId: string) {
		const existing = sets.allSets.find((set) => set.id === setId);
		if (!existing) return;
		modalMode = 'edit';
		editingSetId = setId;
		formName = existing.name;
		formHomeBoardId = existing.homeBoardId;
		modalOpen = true;
	}

	async function submitModal() {
		const name = formName.trim();
		if (!name) return;

		if (modalMode === 'new') {
			await sets.createSet(name);
		} else if (editingSetId) {
			await sets.updateSet(editingSetId, {
				name,
				homeBoardId: formHomeBoardId || undefined
			});
		}

		modalOpen = false;
	}

	async function handleDelete() {
		if (!pendingDeleteSetId) return;
		await sets.deleteSet(pendingDeleteSetId);
		pendingDeleteSetId = '';
	}
</script>

<svelte:head>
	<title>ניהול אוספים — לוח תקשורת AAC</title>
</svelte:head>

<div class="sets-page">
	<header class="sets-hero">
		<div>
			<a class="hero-link" href="/settings">חזרה להגדרות</a>
			<h1>אוספי לוחות</h1>
			<p>
				כאן מנהלים סטים שלמים: כל אוסף מחזיק לוח בית, קבוצת לוחות משלו, וברירת מחדל משותפת לפתיחת
				האפליקציה.
			</p>
		</div>
		<div class="hero-actions">
			<a class="ghost-btn" href="/">פתח את האפליקציה</a>
			<button class="primary-btn" onclick={openNewModal}>אוסף חדש</button>
		</div>
	</header>

	{#if !sets.initialized || !boards.initialized}
		<div class="sets-grid" aria-busy="true" aria-label="טוען אוספים">
			{#each Array(4) as _, index (index)}
				<div class="set-card set-card-skeleton"></div>
			{/each}
		</div>
	{:else}
		<div class="sets-grid">
			{#each setStats as item (item.set.id)}
				{@const isDefault = item.set.id === sets.defaultSetId}
				<article class="set-card" data-set-id={item.set.id}>
					<button class="set-card-main" onclick={() => goto(`/s/${item.set.id}`)}>
						<BoardThumbnail tiles={item.homeBoard?.tiles ?? []} emptyLabel="אין עדיין לוח בית" />
						<div class="set-copy">
							<div class="set-title-row">
								<h2>{item.set.name}</h2>
								{#if isDefault}<span class="default-pill">ברירת מחדל</span>{/if}
							</div>
							<p>{item.boards.length} לוחות · בית: {item.homeBoard?.name ?? 'לא הוגדר'}</p>
						</div>
					</button>
					<div class="set-card-actions">
						<a class="mini-btn" href={`/s/${item.set.id}`}>פתח</a>
						<button class="mini-btn" onclick={() => openEditModal(item.set.id)}>ערוך</button>
						<button class="mini-btn" onclick={() => sets.duplicateSet(item.set.id)}>שכפל</button>
						<button
							class="mini-btn"
							onclick={() => sets.setDefault(item.set.id)}
							disabled={isDefault}
						>
							הפוך לברירת מחדל
						</button>
						<button
							class="mini-btn mini-btn-danger"
							onclick={() => (pendingDeleteSetId = item.set.id)}
							disabled={setStats.length <= 1}
						>
							מחק
						</button>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>

{#if modalOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="overlay"
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && (modalOpen = false)}
	>
		<div
			class="modal-card"
			role="dialog"
			aria-label={modalMode === 'new' ? 'אוסף חדש' : 'עריכת אוסף'}
		>
			<header class="modal-header">
				<h2>{modalMode === 'new' ? 'אוסף חדש' : 'עריכת אוסף'}</h2>
				<button class="close-btn" onclick={() => (modalOpen = false)} aria-label="סגור">×</button>
			</header>
			<div class="modal-body">
				<label class="field">
					<span class="field-label">שם האוסף</span>
					<input class="field-input" bind:value={formName} placeholder="לדוגמה: בית הספר" />
				</label>

				{#if modalMode === 'edit' && editableBoards.length > 0}
					<label class="field">
						<span class="field-label">לוח בית</span>
						<select class="field-input" bind:value={formHomeBoardId}>
							{#each editableBoards as board (board.id)}
								<option value={board.id}>{board.name}</option>
							{/each}
						</select>
					</label>
				{/if}
			</div>
			<footer class="modal-actions">
				<button class="ghost-btn" onclick={() => (modalOpen = false)}>ביטול</button>
				<button class="primary-btn" onclick={submitModal} disabled={!formName.trim()}>שמור</button>
			</footer>
		</div>
	</div>
{/if}

{#if pendingDeleteSetId}
	{@const targetSet = setStats.find((item) => item.set.id === pendingDeleteSetId)?.set}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="overlay"
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && (pendingDeleteSetId = '')}
	>
		<div class="confirm-card" role="alertdialog" aria-label="מחיקת אוסף">
			<h2>למחוק את האוסף &quot;{targetSet?.name}&quot;?</h2>
			<p>כל הלוחות של האוסף יימחקו יחד איתו. הפעולה לא ניתנת לביטול.</p>
			<div class="modal-actions">
				<button class="ghost-btn" onclick={() => (pendingDeleteSetId = '')}>ביטול</button>
				<button class="danger-btn" onclick={handleDelete}>מחק אוסף</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.sets-page {
		min-height: 100dvh;
		padding: 24px;
		background:
			radial-gradient(circle at top left, rgb(255 209 102 / 0.18), transparent 28%),
			radial-gradient(circle at top right, rgb(144 202 249 / 0.2), transparent 24%),
			linear-gradient(180deg, #fffdf8, #edf4fb);
	}

	.sets-hero,
	.set-card,
	.modal-card,
	.confirm-card,
	.set-card-skeleton {
		border-radius: 28px;
		background: rgb(255 255 255 / 0.82);
		backdrop-filter: blur(18px);
		border: 1px solid rgb(255 255 255 / 0.78);
		box-shadow: 0 28px 60px rgb(15 23 42 / 0.12);
	}

	.sets-hero {
		display: flex;
		justify-content: space-between;
		gap: 24px;
		padding: 28px;
		margin-bottom: 24px;
	}

	.hero-link {
		display: inline-flex;
		margin-bottom: 10px;
		font-size: 13px;
		font-weight: 700;
		color: #0d47a1;
		text-decoration: none;
	}

	.sets-hero h1,
	.set-card h2,
	.confirm-card h2,
	.modal-header h2 {
		margin: 0;
		color: #10233e;
	}

	.sets-hero h1 {
		font-size: clamp(2rem, 4vw, 3rem);
		line-height: 1;
	}

	.sets-hero p,
	.set-copy p,
	.confirm-card p {
		margin: 12px 0 0;
		font-size: 15px;
		line-height: 1.7;
		color: #41556f;
	}

	.hero-actions,
	.set-card-actions,
	.modal-actions,
	.set-title-row {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.hero-actions,
	.modal-actions {
		justify-content: flex-end;
	}

	.primary-btn,
	.ghost-btn,
	.mini-btn,
	.danger-btn {
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
			background 0.14s,
			opacity 0.14s;
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
		background: rgb(255 255 255 / 0.76);
		color: #0f2c53;
	}

	.mini-btn {
		padding: 9px 14px;
		font-size: 13px;
	}

	.mini-btn-danger,
	.danger-btn {
		border: none;
		background: #c62828;
		color: white;
	}

	.primary-btn:hover,
	.ghost-btn:hover,
	.mini-btn:hover,
	.danger-btn:hover,
	.set-card-main:hover {
		transform: translateY(-1px);
	}

	.mini-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.sets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 18px;
	}

	.set-card {
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.set-card-main {
		border: none;
		padding: 0;
		background: transparent;
		text-align: right;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.set-copy h2 {
		font-size: 1.1rem;
	}

	.default-pill {
		display: inline-flex;
		align-items: center;
		padding: 5px 10px;
		border-radius: 999px;
		background: rgb(255 193 7 / 0.18);
		color: #7a5a00;
		font-size: 12px;
		font-weight: 700;
	}

	.overlay {
		position: fixed;
		inset: 0;
		padding: 16px;
		background: rgb(15 23 42 / 0.38);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 120;
	}

	.modal-card,
	.confirm-card {
		width: min(100%, 460px);
		padding: 22px;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 18px;
	}

	.close-btn {
		border: none;
		background: transparent;
		color: #4f6178;
		font-size: 28px;
		line-height: 1;
		cursor: pointer;
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin-bottom: 18px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field-label {
		font-size: 13px;
		font-weight: 700;
		color: #536b8b;
	}

	.field-input {
		padding: 11px 14px;
		border-radius: 14px;
		border: 1px solid rgb(21 101 192 / 0.16);
		background: rgb(255 255 255 / 0.9);
		font-size: 15px;
		color: #10233e;
	}

	.set-card-skeleton {
		aspect-ratio: 0.95;
		background: linear-gradient(
			90deg,
			rgb(255 255 255 / 0.85),
			rgb(243 247 253),
			rgb(255 255 255 / 0.85)
		);
		background-size: 200% 100%;
		animation: shimmer 1.3s linear infinite;
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
		.sets-page {
			padding: 16px;
		}

		.sets-hero {
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

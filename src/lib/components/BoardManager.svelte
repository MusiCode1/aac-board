<script lang="ts">
	import { HOME_BOARD_ID } from '$lib/data/boards';
	import { boardStore, generateBoardId } from '$lib/stores/board.svelte';
	import type { Board } from '$lib/types/board';

	interface Props {
		onclose: () => void;
		initialView?: 'list' | 'new';
		onBoardCreated?: (id: string) => void;
		/** Called when user clicks a board row to navigate to it */
		onNavigateToBoard?: (boardId: string) => void;
		/** Set ID — used when creating new boards so they belong to the right set */
		setId?: string;
	}

	let { onclose, initialView = 'list', onBoardCreated, onNavigateToBoard, setId = '' }: Props =
		$props();

	const store = boardStore();

	type View = 'list' | 'new' | 'edit';
	let view = $state<View>(initialView);
	let editingBoardId = $state<string | null>(null);

	// Form fields
	let formName = $state('');
	let formRows = $state(3);
	let formCols = $state(4);

	// Delete confirmation
	let pendingDelete = $state<{
		boardId: string;
		boardName: string;
		dependents: { boardId: string; boardName: string; tileIds: string[] }[];
	} | null>(null);

	const boards = $derived(Object.values(store.allBoards));
	const previewId = $derived(
		view === 'new' && formName.trim() ? generateBoardId(formName, store.allBoards) : ''
	);

	function openNew() {
		view = 'new';
		formName = '';
		formRows = 3;
		formCols = 4;
	}

	function openEdit(board: Board) {
		view = 'edit';
		editingBoardId = board.id;
		formName = board.name;
		formRows = board.grid.rows;
		formCols = board.grid.columns;
	}

	function backToList() {
		view = 'list';
		editingBoardId = null;
	}

	function saveNew() {
		const name = formName.trim();
		if (!name) return;
		const id = store.createBoardFromName(name, formRows, formCols, setId);
		onBoardCreated?.(id);
		backToList();
	}

	function saveEdit() {
		if (!editingBoardId) return;
		const name = formName.trim();
		if (!name) return;
		store.updateBoard(editingBoardId, {
			name,
			grid: { rows: formRows, columns: formCols }
		});
		backToList();
	}

	function duplicateRow(boardId: string) {
		store.duplicateBoard(boardId);
	}

	function navigateToBoard(boardId: string) {
		if (onNavigateToBoard) {
			onNavigateToBoard(boardId);
		} else {
			// Legacy fallback for non-routed usage
			if (store.currentBoard.id !== boardId) {
				store.goHome();
				if (boardId !== HOME_BOARD_ID) {
					store.navigateTo(boardId);
				}
			}
		}
		onclose();
	}

	function confirmDelete(board: Board) {
		if (board.id === HOME_BOARD_ID) return;
		const dependents = store.findBoardDependents(board.id);
		pendingDelete = {
			boardId: board.id,
			boardName: board.name,
			dependents
		};
	}

	async function executeDelete() {
		if (!pendingDelete) return;
		const { boardId, dependents } = pendingDelete;
		if (dependents.length > 0) {
			await store.stripBoardReferences(boardId);
		}
		await store.deleteBoard(boardId);
		pendingDelete = null;
	}

	function cancelDelete() {
		pendingDelete = null;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (pendingDelete) {
				pendingDelete = null;
			} else if (view !== 'list') {
				backToList();
			} else {
				onclose();
			}
		}
	}

	function tileCount(board: Board): number {
		return board.tiles.length;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={handleBackdropClick}>
	<div class="board-manager" role="dialog" aria-label="ניהול לוחות">
		<header class="bm-header">
			<h2>
				{#if view === 'list'}ניהול לוחות{:else if view === 'new'}לוח חדש{:else}עריכת לוח{/if}
			</h2>
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

		{#if view === 'list'}
			<div class="bm-toolbar">
				<button class="btn btn-primary" onclick={openNew}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
					</svg>
					לוח חדש
				</button>
			</div>
			<ul class="board-manager-list">
				{#each boards as board (board.id)}
					{@const isHome = board.id === HOME_BOARD_ID}
					<li class="bm-row" data-board-id={board.id}>
						<button
							class="bm-row-main"
							onclick={() => navigateToBoard(board.id)}
							aria-label="מעבר ללוח {board.name}"
						>
							<div class="bm-row-info">
								<span class="bm-row-name">
									{board.name}
									{#if isHome}<span class="bm-badge">בית</span>{/if}
								</span>
								<span class="bm-row-meta">
									{board.grid.rows}×{board.grid.columns} · {tileCount(board)} אריחים
								</span>
							</div>
						</button>
						<div class="bm-row-actions">
							<button
								class="icon-btn"
								onclick={() => openEdit(board)}
								aria-label="ערוך"
								title="ערוך שם וגריד"
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
									/>
								</svg>
							</button>
							<button
								class="icon-btn"
								onclick={() => duplicateRow(board.id)}
								aria-label="שכפל"
								title="שכפל"
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
									/>
								</svg>
							</button>
							<button
								class="icon-btn icon-btn-danger"
								onclick={() => confirmDelete(board)}
								disabled={isHome}
								aria-label="מחק"
								title={isHome ? 'לא ניתן למחוק את לוח הבית' : 'מחק'}
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
									/>
								</svg>
							</button>
						</div>
					</li>
				{/each}
			</ul>
		{:else if view === 'new' || view === 'edit'}
			<div class="bm-form">
				<label class="field">
					<span class="field-label">שם הלוח</span>
					<input
						type="text"
						class="field-input bm-name-input"
						bind:value={formName}
						placeholder="לדוגמה: רגשות"
					/>
				</label>
				{#if view === 'new' && previewId}
					<div class="bm-preview-id">
						מזהה שייווצר: <code>{previewId}</code>
					</div>
				{/if}
				<div class="bm-grid-fields">
					<label class="field">
						<span class="field-label">שורות</span>
						<input
							type="number"
							class="field-input bm-rows-input"
							min="1"
							max="10"
							bind:value={formRows}
						/>
					</label>
					<label class="field">
						<span class="field-label">עמודות</span>
						<input
							type="number"
							class="field-input bm-cols-input"
							min="1"
							max="12"
							bind:value={formCols}
						/>
					</label>
				</div>
				<div class="bm-form-actions">
					<button class="btn btn-cancel" onclick={backToList}>ביטול</button>
					<button
						class="btn btn-primary"
						onclick={view === 'new' ? saveNew : saveEdit}
						disabled={!formName.trim()}
					>
						שמור
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if pendingDelete}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="overlay overlay-confirm"
		onclick={(e) => {
			if (e.target === e.currentTarget) cancelDelete();
		}}
	>
		<div class="bm-confirm" role="alertdialog" aria-label="אישור מחיקה">
			<h3>מחיקת לוח "{pendingDelete.boardName}"</h3>
			{#if pendingDelete.dependents.length > 0}
				<p>
					קיימות <strong>{pendingDelete.dependents.length}</strong> תיקיות תלויות בלוח זה:
				</p>
				<ul class="bm-deps">
					{#each pendingDelete.dependents as dep (dep.boardId)}
						<li>{dep.boardName} ({dep.tileIds.length} אריחים)</li>
					{/each}
				</ul>
				<p>מחיקת הלוח תהפוך את האריחים התלויים לכפתורים רגילים.</p>
			{:else}
				<p>האם למחוק את הלוח? פעולה זו אינה ניתנת לביטול.</p>
			{/if}
			<div class="bm-confirm-actions">
				<button class="btn btn-cancel" onclick={cancelDelete}>ביטול</button>
				<button class="btn btn-danger" onclick={executeDelete}>
					{pendingDelete.dependents.length > 0 ? 'מחק ונקה הפניות' : 'מחק'}
				</button>
			</div>
		</div>
	</div>
{/if}

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

	.overlay-confirm {
		z-index: 110;
	}

	.board-manager {
		background: var(--bg-card, white);
		border-radius: 16px;
		width: 100%;
		max-width: 480px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 12px 40px rgb(0 0 0 / 0.25);
		display: flex;
		flex-direction: column;
		direction: rtl;
	}

	.bm-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid var(--border-color, #e0e0e0);
	}

	.bm-header h2 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		color: var(--text-primary, #212121);
	}

	.close-btn {
		width: 36px;
		height: 36px;
		border: none;
		background: transparent;
		color: var(--text-secondary, #616161);
		cursor: pointer;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: var(--bg-card-alt, #f5f5f5);
	}

	.bm-toolbar {
		padding: 12px 20px;
		border-bottom: 1px solid var(--border-color, #e0e0e0);
	}

	.board-manager-list {
		list-style: none;
		margin: 0;
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.bm-row {
		display: flex;
		align-items: stretch;
		gap: 4px;
		padding: 4px;
		border-radius: 10px;
		background: var(--bg-card-alt, #fafafa);
		border: 1px solid var(--border-color, #e8e8e8);
	}

	.bm-row-main {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		border: none;
		background: transparent;
		color: inherit;
		text-align: right;
		cursor: pointer;
		border-radius: 8px;
		transition: background 0.12s;
	}

	.bm-row-main:hover {
		background: rgb(25 118 210 / 0.06);
	}

	.bm-row-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.bm-row-name {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-primary, #212121);
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.bm-badge {
		display: inline-block;
		font-size: 11px;
		padding: 1px 6px;
		background: #1976d2;
		color: white;
		border-radius: 10px;
		font-weight: 500;
	}

	.bm-row-meta {
		font-size: 12px;
		color: var(--text-secondary, #757575);
	}

	.bm-row-actions {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.icon-btn {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: none;
		background: transparent;
		color: var(--text-secondary, #616161);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background 0.12s,
			color 0.12s;
	}

	.icon-btn:hover:not(:disabled) {
		background: rgb(0 0 0 / 0.06);
		color: var(--text-primary, #212121);
	}

	.icon-btn-danger:hover:not(:disabled) {
		background: #ffebee;
		color: #c62828;
	}

	.icon-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.bm-form {
		padding: 16px 20px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.bm-grid-fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
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

	.bm-preview-id {
		font-size: 12px;
		color: var(--text-secondary, #757575);
	}

	.bm-preview-id code {
		background: var(--bg-card-alt, #f5f5f5);
		padding: 1px 6px;
		border-radius: 4px;
		font-family: ui-monospace, monospace;
	}

	.bm-form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 4px;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.15s,
			transform 0.1s,
			opacity 0.15s;
	}

	.btn:active:not(:disabled) {
		transform: scale(0.97);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #1976d2;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #1565c0;
	}

	.btn-cancel {
		background: var(--bg-card-alt, #f5f5f5);
		color: var(--text-primary, #212121);
	}

	.btn-cancel:hover {
		background: var(--border-color, #e0e0e0);
	}

	.btn-danger {
		background: #c62828;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background: #b71c1c;
	}

	.bm-confirm {
		background: var(--bg-card, white);
		border-radius: 16px;
		width: 100%;
		max-width: 420px;
		padding: 20px 22px;
		box-shadow: 0 12px 40px rgb(0 0 0 / 0.3);
		direction: rtl;
	}

	.bm-confirm h3 {
		margin: 0 0 10px 0;
		font-size: 17px;
		font-weight: 700;
		color: var(--text-primary, #212121);
	}

	.bm-confirm p {
		margin: 6px 0;
		font-size: 14px;
		color: var(--text-primary, #424242);
		line-height: 1.5;
	}

	.bm-deps {
		margin: 6px 0;
		padding-right: 20px;
		font-size: 13px;
		color: var(--text-secondary, #616161);
	}

	.bm-deps li {
		margin: 2px 0;
	}

	.bm-confirm-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 14px;
	}
</style>

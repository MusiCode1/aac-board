<script lang="ts">
	interface Props {
		rows: number;
		columns: number;
		hiddenCount: number;
		showOverflow: boolean;
		onresizegrid: (rows: number, columns: number) => void;
		onexport: () => void;
		onimport: () => void;
		onaddtile: () => void;
		onreset: () => void;
		ondeleteoverflow: () => void;
		ontoggleoverflow: () => void;
	}

	let {
		rows,
		columns,
		hiddenCount,
		showOverflow,
		onresizegrid,
		onexport,
		onimport,
		onaddtile,
		onreset,
		ondeleteoverflow,
		ontoggleoverflow
	}: Props = $props();

	function changeRows(delta: number) {
		const next = Math.max(1, Math.min(10, rows + delta));
		if (next !== rows) onresizegrid(next, columns);
	}

	function changeCols(delta: number) {
		const next = Math.max(1, Math.min(12, columns + delta));
		if (next !== columns) onresizegrid(rows, next);
	}
</script>

<div class="edit-toolbar" role="toolbar" aria-label="כלי עריכה">
	<div class="toolbar-group">
		<span class="group-label">רשת</span>
		<div class="stepper">
			<button class="stepper-btn" onclick={() => changeRows(-1)} aria-label="פחות שורות">−</button>
			<span class="stepper-value">{rows}</span>
			<button class="stepper-btn" onclick={() => changeRows(1)} aria-label="יותר שורות">+</button>
			<span class="stepper-label">×</span>
			<button class="stepper-btn" onclick={() => changeCols(-1)} aria-label="פחות עמודות">−</button>
			<span class="stepper-value">{columns}</span>
			<button class="stepper-btn" onclick={() => changeCols(1)} aria-label="יותר עמודות">+</button>
		</div>
	</div>

	<div class="toolbar-sep"></div>

	<button class="toolbar-btn" onclick={onaddtile} title="הוסף אריח">
		<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
			<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
		</svg>
		הוסף
	</button>

	<div class="toolbar-sep"></div>

	<button class="toolbar-btn" onclick={onexport} title="ייצוא לוחות">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
			<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
		</svg>
		ייצוא
	</button>
	<button class="toolbar-btn" onclick={onimport} title="ייבוא לוחות">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
			<path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
		</svg>
		ייבוא
	</button>

	{#if hiddenCount > 0}
		<div class="toolbar-sep"></div>
		<div class="overflow-warning">
			<button
				class="overflow-toggle"
				class:active={showOverflow}
				onclick={ontoggleoverflow}
				title="הצג/הסתר אריחים מוסתרים"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
					{#if showOverflow}
						<path
							d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
						/>
					{:else}
						<path
							d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
						/>
					{/if}
				</svg>
				{hiddenCount} מוסתרים
			</button>
			<button class="toolbar-btn danger" onclick={ondeleteoverflow} title="מחק אריחים שמעבר לרשת">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
					<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
				</svg>
				מחק
			</button>
		</div>
	{/if}

	<div class="toolbar-sep"></div>

	<button class="toolbar-btn danger" onclick={onreset} title="איפוס לברירת מחדל">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
			<path
				d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
			/>
		</svg>
		איפוס
	</button>
</div>

<style>
	.edit-toolbar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		background: linear-gradient(135deg, #fff3e0, #ffe0b2);
		border-bottom: 1px solid #ffcc80;
		flex-wrap: wrap;
		direction: rtl;
	}

	.toolbar-group {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.group-label {
		font-size: 12px;
		font-weight: 600;
		color: #e65100;
	}

	.stepper {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.stepper-btn {
		width: 26px;
		height: 26px;
		border-radius: 6px;
		border: 1px solid #ffcc80;
		background: white;
		color: #e65100;
		font-size: 16px;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s;
	}

	.stepper-btn:hover {
		background: #fff3e0;
	}

	.stepper-value {
		min-width: 24px;
		text-align: center;
		font-size: 14px;
		font-weight: 700;
		color: #bf360c;
	}

	.stepper-label {
		font-size: 14px;
		color: #e65100;
		margin: 0 2px;
	}

	.toolbar-sep {
		width: 1px;
		height: 24px;
		background: #ffcc80;
	}

	.toolbar-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 10px;
		border-radius: 6px;
		border: 1px solid #ffcc80;
		background: white;
		color: #e65100;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.toolbar-btn:hover {
		background: #fff3e0;
	}

	.toolbar-btn.danger {
		color: #c62828;
		border-color: #ef9a9a;
	}

	.toolbar-btn.danger:hover {
		background: #ffebee;
	}

	.overflow-warning {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 2px 8px;
		background: #fff3e0;
		border: 1px solid #ff9800;
		border-radius: 6px;
	}

	.overflow-toggle {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 10px;
		border-radius: 6px;
		border: 1px solid #ff9800;
		background: white;
		color: #e65100;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
		white-space: nowrap;
	}

	.overflow-toggle:hover {
		background: #fff3e0;
	}

	.overflow-toggle.active {
		background: #ff9800;
		color: white;
	}
</style>

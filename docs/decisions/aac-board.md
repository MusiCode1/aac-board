# החלטות ארכיטקטורה — aac-board

## 2026-06-27 — merge: cache-proxy + sets (שלב 6 Phase C) → dev

### רציונל
מיזוג `feat/cache-proxy-client-phase-1` (26 קומיטים) ל-`dev` עם `--no-ff`.
שני נושאים: (1) תשתית **cache-proxy ל-TTS** — ניתוב elevenlabs/gemini דרך Cloudflare
Worker (`aac-proxy.aybritman.workers.dev`), cache אודיו ב-IndexedDB, ומיגרציה
שמסירה מפתחות API ישנים; (2) פיצ'ר **אוספים/לוחות (sets)** — מסלולי `/sets` ו-`/s/[setId]`,
ניהול אוספים (יצירה/שכפול/מחיקה/"הפוך לבית"), NavBar עם breadcrumb, BoardThumbnail.

נבחר `--no-ff` (ולא squash) כי `next-level` מסתעף מהבסיס המשותף — squash היה שובר
ancestry וגורם לכפילויות בעת מיזוג עתידי של next-level.

### אימות לפני merge
- **build-gate**: `bun run check` (svelte-check) — 0 errors, 1 warning ידוע (`TileEditor.svelte:214` a11y). ✅
- **סקירת קוד** (2026-05-06, `docs/plans/sets-feature-review-2026-05-06.md`): 4 באגים חוסמים
  תוקנו ואומתו (structuredClone על $state Proxy, sync של boardStore במיגרציה, 2 race
  conditions על persist). Vitest 46/46, E2E sets 10/10 single-worker.
- **preview ידני** דרך tuns.sh — אושר ע"י המשתמשת.

### באגים נדחים (known bugs — לטיפול ב-slice הבא)
אושרו לדחייה מפורשת ע"י המשתמשת בעת ה-merge. לא חוסמים, אך **לא להישכח**:
1. **Escape לא סוגר מודאלים** ב-`/sets` (new/edit + אישור מחיקה) — UX.
2. **`goHome()`** (`board.svelte.ts:166`, `BoardManager.svelte:111`) נסמך על `HOME_BOARD_ID`
   סטטי במקום ה-home של האוסף הנוכחי.
3. **`deleteSet`** (`sets.svelte.ts:106`) — `saveAllBoards` מיותר + reset מיותר של `currentBoard`.
4. **אין focus trap** באף מודאל בפרויקט — a11y, אפשר Tab החוצה.

בנוסף: flake ב-E2E sets במצב multi-worker (עובר ב-single-worker); קובץ זבל
`proxy/..dev.vars.swp` (vim swap) נכנס בטעות להיסטוריה — לנקות.

### רעיונות שנדחו
אין — הגישה אושרה כפי שתוכננה.

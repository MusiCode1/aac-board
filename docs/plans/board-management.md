# ניהול לוחות מלא — סקירת מצב ותוכנית מימוש

## הקשר

משתמשי קצה (הורים/מטפלים) צריכים דרך ליצור, לשנות, לשכפל ולמחוק לוחות מתוך הממשק. כרגע קיימת תשתית מלאה ב-store, אבל ללא UI — פער שמונע שימוש אמיתי בפיצ'ר.

---

## סקירת המצב הנוכחי

### מה קיים

**ב-store** ([src/lib/stores/board.svelte.ts](../../src/lib/stores/board.svelte.ts)) יש API מלא:

- [board.svelte.ts:201-204](../../src/lib/stores/board.svelte.ts#L201-L204) — `createBoard(board)` — שומר לוח ל-IndexedDB
- [board.svelte.ts:207-214](../../src/lib/stores/board.svelte.ts#L207-L214) — `deleteBoard(boardId)` — לא מוחק את לוח הבית
- [board.svelte.ts:190-198](../../src/lib/stores/board.svelte.ts#L190-L198) — `updateBoard(id, updates)` — שם + גריד
- [board.svelte.ts:225-230](../../src/lib/stores/board.svelte.ts#L225-L230) — `importBoards()` — טעינת מילון שלם

**ב-storage** ([src/lib/services/storage.ts](../../src/lib/services/storage.ts)):

- `saveBoard` / `loadBoard` / `loadAllBoards` / `saveAllBoards` / `deleteBoard` / `exportBoardsJSON`
- אינדקס נפרד `boards-index` (string[]) ב-IndexedDB כמקור האמת לרשימת הלוחות.

### מה חסר ב-UI

ב-[EditToolbar.svelte:41-120](../../src/lib/components/EditToolbar.svelte#L41-L120) יש כפתורים ל: שינוי רשת, הוספת אריח, ייצוא/ייבוא, איפוס, מחיקת אריחי עודף — **אין כפתור "לוח חדש" / "ניהול לוחות"**.

ב-[TileEditor.svelte:241-246](../../src/lib/components/TileEditor.svelte#L241-L246), כשבוחרים סוג "תיקייה", יש שדה טקסט חופשי `מזהה לוח יעד`:

- input טקסט שבו המשתמש מקליד ידנית מזהה של לוח קיים.
- אין dropdown של הלוחות הקיימים.
- אין כפתור "צור לוח חדש כאן".
- אם המזהה לא קיים, [board.svelte.ts:103-109](../../src/lib/stores/board.svelte.ts#L103-L109) (`navigateTo`) פשוט יוצא בשקט בלי שגיאה.

### הדרכים היחידות היום להוסיף לוח

1. **ייבוא JSON** דרך כפתור "ייבוא" בסרגל העריכה (דורס הכל).
2. **עריכה ידנית** של ה-IndexedDB מ-DevTools.
3. **קריאה פרוגרמטית** ל-`store.createBoard()` מה-console.

---

## החלטות עיצוב לתוכנית

- **נקודת כניסה**: כפתור "לוחות" ב-[EditToolbar.svelte](../../src/lib/components/EditToolbar.svelte) (גלוי רק במצב עריכה). NavBar נשאר רזה.
- **מבנה**: מודאל יחיד `BoardManager.svelte` עם `view` פנימי (`'list' | 'new' | 'edit'`). פחות קבצים, פחות event plumbing, אותו overlay.
- **"הפוך לבית"**: **מחוץ לסקופ**. `HOME_BOARD_ID` הוא const קשיח ב-[src/lib/data/boards.ts](../../src/lib/data/boards.ts) — שינוי דורש refactoring נפרד.
- **ID generation**: slugify השם (שומר Unicode letters/digits, מחליף רווחים/פיסוק ב-`-`), ואז dedup מול `allBoards` עם סיומת `-2`, `-3`… fallback ל-`board-<timestamp>` אם ה-slug ריק.
- **שכפול**: `structuredClone` לעותק עמוק, tile IDs חדשים, `loadBoard` refs נשארים כמו במקור (לא מעתיקים רקורסיבית את כל העץ).
- **Rename ≠ change ID**: שינוי שם לא משנה את ה-ID, כדי לא לשבור folder refs קיימים.

---

## שינויים בקוד

### 1. [src/lib/stores/board.svelte.ts](../../src/lib/stores/board.svelte.ts) — הוספת מתודות

- `generateBoardId(name: string): string` — exported helper. Slug + dedup מול `allBoards`.
- `duplicateBoard(sourceId: string, newName?: string): string | null` — deep clone, ID חדש, החזרת ה-ID. tile IDs חדשים, `loadBoard` נשמר.
- `findBoardDependents(boardId: string): { boardId: string; boardName: string; tileIds: string[] }[]` — סריקה read-only.
- `stripBoardReferences(boardId: string): Promise<void>` — מחיקת `loadBoard` והפיכת `type` ל-`'button'` בכל ה-tiles התלויים, persist לכל לוח שנגע.
- `navigateTo`: הוספת `console.warn` ב-silent-return כשהמזהה לא קיים (לא שובר כלום, מסייע לדיבוג).

### 2. [src/lib/components/BoardManager.svelte](../../src/lib/components/BoardManager.svelte) — קובץ חדש

Props: `{ onclose: () => void; initialView?: 'list' | 'new'; onBoardCreated?: (id: string) => void }`.

State פנימי: `view`, `editingBoardId`, `pendingDelete`.

**List view**: רשימת לוחות. לכל שורה — שם, `rows×cols`, מספר tiles, badge "בית" ל-`HOME_BOARD_ID`. פעולות לשורה: עבור ללוח, ערוך (→ edit view), שכפל (inline), מחק (→ confirm sub-step). Top bar: כפתור "לוח חדש" → new view.

**New view**: שם (חובה), rows (1–10), cols (1–12). תצוגת ה-ID שייווצר כעזר.

**Edit view**: אותם שדות כמו new, אבל `updateBoard(id, ...)`. ללא שינוי ID.

**Delete confirm** (חובה — ראה [architecture.md §10.5.1](architecture.md#105-שימוש-בסיסי--דרישות-שחייבות-להיכלל)): אם יש תלויות — radio בין "בטל" ל"מחק ונקה הפניות". אם אין — confirm פשוט. לוח בית — כפתור delete disabled עם tooltip. **ללא אישור** — שכפול, עריכת שם/גריד.

**הבחנה חשובה**: מחיקת **אריח** ב-TileEditor נשארת ללא אישור (מסרבל מדי ביום-יום). בטחון של המשתמש מגיע מ-Undo ולא מ-confirm.

שכפול ה-overlay CSS מ-[TileEditor.svelte](../../src/lib/components/TileEditor.svelte) (אותו fixed inset, z-100, RTL, 420px max-width, Escape + backdrop close).

### 3. [src/lib/components/EditToolbar.svelte](../../src/lib/components/EditToolbar.svelte) — הוספת כפתור

- Prop חדש: `onmanageBoards: () => void`.
- כפתור חדש ליד "הוסף" עם אייקון תיקייה ותווית "לוחות".

### 4. [src/lib/components/TileEditor.svelte](../../src/lib/components/TileEditor.svelte) — תיקון folder flow

- Props חדשים: `availableBoards: { id: string; name: string }[]`, `onRequestCreateBoard: () => Promise<string | null>`.
- להחליף input הטקסט ב-[שורות 241–246](../../src/lib/components/TileEditor.svelte#L241-L246) ב-`<select>` עם:
  - option לכל לוח
  - sentinel option `__create__` → "+ צור לוח חדש…"
  - אם `loadBoard` הנוכחי לא קיים ברשימה — להציג כ-option מושבת "(חסר) <id>" כדי לא לאבד את ההפניה בשקט.
- בחירת sentinel → `await onRequestCreateBoard()` → עדכון `loadBoard` ל-ID שהוחזר.

### 5. [src/routes/+page.svelte](../../src/routes/+page.svelte) — חיווט

- State חדש: `managerState: 'closed' | 'list' | 'new-for-folder'` + `createResolver: ((id: string | null) => void) | null` לתזמור ה-create-for-folder flow (TileEditor פותח את BoardManager ב-new view, מחכה ל-Promise, מקבל ID).
- חיווט `onmanageBoards` ב-EditToolbar.
- העברת `availableBoards` + `onRequestCreateBoard` ל-TileEditor.

---

## סקופ MVP

**כלול**: יצירה, שינוי שם, שינוי גודל, מחיקה עם אזהרת תלויות + strip, שכפול, dropdown ב-TileEditor, נקודת כניסה ב-EditToolbar, confirm ב-delete board + reset, חיבור ל-history store (אם קיים) להפיכת מחיקה/יצירה ל-undoable.

**דחוי**: drag-reorder של לוחות, תיאור ללוח, thumbnails (עוברים ל-[architecture.md §6.3](architecture.md#63-דשבורד-אוסף-sset-id)), ייצוא של לוח בודד, rename cascade של IDs, "הפוך לבית", UI מלא ל-undo (hotkey / history panel).

---

## סדר ביצוע

1. מתודות ב-store (תוספת בלבד — לא שובר כלום, בר-בדיקה).
2. `BoardManager.svelte` — list + new + edit views.
3. חיווט EditToolbar.
4. Delete-with-dependents flow ב-BoardManager.
5. Dropdown ב-TileEditor + create-new callback.
6. הרחבת בדיקות (סעיף אימות למטה).

---

## סיכונים

- **Deep clone**: `structuredClone(board)` מחליף tile IDs, `loadBoard` refs נשמרים כמו במקור. החלטה מודעת — לא משכפלים רקורסיבית את כל העץ.
- **עקביות `boards-index` ב-IndexedDB**: `saveBoard`/`deleteBoard` מעדכנים את האינדקס. `duplicateBoard`/`createBoard` קוראים ל-`persist` → `saveBoard` → כבר נכון.
- **Rename של הלוח הנוכחי**: `updateBoard` ב-[store:190-198](../../src/lib/stores/board.svelte.ts#L190-L198) כבר מעדכן `currentBoard = board` — טופל.

---

## קבצים קריטיים

- [src/lib/stores/board.svelte.ts](../../src/lib/stores/board.svelte.ts) — הוספת 4 מתודות + warning ב-`navigateTo`
- [src/lib/components/BoardManager.svelte](../../src/lib/components/BoardManager.svelte) — **חדש**
- [src/lib/components/TileEditor.svelte](../../src/lib/components/TileEditor.svelte) — החלפת שדה `loadBoard`
- [src/lib/components/EditToolbar.svelte](../../src/lib/components/EditToolbar.svelte) — כפתור "לוחות"
- [src/routes/+page.svelte](../../src/routes/+page.svelte) — תזמור המודאל

---

## אימות (Verification)

**Playwright E2E** (להרחיב את [tests/edit-mode.e2e.ts](../../tests/edit-mode.e2e.ts) או להוסיף `tests/board-management.e2e.ts`):

1. כניסה למצב עריכה → לחיצה על "לוחות" → המודאל נפתח ברשימה.
2. "לוח חדש" → הזנת שם "בדיקה" + 2×3 → שמירה → הלוח מופיע ברשימה עם rows×cols נכון.
3. שכפול לוח → עותק חדש נוצר עם שם `… (עותק)`, מספר tiles זהה, tile IDs שונים.
4. מחיקת לוח שאליו מצביעה תיקייה → דיאלוג עם מספר התלויות → בחירת "מחק ונקה" → ה-tile התלוי נהפך ל-button רגיל ללא `loadBoard`.
5. עריכת אריח-תיקייה → dropdown מציג את כל הלוחות → בחירת "צור לוח חדש…" → המודאל נפתח ב-new view → לאחר שמירה, ה-`loadBoard` של האריח מתעדכן ל-ID החדש.

**ידני (UI)**:

- `bun run dev` → `/`.
- RTL נראה תקין, Escape סוגר את המודאל, backdrop click סוגר, המודאל ממורכז.
- Reload אחרי יצירה → הלוח נשמר ב-IndexedDB (בדיקת persistence).

# ארכיטקטורת UI — לוחות, אוספים, וניווט

מסמך עיצוב מקיף. מטרתו: לעגן "איך זה אמור להיראות" לפני ולא-תלוי במימוש. ביצוע יכול להיות בשלבים, אבל המבנה נקבע כאן במלואו.

---

## 1. הקשר והמטרה

כיום האפליקציה מחזיקה מילון שטוח של לוחות (`allBoards`), עם `HOME_BOARD_ID = 'home'` קשיח ובלי routing משמעותי (הכל דף יחיד). הפער:

- אין URL ללוח — אי אפשר לשתף, bookmark, או לחזור עם back.
- אין מושג של **"אוסף לוחות"** — כל הלוחות שייכים לאותו מרחב אחד.
- אין ממשק ניהול לוחות מלא (ראה [board-management.md](board-management.md)).

המסמך הזה מגדיר את ארכיטקטורת ה-UI לטווח הארוך, כולל אוספים, URL scheme, ומודל הנתונים. פרטי המימוש המדורג מופיעים ב-[roadmap.md](roadmap.md) ובתתי-תוכניות (כמו board-management.md).

---

## 2. טרמינולוגיה

| עברית            | English   | תפקיד                                                      |
| ---------------- | --------- | ---------------------------------------------------------- |
| **אריח**         | **Tile**  | יחידה בודדת — כפתור (דיבור), תיקייה (ניווט), או קישור ללוח |
| **לוח**          | **Board** | רשת של אריחים                                              |
| **אוסף (לוחות)** | **Set**   | קבוצת לוחות מקושרים עם לוח-בית משלה                        |

"אוסף לוחות" נבחר על פני "ערכת לוחות" (פחות טעון). ב-UI: "אוסף" כשמספיק, "אוסף לוחות" כשצריך בהירות.

⚠️ שם ב-UI יכול להשתנות (string חופשי). מזהה ה-URL (`/s/...`) מקובע.

---

## 3. מודל נתונים

```ts
// src/lib/types/board.ts (קיים — נשאר ללא שינוי)
interface Tile {
	id: string;
	label: string;
	image: string;
	backgroundColor: string;
	borderColor: string;
	loadBoard?: string; // מזהה board (באותו אוסף)
	type: 'button' | 'folder';
}

// קיים — תוספת של setId
interface Board {
	id: string; // random, URL-safe, ~10 chars
	setId: string; // חדש — שיוך לאוסף
	name: string;
	tiles: Tile[];
	grid: { rows: number; columns: number };
	createdAt: number;
	updatedAt: number;
}

// חדש
interface Set {
	id: string; // random, URL-safe, ~10 chars
	name: string;
	homeBoardId: string; // מזהה לוח באוסף הזה
	createdAt: number;
	updatedAt: number;
	// boardIds אינו נשמר — נגזר דרך שאילתה על boards by setId
}

// חדש — ב-app-level settings
interface AppSettings {
	defaultSetId: string; // הסט שאליו מפנים מ-/
	// ...שאר ההגדרות (tts, theme) שכבר קיימות
}
```

**כללים**:

- `Board.loadBoard` מפנה רק ללוחות **באותו אוסף**. לא מאפשרים cross-set folder links — שמירה על שפיות.
- מחיקת אוסף **מוחקת את כל הלוחות שבו**. (מימוש ישלים בדיקה + אזהרה).
- לא ניתן למחוק את האוסף האחרון — כמו שלא ניתן למחוק את לוח הבית.
- `homeBoardId` חייב להצביע ללוח באוסף. אם הלוח נמחק, האוסף בוחר אוטומטית את הלוח הראשון הבא.

---

## 4. מפת URLs

המבנה המלא מהיום הראשון:

```
/                                      → redirect ל-/s/[default]/b/[home]
/s/[set-id]                            → דשבורד של אוסף (רשימת לוחות)
/s/[set-id]/b/[board-id]               → לוח — view mode
/s/[set-id]/b/[board-id]/edit          → לוח — edit mode
/s/[set-id]/boards                     → רשימת כל הלוחות של האוסף (= מבט חלופי לדשבורד)
/sets                                  → Explorer — כל האוספים
/settings                              → הגדרות גלובליות
```

**הערות**:

- `/` redirect נשען על `AppSettings.defaultSetId` ב-IndexedDB. אם חסר — נוצר בטעינה הראשונה.
- עד שמתווסף UI ליצירת אוספים מרובים, `/sets` מציג אוסף אחד בלבד ו-`/s/[set-id]` הוא ה-URL הקבוע של הסט הבודד (ה-ID רנדומלי, נוצר פעם אחת, נשמר).
- **אין query params למצב** — edit הוא route, לא `?edit=1`.
- עתיד רחוק (רב-משתמשים) — `/u/[user-id]/s/[set-id]/...` — prefix חיצוני, לא משנה את המבנה הפנימי. מובטח שלא נצטרך לעשות URL migration.
- מזהי `home`, `food` וכו' (לוחות ברירת מחדל קיימים) **נשמרים כפי שהם** ב-migration — הם ASCII ו-URL-safe. לוחות חדשים יקבלו random IDs.

### 4.1 SvelteKit routing file structure

```
src/routes/
├── +layout.svelte               — shell גלובלי (NavBar, OutputBar)
├── +page.svelte                 — redirect ל-default set
├── s/
│   └── [setId]/
│       ├── +layout.svelte       — shell של אוסף (breadcrumb, NavBar עם שם אוסף)
│       ├── +page.svelte         — דשבורד של אוסף (= boards list)
│       ├── boards/
│       │   └── +page.svelte     — מבט רשימה חלופי (יכול להיות כינוי לדשבורד)
│       └── b/
│           └── [boardId]/
│               ├── +layout.svelte  — טוען board, מספק ל-view/edit
│               ├── +page.svelte    — view mode
│               └── edit/
│                   └── +page.svelte — edit mode
├── sets/
│   └── +page.svelte             — Explorer
└── settings/
    └── +page.svelte             — קיים
```

### 4.2 התנהגות ניווט

| אירוע                      | פעולה                                                        |
| -------------------------- | ------------------------------------------------------------ |
| לחיצה על אריח-תיקייה       | `goto('/s/[setId]/b/[loadBoard]')` — מוסיף להיסטוריית הדפדפן |
| לחיצה על "חזור" ב-NavBar   | `history.back()` — הדפדפן מנהל                               |
| לחיצה על "בית" ב-NavBar    | `goto('/s/[setId]/b/[homeBoardId]')`                         |
| toggle edit                | `goto('.../edit')` או `goto('..')` בהתאם                     |
| יציאה מ-edit (שמירה/ביטול) | נשאר ב-edit או חוזר ל-view לפי הבחירה                        |
| מחיקת הלוח הנוכחי          | `goto('/s/[setId]/b/[homeBoardId]')` + toast                 |
| ניווט ל-board ID שלא קיים  | 404 Svelte page — "הלוח לא נמצא. חזור לבית"                  |
| ניווט ל-set ID שלא קיים    | 404 — "האוסף לא נמצא"                                        |

### 4.3 איבוד state בניווט

- עריכות לא מסתיימות ב-edit (TileEditor פתוח) — beforeunload? לא. כרגע auto-save על כל שינוי, אין איבוד.
- Output bar — נקבע: **נמחק בניווט בין אוספים**, **נשמר בניווט בין לוחות** (כדי לאפשר בניית משפט חוצה-לוחות בתוך אוסף).

---

## 5. מזהים (IDs)

**החלטה: רנדומלי, ASCII-only, URL-safe, קצר.**

מפרט מומלץ:

- **nanoid עם alphabet URL-safe** (ללא `-`/`_` לקריאות טובה יותר): `0123456789abcdefghijklmnopqrstuvwxyz`.
- **אורך 10**: מרחב של ~3.6×10^15 → אפס סיכוי התנגשות בסקייל פרטי.
- אותיות קטנות בלבד: מקטין בלבול בין `O`/`0`, `I`/`l`/`1`.

דוגמאות:

```
board id:  k4j2d8ptmx
set id:    s9n1q6hlxe
```

**חריגים**:

- 5 הלוחות הקיימים שומרים את ה-IDs הסמנטיים שלהם (`home`, `food`, `games`, `feelings`, `places`) — כבר persist ב-IndexedDB אצל משתמשים קיימים, אין סיבה לשבור.
- מבחינת fresh install: ברירות המחדל נטענות עם ה-IDs הסמנטיים שלהן; הסט הברירת-מחדל מקבל ID **רנדומלי** בטעינה הראשונה.

**helper**:

```ts
// src/lib/utils/ids.ts (חדש)
export function generateId(): string {
	// nanoid או custom 10-char from [a-z0-9]
}
```

---

## 6. שטחי UI (Screens)

### 6.1 לוח — View Mode (`/s/[set]/b/[board]`)

```
┌─────────────────────────────────────────────────┐
│  [OutputBar — טיילים שנבחרו, Speak All, ניקוי] │
├─────────────────────────────────────────────────┤
│  [NavBar — אוסף › לוח   חזור  בית  ⚙  ✏]        │
├─────────────────────────────────────────────────┤
│                                                 │
│             [Board — רשת אריחים]                │
│                                                 │
└─────────────────────────────────────────────────┘
```

- כפתור ✏ toggle → `/edit`.
- breadcrumb: "אוסף › לוח" (קליק על "אוסף" → דשבורד).
- NavBar נשאר כמו היום + שם האוסף.

### 6.2 לוח — Edit Mode (`/s/[set]/b/[board]/edit`)

```
┌─────────────────────────────────────────────────┐
│  [OutputBar — מושבת במצב עריכה]                 │
├─────────────────────────────────────────────────┤
│  [NavBar — breadcrumb  חזור  בית  ⚙  ✓ (done)] │
├─────────────────────────────────────────────────┤
│  [EditToolbar — רשת | הוסף אריח | לוחות |      │
│   ייצוא | ייבוא | מחק עודף | איפוס]             │
├─────────────────────────────────────────────────┤
│                                                 │
│             [Board — אריחים עם drag + edit]     │
│                                                 │
└─────────────────────────────────────────────────┘
```

- EditToolbar מקבל כפתור חדש **"לוחות"** שפותח מודאל BoardManager.
- ✓ ב-NavBar → `goto('..')` יציאה ממצב עריכה.

### 6.3 דשבורד אוסף (`/s/[set-id]`)

```
┌─────────────────────────────────────────────────┐
│  [NavBar — אוסף: "שם האוסף"   ⚙ (set settings)]│
├─────────────────────────────────────────────────┤
│  + לוח חדש            (קישור ל-/sets)  ⚙        │
├─────────────────────────────────────────────────┤
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐       │
│  │ 🏠 בית │ │ אוכל  │ │ רגשות │ │ מקומות│      │
│  │ [2×2] │ │ [2×2] │ │ [2×2] │ │ [2×2] │       │
│  │ 3×3   │ │ 4×4   │ │ 3×3   │ │ 4×3   │       │
│  └───────┘ └───────┘ └───────┘ └───────┘       │
│                                                 │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

- רשת כרטיסים responsive: `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))`.
- כל כרטיס: thumbnail (2×2), שם, גודל רשת, badge "בית" ללוח בית.
- קליק בכרטיס → ניווט ללוח (`/s/[set]/b/[board]`).
- בכל כרטיס: menu (שלוש נקודות) → ערוך, שכפל, מחק, הפוך לבית.
- כפתור "+ לוח חדש" מוביל לדיאלוג הוספה (אותו דיאלוג של BoardManager → new view, לאחר יצירה ניווט ל-`.../edit`).
- ⚙ של האוסף: מודאל "הגדרות אוסף" — שם, לוח בית, מחיקת אוסף.

### 6.4 Explorer (`/sets`)

```
┌─────────────────────────────────────────────────┐
│  [NavBar — אוספי לוחות   ⚙]                     │
├─────────────────────────────────────────────────┤
│  + אוסף חדש                                     │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐             │
│  │ שם האוסף 1   │ │ שם האוסף 2   │             │
│  │ [thumb]      │ │ [thumb]      │             │
│  │ 12 לוחות     │ │ 5 לוחות      │             │
│  │ [ברירת מחדל] │ │              │             │
│  └──────────────┘ └──────────────┘             │
└─────────────────────────────────────────────────┘
```

- thumbnail של אוסף = thumbnail של לוח הבית שלו.
- Menu בכרטיס: ערוך שם, הפוך לברירת מחדל, שכפל, מחק, ייצא.

### 6.5 BoardManager Modal (מ-EditToolbar → "לוחות")

אותו [מודאל מתועד ב-board-management.md](board-management.md) — reuse של overlay TileEditor.

**שימושו**: החלפה מהירה וניהול לוחות **בתוך האוסף הנוכחי** בלי לצאת ממצב עריכה. הדשבורד (`/s/[set]`) הוא המקום הרשמי; המודאל הוא קיצור.

3 modes:

- **list**: רשימת לוחות באוסף הנוכחי, פעולות inline.
- **new**: טופס יצירת לוח (שם, גריד).
- **edit**: שם + גריד של לוח קיים.

### 6.6 TileEditor — בורר לוח יעד

החלפת ה-input החופשי ב-`<select>` עם:

- options: כל הלוחות **באוסף הנוכחי**.
- sentinel `__create__` → "+ צור לוח חדש…" → פותח BoardManager ב-new mode, מחכה ל-ID, מגדיר כ-`loadBoard`.
- אם `loadBoard` הקיים לא נמצא ברשימה — מוצג כ-option מושבת "(חסר)".

### 6.7 הגדרות (`/settings`)

נשאר כמו היום: TTS, theme, ייצוא/ייבוא, איפוס. מוסיפים קישור ל-`/sets` ("ניהול אוספים").

הגדרות **ספציפיות לאוסף** (שם, לוח בית) — במודאל "הגדרות אוסף" מהדשבורד, לא כאן.

---

## 7. Thumbnails — מימוש טכני

**שיטה**: רשת 2×2 של התמונות מ-4 האריחים הראשונים (`board.tiles.slice(0, 4).map(t => t.image)`).

- `<img loading="lazy">` — טעינה עצלה.
- גודל thumbnail: 160×160, כל תא 80×80.
- אריחים חסרים → placeholder אפור.
- רקע הכרטיס מקבל את `backgroundColor` של הטייל הראשון — מזהה ויזואלי נוסף.
- לוח ריק (0 tiles) → אייקון generic.

למה לא live miniature (`transform: scale(0.2)` של `<Board>`): עם 20+ לוחות × 30+ tiles = מאות בקשות תמונה. כבד מדי ל-`/sets` ו-`/s/[set]`.

---

## 8. תרחישי ניווט

### 8.1 טעינה ראשונה (fresh install)

1. `/` נפתח
2. IndexedDB ריק → טוען defaults (5 לוחות)
3. יוצר `Set` ברירת מחדל עם `homeBoardId: 'home'` ו-ID רנדומלי
4. שומר `defaultSetId` ב-AppSettings
5. `redirect(302, /s/[defaultSetId]/b/home)`

### 8.2 החזרת משתמש קיים

1. `/` נפתח
2. IndexedDB טעון
3. קורא `defaultSetId` מ-AppSettings
4. `redirect(302, /s/[defaultSetId]/b/home)` (או לוח הבית של הסט)

### 8.3 ניווט באריח-תיקייה

1. קליק על tile עם `loadBoard: 'food'`
2. `goto('/s/[currentSet]/b/food')`
3. SvelteKit מפעיל `+page` load — מוודא שהלוח קיים באוסף

### 8.4 יצירת לוח חדש מ-EditToolbar

1. קליק "לוחות" → מודאל BoardManager פתוח ב-list
2. קליק "לוח חדש" → עובר ל-new
3. שם + גריד + שמירה → store.createBoard → `goto('/s/[set]/b/[newId]/edit')`
4. המודאל נסגר, הלוח החדש הוא הנוכחי במצב עריכה

### 8.5 יצירת לוח חדש מתוך TileEditor (folder flow)

1. עריכת אריח → בוחרים "תיקייה" → בוחרים "+ צור לוח חדש…" ב-dropdown
2. BoardManager פותח promise, מציג new view
3. שם + גריד + שמירה → store.createBoard → resolve(newId)
4. ה-promise חוזר ל-TileEditor, מגדיר `loadBoard = newId`
5. המשתמש לא מנווט לשום מקום — ממשיך לערוך את האריח

### 8.6 מחיקת לוח עם תלויות

1. קליק "מחק" בדשבורד או ב-BoardManager
2. הסטור סורק — מצא N תיקיות שמצביעות ללוח הזה
3. מודאל: "N תיקיות תלויות. מה לעשות?"
   - ביטול
   - מחק ונקה הפניות (tile.type ← 'button', tile.loadBoard ← undefined)
4. ביצוע

---

## 9. Persistence (IndexedDB)

**Keys**:

```
boards-index     : string[]       (מזהי לוחות — קיים)
board:[id]       : Board          (קיים)
sets-index       : string[]       (חדש)
set:[id]         : Set            (חדש)
app-settings     : AppSettings    (חדש או הרחבה של settings קיים)
```

**פעולות store חדשות** (ב-[src/lib/stores/sets.svelte.ts](../../src/lib/stores/sets.svelte.ts) — קובץ חדש):

- `init()` — טוען sets + app-settings; אם ריק, יוצר default set + משייך כל הלוחות הקיימים אליו
- `createSet(name) → id`
- `updateSet(id, { name?, homeBoardId? })`
- `deleteSet(id)` — מוחק גם את הלוחות
- `duplicateSet(id) → newId`
- `setDefault(id)`
- `boardsInSet(setId) → Board[]` — נגזר

**שינויי store קיים** (ב-[src/lib/stores/board.svelte.ts](../../src/lib/stores/board.svelte.ts)):

- `createBoard` מקבל `setId`
- שימושים ב-`HOME_BOARD_ID` מוחלפים ב-`getCurrentSet().homeBoardId`

---

## 10. Migration מהמצב הנוכחי

**חוק בסיס**: fresh install או משתמש קיים — שניהם מגיעים לאותו מצב.

**המימוש**:

```ts
// ב-init של store
async function migrateIfNeeded() {
	const settings = await loadAppSettings();
	if (settings?.defaultSetId) return; // כבר עשה migration

	// יצירת default set
	const defaultSetId = generateId();
	const homeBoardId =
		Object.values(existingBoards).find((b) => b.id === 'home')?.id ??
		Object.values(existingBoards)[0].id;

	const defaultSet: Set = {
		id: defaultSetId,
		name: 'האוסף שלי',
		homeBoardId,
		createdAt: Date.now(),
		updatedAt: Date.now()
	};

	// שיוך כל הלוחות הקיימים
	for (const board of Object.values(existingBoards)) {
		board.setId = defaultSetId;
		await saveBoard(board);
	}

	await saveSet(defaultSet);
	await saveAppSettings({ ...settings, defaultSetId });
}
```

המשתמש לא מבחין במעבר — הלוחות שלו שורדים, שם האוסף default "האוסף שלי".

---

## 10.5 שימוש בסיסי — דרישות שחייבות להיכלל

פערים שחוסמים שימוש אמיתי של הורה/מטפל. חלקם חייבים להיכלל בכל שלב של הביצוע; חלקם תשתית לעתיד.

### 10.5.1 אישור בפעולות הרסניות

| פעולה                                 | אישור?                                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| **איפוס לברירת מחדל** ב-EditToolbar   | ✅ חובה — modal "האם למחוק את כל הלוחות המותאמים?"                                  |
| **מחיקת לוח** ב-BoardManager / דשבורד | ✅ חובה — כולל רשימת תיקיות תלויות (ראה [board-management.md](board-management.md)) |
| **מחיקת אריח** ב-TileEditor           | ❌ ללא אישור — מסרבל. אם המשתמש טועה, ה-Undo (10.5.2) יחזיר                         |
| **מחיקת אוסף**                        | ✅ חובה — הרבה יותר הרסני ממחיקת לוח                                                |
| **ניקוי Output Bar**                  | ❌ ללא אישור — החזרת טקסט זולה                                                      |

### 10.5.2 Undo — לפחות תשתית

**החלטה: תשתית בסיסית נבנית עכשיו, UI מלא יכול להידחות**.

תשתית מוצעת (ב-[src/lib/stores/history.svelte.ts](../../src/lib/stores/history.svelte.ts) — חדש):

```ts
type Mutation =
  | { type: 'tile.update'; boardId: string; tileId: string; before: Tile }
  | { type: 'tile.remove'; boardId: string; index: number; before: Tile }
  | { type: 'tile.add'; boardId: string; tileId: string }
  | { type: 'board.delete'; before: Board }
  | { type: 'board.reset'; before: Record<string, Board> }
  // ...

// stack מוגבל ל-N=50 פעולות אחרונות
push(m: Mutation): void
undo(): Mutation | null   // מחזיר את הפעולה כדי להציג toast
```

- **כל** פעולה מוטציונית ב-board store דוחפת Mutation עם snapshot של ה-"before".
- `Ctrl+Z` (ו-⌘+Z) → `undo()` → ה-store מיישם הפוך.
- UI מינימלי: toast "X נמחק — בטל" אחרי פעולה הרסנית (לוח/אריח). דחיית Ctrl+Z hotkey לעתיד אם לא נכנס.

**למה תשתית עכשיו**: אם כל מוטציה תרשום history לאחור, הוספת UI אחר כך זה רק hook. אם נתחיל בלי — יהיה עדכון של 20 מקומות.

### 10.5.3 Loading state

ב-[+page.svelte:22-25](../../src/routes/+page.svelte#L22-L25) — `store.init()` async. המשתמש רואה ברירת המחדל לרגע ואז "קופץ" ללוח השמור.

דרישה:

- **skeleton** או spinner עד `store.initialized === true`.
- מומלץ: ב-`+layout.svelte` או `+layout.ts` → `await store.init()` ב-SSR/load function כך שהדף הראשוני כבר נטען עם הנתונים הנכונים.

### 10.5.4 Empty states

| מקום           | מצב ריק                                 | UI                                               |
| -------------- | --------------------------------------- | ------------------------------------------------ |
| לוח ללא אריחים | `tiles.length === 0` ב-edit             | "לחץ '+ הוסף' כדי להתחיל" — placeholder במרכז    |
| דשבורד אוסף    | 0 לוחות (לא אפשרי בפועל — תמיד יש home) | —                                                |
| Explorer       | 0 אוספים (לא אפשרי אחרי migration)      | —                                                |
| חיפוש ARASAAC  | 0 תוצאות                                | "לא נמצאו סמלים עבור 'X'" (כבר מטופל באופן חלקי) |
| Output Bar     | ריק                                     | נשאר ריק, כפתורים disabled (כבר מטופל)           |

### 10.5.5 Edit mode לא נגיש מדי

**בעיה**: ילד/תלמיד שלוחץ על ✏ ייכנס לעריכה ויהרוס. במיוחד בסביבת כיתה.

**דרישה**: עריכה לא תהיה זמינה בלחיצה יחידה פשוטה. אפשרויות:

1. **Long-press (600ms+)** על ✏ כדי להיכנס. תואם touch/mouse.
2. **PIN** (4 ספרות) שנשמר ב-`app-settings`. אם מוגדר — נדרש לפתיחת edit + של settings.
3. **Hidden entry**: הסתרת הכפתור לגמרי; כניסה דרך `/settings` או gesture (3-tap בפינה).

**המלצה**: (1) Long-press כברירת מחדל, (2) PIN אופציונלי ב-`/settings` → "דרוש PIN לעריכה". עצלן ופשוט.

### 10.5.6 OutputBar — שני כפתורי מחיקה

כיום יש כפתור אחד לניקוי. חסר אופציה למחוק רק את האחרון.

דרישה: שני כפתורים ב-OutputBar:

- ⌫ **מחק אחרון** (icon: backspace) — מסיר פריט יחיד מהסוף.
- 🗑 **ניקוי** (icon: trash) — מרוקן את כל ה-bar.

שניהם disabled כשהרשימה ריקה. שניהם ללא אישור.

### 10.5.7 הסתרת/השבתת אריח (disabled)

**סטטוס**: לא קיים. בדקתי — `hiddenCount` ב-EditToolbar הוא overflow של grid, לא per-tile hide.

**דרישה**: שדה חדש `Tile.disabled?: boolean`.

- Tile מושבת: מוצג באפור, לא לחיץ, לא ב-switch scanning.
- toggle במצב עריכה (אייקון עין בכפתור האריח).
- שימוש: הורה מציג רק 6 אריחים לילד צעיר, חושף עוד כשמוכן — בלי למחוק את הקיים.

עדכון ל-Tile type:

```ts
interface Tile {
	// ...
	disabled?: boolean; // ברירת מחדל: false
}
```

---

## 11. שלבי ביצוע מומלצים

הארכיטקטורה קבועה; הביצוע מדורג. המלצה:

**שלב A — board-management מינימלי בלי sets** ([board-management.md](board-management.md))

- תשתית CRUD + UI ניהול לוחות, בלי אוספים, בלי routing חדש
- ROI מהיר, בלי שבירה

**שלב B — URL routing**

- `/s/[set-id]/b/[board-id]`, `/edit`, `/sets`, `/settings`
- migration — יוצר default set על הלוחות הקיימים
- נשאר סט אחד; `/sets` מציג אותו סט בודד

**שלב C — דשבורד אוסף + Explorer + thumbnails**

- `/s/[set-id]` מלא עם כרטיסים
- `/sets` explorer אמיתי (כרגע עדיין סט אחד)

**שלב D — ניהול אוספים מלא**

- יצירה/מחיקה/שכפול של sets
- UI להחלפת default set

**שלב E — (עתיד) templates, שיתוף, רב-משתמשים**

---

## 12. מחוץ לסקופ המסמך הזה

- **Auth ורב-משתמשים** — `/u/[user-id]/...` prefix; design-compatible אך לא חלק מה-MVP.
- **Switch scanning** — נגישות פיזית; שכבה מעל ה-UI.
- **Templates / Online Grids** — [roadmap.md](roadmap.md) שלב 6.
- **Per-set settings** (TTS voice per-set וכו') — עתיד.
- **Cross-set folder links** — החלטה מודעת לאסור.
- **Undo delete / Trash** — אפשרי עתידי, לא עכשיו.
- **Drag-reorder לוחות בדשבורד** — נחמד, לא חובה.

---

## 13. קבצים שיושפעו / ייווצרו

**חדשים**:

- [src/lib/types/set.ts](../../src/lib/types/set.ts)
- [src/lib/stores/sets.svelte.ts](../../src/lib/stores/sets.svelte.ts)
- [src/lib/utils/ids.ts](../../src/lib/utils/ids.ts)
- [src/lib/components/BoardManager.svelte](../../src/lib/components/BoardManager.svelte)
- [src/lib/components/BoardThumbnail.svelte](../../src/lib/components/BoardThumbnail.svelte)
- [src/lib/components/SetCard.svelte](../../src/lib/components/SetCard.svelte)
- [src/routes/s/\[setId\]/+layout.svelte](../../src/routes/s/[setId]/+layout.svelte)
- [src/routes/s/\[setId\]/+page.svelte](../../src/routes/s/[setId]/+page.svelte) (דשבורד)
- [src/routes/s/\[setId\]/b/\[boardId\]/+layout.svelte](../../src/routes/s/[setId]/b/[boardId]/+layout.svelte)
- [src/routes/s/\[setId\]/b/\[boardId\]/+page.svelte](../../src/routes/s/[setId]/b/[boardId]/+page.svelte)
- [src/routes/s/\[setId\]/b/\[boardId\]/edit/+page.svelte](../../src/routes/s/[setId]/b/[boardId]/edit/+page.svelte)
- [src/routes/sets/+page.svelte](../../src/routes/sets/+page.svelte)

**שינויים**:

- [src/lib/types/board.ts](../../src/lib/types/board.ts) — תוספת `setId`, `createdAt`, `updatedAt`
- [src/lib/stores/board.svelte.ts](../../src/lib/stores/board.svelte.ts) — שילוב setId, מחיקת HOME_BOARD_ID קשיח
- [src/lib/services/storage.ts](../../src/lib/services/storage.ts) — `saveSet`, `loadSet`, `saveAppSettings`, migration
- [src/lib/components/NavBar.svelte](../../src/lib/components/NavBar.svelte) — breadcrumb אוסף
- [src/lib/components/TileEditor.svelte](../../src/lib/components/TileEditor.svelte) — dropdown לוחות
- [src/lib/components/EditToolbar.svelte](../../src/lib/components/EditToolbar.svelte) — כפתור "לוחות"
- [src/routes/+page.svelte](../../src/routes/+page.svelte) — הופך ל-redirect בלבד
- [src/lib/data/boards.ts](../../src/lib/data/boards.ts) — הסרת `HOME_BOARD_ID` export (מחליפים ב-default set)

---

## 14. מצב ענפים (Branches)

**נכון ל-2026-04-22 — לאחר merge**:

- `main` — stale. רק קומיט ליבה ראשוני (`5f26b27`).
- `dev` — HEAD `7ec81a4` (לאחר merge של `claude/aac-board-core-4lixm`).
- `origin/dev` — מפגר מאחור. יש קומיט אחד ב-origin שלא אצלנו + 9 קומיטים אצלנו שלא ב-origin. push/merge ידרש.
- `claude/aac-board-core-4lixm` — נשאר כ-bookmark לנקודת ה-merge.

**מה כלול ב-dev עכשיו** (שעבר מ-`claude/...`):

- שלב 3A — חיפוש ARASAAC, העלאת תמונה, UI להגדרות TTS.
- שלב 3B — דף הגדרות (`/settings`) + theme + PWA ידני (manifest + service worker).
- תיקון IndexedDB, תצוגת overflow tiles.
- מסגרת בדיקות (vitest + Playwright) + מחקר AAC.
- תכנון שלבים 3C-3E.

**מה עכשיו**:

- `dev` מוכן לתחילת מימוש שלב 2.5 ([roadmap.md](roadmap.md)) — board management + שימוש בסיסי.
- מומלץ `git push` ל-origin/dev לאחר sync של השינוי עם הקומיט שב-origin שלא אצלנו (ראה `git log origin/dev ^dev`).

---

## 15. סוגיות פתוחות לחשיבה מאוחרת

אין צורך להחליט עכשיו אבל לתעד:

1. **Drag-reorder לוחות בדשבורד** — סדר תצוגה. ייתכן `Set.boardOrder: string[]`.
2. **Drag-reorder אוספים ב-Explorer** — סדר תצוגה בסט ראשי.
3. **קיבוע "בית" של אוסף ב-breadcrumb** — אם משתמש מנווט דרך 5 תיקיות, ה-breadcrumb מתארך. כדאי truncation בעיצוב.
4. **Shortcut keys** — `⌘+B` ל-BoardManager, `Esc` תמיד סוגר modals.
5. **Deep linking ל-edit** — URL ישיר ל-`/edit` — האם לבקש אישור? (כנראה לא; edit mode לא עושה נזק ב-auto-save).
6. **PWA manifest start_url** — `/` או `/s/[last-set]/b/[last-board]`?

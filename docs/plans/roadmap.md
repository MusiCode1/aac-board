# AAC Board — תוכנית פיתוח ארוכת טווח

## הקשר

שלב 1 (ליבה) הושלם: לוח AAC עם 5 לוחות, 62 פיקטוגרמות ARASAAC מאומתות, TTS, ניווט, אנימציות.
צריך לבנות תוכנית רב-שלבית שמקדמת את הפרויקט מ-MVP סטטי לאפליקציית AAC מלאה.

> **📌 היסטוריית ענפים (2026-04-22)**: ענף `claude/aac-board-core-4lixm` מוזג ל-`dev` — כל הקומיטים של שלב 3A+3B כלולים כעת. ראה [architecture.md §14](architecture.md#14-מצב-ענפים-branches) לפרטי ה-merge.

---

## שלב 2 — עריכה ושמירה מקומית

**מטרה:** לאפשר למשתמש (הורה/מטפל) להתאים את הלוח.

- [x] **Edit Mode** — מצב עריכה עם toggle, lock icon ב-NavBar
- [x] **עריכת אריח** — שינוי תווית, צבע רקע/גבול, תמונה (חיפוש ARASAAC), סוג (כפתור/תיקייה)
- [x] **הוספה/מחיקה** — הוספת אריח חדש, מחיקת אריח קיים, השבתת אריח (disabled)
- [x] **Drag & Drop** — סידור מחדש של אריחים בגרירה (HTML5 native)
- [x] **שינוי גודל רשת** — שינוי מספר שורות/עמודות
- [x] **IndexedDB persistence** — שמירה אוטומטית מקומית (idb-keyval או Dexie)
- [x] **ייצוא/ייבוא JSON** — גיבוי ושחזור לוחות

**קבצים עיקריים:**

- `src/lib/components/TileEditor.svelte` (חדש)
- `src/lib/components/EditToolbar.svelte` (חדש)
- `src/lib/services/storage.ts` (חדש — IndexedDB)
- `src/lib/services/arasaac.ts` (חדש — חיפוש סמלים)
- `src/lib/stores/board.svelte.ts` (עדכון — פעולות CRUD)

---

## שלב 3 — חיפוש סמלים ו-TTS מתקדם

**מטרה:** חוויית בחירת סמלים עשירה וקולות איכותיים.

### שלב 3A — חיפוש סמלים, העלאת תמונה, בחירת קול

- [ ] **שירות חיפוש ARASAAC** — `src/lib/services/arasaac.ts`
  - [ ] `searchPictograms(keyword, lang)` עם cache ו-AbortSignal
  - [ ] `pictogramUrl(id, size)` — helper לבניית URL
- [ ] **חיפוש סמלים ב-TileEditor** — סקציית "תמונה / סמל"
  - [ ] שדה חיפוש עם debounce 300ms
  - [ ] רשת תוצאות (~60px thumbnails), לחיצה בוחרת סמל
  - [ ] תצוגת loading ו-"לא נמצאו תוצאות"
- [ ] **העלאת תמונה** — בתוך TileEditor
  - [ ] כפתור "העלה תמונה" + `<input type="file" accept="image/*">`
  - [ ] המרה ל-base64, אזהרה אם >500KB
- [ ] **הגדרות קול TTS** — עדכון `tts.ts` + סקציה ב-TileEditor
  - [ ] `getTtsSettings()` / `saveTtsSettings()` (localStorage)
  - [ ] `getHebrewVoices()` — סינון קולות עבריים
  - [ ] dropdown קולות, sliders מהירות/pitch, כפתור "נסה קול"
  - [ ] `speak()` משתמש בהגדרות השמורות
- [ ] **ניקוי** — `pictogramUrl()` במקום URL hardcoded ב-`+page.svelte`

**קבצים:** `arasaac.ts` (חדש), `TileEditor.svelte` (עדכון), `tts.ts` (עדכון), `+page.svelte` (עדכון)

### שלב 3B — הגדרות ו-PWA

- [ ] **Settings Store** — `src/lib/stores/settings.svelte.ts`
  - [ ] `AppSettings`: ttsVoice, ttsRate, ttsPitch, theme, tileSize
  - [ ] persist ל-IndexedDB, `$state.snapshot()` לפני שמירה
  - [ ] `init()` עם מיגרציה מ-localStorage של 3A
  - [ ] `update(partial)` + `applyTheme()`
- [ ] **דף הגדרות** — `src/routes/settings/+page.svelte`
  - [ ] סקציית קול: dropdown, sliders, preview
  - [ ] סקציית תצוגה: toggle בהיר/כהה, גודל אריחים
  - [ ] סקציית נתונים: ייצוא/ייבוא, איפוס
- [ ] **NavBar** — כפתור gear icon → `/settings`
- [ ] **ערכת נושא** — CSS variables ב-`:root` / `:root.dark`
  - [ ] גרדיאנט עדין לרקע האפליקציה ולכרטיסים (cards)
  - [ ] anti-flash script ב-`app.html`
- [ ] **PWA ידני** (ללא plugin — Cloudflare adapter)
  - [ ] `static/manifest.json` — שם עברי, RTL, standalone
  - [ ] אייקונים ב-`static/icons/`
  - [ ] `app.html` — manifest link, theme-color meta
- [ ] **חיבור** — settings store ב-`+page.svelte`, TTS params

**קבצים:** `settings.svelte.ts` (חדש), `settings/+page.svelte` (חדש), `manifest.json` (חדש), `NavBar.svelte` (עדכון), `layout.css` (עדכון), `app.html` (עדכון), `tts.ts` (עדכון), `+page.svelte` (עדכון)

### שלב 3 — TTS providers מתקדמים

- [x] **ElevenLabs** — חיבור ל-ElevenLabs API (קולות AI), בורר קולות עם preview
- [x] **Google Gemini TTS** — gemini-2.5-flash-preview-tts (30 קולות prebuilt, תמיכה בעברית)
- [x] **Web Speech API** — ברירת מחדל (תמיד זמין)
- [x] **תשתית Provider abstraction** — `src/lib/services/tts-providers/` עם interface אחיד
- [x] **חיפוש סמל אוטומטי לפי תווית** — בזמן הקלדת שם לאריח, החיפוש מתעדכן
- [x] **Tile.hidden** — הסתרה מלאה של אריח (לא רק השבתה)
- [ ] **Azure TTS** — עתידי

---

## שלב 3C — יצירת לוח חדש ושיפור מצב עריכה

**מטרה:** לאפשר ליוצר הלוחות ליצור לוחות-בנים, לנווט ביניהם בזמן עריכה, ולערוך/למחוק אריחים בצורה מפורשת.

### שינוי 1 — כפתורי עריכה/מחיקה על האריח

**התנהגות נוכחית:** לחיצה על אריח במצב עריכה → פותח TileEditor.
**התנהגות חדשה:** לחיצה על אריח במצב עריכה → פעולה רגילה (משמיע/מנווט). עריכה ומחיקה דרך כפתורים ייעודיים על האריח.

- [x] **כפתור עריכה (✏️)** — פינה ימנית עליונה, פותח TileEditor
- [x] **כפתור מחיקה (✕)** — פינה שמאלית עליונה, מוחק עם confirm
- [x] **לחיצה על גוף האריח** — פעולה רגילה (speak / navigateTo) גם במצב עריכה
- [x] **Drag & Drop** — ללא שינוי (long-press 400ms touch, dragstart desktop)

### שינוי 2 — יצירת לוח חדש

- [x] **כפתור "+ לוח" ב-EditToolbar** — ליד "+ אריח"
  - יוצר לוח ריק (grid 3×4, ללא אריחים, שם "לוח חדש")
  - יוצר אריח `type: 'folder'` בלוח הנוכחי עם `loadBoard` שמצביע ללוח החדש
  - פותח TileEditor על האריח החדש לעריכת שם/צבע/אייקון
- [x] **סקציית "לוח יעד" ב-TileEditor** — כשהסוג הוא "לוח" (הושלם ב-2.5 עם dropdown)

### שינוי 3 — טרמינולוגיה

- [x] **"לוח" במקום "תיקייה"** — ב-TileEditor select (אייקון folder-badge על האריח נשאר כאייקון גרפי בלבד)
- [x] ה-`type` הפנימי נשאר `'folder'` בקוד (backward compatible)

### קבצים

| קובץ                 | שינוי                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Tile.svelte`        | כפתורי edit/delete, הסרת `onclick→TileEditor` במצב עריכה, props חדשים `onedit`/`ondelete`                    |
| `+page.svelte`       | `handleTilePress` ללא תנאי `editMode`, handlers חדשים `handleAddBoard`, `handleEditTile`, `handleDeleteTile` |
| `EditToolbar.svelte` | כפתור "+ לוח", callback `onaddboard`                                                                         |
| `TileEditor.svelte`  | תווית "לוח" במקום "תיקייה", סקציית "לוח יעד"                                                                 |
| `Board.svelte`       | העברת `onedit`/`ondelete` ל-Tile                                                                             |

### תוכנית מימוש לפי מסגרת הבדיקות

**שלב 0 — הגדרת התנהגויות (walkthrough)**

תיעוד ההתנהגויות הרצויות ב-`docs/walkthrough.md` לפני כתיבת קוד.

**שלב 1 — Red: בדיקות שנכשלות**

_Playwright E2E — `tests/board-management.e2e.ts`:_

- [ ] `clicking tile in edit mode still speaks` — לחיצה על אריח כפתור במצב עריכה → פריט ב-output bar
- [ ] `clicking folder tile in edit mode navigates` — לחיצה על אריח לוח במצב עריכה → מעבר ללוח
- [ ] `edit button opens TileEditor` — לחיצה על כפתור עריכה באריח → TileEditor נפתח
- [ ] `delete button removes tile` — לחיצה על כפתור מחיקה → אריח נעלם (עם confirm)
- [ ] `add board creates folder tile with linked board` — לחיצה על "+ לוח" → אריח folder חדש עם loadBoard
- [ ] `new board is navigable` — לחיצה על האריח החדש → מעבר ללוח ריק

_Vitest Unit — אין צורך בבדיקות unit חדשות:_
`createBoard` כבר קיים ב-store, והלוגיקה פשוטה (אין שירות חדש).

**שלב 2 — Green: מימוש מינימלי**

1. `Tile.svelte` — כפתורי edit/delete + שינוי props + הסרת if(editMode) מ-handleClick
2. `Board.svelte` — העברת callbacks חדשים
3. `+page.svelte` — handlers: handleEditTile, handleDeleteTile, handleAddBoard
4. `EditToolbar.svelte` — כפתור "+ לוח"
5. `TileEditor.svelte` — טרמינולוגיה + סקציית "לוח יעד"

**שלב 3 — Refactor + עדכון בדיקות קיימות**

- עדכון `tests/edit-mode.e2e.ts` — טסטים קיימים שמצפים ל-"לחיצה → TileEditor" צריכים להתעדכן ל-"לחיצה על כפתור edit → TileEditor"

---

## שלב 3D — בחירה מרובה, העתקה, שכפול לוח, וסייד-בר לוחות

**מטרה:** ניהול מתקדם של אריחים ולוחות — העתקה בין לוחות, שכפול, ודפדפן לוחות נוח.

### שינוי 1 — בחירה מרובה של אריחים

- [ ] **כפתור "בחירה" ב-EditToolbar** — מפעיל מצב בחירה מרובה
- [ ] **במצב בחירה:** לחיצה על אריח מוסיפה/מסירה מהבחירה (checkbox overlay)
- [ ] **סרגל בחירה (Selection Toolbar)** — מופיע בתחתית/בראש כשיש פריטים נבחרים
  - מציג מונה: "נבחרו 3 אריחים"
  - כפתורים: העתק | העבר | מחק | ביטול
- [ ] **בחר הכל / נקה בחירה** — כפתורים בסרגל הבחירה
- [ ] **יציאה מבחירה** — כפתור ביטול או ESC

### שינוי 2 — העתקה והדבקה בין לוחות

- [ ] **Clipboard בזיכרון** — `clipboardStore` שמחזיק אריחים מועתקים (עותק עמוק)
  - `copy(tiles)` — שומר עותק עם `structuredClone`
  - `paste(targetBoardId)` — מדביק עם IDs חדשים (`crypto.randomUUID()`)
  - `hasItems` — derived boolean
- [ ] **כפתור "הדבק" ב-EditToolbar** — מופיע רק כש-`clipboard.hasItems === true`
  - הדבקה מוסיפה אריחים לסוף הרשת של הלוח הנוכחי
- [ ] **העתק ← נווט ללוח אחר ← הדבק** — flow טבעי
- [ ] **העברה** — copy + delete מהמקור (פעולה אטומית)

### שינוי 3 — שכפול לוח

- [ ] **כפתור "שכפל לוח" ב-EditToolbar** — ליד "+ לוח"
  - שכפול רדוד (shallow clone): אריחי folder מצביעים על אותם לוחות-בנים
  - שם: "העתק של {שם מקורי}"
  - IDs חדשים ללוח ולכל האריחים
  - יוצר אריח folder בלוח הנוכחי שמצביע על הלוח המשוכפל
- [ ] **אופציה עתידית** — שכפול עמוק (deep clone) שמשכפל גם לוחות-בנים

### שינוי 4 — סייד-בר דפדפן לוחות (שמאל)

- [ ] **כפתור hamburger/boards ב-NavBar** — פותח/סוגר סייד-בר שמאלי
- [ ] **סייד-בר שמאלי (BoardBrowser)** — drawer עם overlay, 280px רוחב
  - **תצוגת עץ היררכית** — Home Board כשורש, לוחות-בנים בהזחה
  - **אריחים עם אייקון**: שם לוח + מספר אריחים + אייקון folder/board
  - **לוחות ללא הורה** — סקציה נפרדת "לוחות לא מקושרים" (orphaned boards)
  - **חיפוש** — שדה חיפוש בראש הסייד-בר, מסנן לפי שם לוח
  - **לחיצה** — מנווט ללוח הנבחר וסוגר את הסייד-בר
  - **לוח פעיל** — מסומן ויזואלית (highlight)
- [ ] **הצד הימני שמור** — ללוח כוונות תקשורתיות (שלב עתידי)

### קבצים

| קובץ                                         | שינוי                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| `EditToolbar.svelte`                         | כפתורי "בחירה", "הדבק", "שכפל לוח"                                               |
| `Tile.svelte`                                | checkbox overlay במצב בחירה, prop `selected`                                     |
| `Board.svelte`                               | ניהול מצב בחירה, העברת `onselect` ל-Tile                                         |
| `+page.svelte`                               | handlers: handleCopy, handlePaste, handleMove, handleDuplicate, handleBulkDelete |
| `src/lib/stores/clipboard.svelte.ts`         | (חדש) clipboard store                                                            |
| `src/lib/components/SelectionToolbar.svelte` | (חדש) סרגל בחירה מרובה                                                           |
| `src/lib/components/BoardBrowser.svelte`     | (חדש) סייד-בר דפדפן לוחות                                                        |
| `NavBar.svelte`                              | כפתור hamburger לפתיחת BoardBrowser                                              |

### תוכנית מימוש לפי מסגרת הבדיקות

**שלב 0 — הגדרת התנהגויות (walkthrough)**

תיעוד ההתנהגויות הרצויות ב-`docs/walkthrough.md` לפני כתיבת קוד.

**שלב 1 — Red: בדיקות שנכשלות**

_Vitest Unit — `src/lib/stores/clipboard.spec.ts`:_

- [ ] `copy stores deep clone of tiles` — `copy(tiles)` → `clipboard.items` לא משתנה כשהמקור משתנה
- [ ] `paste generates new IDs` — `paste()` → כל אריח מקבל UUID חדש
- [ ] `hasItems is true after copy` — `copy([tile])` → `hasItems === true`
- [ ] `clear empties clipboard` — `clear()` → `hasItems === false`

_Playwright E2E — `tests/board-management.e2e.ts` (הרחבה):_

- [ ] `multi-select tiles and delete` — בחירת 3 אריחים → מחיקה → 3 אריחים פחות
- [ ] `copy tiles to another board` — בחירה → העתקה → ניווט → הדבקה → אריחים מופיעים
- [ ] `duplicate board creates linked copy` — שכפול → אריח folder חדש → ניווט → לוח עם אותם אריחים
- [ ] `board browser shows hierarchy` — פתיחת סייד-בר → תצוגת עץ עם Home + לוחות-בנים
- [ ] `board browser search filters boards` — הקלדת שם → רק לוחות תואמים מוצגים
- [ ] `board browser click navigates` — לחיצה על לוח בסייד-בר → מעבר ללוח

**שלב 2 — Green: מימוש מינימלי**

1. `clipboard.svelte.ts` — store עם copy/paste/clear/hasItems
2. `Tile.svelte` — checkbox overlay + prop `selected`
3. `SelectionToolbar.svelte` — סרגל עם מונה + כפתורי פעולה
4. `EditToolbar.svelte` — כפתורי בחירה/הדבק/שכפול
5. `BoardBrowser.svelte` — drawer + tree view + search
6. `NavBar.svelte` — כפתור hamburger
7. `+page.svelte` — חיבור כל ה-handlers

**שלב 3 — Refactor**

- DRY: חילוץ לוגיקת ID generation ל-utility
- מבחן edge cases: הדבקה ללוח מלא, שכפול לוח עם 0 אריחים

---

## שלב 3E — כוונות תקשורתיות (Communication Intents)

**מטרה:** סיידבר כוונות תקשורתיות קבוע בצד ימין — מילות ליבה (רוצה, לא, כן, עוד...) שזמינות תמיד ללא קשר ללוח הפעיל. פיצ'ר שלא קיים באף יישום AAC מוכר.

### הבעיה

באפליקציות AAC קיימות, מילות ליבה כמו "רוצה", "לא", "עוד" חייבות להיות מועתקות לכל לוח מחדש, או שהמשתמש צריך לנווט חזרה ללוח הבית כדי לגשת אליהן. זה בזבוז זמן תקשורתי קריטי.

### הפתרון

**לוח כוונות** — ישות נפרדת מלוח תקשורת רגיל. נוצר פעם אחת, מוצג בצד כל לוח, לא ניתן לעריכה מתוך הלוח הרגיל — רק בדף ניהול ייעודי.

### מודל נתונים

```typescript
interface IntentBoard {
	id: string;
	name: string; // "כוונות בסיסיות", "כן/לא מהיר"
	tiles: IntentTile[]; // 2-8 אריחים
}

interface IntentTile {
	id: string;
	label: string;
	image: string; // ARASAAC URL או base64
	backgroundColor: string;
	borderColor: string;
	// אין loadBoard, אין type: 'folder' — תמיד כפתור
}

// קישור ללוח תקשורת
interface Board {
	// ... שדות קיימים
	intentBoardId?: string; // undefined = ברירת מחדל גלובלית, מזהה = override
}

// הגדרות גלובליות
interface AppSettings {
	// ... שדות קיימים
	defaultIntentBoardId: string; // לוח כוונות ברירת מחדל
	showIntents: boolean; // true = הצג, false = הסתר
}
```

### UI — סיידבר ימני (landscape-first)

```
┌──────────────────────────────────┬──────────┐
│            Output Bar            │          │
├──────────────────────────────────┤  רוצה    │
│                                  │ לא רוצה  │
│         לוח תקשורת ראשי          │   כן     │
│          (ממלא את הרוחב)         │   לא     │
│                                  │   עוד    │
│                                  │  מספיק   │
└──────────────────────────────────┴──────────┘
```

**הבחנה ויזואלית:**

- מסגרת (border) + רקע עדין שונה מ-`--bg-app`
- קו מפריד אנכי (border-left, 2px)
- אריחי כוונות קצת קטנים יותר (~70-80% מאריח רגיל)
- צבעים לפי מוסכמות Fitzgerald Key (פעלים בירוק, שלילה באדום, תיאורים בכחול)

**התנהגות:**

- לחיצה על אריח כוונה → מוסיפה ל-Output Bar (כמו אריח רגיל)
- הסיידבר **נשמר בניווט** בין לוחות — זה כל הרעיון
- במצב עריכה: הסיידבר **לא ניתן לעריכה** (אין wobble, אין כפתורי edit/delete)
- אפשר per-board override: לוח ספציפי יכול להשתמש בלוח כוונות אחר

### לוח כוונות ברירת מחדל

רשת 2×3, צבעי Fitzgerald Key:

| אריח    | צבע     | הסבר         |
| ------- | ------- | ------------ |
| רוצה    | ירוק 🟩 | פועל         |
| לא רוצה | אדום 🟥 | שלילה        |
| כן      | ירוק 🟩 | אישור        |
| לא      | אדום 🟥 | שלילה        |
| עוד     | כחול 🟦 | כמותי/תיאורי |
| מספיק   | אדום 🟥 | עצירה        |

עם סמלי ARASAAC מאומתים (כמו ב-`boards.ts`).

### דף ניהול כוונות — `/intents`

- רשימת כל לוחות הכוונות
- יצירת לוח כוונות חדש (עם wizard בסיסי: שם → grid → אריחים)
- עריכת אריחים — שימוש חוזר ב-TileEditor (ללא אפשרות "folder")
- מחיקת לוח כוונות (אם לא בשימוש, או עם אזהרה)
- קישור מדף ההגדרות + כפתור edit קטן בסיידבר עצמו

### הגדרות

בדף `/settings`, סקציה חדשה "כוונות תקשורתיות":

- toggle הצג/הסתר כוונות (`showIntents`)
- dropdown בחירת לוח כוונות ברירת מחדל (`defaultIntentBoardId`)

### קבצים

| קובץ                                      | שינוי                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------- |
| `src/lib/types/board.ts`                  | הוספת `IntentBoard`, `IntentTile`, הרחבת `Board` ו-`AppSettings`      |
| `src/lib/stores/intents.svelte.ts`        | (חדש) intent boards store — CRUD, `getActiveIntentBoard(boardId)`     |
| `src/lib/stores/intents.spec.ts`          | (חדש) Vitest — רזולוציית לוח כוונות                                   |
| `src/lib/data/intents.ts`                 | (חדש) לוח כוונות ברירת מחדל                                           |
| `src/lib/services/storage.ts`             | (עדכון) `saveIntentBoard`, `loadAllIntentBoards`, `deleteIntentBoard` |
| `src/lib/components/IntentSidebar.svelte` | (חדש) סיידבר כוונות                                                   |
| `src/routes/intents/+page.svelte`         | (חדש) דף ניהול כוונות                                                 |
| `src/routes/+page.svelte`                 | (עדכון) שילוב IntentSidebar ב-layout                                  |
| `src/routes/settings/+page.svelte`        | (עדכון) סקציית כוונות                                                 |
| `src/lib/stores/settings.svelte.ts`       | (עדכון) `defaultIntentBoardId`, `showIntents`                         |
| `NavBar.svelte`                           | (עדכון) קישור לדף ניהול כוונות (אופציונלי)                            |

### תוכנית מימוש לפי מסגרת הבדיקות

**שלב 0 — בדיקות בסיס לפונקציונליות קיימת (רשת ביטחון)**

לפני כל פיתוח חדש — כיסוי הליבה שלא נבדקה עד כה. `tests/core.e2e.ts`:

- [ ] `tile click adds to output bar` — לחיצה על אריח כפתור → פריט חדש ב-output bar
- [ ] `folder click navigates to sub-board` — לחיצה על אריח folder → מעבר ללוח, כותרת משתנה
- [ ] `back and home buttons work` — ניווט ללוח → חזרה → לוח הבית
- [ ] `tile edit persists after reload` — שינוי תווית → שמירה → ריענון → התווית נשמרה
- [ ] `theme toggle persists` — שינוי theme בהגדרות → ריענון → theme נשמר

בדיקות אלה מגנות על ליבת האפליקציה מפני רגרסיה בכל פיתוח עתידי.

**שלב 0.5 — הגדרת התנהגויות (walkthrough)**

תיעוד ב-`docs/walkthrough.md` לפני כתיבת קוד.

**שלב 1 — Red: בדיקות שנכשלות**

_Vitest Unit — `src/lib/stores/intents.spec.ts`:_

- [ ] `getActiveIntentBoard returns global default when no override` — לוח ללא `intentBoardId` → לוח כוונות גלובלי
- [ ] `getActiveIntentBoard returns per-board override` — לוח עם `intentBoardId` → לוח הכוונות הספציפי
- [ ] `getActiveIntentBoard returns null when showIntents is false` — `showIntents: false` → null
- [ ] `getActiveIntentBoard returns null when intentBoardId points to deleted board` — ID שלא קיים → fallback לגלובלי

_Playwright E2E — `tests/intents.e2e.ts`:_

- [ ] `intent sidebar is visible on board page` — סיידבר מופיע עם 6 אריחי כוונות
- [ ] `clicking intent tile adds to output bar` — לחיצה על "רוצה" → "רוצה" ב-output bar
- [ ] `intent sidebar persists across board navigation` — ניווט ללוח-בן → סיידבר עדיין מוצג עם אותם אריחים
- [ ] `intent sidebar not editable in edit mode` — כניסה למצב עריכה → סיידבר ללא wobble/edit buttons
- [ ] `hide intents from settings` — settings → כיבוי כוונות → סיידבר נעלם
- [ ] `intents management page` — ניווט ל-`/intents` → רשימת לוחות כוונות → עריכת אריח → שמירה

**שלב 2 — Green: מימוש מינימלי**

1. `src/lib/types/board.ts` — types חדשים
2. `src/lib/data/intents.ts` — לוח כוונות ברירת מחדל עם ARASAAC
3. `src/lib/stores/intents.svelte.ts` — store עם CRUD + `getActiveIntentBoard()`
4. `src/lib/services/storage.ts` — פונקציות persist ל-intent boards
5. `src/lib/components/IntentSidebar.svelte` — סיידבר עם אריחי כוונות
6. `src/routes/+page.svelte` — שילוב IntentSidebar ב-layout (ימין ללוח)
7. `src/routes/intents/+page.svelte` — דף ניהול עם שימוש חוזר ב-TileEditor
8. `src/routes/settings/+page.svelte` — סקציית כוונות (toggle + dropdown)
9. `src/lib/stores/settings.svelte.ts` — `defaultIntentBoardId`, `showIntents`

**שלב 3 — Refactor**

- שימוש חוזר בקוד בין TileEditor הקיים לעורך אריחי כוונות (חילוץ לוגיקה משותפת)
- edge cases: לוח כוונות ריק, 8 אריחים מקסימום, לוח כוונות שנמחק כשהוא בשימוש

### החלטה נדחית — Portrait / טאבלט אנכי

**הוחלט:** במצב portrait, סיידבר הכוונות יוצג כרצועה **תחתונה** (לא עליונה) — קרוב לאגודלים, ארגונומי יותר.
**מימוש נדחה:** landscape-first בשלב הנוכחי. כשנגיע לאופטימיזציית portrait (שלב עתידי), layout ישתנה מסיידבר אנכי לרצועה אופקית תחתונה ב-breakpoint ~900px.

---

## שלב 4 — נגישות וסריקה

**מטרה:** נגישות מלאה — switch scanning, keyboard, מעקב עיניים.

- [ ] **Keyboard navigation** — Tab/Enter/Arrow keys, focus management מלא
- [ ] **Switch scanning** — סריקה אוטומטית/ידנית עם 1-2 מתגים
  - Row-column scanning, linear scanning
  - הגדרת מהירות, dwell time, scanning pattern
- [ ] **High contrast mode** — מצב ניגודיות גבוהה
- [ ] **גודל אריחים מותאם** — אפשרות להגדלה/הקטנה
- [ ] **Screen reader** — תמיכה מלאה ב-ARIA live regions
- [ ] **Pointer/eye-tracking ready** — dwell-to-select

**קבצים עיקריים:**

- `src/lib/services/scanner.ts` (חדש)
- `src/lib/stores/accessibility.svelte.ts` (חדש)
- `src/lib/components/ScanHighlight.svelte` (חדש)

### תוכנית מימוש לפי מסגרת הבדיקות

**Vitest TDD — `src/lib/services/scanner.spec.ts`:**

ה-scanner הוא מכונת מצבים טהורה — מועמד מושלם ל-unit tests:

- לוגיקת סריקת row-column: התקדמות בין שורות, מעבר לסריקת עמודות, בחירת אריח
- הגדרות מהירות: `tick()` מתקדם לפי `speed` setting
- Edge cases: שורה ריקה, עמודה אחת, wrap-around
- Dwell timing: dwell-to-select מפעיל אריח אחרי זמן שהייה

**Playwright E2E — `tests/scanning.e2e.ts`:**

- Tab navigation בין אריחים
- הפעלת סריקה מהגדרות → highlight נע על הלוח
- Space בוחר שורה → Space בוחר עמודה → אריח נוסף ל-output
- ARIA roles ו-live regions מתעדכנים

**Playwright E2E — `tests/a11y.e2e.ts`:**

- High contrast mode משנה צבעים
- Screen reader: ARIA labels על אריחים, live region ב-output bar
- Focus management: פתיחת TileEditor → focus בתוך הדיאלוג, סגירה → focus חוזר

---

## שלב 5 — הגדרות מתקדמות ופרופיל

**מטרה:** התאמה אישית מלאה של האפליקציה (מרחיב את 3B).

- [ ] **הגדרות שפה** — בחירת שפה לממשק ולדיבור
- [ ] **הגדרות ניווט** — ניווט אוטומטי, breadcrumbs on/off, lock board
- [ ] **פרופיל מתקשר** — שם, גיל, שפה, רמת תקשורת
- [ ] **גיבוי/שחזור** — ייצוא כל ההגדרות + לוחות + כוונות ל-JSON

**קבצים עיקריים:**

- `src/routes/settings/+page.svelte` (עדכון)
- `src/lib/stores/settings.svelte.ts` (עדכון)
- `src/lib/components/settings/` (תיקייה חדשה)

### תוכנית מימוש לפי מסגרת הבדיקות

**Vitest TDD — `src/lib/stores/settings.spec.ts` (הרחבה):**

- מיגרציה: settings v1 → v2 עם שדות חדשים (שפה, פרופיל)
- גיבוי/שחזור: export → import round-trip שומר הכל (לוחות + כוונות + הגדרות + פרופיל)
- ולידציית פרופיל: שדות חובה, טווחי ערכים

**Playwright E2E — `tests/settings.e2e.ts`:**

- שינוי שפה → ממשק מתעדכן
- שינוי הגדרות ניווט (breadcrumbs off) → breadcrumbs נעלמים
- עריכת פרופיל מתקשר → שמירה → ריענון → פרופיל נשמר
- גיבוי → ייצוא JSON → איפוס → ייבוא → הכל חוזר

---

## שלב 6 — אוספי לוחות (Sets) ו-Routing

**מטרה:** מערכת שלמה של לוחות מקושרים תחת אוסף ("Set"), עם URL ייחודי לכל לוח.

> **הטרמינולוגיה עודכנה**: "Grid Set / Communicator / יישום" הוחלף ל-**"אוסף לוחות" (Set)** — ראה [architecture.md §2](architecture.md#2-טרמינולוגיה). ה-URL scheme המלא (`/s/[set]/b/[board]/edit`) מוגדר ב-[architecture.md §4](architecture.md#4-מפת-urls).

- [ ] **Sets** — אוסף לוחות מקושרים עם Home Board, מודל נתונים חדש (`Set` entity)
- [ ] **URL routing** — `/s/[set-id]/b/[board-id]` + `/edit`, `/sets`, migration ללוחות קיימים
- [ ] **דשבורד אוסף** — `/s/[set-id]` עם thumbnails 2×2 ([architecture.md §6.3](architecture.md#63-דשבורד-אוסף-sset-id))
- [ ] **Explorer** — `/sets` לניהול כל האוספים
- [ ] **שכפול לוח** — deep clone עם עדכון מזהים (כבר מתוכנן ב-[board-management.md](board-management.md))
- [ ] **שכפול עמוק של אוסף שלם** — מרחיב את שכפול הלוח היחיד; משכפל אוסף + כל הלוחות שבו
- [ ] **תבניות מובנות** — לוחות בסיס מוכנים (צרכים, רגשות, מקומות, אנשים, פעלים)
- [ ] **ייבוא/ייצוא Grid Sets** — שיתוף בין משתמשים
- [ ] **Online Grids** — גלריה קהילתית (דורש backend)

**קבצים עיקריים:**

- `src/lib/types/set.ts` (חדש)
- `src/lib/stores/sets.svelte.ts` (חדש)
- `src/routes/s/[setId]/...` (מבנה מלא ב-[architecture.md §4.1](architecture.md#41-sveltekit-routing-file-structure))
- `src/routes/sets/+page.svelte` (חדש)
- `src/lib/components/BoardThumbnail.svelte` (חדש)

### תוכנית מימוש לפי מסגרת הבדיקות

**Vitest TDD — `src/lib/stores/gridsets.spec.ts`:**

הלוגיקה הכי מורכבת ב-roadmap — שווה כיסוי unit מלא:

- CRUD: יצירה, עדכון, מחיקת grid set
- ניווט: `setActiveGridSet(id)` → home board משתנה
- Deep clone: שכפול grid set → כל IDs חדשים, כל לוחות-בנים משוכפלים, קישורי `loadBoard` מעודכנים
- תבניות: `createFromTemplate('basic-needs')` → grid set עם לוחות מוכנים
- ייבוא/ייצוא: export → import round-trip, ולידציית מבנה JSON

**Playwright E2E — `tests/gridsets.e2e.ts`:**

- Grid Set Explorer מציג רשימת grid sets
- יצירת grid set חדש → מופיע ב-explorer
- מעבר בין grid sets → home board משתנה
- שכפול grid set → עותק חדש עם שם מעודכן
- ייבוא grid set מ-JSON

---

## שלב 7 — PWA ותמיכה אופליין

**מטרה:** עבודה מלאה ללא אינטרנט.

- [ ] **Service Worker** — caching של אפליקציה + סמלי ARASAAC
- [ ] **Manifest** — install prompt, splash screen, standalone mode
- [ ] **Offline TTS** — fallback לקולות מובנים כשאין אינטרנט
- [ ] **Sync** — סנכרון לוחות כשחוזרים לאינטרנט (אם יש backend)
- [ ] **Precache ARASAAC** — הורדת סמלים מראש לשימוש אופליין

**כלים:** `@vite-pwa/sveltekit`, workbox

---

## שלב 8 — חיבור ל-Backend ואימות

**מטרה:** סנכרון ענן, אימות משתמשים, שיתוף.

- [ ] **חיבור ל-cboard-api** — שימוש ב-API הקיים (~35 endpoints)
- [ ] **אימות** — login/signup (email, Google OAuth)
- [ ] **סנכרון לוחות** — upload/download boards מהשרת
- [ ] **שיתוף** — שליחת לוחות למטפלים/מורים
- [ ] **אנליטיקה** — מעקב שימוש (מילים נפוצות, זמן שימוש)
- [ ] **Google Drive backup** — גיבוי אוטומטי תקופתי של כל הלוחות ל-Drive של המשתמש
- [ ] **הגנה מאובדן נתונים** — התראה אם quota נגמר, auto-download של backup שבועי

**או לחלופין** — Cloudflare D1/KV כ-backend עצמאי.

---

## שלב 9 — תכונות מתקדמות

**מטרה:** תכונות פרימיום ובינה מלאכותית.

- [ ] **חיזוי מילים** — הצעות מילה הבאה מבוססות היסטוריה
- [ ] **AI Fix** — תיקון דקדוק ומשפטים (Claude/GPT)
- [ ] **דקדוק חכם** — נטיית פעלים אוטומטית (זכר/נקבה/רבים)
- [ ] **Message Banking** — הקלטת ביטויים בקול הטבעי
- [ ] **עריכה מרחוק** — מטפלים/משפחה יכולים לערוך לוחות מרחוק
- [ ] **היסטוריית צ'אט** — שמירת שיחות קודמות

---

## שלב 10 — i18n ו-Production

**מטרה:** תמיכה ב-50+ שפות ופריסה.

- [ ] **i18n** — paraglide-sveltekit / inlang לממשק (50+ שפות, JSON מ-Cboard)
- [ ] **ARASAAC multilingual** — חיפוש סמלים בכל שפה
- [ ] **RTL/LTR** — תמיכה מלאה בשתי הכיוונים
- [ ] **Performance audit** — Lighthouse, bundle analysis
- [ ] **Cloudflare Workers deploy** — production deployment עם CI/CD

---

## שלב 2.5 — שימוש בסיסי (לפני Sets/Routing)

**מטרה:** לסגור פערים שחוסמים שימוש אמיתי ע"י הורה/מטפל. חלק מהסעיפים נשענים על הנוכחות של board-management ו-Sets ומבוצעים לצדם.

- [x] **ניהול לוחות מלא** — ראה [board-management.md](board-management.md). יצירה/שינוי שם/שכפול/מחיקה + dropdown ב-TileEditor.
- [x] **אישור בפעולות הרסניות** — modal confirm על reset + מחיקת לוח + מחיקת אוסף. **לא** על מחיקת אריח.
- [ ] **תשתית Undo** — history store עם stack של mutations, toast "בטל" על מחיקה. **נדחה לשלב מאוחר**.
- [x] **Loading state** — skeleton בזמן `store.init()` כדי למנוע flash של ברירת מחדל.
- [x] **Empty states** — לוח ללא אריחים מציג "הוסף אריח". חיפוש ARASAAC ללא תוצאות (כבר חלקית).
- [x] **Edit mode gating** — long-press 600ms על ✏ (PIN נדחה לעתיד).
- [x] **OutputBar — שני כפתורי מחיקה** — ⌫ "מחק אחרון" ו-🗑 "ניקוי" כשני כפתורים נפרדים.
- [x] **Tile.disabled** — שדה בוליאני per-tile להסתרה/השבתה.
- [ ] **כותרת טאב דינמית** — `<title>` מתעדכן לשם הלוח הנוכחי. זמין כשיש routing (שלב B).
- [ ] **Broadcast channel בין טאבים** — סנכרון IndexedDB בין טאבים פתוחים. פחות דחוף.

**פרטים מלאים** ב-[architecture.md §10.5](architecture.md#105-שימוש-בסיסי--דרישות-שחייבות-להיכלל).

---

## סדר עדיפויות מומלץ

| שלב | תיאור                           | תלות    | סטטוס / עדיפות                      |
| --- | ------------------------------- | ------- | ----------------------------------- |
| 1   | ליבה — רינדור, TTS, ניווט       | —       | :white_check_mark: הושלם            |
| 2   | עריכה + IndexedDB               | —       | :white_check_mark: הושלם            |
| 2.5 | שימוש בסיסי + ניהול לוחות       | שלב 2   | :white_check_mark: הושלם (ללא Undo) |
| 3A  | חיפוש סמלים + העלאת תמונה + קול | שלב 2   | :white_check_mark: הושלם            |
| 3B  | הגדרות + PWA                    | שלב 3A  | :white_check_mark: הושלם            |
| 3C  | יצירת לוח + שיפור מצב עריכה     | שלב 2.5 | :white_check_mark: הושלם            |
| 3D  | בחירה מרובה + שכפול + סייד-בר   | שלב 3C  | ממתין                               |
| 3E  | כוונות תקשורתיות (סיידבר ימני)  | שלב 3B  | ממתין                               |
| 4   | נגישות + סריקה                  | —       | בינונית                             |
| 5   | הגדרות מתקדמות + פרופיל         | שלב 3B  | בינונית                             |
| 6   | אוספי לוחות (Sets) + Routing    | שלב 2.5 | גבוהה                               |
| 7   | PWA מתקדם + אופליין             | שלב 3B  | בינונית                             |
| 8   | Backend + אימות + Drive backup  | שלב 6   | נמוכה                               |
| 9   | AI + מתקדם                      | שלב 8   | עתידי                               |
| 10  | i18n + Production               | שלב 8   | עתידי                               |

## אימות

- כל שלב מסתיים ב-`npm run check` + `bun run lint` ללא שגיאות
- שלבים 2-6 כוללים בדיקה ידנית + Playwright tests חדשים
- deploy ל-Cloudflare Workers אחרי כל שלב

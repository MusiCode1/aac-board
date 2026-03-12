# AAC Board — יומן פיתוח (Walkthrough)

## 2026-03-12 22:45

### שלב 3A — חיפוש סמלים ARASAAC, העלאת תמונה, והגדרות קול TTS

מימוש שלב 3A: חיפוש סמלים חי מ-ARASAAC API בתוך עורך האריח, העלאת תמונה מקומית, ובורר קול TTS עם הגדרות מהירות וגובה.

#### מה בוצע?

**1. שירות חיפוש ARASAAC — `src/lib/services/arasaac.ts` (חדש)**

- `searchPictograms(keyword, lang, signal)` — חיפוש סמלים מ-API עם cache session-level ותמיכה ב-AbortSignal
- `pictogramUrl(id, size)` — helper לבניית URL של פיקטוגרמה (מחליף את `pic()` הפנימי ב-`boards.ts`)
- Cache ב-`Map<string, ArasaacResult[]>` מונע קריאות כפולות לאותה מילת חיפוש

**2. חיפוש סמלים והעלאת תמונה ב-TileEditor**

- סקציית "תמונה / סמל" חדשה עם שדה חיפוש ו-debounce 300ms
- רשת תוצאות (עד 24 thumbnails של 56px) עם גלילה אנכית
- לחיצה על סמל → עדכון ה-preview בזמן אמת
- כפתור "העלה" — `FileReader.readAsDataURL()` להמרת תמונה ל-base64
- אזהרה מוצגת אם תמונה > 500KB
- ה-preview tile מציג את התמונה הנבחרת/שהועלתה מיידית

**3. הגדרות קול TTS**

- `getTtsSettings()` / `saveTtsSettings()` — שמירת הגדרות ב-localStorage
- `getHebrewVoices()` — סינון קולות עבריים מ-Web Speech API
- `speak()` — קורא הגדרות שמורות במקום ערכים hardcoded
- סקציית "הגדרות קול" ב-TileEditor: dropdown קולות, sliders מהירות/pitch, כפתור "נסה קול"
- `onvoiceschanged` event לטעינה אסינכרונית של קולות (Chrome)

**4. ניקוי**

- `+page.svelte` — שימוש ב-`pictogramUrl(6009)` במקום URL hardcoded ב-`handleAddTile`

#### החלטות ארכיטקטורה

- **localStorage עבור TTS (לא IndexedDB)**: הגדרות TTS נשמרות ב-localStorage כי הן נקראות סינכרונית בכל `speak()`. בשלב 3B ייווצר settings store עם IndexedDB ומיגרציה אוטומטית.
- **AbortSignal בחיפוש**: כל חיפוש חדש מבטל את הקודם כדי למנוע race conditions כשהמשתמש מקליד מהר.
- **Cache session-level ב-Map**: מספיק כי סמלי ARASAAC לא משתנים תוך session, ואין צורך ב-persist בין sessions.
- **base64 לתמונות מועלות**: פשוט ל-persist ב-IndexedDB (נשמר ישירות עם ה-Tile). אזהרה על 500KB כי תמונות גדולות מאיטות את הסריאליזציה.

---

## 2026-03-12 21:00

### תיקון שמירה מקומית, הצגת אריחים מוסתרים, ושיפורי UX

תיקון באג קריטי בשמירה ל-IndexedDB, הוספת תצוגה מקדימה לאריחים מוסתרים, והתאמת ה-grid להסתרה נכונה.

#### מה בוצע?

**1. תיקון שמירה ל-IndexedDB ($state.snapshot)**

- שינויים לא נשמרו בין ריענונים — הבאג הקריטי ביותר בפרויקט עד כה
- כל קריאות `saveBoard` ו-`saveAllBoards` עודכנו לעטוף ב-`$state.snapshot()` לפני שמירה
- הסיבה: Svelte 5 `$state` יוצר Proxy objects, ו-IndexedDB structured clone algorithm לא יודע לסריאלז Proxies

**2. הסתרת אריחים חורגים (visibleTiles)**

- Board מרנדר רק `rows × columns` אריחים (`visibleTiles = board.tiles.slice(0, gridCapacity)`)
- במקום הסתרה ב-CSS (`overflow: hidden`) שלא עבדה כי CSS Grid יוצר implicit rows
- אריחים עודפים נשמרים בנתונים אך לא ב-DOM

**3. תצוגת אריחים מוסתרים (showOverflow toggle)**

- כפתור עין ב-EditToolbar מאפשר הצגה/הסתרה של האריחים החורגים
- אריחים מוסתרים מוצגים מעומעמים (opacity 0.45 + grayscale) מתחת לקו מפריד כתום
- הרשת עוברת למצב גלילה (`overflow-y: auto`, `grid-template-rows: auto`)
- prop `dimmed` חדש ב-Tile לעיצוב מעומעם

**4. שיפורי EditToolbar**

- כפתור toggle עם אייקון עין/עין חסומה
- מצב active כתום כשהאריחים המוסתרים מוצגים
- כפתור "מחק" (קוצר מ-"מחק עודפים") לממשק נקי יותר

#### החלטות ארכיטקטורה

- **`$state.snapshot()` vs `structuredClone()`**: נבחר `$state.snapshot()` כי הוא ה-API הרשמי של Svelte 5 להמרת Proxy לאובייקט רגיל, יעיל יותר מ-`structuredClone` כי הוא יודע לדלג על ה-Proxy layer ישירות
- **רינדור מוגבל vs CSS overflow**: נבחר `slice(0, capacity)` ב-JS על פני `overflow: hidden` ב-CSS כי CSS Grid יוצר implicit rows לאריחים שחורגים מהרשת המוגדרת, מה שגורם להם להיראות למרות ה-overflow

#### מעקפים ופתרונות

- **Svelte 5 $state Proxy + IndexedDB**: ה-`catch` ב-`persist()` בלע את שגיאת ה-structured clone בשקט. פתרון: `$state.snapshot(board)` לפני כל שמירה. זה רלוונטי לכל מקום שמעביר `$state` ל-APIs חיצוניים (IndexedDB, postMessage, Web Workers)

## 2026-03-12 20:15

### שלב 2 (חלק 2) — גרירה ושחרור, סרגל עריכה, ייצוא/ייבוא, ובדיקות E2E

השלמת שלב 2: תמיכה מלאה בגרירת אריחים (דסקטופ + מגע), סרגל כלים לעריכה, ייצוא/ייבוא JSON, ניהול אריחים מוסתרים, ו-8 בדיקות E2E.

#### מה בוצע?

**1. Drag & Drop עם ghost מותאם אישית**

- HTML5 Drag API לדסקטופ + Touch Events (long-press 400ms) למסך מגע
- Ghost element אחיד לשתי השיטות: `cloneNode(true)` + `position: fixed` עוקב אחרי הסמן/אצבע
- בדסקטופ — `setDragImage` עם תמונת 1x1 שקופה מסתיר את ה-ghost המובנה של הדפדפן
- `elementFromPoint` + `data-tile-index` לזיהוי יעד ההנחה בגרירת touch
- Haptic feedback (`navigator.vibrate`) בתחילת גרירת touch
- מצבי CSS ויזואליים: `dragging` (opacity 0.4), `drag-over` (גבול כחול + scale 1.05)

**2. סרגל כלים לעריכה (EditToolbar)**

- `src/lib/components/EditToolbar.svelte` — רכיב חדש, מופיע רק במצב עריכה
- Stepper לשורות (1-10) ועמודות (1-12)
- כפתורי: הוסף אריח, ייצוא JSON, ייבוא JSON, איפוס לברירת מחדל
- עיצוב gradient כתום בהתאם למצב עריכה

**3. ייצוא/ייבוא JSON**

- ייצוא: יוצר blob JSON עם שם קובץ מבוסס תאריך (`aac-boards-YYYY-MM-DD.json`)
- ייבוא: input file מוסתר, קורא JSON ומעדכן את ה-store + IndexedDB

**4. ניהול אריחים מוסתרים**

- כשהרשת מוקטנת — אריחים שמעבר לקיבולת נשמרים בנתונים אך לא מוצגים
- אינדיקטור כתום מופיע ב-EditToolbar עם מספר האריחים המוסתרים
- כפתור "מחק עודפים" — מחיקת אריחים מעבר לקיבולת הרשת
- `trimTilesToGrid()` ב-store

**5. בדיקות Playwright E2E (8 טסטים)**

- `tests/edit-mode.e2e.ts` — toggle edit mode, TileEditor, grid resize, add tile, desktop drag, export, hidden tiles, touch drag
- בדיקת touch: browser context נפרד עם `hasTouch: true` + synthetic TouchEvent
- השבתת wobble animation ב-CSS inject לייצוב אלמנטים בטסטים

**6. עדכון Roadmap**

- כל המשימות (שלבים 2-10) סומנו ב-checkboxes
- כל משימות שלב 2 סומנו כ-`[x]`

#### החלטות ארכיטקטורה

- **HTML5 Drag API + Touch Events נייטיב vs ספרייה חיצונית**: נבחר מימוש עצמי כי ספריות כמו svelte-dnd-action לא תומכות ב-Svelte 5 runes, והצורך פשוט (swap בין שתי מיקומים)
- **Long-press 400ms**: סף סטנדרטי למובייל — קצר מספיק לחוויה חלקה, ארוך מספיק למנוע גרירה מקרית
- **Ghost אחיד desktop+touch**: `setDragImage` עם תמונה שקופה 1x1 מבטל את ה-ghost המובנה של הדפדפן, ובמקומו מוצג clone מותאם עם צל ושקיפות — חוויה זהה בשתי הפלטפורמות
- **הסתרה vs מחיקה בהקטנת רשת**: אריחים נשמרים בנתונים אך לא מוצגים (overflow hidden) — בטוח יותר מאשר מחיקה אוטומטית, המשתמש בוחר אם למחוק

#### מעקפים ופתרונות

- **אריחים נעלמים בכניסה למצב עריכה**: אנימציית `tile-wobble` דרסה את `tile-enter` שהתחיל מ-`opacity: 0`. פתרון: הוספת `opacity: 1` ל-`.tile.editing`
- **Playwright "element is not stable"**: אנימציית wobble גרמה לאריחים לזוז ברציפות. פתרון: inject של CSS `animation: none !important` בטסטים
- **Playwright touch — "hasTouch must be enabled"**: יצירת browser context נפרד עם `{ hasTouch: true }` במקום שימוש ב-page ברירת מחדל

## 2026-03-12 19:00

### שלב 2 (חלק 1) — מצב עריכה, CRUD, ושמירה מקומית

מימוש תשתית עריכת לוחות: edit mode, עריכת/מחיקת אריחים, ושמירה אוטומטית ב-IndexedDB.

#### מה בוצע?

**1. שירות שמירה מקומית (IndexedDB)**

- `src/lib/services/storage.ts` — שירות חדש עם `idb-keyval` (~600 bytes)
- פעולות: `saveBoard`, `loadAllBoards`, `deleteBoard`, `exportBoardsJSON`, `importBoardsJSON`, `clearAllBoards`
- אינדקס מזהי לוחות נשמר בנפרד לטעינה מהירה

**2. שדרוג board store עם CRUD**

- `allBoards` — מילון לוחות מלא (מוטבל, נטען מ-IndexedDB או defaults)
- `init()` — טוען לוחות שמורים, או שומר defaults בפעם הראשונה
- פעולות אריחים: `updateTile`, `addTile`, `removeTile`, `reorderTiles`
- פעולות לוח: `updateBoard`, `createBoard`, `deleteBoard`, `resetToDefaults`, `importBoards`
- auto-persist — כל שינוי נשמר אוטומטית ל-IndexedDB

**3. מצב עריכה (Edit Mode)**

- כפתור עט/V ב-NavBar עם toggle
- NavBar משנה צבע לכתום במצב עריכה
- אריחים מציגים תג עריכה כתום + אנימציית wobble
- לחיצה על אריח במצב עריכה פותחת את TileEditor (במקום TTS)

**4. דיאלוג עריכת אריח (TileEditor)**

- `src/lib/components/TileEditor.svelte` — דיאלוג modal חדש
- עריכת: תווית, צבע רקע (10 presets + color picker), צבע גבול, סוג (כפתור/תיקייה)
- תצוגה מקדימה חיה של האריח
- כפתורי שמור/ביטול/מחק
- סגירה עם Escape או לחיצה על הרקע

**5. תוכנית פיתוח ארוכת טווח**

- `docs/plans/roadmap.md` — 10 שלבים מ-edit mode ועד production
- תלויות, סדר עדיפויות, וקבצים עיקריים לכל שלב

#### החלטות ארכיטקטורה

- **idb-keyval vs Dexie**: נבחר idb-keyval בגלל גודל זעיר (~600B) ו-API פשוט. מספיק לשלב הנוכחי, אפשר לשדרג ל-Dexie בעתיד אם צריך queries מורכבים
- **allBoards מוטבל**: הלוחות נשמרים ב-`$state` מוטבל במקום ב-const, כדי לאפשר עריכה ושמירה דינמית
- **auto-persist**: כל פעולת CRUD שומרת אוטומטית ל-IndexedDB, ללא כפתור "שמור" מפורש

## 2026-03-12 18:00

### תיקון מזהי פיקטוגרמות ARASAAC

כל 62 מזהי הפיקטוגרמות בלוחות תוקנו לאחר שנמצא שהמזהים המקוריים היו שגויים (28 לא קיימים כלל, 34 הצביעו על סמלים לא נכונים).

#### מה בוצע?

**1. אימות מול ARASAAC API**

- הורד אינדקס מלא של 13,717 פיקטוגרמות מ-`https://api.arasaac.org/api/pictograms/all/he`
- כל מזהה בלוח נבדק מול האינדקס — אף אחד מ-62 המזהים לא היה נכון
- חיפוש מזהים נכונים לפי מילת מפתח בעברית, כולל חלופות למילים שלא נמצאו ישירות

**2. תיקון `boards.ts`**

- כל 62 מזהי `pic()` הוחלפו במזהים מאומתים
- כל ה-URLs החדשים נבדקו מול שרת התמונות (HTTP 200)
- תוקנה גם תווית "אני אוהב" ל-"אוהב" (התאמה למילת המפתח ב-ARASAAC)

#### מעקפים ופתרונות

- **מילים שלא נמצאו ישירות**: "רוצה" → `לרצות` (5441), "מוזיקה" → `מוסיקה` (24791), "רכיבה" → `רכיבה על אופניים` (9698), "נהנה" → `הנאה` (8582), "ספרייה" → `ספריה` (3065)

## 2026-03-12 17:30

### שיפורי עיצוב ואנימציות — שלב 1

שדרוג חזותי ואנימציות לכל רכיבי הממשק של הלוח: אריחים, סרגל פלט, וניווט.

#### מה בוצע?

**1. אנימציות אריחים (Tile)**

- אנימציית כניסה מדורגת (staggered): fade-in + slide-up עם delay לפי אינדקס (30ms × i)
- אנימציית pulse בלחיצה: הבהוב box-shadow בצבע הגבול
- אפקט hover: הגבהה עדינה (translateY -3px) עם צל מוגבר
- תג תיקייה: SVG icon בעיגול צבעוני במקום emoji, עם גבול מקווקו פנימי

**2. מעברי לוח (Board)**

- אנימציית slide-left כשנכנסים לתיקייה, slide-right כשחוזרים אחורה
- מעקב אחרי כיוון ניווט (navDirection) ב-store
- שימוש ב-`{#key board.id}` לטריגור האנימציות

**3. סרגל פלט (OutputBar)**

- Svelte transitions: fly לפריטים חדשים, fade להסרה, flip לסידור מחדש
- תמונות גדולות יותר (36px), טקסט עם font-weight 500
- אפקט hover אדמדם (רמז להסרה)
- SVG icons במקום emoji לכפתורי דיבור וניקוי
- רקע gradient עדין

**4. ניווט (NavBar)**

- רקע gradient כחול (3 גוונים) עם backdrop-filter
- SVG icons לכפתורי בית וחזור (במקום emoji/text)
- Breadcrumbs: שביל ניווט מלא (בית ‹ אוכל ‹ ...)
- מעקב אחרי breadcrumbs ב-store

#### החלטות ארכיטקטורה

- **CSS animations vs Svelte transitions לאריחים**: נבחרו CSS keyframes כי האריחים לא נוספים/מוסרים מה-DOM אלא תמיד קיימים — Svelte transitions דורשים `{#if}` או `{#each}` שמשתנה
- **כיוון ניווט ב-store**: navDirection נשמר ב-store ולא ב-component כדי שה-Board ידע אם להציג slide-left או slide-right

## 2026-03-12 04:15

### אתחול פרויקט SvelteKit + תשתית פיתוח

הקמת שלד הפרויקט עם כל כלי הפיתוח הנדרשים.

#### מה בוצע?

**1. אתחול פרויקט SvelteKit**

- נוצר פרויקט SvelteKit חדש עם TypeScript ו-bun כ-package manager
- Svelte 5 עם runes מופעל (דרך `vitePlugin.dynamicCompileOptions`)
- SvelteKit adapter: Cloudflare Workers (`@sveltejs/adapter-cloudflare`)
- מבנה ראשוני: `src/routes/+page.svelte`, `src/lib/`, `src/routes/demo/`

**2. כלי פיתוח ותשתית**

- **Build**: Vite 7 + SvelteKit
- **Styling**: Tailwind CSS 4
- **Linting**: ESLint 9 + eslint-plugin-svelte + typescript-eslint
- **Formatting**: Prettier + prettier-plugin-svelte + prettier-plugin-tailwindcss
- **Unit Testing**: Vitest 4 + vitest-browser-svelte (עם דוגמאות ב-`src/lib/vitest-examples/`)
- **E2E Testing**: Playwright (עם דוגמה ב-`src/routes/demo/playwright/`)
- **Deployment**: Cloudflare Workers (קונפיגורציה ב-`wrangler.jsonc`)
- **MCP**: קובץ `.mcp.json` מוגדר

**3. תיעוד ותכנון**

- מסמך הערכת המעבר מ-Cboard הועבר ל-`docs/plans/cboard-sveltekit-evaluation.md`
- נוצר `CLAUDE.md` עם הקשר הפרויקט, Tech Stack, ומושגי AAC

#### החלטות ארכיטקטורה

- **Cloudflare Workers**: נבחר כפלטפורמת deployment (edge computing, ביצועים גבוהים, עלות נמוכה)
- **Svelte 5 Runes**: הפעלה אוטומטית של runes לכל הקבצים שאינם ב-node_modules
- **Tailwind CSS 4**: גרסה חדשה עם Vite plugin ישיר (`@tailwindcss/vite`)
- **bun**: נבחר כ-package manager (מהיר יותר מ-npm/pnpm)

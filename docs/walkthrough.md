# AAC Board — יומן פיתוח (Walkthrough)

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

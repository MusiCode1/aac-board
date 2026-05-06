# סיכום סקירת קוד — פיצ'ר ניהול אוספים ולוחות

**תאריך:** 2026-05-06 14:09
**ענף:** `feat/cache-proxy-client-phase-1`
**HEAD בזמן הסקירה:** `f756173`
**שלב ב-roadmap:** שלב 6 Phase C — ממשק ניהול אוספים ולוחות (לפני merge ל-`dev`)
**כותב הסקירה:** Claude (סוכן בדיקות)

> **הקשר:** המסמך הזה נכתב בסוף סשן בדיקות ביקורתי לפני merge של הענף `feat/cache-proxy-client-phase-1` ל-`dev`. הוא מיועד לסוכן הקוד שיטפל בתיקונים בסשן נפרד. אם אתה קורא את המסמך אחרי שמיזגנו את הענף או אחרי שהקבצים שהוזכרו השתנו — בדוק קודם את ההיסטוריה של `src/lib/stores/sets.svelte.ts` ושל `src/lib/stores/board.svelte.ts` כדי לוודא שהבאגים עוד רלוונטיים.

---

## סטטוס הקבצים שיצרתי / שיניתי בסשן

```
src/lib/stores/sets.svelte.spec.ts   (חדש — 22 בדיקות יחידה)
tests/sets.e2e.ts                    (הורחב מ-3 ל-10 בדיקות)
```

**לא בוצעו קומיטים.** הקבצים יושבים על הענף כשינויים לא-מקומיטים. הסוכן שיטפל בתיקונים ימצא:

- את הבדיקות שכבר נכתבו (משמשות כ-spec של ההתנהגות הרצויה).
- 6 בדיקות יחידה שנכשלות (DUP1–DUP5 + M0) ובדיקת e2e אחת שנכשלת ("duplicates a set...") — כל אחת מהן מתעדת באג מסוים.

---

## חלק 1 — מצב הקוד

### באגים שנחשפו (ע"י הבדיקות שכתבתי)

#### 🔴 חמורים — חוסמים merge ל-`dev` עד תיקון

**באג A — `duplicateSet` נכשל ב-production עקב `structuredClone` על Svelte $state Proxy**

מיקום: `src/lib/stores/sets.svelte.ts:136`

```ts
const cloned = structuredClone(sourceBoard) as Board;  // ❌
```

`sourceBoard` הוא איבר של `$state` Proxy של `boardStore.allBoards`. `structuredClone` לא יכול לשכפל Proxy וזורק `DataCloneError`. ההשפעה: **כפתור "שכפל" באקספלורר האוספים לא עושה כלום** (אומת ב-e2e — אחרי לחיצה על "שכפל", רשימת האוספים נשארה עם איבר אחד).

תיקון מומלץ: `structuredClone($state.snapshot(sourceBoard) as Board)` — בדיוק כמו ש-`board.svelte.ts:279` עושה ב-`duplicateBoard`.

**מאומת ע"י**:

- `tests/sets.e2e.ts` — בדיקה "duplicates a set with...":
  `Locator: locator('.set-card', { hasText: 'האוסף שלי (עותק)' })` — לא נמצא
- `src/lib/stores/sets.svelte.spec.ts` — בדיקות DUP1, DUP2, DUP3, DUP4, DUP5 — כולן זורקות `DataCloneError`

---

**באג B — `runMigration()` משאיר `boardStore` בזיכרון לא-מסונכרן עם IDB**

מיקום: `src/lib/stores/sets.svelte.ts:177-205` (פונקציית `runMigration`)

הקוד טוען את הלוחות, מעדכן את `setId` שלהם, ושומר ל-IDB — אבל **לא מעדכן את ה-state בזיכרון של `boardStore.allBoards`**. זה לא בא לידי ביטוי ב-app בפועל כי `BoardApp.svelte:38-44` קורא ל-`boards.init()` מיד אחרי `sets.init()`, וזה טוען מ-IDB את הנתונים המעודכנים.

ההשפעה הנוכחית: `resetToDefaults()` יוצר בעיה דקה — ה-state בזיכרון לא נכון בין הקריאה ל-`init()` לקריאה ל-`boards.init()` שאחריו (לא מתרחש בפועל ב-`resetToDefaults`, ולכן אין flicker בעבודה הרגילה, אבל זה זרז לבעיות עתידיות).

תיקון מומלץ: בסיום `runMigration`, להוסיף `await boardStore().importBoards(storedBoards)` או לחלופין לקרוא ל-`store.init()` מתוך `runMigration` (אבל זה יוצר circular dep כי `boards.init` בודק `loadAllBoards`).

**מאומת ע"י**: `M0 — KNOWN ISSUE` ב-spec.

---

#### 🟠 בינוניים — לא חוסמים merge, כדאי לטפל בקרוב

**באג C — `deleteSet` משתמש ב-`importBoards` שיש לו תופעות לוואי מיותרות**
`sets.svelte.ts:106` — `importBoards` עושה `saveAllBoards` של _כל_ הלוחות שנשארו (שכבר שמורים), ומאתחל את `currentBoard` אגרסיבית (קופץ ל-`HOME_BOARD_ID` הקשיח). פתרון: להוסיף ב-`board.svelte.ts` `bulkRemoveBoards(ids)` שעושה רק `del()` על המפתחות הרלוונטיים בלי `saveAllBoards`.

**באג D — `createSet` לא await על persist הלוח החדש**
`sets.svelte.ts:73` — `boards.createBoard(...)` מתבצע fire-and-forget. תיקון: לחכות בעצמה לשמירה (להחזיר Promise מ-`createBoard`).

**באג E — `duplicateSet` לא מחכה לשמירת הלוחות המשוכפלים**
אותו עיקרון כמו D — `createBoard` בלולאה ב-`sets.svelte.ts:148`.

**באג F — `goHome()` ב-`board.svelte.ts:166` נסמך על `HOME_BOARD_ID` סטטי**
לא נקרא בזרם הראשי החדש (URL routing מתקן), אבל נקרא מ-`BoardManager.svelte:111` בלגאסי-fallback. אם ה-board של ה-`HOME_BOARD_ID` הקשיח לא קיים באוסף הנוכחי — קפיצה למקום שגוי.

---

#### 🟡 קלים / UX

- **G** — Escape לא נתפס במודאלים של `/sets` (גם new/edit וגם confirm-delete) — `BoardManager` כן תופס.
- **H** — אין focus trap באף מודאל; משתמש יכול Tab החוצה.
- **I** — לחיצה על "שכפל" כשנכשל לא נותנת משוב למשתמש (`/sets/+page.svelte:134` מתעלם מערך החזרה).
- **J** — עריכת אוסף עם `formHomeBoardId === ''` שולחת `homeBoardId: undefined` — אפשרי לעקוף ולבחור אוסף בלי לוח-בית מוגדר. תיקון: validation ב-`submitModal`.
- **K** — Tile IDs בשכפול משתמשים ב-`Date.now()+Math.random()` במקום `generateId()` (קוסמטי).
- **L** — אזהרת `state_referenced_locally` ב-`board.svelte.ts:25` — קיימת מראש, לא חדש.

---

## חלק 2 — כיסוי בדיקות חדש

### Vitest — `src/lib/stores/sets.svelte.spec.ts` (חדש, 22 בדיקות)

| בדיקה                                | מצב          | מטרה              |
| ------------------------------------ | ------------ | ----------------- |
| M0 — boardStore↔IDB sync after migration | ❌ FAIL      | חושפת באג B       |
| M1 — מיגרציה יוצרת set + 5 לוחות ב-IDB | ✅           |                   |
| CS1 — createSet יוצר home board 4×5  | ✅           |                   |
| CS2 — createSet שומר ל-IDB           | ✅           |                   |
| CS3 — createSet שומר את הלוח (race)  | ✅           | (עם 50ms delay)   |
| US1, US2, US3, US4 — updateSet       | ✅ (4)       |                   |
| SD1 — setDefault                     | ✅           |                   |
| DS1 — לא מוחק set אחרון              | ✅           |                   |
| DS2 — מחיקת set מסירה את לוחותיו     | ✅           |                   |
| DS2b — מחיקת set אחר לא נוגעת בלוחות שלי | ✅       |                   |
| DS3 — defaultSetId מתחלף אחרי מחיקה  | ✅           |                   |
| DUP1, DUP2, DUP3, DUP4, DUP5 — duplicateSet | ❌ FAIL (5) | חושפים באג A      |
| DUP6 — שכפול אוסף ריק → null         | ✅           |                   |
| DUP7 — שכפול source לא קיים → null   | ✅           |                   |
| R1 — resetToDefaults                 | ✅           |                   |

**סה"כ: 16 ✅ / 6 ❌** — כל הכישלונות חושפים באגים אמיתיים.

> **הערה ל-`freshInit()` ב-spec**: ה-helper עושה `await clear()` → `sets.resetToDefaults()` → `boards.importBoards(reloaded)`. ה-`importBoards` בסוף הוא **מעקף ידני** של באג B — בלעדיו הבדיקות שאינן בודקות באג B עצמן ייכשלו ברעש (כי ה-state בזיכרון לא מסונכרן). אחרי שתתקן את באג B, אפשר להסיר את שורת ה-`importBoards` מ-`freshInit` (וגם להעביר את בדיקת M0 לבדוק את ההתנהגות המתוקנת).

### Playwright E2E — `tests/sets.e2e.ts` (הורחב מ-3 ל-10 בדיקות)

| בדיקה                                       | מצב                       |
| ------------------------------------------- | ------------------------- |
| מציג sets explorer                          | ✅ (קיים)                 |
| יצירת set חדש                               | ✅ (קיים)                 |
| יצירת לוח מהדשבורד                          | ✅ (קיים)                 |
| **שכפול set**                               | ❌ FAIL — חושף באג A      |
| **מחיקת set**                               | ✅                        |
| **כפתור "מחק" disabled על set אחרון**       | ✅                        |
| **"הפוך לברירת מחדל" + ניווט ל-/**          | ✅                        |
| **עריכת שם + לוח-בית**                      | ✅                        |
| **breadcrumb קליקבילי**                     | ✅                        |
| **"הפוך לבית" מ-BoardManager**              | ✅                        |

**סה"כ: 9 ✅ / 1 ❌**

### בדיקות שלא כתבתי (כדאי בעתיד)

- **deleteBoard של לוח בית של אוסף** — מה ההתנהגות? (`board.svelte.ts:347` עושה fallback ל-`HOME_BOARD_ID` קשיח, לא ל-home של האוסף).
- **race condition** ב-`createSet` (באג D/E) — קשה לבדוק בלי לזרז artificially.
- **עריכת אוסף בו-זמנית מ-2 tabs** — ה-state בזיכרון לא יסתנכרן.
- **a11y / focus trap / Escape** — בדיקות קצרות.

---

## חלק 3 — אסטרטגיה ל-`settings.e2e.ts` הכושלות

הבעיה: `getModelsForProvider` ב-`tts.ts` קורא ל-`/v1/voices` של הפרוקסי כשזה זמין, ומחזיר רשימה דינמית. הבדיקות הקיימות מצפות לרשימה סטטית (2 מודלים ל-Gemini, `eleven_multilingual_v2` ל-ElevenLabs).

**שלוש אפשרויות:**

1. **Mock ה-fetch** ב-`beforeEach` — `await page.route('**/v1/voices', ...)` כדי שהבדיקה לא תפנה לפרוקסי האמיתי. **(מומלץ)** הכי יציב, לא תלוי בזמינות הפרוקסי.

2. **לאפס `VITE_PROXY_URL` בזמן הבדיקה** — להפעיל את הבדיקה כשהפרוקסי לא נגיש (לדוגמה `VITE_PROXY_URL=http://localhost:0`), כך ה-fetch ייכשל ו-`refreshModels` יחזיר `[]`. אבל אז הבדיקה לא תוכל לבדוק את הזרם החיובי בכלל.

3. **לעדכן את הבדיקה** — להחליף `toHaveCount(2)` ב-`toBeGreaterThanOrEqual(2)`, ו-`toHaveValue('eleven_multilingual_v2')` להישאר כי זה אכן ה-default. זה הפתרון המינימלי, אבל מטשטש את ההבדל בין "מודלים נטענו מהפרוקסי" ל-"לא נטענו".

**ההמלצה שלי**: אפשרות 1 (mock עם `page.route`) — נשמר את כוונת הבדיקה (לוודא שה-UI מציג את ה-default models הסטטיים) ובאותו זמן יציבה.

---

## חלק 4 — המלצה לגבי merge ל-`dev`

### **❌ לא ממליץ למזג עכשיו.**

הבסיס לפיצ'ר חזק והארכיטקטורה נכונה, אבל באג A (`duplicateSet`) הוא רגרסיה ב-production — **המשתמש לא יכול לשכפל אוסף דרך ה-UI**. זו פונקציה מרכזית שתועדה ב-walkthrough ויש לה כפתור גלוי.

### תוכנית מומלצת:

1. **תקן באג A** — `$state.snapshot()` ב-`sets.svelte.ts:136`. תיקון של 4 תווים, יחד עם הבדיקה DUP\* שכבר נכתבה.
2. **תקן באג B** או לפחות תעד אותו ב-walkthrough כ-known issue. התיקון פשוט: לקרוא ל-`importBoards(storedBoards)` בסוף `runMigration`. הבדיקה M0 תעבור אחרי, ואז אפשר להסיר את המעקף הידני ב-`freshInit()` של ה-spec (ראה הערה למעלה).
3. **שקול תיקון באגים C–F** — הם פחות דחופים ויכולים לחכות לפיצ'ר נפרד.
4. **רוץ:** `bun run test:unit -- --run` ו-`bunx playwright test tests/sets.e2e.ts` — ודא הכל ירוק (חוץ מ-2 הבדיקות הידועות ב-`settings.e2e.ts`).
5. **לאחר תיקון**: merge **fast-forward** ל-`dev` (הענף קדימה ב-20 קומיטים בקו ישר, אין divergence).

### מה כן בסדר במצב הנוכחי

- Type-check עובר (0 שגיאות, 1 אזהרה ידועה ב-`board.svelte.ts:25`).
- 38/40 e2e baseline עוברות (2 כושלות ידועות ב-`settings.e2e.ts`, לא קשורות).
- 24/24 unit tests baseline עוברות.
- האקספלורר, הדשבורד, יצירה, מחיקה, ברירת-מחדל, עריכה, ניווט, "הפוך לבית" — **כולם עובדים** באומת בבדיקות e2e אמיתיות.

---

## הצעת קומיטים (לסוכן הקוד)

אחרי תיקון הבאגים והרצת הבדיקות, מומלץ לפצל לקומיטים נושאיים. הסוכן הבא יכול להשתמש בסקיל `commit` של הפרויקט (`.agents/skills/commit`).

```
(aac-board): תיקון structuredClone על $state Proxy ב-duplicateSet
(aac-board): סנכרון boardStore עם IDB בסיום runMigration
(aac-board): בדיקות יחידה ל-setsStore — כיסוי מלא לפעולות הציבוריות
(aac-board): הרחבת בדיקות e2e לאוספים — שכפול, מחיקה, breadcrumb, "הפוך לבית"
```

(שתי הקומיטים הראשונים — תיקוני קוד; השני זוג — קבצי בדיקות שכבר קיימים על הענף ללא קומיט.)

# סיכום סקירת קוד — פיצ'ר ניהול אוספים ולוחות

**תאריך התחלה:** 2026-05-06 14:09
**תאריך עדכון אחרון:** 2026-05-06 14:55 (אחרי תיקוני הסוכן + אימות)
**ענף:** `feat/cache-proxy-client-phase-1`
**HEAD בזמן הסקירה הראשונה:** `f756173`
**HEAD אחרי התיקונים:** `914a216` (כולל קומיט תיקון `dc62e4d` + קומיטים של בדיקות)
**שלב ב-roadmap:** שלב 6 Phase C — ממשק ניהול אוספים ולוחות (לפני merge ל-`dev`)
**כותב הסקירה:** Claude (סוכן בדיקות)

> **הקשר:** המסמך הזה נכתב בסוף סשן בדיקות ביקורתי לפני merge של הענף `feat/cache-proxy-client-phase-1` ל-`dev`. עודכן אחרי שסוכן קוד נפרד תיקן חלק מהבאגים שזוהו. אם אתה קורא את המסמך אחרי שמיזגנו את הענף או אחרי שהקבצים שהוזכרו השתנו — בדוק קודם את ההיסטוריה של `src/lib/stores/sets.svelte.ts` ושל `src/lib/stores/board.svelte.ts` כדי לוודא שהבאגים עוד רלוונטיים.

---

## 🟢 סטטוס נוכחי (עדכון 2026-05-06 14:55)

### תוקנו בקומיט `dc62e4d` ואומתו

| באג | תיאור | מה תוקן | אימות |
|---|---|---|---|
| **A** | `structuredClone` על `$state` Proxy ב-`duplicateSet` (חוסם — שכפול לא עבד מה-UI) | `$state.snapshot()` הוסף ב-`sets.svelte.ts:136` | DUP1–DUP5 ✅ ב-vitest, "duplicates a set" ✅ ב-e2e |
| **B** | `runMigration` משאיר `boardStore` בזיכרון לא-מסונכרן עם IDB | מתודה חדשה `setAllBoards()` ב-`board.svelte.ts`, נקראת מ-`runMigration` | M0 ✅ ב-vitest |
| **D** | `createSet` לא await על persist של הלוח החדש (race) | `createBoard` הפך ל-async, `createSet` עם await | CS3 ✅ ב-vitest |
| **E** | `duplicateSet` לא await על persist של לוחות משוכפלים (race) | await בלולאה ב-`sets.svelte.ts:148` | DUP5 ✅ ב-vitest |

### תוצאות אימות (2026-05-06 14:55, HEAD=`914a216`)

- ✅ `bun run check` — 0 errors, 1 warning ידוע מראש (`board.svelte.ts:25`).
- ✅ Vitest מלא: **46/46 עוברות** (24 baseline + 22 חדשות).
- ✅ E2E של sets ב-single-worker: **10/10 עוברות**.
- ⚠️ E2E של sets ב-multi-worker (default): **9-10/10** — flake חדש שזוהה (ראה למטה).

### 🟡 לא תוקן בקומיט הנוכחי (לא חוסם merge, אבל כדאי לטפל בקרוב)

| באג | תיאור | מיקום | חומרה |
|---|---|---|---|
| **C** | `deleteSet` משתמש ב-`importBoards` עם `saveAllBoards` מיותר ו-reset של `currentBoard` | `sets.svelte.ts:106` | בינוני |
| **F** | `goHome()` ב-`board.svelte.ts` נסמך על `HOME_BOARD_ID` סטטי במקום ה-home של האוסף הנוכחי | `board.svelte.ts:166`, `BoardManager.svelte:111` | בינוני |
| **G** | Escape לא נתפס במודאלים של `/sets` (new/edit + confirm-delete) | `routes/sets/+page.svelte` | UX |
| **H** | אין focus trap באף מודאל; משתמש יכול Tab החוצה | מודאלים בכל הפרויקט | a11y |
| **I** | `setDefault` נקרא **fire-and-forget** מ-onclick (`sets.setDefault(...)` בלי await) — race עם navigation | `routes/sets/+page.svelte:137` | בינוני (מסביר flake שזוהה) |
| **J** | עריכת אוסף עם `formHomeBoardId === ''` עוקפת validation | `routes/sets/+page.svelte:75` | UX |
| **K** | Tile IDs בשכפול משתמשים ב-`Date.now()+Math.random()` במקום `generateId()` | `sets.svelte.ts:143` | קוסמטי |
| **L** | אזהרת `state_referenced_locally` ב-`board.svelte.ts:25` | `board.svelte.ts:25` | קוסמטי (היה לפני הפיצ'ר) |
| **M** | flake ב-multi-worker e2e: `resetApp` עושה `indexedDB.deleteDatabase('keyval-store')` ופוגע ב-DB של worker מקביל | `tests/sets.e2e.ts:3-16` | תשתית בדיקות |

### 🆕 ממצא חדש שזוהה במהלך האימות

**ממצא M — flake ב-Playwright multi-worker**

`tests/sets.e2e.ts:resetApp` קורא ל-`indexedDB.deleteDatabase('keyval-store')`. כל ה-workers משתפים את אותו origin ולכן את אותו DB. כש-worker A מאפס את ה-DB באמצע ריצה של worker B, worker B יכול למצוא state חלקי או ריק. זה גרם לבדיקת "duplicates a set" להיכשל פעם אחת מתוך 4 ריצות.

**אופציות תיקון** (כל אחת לבד מספיקה):
1. `test.describe.configure({ mode: 'serial' })` ב-`sets.e2e.ts` — הכי פשוט, מחייב ריצה סדרתית.
2. שימוש ב-`createStore(uniqueName, 'keyval')` של idb-keyval בכל קובץ בדיקות + שכבת `--workers=1` עבור הקובץ הזה — מורכב יותר.
3. הגדרת `workers: 1` ב-`playwright.config.ts` בלבד עבור bdikot שמשתמשות ב-IDB — דרך אמצע.

הממצא הזה לא קשור לתיקוני הסוכן — היה קיים גם לפני, פשוט לא הופיע בעבר כי הענף לא הריץ את `sets.e2e.ts` ב-multi-worker עם 10 בדיקות.

**ממצא I — `setDefault` fire-and-forget**

ב-`routes/sets/+page.svelte:137`:
```ts
onclick={() => sets.setDefault(item.set.id)}
```
זה מתחיל `Promise` ולא ממתין לו. אם המשתמש (או בדיקה) לוחץ על "הפוך לברירת מחדל" ואז מנווט מיד ל-`/`, ה-`saveDefaultSetId` עוד לא הסתיים, ו-`loadDefaultSetId()` ב-`/+page.svelte` מקבל את הערך הישן. תיקון:
```ts
onclick={async () => await sets.setDefault(item.set.id)}
```
או — עדיף — להוסיף `disabled` למשך הפעולה כדי למנוע לחיצות מקבילות.

---

## 📜 הסקירה המקורית (לפני התיקונים, נשמרת לצורך תיעוד היסטורי)

> מהנקודה הזאת ועד סוף המסמך — כל הסקירה כפי שנכתבה ב-2026-05-06 14:09, לפני שהסוכן ביצע תיקונים. שמרתי את התוכן הזה כי הוא מתעד את הנימוק לכל באג ואת ההמלצות המקוריות.

---

## סטטוס הקבצים שיצרתי / שיניתי בסשן (היסטורי)

```
src/lib/stores/sets.svelte.spec.ts   (חדש — 22 בדיקות יחידה)
tests/sets.e2e.ts                    (הורחב מ-3 ל-10 בדיקות)
```

**לא בוצעו קומיטים בסשן הסקירה.** הסוכן שטיפל בתיקונים מאוחר יותר committed את שני הקבצים בנפרד (קומיטים `d8e0168` ו-`8cc2d91`).

- ב-זמן כתיבת הסקירה: 6 בדיקות יחידה נכשלות (DUP1–DUP5 + M0) ובדיקת e2e אחת נכשלת ("duplicates a set...") — כל אחת מהן מתעדת באג מסוים.
- אחרי תיקוני הסוכן: כל הבדיקות עוברות (חוץ מה-flake ב-multi-worker).

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

## חלק 4 — המלצה לגבי merge ל-`dev` (היסטורי)

> **המלצה מקורית — לא רלוונטית יותר.** הסוכן ביצע את התיקונים שביקשתי, ועכשיו ההמלצה היא ✅ **כן למזג**. ראה את הסקציה "סטטוס נוכחי" בראש המסמך.

### המלצה מקורית: **❌ לא ממליץ למזג עכשיו** (כפי שנכתבה ב-2026-05-06 14:09)

הבסיס לפיצ'ר חזק והארכיטקטורה נכונה, אבל באג A (`duplicateSet`) הוא רגרסיה ב-production — **המשתמש לא יכול לשכפל אוסף דרך ה-UI**. זו פונקציה מרכזית שתועדה ב-walkthrough ויש לה כפתור גלוי.

### תוכנית מומלצת (מקורית):

1. **תקן באג A** — `$state.snapshot()` ב-`sets.svelte.ts:136`. תיקון של 4 תווים, יחד עם הבדיקה DUP\* שכבר נכתבה.
2. **תקן באג B** או לפחות תעד אותו ב-walkthrough כ-known issue. התיקון פשוט: לקרוא ל-`importBoards(storedBoards)` בסוף `runMigration`. הבדיקה M0 תעבור אחרי, ואז אפשר להסיר את המעקף הידני ב-`freshInit()` של ה-spec (ראה הערה למעלה).
3. **שקול תיקון באגים C–F** — הם פחות דחופים ויכולים לחכות לפיצ'ר נפרד.
4. **רוץ:** `bun run test:unit -- --run` ו-`bunx playwright test tests/sets.e2e.ts` — ודא הכל ירוק (חוץ מ-2 הבדיקות הידועות ב-`settings.e2e.ts`).
5. **לאחר תיקון**: merge **fast-forward** ל-`dev` (הענף קדימה ב-20 קומיטים בקו ישר, אין divergence).

---

## ✅ המלצה מעודכנת ל-merge (2026-05-06 14:55, אחרי התיקונים)

### **כן ממליץ למזג עכשיו** (fast-forward).

הסיבות:

1. **Type-check ירוק** (0 errors, 1 warning ידוע מראש).
2. **Vitest מלא: 46/46 ✅** (24 baseline + 22 חדשות).
3. **E2E של sets במצב יציב: 10/10 ✅** (single-worker).
4. **כל 4 הבאגים החמורים תוקנו** בקומיט אחד ברור (`dc62e4d`) עם הודעה מסודרת.
5. **רגרסיה ב-`duplicateSet`** לא יכולה להופיע יותר — יש לה גם unit tests וגם e2e.

### דברים לטפל בהם בסשן הבא (לא חוסמים merge):

- **ממצא M** — flake ב-multi-worker e2e. הכי פשוט: `test.describe.configure({ mode: 'serial' })` ב-`sets.e2e.ts` (עד שמעבירים ל-store ייחודי לכל בדיקה).
- **באג I** — `setDefault` fire-and-forget ב-`routes/sets/+page.svelte:137`. תיקון קצר: לעטוף ב-`async () => await ...`.
- **בדיקות `settings.e2e.ts` הידועות** (2 כושלות מקדמת דנא) — להשתמש ב-`page.route('**/v1/voices', ...)` כדי לבטל את התלות בפרוקסי. ראה חלק 3 למעלה.
- **באגים C, F** — אופטימיזציות ב-store layer. לא חוסמים שום דבר.
- **באגים G, H, J–L** — UX/a11y/קוסמטי.

### מה ירוק ויציב במצב הנוכחי

- Type-check עובר (0 שגיאות, 1 אזהרה ידועה ב-`board.svelte.ts:25`).
- 46/46 unit tests עוברות.
- 10/10 e2e של sets ב-single-worker.
- האקספלורר, הדשבורד, יצירה, מחיקה, **שכפול**, ברירת-מחדל, עריכה, ניווט, "הפוך לבית" — **כולם עובדים** באומת בבדיקות e2e אמיתיות.

---

## הצעת קומיטים (לסוכן הקוד) — היסטורי

> ההצעה הזו נכתבה לפני שהסוכן ביצע את העבודה. בפועל הסוכן בחר לאחד את 4 התיקונים לקומיט אחד (`dc62e4d`) עם הודעה מסודרת שמתעדת כל באג בנפרד. זה מקובל ועדיין מאפשר revert קל אם צריך.

הצעה מקורית:

```
(aac-board): תיקון structuredClone על $state Proxy ב-duplicateSet
(aac-board): סנכרון boardStore עם IDB בסיום runMigration
(aac-board): בדיקות יחידה ל-setsStore — כיסוי מלא לפעולות הציבוריות
(aac-board): הרחבת בדיקות e2e לאוספים — שכפול, מחיקה, breadcrumb, "הפוך לבית"
```

מה שבוצע בפועל:

```
dc62e4d  (aac-board): תיקון structuredClone על $state Proxy ב-duplicateSet  ← מאחד באגים A, B, D, E
d8e0168  (aac-board): בדיקות יחידה ל-setsStore — כיסוי מלא לפעולות הציבוריות
8cc2d91  (aac-board): הרחבת בדיקות e2e לאוספים — שכפול, מחיקה, breadcrumb, "הפוך לבית"
914a216  (aac-board): הוספת דו"ח סקירת קוד לפני merge — שלב 6 Phase C  ← המסמך הזה
```

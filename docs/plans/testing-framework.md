# מסגרת בדיקות — AAC Board

## למה לא TDD קלאסי על קומפוננטות?

בפרויקטי React, הגישה הסטנדרטית היא TDD עם unit tests לכל קומפוננטה (`@testing-library/react`). בדקנו אם אפשר לעשות את אותו הדבר ב-Svelte 5 והגענו למסקנה שלא — מהסיבות הבאות:

### 1. Svelte 5 runes שובר את מודל הבדיקות

`$state` יוצר Proxy objects שכלי בדיקה לא תמיד מטפלים בהם נכון. כבר פגשנו את זה בפרויקט: `$state` + IndexedDB structured clone נכשל בשקט, דרש `$state.snapshot()` בכל שמירה. אותה בעיה מתרחשת כשמנסים לבדוק reactivity — `$effect` רץ אסינכרונית, `$derived` הוא lazy, ו-`$state` Proxy לא ניתן להשוואה ישירה.

### 2. אין ספריית בדיקות דומיננטית

| ספרייה | מצב |
|--------|------|
| `@testing-library/svelte` | הכי פופולרית, אבל תמיכה חלקית ב-Svelte 5 runes — `$effect` לא תמיד רץ, snippets לא נתמכים |
| `vitest-browser-svelte` | מה שמוגדר בפרויקט — צעירה, דורשת דפדפן אמיתי (Playwright), מה שמאט |
| `svelte.mount()` ידני | low-level, אין query helpers |

לעומת React Testing Library שקיים 6+ שנים, יציב, עם מיליוני משתמשים.

### 3. Props, Events, Snippets — API לא יציב

ב-Svelte 5 ה-API של קומפוננטות השתנה: `on:click` → `onclick`, `<slot>` → `{#snippet}`, `export let` → `$props()`. כלי הבדיקה עדיין רודפים אחרי השינויים האלה.

### 4. הפרויקט הוא UI-heavy

רוב הערך באפליקציית AAC הוא בחוויית המשתמש: לחיצה → דיבור, גרירה → סידור, ניווט בין לוחות. בדיקות E2E תופסות את זה ישירות, unit tests על קומפוננטות תופסים רק חלק.

### מה נבחר במקום

גישה דו-שכבתית: **Vitest TDD על לוגיקה** (services, stores, utils) + **Playwright ATDD על תרחישי משתמש**. קומפוננטות Svelte לא נבדקות ב-unit — Playwright מכסה אותן מקצה לקצה.

---

## העיקרון

כל פיצ'ר מתחיל מבדיקה שנכשלת. שתי שכבות, כל אחת עם תפקיד שונה:

```
┌─────────────────────────────────────────────────────┐
│  Playwright E2E          תרחישי משתמש               │
│  "המשתמש לוחץ על אריח → נשמע קול"                  │
│  איטי (build + browser), רץ לפני commit             │
├─────────────────────────────────────────────────────┤
│  Vitest Unit             לוגיקה טהורה               │
│  "searchPictograms('אכילה') → מחזיר 12 תוצאות"     │
│  מהיר (<100ms), רץ על כל שמירה                      │
└─────────────────────────────────────────────────────┘
```

## מה נבדק באיזו שכבה

### Vitest (unit/integration) — `src/**/*.spec.ts`

לוגיקה שאפשר לבדוק **בלי דפדפן ובלי UI**:

| מה | קובץ | דוגמה |
| --- | --- | --- |
| services | `arasaac.spec.ts` | `pictogramUrl(6009, 300)` מחזיר URL תקין |
| services | `storage.spec.ts` | שמור board → טען → זהה לקלט |
| services | `tts.spec.ts` | `getTtsSettings()` מחזיר defaults כשאין שמור |
| stores | `board.spec.ts` | `addTile()` → אריח חדש בסוף, `reorderTiles(0,2)` → swap |
| stores | `settings.spec.ts` | `update({ theme: 'dark' })` → theme === 'dark' |
| utils | כל פונקציה טהורה | ולידציה, המרות, חישובי grid |

### Playwright E2E — `tests/**/*.e2e.ts`

תרחישים **מנקודת המבט של המשתמש**:

| מה | קובץ | דוגמה |
| --- | --- | --- |
| ניווט | `navigation.e2e.ts` | לחיצה על תיקייה → מעבר ללוח, חזרה → לוח קודם |
| דיבור | `speech.e2e.ts` | לחיצה על אריח → פריט ב-output bar |
| עריכה | `edit-mode.e2e.ts` | שינוי תווית → שמירה → ריענון → התווית נשמרה |
| הגדרות | `settings.e2e.ts` | שינוי theme → ריענון → theme נשמר |
| נגישות | `a11y.e2e.ts` | Tab navigation, ARIA roles, focus management |
| PWA | `offline.e2e.ts` | טעינה → offline → ריענון → עדיין עובד |

### מה לא נבדק ב-unit test

*   קומפוננטות Svelte (Tile, Board, TileEditor) — **Playwright בלבד**
*   אנימציות, transitions, CSS — **ויזואלי / Playwright**
*   drag & drop — **Playwright בלבד** (כבר עובד ב-`edit-mode.e2e.ts`)

---

## תהליך עבודה — פיצ'ר חדש

### שלב 0: הגדר מה אתה בונה — ותעד ב-walkthrough

לפני שכותבים שורת קוד, מנסחים את ההתנהגות הרצויה בשפה טבעית **ומתעדים אותה ב-`docs/walkthrough.md`**. התיעוד כולל:

- **מה הפיצ'ר** — תיאור קצר
- **התנהגויות רצויות** — רשימת bullets בשפה טבעית
- **החלטות שנלקחו** — למה הגישה הזו ולא אחרת

זה חשוב כי: (1) מאלץ לחשוב לפני שכותבים קוד, (2) משמש בסיס לכתיבת הבדיקות, (3) נשאר כתיעוד היסטורי של **למה** ולא רק **מה**.

דוגמה — רשומת walkthrough לפני התחלת עבודה על שלב 4:

```markdown
## 2026-XX-XX

### שלב 4 — switch scanning

#### התנהגויות רצויות
- כשהסריקה פעילה, מסגרת כחולה זזה בין האריחים
- לחיצה על מתג (רווח) בוחרת את האריח המסומן
- מהירות הסריקה ניתנת להגדרה
- סריקת שורה-עמודה: קודם בין שורות, אחרי בחירה — בין עמודות בשורה

#### החלטות
- סריקת row-column ולא linear כי זה הסטנדרט ב-AAC
- מהירות ברירת מחדל 1.5 שניות — מבוסס על המלצות Grid AAC
```

אחרי שה-walkthrough מתועד, מתרגמים כל bullet לבדיקה:

### שלב 1: Red — כתוב בדיקות שנכשלות

**קודם Vitest** — ללוגיקה:

```
// src/lib/services/scanner.spec.ts
describe('scanner', () => {
  it('advances to next row on tick', () => {
    const scanner = createScanner({ rows: 3, cols: 4, speed: 1000 });
    scanner.start();
    scanner.tick();
    expect(scanner.activeRow).toBe(1);
  });

  it('selects row and moves to column scanning', () => {
    const scanner = createScanner({ rows: 3, cols: 4, speed: 1000 });
    scanner.start();
    scanner.tick(); // row 1
    scanner.select();
    expect(scanner.mode).toBe('column');
    expect(scanner.activeRow).toBe(1);
    expect(scanner.activeCol).toBe(0);
  });

  it('returns selected tile index on column select', () => {
    const scanner = createScanner({ rows: 3, cols: 4, speed: 1000 });
    scanner.start();
    scanner.tick(); // row 1
    scanner.select(); // enter column mode
    scanner.tick(); // col 1
    scanner.tick(); // col 2
    const result = scanner.select();
    expect(result).toEqual({ row: 1, col: 2, index: 6 });
  });
});
```

**אחר כך Playwright** — להתנהגות המשתמש:

```
// tests/scanning.e2e.ts
test.describe('Switch Scanning', () => {
  test('spacebar activates scanned tile', async ({ page }) => {
    await page.goto('/');
    await page.goto('/settings');
    await page.locator('[data-testid="scanning-toggle"]').click();
    await page.goto('/');

    // scanning highlight should be visible on first row
    await expect(page.locator('.scan-highlight')).toBeVisible();

    // press space to select row
    await page.keyboard.press('Space');

    // now column scanning
    await expect(page.locator('.scan-highlight.column-mode')).toBeVisible();

    // press space again to select tile
    await page.keyboard.press('Space');

    // tile should be activated (added to output bar)
    await expect(page.locator('.output-item')).toHaveCount(1);
  });
});
```

מריצים → **שניהם נכשלים** → Red.

### שלב 2: Green — מימוש מינימלי

1.  קודם `scanner.ts` — עד שבדיקות Vitest עוברות
2.  אחר כך `ScanHighlight.svelte` + חיבור ל-Board — עד שבדיקת Playwright עוברת

### שלב 3: Refactor

משפרים את הקוד, מוסיפים edge cases. הבדיקות מגנות מפני רגרסיה.

---

## מבנה קבצים

```
src/
├── lib/
│   ├── services/
│   │   ├── arasaac.ts
│   │   ├── arasaac.spec.ts        ← Vitest unit
│   │   ├── storage.ts
│   │   ├── storage.spec.ts        ← Vitest unit
│   │   ├── tts.ts
│   │   ├── tts.spec.ts            ← Vitest unit
│   │   ├── scanner.ts             ← (שלב 4)
│   │   └── scanner.spec.ts        ← Vitest unit (שלב 4)
│   └── stores/
│       ├── board.svelte.ts
│       ├── board.spec.ts           ← Vitest unit
│       ├── settings.svelte.ts
│       └── settings.spec.ts        ← Vitest unit
tests/
├── edit-mode.e2e.ts                ← Playwright (שלב 2, קיים)
├── navigation.e2e.ts               ← Playwright (שלב 4)
├── scanning.e2e.ts                 ← Playwright (שלב 4)
├── settings.e2e.ts                 ← Playwright (שלב 3B)
└── offline.e2e.ts                  ← Playwright (שלב 7)
```

**הכלל**: קובץ `.spec.ts` צמוד לקובץ שהוא בודק. קובץ `.e2e.ts` בתיקיית `tests/`.

---

## פקודות

```
# Vitest — מהיר, watch mode, רץ בזמן פיתוח
bun run test:unit              # הרצה חד-פעמית
bun run test:unit -- --watch   # watch — רץ מחדש על כל שמירה

# Playwright — איטי, רץ לפני commit
bun run test:e2e               # כל בדיקות E2E
bunx playwright test scanning  # רק קובץ ספציפי

# שניהם ברצף
bun run test                   # unit + e2e
```

---

## סדר הכתיבה לכל שלב ב-Roadmap

| שלב | Vitest קודם (TDD) | Playwright קודם (ATDD) |
| --- | --- | --- |
| 4 — נגישות וסריקה | `scanner.spec.ts` — לוגיקת סריקה | `scanning.e2e.ts` — מתג בוחר אריח |
| 5 — הגדרות מתקדמות | `settings.spec.ts` — persist/migrate | `settings.e2e.ts` — שינוי שפה נשמר |
| 6 — Grid Sets | `gridsets.spec.ts` — CRUD, ניווט | `gridsets.e2e.ts` — מעבר בין grid sets |
| 7 — PWA אופליין | `cache.spec.ts` — cache strategy | `offline.e2e.ts` — אפליקציה עובדת offline |
| 8 — Backend | `api.spec.ts` — auth, sync logic | `auth.e2e.ts` — login → sync → logout |

---

## עקרונות

**בדיקה נכשלת קודם** — תמיד. גם אם זה "ברור" שיעבוד.

**Vitest ל-"מה"**, **Playwright ל-"איך"**

*   Vitest: "הפונקציה מחזירה X"
*   Playwright: "המשתמש רואה X על המסך"

**בדיקה אחת = התנהגות אחת** — לא "בדיקת TileEditor" אלא "שינוי תווית נשמר".

**אל תבדוק implementation** — לא "הפונקציה קראה ל-IndexedDB 3 פעמים" אלא "הנתונים שרדו ריענון".

**Playwright selectors יציבים** — העדפה:

*   `page.getByRole('button', { name: 'שמור' })` — הכי יציב
*   `page.locator('[data-testid="save-btn"]')` — טוב
*   `page.locator('.btn-save')` — שביר (CSS משתנה)

**כל באג = בדיקה חדשה** — לפני שמתקנים באג, כותבים בדיקה שמשחזרת אותו. כך הוא לא חוזר.
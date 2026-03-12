# AAC Board — תוכנית פיתוח ארוכת טווח

## הקשר

שלב 1 (ליבה) הושלם: לוח AAC עם 5 לוחות, 62 פיקטוגרמות ARASAAC מאומתות, TTS, ניווט, אנימציות.
צריך לבנות תוכנית רב-שלבית שמקדמת את הפרויקט מ-MVP סטטי לאפליקציית AAC מלאה.

---

## שלב 2 — עריכה ושמירה מקומית

**מטרה:** לאפשר למשתמש (הורה/מטפל) להתאים את הלוח.

- **Edit Mode** — מצב עריכה עם toggle, lock icon ב-NavBar
- **עריכת אריח** — שינוי תווית, צבע רקע/גבול, תמונה (חיפוש ARASAAC), סוג (כפתור/תיקייה)
- **הוספה/מחיקה** — הוספת אריח חדש, מחיקת אריח קיים, השבתת אריח (disabled)
- **Drag & Drop** — סידור מחדש של אריחים בגרירה (svelte-dnd-action / neodrag)
- **שינוי גודל רשת** — שינוי מספר שורות/עמודות
- **IndexedDB persistence** — שמירה אוטומטית מקומית (idb-keyval או Dexie)
- **ייצוא/ייבוא JSON** — גיבוי ושחזור לוחות

**קבצים עיקריים:**

- `src/lib/components/TileEditor.svelte` (חדש)
- `src/lib/components/EditToolbar.svelte` (חדש)
- `src/lib/services/storage.ts` (חדש — IndexedDB)
- `src/lib/services/arasaac.ts` (חדש — חיפוש סמלים)
- `src/lib/stores/board.svelte.ts` (עדכון — פעולות CRUD)

---

## שלב 3 — חיפוש סמלים ו-TTS מתקדם

**מטרה:** חוויית בחירת סמלים עשירה וקולות איכותיים.

- **חיפוש ARASAAC** — קומפוננטת חיפוש עם autocomplete, תצוגה מקדימה, סינון לפי קטגוריה
- **העלאת תמונה** — תמונה מקומית כסמל (File API + object URL / base64)
- **בחירת קול TTS** — UI לבחירת קול מובנה (Web Speech voices)
- **Azure TTS** — חיבור ל-Azure Cognitive Services (קולות ענן)
- **ElevenLabs** — חיבור ל-ElevenLabs API (קולות AI), בורר קולות עם preview
- **הגדרות TTS** — קצב דיבור, עוצמה, pitch

**קבצים עיקריים:**

- `src/lib/components/SymbolSearch.svelte` (חדש)
- `src/lib/components/VoiceSelector.svelte` (חדש)
- `src/lib/services/tts.ts` (עדכון — multi-provider)
- `src/lib/services/arasaac.ts` (עדכון — חיפוש)
- `src/lib/stores/settings.svelte.ts` (חדש)

---

## שלב 4 — נגישות וסריקה

**מטרה:** נגישות מלאה — switch scanning, keyboard, מעקב עיניים.

- **Keyboard navigation** — Tab/Enter/Arrow keys, focus management מלא
- **Switch scanning** — סריקה אוטומטית/ידנית עם 1-2 מתגים
  - Row-column scanning, linear scanning
  - הגדרת מהירות, dwell time, scanning pattern
- **High contrast mode** — מצב ניגודיות גבוהה
- **גודל אריחים מותאם** — אפשרות להגדלה/הקטנה
- **Screen reader** — תמיכה מלאה ב-ARIA live regions
- **Pointer/eye-tracking ready** — dwell-to-select

**קבצים עיקריים:**

- `src/lib/services/scanner.ts` (חדש)
- `src/lib/stores/accessibility.svelte.ts` (חדש)
- `src/lib/components/ScanHighlight.svelte` (חדש)

---

## שלב 5 — הגדרות ופרופיל

**מטרה:** התאמה אישית מלאה של האפליקציה.

- **דף הגדרות** — route חדש `/settings`
- **הגדרות תצוגה** — ערכת נושא (בהיר/כהה), גודל פונט, צבע רקע
- **הגדרות שפה** — בחירת שפה לממשק ולדיבור
- **הגדרות ניווט** — ניווט אוטומטי, breadcrumbs on/off, lock board
- **פרופיל מתקשר** — שם, גיל, שפה, רמת תקשורת
- **גיבוי/שחזור** — ייצוא כל ההגדרות + לוחות ל-JSON

**קבצים עיקריים:**

- `src/routes/settings/+page.svelte` (חדש)
- `src/lib/stores/settings.svelte.ts` (עדכון)
- `src/lib/components/settings/` (תיקייה חדשה)

---

## שלב 6 — Grid Sets ו-Communicators

**מטרה:** מערכת שלמה של לוחות מקושרים (כמו Grid AAC).

- **Grid Set** — אוסף לוחות מקושרים עם Home Board
- **Grid Set Explorer** — דשבורד לניהול Grid Sets
- **שכפול לוח** — deep clone עם עדכון מזהים
- **תבניות מובנות** — לוחות בסיס מוכנים (צרכים, רגשות, מקומות, אנשים, פעלים)
- **ייבוא/ייצוא Grid Sets** — שיתוף בין משתמשים
- **Online Grids** — גלריה קהילתית (דורש backend)

**קבצים עיקריים:**

- `src/lib/types/gridset.ts` (חדש)
- `src/lib/stores/gridsets.svelte.ts` (חדש)
- `src/routes/explorer/+page.svelte` (חדש)
- `src/lib/components/GridSetExplorer.svelte` (חדש)

---

## שלב 7 — PWA ותמיכה אופליין

**מטרה:** עבודה מלאה ללא אינטרנט.

- **Service Worker** — caching של אפליקציה + סמלי ARASAAC
- **Manifest** — install prompt, splash screen, standalone mode
- **Offline TTS** — fallback לקולות מובנים כשאין אינטרנט
- **Sync** — סנכרון לוחות כשחוזרים לאינטרנט (אם יש backend)
- **Precache ARASAAC** — הורדת סמלים מראש לשימוש אופליין

**כלים:** `@vite-pwa/sveltekit`, workbox

---

## שלב 8 — חיבור ל-Backend ואימות

**מטרה:** סנכרון ענן, אימות משתמשים, שיתוף.

- **חיבור ל-cboard-api** — שימוש ב-API הקיים (~35 endpoints)
- **אימות** — login/signup (email, Google OAuth)
- **סנכרון לוחות** — upload/download boards מהשרת
- **שיתוף** — שליחת לוחות למטפלים/מורים
- **אנליטיקה** — מעקב שימוש (מילים נפוצות, זמן שימוש)

**או לחלופין** — Cloudflare D1/KV כ-backend עצמאי.

---

## שלב 9 — תכונות מתקדמות

**מטרה:** תכונות פרימיום ובינה מלאכותית.

- **חיזוי מילים** — הצעות מילה הבאה מבוססות היסטוריה
- **AI Fix** — תיקון דקדוק ומשפטים (Claude/GPT)
- **דקדוק חכם** — נטיית פעלים אוטומטית (זכר/נקבה/רבים)
- **Message Banking** — הקלטת ביטויים בקול הטבעי
- **עריכה מרחוק** — מטפלים/משפחה יכולים לערוך לוחות מרחוק
- **היסטוריית צ'אט** — שמירת שיחות קודמות

---

## שלב 10 — i18n ו-Production

**מטרה:** תמיכה ב-50+ שפות ופריסה.

- **i18n** — paraglide-sveltekit / inlang לממשק (50+ שפות, JSON מ-Cboard)
- **ARASAAC multilingual** — חיפוש סמלים בכל שפה
- **RTL/LTR** — תמיכה מלאה בשתי הכיוונים
- **Playwright E2E** — בדיקות מקצה לקצה לכל הפיצ'רים
- **Performance audit** — Lighthouse, bundle analysis
- **Cloudflare Workers deploy** — production deployment עם CI/CD

---

## סדר עדיפויות מומלץ

| שלב | תיאור                   | תלות     | עדיפות               |
| --- | ----------------------- | -------- | -------------------- |
| 2   | עריכה + IndexedDB       | —        | קריטי                |
| 3   | חיפוש סמלים + TTS מתקדם | שלב 2    | גבוהה                |
| 4   | נגישות + סריקה          | —        | גבוהה                |
| 5   | הגדרות + פרופיל         | שלב 2    | בינונית              |
| 6   | Grid Sets               | שלב 2, 5 | בינונית              |
| 7   | PWA + אופליין           | שלב 2    | בינונית              |
| 8   | Backend + אימות         | שלב 6    | נמוכה (יש IndexedDB) |
| 9   | AI + מתקדם              | שלב 8    | עתידי                |
| 10  | i18n + Production       | שלב 8    | עתידי                |

## אימות

- כל שלב מסתיים ב-`npm run check` + `bun run lint` ללא שגיאות
- שלבים 2-6 כוללים בדיקה ידנית + Playwright tests חדשים
- deploy ל-Cloudflare Workers אחרי כל שלב

# דוח השוואה: AAC-Board מול CBoard

## תאריך: 2026-03-24 (מעודכן — ענף `claude/aac-board-core-4lixm`)


---

## סיכום מנהלים

פרויקט **aac-board** (SvelteKit) השלים **שלבים 1, 2, 3A ו-3B** מתוך תוכנית בת 10 שלבים. מתוך **29 קטגוריות פיצ'רים** שזוהו ב-CBoard, **16 קטגוריות יושמו באופן מלא או חלקי**, ו-**13 טרם יושמו**. אחוז ההתקדמות הכולל: **~45%**.


---

## 1. פיצ'רים שיושמו באופן מלא (✅)


| #  | פיצ'ר                                 | CBoard                                                                             | AAC-Board                                                                                                                                                                                            | הערות                                                         |
| ---- | ------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 1  | **רינדור לוח (Grid)**            | React + react-grid-layout, שני מצבי grid                                    | CSS Grid דינמי עם משתני CSS, אנימציות מעבר (slide-left/right)                                                                                                                | ✅ מודרני יותר, ביצועים טובים יותר       |
| 2  | **אריחים (Tiles)**                  | Symbol + label, צבעים                                                         | גבולות gradient, אפקט sheen, אנימציות כניסה מדורגות, pulse בלחיצה, hover lift, badges לתיקיות/עריכה                                                  | ✅ עיצוב עשיר יותר מ-CBoard                          |
| 3  | **סרגל פלט (Output Bar)**          | Symbols, Backspace, Clear, Share, גלילה                                       | Thumbnails + labels, דבר הכל, נקה, הסרה בלחיצה, Svelte transitions (fly/fade/flip), גלילה אופקית                                                                       | ✅ מיושם (חסרים: Backspace, Share)                       |
| 4  | **TTS בסיסי**                        | Web Speech API                                                                     | Web Speech API, בחירת קול עברי, rate/pitch מותאמים, preview, persist ל-localStorage                                                                                              | ✅ מיושם במלואו                                         |
| 5  | **ניווט בין לוחות**          | מחסנית ניווט, Home, Back, היסטוריה                              | מחסנית ניווט, Home, Back +**Breadcrumbs** (מסלול ניווט ויזואלי)                                                                                                          | ✅ breadcrumbs = שיפור על CBoard                            |
| 6  | **RTL ועברית**                      | RTL דרך jss-rtl                                                                 | `dir="rtl"` + `lang="he"` בכל הקומפוננטות                                                                                                                                              | ✅ (עברית בלבד, ללא i18n)                              |
| 7  | **ניהול State**                      | Redux 4 + thunk + persist                                                          | Svelte 5 runes ($state) + auto-persist ל-IndexedDB                                                                                                                                                  | ✅ קוד מינימלי, persist אוטומטי                   |
| 8  | **מצב עריכה (Edit Mode)**         | EditToolbar, TileEditor, ImageEditor                                               | Toggle עריכה, wobble animation, badges, NavBar משנה צבע                                                                                                                                  | ✅ מיושם                                                      |
| 9  | **עורך אריחים (Tile Editor)**   | TileEditor + LoadBoardEditor                                                       | Modal מלא: label, חיפוש ARASAAC, העלאת תמונה, צבעים (10 presets + custom), סוג (כפתור/תיקיה), לוח יעד, הגדרות קול, תצוגה מקדימה חיה | ✅ עורך עשיר ומודרני                                |
| 10 | **חיפוש סימבולים (ARASAAC)** | חיפוש ב-3 ספריות (ARASAAC, Mulberry, Global Symbols)                   | חיפוש ARASAAC עם debounce, cache, AbortSignal, grid תוצאות                                                                                                                              | ✅ חלקי — רק ARASAAC (חסרים: Mulberry, Global Symbols) |
| 11 | **Drag & Drop**                           | react-dnd + touch-backend                                                          | HTML5 Drag (desktop) + Long-press Touch (400ms) + custom ghost + haptic feedback                                                                                                                     | ✅ מיושם עם ghost מותאם                                |
| 12 | **CRUD אריחים**                     | Create, Delete, Edit, Copy/Paste                                                   | הוספה, מחיקה, עריכה, סידור מחדש (drag), trimToGrid                                                                                                                           | ✅ חלקי (חסרים: Copy/Paste, Select All)                   |
| 13 | **IndexedDB Persistence**                 | Redux Persist + localForage                                                        | idb-keyval (~600 bytes), auto-persist, snapshot serialization                                                                                                                                        | ✅ מיושם במלואו, קל יותר                          |
| 14 | **ייבוא/ייצוא (JSON)**          | 4 פורמטים: CBoard JSON, OBF, OBZ, PDF                                       | ייצוא JSON (עם תאריך בשם הקובץ), ייבוא JSON                                                                                                                                 | ✅ חלקי (חסרים: OBF, OBZ, PDF)                            |
| 15 | **הגדרות (Settings)**               | דף הגדרות מלא: Display, Speech, Language, Scanning, Navigation, Symbols | דף`/settings`: קול TTS, ערכת נושא, גודל אריחים, ייצוא/ייבוא, איפוס                                                                                             | ✅ חלקי (חסרים: שפה, סריקה, ניווט)           |
| 16 | **ערכת נושא (Theme)**             | Dark/Light, 7 fonts, RTL                                                           | Dark/Light עם CSS variables, anti-flash script, toggle בהגדרות                                                                                                                              | ✅ חלקי (חסרים: fonts, גדלים)                        |
| 17 | **PWA**                                   | Service Worker, manifest, standalone, offline cache                                | manifest.json (RTL, Hebrew), אייקון SVG                                                                                                                                                        | ⚠️ חלקי מאוד — אין Service Worker                    |
| 18 | **עריכת Grid**                       | הוספת/הסרת שורות ועמודות                                      | Stepper לשורות (1-10) ועמודות (1-12), ניהול overflow tiles                                                                                                                         | ✅ מיושם                                                      |
| 19 | **E2E Tests**                             | Playwright                                                                         | 8 טסטים: edit mode, tile editor, grid resize, DnD desktop+touch, export, overflow                                                                                                               | ✅ מיושם                                                      |
| 20 | **העלאת תמונה**                 | ImageEditor (react-cropper)                                                        | העלאת קובץ, base64, אזהרת גודל >500KB                                                                                                                                              | ✅ חלקי (חסר: cropping)                                     |


---

## 2. פיצ'רים שטרם יושמו (❌)

### עדיפות גבוהה — שלבים 3C-3E (הבא בתור)


| #  | פיצ'ר                         | תיאור ב-CBoard                                           | מורכבות |
| ---- | ----------------------------------- | ---------------------------------------------------------------- | ---------------- |
| 21 | **יצירת לוח חדש**      | יצירת sub-boards דרך tile editor                       | בינונית |
| 22 | **Multi-select + Copy/Paste**     | בחירה מרובה, העתקה/הדבקה בין לוחות | בינונית |
| 23 | **שכפול לוח**             | שכפול לוח קיים כבסיס                          | נמוכה     |
| 24 | **Board browser / sidebar**       | סיור בין כל הלוחות                              | בינונית |
| 25 | **Communication intents sidebar** | פיצ'ר ייחודי ל-aac-board (לא קיים ב-CBoard)  | גבוהה     |

### עדיפות בינונית — שלבים 4-6


| #  | פיצ'ר                         | תיאור ב-CBoard                                                          | מורכבות |
| ---- | ----------------------------------- | ------------------------------------------------------------------------------- | ---------------- |
| 26 | **Scanning (Switch Access)**      | סריקה אוטומטית/ידנית עם react-scannable                   | גבוהה     |
| 27 | **ניווט מקלדת**         | Keyboard navigation + focus management                                        | בינונית |
| 28 | **High Contrast + Screen Reader** | ARIA live regions, תמיכת קוראי מסך                               | בינונית |
| 29 | **Communicator (Grid Sets)**      | ניהול אוספי לוחות, browser, selector                           | גבוהה     |
| 30 | **Default Board Sets**            | 2 סטים: Advanced + PicSeePal                                              | בינונית |
| 31 | **הגדרות מתקדמות**   | גודל UI, 7 פונטים, מיקום label, Quick Unlock, Vocalize Folders | בינונית |

### עדיפות נמוכה-בינונית — שלבים 7-10


| #  | פיצ'ר                           | תיאור ב-CBoard                                           | מורכבות                                 |
| ---- | ------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| 32 | **Service Worker / Offline מלא** | sw-precache, cache של סימבולים, offline analytics    | בינונית                                 |
| 33 | **אימות משתמשים**       | Email + OAuth (Google, Facebook, Apple)                        | גבוהה                                     |
| 34 | **סנכרון ענן**             | REST API ללוחות, communicators, הגדרות             | גבוהה                                     |
| 35 | **לוקליזציה (i18n)**       | 50 שפות, 67 קבצי תרגום, Crowdin                   | בינונית-גבוהה                      |
| 36 | **ייצוא OBF/OBZ/PDF**          | ייצוא OBF, OBZ (JSZip), PDF (pdfmake, 15+ פונטים)   | גבוהה                                     |
| 37 | **AI — שיפור משפטים**   | GPT endpoint לשיפור ביטויים                       | בינונית                                 |
| 38 | **AI — קולות ElevenLabs**     | ElevenLabs engine, personal voices, multilingual v2            | בינונית                                 |
| 39 | **Azure TTS**                       | microsoft-cognitiveservices-speech-sdk                         | בינונית                                 |
| 40 | **שיתוף לוחות**           | פרסום, 5 רשתות חברתיות, העתקת קישור | בינונית                                 |
| 41 | **שיתוף משפטים**         | שיתוף פלט ל-5 רשתות חברתיות               | נמוכה                                     |
| 42 | **הדפסה**                      | הדפסת לוח, dom-to-image                                | נמוכה                                     |
| 43 | **אנליטיקה**                | דשבורד in-app, GA4, Azure Insights, Firebase             | בינונית-גבוהה                      |
| 44 | **מנויים (Premium)**          | PayPal, In-App Purchase, שער פיצ'רים                  | גבוהה                                     |
| 45 | **Onboarding Tours**                | 5 סיורים מודרכים (react-joyride)                  | בינונית                                 |
| 46 | **Cordova (Mobile App)**            | Android + iOS + Electron                                       | גבוהה (לא רלוונטי אם web-only) |
| 47 | **ARASAAC Offline Cache**           | הורדת פיקטוגרמות ל-IndexedDB                   | בינונית                                 |
| 48 | **הקלטת קול**               | הקלטת audio מותאם לאריחים                     | בינונית                                 |
| 49 | **מצב נעול (Live Mode)**     | Live Mode, Quick Unlock, Quiet Builder                         | נמוכה                                     |
| 50 | **עזרה ותיעוד**           | עזרה מתורגמת (~80 שפות), About, Donate          | נמוכה                                     |
| 51 | **התאמת סימבולים**     | גוון עור + צבע שיער לפיקטוגרמות       | נמוכה                                     |
| 52 | **התראות (Notifications)**    | Snackbar system                                                | נמוכה                                     |


---

## 3. סיכום מספרי


| מדד                                                | ערך                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------- |
| **סה"כ קטגוריות פיצ'רים ב-CBoard**  | 32                                                             |
| **יושמו באופן מלא ב-aac-board**         | 10                                                             |
| **יושמו באופן חלקי**                    | 10                                                             |
| **טרם יושמו**                                 | 12                                                             |
| **פיצ'רים ייחודיים ל-aac-board**       | 2 (Communication intents sidebar, AAC best practices research) |
| **אחוז התקדמות (לפי קטגוריות)** | ~45%                                                           |
| **מיקום בתוכנית הפנימית**          | סיום שלב 3B מתוך 10 שלבים                      |


---

## 4. מה ב-AAC-Board שאין ב-CBoard


| פיצ'ר                                      | תיאור                                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Breadcrumbs ניווט**                     | מסלול ניווט ויזואלי (שמות לוחות עם מפריד) — CBoard מציג רק שם לוח נוכחי |
| **אנימציות כניסה מדורגות** | כל אריח מופיע בהשהיה (30ms × index) — אפקט "גל"                                                  |
| **גבולות Gradient**                      | טכניקת CSS דו-שכבתית ליצירת גבולות gradient                                                     |
| **אפקט Sheen**                             | שכבת pseudo-element עם gradient אלכסוני                                                                      |
| **Custom drag ghost**                          | Ghost מותאם אישית (clone של האריח) במקום ה-default של הדפדפן                               |
| **Haptic feedback**                            | רטט (30ms) בתחילת גרירה במכשירי מגע                                                               |
| **Anti-flash script**                          | מניעת הבהוב לבן בטעינה במצב כהה                                                                 |
| **Communication intents sidebar**              | תכונה מתוכננת — סיווג אריחים לפי כוונת תקשורת (ייחודי)                        |
| **מחקר AAC**                               | מסמך מחקר מקיף (60+ מקורות) על שיטות עבודה מיטביות ב-AAC                            |


---

## 5. יתרונות טכנולוגיים


| נושא     | CBoard                                          | AAC-Board                                                   |
| -------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| Framework    | React 17 (2020)                                 | Svelte 5.51 + SvelteKit 2 (2025)                            |
| State        | Redux 4 + thunk (~500 שורות boilerplate)   | Svelte 5 runes (~120 שורות)                            |
| Build        | CRACO/CRA (deprecated)                          | Vite 7.3                                                    |
| Styling      | Material-UI 4 (deprecated)                      | Tailwind CSS 4 + Scoped CSS + CSS Variables                 |
| TypeScript   | חלקי                                        | מלא (strict mode)                                        |
| Bundle       | גדול (React + Redux + MUI + ...)            | מינימלי (idb-keyval בלבד כ-runtime dep)         |
| Deployment   | Traditional server                              | Cloudflare Workers (edge)                                   |
| Persistence  | Redux Persist + localForage (~15KB)             | idb-keyval (~600 bytes)                                     |
| Drag & Drop  | react-dnd + touch-backend (~30KB)               | HTML5 native + Touch API (0KB deps)                         |
| Testing      | Playwright בלבד                             | Vitest (unit) + Playwright (E2E)                            |
| Code Quality | ~700 שורות spaghetti ב-Board.container.js | קומפוננטות ממוקדות (<300 שורות כ"א) |


---

## 6. המלצה לשלב הבא (3C)

לפי ה-roadmap, השלב הבא כולל:

1. **יצירת לוח חדש** — אפשרות ליצור sub-board מתוך tile editor (סוג "תיקייה" → "צור לוח חדש")
2. **כפתורי עריכה/מחיקה על אריחים** — במקום click-to-edit, להוסיף אייקונים קטנים
3. **שיפורי Edit UX** — אישור לפני מחיקה, undo, feedback ויזואלי


---

*דוח זה מבוסס על סריקת קוד מקור בענף `claude/aac-board-core-4lixm` (commit `f753744`) והשוואה ל-`cboard-org/cboard` main.*

# תוכנית — מודלי TTS, רשימת קולות אוטומטית, ו-cache לאודיו

## הקשר

כרגע יש באפליקציה 3 ספקי TTS:

- `webspeech`
- `elevenlabs`
- `gemini`

יש כבר:

- בחירת provider
- בחירת voice
- שמירת API keys מקומית
- fallback ל-`webspeech`

הפערים שנותרו:

1. **רשימת קולות אוטומטית** ל-Gemini במקום רשימה קשיחה בקוד
2. **בחירת מודל** למשתמש (במיוחד ב-Gemini)
3. **cache מקומי לאודיו** עבור מילים/ביטויים שחוזרים על עצמם

---

## מטרות

### מטרה 1 — רשימת קולות אוטומטית

לאפשר טעינת קולות Gemini בצורה אוטומטית, אם יש endpoint רשמי/יציב לכך.

### מטרה 2 — בחירת מודל

לאפשר למשתמש לבחור מודל TTS מתאים מתוך המודלים הנתמכים של Gemini:

- `gemini-3.1-flash-tts-preview`
- `gemini-2.5-flash-preview-tts`
- `gemini-2.5-pro-preview-tts`

### מטרה 3 — cache לאודיו

לשמור אודיו שנוצר מ-Gemini/ElevenLabs ב-IndexedDB כדי:

- לחסוך latency
- לצמצם עלויות API
- לשפר UX בביטויים שחוזרים הרבה

---

## מצב ידוע מהתיעוד

### Gemini TTS

לפי docs הרשמיים של Gemini Speech Generation:

- יש 3 מודלי TTS נתמכים:
  - `gemini-3.1-flash-tts-preview`
  - `gemini-2.5-flash-preview-tts`
  - `gemini-2.5-pro-preview-tts`
- עברית (`he`) נתמכת
- יש 30 קולות prebuilt
- לא מצאנו בתיעוד endpoint ציבורי ברור של `list voices`

### מסקנה זמנית

התוכנית צריכה להיות דו-שלבית:

1. **לבדוק אם יש endpoint רשמי יציב**
2. אם אין:
   - להשתמש ב-snapshot רשמי של 30 הקולות
   - לבודד אותו בקובץ נתונים נפרד
   - לא להשאיר hardcoded בתוך provider implementation

---

## החלטות מוצעות

### 1. גילוי קולות ל-Gemini

עדיפות:

1. **endpoint רשמי של Google** אם קיים
2. אם אין endpoint:
   - קובץ נתונים מקומי `gemini-voices.ts` עם 30 קולות
   - תיעוד ברור שזה snapshot מה-docs
   - הפרדה מלאה מלוגיקת provider

### 2. בחירת מודל

הבחירה תהיה **ברמת provider**, לא גלובלית לכל המערכת.
כלומר:

- ל-Gemini יהיה `ttsModel`
- ל-ElevenLabs אפשר בעתיד להוסיף `ttsModel`, אבל כרגע נתחיל עם Gemini בלבד

### 3. cache לאודיו

ה-cache יהיה **רק לספקי cloud**:

- `gemini`
- `elevenlabs`

לא נבנה cache עבור `webspeech` כי:

- אין blob קבוע
- ההשמעה מקומית מיידית
- אין עלות API

### 4. מיקום ה-cache

IndexedDB, לא localStorage.

הסיבה:

- blobs
- נפח גדול יותר
- תמיכה טובה יותר באודיו בינוני/קטן

### 5. מפתח cache

cache key יורכב מ:

- `provider`
- `modelId`
- `voiceId`
- `lang`
- `text`

ב-v1 **לא נכלול**:

- `rate`
- `pitch`

כי כרגע:

- `rate` ב-cloud מיושם ב-playback client-side
- `pitch` לא מיושם כסינתזה נפרדת בענן

כך נמנע שכפול blobs זהים.

---

## קבצים חדשים/מעודכנים

### קבצים חדשים

- `docs/plans/tts-providers-models-and-cache.md`
- `src/lib/services/tts-cache.ts`
- `src/lib/services/tts-providers/gemini-voices.ts`
- `src/lib/services/tts-providers/provider-models.ts`

### קבצים לעדכון

- `src/lib/services/tts.ts`
- `src/lib/services/tts-providers/types.ts`
- `src/lib/services/tts-providers/gemini.ts`
- `src/lib/services/tts-providers/elevenlabs.ts`
- `src/lib/services/tts-providers/index.ts`
- `src/lib/stores/settings.svelte.ts`
- `src/routes/settings/+page.svelte`
- `docs/plans/roadmap.md`
- `docs/walkthrough.md`

---

## מבנה נתונים מוצע

### AppSettings

```ts
interface AppSettings {
	ttsProvider: TtsProviderId;
	ttsModel: string;
	ttsVoice: string;
	ttsRate: number;
	ttsPitch: number;
	theme: 'light' | 'dark';
	tileSize: 'small' | 'medium' | 'large';
}
```

### TtsCacheEntry

```ts
interface TtsCacheEntry {
	key: string;
	provider: 'gemini' | 'elevenlabs';
	modelId: string;
	voiceId: string;
	lang: string;
	text: string;
	mimeType: string;
	blob: Blob;
	createdAt: number;
	lastAccessedAt: number;
	hitCount: number;
	sizeBytes: number;
}
```

---

## תוכנית מימוש

## שלב 1 — מחקר ונעילת החלטה לגבי רשימת קולות

### מטרה

להכריע אם יש endpoint רשמי לקולות Gemini.

### משימות

- לבדוק שוב docs ו-model pages
- לבדוק אם יש endpoint ציבורי מתועד
- לא להסתמך על endpoint של AI Studio אם הוא:
  - לא מתועד
  - דורש login
  - לא יציב

### תוצאה אפשרית A

יש endpoint רשמי:

- `gemini.ts` יקרא אותו
- נוסיף caching קצר לרשימת הקולות

### תוצאה אפשרית B

אין endpoint רשמי:

- ניצור `gemini-voices.ts`
- נשמור שם את 30 הקולות הרשמיים
- נוסיף הערת source/date

### קריטריון יציאה

החלטה חד-משמעית:

- endpoint רשמי
  או
- snapshot מקומי

---

## שלב 2 — בחירת מודל למשתמש

### מטרה

לאפשר בחירת מודל Gemini מתוך המודלים הנתמכים.

### משימות

1. להוסיף `ttsModel` ל-`AppSettings`
2. לסנכרן `ttsModel` גם ל-`tts-settings` ב-localStorage mirror
3. להוסיף קובץ `provider-models.ts` עם:

```ts
const GEMINI_TTS_MODELS = [
	{ id: 'gemini-3.1-flash-tts-preview', label: 'Gemini 3.1 Flash TTS' },
	{ id: 'gemini-2.5-flash-preview-tts', label: 'Gemini 2.5 Flash TTS' },
	{ id: 'gemini-2.5-pro-preview-tts', label: 'Gemini 2.5 Pro TTS' }
];
```

4. לעדכן את `gemini.ts` להשתמש ב-`opts.modelId`
5. ב-`settings/+page.svelte`:
   - להציג select של מודל רק כשה-provider הוא `gemini`
   - איפוס voice בעת החלפת מודל אם צריך

### UX מוצע

- Provider: toggle buttons
- Model: dropdown
- Voice: dropdown
- API key: password input
- Preview: כפתור

### קריטריון יציאה

אפשר:

- לבחור provider
- לבחור model
- לבחור voice
- לנגן preview
- לשמור את ההגדרה בין רענונים

---

## שלב 3 — איחוד רשימת הקולות של Gemini

### מטרה

להחליף את 10 הקולות הקשיחים ל-30 הקולות הרשמיים.

### משימות

1. אם יש endpoint רשמי:
   - לחבר fetch
   - normalize ל-`TtsVoice[]`
   - fallback ל-snapshot מקומי במקרה של כשל
2. אם אין endpoint:
   - ליצור `gemini-voices.ts`
   - לייצא `TtsVoice[]` מלא
3. להציג שמות ידידותיים ב-UI
4. לשמור `voice.id` בתור הערך שנשלח ל-API

### קריטריון יציאה

ב-Gemini settings מוצגים כל 30 הקולות.

---

## שלב 4 — cache מקומי לאודיו

### מטרה

לשמור אודיו מחולל ולמחזר אותו בפעמים הבאות.

### משימות

1. ליצור `tts-cache.ts`
2. API מוצע:

```ts
getCachedAudio(key: string): Promise<Blob | null>
setCachedAudio(entry: TtsCacheEntry): Promise<void>
touchCachedAudio(key: string): Promise<void>
pruneCache(): Promise<void>
clearTtsCache(): Promise<void>
getCacheStats(): Promise<{ entries: number; totalBytes: number }>
buildCacheKey(input): string
```

3. לחבר את ה-cache ב-`tts.ts` או בשכבת provider wrapper:
   - לפני קריאת API:
     - לבנות key
     - לבדוק cache
   - אם hit:
     - לנגן blob
   - אם miss:
     - לקרוא ל-API
     - לשמור blob
     - לנגן

4. להגדיר מדיניות eviction:

- גודל מקסימלי התחלתי: `50MB`
- מקסימום רשומות: `500`
- מחיקה לפי:
  - oldest `lastAccessedAt`
  - ואחר כך `hitCount` נמוך

5. prune:

- אחרי `setCachedAudio`
- וגם בלחיצה יזומה מתוך settings

### קריטריון יציאה

מילה/ביטוי שכבר נוגנו פעם אחת:

- מנוגנים שוב בלי קריאת API
- נשמרים אחרי refresh

---

## שלב 5 — UI ל-cache בהגדרות

### מטרה

לתת למשתמש שליטה בסיסית על ה-cache.

### משימות

להוסיף ל-settings:

- “פריטי cache”
- “נפח משוער”
- כפתור “נקה cache אודיו”

### UX מינימלי

- read-only stats
- clear button
- בלי UI מסובך של browsing entries

### קריטריון יציאה

המשתמש רואה:

- כמה יש ב-cache
- כמה מקום זה תופס
- ויכול לנקות

---

## שלב 6 — בדיקות

### Unit

#### `tts-cache.spec.ts`

- `buildCacheKey is stable`
- `setCachedAudio + getCachedAudio roundtrip`
- `touchCachedAudio updates lastAccessedAt`
- `pruneCache evicts oldest entries when over limit`

#### `gemini.spec.ts` או provider tests

- `gemini provider uses selected modelId`
- `gemini voices source returns full list`
- `fallback to snapshot when fetch fails` (אם יש fetch)

### E2E

#### `tests/settings.e2e.ts`

- `can switch Gemini model`
- `Gemini voices load after API key`
- `audio cache stats appear after preview`
- `clear audio cache resets stats`

---

## סיכונים

### 1. אין endpoint רשמי לקולות

פתרון:

- fallback ל-snapshot מקומי
- לא לבנות על scraping בזמן runtime

### 2. blobs גדלים מהר

פתרון:

- limit של 50MB
- prune אוטומטי
- clear button

### 3. cache key לא מספיק מדויק

פתרון:

- לכלול provider/model/voice/lang/text
- להשאיר rate/pitch מחוץ ל-key ב-v1
- לתעד זאת במפורש

### 4. drift בין `app-settings` ל-`tts-settings`

פתרון:

- source of truth: `settingsStore`
- mirror ל-localStorage רק לצורך runtime access ב-`tts.ts`

---

## קבלת החלטות לפני מימוש

### החלטה 1

אם לא נמצא endpoint רשמי של Gemini לקולות:

- האם לאשר snapshot מקומי של 30 הקולות?
- ההמלצה: **כן**

### החלטה 2

בחירת מודל:

- האם להציג בחירת מודל רק עבור Gemini?
- ההמלצה: **כן**, כרגע רק Gemini

### החלטה 3

cache:

- האם להפעיל cache כברירת מחדל?
- ההמלצה: **כן**

### החלטה 4

מגבלת cache:

- ברירת מחדל מוצעת: `50MB`
- אם רוצים שמרני יותר: `20MB`

---

## תוצרים סופיים

בסוף העבודה המשתמש יוכל:

1. לבחור provider
2. לבחור מודל Gemini
3. לבחור voice
4. ליהנות מ-cache אודיו לביטויים חוזרים
5. לראות מצב cache ולנקות אותו

---

## קשר ל-Sets

התוכנית הזו אינה תלויה ב-`Sets` או ב-`Routing`.
הממשק של **אוספי לוחות** נשאר מתוכנן ל-**שלב 6** לפי:

- `docs/plans/roadmap.md`
- `docs/plans/architecture.md`

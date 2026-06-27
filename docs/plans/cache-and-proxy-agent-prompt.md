# Agent Prompt — Cache + Proxy Client Implementation

> **למשתמש**: זה הפרומפט שתעביר לסוכן. תכתוב לו: "קרא את `docs/plans/cache-and-proxy-agent-prompt.md` ובצע אותו לפי ההוראות." או הדבק את כל התוכן כפרומפט.

---

## תפקידך

אתה הסוכן שמבצע את צד-הלקוח של תוכנית Cache + Proxy שמתועדת ב-[docs/plans/cache-and-proxy.md](cache-and-proxy.md). השרת (proxy Worker) **לא** בסקופ שלך — הוא ייבנה במשימה נפרדת. אתה בונה את הצרכן: מודולי cache, ה-fetch wrapper, ושילוב ב-`tts.ts`/`arasaac.ts`/`tts-providers/*`.

**עקרון מנחה**: TDD vertical slices. קרא קודם את הסקיל `tdd` במלואו לפני שאתה כותב שורת קוד.

## ספי איכות מוחלטים

לפני יצירת PR, חייב לעבור הכל:

```
bun run test:unit -- --run        # כל הטסטים עוברים
bun run lint                       # prettier + eslint נקיים
bun run check                      # svelte-check ללא שגיאות
```

PR שלא עובר את שלושת אלה — לא נפתח.

## גבולות הסקופ

### במשימה הזו ✅

- כל הקוד תחת `src/lib/services/cache/`, `src/lib/services/proxy-client.ts`, `src/lib/types/api.ts`.
- שינוי `src/lib/services/tts.ts` — `speak` קורא ל-`audio-cache`.
- שינוי `src/lib/services/tts-providers/elevenlabs.ts` ו-`gemini.ts` — `getVoices` דרך proxy, `speak` מוסר/מצומצם.
- שינוי `src/lib/services/arasaac.ts` — `pictogramUrl` מחזיר URL של פרוקסי.
- שינוי `src/routes/settings/+page.svelte` — הסרת שדות API key, הוספת cache stats.
- migration קוד שמנקה `localStorage.elevenlabs-api-key` / `gemini-api-key` פעם אחת.
- כל הטסטים הנדרשים.

### לא במשימה הזו ❌

- תיקיית `proxy/` והקוד של ה-Worker — **לא נוגעים**.
- Deployment ל-Cloudflare, יצירת R2/KV.
- Service Worker, אופליין מלא, precache.
- שינויים בלוחות, sets, או כל דבר שלא קשור ישירות.

## הגישה לפיתוח

### Branching

- כל Phase = branch אחת. שם: `feat/cache-proxy-client-phase-1`, `phase-2`, `phase-3`.
- בתוך branch אחת: commits אטומיים לכל Stage (קל לחזרה אחורה).
- **merge רק בסוף**, אחרי שכל שלוש ה-Phases עברו את ה-CI ואת בדיקות המשתמש.

### Cloudflare

- אינך מבצע `wrangler deploy`, `wrangler r2 bucket create`, או יצירת secrets.
- במקום זה: כשה-PR מוכן, **כתוב למשתמש בהודעת הסיום**: "כדי לבדוק end-to-end, הרץ X, Y, Z" — בלוקי פקודה ברורים.

## חוזה התנהגות בכל Stage

### TDD Loop — חובה מוחלטת

```
RED:    כותב טסט אחד שמתאר התנהגות. הטסט נכשל. רץ vitest כדי לוודא נפילה.
GREEN:  כותב את המינימום שיעבור. רץ vitest. ירוק.
COMMIT: git commit -m "test(cache): <behavior>" (אם הטסט בלבד) או
                   "feat(cache): <behavior>" (טסט + מימוש יחד, מקובל).
NEXT:   הטסט הבא.
```

**איסור**: לא לכתוב טסטים בכמות, לא לכתוב מימוש בכמות. **vertical slices**.

**איסור נוסף**: אין mocking של מודולים פנימיים. רק boundaries (fetch, IDB, time). אם אתה מרגיש שאתה צריך לעשות mock למודול שכתבת — סימן שהעיצוב לא נכון, תבחן deep modules ב-skill.

### Boundaries המוסכמים ל-fakes

| Boundary               | Fake                                         | מקור            |
| ---------------------- | -------------------------------------------- | --------------- |
| `fetch`                | `vi.fn()` או wrapper מותאם שמחזיר `Response` | system boundary |
| `idb-keyval`           | `fake-indexeddb` (npm package)               | system boundary |
| `crypto.subtle.digest` | אמיתי בדפדפן (vitest browser project)        | חלק מהפלטפורמה  |
| `localStorage`         | אמיתי בדפדפן                                 | חלק מהפלטפורמה  |

### איפה לכתוב טסטים

הפרויקט מכיל שני vitest projects ([vite.config.ts](../../vite.config.ts)):

- **client** (browser, chromium): קבצים `*.svelte.{test,spec}.ts` — לכל מה שדורש DOM/Web API אמיתי (כולל `crypto.subtle`, IDB אמיתי).
- **server** (node): קבצים `*.{test,spec}.ts` — ללוגיקה טהורה.

**כלל**: ה-cache modules ניגשים ל-`crypto.subtle` ול-IDB → **טסטים ב-client project** (`.svelte.spec.ts`). אל תיכנע לפיתוי לעטוף הכל ב-`if (typeof window === 'undefined')`.

## תוכנית הביצוע

### Phase 1 — Audio Cache + TTS Proxy Client

**Branch**: `feat/cache-proxy-client-phase-1`

**Stage 1.A — Types**

1. קרא [docs/plans/cache-and-proxy.md §4.2](cache-and-proxy.md#42-contracts-srclibtypesapits).
2. צור `src/lib/types/api.ts` עם `TtsProviderId`, `ImageSource`, `TtsRequest`, `TtsResponse`, `VoiceItem`, `VoicesResponse`, `ProxyError`.
3. אין טסטים לסטייג זה (types בלבד).
4. Commit: `feat(types): add proxy API contracts`.

**Stage 1.B — `ttsHash`**
ההתנהגויות לבדיקה (אחת בכל פעם):

- `B1` — אותו `TtsRequest` → אותו hash.
- `B2` — שינוי בטקסט → hash שונה.
- `B3` — שינוי ב-voiceId → hash שונה.
- `B4` — `text: " שלום "` ו-`text: "שלום"` → אותו hash (trim).
- `B5` — קלטים שונים בסדר: text → hash הוא תמיד 16 hex chars.

קובץ: `src/lib/services/cache/hash.ts` + `src/lib/services/cache/hash.svelte.spec.ts`.

**Stage 1.C — `audio-cache.getOrCreateAudio` ב-cache hit/miss**

לפני התחלה: התקן `fake-indexeddb`:

```bash
bun add -d fake-indexeddb
```

הוסף ל-vitest setup (אם נדרש) או import ב-spec.

ההתנהגויות לבדיקה (אחת בכל פעם):

- `C1` — `getOrCreateAudio(req)` כש-IDB ריק: עושה fetch ל-`POST /v1/tts`, אז `GET /v1/tts/:hash`, מחזיר Blob, שומר ב-IDB.
- `C2` — קריאה שנייה עם אותו `req`: **לא** עושה fetch, מחזיר Blob.
- `C3` — שינוי ב-text → fetch חדש.
- `C4` — שגיאת fetch על ה-POST: throws, IDB **לא** מתעדכן (קריאה הבאה תעשה fetch שוב).
- `C5` — שגיאת fetch על ה-GET (אחרי POST מוצלח): throws, IDB לא מתעדכן.
- `C6` — `cached: true` בתשובה מהפרוקסי לא משנה את ההתנהגות בלקוח.

קובץ: `src/lib/services/cache/audio-cache.ts` + `src/lib/services/cache/audio-cache.svelte.spec.ts`.

**הזרק** את `fetch` כפרמטר אופציונלי לפונקציה (default: `globalThis.fetch`) — מאפשר טסטים נקיים בלי `vi.stubGlobal`. דוגמה לחתימה:

```ts
export async function getOrCreateAudio(
	req: TtsRequest,
	deps?: { fetch?: typeof fetch; proxyUrl?: string }
): Promise<Blob>;
```

**Stage 1.D — `proxy-client.ts`**

אם בנייתו עזרה ב-Stage 1.C, תיתכן שכבר קיים. אחרת, חלץ עכשיו את הלוגיקה של בניית URL וניהול שגיאות.

ההתנהגויות:

- `D1` — `postTtsRequest(req)` בונה URL נכון, מחזיר `TtsResponse`.
- `D2` — `getTtsBlob(hash, mimeType)` מחזיר Blob עם ה-Content-Type הנכון.
- `D3` — שגיאת HTTP 4xx/5xx → זריקת `ProxyError` עם code מתאים.

**Stage 1.E — שילוב ב-`tts.ts`**

ההתנהגויות (טסטים integration-style):

- `E1` — `speak("שלום")` עם provider=gemini ו-cache hit ב-IDB: לא קורא לפרוקסי, מתנגן (mock של `Audio` class).
- `E2` — cache miss: קורא לפרוקסי, שומר, מתנגן.
- `E3` — webspeech provider: לא נוגע ב-cache בכלל (עובר ישר ל-Web Speech API).

עדכן את [src/lib/services/tts.ts](../../src/lib/services/tts.ts) — `speak` יקרא ל-`getOrCreateAudio` כש-provider ב-`{elevenlabs, gemini}`. ה-providers עצמם (`elevenlabs.ts`, `gemini.ts`) מתפשטים: `speak` נמחק או הופך ל-thin wrapper שמשתמש בפלייבק משותף.

צור/השתמש ב-`tts-providers/audio-playback.ts` (כבר קיים) ל-Audio playback, כדי לא לשכפל לוגיקה.

**Stage 1.F — Migration**

ההתנהגות:

- `F1` — בטעינה הראשונה אחרי deploy: `localStorage.elevenlabs-api-key` ו-`gemini-api-key` נמחקים. flag `cache-proxy-migrated:v1` נשמר ב-IDB.
- `F2` — בטעינות הבאות: לא נוגעים ב-localStorage שוב.

מקום: `src/lib/services/cache/migration.ts`. קריאה אחת מ-`+layout.svelte` או `app.html`.

**Stage 1.G — Env config**

עדכן `.env.example` עם `VITE_PROXY_URL=http://localhost:8787`.
ה-`audio-cache` קורא את הערך מ-`import.meta.env.VITE_PROXY_URL`. ב-prod יוגדר אצל Cloudflare; כרגע אנחנו מסבירים למשתמש מה להגדיר.

**סוף Phase 1 — בקשת PR**

הודעת סיום למשתמש (העתק/התאם):

```
Phase 1 הושלם בענף feat/cache-proxy-client-phase-1.

לבדיקה ידנית מקומית, עליך:
1. ליצור bucket R2: wrangler r2 bucket create aac-assets
2. ליצור KV: wrangler kv namespace create META
3. להגדיר secrets ב-aac-proxy worker (כש-יקום): wrangler secret put ELEVENLABS_KEY ו-GEMINI_KEY
4. להפעיל את ה-proxy worker (במשימה נפרדת) ב-localhost:8787
5. להגדיר VITE_PROXY_URL=http://localhost:8787 ב-.env.local
6. bun run dev → לחיצה על טייל מייצרת אודיו דרך הפרוקסי

כל הטסטים עוברים. lint+check נקיים. PR מוכן ל-review.
```

### Phase 2 — Image Cache

**Branch**: `feat/cache-proxy-client-phase-2` (יצור אחרי merge של Phase 1, או לפחות diverge ממנו).

**Stage 2.A — `image-cache.getImage`**

ההתנהגויות:

- `A1` — `getImage('arasaac', '12345')` ריק ב-IDB: fetch ל-`/v1/img/arasaac/12345`, שמור Blob, החזר objectURL.
- `A2` — קריאה שנייה: לא עושה fetch.
- `A3` — שגיאת fetch: throws, IDB לא מתעדכן.

קובץ: `src/lib/services/cache/image-cache.ts` + spec.

**Stage 2.B — שילוב ב-`arasaac.ts`**

`pictogramUrl(id, size)` מחזיר את ה-key הלוגי (לא URL מלא). מציגי תמונות (`<img>` ב-Svelte components) קוראים ל-`getImage('arasaac', id)` ומציבים את ה-objectURL ב-`src`.

**זה שינוי משמעותי בקומפוננטות**. צמצם את הסקופ:

- צור `src/lib/components/CachedImage.svelte` — קומפוננטה קטנה שמקבלת `source` ו-`id`, מציגה `<img>` עם objectURL מ-cache.
- החלף שימושי `<img src={pictogramUrl(...)}/>` קיימים ב-`<CachedImage source="arasaac" id={...}/>`.
- בדוק שאין רגרסיה ויזואלית (Playwright snapshot על דף home).

ההתנהגויות:

- `B1` — `<CachedImage>` רנדר ראשון: מציג placeholder (rect אפור), אחרי load מציג Blob.
- `B2` — אותה תמונה ב-DOM פעמיים → fetch אחד בלבד.
- `B3` — cleanup: `URL.revokeObjectURL` נקרא כש-component מתפרק.

### Phase 3 — Voices + Settings UI

**Branch**: `feat/cache-proxy-client-phase-3`.

**Stage 3.A — Voices דרך proxy**

`tts-providers/elevenlabs.ts:getVoices` ו-`gemini.ts:getVoices` קוראים ל-`GET /v1/voices/elevenlabs` או `/v1/voices/gemini` במקום API ישיר. הסר את ה-fetch הישיר וה-cache הפנימי (ה-proxy יחזיר נתונים cached ב-KV).

ההתנהגויות:

- `A1` — `getVoices('elevenlabs')` קורא לפרוקסי פעם אחת בכל אתחול.
- `A2` — שגיאת רשת → מחזיר `[]` (כמו היום), לא throws.

**Stage 3.B — Cache stats**

`src/lib/services/cache/stats.ts`:

- `getCacheStats(): Promise<{ images: number; audio: number; bytes: number }>`
- `clearAudioCache(): Promise<void>`
- `clearImageCache(): Promise<void>`

ההתנהגויות:

- `B1` — אחרי שמירת 3 audio + 5 image → stats מחזיר `{audio: 3, images: 5, bytes: ...}`.
- `B2` — `clearAudioCache` מאפס רק audio. images לא נוגעים.
- `B3` — `clearImageCache` מאפס רק images.

**Stage 3.C — Settings UI**

עדכן [src/routes/settings/+page.svelte](../../src/routes/settings/+page.svelte):

- הסר input של `elevenlabs-api-key` ו-`gemini-api-key`.
- הוסף section "Cache":
  - "תמונות בקאש: N (X.X MB)"
  - "הקלטות בקאש: M (Y.Y MB)"
  - כפתור "ניקוי הקלטות"
  - כפתור "ניקוי תמונות"
- כל פעולה דורשת אישור (ראה תבנית קיימת באפליקציה).

ההתנהגויות (E2E עם Playwright):

- `C1` — שדה ה-API key לא קיים ב-DOM (`page.locator('input[name=elevenlabs-api-key]').count() === 0`).
- `C2` — Cache stats מוצגים.
- `C3` — לחיצה על "ניקוי הקלטות" + אישור → audio count יורד ל-0.

## כללי איכות נוספים

1. **TypeScript strict** — אין `any`, אין `// @ts-ignore` בלי תיעוד. השתמש ב-`unknown` כשצריך.
2. **Svelte 5 syntax** — `$state`, `$derived`, `$effect`. אם אתה מתקן רכיב ישן ל-Svelte 4, השאר אותו (לא משפר לא מקולקל).
3. **תיעוד JSDoc** קצר על כל public function (כמו ב-[storage.ts](../../src/lib/services/storage.ts)).
4. **שמות קבצים** — kebab-case ל-services, PascalCase ל-Svelte components.
5. **לא לעקוף** את הסקיל `tdd`. אם מתפתה לכתוב מימוש לפני טסט — עצור, חזור, כתוב טסט.
6. **לא להוסיף תלויות** מעבר ל-`fake-indexeddb`. אם אתה חושב שצריך עוד משהו — שאל את המשתמש.

## כשמסיים

1. ודא שכל שלושת הענפים נוצרו, כל אחד עם commits אטומיים.
2. ודא שה-CI ירוק על שלושתם.
3. כתוב הודעה למשתמש עם:
   - רשימת הענפים.
   - רשימה ברורה של פעולות wrangler/cloudflare שהוא צריך לבצע ידנית.
   - מה לבדוק ידנית כדי לאשר שהכל עובד (smoke test).
   - מה דורש tradeoff/החלטה ממנו לפני המשך (אם בכלל).

## במקרה של ספק

- שאל את המשתמש לפני שאתה ממציא תשובה.
- העדף קוד פשוט וברור על פני "חכם".
- אם behavior לא ברור — חזור למסמך התכנון [cache-and-proxy.md](cache-and-proxy.md). אם עדיין לא ברור — שאל.
- אם טסט נראה לך מטופש — עדיין כתוב אותו. הוא לא בשבילך, הוא בשביל ה-refactor הבא.

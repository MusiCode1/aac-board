# Cache + Proxy לתמונות והקראות

מסמך תכנון מפורט. שיטת הביצוע: **TDD vertical slices** (אדום → ירוק → רפקטור) — לא כותבים את כל הטסטים מראש, ולא את כל הקוד מראש; כל התנהגות מקבלת מחזור משלה.

---

## 1. הקשר ומטרות

### 1.1 המצב היום

- תמונות ARASAAC מובאות ישירות מ-`https://static.arasaac.org/...` ב-`pictogramUrl()` ([arasaac.ts:11](../../src/lib/services/arasaac.ts#L11)).
- ElevenLabs ו-Gemini קוראים ישירות ל-API מהדפדפן ([elevenlabs.ts:120](../../src/lib/services/tts-providers/elevenlabs.ts#L120), [gemini.ts:170](../../src/lib/services/tts-providers/gemini.ts#L170)).
- מפתחות API נשמרים ב-`localStorage` (`elevenlabs-api-key`, `gemini-api-key`).
- אודיו לא נשמר — כל לחיצה על אותו טייל = קריאה חדשה ל-API = עלות מצטברת.
- אין שום cache לתמונות מעבר לדפדפן הפנימי.

### 1.2 הפערים והמטרות

| מטרה                   | מדד הצלחה                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **חיסכון בעלויות API** | אותו `(provider, voice, model, text)` נוצר פעם אחת בלבד גלובלית. לחיצה שנייה על "שלום" של משתמש B = R2 hit, לא API call. |
| **מהירות טעינה**       | טייל שכבר נשמע אצל המשתמש = play < 50ms (מ-IDB). תמונה שכבר נראתה = paint מיידי.                                         |
| **הסתרת מפתחות**       | `localStorage.getItem('elevenlabs-api-key')` יחזיר `null` בלקוח. המפתחות חיים רק ב-Cloudflare Secrets.                   |
| **הגנת זכויות**        | תמונות PCS בתשלום נגישות רק עם token תקף. R2 הוא bucket פרטי.                                                            |
| **אופליין רך**         | טייל שכבר ב-cache עובד גם offline. חדש — לא (לא scope).                                                                  |

### 1.3 החלטות שננעלו (מהשיחה)

1. **Worker נפרד באותו monorepo** — `proxy/` בצד `src/`.
2. **PCS images מאחורי auth** — bucket פרטי, Worker מגיש לפי session.
3. **משתמש רגיל בלבד, on-demand caching** — בלי precache, בלי Service Worker (לעת עתה).
4. **בלי cap על cache לקוח** — סטטיסטיקות + ניקוי ידני ב-`/settings`.
5. **API keys בלקוח נמחקים** — לא BYOK, לא היברידי.

---

## 2. טרמינולוגיה

| מונח           | משמעות                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Proxy**      | Cloudflare Worker חדש: `aac-proxy.workers.dev`. החלק היחיד שמכיר מפתחות API.                                                                           |
| **Asset hash** | `sha256(provider \| voiceId \| modelId \| text.normalize('NFC')).slice(0, 16)`. 64-bit מזהה דטרמיניסטי המחושב **גם בלקוח וגם בשרת**, באותו אופן בדיוק. |
| **L1 cache**   | IndexedDB בלקוח. `audio:<hash>` ו-`img:<source>:<id>`.                                                                                                 |
| **L2 cache**   | R2 bucket בשרת. `tts/<provider>/<hash>.<ext>` ו-`img/<source>/<id>.<ext>`.                                                                             |
| **Origin**     | ספק חיצוני: ARASAAC API, ElevenLabs API, Gemini API.                                                                                                   |

---

## 3. ארכיטקטורה

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser                                                         │
│                                                                  │
│  speak("שלום")                                                   │
│    ↓                                                             │
│  audio-cache.getOrCreate(req)                                    │
│    1. hash = ttsHash(req)                                        │
│    2. blob = idb.get('audio:' + hash)   ← L1 hit → play          │
│    3. miss → POST proxy/v1/tts          ← L2/origin              │
│    4. blob = GET proxy/v1/tts/:hash                              │
│    5. idb.put('audio:' + hash, blob)                             │
│    6. play                                                       │
│                                                                  │
│  IDB                                                             │
│  ┌─────────────────────────┬─────────────────────────┐           │
│  │  audio:<hash>           │  img:<source>:<id>      │           │
│  │  Blob<wav|mpeg>         │  Blob<png|webp>         │           │
│  └─────────────────────────┴─────────────────────────┘           │
└──────────────┬───────────────────────────────────────────────────┘
               │ fetch (CORS, JSON+blob)
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  aac-proxy.workers.dev  (Cloudflare Worker — Hono)               │
│                                                                  │
│  POST /v1/tts          tts-route → ttsCache.getOrCreate          │
│  GET  /v1/tts/:hash    tts-route → R2.get                        │
│  GET  /v1/img/:s/:id   image-route → R2.get / origin → R2.put    │
│  GET  /v1/voices/:p    voices-route → cached origin proxy        │
│  GET  /v1/health       health                                    │
│                                                                  │
│  Bindings:                                                       │
│   ASSETS (R2 bucket)        — both audio + images                │
│   META (KV namespace)       — voice list cache, future rate      │
│   ELEVENLABS_KEY (secret)                                        │
│   GEMINI_KEY (secret)                                            │
└──────────────┬───────────────────────────────────────────────────┘
               │
       ┌───────┴────────┬────────────────┐
       ▼                ▼                ▼
   ARASAAC          ElevenLabs        Gemini
   (public CDN)     (paid API)        (paid API)
```

### 3.1 שכבות cache — חוזה מדויק

| שכבה                       | מי כותב                            | מי קורא              | TTL      | פינוי                                                 |
| -------------------------- | ---------------------------------- | -------------------- | -------- | ----------------------------------------------------- |
| **L1 (IDB)**               | client (אחרי שהתקבל blob מהפרוקסי) | client               | אינסוף   | ידני דרך `/settings` (אין cap)                        |
| **L2 (R2 audio)**          | proxy (אחרי קריאת origin)          | proxy (לכל בקשת TTS) | אינסוף   | ידני דרך `wrangler r2 object delete` (אין auto-evict) |
| **L2 (R2 images ARASAAC)** | proxy (lazy)                       | proxy                | אינסוף   | ידני                                                  |
| **L2 (R2 images PCS)**     | אדמין (upload)                     | proxy עם auth        | אינסוף   | ידני                                                  |
| **L3 (KV voice list)**     | proxy                              | proxy                | 1h (TTL) | אוטומטי                                               |

**אינווריאנט**: H aif ה-hash זהה בלקוח ובשרת. שינוי ב-`ttsHash` חייב להישלח כעדכון לשני הצדדים יחד.

---

## 4. מבנה קוד

### 4.1 Layout

```
aac-board/
├── proxy/                           ← Worker חדש
│   ├── package.json
│   ├── tsconfig.json
│   ├── wrangler.jsonc
│   ├── vitest.config.ts
│   ├── src/
│   │   ├── index.ts                 ← Hono app + route mounting
│   │   ├── env.ts                   ← Bindings type
│   │   ├── routes/
│   │   │   ├── health.ts
│   │   │   ├── tts.ts
│   │   │   ├── images.ts
│   │   │   └── voices.ts
│   │   ├── domain/
│   │   │   ├── hash.ts              ← ttsHash — משותף עם client
│   │   │   ├── tts-cache.ts         ← deep module: getOrCreate(req) → {hash, mimeType, cached}
│   │   │   ├── image-cache.ts       ← deep module: getOrFetch(source, id) → blob
│   │   │   └── providers/
│   │   │       ├── types.ts         ← TtsOriginClient interface
│   │   │       ├── elevenlabs.ts
│   │   │       └── gemini.ts
│   │   └── adapters/
│   │       ├── r2-storage.ts        ← Storage interface impl ע"ג R2Bucket
│   │       └── kv-meta.ts
│   └── test/
│       ├── routes/                  ← integration tests דרך Hono app
│       ├── domain/                  ← unit tests של hash, tts-cache, image-cache
│       └── helpers/
│           ├── fake-storage.ts      ← in-memory Storage impl
│           ├── fake-kv.ts
│           └── fake-origin.ts       ← fake TtsOriginClient
│
├── src/lib/
│   ├── types/
│   │   └── api.ts                   ← contracts: TtsRequest, TtsResponse, ImageRef
│   ├── services/
│   │   ├── cache/
│   │   │   ├── audio-cache.ts       ← deep module: getOrCreateAudio(req) → Blob
│   │   │   ├── image-cache.ts       ← getImage(source, id) → objectURL
│   │   │   ├── hash.ts              ← ttsHash — ייבוא משותף או duplicate
│   │   │   └── stats.ts             ← getCacheStats(), clearAudio(), clearImages()
│   │   ├── proxy-client.ts          ← thin fetch wrapper סביב URL בסיס
│   │   ├── arasaac.ts               ← שינוי קל: pictogramUrl עובר דרך getImage
│   │   ├── tts.ts                   ← speak() קורא ל-audio-cache, לא ישירות לproviders
│   │   └── tts-providers/
│   │       ├── elevenlabs.ts        ← getVoices דרך proxy; speak נמחק (עובר ל-tts.ts)
│   │       └── gemini.ts            ← אותו דבר
│   └── ...
│
└── docs/plans/cache-and-proxy.md    ← המסמך הזה
```

### 4.2 Contracts ([src/lib/types/api.ts](../../src/lib/types/api.ts))

```ts
// משותף ללקוח ולפרוקסי. מועתק/symlinked ל-proxy/src/types.ts במהלך build,
// או מיובא דרך path mapping ב-tsconfig של ה-proxy.

export type TtsProviderId = 'elevenlabs' | 'gemini';
export type ImageSource = 'arasaac' | 'pcs' | 'user';

export interface TtsRequest {
	text: string;
	provider: TtsProviderId;
	voiceId: string;
	modelId: string;
	lang?: string;
}

export interface TtsResponse {
	/** 16 hex chars. דטרמיניסטי על TtsRequest. */
	hash: string;
	mimeType: 'audio/wav' | 'audio/mpeg';
	/** האם נוצר עכשיו (false) או הוחזר מ-cache (true). אינפורמטיבי בלבד. */
	cached: boolean;
}

export interface VoiceItem {
	id: string;
	name: string;
	lang?: string;
}

export interface VoicesResponse {
	voices: VoiceItem[];
}

export interface ProxyError {
	error: string;
	code: 'origin_failed' | 'invalid_request' | 'unauthorized' | 'not_found' | 'internal';
}
```

### 4.3 Hash — קוד משותף

```ts
// proxy/src/domain/hash.ts  ←→  src/lib/services/cache/hash.ts (זהה)
import type { TtsRequest } from './types';

export async function ttsHash(req: TtsRequest): Promise<string> {
	const normalized = [
		req.provider,
		req.voiceId,
		req.modelId,
		req.text.trim().normalize('NFC')
	].join('|');
	const buf = new TextEncoder().encode(normalized);
	const digest = await crypto.subtle.digest('SHA-256', buf);
	return Array.from(new Uint8Array(digest))
		.slice(0, 8)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}
```

החלטה: הקובץ נכתב פעם אחת ומועתק (או דרך `vite-plugin-static-copy` או טריגר build). הטסטים לוודאים זהות (ראה §6).

---

## 5. עיצוב Deep Modules

עיקרון: ממשק קטן, לוגיקה עמוקה. הקוראים רואים פעולה אחת; הסיבוך מוסתר.

### 5.1 בלקוח: `audio-cache.ts`

```ts
// Public surface — שורה אחת לכל הצרכן (tts.ts):
export async function getOrCreateAudio(req: TtsRequest): Promise<Blob>;

// פנימה: hash → idb.get → fetch proxy POST → fetch proxy GET → idb.put.
// ה-caller לא יודע על שום דבר מזה.
```

### 5.2 בשרת: `domain/tts-cache.ts`

```ts
export interface TtsCache {
	getOrCreate(req: TtsRequest): Promise<{ hash: string; cached: boolean; mimeType: string }>;
	getBlob(hash: string): Promise<{ blob: ArrayBuffer; mimeType: string } | null>;
}

// תלויות (DI):
export function createTtsCache(deps: {
	storage: BlobStorage; // R2 wrapper
	providers: Record<TtsProviderId, TtsOriginClient>;
}): TtsCache;
```

הממשק הציבורי הוא 2 פונקציות. בפנים: hash, R2 lookup, origin call, R2 put, normalization של mime לפי provider.

### 5.3 הזרקת תלויות

כל המודולים העמוקים מקבלים את ה-IO שלהם דרך פרמטר/factory. מבחנים מזריקים `fake-storage`, `fake-origin` (in-memory). אין `mock` של מודולים פנימיים — רק boundaries (ראה §6.4).

```ts
// proxy/src/domain/providers/types.ts
export interface TtsOriginClient {
	speak(req: TtsRequest): Promise<{ buffer: ArrayBuffer; mimeType: 'audio/wav' | 'audio/mpeg' }>;
	listVoices(lang?: string): Promise<VoiceItem[]>;
}

// proxy/src/adapters/r2-storage.ts
export interface BlobStorage {
	get(key: string): Promise<{ buffer: ArrayBuffer; mimeType: string } | null>;
	put(key: string, buffer: ArrayBuffer, mimeType: string): Promise<void>;
}
```

---

## 6. תוכנית בדיקות (TDD)

### 6.1 עקרונות

1. **Behavior, not structure** — מבחן בודק "speak של אותו טקסט פעמיים = origin call אחד", לא "tts-cache.put נקרא".
2. **Public interface only** — לא מבחנים על פונקציות פרטיות, אין assert על call count פנימי.
3. **Vertical slices** — מבחן אחד → קוד מינימלי שיעבור → עוד מבחן.
4. **Fakes ב-boundaries** — `fake-storage` במקום R2, `fake-origin` במקום ElevenLabs. מודולים פנימיים נקראים אמיתית.
5. **Integration over unit לתעדוף** — לכל route, יש מבחן שמרים את כל ה-Hono app עם fakes ובודק תוצר ה-HTTP.

### 6.2 פירמידת הטסטים

```
                E2E (Playwright)
              ────────────────
              לוחץ tile → נשמע
        (1 happy path בלבד)
              ────────────────────
       Integration (vitest)
       Hono app + fakes — כל route
        ────────────────────────────────
   Unit (vitest)
   hash, normalization, edge cases
```

### 6.3 Behaviors שתחומים לבדיקה — סדר vertical slices

הסדר מתחיל מהמינימום שמוכיח את ה-end-to-end ("tracer bullet"), ובכל פעם מוסיף התנהגות אחת.

#### Stage A — Proxy skeleton + health

- **A1**. `GET /v1/health` returns 200 with `{ ok: true }`.

#### Stage B — Hash determinism

- **B1**. `ttsHash` מחזיר את אותו hash על אותו input.
- **B2**. `ttsHash` שונה כשטקסט שונה רק בעוד רווח (אחרי trim — זהה).
- **B3**. `ttsHash` בלקוח == `ttsHash` בשרת על אותו input. **מבחן חי בשני הצדדים** עם vector קבוע.

#### Stage C — TTS proxy: origin → cache → reply (tracer bullet הראשון)

- **C1**. POST `/v1/tts` עם `{provider, voice, model, text}` חדש: origin נקרא, R2 שמור, response = `{hash, cached:false, mimeType}`.
- **C2**. POST `/v1/tts` עם בקשה זהה שנייה: origin **לא** נקרא, response = `{hash, cached:true}`.
- **C3**. GET `/v1/tts/:hash` אחרי C1: 200 עם blob ו-Content-Type נכון.
- **C4**. GET `/v1/tts/:unknown_hash`: 404.
- **C5**. POST `/v1/tts` עם provider לא מוכר: 400 invalid_request.
- **C6**. POST `/v1/tts` כשorigin מחזיר שגיאה: 502 origin_failed, **לא נכתב** ל-R2.
- **C7**. שני providers מייצרים hashes שונים על אותו טקסט+קול+מודל.

#### Stage D — Client audio cache

- **D1**. `getOrCreateAudio` קורא לפרוקסי פעם אחת, שומר blob ב-IDB, מחזיר Blob.
- **D2**. קריאה שנייה עם אותו `TtsRequest`: לא נקרא ה-proxy (fake fetch counter), Blob מוחזר.
- **D3**. שינוי בטקסט → fetch חדש לפרוקסי.
- **D4**. שגיאת רשת → throw, IDB לא מתעדכן (קריאה הבאה תנסה שוב).
- **D5**. `clearAudioCache()` מרוקן את כל המפתחות `audio:`, לא נוגע ב-`img:` ולא בלוחות.
- **D6**. `getCacheStats()` סופר מפתחות וגדלים נכון.

#### Stage E — Image proxy

- **E1**. GET `/v1/img/arasaac/12345`: origin נקרא, R2 שמור, blob מוחזר עם `Cache-Control: immutable`.
- **E2**. GET שנייה לאותו ID: origin **לא** נקרא, R2 hit.
- **E3**. GET `/v1/img/pcs/<id>` בלי `Authorization`: 401 (גם אם הקובץ קיים ב-R2).
- **E4**. GET `/v1/img/pcs/<id>` עם token תקף: 200 עם blob. (שלב E מסתיים ב-stub auth — `Bearer dev-token` בלבד; integration האמיתי בשלב F.)
- **E5**. GET ל-source לא חוקי: 400.
- **E6**. GET ל-ID שלא נמצא ב-origin (404 מ-ARASAAC): 404.

#### Stage F — Client image cache

- **F1**. `getImage('arasaac', '12345')` קורא לפרוקסי, שומר Blob, מחזיר objectURL.
- **F2**. קריאה שנייה: לא נקרא הפרוקסי. (זיהוי דרך fake fetch.)
- **F3**. החלפת `pictogramUrl` ב-`getImage` ב-component רנדומלי לא שובר rendering.

#### Stage G — Voices proxy

- **G1**. GET `/v1/voices/elevenlabs`: origin נקרא, response cached ב-KV ל-1h, מחזיר `{voices:[...]}`.
- **G2**. בקשה שנייה תוך TTL: KV hit, origin לא נקרא.
- **G3**. provider לא קיים: 400.

#### Stage H — Settings UI behaviors

- **H1**. `/settings` מציג `images: N (X MB), audio: M (Y MB)`.
- **H2**. לחיצה על "ניקוי הקלטות": after stats, audio = 0, images = N (לא נגוע).
- **H3**. שדות ה-API key הוסרו מ-DOM (אין `input[name=elevenlabs-api-key]`).
- **H4**. בעת migration ראשון אחרי deploy: `localStorage.elevenlabs-api-key` נמחק; toast מופיע פעם אחת.

#### Stage I — Integration ב-tts.ts

- **I1**. קריאה ל-`speak("שלום")` עם provider=gemini ו-cache hit: לא יוצא fetch לפרוקסי, הצליל מתנגן.
- **I2**. cache miss → fetch → save → play. (במבחן הזה ה-`Audio` element mocked, ה-fetch fake.)
- **I3**. אם רשת נופלת ויש cache hit: עדיין מתנגן.
- **I4**. רשת נופלת ו-cache miss: throw, ו-fallback ל-Web Speech (התנהגות קיימת).

#### Stage J — E2E (Playwright)

- **J1**. משתמש מגיע ל-`/`, לוחץ על טייל "שלום" פעמיים. רק קריאת רשת אחת ל-proxy בנטוורק טאב. (אסרציה דרך Playwright route interception.)

### 6.4 גבולות ל-mocking

| מודול                     | מבחנים משתמשים ב...                                  | למה                                                                         |
| ------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `domain/tts-cache.ts`     | `fake-storage`, `fake-origin` (in-memory)            | Boundaries בלבד. הלוגיקה של hash → lookup → origin → put אמיתית.            |
| `routes/tts.ts`           | אותם fakes דרך `app.fetch(req, env)`                 | בודק את כל ה-stack של Hono.                                                 |
| `audio-cache.ts` (client) | `fakeFetch` (boundary), `fake-idb-keyval` (boundary) | ה-IDB הוא system boundary; דרכי הקריאה עצמן — אמיתיות.                      |
| `tts.ts`                  | mocked `audio-cache` או fake fetch + fake idb?       | **fake fetch + fake idb**. לא מפתחים את ה-`audio-cache` כ-mock כי הוא שלנו. |
| Integration test ב-Hono   | `r2: undefined`? לא — fake R2 ש-implements interface | יציבות מבחנים.                                                              |

### 6.5 כלים

- **Vitest** ב-`proxy/` (חדש) ו-`src/` (קיים).
- **Hono client** (`app.request(...)`) להפעלת ה-Worker מבלי להעלות אותו אמיתית.
- **`fake-indexeddb`** (npm) ב-`src/` לטסטים על audio/image cache.
- **Playwright** (קיים) ל-J1.
- **Wrangler dev** למבחני smoke ידני בלבד, לא חלק מ-CI.

---

## 7. תוכנית מימוש מסודרת

הסדר מותאם לעקרונות TDD. כל שלב = יחידת PR אחת קטנה.

### Phase 1 — Tracer bullet (שלבים A → C → תיאום)

**מטרה**: הוכחה שהמבנה עובד end-to-end על TTS אחד פשוט.

1. **PR-1.1**: scaffold `proxy/` + Hono + `/v1/health`. מבחן A1.
2. **PR-1.2**: `domain/hash.ts` + `src/lib/services/cache/hash.ts` (זהים). מבחנים B1-B3 (כולל vector משותף).
3. **PR-1.3**: `BlobStorage`, `TtsOriginClient` interfaces + fakes. `tts-cache.ts` (deep module). מבחנים: getOrCreate שני קולות זהים = origin once.
4. **PR-1.4**: `routes/tts.ts` עם POST + GET. מבחנים C1–C7. R2 binding עדיין לא מחובר; משתמשים ב-fake בייצור-לוקאלי.
5. **PR-1.5**: `proxy/wrangler.jsonc` + R2 bucket אמיתי + secrets. `r2-storage.ts` adapter. wrangler dev manual smoke.
6. **PR-1.6**: client `audio-cache.ts` + `proxy-client.ts` + `types/api.ts`. מבחנים D1–D6.
7. **PR-1.7**: שילוב ב-`tts.ts` ו-`tts-providers/*`. הסרה של `fetch` ישיר ל-API. מבחנים I1–I4.
8. **PR-1.8**: deploy ל-`aac-proxy.workers.dev`. הגדרת `VITE_PROXY_URL` ב-build. בדיקה ידנית: לחיצה על טייל מייצרת אודיו.

**Definition of done של Phase 1**: לוחצים "שלום" באפליקציה — מתנגן. לוחצים שוב — Network tab מראה 0 requests חדשים. localStorage לא מכיל מפתחות API יותר.

### Phase 2 — Images (שלבים E → F)

1. **PR-2.1**: `image-cache.ts` בשרת + routes/images.ts (ARASAAC בלבד). מבחנים E1, E2, E5, E6.
2. **PR-2.2**: client `image-cache.ts` + `getImage`. מבחנים F1, F2.
3. **PR-2.3**: שינוי `arasaac.pictogramUrl` להחזיר `${PROXY}/v1/img/arasaac/${id}` + `<img>` מקומי דרך `getImage`. מבחן F3 + smoke ידני.

### Phase 3 — Voices + Settings UI (שלבים G + H)

1. **PR-3.1**: `routes/voices.ts` + KV adapter. מבחנים G1–G3.
2. **PR-3.2**: שינוי `elevenlabs.getVoices` ו-`gemini.getVoices` לעבור דרך proxy.
3. **PR-3.3**: `cache/stats.ts` + UI ב-`/settings`. מבחנים H1–H4 (כולל migration).

### Phase 4 — PCS auth (שלב E4 רציני)

1. **PR-4.1**: design של auth (תלוי במודל המשתמשים — ייתכן שזה pulls in user accounts). חוסם את הזרם הזה — לכן זה שלב נפרד אחרי שיחה נפרדת.

### Phase 5 — Hardening (אופציונלי)

- Rate limiting.
- Observability (Cloudflare Analytics / Logpush).
- Backup R2 → R2 cross-region (אם נדרש).

---

## 8. מבני נתונים מדויקים

### 8.1 R2 keys

```
tts/elevenlabs/<hash>.mp3
tts/gemini/<hash>.wav
img/arasaac/<id>/<size>.png       # size = 300 כברירת מחדל
img/pcs/<sku>.png
img/user/<userId>/<id>.png        # שלב עתידי
```

### 8.2 KV keys

```
voices:elevenlabs        → JSON<VoiceItem[]>, TTL 3600s
voices:gemini            → JSON<VoiceItem[]>, TTL 3600s
rl:<ip>:<minute>         → number, TTL 70s     (Phase 5)
session:<token>          → JSON<{userId,expiresAt}>  (Phase 4)
```

### 8.3 IDB keys (idb-keyval default store)

```
audio:<hash>             → Blob
img:<source>:<id>        → Blob
# לוחות וסטים נשארים כמו היום (boards-index, board:<id>, set:<id>, ...)
```

חוצה מרחבי שמות: prefix `audio:` ו-`img:` לא מתנגש עם prefixים קיימים ([storage.ts:5-10](../../src/lib/services/storage.ts#L5-L10)).

---

## 9. Wrangler config

### 9.1 `proxy/wrangler.jsonc`

```jsonc
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "aac-proxy",
	"main": "src/index.ts",
	"compatibility_date": "2026-03-12",
	"compatibility_flags": ["nodejs_als"],
	"r2_buckets": [{ "binding": "ASSETS", "bucket_name": "aac-assets" }],
	"kv_namespaces": [{ "binding": "META", "id": "<created-by-wrangler>" }],
	"vars": {
		"ALLOWED_ORIGINS": "https://aac-board.aybritman.workers.dev,http://localhost:5173"
	},
	"observability": { "enabled": true }
}
```

Secrets:

```
wrangler secret put ELEVENLABS_KEY --name aac-proxy
wrangler secret put GEMINI_KEY --name aac-proxy
```

### 9.2 שינוי ב-app

`vite.config.ts` יצטרך לאפשר `VITE_PROXY_URL`:

```ts
// .env (gitignored, או .dev.vars)
VITE_PROXY_URL=https://aac-proxy.aybritman.workers.dev
```

ב-`.env.example` (committed): ערך placeholder.

---

## 10. סיכונים ותגובות

| סיכון                            | סבירות                   | תגובה                                                                                                                         |
| -------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Hash collision (64-bit)          | נמוכה מאוד (~2^32 קבצים) | מעבר ל-128-bit אם cache עובר 100M פריטים                                                                                      |
| R2 cold-start latency            | בינונית                  | מקבילים את שתי הקריאות (POST → GET) באמצעות single endpoint שמחזיר את ה-blob ישירות בfirst-time, אם נדרש (אופטימיזציה עתידית) |
| CORS preflight בכל לחיצה         | בינונית                  | Hono CORS middleware מטפל; וידוא ידני ב-Phase 1                                                                               |
| משתמש offline אחרי שינוי טקסט    | בינונית                  | fallback ל-Web Speech כבר קיים ב-[tts.ts:101](../../src/lib/services/tts.ts#L101)                                             |
| ARASAAC API שינוי URL            | נמוכה                    | encapsulated ב-`origin/arasaac.ts` בפרוקסי בלבד                                                                               |
| Quota IDB                        | נמוכה                    | אין cap, אבל UI חושף stats; משתמש יכול לנקות                                                                                  |
| Migration שמוחק keys שהמשתמש רצה | נמוכה                    | toast עם undo? לא — הזהרה ב-changelog; מי שצריך BYOK עתידי יקבל UI חדש                                                        |
| Hash drift בין client ל-server   | קריטי אם יקרה            | מבחן B3 רץ בשני הצדדים על אותו vector — חוסם את ה-CI                                                                          |

---

## 11. מה לא בסקופ

- אופליין מלא (Service Worker + precache).
- BYOK / הזנת API keys בלקוח.
- ניהול quota per-user.
- Streaming audio (בfirst-time, ה-blob יושב בזיכרון לפני play — מקובל לטקסטים קצרים).
- ניהול גרסאות של מודלים (אם Gemini משנה מודל ויוצר קול שונה לאותו hash — ייתכן stale; פתרון: כלול גרסה ב-modelId או הוסף `version` ל-hash בעתיד).
- תמיכה ב-Polly/Azure TTS — אדישה ל-architecture, נוספת באותה תבנית `TtsOriginClient`.

---

## 12. קבצים שייווצרו / ישתנו

### חדשים

- `proxy/` — כל התיקייה.
- [src/lib/types/api.ts](../../src/lib/types/api.ts)
- [src/lib/services/cache/audio-cache.ts](../../src/lib/services/cache/audio-cache.ts)
- [src/lib/services/cache/image-cache.ts](../../src/lib/services/cache/image-cache.ts)
- [src/lib/services/cache/hash.ts](../../src/lib/services/cache/hash.ts)
- [src/lib/services/cache/stats.ts](../../src/lib/services/cache/stats.ts)
- [src/lib/services/proxy-client.ts](../../src/lib/services/proxy-client.ts)
- `.env.example`

### שינויים

- [src/lib/services/tts.ts](../../src/lib/services/tts.ts) — `speak` קורא ל-audio-cache.
- [src/lib/services/tts-providers/elevenlabs.ts](../../src/lib/services/tts-providers/elevenlabs.ts) — הסרת fetch ישיר; getVoices דרך proxy.
- [src/lib/services/tts-providers/gemini.ts](../../src/lib/services/tts-providers/gemini.ts) — אותו דבר.
- [src/lib/services/arasaac.ts](../../src/lib/services/arasaac.ts) — `pictogramUrl` עובר דרך proxy.
- [src/routes/settings/+page.svelte](../../src/routes/settings/+page.svelte) — הסרת שדות API key, הוספת cache stats.
- [package.json](../../package.json) — `fake-indexeddb` כ-devDependency.

---

## 13. פתוחים לדיון

1. **Path mapping vs duplicate** של `hash.ts` בין client ל-proxy: שמירה במקום אחד והעתקה ב-build, או duplicate עם מבחן זהות? (העדפה: duplicate + מבחן B3 חי בשני הצדדים. פשוט יותר.)
2. **R2 binding בפיתוח לוקאלי**: wrangler יוצר R2 emulator; לא נדרש cloud account ל-`bun run test`. וידוא ב-PR-1.5.
3. **Migration toast** — מתי בדיוק להציג? פעם אחת per user. שמירת flag `cache-proxy-migrated: true` ב-IDB.
4. **Hono או vanilla Worker?** Hono: routing, CORS middleware, validation מוכנים. Overhead זניח. **המלצה: Hono.**

---

## 14. גרסאות עתידיות שכדאי לתכנן עליהן

- **Versioning של hash**: כשנוסיף `lang` כפרמטר משמעותי (ל-Gemini זה כבר קריטי), נכלול גם אותו ב-hash. חובה לעדכן את שני הצדדים יחד.
- **Multi-tenant**: כש-`/u/<userId>/...` ייכנס ([architecture.md:101](architecture.md#L101)), R2 keys ל-PCS images יקבלו prefix של userId.
- **Background prefetch**: כשהמשתמש פותח לוח, prefetch של כל ה-tiles שלא ב-IDB. אופציונלי, נוסף בקלות.
- **Service Worker offline**: אם משתמשים יבקשו אופליין מלא, ה-SW יכול לעטוף את אותו `audio-cache`/`image-cache` בלי שינוי לוגיקה.

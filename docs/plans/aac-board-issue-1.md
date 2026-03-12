# כותרת Issue

> Board rendering + TTS — שלב 1 ליבה

**גוף:**

8 משימות מפורטות עם checkboxes:

1. **נתוני לוח סטטיים** — ייבוא boards.json, TypeScript types, קובץ דוגמה
2. **Board Store** — Svelte 5 runes, `$state` ללוח + output bar + navigation stack
3. **Board.svelte** — CSS Grid, גודל דינמי, RTL, responsive
4. **Tile.svelte** — סמל ARASAAC + תווית, צבע קטגוריה, border-radius + צל + אנימציה, button/folder
5. **OutputBar.svelte** — סמלים שנלחצו, כפתור נקה, כפתור "דבר הכל"
6. **TTS** — Web Speech API, `he-IL`, speak per tile + speak all
7. **ניווט** — folder → loadBoard, חזרה (stack), בית
8. **Layout** — `dir="rtl"`, `lang="he"`, home board ב-`+page.svelte`

**קריטריונים להצלחה:**

- `bun dev` → לוח עם אריחים בעברית
- לחיצה = דיבור
- תיקייה = ניווט
- Output bar + "דבר הכל" עובד
- עיצוב מודרני, RTL, טאבלט

**מחוץ לסקופ** ברור: לא auth, לא API, לא settings, לא Grid Sets, לא DnD, לא ElevenLabs, לא i18n, לא PWA, לא edit mode.

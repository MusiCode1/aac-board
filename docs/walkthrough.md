# AAC Board — יומן פיתוח (Walkthrough)

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

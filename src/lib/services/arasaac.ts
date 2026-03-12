const BASE = 'https://static.arasaac.org/pictograms';
const API = 'https://api.arasaac.org/v1/pictograms';

export interface ArasaacResult {
	_id: number;
	keywords: { keyword: string }[];
	imageUrl: string;
}

/** Build an ARASAAC pictogram URL */
export function pictogramUrl(id: number, size = 300): string {
	return `${BASE}/${id}/${id}_${size}.png`;
}

/** Session-level cache */
const cache = new Map<string, ArasaacResult[]>();

/** Search ARASAAC pictograms by keyword */
export async function searchPictograms(
	keyword: string,
	lang = 'he',
	signal?: AbortSignal
): Promise<ArasaacResult[]> {
	const trimmed = keyword.trim().toLowerCase();
	if (trimmed.length < 2) return [];

	const cacheKey = `${lang}:${trimmed}`;
	const cached = cache.get(cacheKey);
	if (cached) return cached;

	try {
		const res = await fetch(`${API}/${lang}/search/${encodeURIComponent(trimmed)}`, { signal });
		if (!res.ok) return [];

		const data: { _id: number; keywords: { keyword: string }[] }[] = await res.json();
		const results: ArasaacResult[] = data.map((item) => ({
			_id: item._id,
			keywords: item.keywords,
			imageUrl: pictogramUrl(item._id)
		}));

		cache.set(cacheKey, results);
		return results;
	} catch {
		// Network error or aborted — return empty
		return [];
	}
}

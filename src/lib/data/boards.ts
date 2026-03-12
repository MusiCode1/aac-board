import type { Board } from '$lib/types/board';

/**
 * ARASAAC pictogram base URL.
 * Usage: `${ARASAAC_BASE}/<id>/300` for a 300px pictogram.
 */
const A = 'https://static.arasaac.org/pictograms';

/** Helper to build an ARASAAC pictogram URL */
function pic(id: number): string {
	return `${A}/${id}/${id}_300.png`;
}

export const HOME_BOARD_ID = 'home';

export const boards: Record<string, Board> = {
	home: {
		id: 'home',
		name: 'בית',
		grid: { rows: 4, columns: 5 },
		tiles: [
			// Row 1 — core words
			{
				id: 'h1',
				label: 'אני',
				image: pic(6332),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			{
				id: 'h2',
				label: 'רוצה',
				image: pic(7942),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'h3',
				label: 'לא',
				image: pic(5765),
				backgroundColor: '#EF9A9A',
				borderColor: '#C62828',
				type: 'button'
			},
			{
				id: 'h4',
				label: 'כן',
				image: pic(4994),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'h5',
				label: 'עוד',
				image: pic(7061),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			// Row 2
			{
				id: 'h6',
				label: 'שלום',
				image: pic(6808),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			},
			{
				id: 'h7',
				label: 'תודה',
				image: pic(7637),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			},
			{
				id: 'h8',
				label: 'עזרה',
				image: pic(3025),
				backgroundColor: '#EF9A9A',
				borderColor: '#C62828',
				type: 'button'
			},
			{
				id: 'h9',
				label: 'אוכל',
				image: pic(2572),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'folder',
				loadBoard: 'food'
			},
			{
				id: 'h10',
				label: 'משחקים',
				image: pic(3432),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'folder',
				loadBoard: 'games'
			},
			// Row 3
			{
				id: 'h11',
				label: 'אני אוהב',
				image: pic(6345),
				backgroundColor: '#F48FB1',
				borderColor: '#C2185B',
				type: 'button'
			},
			{
				id: 'h12',
				label: 'הולך',
				image: pic(6674),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'h13',
				label: 'בבקשה',
				image: pic(6815),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			},
			{
				id: 'h14',
				label: 'רגשות',
				image: pic(2416),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'folder',
				loadBoard: 'feelings'
			},
			{
				id: 'h15',
				label: 'מקומות',
				image: pic(2736),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'folder',
				loadBoard: 'places'
			},
			// Row 4
			{
				id: 'h16',
				label: 'גדול',
				image: pic(2251),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			{
				id: 'h17',
				label: 'קטן',
				image: pic(6613),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			{
				id: 'h18',
				label: 'לשתות',
				image: pic(2382),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'h19',
				label: 'להתלבש',
				image: pic(2387),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'h20',
				label: 'שירותים',
				image: pic(7704),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'button'
			}
		]
	},
	food: {
		id: 'food',
		name: 'אוכל',
		grid: { rows: 3, columns: 4 },
		tiles: [
			{
				id: 'f1',
				label: 'לחם',
				image: pic(2334),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'button'
			},
			{
				id: 'f2',
				label: 'תפוח',
				image: pic(2210),
				backgroundColor: '#EF9A9A',
				borderColor: '#C62828',
				type: 'button'
			},
			{
				id: 'f3',
				label: 'בננה',
				image: pic(2247),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			{
				id: 'f4',
				label: 'חלב',
				image: pic(2602),
				backgroundColor: '#E0E0E0',
				borderColor: '#616161',
				type: 'button'
			},
			{
				id: 'f5',
				label: 'מים',
				image: pic(2813),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'f6',
				label: 'עוגה',
				image: pic(2279),
				backgroundColor: '#F48FB1',
				borderColor: '#C2185B',
				type: 'button'
			},
			{
				id: 'f7',
				label: 'גלידה',
				image: pic(2577),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			},
			{
				id: 'f8',
				label: 'פיצה',
				image: pic(2693),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'button'
			},
			{
				id: 'f9',
				label: 'ביצה',
				image: pic(2485),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			{
				id: 'f10',
				label: 'אורז',
				image: pic(2554),
				backgroundColor: '#E0E0E0',
				borderColor: '#616161',
				type: 'button'
			},
			{
				id: 'f11',
				label: 'מרק',
				image: pic(7486),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'button'
			},
			{
				id: 'f12',
				label: 'עוגיה',
				image: pic(2340),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'button'
			}
		]
	},
	games: {
		id: 'games',
		name: 'משחקים',
		grid: { rows: 3, columns: 4 },
		tiles: [
			{
				id: 'g1',
				label: 'כדור',
				image: pic(2232),
				backgroundColor: '#EF9A9A',
				borderColor: '#C62828',
				type: 'button'
			},
			{
				id: 'g2',
				label: 'בובה',
				image: pic(2383),
				backgroundColor: '#F48FB1',
				borderColor: '#C2185B',
				type: 'button'
			},
			{
				id: 'g3',
				label: 'ציור',
				image: pic(2388),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'g4',
				label: 'מוזיקה',
				image: pic(2634),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			},
			{
				id: 'g5',
				label: 'פאזל',
				image: pic(5064),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'g6',
				label: 'ספר',
				image: pic(2318),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'g7',
				label: 'טלוויזיה',
				image: pic(7601),
				backgroundColor: '#E0E0E0',
				borderColor: '#616161',
				type: 'button'
			},
			{
				id: 'g8',
				label: 'מחשב',
				image: pic(2337),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'g9',
				label: 'חצר',
				image: pic(3430),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'g10',
				label: 'בריכה',
				image: pic(7558),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'g11',
				label: 'נדנדה',
				image: pic(7558),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'g12',
				label: 'רכיבה',
				image: pic(2258),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'button'
			}
		]
	},
	feelings: {
		id: 'feelings',
		name: 'רגשות',
		grid: { rows: 3, columns: 4 },
		tiles: [
			{
				id: 'e1',
				label: 'שמח',
				image: pic(2549),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			{
				id: 'e2',
				label: 'עצוב',
				image: pic(7194),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'e3',
				label: 'כועס',
				image: pic(2208),
				backgroundColor: '#EF9A9A',
				borderColor: '#C62828',
				type: 'button'
			},
			{
				id: 'e4',
				label: 'מפחד',
				image: pic(2523),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			},
			{
				id: 'e5',
				label: 'עייף',
				image: pic(7654),
				backgroundColor: '#E0E0E0',
				borderColor: '#616161',
				type: 'button'
			},
			{
				id: 'e6',
				label: 'רעב',
				image: pic(2575),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'button'
			},
			{
				id: 'e7',
				label: 'צמא',
				image: pic(7643),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'e8',
				label: 'חולה',
				image: pic(7296),
				backgroundColor: '#EF9A9A',
				borderColor: '#C62828',
				type: 'button'
			},
			{
				id: 'e9',
				label: 'נהנה',
				image: pic(2549),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'e10',
				label: 'מופתע',
				image: pic(7580),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			{
				id: 'e11',
				label: 'אוהב',
				image: pic(6345),
				backgroundColor: '#F48FB1',
				borderColor: '#C2185B',
				type: 'button'
			},
			{
				id: 'e12',
				label: 'לבד',
				image: pic(2197),
				backgroundColor: '#E0E0E0',
				borderColor: '#616161',
				type: 'button'
			}
		]
	},
	places: {
		id: 'places',
		name: 'מקומות',
		grid: { rows: 3, columns: 4 },
		tiles: [
			{
				id: 'p1',
				label: 'בית',
				image: pic(2736),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'button'
			},
			{
				id: 'p2',
				label: 'בית ספר',
				image: pic(7267),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'p3',
				label: 'גן',
				image: pic(3430),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'p4',
				label: 'חנות',
				image: pic(7286),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			},
			{
				id: 'p5',
				label: 'פארק',
				image: pic(3430),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'p6',
				label: 'רופא',
				image: pic(2380),
				backgroundColor: '#EF9A9A',
				borderColor: '#C62828',
				type: 'button'
			},
			{
				id: 'p7',
				label: 'מסעדה',
				image: pic(6858),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'button'
			},
			{
				id: 'p8',
				label: 'ים',
				image: pic(7262),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'p9',
				label: 'סבתא',
				image: pic(3471),
				backgroundColor: '#F48FB1',
				borderColor: '#C2185B',
				type: 'button'
			},
			{
				id: 'p10',
				label: 'סבא',
				image: pic(3469),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'p11',
				label: 'מגרש',
				image: pic(7362),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'p12',
				label: 'ספרייה',
				image: pic(6375),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			}
		]
	}
};

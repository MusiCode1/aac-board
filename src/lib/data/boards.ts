import type { Board } from '$lib/types/board';

/**
 * ARASAAC pictogram base URL.
 * IDs verified against https://api.arasaac.org/api/pictograms/all/he
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
				image: pic(2617),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			{
				id: 'h2',
				label: 'רוצה',
				image: pic(5441),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'h3',
				label: 'לא',
				image: pic(5525),
				backgroundColor: '#EF9A9A',
				borderColor: '#C62828',
				type: 'button'
			},
			{
				id: 'h4',
				label: 'כן',
				image: pic(5584),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'h5',
				label: 'עוד',
				image: pic(26913),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			// Row 2
			{
				id: 'h6',
				label: 'שלום',
				image: pic(6009),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			},
			{
				id: 'h7',
				label: 'תודה',
				image: pic(8128),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			},
			{
				id: 'h8',
				label: 'עזרה',
				image: pic(12252),
				backgroundColor: '#EF9A9A',
				borderColor: '#C62828',
				type: 'button'
			},
			{
				id: 'h9',
				label: 'אוכל',
				image: pic(4610),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'folder',
				loadBoard: 'food'
			},
			{
				id: 'h10',
				label: 'משחקים',
				image: pic(32574),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'folder',
				loadBoard: 'games'
			},
			// Row 3
			{
				id: 'h11',
				label: 'אוהב',
				image: pic(6600),
				backgroundColor: '#F48FB1',
				borderColor: '#C2185B',
				type: 'button'
			},
			{
				id: 'h12',
				label: 'הולך',
				image: pic(2432),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'h13',
				label: 'בבקשה',
				image: pic(8194),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			},
			{
				id: 'h14',
				label: 'רגשות',
				image: pic(11476),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'folder',
				loadBoard: 'feelings'
			},
			{
				id: 'h15',
				label: 'מקומות',
				image: pic(32178),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'folder',
				loadBoard: 'places'
			},
			// Row 4
			{
				id: 'h16',
				label: 'גדול',
				image: pic(4658),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			{
				id: 'h17',
				label: 'קטן',
				image: pic(4716),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			{
				id: 'h18',
				label: 'לשתות',
				image: pic(2276),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'h19',
				label: 'להתלבש',
				image: pic(2781),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'h20',
				label: 'שירותים',
				image: pic(2430),
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
				image: pic(2494),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'button'
			},
			{
				id: 'f2',
				label: 'תפוח',
				image: pic(2462),
				backgroundColor: '#EF9A9A',
				borderColor: '#C62828',
				type: 'button'
			},
			{
				id: 'f3',
				label: 'בננה',
				image: pic(2530),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			{
				id: 'f4',
				label: 'חלב',
				image: pic(2445),
				backgroundColor: '#E0E0E0',
				borderColor: '#616161',
				type: 'button'
			},
			{
				id: 'f5',
				label: 'מים',
				image: pic(2248),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'f6',
				label: 'עוגה',
				image: pic(2502),
				backgroundColor: '#F48FB1',
				borderColor: '#C2185B',
				type: 'button'
			},
			{
				id: 'f7',
				label: 'גלידה',
				image: pic(34092),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			},
			{
				id: 'f8',
				label: 'פיצה',
				image: pic(2527),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'button'
			},
			{
				id: 'f9',
				label: 'ביצה',
				image: pic(2427),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			{
				id: 'f10',
				label: 'אורז',
				image: pic(6911),
				backgroundColor: '#E0E0E0',
				borderColor: '#616161',
				type: 'button'
			},
			{
				id: 'f11',
				label: 'מרק',
				image: pic(2573),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'button'
			},
			{
				id: 'f12',
				label: 'עוגיה',
				image: pic(3331),
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
				image: pic(2269),
				backgroundColor: '#EF9A9A',
				borderColor: '#C62828',
				type: 'button'
			},
			{
				id: 'g2',
				label: 'בובה',
				image: pic(2482),
				backgroundColor: '#F48FB1',
				borderColor: '#C2185B',
				type: 'button'
			},
			{
				id: 'g3',
				label: 'ציור',
				image: pic(2360),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'g4',
				label: 'מוזיקה',
				image: pic(24791),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			},
			{
				id: 'g5',
				label: 'פאזל',
				image: pic(2540),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'g6',
				label: 'ספר',
				image: pic(2450),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'g7',
				label: 'טלוויזיה',
				image: pic(25498),
				backgroundColor: '#E0E0E0',
				borderColor: '#616161',
				type: 'button'
			},
			{
				id: 'g8',
				label: 'מחשב',
				image: pic(2487),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'g9',
				label: 'חצר',
				image: pic(33064),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'g10',
				label: 'בריכה',
				image: pic(30516),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'g11',
				label: 'נדנדה',
				image: pic(4572),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'g12',
				label: 'רכיבה',
				image: pic(9698),
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
				image: pic(3245),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			{
				id: 'e2',
				label: 'עצוב',
				image: pic(2606),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'e3',
				label: 'כועס',
				image: pic(2374),
				backgroundColor: '#EF9A9A',
				borderColor: '#C62828',
				type: 'button'
			},
			{
				id: 'e4',
				label: 'מפחד',
				image: pic(2261),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			},
			{
				id: 'e5',
				label: 'עייף',
				image: pic(2314),
				backgroundColor: '#E0E0E0',
				borderColor: '#616161',
				type: 'button'
			},
			{
				id: 'e6',
				label: 'רעב',
				image: pic(4962),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'button'
			},
			{
				id: 'e7',
				label: 'צמא',
				image: pic(4963),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'e8',
				label: 'חולה',
				image: pic(3308),
				backgroundColor: '#EF9A9A',
				borderColor: '#C62828',
				type: 'button'
			},
			{
				id: 'e9',
				label: 'נהנה',
				image: pic(8582),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'e10',
				label: 'מופתע',
				image: pic(2574),
				backgroundColor: '#FFF176',
				borderColor: '#F9A825',
				type: 'button'
			},
			{
				id: 'e11',
				label: 'אוהב',
				image: pic(6600),
				backgroundColor: '#F48FB1',
				borderColor: '#C2185B',
				type: 'button'
			},
			{
				id: 'e12',
				label: 'לבד',
				image: pic(7253),
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
				image: pic(2317),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'button'
			},
			{
				id: 'p2',
				label: 'בית ספר',
				image: pic(3082),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'p3',
				label: 'גן',
				image: pic(30608),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'p4',
				label: 'חנות',
				image: pic(9116),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			},
			{
				id: 'p5',
				label: 'פארק',
				image: pic(2859),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'p6',
				label: 'רופא',
				image: pic(2467),
				backgroundColor: '#EF9A9A',
				borderColor: '#C62828',
				type: 'button'
			},
			{
				id: 'p7',
				label: 'מסעדה',
				image: pic(10283),
				backgroundColor: '#FFCC80',
				borderColor: '#E65100',
				type: 'button'
			},
			{
				id: 'p8',
				label: 'ים',
				image: pic(2925),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'p9',
				label: 'סבתא',
				image: pic(2243),
				backgroundColor: '#F48FB1',
				borderColor: '#C2185B',
				type: 'button'
			},
			{
				id: 'p10',
				label: 'סבא',
				image: pic(2244),
				backgroundColor: '#90CAF9',
				borderColor: '#1565C0',
				type: 'button'
			},
			{
				id: 'p11',
				label: 'מגרש',
				image: pic(6204),
				backgroundColor: '#A5D6A7',
				borderColor: '#388E3C',
				type: 'button'
			},
			{
				id: 'p12',
				label: 'ספרייה',
				image: pic(3065),
				backgroundColor: '#CE93D8',
				borderColor: '#7B1FA2',
				type: 'button'
			}
		]
	}
};

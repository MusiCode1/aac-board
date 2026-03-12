export interface Tile {
	id: string;
	label: string;
	image: string;
	backgroundColor: string;
	borderColor: string;
	/** If set, this tile is a folder that navigates to another board */
	loadBoard?: string;
	type: 'button' | 'folder';
}

export interface Board {
	id: string;
	name: string;
	tiles: Tile[];
	grid: {
		rows: number;
		columns: number;
	};
}

export interface OutputItem {
	id: string;
	label: string;
	image: string;
}

/**
 * A Set (אוסף) groups related boards into a collection.
 * Each set has its own home board. Users can have multiple sets.
 */
export interface BoardSet {
	id: string;
	name: string;
	/** The board shown when entering this set */
	homeBoardId: string;
	createdAt: number;
	updatedAt: number;
}

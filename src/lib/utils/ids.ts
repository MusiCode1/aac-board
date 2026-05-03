import { customAlphabet } from 'nanoid';

/**
 * URL-safe, lowercase-only ID generator.
 * 10 chars from 36-char alphabet → ~3.6×10^15 namespace.
 * Zero collision risk at personal-use scale.
 */
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 10);

export function generateId(): string {
	return nanoid();
}

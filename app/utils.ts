const BASE62_CHARS =
	"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function toBase62(num: number): string {
	if (num === 0) return BASE62_CHARS.charAt(0);

	let result = "";
	while (num > 0) {
		result = BASE62_CHARS.charAt(num % 62) + result;
		num = Math.floor(num / 62);
	}
	return result;
}

// butuh
export function fromBase62(str: string): number {
	let result = 0;
	if (str !== undefined) {
		for (let i = 0; i < str.length; i++) {
			result = result * 62 + BASE62_CHARS.indexOf(str[i] ?? "");
		}
	}
	return result;
}

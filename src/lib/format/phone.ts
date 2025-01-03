export const phone = (input: string | number) => {
	let string = typeof input === 'string' ? input : input.toString();
	if (string.length === 4) return `585-538-${string}`;
	if (string.length === 7) return `585-${string.substring(0, 3)}-${string.substring(3, 7)}`;
	if (string[0] === '1') string = string.substring(1);
	if (string.length === 10)
		return `${string.substring(0, 3)}-${string.substring(3, 6)}-${string.substring(6, 10)}`;
	if (string.length > 10)
		return `${string.substring(0, 3)}-${string.substring(3, 6)}-${string.substring(6, 10)} x${string.substring(10)}`;
	return `${string}?`;
};

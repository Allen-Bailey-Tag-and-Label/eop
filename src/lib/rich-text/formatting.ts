// Keep stored styles portable and restrict them to the formatting controls we support.
export function textColor(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	const color = value.trim().toLowerCase();
	if (/^#[\da-f]{6}(?:[\da-f]{2})?$/.test(color)) return color;
	if (/^#[\da-f]{3,4}$/.test(color))
		return '#' + [...color.slice(1)].map((digit) => digit + digit).join('');
	const rgb = color.match(
		/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/
	);
	if (!rgb || rgb.slice(1, 4).some((channel) => Number(channel) > 255)) return undefined;
	const channels = rgb.slice(1, 4).map(Number);
	if (rgb[4] !== undefined) channels.push(Math.round(Number(rgb[4]) * 255));
	return '#' + channels.map((channel) => channel.toString(16).padStart(2, '0')).join('');
}

export function textSize(value: unknown): string | undefined {
	if (typeof value !== 'string' || !/^\d+px$/.test(value)) return undefined;
	const size = Number(value.slice(0, -2));
	return size >= 8 && size <= 200 ? `${size}px` : undefined;
}

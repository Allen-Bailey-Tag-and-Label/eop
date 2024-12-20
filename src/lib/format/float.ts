export const float = (input: string | number, options: { decimalPlaces?: number } = {}) => {
	options = Object.assign({ decimalPlaces: 2 }, options);
	const number = typeof input === 'string' ? parseFloat(input) : input;
	const string = number.toFixed(options.decimalPlaces);
	return parseFloat(string);
};

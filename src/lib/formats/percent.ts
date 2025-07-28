type Options = {
	maximumFractionDigits?: number;
	minimumFractionDigits?: number;
};

export const percent = (value: number, options?: Options) => {
	const { format } = new Intl.NumberFormat('en-US', {
		maximumFractionDigits: options?.maximumFractionDigits ?? 2,
		minimumFractionDigits: options?.minimumFractionDigits ?? 2,
		style: 'percent'
	});
	return format(value);
};

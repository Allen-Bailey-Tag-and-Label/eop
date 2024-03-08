const { format } = new Intl.NumberFormat('en-us', { maximumFractionDigits: 0 });
export const quantity = (quantity: number) => {
	if (quantity >= 1000000) return `${format(quantity / 1000000)}MM`;
	if (quantity >= 1000) return `${format(quantity / 1000)}M`;
	return format(quantity);
};

export const { format: currency } = new Intl.NumberFormat('en-US', {
	currency: 'USD',
	maximumFractionDigits: 2,
	style: 'currency'
});

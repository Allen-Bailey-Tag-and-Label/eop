type Options = {
	currency: NonNullable<Parameters<typeof Intl.NumberFormat>[1]>['currency'];
	locale: Parameters<typeof Intl.NumberFormat>[0];
};

const defaultOptions = { currency: 'USD', locale: 'en-Us' };

export const currency = (amount: number, options?: Partial<Options>) => {
	const { locale, currency } = Object.assign(defaultOptions, options);
	const { format } = new Intl.NumberFormat(locale, { currency, style: 'currency' });
	return format(amount);
};

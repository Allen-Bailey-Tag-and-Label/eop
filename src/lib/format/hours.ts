const { format } = new Intl.NumberFormat('en-us', {
	minimumIntegerDigits: 1,
	minimumFractionDigits: 1,
	maximumFractionDigits: 1
});

export const hours = (amount: number) => format(amount);

const { format } = new Intl.NumberFormat('en-us', { currency: 'USD', style: 'currency' });
export const perM = (number: number, quantity: number) => `${format((number * 1000) / quantity)}/M`;

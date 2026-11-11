import { expect, it, vi } from 'vitest';
import { blankRequest } from '$lib/shipping/types';
import { getUnishippersShippingRates } from './unishippers';

// Opt-in only. Never allow this smoke test to submit production requests.
vi.mock('$env/dynamic/private', () => ({ env: process.env }));
it.skipIf(process.env.UNISHIPPERS_STAGING_TEST !== '1')(
	'rates the actual application payload against Unishippers staging',
	async () => {
		expect(new URL(process.env.UNISHIPPERS_API_BASE_URL!).hostname).toBe(
			'speedship.staging-wwex.com'
		);
		expect(new URL(process.env.UNISHIPPERS_TOKEN_URL!).hostname).toBe('auth.staging-wwex.com');
		const shipDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(
			new Date()
		);
		const request = { ...blankRequest(shipDate), services: 'LTL' as const };
		request.shipTo = {
			address: 'Address Line 1',
			city: 'HIGHLAND PARK',
			state: 'TX',
			zip: '75219',
			residential: false
		};
		request.freight[0] = {
			...request.freight[0],
			quantity: 2,
			weight: 500,
			length: 48,
			width: 48,
			height: 48
		};
		const rates = await getUnishippersShippingRates(request);
		expect(rates.length).toBeGreaterThan(0);
		expect(
			rates.every(
				(rate) =>
					rate.service === 'LTL' &&
					rate.staging === true &&
					Number.isSafeInteger(rate.costCents) &&
					rate.costCents > 0
			)
		).toBe(true);
		expect(rates.every((rate) => rate.freightClass === '125')).toBe(true);
	},
	75_000
);

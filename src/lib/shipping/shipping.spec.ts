import { describe, expect, it } from 'vitest';
import { blankRequest, type CarrierRate, type MarkupConfig } from './types';
import { parseShipment, shipmentFromForm } from './validation';
import { decimalHundredths, parseMarkupRange, priceRate, validateRanges } from './markups';
import { legacyQuoteView } from './legacy';
import { duplicateShippingQuoteUrl } from './finder';

function shipment() {
	const request = blankRequest('2026-11-10');
	request.branchId = 'a'.repeat(24);
	request.shipTo = { ...request.shipFrom };
	return request;
}
const rate: CarrierRate = {
	service: 'UPS',
	provider: 'UPS',
	carrier: 'UPS',
	code: '03',
	description: 'Ground',
	currency: 'USD',
	costCents: 10000,
	rateBasis: 'published'
};
const rule = (minimum = '0', maximum = '100', percent = '10') =>
	parseMarkupRange({ id: crypto.randomUUID(), label: 'Standard', minimum, maximum, percent });

describe('shipping validation and pricing', () => {
	it('requires only the selected service fields and strips unused inputs', () => {
		const value = shipment();
		expect(parseShipment({ ...value, freight: null, accessorials: null }).packages).toHaveLength(1);
		expect(parseShipment({ ...value, services: 'Both' }).freight[0]).toMatchObject({
			nmfc: '153500-02',
			description: '',
			freightClass: ''
		});
		expect(parseShipment({ ...value, services: 'Both' }).freight).toHaveLength(1);
		expect(parseShipment({ ...value, services: 'LTL', packages: null }).packages).toEqual([]);
		expect(() => parseShipment({ ...value, services: 'unknown' })).toThrow('UPS, LTL, or Both');
	});
	it('requires an NMFC code but accepts LTL items without a commodity description or freight class', () => {
		const value = shipment();
		const { description, freightClass, ...freight } = value.freight[0];
		expect(description).toBe('');
		expect(freightClass).toBe('');
		expect(
			parseShipment({ ...value, services: 'LTL', freight: [freight] }).freight[0]
		).toMatchObject({ nmfc: '153500-02' });
		expect(() =>
			parseShipment({ ...value, services: 'LTL', freight: [{ ...freight, nmfc: '' }] })
		).toThrow('NMFC code');
	});
	it('rejects malformed dates, addresses, dangerous quantities, and UPS oversize packages', () => {
		const value = shipment();
		expect(() => parseShipment({ ...value, shipDate: '2026-02-30' })).toThrow('ship date');
		expect(() => parseShipment({ ...value, branchId: { $ne: null } })).toThrow('branch');
		expect(() => parseShipment({ ...value, shipTo: { ...value.shipTo, zip: 'invalid' } })).toThrow(
			'ZIP'
		);
		value.packages[0].quantity = 201;
		expect(() => parseShipment(value)).toThrow('quantity');
		value.packages[0].quantity = 1;
		value.packages[0].length = 108;
		value.packages[0].width = 50;
		expect(() => parseShipment(value)).toThrow('girth');
		value.packages[0].weight = NaN;
		expect(() => parseShipment(value)).toThrow('weight');
	});
	it('parses native form fields including leading-zero ZIPs and checkbox options', () => {
		const value = shipment(),
			fields = new FormData();
		for (const key of ['services', 'branchId', 'customer', 'reference', 'shipDate'] as const)
			fields.set(key, value[key]);
		for (const key of ['shipFrom', 'shipTo'] as const)
			for (const [field, entry] of Object.entries(value[key]))
				if (typeof entry === 'string') fields.set(`${key}.${field}`, entry);
		fields.set('shipTo.zip', '01234');
		fields.set('shipTo.residential', 'on');
		const group = value.packages[0];
		fields.append('packageId', group.id);
		for (const key of ['quantity', 'weight', 'length', 'width', 'height'] as const)
			fields.set(`package.${group.id}.${key}`, String(group[key]));
		const parsed = parseShipment(shipmentFromForm(fields));
		expect(parsed.shipTo.zip).toBe('01234');
		expect(parsed.shipTo.residential).toBe(true);
		expect(parsed.packages[0].quantity).toBe(1);
	});
	it('uses 0% by default and resolves adjacent ranges at the shared boundary', () => {
		const config: MarkupConfig = {
			service: 'UPS',
			revision: 2,
			ranges: [rule('0', '100', '10'), rule('100', '250', '20')]
		};
		expect(priceRate(rate, { ...config, ranges: [] }).priceCents).toBe(10000);
		expect(priceRate({ ...rate, costCents: 9999 }, config).markup.percentBps).toBe(1000);
		expect(priceRate(rate, config)).toMatchObject({
			priceCents: 12000,
			markup: { percentBps: 2000, amountCents: 2000, revision: 2 }
		});
		expect(priceRate({ ...rate, costCents: 25000 }, config).markup.percentBps).toBe(0);
	});
	it('keeps UPS and LTL rules separate, supports unbounded ranges, and rejects overlaps', () => {
		expect(() => priceRate(rate, { service: 'LTL', revision: 1, ranges: [rule()] })).toThrow(
			'carrier rate'
		);
		expect(
			priceRate(rate, { service: 'UPS', revision: 1, ranges: [rule('0', '', '25')] }).priceCents
		).toBe(12500);
		expect(() => validateRanges([rule('0', '100'), rule('99', '')])).toThrow('overlap');
		expect(() => validateRanges([rule('0', ''), rule('100', '200')])).toThrow('overlap');
		expect(() => rule('100', '100')).toThrow('greater');
	});
	it('parses decimal amounts exactly and rounds markup once to the nearest cent', () => {
		expect(decimalHundredths('19.99', 'price')).toBe(1999);
		for (const invalid of ['-1', '1.001', 'Infinity', '1e2', '', '1,000'])
			expect(() => decimalHundredths(invalid, 'price')).toThrow();
		expect(
			priceRate(
				{ ...rate, costCents: 5 },
				{ service: 'UPS', revision: 1, ranges: [rule('0', '', '10')] }
			)
		).toMatchObject({ priceCents: 6, markup: { amountCents: 1 } });
	});
});

describe('legacy UPS compatibility', () => {
	it('duplicates new shipping quotes in shipping and preserves legacy UPS package/address details', () => {
		const row = {
			number: 'S-000001',
			origin: 'shipping' as const,
			request: { shipTo: { address: '123 Main', city: 'Caledonia', state: 'NY', zip: '01234' } }
		};
		expect(duplicateShippingQuoteUrl(row)).toBe('/shipping/quote?from=S-000001');
		expect(duplicateShippingQuoteUrl({ ...row, number: '1502' })).toBe('/shipping/quote?from=1502');
		const url = new URL(
			duplicateShippingQuoteUrl({
				...row,
				number: '123',
				origin: 'legacy-ups',
				packageTotalCount: 3,
				packageTotalWeight: 45,
				isValidated: true
			}),
			'https://eop.example'
		);
		expect(url.pathname).toBe('/ups/quote');
		expect(url.searchParams.get('zip')).toBe('01234');
		expect(url.searchParams.get('totalPackages')).toBe('3');
		expect(url.searchParams.get('totalWeight')).toBe('45');
	});
	it('handles missing addresses and numeric ZIPs in older mixed-schema records', () => {
		expect(
			legacyQuoteView({
				quote: 1,
				shipper: null,
				shipTo: { PostalCode: 14423 },
				rates: [
					{ description: 'Missing', rate: null },
					{ description: 'Missing', rate: '' }
				]
			})
		).toMatchObject({ shipFrom: { address: '' }, shipTo: { zip: '14423' }, legacyRates: [] });
	});
	it('preserves saved prices and ignores missing service entries without inventing costs or markup', () => {
		const quote = legacyQuoteView({
			quote: 123,
			createdAt: '2025-01-01T00:00:00Z',
			shipTo: { AddressLine: ['123 Main', 'Suite 2'], PostalCode: '01234' },
			rates: [
				null,
				undefined,
				{ description: 'Ground', rate: 123.45 },
				{ description: 'Next day', rate: '250.50' },
				{ description: 'Invalid', rate: 'bad' }
			]
		});
		expect(quote.number).toBe('123');
		expect(quote.origin).toBe('legacy-ups');
		expect(quote.legacyRates).toEqual([
			{ description: 'Ground', priceCents: 12345 },
			{ description: 'Next day', priceCents: 25050 }
		]);
		expect(quote.rates).toEqual([]);
		expect(quote.request).toBeNull();
		expect(quote.shipTo.address).toBe('123 Main, Suite 2');
		expect(quote.shipTo.zip).toBe('01234');
	});
});

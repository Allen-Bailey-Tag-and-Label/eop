import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actions as quoteActions } from '../../../routes/(private)/(padded)/shipping/quote/+page.server';
import { load as detail } from '../../../routes/(private)/(padded)/shipping/quotes/[number]/+page.server';
import { load as oldHistory } from '../../../routes/(private)/(padded)/shipping/quotes/+page.server';
import { load as history } from '../../../routes/(private)/(padded)/shipping/quote-finder/+page.server';
import { actions as markupActions } from '../../../routes/(private)/(padded)/admin/shipping/markups/+page.server';
import { createShippingQuote, findShippingQuote } from './quotes';
import { loadShippingQuoteFinder } from './finder';
import { manageMarkup } from './markups';
import { ShippingError } from '$lib/shipping/validation';
import { blankRequest } from '$lib/shipping/types';
vi.mock('$lib/server/mongoose/connect', () => ({ connect: vi.fn(async () => {}) }));
vi.mock('./quotes', () => ({
	createShippingQuote: vi.fn(),
	findShippingQuote: vi.fn()
}));
vi.mock('./finder', () => ({ loadShippingQuoteFinder: vi.fn() }));
vi.mock('./markups', () => ({ manageMarkup: vi.fn(), getMarkupConfigs: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
function event(service = 'UPS') {
	const data = blankRequest('2026-11-10'),
		body = new FormData();
	const branchId = 'a'.repeat(24);
	for (const [key, value] of Object.entries({
		services: service,
		branchId,
		customer: 'Customer',
		reference: '',
		shipDate: data.shipDate,
		requestId: crypto.randomUUID()
	}))
		body.set(key, value);
	for (const prefix of ['shipFrom', 'shipTo']) {
		for (const [key, value] of Object.entries(data.shipFrom))
			if (typeof value === 'string') body.set(`${prefix}.${key}`, value);
	}
	const group = data.packages[0];
	body.append('packageId', group.id);
	for (const key of ['quantity', 'weight', 'length', 'width', 'height'] as const)
		body.set(`package.${group.id}.${key}`, String(group[key]));
	return {
		locals: { user: { _id: 'b'.repeat(24), branches: [{ _id: branchId }] } },
		request: new Request('https://eop.example/shipping/quote', { method: 'POST', body })
	};
}
describe('shipping route wiring', () => {
	it('validates selected-service requirements on the server before requesting or saving rates', async () => {
		const action = quoteActions.default!;
		expect(await action(event('Both') as never)).toMatchObject({ status: 400 });
		expect(createShippingQuote).not.toHaveBeenCalled();
		vi.mocked(createShippingQuote).mockResolvedValue('S-000001');
		await expect(action(event() as never)).rejects.toMatchObject({
			status: 303,
			location: '/shipping/quotes/S-000001'
		});
		expect(createShippingQuote).toHaveBeenCalledWith(
			expect.objectContaining({ services: 'UPS', freight: [] }),
			expect.any(String),
			'b'.repeat(24)
		);
	});
	it('requires an assigned branch and cannot save an arbitrary branch from a crafted submission', async () => {
		const input = event();
		input.locals.user.branches = [];
		expect(await quoteActions.default!(input as never)).toMatchObject({
			status: 400,
			data: { error: 'Choose one of your branches.' }
		});
		expect(createShippingQuote).not.toHaveBeenCalled();
	});
	it('keeps detail URLs and uses the standard table loader at the renamed finder route', async () => {
		vi.mocked(findShippingQuote).mockResolvedValue(null);
		await expect(detail({ params: { number: '123' } } as never)).rejects.toMatchObject({
			status: 404
		});
		const input = {
			url: new URL('https://eop.example/shipping/quote-finder'),
			locals: event().locals
		};
		await history(input as never);
		expect(loadShippingQuoteFinder).toHaveBeenCalledWith(input);
		expect(() => oldHistory()).toThrow(
			expect.objectContaining({ status: 303, location: '/shipping/quote-finder' })
		);
	});
	it('reports rule validation and concurrent edit failures without claiming a successful save', async () => {
		vi.mocked(manageMarkup).mockRejectedValueOnce(new ShippingError('Cost ranges overlap.'));
		expect(await markupActions.save!(event() as never)).toMatchObject({ status: 400 });
		vi.mocked(manageMarkup).mockRejectedValueOnce(
			new ShippingError('Another editor changed these rules.', 409)
		);
		expect(await markupActions.delete!(event() as never)).toMatchObject({ status: 409 });
		vi.mocked(manageMarkup).mockResolvedValueOnce();
		expect(await markupActions.save!(event() as never)).toHaveProperty('success');
	});
});

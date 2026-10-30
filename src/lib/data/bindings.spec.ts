import { describe, expect, it } from 'vitest';
import { boundElement, validateBindings, validateReference } from './bindings';
import { newElement } from '$lib/slides/types';
describe('source property bindings', () => {
	it('binds a standalone element to its source and a template to the current row', () => {
		const reference = { sourceId: 'a'.repeat(24), output: 'summary', parameters: {} };
		const text = {
			...newElement('text', 'headline'),
			dataReference: reference,
			bindings: { text: { field: 'row.total', format: 'number' as const, fallback: 'Unavailable' } }
		};
		expect(
			boundElement(text, undefined, 0, 'UTC', {
				headline: {
					state: 'ready',
					message: '',
					items: [{ id: 'row', label: '', detail: '', fields: { total: 1200 } }]
				}
			}).text
		).toBe('1,200');
		const image = {
			...newElement('image', 'photo'),
			bindings: { assetId: { field: 'row.asset', format: 'text' as const, fallback: '' } }
		};
		expect(
			boundElement(
				image,
				{ id: 'row', label: '', detail: '', fields: { asset: 'b'.repeat(24) } },
				0,
				'UTC',
				{}
			).assetId
		).toBe('b'.repeat(24));
		expect(() =>
			validateBindings({ color: { field: 'row.color', format: 'script', fallback: '' } })
		).toThrow();
		expect(() => validateReference({ ...reference, sourceId: 'bad' })).toThrow();
	});
});

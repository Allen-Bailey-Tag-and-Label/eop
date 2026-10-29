import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import QrCode from './QrCode.svelte';
import { blankSlide, newElement } from './types';
import { validateSlide } from './validation';
afterEach(cleanup);
describe('QR slide elements', () => {
	it('generates local SVG codes with a quiet margin and updates the content and colors', async () => {
		const view = render(QrCode, { value: 'https://example.com/event' });
		const source = () => view.getByRole('img', { name: 'QR code' }).getAttribute('src')!;
		const first = source();
		expect(first).toMatch(/^data:image\/svg\+xml/);
		const svg = decodeURIComponent(first.split(',')[1]);
		expect(svg).toContain('<svg');
		expect(svg).toContain('<path');
		await view.rerender({
			value: 'https://example.com/other',
			foreground: '#123456',
			background: '#ffffffb3',
			correction: 'H'
		});
		expect(source()).not.toBe(first);
		expect(decodeURIComponent(source().split(',')[1])).toContain('123456');
	});
	it('handles blank and excessive content without crashing a slide and validates QR options', async () => {
		const view = render(QrCode, { value: '' });
		expect(view.getByRole('status')).toBeInTheDocument();
		await view.rerender({ value: 'a'.repeat(1001) });
		expect(view.queryByRole('img')).toBeNull();
		const element = newElement('qr', 'code');
		expect(validateSlide({ ...blankSlide(), elements: [element] }).elements[0]).toEqual(element);
		expect(() =>
			validateSlide({ ...blankSlide(), elements: [{ ...element, text: 'a'.repeat(1001) }] })
		).toThrow('1,000 bytes');
	});
});

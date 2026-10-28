import { Types } from 'mongoose';
import { assetScope } from './asset-library';
vi.mock('./asset-library', () => ({ assetScope: vi.fn() }));
import { describe, expect, it, vi } from 'vitest';
import { MAX_ASSET_BYTES, prepareAsset, sanitizeSvg, serveAsset, uploadAsset } from './assets';
import { Asset, Slide } from './models';
vi.mock('./models', () => ({
	Asset: { findById: vi.fn(), create: vi.fn() },
	Slide: { exists: vi.fn() }
}));

describe('slide assets', () => {
	it('stores uploads under the current slide scope rather than the shared library', async () => {
		vi.mocked(assetScope).mockResolvedValue('a'.repeat(24));
		const fields = new FormData();
		fields.set('assetScopeId', 'a'.repeat(24));
		fields.set(
			'file',
			new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'photo.png', {
				type: 'image/png'
			})
		);
		await uploadAsset(
			new Request('http://localhost/new?/upload', { method: 'POST', body: fields }),
			'b'.repeat(24),
			'new'
		);
		expect(Asset.create).toHaveBeenCalledWith(
			expect.objectContaining({
				scope: 'slide',
				slideId: new Types.ObjectId('a'.repeat(24)),
				name: 'photo.png'
			})
		);
	});
	it('strips scripts, foreign HTML, event handlers, and external references from SVGs', () => {
		const clean = sanitizeSvg(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><script>alert(1)</script><foreignObject><p>unsafe</p></foreignObject><style>svg{background:url(https://example.com)}</style><rect width="10" height="10" fill="#ff0000" onclick="alert(1)"/><image href="https://example.com/a.png"/><use href="https://example.com/a.svg#x"/><path fill="url(https://example.com/fill)" d="M0 0L10 10"/></svg>'
		);
		expect(clean).not.toMatch(/script|foreignObject|onclick|https:\/\/|<style|<image/);
		expect(clean).toContain('viewBox="0 0 100 100"');
		expect(clean).toContain('fill="#ff0000"');
	});
	it('rejects invalid, oversized, and mislabeled uploads', () => {
		expect(() => prepareAsset(Buffer.alloc(MAX_ASSET_BYTES + 1), 'image/png')).toThrow();
		expect(() => prepareAsset(Buffer.from('<script>unsafe</script>'), 'image/png')).toThrow();
		expect(() => prepareAsset(Buffer.from('fake'), 'text/html')).toThrow();
		expect(() => sanitizeSvg('<html>not svg</html>')).toThrow();
	});
	it('does not expose unpublished assets to monitor credentials', async () => {
		vi.mocked(Slide.exists).mockResolvedValue(null);
		await expect(serveAsset('a'.repeat(24), true)).rejects.toMatchObject({ status: 404 });
		expect(Asset.findById).not.toHaveBeenCalled();
	});
});

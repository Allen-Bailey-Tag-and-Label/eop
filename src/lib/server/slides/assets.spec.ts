import { describe, expect, it, vi } from 'vitest';
import { MAX_ASSET_BYTES, prepareAsset, sanitizeSvg, serveAsset } from './assets';
import { Asset, Slide } from './models';
vi.mock('./models', () => ({ Asset: { findById: vi.fn() }, Slide: { exists: vi.fn() } }));

describe('slide assets', () => {
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

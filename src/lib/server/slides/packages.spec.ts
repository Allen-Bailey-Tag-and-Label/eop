import { beforeEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import { Binary } from 'mongodb';
import { Asset, Slide } from './models';
import { DataConnection, DataSource } from '../data/models';
import {
	exportSlidePackage,
	readSlidePackage,
	reviewSlidePackage,
	importSlidePackage
} from './packages';
import { blankSlide, newElement } from '$lib/slides/types';
import { defaultRepeater } from '$lib/slides/repeater';
import { blankWorkflow } from '$lib/data/types';
vi.mock('./models', () => ({
	Asset: { find: vi.fn(), findOne: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
	Slide: { exists: vi.fn(), create: vi.fn() }
}));
vi.mock('../data/models', () => ({
	DataSource: { find: vi.fn(), findOne: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
	DataConnection: { find: vi.fn(), findById: vi.fn(), create: vi.fn(), deleteMany: vi.fn() }
}));
const assetId = 'a'.repeat(24),
	sourceId = 'b'.repeat(24),
	connectionId = 'c'.repeat(24);
const query = (rows: unknown[]) => ({
	select: vi.fn().mockReturnThis(),
	lean: vi.fn().mockResolvedValue(rows)
});
const image = { ...newElement('image', 'nested-image'), assetId };
const repeater = {
	...newElement('repeater', 'cards'),
	repeatItems: { mode: 'source' as const, source: { sourceId, output: 'rows', parameters: {} } },
	repeater: { ...defaultRepeater(), template: { width: 800, height: 240, elements: [image] } }
};
const slide = { ...blankSlide(), elements: [repeater] };
const workflow = {
	...blankWorkflow(),
	nodes: [
		{
			id: 'rows',
			type: 'literal' as const,
			inputs: [],
			config: { rows: [{ id: 'one', name: 'Weather', asset: assetId }] }
		},
		{
			id: 'api',
			type: 'api' as const,
			inputs: [],
			config: {
				connectionId,
				path: '/forecast',
				query: {},
				itemsPath: 'periods',
				fields: { name: 'name' }
			}
		}
	]
};
const source = {
	_id: sourceId,
	title: 'Weather',
	scope: 'shared',
	draft: workflow,
	published: workflow
};
const config = {
	baseUrl: 'https://api.weather.gov',
	paths: ['/forecast'],
	auth: 'bearer' as const,
	secretEnv: 'DATA_API_WEATHER',
	headerName: 'X-API-Key',
	timeoutMs: 4000
};
const connection = {
	_id: connectionId,
	title: 'NWS',
	config: { ...config, password: 'never-export-this' }
};
const asset = {
	_id: assetId,
	name: 'Sun.svg',
	contentType: 'image/svg+xml',
	data: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>'),
	scope: 'slide'
};
const choices = () => ({ assets: {}, sources: {}, connections: {} });
async function archive() {
	return exportSlidePackage('Weather slide', 'weather', slide);
}
beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(Asset.find).mockReturnValue(query([asset]) as never);
	vi.mocked(DataSource.find).mockReturnValue(query([source]) as never);
	vi.mocked(DataConnection.find).mockReturnValue(query([connection]) as never);
	vi.mocked(Slide.exists).mockResolvedValue(null);
	vi.mocked(Asset.create).mockResolvedValue({} as never);
	vi.mocked(DataSource.create).mockResolvedValue({} as never);
	vi.mocked(DataConnection.create).mockResolvedValue({} as never);
	vi.mocked(Slide.create).mockResolvedValue({} as never);
});
describe('portable slide packages', () => {
	it('exports MongoDB lean binary asset values without exposing unused buffer capacity', async () => {
		vi.mocked(Asset.find).mockReturnValue(
			query([{ ...asset, data: new Binary(asset.data) }]) as never
		);
		const { assetBytes } = await readSlidePackage(await archive());
		expect(assetBytes.get(assetId)?.toString()).toContain('<svg');
	});
	it('rejects malformed manifest resources with a validation error', async () => {
		const zip = await JSZip.loadAsync(await archive());
		const manifest = JSON.parse(await zip.file('slide.json')!.async('string'));
		manifest.assets = [null];
		zip.file('slide.json', JSON.stringify(manifest));
		await expect(readSlidePackage(await zip.generateAsync({ type: 'nodebuffer' }))).rejects.toThrow(
			'Invalid package resource'
		);
	});
	it('round trips assets and both workflow versions, excluding API secrets and cached/business data', async () => {
		const bytes = await archive();
		const { bundle, assetBytes } = await readSlidePackage(bytes);
		expect(bundle.slide.title).toBe('Weather slide');
		expect(bundle.sources[0].published).toBeDefined();
		expect(assetBytes.get(assetId)?.toString()).toContain('<svg');
		expect(JSON.stringify(bundle)).not.toContain('never-export-this');
		expect(bundle.connections[0].config.secretEnv).toBe('DATA_API_WEATHER');
		expect(Object.keys(bundle).sort()).toEqual([
			'assets',
			'connections',
			'format',
			'slide',
			'sources',
			'version'
		]);
	});
	it('imports a new unpublished slide and remaps nested elements, workflows and API connections', async () => {
		await importSlidePackage(
			await archive(),
			'Production weather',
			'weather-live',
			choices(),
			'd'.repeat(24)
		);
		const saved = vi.mocked(Slide.create).mock.calls[0][0] as unknown as {
			draft: typeof slide;
			published?: unknown;
		};
		const copiedAsset = vi.mocked(Asset.create).mock.calls[0][0] as unknown as { _id: string };
		const copiedSource = vi.mocked(DataSource.create).mock.calls[0][0] as unknown as {
			_id: string;
			published: typeof workflow;
		};
		const copiedConnection = vi.mocked(DataConnection.create).mock.calls[0][0] as unknown as {
			_id: string;
		};
		expect(saved.published).toBeUndefined();
		expect(saved.draft.elements[0].repeatItems.source.sourceId).toBe(copiedSource._id);
		expect(saved.draft.elements[0].repeater.template.elements[0].assetId).toBe(copiedAsset._id);
		expect(copiedSource.published.nodes[0].config.rows?.[0].asset).toBe(copiedAsset._id);
		expect(copiedSource.published.nodes[1].config.connectionId).toBe(copiedConnection._id);
		expect(copiedAsset._id).not.toBe(assetId);
	});
	it('reviews resource choices without writing anything', async () => {
		const review = await reviewSlidePackage(await archive());
		expect(review.existing.connections[0].title).toBe('NWS');
		expect(Slide.create).not.toHaveBeenCalled();
		expect(Asset.create).not.toHaveBeenCalled();
	});
	it('can reuse existing shared dependencies without modifying them', async () => {
		const ids = { asset: '1'.repeat(24), source: '2'.repeat(24), connection: '3'.repeat(24) };
		vi.mocked(Asset.findOne).mockResolvedValue({
			...asset,
			_id: ids.asset,
			scope: 'shared'
		} as never);
		vi.mocked(DataSource.findOne).mockResolvedValue({ ...source, _id: ids.source } as never);
		vi.mocked(DataConnection.findById).mockResolvedValue({
			...connection,
			_id: ids.connection
		} as never);
		await importSlidePackage(
			await archive(),
			'Reused',
			'reused',
			{
				assets: { [assetId]: ids.asset },
				sources: { [sourceId]: ids.source },
				connections: { [connectionId]: ids.connection }
			},
			'd'.repeat(24)
		);
		expect(Asset.create).not.toHaveBeenCalled();
		expect(DataSource.create).not.toHaveBeenCalled();
		expect(DataConnection.create).not.toHaveBeenCalled();
	});
	it('rejects missing dependencies and invalid image files before writing', async () => {
		vi.mocked(Asset.find).mockReturnValue(query([]) as never);
		await expect(archive()).rejects.toThrow('asset is missing');
		vi.mocked(Asset.find).mockReturnValue(query([asset]) as never);
		const zip = await JSZip.loadAsync(await archive());
		zip.file(`assets/${assetId}`, 'not an svg');
		await expect(readSlidePackage(await zip.generateAsync({ type: 'nodebuffer' }))).rejects.toThrow(
			'valid SVG'
		);
		expect(Slide.create).not.toHaveBeenCalled();
	});
	it('rejects existing slugs and incompatible or unavailable shared links before creating dependencies', async () => {
		const bytes = await archive();
		vi.mocked(Slide.exists).mockResolvedValue({ _id: 'x' } as never);
		await expect(
			importSlidePackage(bytes, 'Weather', 'weather', choices(), 'd'.repeat(24))
		).rejects.toThrow('slug already exists');
		vi.mocked(Slide.exists).mockResolvedValue(null);
		vi.mocked(DataSource.findOne).mockResolvedValue({
			...source,
			published: { ...workflow, outputs: { other: workflow.outputs.rows } }
		} as never);
		await expect(
			importSlidePackage(
				bytes,
				'Weather',
				'weather',
				{ ...choices(), sources: { [sourceId]: '1'.repeat(24) } },
				'd'.repeat(24)
			)
		).rejects.toThrow('incompatible outputs');
		expect(Asset.create).not.toHaveBeenCalled();
	});
	it('cleans up only newly copied dependencies when saving the slide fails', async () => {
		vi.mocked(Slide.create).mockRejectedValue(new Error('write failed'));
		await expect(
			importSlidePackage(await archive(), 'Weather', 'weather', choices(), 'd'.repeat(24))
		).rejects.toThrow('write failed');
		expect(Asset.deleteMany).toHaveBeenCalledWith({ _id: { $in: [expect.any(String)] } });
		expect(DataSource.deleteMany).toHaveBeenCalled();
		expect(DataConnection.deleteMany).toHaveBeenCalled();
	});
	it('rejects unsupported archives and oversized expanded entries', async () => {
		await expect(readSlidePackage(Buffer.from('invalid'))).rejects.toThrow('ZIP');
		const zip = await JSZip.loadAsync(await archive());
		zip.file('bomb', Buffer.alloc(4 * 1024 * 1024));
		await expect(
			readSlidePackage(await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }))
		).rejects.toThrow('entry is too large');
	});
});

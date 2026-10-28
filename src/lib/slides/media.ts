import type { SlideDefinition } from './types';

export const mediaIds = (definition: SlideDefinition) => [
	...new Set(
		definition.elements
			.filter((element) => element.type === 'image' || element.type === 'svg')
			.map((element) => element.assetId)
	)
];

// In-memory blobs let already loaded media survive network interruptions.
// Bound memory use on Raspberry Pis; prefer keeping the current slide's assets.
export class SlideMediaCache {
	private entries = new Map<string, { url: string; size: number }>();
	private bytes = 0;
	protectedIds = new Set<string>();
	constructor(private limit = 64 * 1024 * 1024) {}
	async load(id: string, signal: AbortSignal) {
		if (this.entries.has(id)) return;
		const response = await fetch(`/monitors/media/${id}`, { signal });
		if (!response.ok || !response.headers.get('content-type')?.startsWith('image/'))
			throw new Error('Image unavailable');
		const blob = await response.blob();
		if (signal.aborted || this.entries.has(id)) return;
		for (const [key, entry] of this.entries) {
			if (this.bytes + blob.size <= this.limit) break;
			if (this.protectedIds.has(key)) continue;
			URL.revokeObjectURL(entry.url);
			this.bytes -= entry.size;
			this.entries.delete(key);
		}
		if (this.bytes + blob.size > this.limit) throw new Error('Media cache full');
		this.entries.set(id, { url: URL.createObjectURL(blob), size: blob.size });
		this.bytes += blob.size;
	}
	urls(ids: string[]) {
		const result: Record<string, string> = {};
		for (const id of ids) {
			const entry = this.entries.get(id);
			if (entry) {
				this.entries.delete(id);
				this.entries.set(id, entry);
				result[id] = entry.url;
			}
		}
		return result;
	}
	destroy() {
		for (const entry of this.entries.values()) URL.revokeObjectURL(entry.url);
		this.entries.clear();
		this.bytes = 0;
	}
}

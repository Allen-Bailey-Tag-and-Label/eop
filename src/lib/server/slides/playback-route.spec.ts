import { describe, expect, it, vi } from 'vitest';
import { GET } from '../../../routes/(monitors)/monitors/(approved)/playback/+server';
import { getPlayback } from './content';

vi.mock('./content', () => ({ getPlayback: vi.fn(async () => null) }));

describe('monitor playback color mode', () => {
	it('delivers monitor mode with an empty playlist while preserving the playback response shape', async () => {
		const response = await GET({
			locals: { monitor: { id: 'monitor', location: 'Break room', colorMode: 'light' } }
		} as unknown as Parameters<typeof GET>[0]);
		expect(response.headers.get('x-monitor-color-mode')).toBe('light');
		expect(await response.json()).toBeNull();
		expect(getPlayback).toHaveBeenCalledWith('monitor');
	});
});

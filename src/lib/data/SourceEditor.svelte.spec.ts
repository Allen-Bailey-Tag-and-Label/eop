import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import SourceEditor from './SourceEditor.svelte';
import { blankWorkflow } from './types';
vi.mock('$app/forms', () => ({ enhance: vi.fn(() => ({ destroy: vi.fn() })) }));
vi.mock('sveltewind/transitions', () => ({ subtleReveal: () => ({ duration: 0 }) }));
beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});
describe('workflow authoring', () => {
	it('shows a graph, persists node configuration and connections, and blocks invalid JSON', async () => {
		const view = render(SourceEditor, {
			data: {
				source: { id: '', title: '', version: 0, draft: blankWorkflow() },
				connections: [],
				usage: []
			}
		});
		expect(view.getByRole('region', { name: 'Workflow graph' })).toBeInTheDocument();
		expect(view.getByRole('button', { name: 'Workflow node rows' })).toBeInTheDocument();
		const input = view.getByRole('textbox', { name: 'Configuration rows' });
		await fireEvent.input(input, { target: { value: '{' } });
		expect(view.getByRole('button', { name: 'Save draft' })).toBeDisabled();
		await fireEvent.input(input, { target: { value: '{"rows":[{"id":"a","name":"Alice"}]}' } });
		await fireEvent.change(view.getByRole('combobox', { name: 'New node type' }), {
			target: { value: 'map' }
		});
		await fireEvent.click(view.getByRole('button', { name: 'Add node' }));
		const definition = JSON.parse(
			(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
		);
		expect(definition.nodes[0].config.rows).toEqual([{ id: 'a', name: 'Alice' }]);
		expect(definition.nodes[1]).toMatchObject({ type: 'map', inputs: ['rows'] });
		expect(view.getByRole('button', { name: 'Publish source' })).toBeEnabled();
	});
});

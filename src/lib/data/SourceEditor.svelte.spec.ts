import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/svelte';
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
	it('imports a validated workflow draft and preserves it when another import fails', async () => {
		const view = render(SourceEditor, {
			data: {
				source: { id: '', title: 'Forecast', version: 0, draft: blankWorkflow() },
				connections: [],
				usage: []
			}
		});
		const imported = { ...blankWorkflow(), refreshSeconds: 900 };
		const file = new File([''], 'forecast.json', { type: 'application/json' });
		Object.defineProperty(file, 'text', { value: async () => JSON.stringify(imported) });
		await fireEvent.change(view.getByLabelText('Import workflow file'), {
			target: { files: [file] }
		});
		const definition = () =>
			JSON.parse(
				(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
			);
		await waitFor(() => expect(definition().refreshSeconds).toBe(900));
		const invalid = new File([''], 'invalid.json');
		Object.defineProperty(invalid, 'text', { value: async () => '{"schemaVersion":99}' });
		await fireEvent.change(view.getByLabelText('Import workflow file'), {
			target: { files: [invalid] }
		});
		await waitFor(() => expect(view.getByRole('alert')).toHaveTextContent('schemaVersion'));
		expect(definition().refreshSeconds).toBe(900);
	});
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

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import FormRenderer from './FormRenderer.svelte';
import { blankForm } from '$lib/forms/definition';
import { enhance } from '$app/forms';
vi.mock('$app/forms', () => ({ enhance: vi.fn(() => ({ destroy: vi.fn() })) }));
vi.mock('svelte/transition', async (original) => ({
	...(await original<typeof import('svelte/transition')>()),
	scale: () => ({ duration: 0 })
}));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
describe('reusable form renderer', () => {
	it('submits once through its handler with version/token and shows the confirmation', async () => {
		const definition = blankForm();
		definition.questions[0].id = 'feedback';
		const onSubmit = vi.fn<(fields: FormData) => Promise<{ success: string }>>(async () => ({
			success: 'Received'
		}));
		const view = render(FormRenderer, {
			definition: { ...definition, title: 'Legacy heading', description: 'Legacy introduction' },
			version: 4,
			onSubmit
		});
		expect(view.queryByText('Legacy heading')).not.toBeInTheDocument();
		expect(view.queryByText('Legacy introduction')).not.toBeInTheDocument();
		await fireEvent.input(view.getByRole('textbox', { name: 'Your feedback' }), {
			target: { value: 'Useful feedback' }
		});
		await fireEvent.submit(view.getByRole('form', { name: 'Post response' }));
		await waitFor(() => expect(view.getByRole('status')).toHaveTextContent('Received'));
		const fields = onSubmit.mock.calls[0][0] as FormData;
		expect(fields.get('answer:feedback')).toBe('Useful feedback');
		expect(fields.get('version')).toBe('4');
		expect(String(fields.get('token'))).toHaveLength(36);
		expect(enhance).not.toHaveBeenCalled();
	});
	it('keeps previews and closed forms from submitting', async () => {
		const onSubmit = vi.fn();
		const preview = render(FormRenderer, { definition: blankForm(), preview: true, onSubmit });
		expect(preview.getByRole('button', { name: 'Submit response' })).toBeDisabled();
		preview.unmount();
		const closed = render(FormRenderer, { definition: { ...blankForm(), open: false }, onSubmit });
		expect(closed.getByRole('status')).toHaveTextContent('closed');
		expect(onSubmit).not.toHaveBeenCalled();
	});
	it('renders accessible choice, checkbox and rating controls', () => {
		const definition = blankForm();
		const base = definition.questions[0];
		definition.questions = [
			{ ...base, id: 'agree', label: 'I agree', type: 'checkbox' },
			{
				...base,
				id: 'department',
				label: 'Department',
				type: 'select',
				options: ['Plant', 'Office']
			},
			{ ...base, id: 'rating', label: 'Rating', type: 'rating' }
		];
		const view = render(FormRenderer, { definition });
		expect(view.getByRole('checkbox', { name: 'I agree' })).toBeRequired();
		expect(view.getByRole('combobox', { name: 'Department' })).toBeRequired();
		expect(view.getByRole('combobox', { name: 'Rating' })).toBeInTheDocument();
	});
});

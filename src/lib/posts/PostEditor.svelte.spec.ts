import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, fireEvent, within, waitFor } from '@testing-library/svelte';
import PostEditor from './PostEditor.svelte';
import { blankForm } from '$lib/forms/definition';
vi.mock('$app/forms', () => ({
	enhance: vi.fn(() => ({ destroy: vi.fn() })),
	deserialize: (value: string) => JSON.parse(value)
}));
vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn().mockResolvedValue(undefined) }));
vi.mock('sveltewind/transitions', () => ({ subtleReveal: () => ({ duration: 0 }) }));
vi.mock('svelte/transition', async (original) => ({
	...(await original<typeof import('svelte/transition')>()),
	scale: () => ({ duration: 0 })
}));
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
const data = {
	locals: { user: { profile: { firstName: 'Test', lastName: 'Author' } } },
	forms: [{ id: 'a'.repeat(24), slug: 'feedback', title: 'Feedback', version: 1, published: true }],
	roles: [{ value: 'b'.repeat(24), label: 'Employees' }]
};
describe('post forms authoring', () => {
	it('dismisses only the form editor on an outside click and explains public identified forms', async () => {
		const view = render(PostEditor, { data: data as never });
		await fireEvent.click(view.getByRole('button', { name: 'Forms' }));
		await fireEvent.click(view.getByRole('button', { name: 'Create form' }));
		const editor = view.getByRole('dialog', { name: 'Create form' });
		const dialog = within(editor);
		expect(dialog.getByRole('status')).toHaveTextContent('Anyone can respond without signing in');
		await fireEvent.click(dialog.getByRole('checkbox', { name: 'Anonymous responses' }));
		expect(dialog.getByRole('status')).toHaveTextContent('Employee sign-in is required');
		expect(
			dialog.getByRole('combobox', { name: 'Audience' }).querySelector('option:checked')
		).toHaveTextContent('employee sign-in required');
		await fireEvent.click(dialog.getByRole('button', { name: 'Preview form' }));
		expect(dialog.getByText(/Employee sign-in is required\. Your signed-in/)).toBeInTheDocument();
		await fireEvent.click(editor.parentElement!);
		await waitFor(() =>
			expect(view.queryByRole('dialog', { name: 'Create form' })).not.toBeInTheDocument()
		);
		expect(view.getByRole('dialog', { name: 'Forms' })).toBeInTheDocument();
	});
	it('uses category audience defaults without overriding an explicit choice', async () => {
		const view = render(PostEditor, { data: data as never });
		await fireEvent.change(view.getByRole('combobox', { name: 'Post category' }), {
			target: { value: 'hr' }
		});
		expect(view.getByRole('combobox', { name: 'Audience' })).toHaveValue('employees');
		await fireEvent.change(view.getByRole('combobox', { name: 'Audience' }), {
			target: { value: 'public' }
		});
		await fireEvent.change(view.getByRole('combobox', { name: 'Post category' }), {
			target: { value: 'feedback' }
		});
		expect(view.getByRole('combobox', { name: 'Audience' })).toHaveValue('public');
	});
	it('inserts a published form into markdown without a submission-capable editor preview', async () => {
		const view = render(PostEditor, { data: data as never });
		await fireEvent.click(view.getByRole('button', { name: 'Forms' }));
		const dialog = within(view.getByRole('dialog', { name: 'Forms' }));
		await fireEvent.click(dialog.getByRole('button', { name: 'Insert' }));
		expect(
			(view.getByRole('textbox', { name: 'Post markdown' }) as HTMLTextAreaElement).value
		).toContain('<PublishedForm slug="feedback">');
		expect(
			view.getByText('Embedded form: feedback. Use Forms to preview its questions.')
		).toBeInTheDocument();
		expect(view.queryByRole('button', { name: 'Submit response' })).not.toBeInTheDocument();
	});
	it('opens form CRUD in a nested dialog and can publish a versioned form', async () => {
		const fetcher = vi.fn<typeof fetch>(
			async () =>
				new Response(
					JSON.stringify({
						type: 'success',
						data: {
							formRecord: {
								id: 'c'.repeat(24),
								slug: 'new-feedback',
								title: 'New form',
								version: 1,
								draft: blankForm(),
								published: true
							}
						}
					})
				)
		);
		vi.stubGlobal('fetch', fetcher);
		const view = render(PostEditor, { data: data as never });
		await fireEvent.click(view.getByRole('button', { name: 'Forms' }));
		await fireEvent.click(view.getByRole('button', { name: 'Create form' }));
		const dialog = within(view.getByRole('dialog', { name: 'Create form' }));
		await fireEvent.input(dialog.getByRole('textbox', { name: 'Form slug' }), {
			target: { value: 'new-feedback' }
		});
		await fireEvent.change(dialog.getByRole('combobox', { name: 'Question 1 type' }), {
			target: { value: 'select' }
		});
		const choices = dialog.getByRole('textbox', { name: 'Question 1 choices' });
		await fireEvent.input(choices, { target: { value: 'First choice\n' } });
		expect(choices).toHaveValue('First choice\n');
		await fireEvent.input(choices, { target: { value: 'First choice\nSecond choice\n' } });
		await fireEvent.click(dialog.getByRole('button', { name: 'Publish form' }));
		await waitFor(() =>
			expect(view.getByRole('dialog', { name: 'Edit form' })).toBeInTheDocument()
		);
		const fields = (fetcher.mock.calls[0][1]! as RequestInit).body as FormData;
		expect(fields.get('intent')).toBe('publish');
		expect(JSON.parse(String(fields.get('definition'))).questions[0].options).toEqual([
			'First choice',
			'Second choice'
		]);
	});
});

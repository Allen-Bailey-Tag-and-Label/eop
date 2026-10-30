import { describe, expect, it, vi } from 'vitest';
import {
	GET,
	POST
} from '../../../routes/(public)/(padded)/posts/submissions/[postId]/[formSlug]/+server';
import { blankForm, FormValidationError } from '$lib/forms/definition';
import { submitForm } from './service';
vi.mock('./service', () => ({ submitForm: vi.fn() }));
function event() {
	return {
		locals: {
			authorizedForm: {
				id: 'a'.repeat(24),
				version: 2,
				definition: { ...blankForm(), audience: 'roles', roleIds: ['b'.repeat(24)] }
			},
			contentActor: { id: 'c'.repeat(24), roleIds: [] }
		},
		request: new Request('https://example.test/forms/feedback/data', {
			method: 'POST',
			body: new FormData()
		})
	};
}
describe('published form endpoint', () => {
	it('returns renderable questions without private audience role IDs', async () => {
		const response = await GET(event() as never);
		const data = await response.json();
		expect(data.version).toBe(2);
		expect(data.definition.questions).toHaveLength(1);
		expect(data.definition.roleIds).toBeUndefined();
		expect(data.definition.audience).toBeUndefined();
	});
	it('submits using the centrally authorized form and actor', async () => {
		const input = event();
		vi.mocked(submitForm).mockResolvedValueOnce({ success: 'Received' });
		const response = await POST(input as never);
		expect(response.status).toBe(200);
		expect(submitForm).toHaveBeenLastCalledWith(
			input.locals.authorizedForm,
			input.locals.contentActor,
			expect.any(FormData)
		);
	});
	it('returns actionable validation errors without accepting the response', async () => {
		vi.mocked(submitForm).mockRejectedValueOnce(new FormValidationError('This form is closed.'));
		const response = await POST(event() as never);
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'This form is closed.' });
	});
});

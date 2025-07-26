import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ cookies }) => {
	cookies.set('userId', '', {
		path: '/'
	});
	redirect(303, '/sign-in');
};

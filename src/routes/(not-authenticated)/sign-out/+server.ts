import { redirect } from '@sveltejs/kit';

export const GET = ({ cookies }) => {
	cookies.delete('userId', {
		path: '/'
	});
	throw redirect(303, '/sign-in');
};

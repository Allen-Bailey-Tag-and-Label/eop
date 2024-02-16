import { dev } from '$app/environment';

export const GET = async ({ cookies }) => {
	cookies.set('session_id', '', {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		maxAge: 1
	});

	return new Response('Redirect', { status: 303, headers: { Location: '/sign-in' } });
};

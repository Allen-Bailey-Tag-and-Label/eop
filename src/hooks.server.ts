import { prisma } from '$lib/prisma';

export const handle = async ({ event, resolve }) => {
  const unauthenticatedPathnames = ['/sign-in'];
  if (!unauthenticatedPathnames.includes(event.url.pathname)) {
    const id = event.cookies.get('session_id');
    if (id === undefined)
      return new Response('Redirect', { status: 303, headers: { Location: '/sign-in' } });
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        roles: true
      }
    });
    if (user === null)
      return new Response('Redirect', { status: 303, headers: { Location: '/sign-in' } });
    delete user.passwordHash;
    event.locals.user = user;
  }
  if (event.url.pathname === '/') {
    return new Response('Redirect', { status: 303, headers: { Location: '/dashboard' } });
  }
  if (event.url.pathname === '/register')
    return new Response('Redirect', { status: 303, headers: { Location: '/sign-in' } });
  const response = await resolve(event);
  return response;
};

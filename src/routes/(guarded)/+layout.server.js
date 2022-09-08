import 'dotenv/config';
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';
import { getUserFromRequest } from '$lib/auth';
import db from '$db';

const getAllRoles = async () => {
  const roles = await db.find({ collection: 'roles' });
  return roles;
};
const getAllRoutes = async () => {
  const routes = await db.find({ collection: 'routes' });
  return routes;
};

export async function load({ request, setHeaders }) {
  try {
    // get user
    const user = await getUserFromRequest(request);

    // update token
    const token = await jwt.sign(user, process.env.JWT_SECRET);

    // update cookie
    setHeaders({
      'Set-Cookie': serialize('token', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7 // one week
      })
    });

    // get all roles and routes
    const [roles, routes] = await Promise.all([getAllRoles(), getAllRoutes()]);

    // get user routes
    user.routes = user.roles.reduce((arr, _roleId) => {
      // find role
      const role = roles.find((currentRole) => currentRole._id.toString() === _roleId.toString());

      // loop through role routes
      role.routes.map((_routeId) => {
        // find route
        const route = routes.find(
          (currentRoute) => currentRoute._id.toString() === _routeId.toString()
        );

        // initiate group
        const title = route?.group ? route.group : '';

        // find group index
        let groupIndex = arr.findIndex((obj) => obj.title === title);

        // check if group is undefined
        if (groupIndex === -1) {
          arr.push({ title, items: [] });
          groupIndex = arr.length - 1;
        }

        // check if group doesn't have route
        if (!arr[groupIndex].items.find((item) => item._id.toString() === route._id.toString()))
          arr[groupIndex].items.push({ _id: route._id, href: route.href, innerHTML: route.name });
      });
      return arr;
    }, []);

    return { user: JSON.parse(JSON.stringify(user)) };
  } catch (error) {
    console.error(error);
    setHeaders({
      'Set-Cookie': serialize('token', '', {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1
      })
    });
    return { status: 401, errors: { message: 'Session expired' } };
  }
}

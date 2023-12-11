export const load = async ({ locals }) => {
  // get user from locals
  const { user } = locals;

  // get nav groups
  const navGroups = user.roles.reduce((navGroups, role) => {
    role.routes.map((route) => {
      if (navGroups?.[route.group] === undefined) navGroups[route.group] = new Set();
      navGroups[route.group].add(route);
    });
    return navGroups;
  }, {});

  return { navGroups, user };
};

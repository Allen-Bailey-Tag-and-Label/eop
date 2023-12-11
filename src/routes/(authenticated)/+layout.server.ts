export const load = async ({ locals }) => {
  // get user from locals
  const { user } = locals;

  // get nav groups
  const navGroups = user.roles.reduce((navGroups, role) => {
    role.routes.map((route) => {
      if (!navGroups.has(route.group)) navGroups.set(route.group, new Map());
      if (!navGroups.get(route.group).has(route.label))
        navGroups.get(route.group).set(route.label, route);
    });
    return navGroups;
  }, new Map());

  return { navGroups, user };
};

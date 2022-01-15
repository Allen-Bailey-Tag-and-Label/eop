<script>
	// imports
	import { onMount } from 'svelte';
	import { twMerge } from 'tailwind-merge';
  import { browser } from '$app/env';
  import { NavGroupTitle, NavItem } from '$components';
	import { navOpen, socket, token } from '$stores';

	// utilities
	const getNavItems = async () => {
		// get routes and roles from db
		let [roles, routes, userRoles] = await Promise.all([getRoles(), getRoutes(), getUserRoles()]);
    
    // convert roles array to obj
    roles = Object.values(roles).reduce((obj, {name, ...role}) => {
      obj[name] = role;
      return obj;
    }, {});

    // loop over userRoles
    userRoles.forEach(userRole => {
      // get routes for role
      const roleRoutes = roles[userRole].routes;

      // loop over roleRoutes
      roleRoutes.forEach(({group = '', href, name}) => {
        // check if group in navItems
        if (!(group in navItems)) navItems[group] = {};

        // check if href in group
        if (!(href in navItems[group])) navItems[group][href] = name;
      })
    })
  };
	const getRoles = async () =>
		await new Promise((res) => {
			// initiate body
			const body = {
				collection: 'roles',
				token: $token
			};

			// emit socket
			$socket.emit('find', body, ({ error, docs }) => {
				res(docs);
			});
		});
	const getRoutes = async () =>
		await new Promise((res) => {
			// initiate body
			const body = {
				collection: 'routes',
				token: $token
			};

			// emit socket
			$socket.emit('find', body, ({ error, docs }) => {
				res(docs);
			});
		});
	const getUserRoles = async () =>
		await new Promise((res) => {
			// initiate body
			const body = {
				token: $token
			};

			// emit socket
			$socket.emit('authRoles', body, ({ error, roles }) => {
				res(roles);
			});
    });
  const sortAlpha = (a, b) => a < b ? -1 : a > b ? 1 : 0;

  // handlers
  const signOutClickHandler = () => {
    $navOpen = !$navOpen;
    token.reset();
  }

	// props (internal)
	const defaultClasses = 'flex flex-col h-full space-y-[2rem] py-[1rem] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary-500 scrollbar-thumb-rounded';
	const navItems = {};

	// props (external)

	// props (dynamic)
	$: classes = twMerge(defaultClasses, $$props.class);
	$: loggedIn = $token !== '';
	$: if (loggedIn && browser) getNavItems();
  // $: if (!loggedIn && browser) destroy();

	// lifecycle
	const lifecycle = {
		destroy: () => {},
		mount: async () => {}
	};
	onMount(async () => {
		await lifecycle.mount();
		return () => {
			lifecycle.destroy();
		};
	});
</script>

<div class={classes}>
  {#each Object.keys(navItems).sort(sortAlpha) as group}
    <div class="flex flex-col">
      {#if group !== ''}
        <NavGroupTitle>{group}</NavGroupTitle>
      {/if}
      {#each Object.keys(navItems[group]).sort(sortAlpha) as href}
        <NavItem {href}>{navItems[group][href]}</NavItem>
      {/each}
    </div>
  {/each}
  <div class="flex flex-col">
    <NavItem clickHandler={signOutClickHandler} href='/signin'>Sign Out</NavItem>
  </div>
</div>
<slot />

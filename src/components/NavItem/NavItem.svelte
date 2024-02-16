<script lang="ts">
import { current_component } from 'svelte/internal';
import { twMerge } from 'tailwind-merge';
import { getEvents } from '$actions';
import { A } from '$components';
import { theme } from '$stores';
import { page } from '$app/stores';

// props (external)
export let href: string = '/';
export let use: any[] = [];

// props (internal)
const events = getEvents(current_component);

// props (dynamic)
$: isCurrent = $page.url.pathname === href;
$: classes = twMerge(
	$theme.navItem,
	isCurrent ? $theme.navItemIsCurrent : undefined,
	$$props.class
);
</script>

<A class={classes} href={href} tabindex={isCurrent ? '-1' : undefined} use={[events, ...use]}
	><slot /></A
>

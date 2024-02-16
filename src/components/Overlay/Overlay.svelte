<script lang="ts">
// imports
import { current_component } from 'svelte/internal';
import { twMerge } from 'tailwind-merge';
import { getEvents } from '$actions';
import { Button } from '$components';
import { theme } from '$stores';

// props (external)
export let style: string | undefined = undefined;
export let use: any[] = [];

// props (internal)
const events = getEvents(current_component);

// props (dynamic)
$: classes = twMerge($theme.overlay, $$props.class);
</script>

<Button {...$$restProps} class={classes} style={style} tabindex="-1" use={[events, ...use]}>
	<slot />
</Button>

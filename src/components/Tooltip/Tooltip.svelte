<script lang="ts">
// imports
import { current_component } from 'svelte/internal';
import { twMerge } from 'tailwind-merge';
import { getEvents } from '$actions';
import { Card } from '$components';
import { theme } from '$stores';

// props (external)
export let position: 'bottom' | 'center' | 'left' | 'right' | 'top' = 'top';
export let style: string | undefined = undefined;
export let tooltip: string = 'Tooltip';
export let use: any[] = [];

// props (internal)
const events = getEvents(current_component);
let positionClasses = '';

// props (dynamic)
$: if (position === 'bottom') {
	positionClasses =
		'bottom-0 translate-y-0 left-1/2 -translate-x-1/2 group-hover/tooltip:translate-y-full';
}
$: if (position === 'center') {
	positionClasses = 'top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2';
}
$: if (position === 'left') {
	positionClasses =
		'left-0 translate-x-0 top-1/2 -translate-y-1/2 group-hover/tooltip:-translate-x-full';
}
$: if (position === 'right') {
	positionClasses =
		'right-0 translate-x-0 top-1/2 -translate-y-1/2 group-hover/tooltip:translate-x-full';
}
$: if (position === 'top') {
	positionClasses =
		'top-0 translate-y-0 left-1/2 -translate-x-1/2 group-hover/tooltip:-translate-y-full';
}
$: classes = twMerge($theme.tooltip, positionClasses, $$props.class);
</script>

<div class="group/tooltip relative">
	<slot />
	<Card class={classes} style={style} use={[events, ...use]}>
		{tooltip}
	</Card>
</div>

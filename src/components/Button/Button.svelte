<script lang="ts">
import { current_component } from 'svelte/internal';
import { Button } from 'sveltewind/components';
import { twMerge } from 'tailwind-merge';
import { getEvents, setType } from '$actions';
import { theme } from '$stores';

// props (external)
export let type = 'button';
export let use: any[] = [];
export let variants: ('delete' | 'icon' | 'outline' | 'sm' | 'transparent' | 'xs')[] = [];

// props (internal)
const events = getEvents(current_component);
</script>

<Button
	{...$$restProps}
	class={twMerge(variants.map((variant) => $theme[`button${variant[0].toUpperCase() + variant.slice(1)}`]), $$props.class)}
	use={[events, [setType, type], ...use]}
>
	<slot />
</Button>

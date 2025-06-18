<script lang="ts">
    import type { Snippet } from 'svelte';

    type Props = { children?: Snippet; class?: string, style?: string };
    let { children, class: className, style, ...restProps }: Props = $props();
</script>

<th class={className} {style} {...restProps}>
    {#if children}
        {@render children()}
    {/if}
</th>
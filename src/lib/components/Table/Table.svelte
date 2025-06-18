<script lang="ts">
    import type { Snippet } from 'svelte';

    type Props = { children?: Snippet; class?: string, style?: string };
    let { children, class: className, style, ...restProps }: Props = $props();
</script>

<table class={className} {style} {...restProps}>
    {#if children}
        {@render children()}
    {/if}
</table>
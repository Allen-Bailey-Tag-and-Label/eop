<script lang="ts">
	import { A, Card } from '../index';
	let card = $state<HTMLDivElement | null>(null);
	let link = $state<HTMLAnchorElement | null>(null);

	export function elements() {
		return { card, link };
	}
</script>

<Card id="bound-card" bind:element={card} />
<A id="bound-link" href="/portal" bind:element={link} />

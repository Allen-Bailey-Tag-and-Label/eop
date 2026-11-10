<script lang="ts">
	import { Card, H2, Div, Input, Checkbox } from '$lib/components';
	import type { ShippingAddress } from '../types';
	let {
		address = $bindable(),
		prefix,
		title
	}: { address: ShippingAddress; prefix: string; title: string } = $props();
</script>

<Card class="space-y-4">
	<H2>{title}</H2>
	<Input
		label="Street address"
		name={`${prefix}.address`}
		bind:value={address.address}
		maxlength={160}
		required
	/>
	<Input label="City" name={`${prefix}.city`} bind:value={address.city} maxlength={80} required />
	<Div class="grid grid-cols-2 gap-4">
		<Input
			label="State"
			name={`${prefix}.state`}
			bind:value={address.state}
			maxlength={2}
			pattern="[A-Za-z]{2}"
			required
		/>
		<Input
			label="ZIP"
			name={`${prefix}.zip`}
			bind:value={address.zip}
			pattern="[0-9]{5}(-[0-9]{4})?"
			required
		/>
	</Div>
	<Checkbox
		label="Residential address"
		name={`${prefix}.residential`}
		bind:checked={address.residential}
	/>
</Card>

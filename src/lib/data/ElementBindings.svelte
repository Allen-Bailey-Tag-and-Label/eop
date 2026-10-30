<script lang="ts">
	import { Div, Input, P, Select } from '$lib/components';
	import { bindableProperties, type BoundProperty } from './bindings';
	import type { DataBinding, SlideElement } from '$lib/slides/types';
	let { element = $bindable(), fields = [] }: { element: SlideElement; fields?: string[] } =
		$props();
	const properties = $derived(
		bindableProperties.filter(
			(property) =>
				(property !== 'assetId' && property !== 'imageOpacity') ||
				element.type === 'image' ||
				element.type === 'svg'
		)
	);
	const labels: Record<BoundProperty, string> = {
		text: 'Text / QR content',
		assetId: 'Image asset ID',
		color: 'Color',
		backgroundColor: 'Background color',
		imageOpacity: 'Image opacity (0–1)',
		visible: 'Visible'
	};
	function update(property: BoundProperty, binding?: DataBinding) {
		const next = { ...element.bindings };
		if (binding) next[property] = binding;
		else delete next[property];
		element.bindings = next;
	}
</script>

<Div class="space-y-3">
	{#each properties as property (property)}
		<Select
			label={labels[property]}
			aria-label={`Bind ${property}`}
			value={element.bindings?.[property]?.field ?? ''}
			options={[
				{ value: '', label: 'Use element property' },
				...fields.map((field) => ({ value: `row.${field}`, label: `row.${field}` }))
			]}
			onchange={(event: Event & { currentTarget: HTMLSelectElement }) =>
				update(
					property,
					event.currentTarget.value
						? { field: event.currentTarget.value, format: 'text', fallback: '' }
						: undefined
				)}
		/>
		{#if element.bindings?.[property]}
			<Input
				label={`${labels[property]} fallback`}
				value={element.bindings[property]!.fallback}
				oninput={(event) =>
					update(property, {
						...element.bindings![property]!,
						fallback: event.currentTarget.value
					})}
			/>
			{#if property === 'text'}<Select
					label="Text format"
					value={element.bindings[property]!.format}
					options={['text', 'date', 'number'].map((value) => ({ value, label: value }))}
					onchange={(event: Event & { currentTarget: HTMLSelectElement }) =>
						update(property, {
							...element.bindings![property]!,
							format: event.currentTarget.value as DataBinding['format']
						})}
				/>{/if}
		{/if}
	{/each}
	<P class="text-xs opacity-60"
		>Images bind uploaded asset IDs. Colors use hex values or transparent. Standalone elements use
		the first output row; repeated elements use their current row.</P
	>
</Div>

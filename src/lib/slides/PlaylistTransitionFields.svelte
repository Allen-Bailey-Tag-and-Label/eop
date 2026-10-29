<script lang="ts">
	import { Div, Input, Select } from '$lib/components';
	import { defaultPlaylistTransition, type PlaylistTransition } from './types';
	let {
		value = $bindable(),
		label = 'Playlist transition',
		inherit = false
	}: {
		value?: PlaylistTransition;
		label?: string;
		inherit?: boolean;
	} = $props();
</script>

<Div class="flex flex-wrap items-end gap-4">
	<Div class="min-w-0 grow basis-48">
		<Select
			{label}
			aria-label={label}
			value={value?.type ?? (inherit ? 'inherit' : 'crossfade')}
			options={[
				...(inherit ? [{ value: 'inherit', label: 'Use playlist default' }] : []),
				{ value: 'crossfade', label: 'Crossfade' },
				{ value: 'none', label: 'None (cut)' }
			]}
			onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
				value =
					event.currentTarget.value === 'inherit'
						? undefined
						: {
								type: event.currentTarget.value as PlaylistTransition['type'],
								durationMs: value?.durationMs ?? defaultPlaylistTransition().durationMs
							};
			}}
		/>
	</Div>
	<Div class="min-w-0 grow basis-48">
		<Input
			label="Transition duration (ms)"
			aria-label={`${label} duration (ms)`}
			type="number"
			min={0}
			max={60000}
			step={100}
			disabled={!value || value.type === 'none'}
			value={String(value?.durationMs ?? 2000)}
			oninput={(event) => {
				if (value) value.durationMs = event.currentTarget.valueAsNumber;
			}}
		/>
	</Div>
</Div>

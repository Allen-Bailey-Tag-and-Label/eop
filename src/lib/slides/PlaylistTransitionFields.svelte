<script lang="ts">
	import { Div, Input, Select } from '$lib/components';
	import { defaultPlaylistTransition, type PlaylistTransition } from './types';
	let {
		value = $bindable(),
		label = 'Playlist transition',
		inherit = false,
		compact = false
	}: {
		value?: PlaylistTransition;
		label?: string;
		inherit?: boolean;
		compact?: boolean;
	} = $props();
</script>

<Div class={compact ? 'contents' : 'flex flex-wrap items-end gap-4'}>
	<Div class={compact ? 'min-w-0' : 'min-w-0 grow basis-48'}>
		<Select
			label={compact ? 'Transition' : label}
			aria-label={label}
			class="w-full min-w-0"
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
	<Div class={compact ? 'min-w-0' : 'min-w-0 grow basis-48'}>
		<Input
			label={compact ? 'Duration (ms)' : 'Transition duration (ms)'}
			aria-label={`${label} duration (ms)`}
			class="w-full min-w-0"
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

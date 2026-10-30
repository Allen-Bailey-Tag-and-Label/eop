<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import { Div, Select, Checkbox } from '$lib/components';
	import type { AudienceSettings, Audience } from '$lib/forms/definition';
	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'onchange'> & {
		value?: AudienceSettings;
		roles?: { value: string; label: string }[];
		publicLabel?: string;
		onChange?: () => void;
		class?: string;
		variants?: string[];
	};
	let {
		value = $bindable({ audience: 'public', roleIds: [] }),
		roles = [],
		publicLabel = 'Public (no login required)',
		onChange = () => {},
		class: className,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<Div
	{...restProps}
	class={twMerge(
		$theme.AudiencePicker.default,
		...variants.map((variant) => $theme.AudiencePicker[variant]),
		className
	)}
>
	<Select
		label="Audience"
		aria-label="Audience"
		value={value.audience}
		options={[
			{ value: 'public', label: publicLabel },
			{ value: 'employees', label: 'Employees (sign-in required)' },
			{ value: 'roles', label: 'Selected roles' }
		]}
		onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
			value = { audience: event.currentTarget.value as Audience, roleIds: value.roleIds };
			onChange();
		}}
	/>
	{#if value.audience === 'roles'}
		<Div class="space-y-2" role="group" aria-label="Allowed roles">
			{#each roles as role (role.value)}<Checkbox
					label={role.label}
					checked={value.roleIds.includes(role.value)}
					onchange={(event: Event & { currentTarget: HTMLInputElement }) => {
						value = {
							...value,
							roleIds: event.currentTarget.checked
								? [...value.roleIds, role.value]
								: value.roleIds.filter((id) => id !== role.value)
						};
						onChange();
					}}
				/>{/each}
		</Div>
	{/if}
</Div>
